import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES_DATA } from '@/him/data/mockData';
import { answerQuestion, evidenceSnapshotId } from '@/him/data/copilotData';
import { occupancyLineage, withinDepth } from '@/him/data/lineageData';
import {
  claimsFixture, contribution, denialRates, forecast, forecastHistory, payloadHash, SERVICE_LINES, sourceTotals, totalsByCurrency,
} from '@/him/finance/financeData';
import { memoMissingFields } from '@/him/phase6/MemoReviewPanel';
import { freshMemo } from '@/him/phase6/store';

// Regressions for QA review of deployment 70291131 (2026-11-04).
const [tal, imam] = [SITES_DATA[0]!.id, SITES_DATA[1]!.id];
const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('Copilot (REQ-EXE-001, AIM-010, AIM-011, EXE-008)', () => {
  it('defaults to the last complete local day and answers from the daily snapshot with disclosure', () => {
    expect(src('src/him/context/useCopilotState.ts')).toContain("range: 'آخرین روز کامل'");
    const a = answerQuestion('اشغال تخت چقدر است؟', tal, [tal], '2026-11-04T08:00:00Z', { range: 'آخرین روز کامل', language: 'fa' });
    expect(a.status).toBe('partial');
    expect(a.reasonCodes).toContain('source_stale');
    expect(a.evidence[0]!.numerator).toBe(80);
    expect(a.evidence[0]!.denominator).toBe(100);
    expect(a.limitations.some(l => l.includes('پیش‌فرض'))).toBe(true);
  });
  it('gives every answer a stable evidence snapshot id for export', () => {
    const a = answerQuestion('اشغال تخت چقدر است؟', tal, [tal], '2026-11-04T08:00:00Z', { range: 'امروز', language: 'fa' });
    expect(evidenceSnapshotId(a)).toMatch(/^EVS-[0-9a-f]+$/);
    expect(evidenceSnapshotId(a)).toBe(evidenceSnapshotId(a));
  });
  it('opens a historical answer link once and lets a new question replace it', () => {
    const s = src('src/him/components/CopilotView.tsx');
    expect(s).toContain('appliedAnswerLink.current===workView.answerId');
    expect(s).toContain('data-testid="submit-feedback"');
    expect(s).toContain('شناسه اجرا (run)');
  });
});

describe('Decision memo review (REQ-EXE-006)', () => {
  it('lists missing review fields and rejects a past due date', () => {
    const m = freshMemo(tal, 'x', 'y');
    expect(memoMissingFields(m)).toContain('موعد پیشنهادی');
    expect(memoMissingFields({ ...m, dueDate: '2020-01-01' })).toContain('موعد پیشنهادی معتبر (امروز یا آینده)');
  });
});

describe('Lineage (REQ-DAT-006)', () => {
  it('traces the occupancy result to snapshots, transforms, ingestion jobs and sources', () => {
    const g = occupancyLineage(tal, [tal])!;
    const kinds = new Set(g.nodes.map(n => n.kind));
    for (const k of ['source', 'contract', 'ingestion', 'mapping', 'snapshot', 'transform', 'metric', 'result', 'consumer']) expect(kinds.has(k as never)).toBe(true);
    expect(g.nodes.some(n => n.id.startsWith('SNAP-BED-'))).toBe(true);
    expect(g.nodes.some(n => n.id.startsWith('SNAP-ENC-'))).toBe(true);
  });
  it('never discloses other sites to a site-restricted user', () => {
    const restricted = occupancyLineage(tal, [tal])!;
    expect(restricted.nodes.every(n => n.siteId === tal)).toBe(true);
    const network = occupancyLineage(tal, [tal, imam])!;
    expect(network.nodes.some(n => n.siteId === imam)).toBe(true);
    expect(occupancyLineage(imam, [tal])).toBeNull();
  });
  it('limits the drill-down depth', () => {
    const g = occupancyLineage(tal, [tal])!;
    expect(withinDepth(g, 1).nodes.length).toBeLessThan(g.nodes.length);
  });
});

describe('Finance acceptance examples (REQ-FIN-001..007)', () => {
  it('FIN-001: separate currency totals and a −1,000 IRR unreconciled difference', () => {
    const t = totalsByCurrency(sourceTotals('1405-07'), null).byCurrency;
    expect(t.map(x => x.currency)).toEqual(['IRR', 'USD']);
    expect(t.find(x => x.currency === 'IRR')!.difference).toBe(-1000);
  });
  it('FIN-002: 30% claim incidence, 12% amount rate, re-import does not double count', () => {
    const c = claimsFixture('TAL');
    const r = denialRates(c);
    expect(r.incidence).toBe(0.3);
    expect(r.amountRate).toBe(0.12);
    expect(denialRates([...c, ...c]).incidence).toBe(0.3);
    expect(denialRates([...c, ...c]).denied).toBe(120);
  });
  it('FIN-003: contribution 400 / margin 40%; zero revenue gives an undefined margin', () => {
    expect(contribution(SERVICE_LINES[0]!, 200)).toMatchObject({ contribution: 400, margin: 0.4 });
    expect(contribution(SERVICE_LINES[3]!, 10).margin).toBeNull();
    expect(contribution(SERVICE_LINES[2]!, 10).status).toBe('missing_input');
  });
  it('FIN-004: insufficient history returns INSUFFICIENT_HISTORY instead of intervals', () => {
    expect(forecast(forecastHistory('receipts', true), 7, 0).status).toBe('INSUFFICIENT_HISTORY');
    const ok = forecast(forecastHistory('receipts'), 7, 0);
    expect(ok.status).toBe('OK');
  });
  it('FIN-007: changing 100 to 101 changes the payload hash (approval invalidated)', () => {
    const p = { type: 'payment' as const, target: 'x', amount: 100, currency: 'IRR' as const, evidence: ['e'], note: '' };
    expect(payloadHash(p)).not.toBe(payloadHash({ ...p, amount: 101 }));
    expect(payloadHash(p)).toBe(payloadHash({ ...p }));
  });
});
