import { describe, expect, it } from 'vitest';
import { pathForWorkView, workViewForPath } from '@/him/context/AppContext';
import { ACTIONS_DATA, applyActionCommand, cancelError, dispatchError, requiredApprovals, formatEventTime, minutesUntil, scopedActions, type ActionProposal } from '@/him/data/actionData';
import { DEMO_USERS, SITES_DATA } from '@/him/data/mockData';
import { ALERTS_DATA, TASKS_DATA } from '@/him/data/workData';

const action = ACTIONS_DATA[0] as ActionProposal;
const chief = DEMO_USERS[0] ?? null;
const creator = DEMO_USERS[1] ?? null;
const verifier = chief ? { ...chief, id: 'usr-verifier', name: 'Second approver' } : null; // another operator permitted on every site
const auditor = DEMO_USERS[3] ?? null; // data steward / observer
const scope = action.siteId;
const run = (a: ActionProposal, kind: 'approve' | 'send' | 'uncertain') => applyActionCommand(a, chief, scope, { kind }, new Date().toISOString());

describe('Action approval and journal rules', () => {
  it('rejects approval by the proposal creator', () => {
    expect(creator?.id).toBe(action.creatorId);
    expect(applyActionCommand(action, creator, scope, { kind: 'approve' }, 'now')).toBe(action);
  });
  it('records independent approval and approver identity', () => {
    const approved = run(action, 'approve');
    expect(approved.status).toBe('approved');
    expect(approved.approvedBy).toBe('usr-1');
    expect(approved.history.map(e => e.status)).toEqual(['proposed', 'approved']);
  });
  it('rejects commands outside current scope even for multi-site users', () => {
    const otherScope = SITES_DATA[1]?.id ?? '';
    expect(otherScope).not.toBe(scope);
    expect(applyActionCommand(action, chief, otherScope, { kind: 'approve' }, 'now')).toBe(action);
  });
  it('filters out previous hospital proposals on scope change', () => {
    const nextScope = SITES_DATA[1]?.id ?? '';
    const rows = scopedActions(ACTIONS_DATA, nextScope);
    expect(rows).toHaveLength(5);
    expect(rows.some(a => a.siteId === scope)).toBe(false);
    expect(scopedActions(ACTIONS_DATA, null)).toEqual([]);
  });
  it('does not send unapproved proposals', () => {
    expect(run(action, 'send')).toBe(action);
  });
  it('blocks resending an uncertain action', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    expect(uncertain.status).toBe('uncertain');
    expect(run(uncertain, 'send')).toBe(uncertain);
  });
  it('requires reconciliation reference and note before finalizing', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    expect(applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: '', note: 'checked', outcome: 'confirmed' } }, 'now')).toBe(uncertain);
    expect(applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: 'REC-1', note: '', outcome: 'confirmed' } }, 'now')).toBe(uncertain);
  });
  it('finalizes only with confirmed reconciliation and retains the full journal', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    const finalized = applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: 'REC-1', note: 'destination checked', outcome: 'confirmed' } }, 'now');
    expect(finalized.history.map(e => e.status)).toEqual(['proposed', 'approved', 'sent', 'uncertain', 'finalized']);
    expect(finalized.reconciliation?.reference).toBe('REC-1');
  });
  it('keeps unconfirmed or missing destination records uncertain without re-enabling send', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    for (const outcome of ['pending', 'not_found'] as const) {
      const result = applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: 'REC-2', note: 'review required', outcome } }, 'now');
      expect(result.status).toBe('uncertain');
      expect(run(result, 'send')).toBe(result);
    }
  });
  it('escalates an uncertain action without retry, then finalizes only via verified manual completion', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    expect(applyActionCommand(uncertain, chief, scope, { kind: 'manual', reference: 'M-1', note: 'x' }, 'now')).toBe(uncertain);
    expect(applyActionCommand(uncertain, chief, scope, { kind: 'escalate', note: '' }, 'now')).toBe(uncertain);
    const escalated = applyActionCommand(uncertain, chief, scope, { kind: 'escalate', note: 'no destination record' }, 'now');
    expect(escalated.status).toBe('uncertain');
    expect(escalated.escalatedTo).toBeTruthy();
    expect(run(escalated, 'send')).toBe(escalated);
    const done = applyActionCommand(escalated, verifier, scope, { kind: 'manual', reference: 'M-1', note: 'checked by phone' }, 'now');
    expect(done.status).toBe('finalized');
    expect(done.manualCompletion?.reference).toBe('M-1');
    expect(done.reconciliation).toBeUndefined();
  });
  it('does not let the user who reconciled or referred an action verify its manual completion', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    const reconciled = applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: 'R-1', note: 'not found', outcome: 'not_found' } }, 'now');
    const escalated = applyActionCommand(reconciled, chief, scope, { kind: 'escalate', note: 'manual check' }, 'now');
    expect(applyActionCommand(escalated, chief, scope, { kind: 'manual', reference: 'M-1', note: 'ok' }, 'now')).toBe(escalated);
    expect(applyActionCommand(escalated, verifier, scope, { kind: 'manual', reference: 'M-1', note: 'ok' }, 'now').status).toBe('finalized');
  });
  it('records previous→next state, UTC time and an operation key on every journal event', () => {
    const sent = run(run(action, 'approve'), 'send');
    const [created, approved, dispatched] = sent.history;
    expect(created?.from).toBeNull();
    expect(approved).toMatchObject({ from: 'proposed', status: 'approved' });
    expect(dispatched).toMatchObject({ from: 'approved', status: 'sent', opKey: sent.dispatchKey });
    for (const e of sent.history) {
      expect(e.opKey).toBeTruthy();
      expect(Number.isNaN(Date.parse(e.at))).toBe(false);
    }
    expect(new Set(sent.history.map(e => e.opKey)).size).toBe(sent.history.length);
    expect(formatEventTime('2026-10-17T04:30:00.000Z').utc).toBe('2026-10-17 04:30:00 UTC');
  });
  it('exposes revision and a positive expiry countdown for sample proposals', () => {
    expect(action.revision).toBeGreaterThan(0);
    expect(minutesUntil(action.expiresAtIso)).toBeGreaterThan(0);
    expect(minutesUntil('2000-01-01T00:00:00Z')).toBeLessThanOrEqual(0);
  });
  it('blocks approval after the proposal has expired', () => {
    const expired = { ...action, expiresAtIso: '2000-01-01T00:00:00Z' };
    expect(applyActionCommand(expired, chief, scope, { kind: 'approve' }, 'now')).toBe(expired);
  });
  it('keeps the auditor (data steward) read-only: no approve, dispatch, reconcile, refer or manual completion', () => {
    const approved = run(action, 'approve');
    expect(auditor?.role).toBe('data_steward');
    expect(applyActionCommand(action, auditor, scope, { kind: 'approve' }, 'now')).toBe(action);
    expect(applyActionCommand(approved, auditor, scope, { kind: 'send' }, 'now')).toBe(approved);
    const uncertain = run(run(approved, 'send'), 'uncertain');
    expect(applyActionCommand(uncertain, auditor, scope, { kind: 'reconcile', result: { reference: 'R', note: 'n', outcome: 'confirmed' } }, 'now')).toBe(uncertain);
    expect(applyActionCommand(uncertain, auditor, scope, { kind: 'escalate', note: 'n' }, 'now')).toBe(uncertain);
  });
  it('links each action to the task and alert of its own topic', () => {
    for (const a of ACTIONS_DATA) {
      const task = TASKS_DATA.find(t => t.id === a.taskId);
      const alert = ALERTS_DATA.find(x => x.id === a.alertId);
      expect(task?.siteId).toBe(a.siteId);
      expect(alert?.siteId).toBe(a.siteId);
      expect(task?.alertId).toBe(a.alertId);
      const topic = ['بازتوزیع', 'افزایش سفارش هپارین', 'برنامه اصلاح خطای دارویی', 'کالیبراسیون', 'اصلاح اسناد'][Number(a.alertId.split('-')[2])];
      expect(a.title.startsWith(topic ?? '#')).toBe(true);
      expect(task?.module).toBe(alert?.module);
    }
  });
  it('keeps sample expiry fixed across reloads (no Date.now based extension)', () => {
    expect(ACTIONS_DATA.every(a => a.expiresAtIso.startsWith('2027-03-20'))).toBe(true);
  });
  it('T3 proposals need two distinct independent approvers', () => {
    const t3 = ACTIONS_DATA.find(a => a.tier === 't3' && a.status === 'proposed' && a.creatorId !== chief?.id) as ActionProposal;
    expect(requiredApprovals(t3.tier)).toBe(2);
    const first = applyActionCommand(t3, chief, t3.siteId, { kind: 'approve' }, new Date().toISOString());
    expect(first.status).toBe('proposed');
    expect(first.approvals).toHaveLength(1);
    expect(applyActionCommand(first, chief, t3.siteId, { kind: 'approve' }, new Date().toISOString())).toBe(first);
    const second = applyActionCommand(first, verifier, t3.siteId, { kind: 'approve' }, new Date().toISOString());
    expect(second.status).toBe('approved');
    expect(second.approvals).toHaveLength(2);
  });
  it('cancels only before dispatch and requires a real reason', () => {
    expect(cancelError(action, chief, 'short')).toBeTruthy();
    expect(applyActionCommand(action, chief, scope, { kind: 'cancel', reason: 'short' }, 'now')).toBe(action);
    const canceled = applyActionCommand(action, chief, scope, { kind: 'cancel', reason: 'duplicate of another request' }, 'now');
    expect(canceled.status).toBe('canceled');
    expect(canceled.history.at(-1)).toMatchObject({ from: 'proposed', status: 'canceled' });
    const sent = run(run(action, 'approve'), 'send');
    expect(cancelError(sent, chief, 'a long enough reason')).toMatch(/ممکن است اقدام پیش‌تر اجرا شده/);
    expect(applyActionCommand(sent, chief, scope, { kind: 'cancel', reason: 'a long enough reason' }, 'now')).toBe(sent);
  });
  it('mirrors the visible action view in the browser path', () => {
    expect(pathForWorkView({ kind: 'proposals' })).toBe('/actions');
    expect(pathForWorkView({ kind: 'proposal', id: 'ap-1-2' })).toBe('/actions/ap-1-2');
    expect(pathForWorkView({ kind: 'approvals' })).toBe('/approvals');
    expect(pathForWorkView({ kind: 'journal' })).toBe('/journal');
    expect(pathForWorkView(null)).toBe('/');
  });
  it('reads the same views back from the browser path', () => {
    for (const v of [{ kind: 'proposals' }, { kind: 'proposal', id: 'ap-1-2' }, { kind: 'approvals' }, { kind: 'journal' }] as const) {
      expect(workViewForPath(pathForWorkView(v))).toEqual(v);
    }
    expect(workViewForPath('/')).toBeNull();
  });
  it('keeps the heparin impact consistent with its before/after diff', () => {
    const heparin = ACTIONS_DATA.filter(a => a.target === 'سامانه انبار');
    expect(heparin.length).toBeGreaterThan(0);
    for (const a of heparin) {
      const [before, after] = [a.diff[0]?.before, a.diff[0]?.after].map(v => Number(String(v).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '')));
      expect(after! - before!).toBeGreaterThan(0);
      expect(a.impact).toContain((after! - before!).toLocaleString('fa-IR'));
    }
  });
  it('shows both approvals for a T3 proposal that is already approved, and dispatches only then', () => {
    const t3 = ACTIONS_DATA.find(a => a.tier === 't3' && a.status === 'approved') as ActionProposal;
    expect(t3.approvals).toHaveLength(2);
    expect(new Set(t3.approvals.map(a => a.userId)).size).toBe(2);
    expect(t3.history.filter(e => e.note.includes('تأیید')).length).toBeGreaterThanOrEqual(2);
    expect(dispatchError(t3)).toBeNull();
    const oneApproval = { ...t3, approvals: t3.approvals.slice(0, 1) };
    expect(dispatchError(oneApproval)).toBeTruthy();
    expect(applyActionCommand(oneApproval, chief, t3.siteId, { kind: 'send' }, new Date().toISOString())).toBe(oneApproval);
    expect(applyActionCommand(t3, chief, t3.siteId, { kind: 'send' }, new Date().toISOString()).status).toBe('sent');
  });
  it('records a confirmed failure as a conclusive reconciliation outcome', () => {
    const uncertain = run(run(run(action, 'approve'), 'send'), 'uncertain');
    const failed = applyActionCommand(uncertain, chief, scope, { kind: 'reconcile', result: { reference: 'REC-F', note: 'destination reports rejection', outcome: 'failed_confirmed' } }, new Date().toISOString());
    expect(failed.status).toBe('finalized');
    expect(failed.reconciliation?.outcome).toBe('failed_confirmed');
  });
  it('maps task, alert and notification views to their own paths', () => {
    for (const v of [{ kind: 'tasks' }, { kind: 'task', id: 'tk-0-1' }, { kind: 'alerts' }, { kind: 'alert', id: 'al-0-1' }, { kind: 'notifications' }] as const) {
      expect(pathForWorkView(v)).not.toBe('/');
      expect(workViewForPath(pathForWorkView(v))).toEqual(v);
    }
    expect(workViewForPath('/unknown')).toBeNull();
  });
});
