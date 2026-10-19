import { describe, expect, it } from 'vitest';
import { pathForWorkView, workViewForPath } from '@/him/context/AppContext';
import {
  MAX_QUESTION_LENGTH, SUGGESTIONS, answerQuestion, appendTurn, evidenceForDisplay, jobStateForRun, metricResult, questionError, runStateForAnswer, validateAnswer,
  type AnswerArtifact, type CopilotTurn,
} from '@/him/data/copilotData';
import { DEMO_USERS, SITES_DATA } from '@/him/data/mockData';
import { TASKS_DATA } from '@/him/data/workData';

const [taleghani, imam, , , hq] = SITES_DATA;
const ALL = SITES_DATA.map(s => s.id);
const NOW = '2026-10-19T10:00:00.000Z';
const ask = (q: string, siteId = taleghani!.id, permitted = ALL) => answerQuestion(q, siteId, permitted, NOW);
const turn = (key: string): CopilotTurn => ({ id: `turn-${key}`, siteId: taleghani!.id, question: 'q', at: NOW, language: 'fa', state: 'queued', jobState: 'queued', idempotencyKey: key });

describe('Copilot grounded answers', () => {
  it('shows all four statuses for the suggested questions', () => {
    const statuses = new Set(SUGGESTIONS.map(q => ask(q).status));
    for (const s of ['answered', 'partial', 'clarification_required', 'abstained'] as const) expect(statuses.has(s)).toBe(true);
  });
  it('answers occupancy from the approved metric with numerator, denominator, version and as-of', () => {
    const a = ask('اشغال تخت بیمارستان فعلی چقدر است؟');
    expect(a.status).toBe('answered');
    const calc = a.evidence.find(e => e.kind === 'computed');
    expect(calc).toMatchObject({ numerator: 80, denominator: 100, metricVersion: 'occ-v2' });
    expect(a.blocks[0]?.text).toContain('۸۰');
    expect(a.dataAsOf).toBeTruthy();
  });
  it('never reads a zero denominator as 0%', () => {
    expect(metricResult(0, 0)).toEqual({ status: 'not_computable' });
    expect(metricResult(80, 100)).toEqual({ status: 'computed', value: 80 });
    const a = ask('اشغال تخت چقدر است؟', hq!.id);
    expect(a.status).toBe('partial');
    expect(a.blocks[0]?.text).toContain('قابل محاسبه نیست');
    expect(a.blocks[0]?.text).not.toContain('۰٪');
  });
  it('abstains with no evidence, no invented rule and no confidence figure', () => {
    const a = ask('سیاست مرخصی استعلاجی چیست؟');
    expect(a.status).toBe('abstained');
    expect(a.reasonCodes).toContain('missing_evidence');
    expect(a.evidence).toHaveLength(0);
    expect(a.blocks).toHaveLength(0);
    expect(JSON.stringify(a)).not.toMatch(/confidence|اطمینان/);
  });
  it('asks a clarifying question and gives no answer text', () => {
    const a = ask('وضعیت چطوره؟');
    expect(a.status).toBe('clarification_required');
    expect(a.clarification?.options.length).toBeGreaterThan(1);
    expect(a.blocks).toHaveLength(0);
    for (const o of a.clarification!.options) expect(ask(o).status).not.toBe('clarification_required');
    expect(ask('نرخ رضایت از غذا چقدر است؟').reasonCodes).toContain('unsupported_task');
  });
  it('discloses conflicting policies and links both without a merged policy', () => {
    const a = ask('سیاست اضافه‌کار چیست؟');
    expect(a.status).toBe('partial');
    expect(a.reasonCodes).toContain('conflicting_evidence');
    expect(a.conflict).toBeTruthy();
    expect(a.evidence).toHaveLength(2);
    expect(a.blocks[0]?.text).toContain('هیچ سیاست ترکیبی');
  });
  it('separates retrieved fact, computed impact and hypothesis for heparin', () => {
    const a = ask('وضعیت سفارش هپارین چیست؟');
    expect(a.status).toBe('partial');
    expect(new Set(a.evidence.map(e => e.kind))).toEqual(new Set(['retrieved', 'computed', 'hypothesis']));
    expect(a.evidence.find(e => e.kind === 'computed')?.value).toBe('۱۸۰ ویال');
    expect(a.evidence.find(e => e.kind === 'hypothesis')?.excerpt).toContain('اثبات نشده');
    expect(a.relatedActionIds).toHaveLength(1);
  });
  it('flags stale data', () => {
    const a = ask('گزارش هفته‌ی قبل تخت‌های ICU');
    expect(a.reasonCodes).toContain('source_stale');
    expect(a.evidence[0]?.freshness).toBe('stale');
  });
  it('refuses to approve or dispatch actions', () => {
    const a = ask('اقدام را تأیید کن');
    expect(a.status).toBe('abstained');
    expect(a.reasonCodes).toContain('unsupported_task');
  });
  it('leaks nothing about another hospital', () => {
    const a = ask('اشغال تخت بیمارستان امام حسین چقدر است؟');
    expect(a.status).toBe('abstained');
    expect(a.reasonCodes).toEqual(['scope_not_authorized']);
    expect(a.evidence).toHaveLength(0);
    expect(JSON.stringify(a)).not.toMatch(/امام حسین/);
    expect(ask('اشغال تخت', imam!.id, [taleghani!.id]).reasonCodes).toEqual(['scope_not_authorized']);
  });
  it('is deterministic for the same inputs', () => {
    expect(ask('اشغال تخت')).toEqual(ask('اشغال تخت'));
  });
  it('turns an unsupported citation into a safe abstention', () => {
    const a = ask('اشغال تخت');
    const bad: AnswerArtifact = { ...a, blocks: [{ text: 'x', evidenceIds: ['missing'] }] };
    const checked = validateAnswer(bad);
    expect(checked.status).toBe('abstained');
    expect(checked.reasonCodes).toEqual(['validation_failed']);
    expect(checked.evidence).toHaveLength(0);
  });
  it('drops revoked evidence and its dependent text without leaking the title', () => {
    const a = ask('وضعیت سفارش هپارین چیست؟');
    const target = a.evidence[0]!;
    const checked = validateAnswer({ ...a, evidence: a.evidence.map(e => e.id === target.id ? { ...e, revoked: true } : e) });
    const shown = checked.evidence.find(e => e.id === target.id)!;
    expect(shown.revoked).toBe(true);
    expect(JSON.stringify(checked)).not.toContain(target.title);
    expect(checked.blocks.length).toBeLessThan(a.blocks.length);
    expect(evidenceForDisplay({ ...target, revoked: true }).excerpt).toBe('');
  });
  it('abstains generically on external hospital requests such as Shariati without returning current hospital values', () => {
    const a = ask('اشغال تخت بیمارستان شریعتی چقدر است؟');
    expect(a.status).toBe('abstained');
    expect(a.reasonCodes).toEqual(['scope_not_authorized']);
    expect(a.evidence).toHaveLength(0);
    expect(a.blocks).toHaveLength(0);
    expect(JSON.stringify(a)).not.toContain('۸۰');
  });
  it('links overtime conflict policy source to overtime policy task rather than unrelated access review task', () => {
    const a = ask('سیاست اضافه‌کار و مأموریت چیست؟');
    expect(a.status).toBe('partial');
    expect(a.conflict?.linkA).toBeTruthy();
    expect(a.conflict?.titleA).toContain('سیاست اضافه‌کار — نسخه الف');
    const taskA = TASKS_DATA.find(t => t.id === a.conflict?.linkA?.id);
    expect(taskA).toBeTruthy();
    expect(taskA?.title).toContain('سیاست اضافه‌کار — نسخه الف');
    expect(taskA?.description).toContain('نسخه الف: اضافه‌کار');
    expect(taskA?.title).not.toContain('تأیید فصلی دسترسی کاربران');
  });
  it('labels week-old stale ICU report with historical source date and does not label it as today', () => {
    const a = ask('گزارش هفته‌ی قبل تخت‌های ICU');
    expect(a.reasonCodes).toContain('source_stale');
    expect(a.blocks[0]?.text).toContain('۲۰۲۶-۱۰-۱۲');
    expect(a.blocks[0]?.text).not.toContain('امروز');
  });
});

describe('Copilot turns, states and routing', () => {
  it('limits a question to 1–16000 characters', () => {
    expect(questionError('  ')).toBeTruthy();
    expect(questionError('x'.repeat(MAX_QUESTION_LENGTH + 1))).toBeTruthy();
    expect(questionError('x'.repeat(MAX_QUESTION_LENGTH))).toBeNull();
  });
  it('does not create a second turn for the same idempotency key', () => {
    const once = appendTurn([], turn('k1'));
    expect(appendTurn(once, turn('k1'))).toHaveLength(1);
    expect(appendTurn(once, turn('k2'))).toHaveLength(2);
  });
  it('maps answer and run states; abstention is a succeeded job', () => {
    expect(runStateForAnswer('abstained')).toBe('abstained');
    expect(jobStateForRun('abstained')).toBe('succeeded');
    expect(jobStateForRun('awaiting_input')).toBe('succeeded');
    expect(jobStateForRun('completed_partial')).toBe('succeeded');
    expect(jobStateForRun('timed_out')).toBe('failed');
    expect(jobStateForRun('running')).toBe('running');
  });
  it('maps /copilot to its own work view and back', () => {
    expect(pathForWorkView({ kind: 'copilot' })).toBe('/copilot');
    expect(workViewForPath('/copilot')).toEqual({ kind: 'copilot' });
  });
  it('has demo users to check read-only export (data steward)', () => {
    expect(DEMO_USERS.some(u => u.role === 'data_steward')).toBe(true);
  });
});
