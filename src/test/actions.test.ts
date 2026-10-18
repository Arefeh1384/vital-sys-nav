import { describe, expect, it } from 'vitest';
import { ACTIONS_DATA, applyActionCommand, formatEventTime, minutesUntil, scopedActions, type ActionProposal } from '@/him/data/actionData';
import { DEMO_USERS, SITES_DATA } from '@/him/data/mockData';

const action = ACTIONS_DATA[0] as ActionProposal;
const chief = DEMO_USERS[0] ?? null;
const creator = DEMO_USERS[1] ?? null;
const verifier = DEMO_USERS[3] ?? null; // data steward, permitted on every site
const scope = action.siteId;
const run = (a: ActionProposal, kind: 'approve' | 'send' | 'uncertain') => applyActionCommand(a, chief, scope, { kind }, 'now');

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
});
