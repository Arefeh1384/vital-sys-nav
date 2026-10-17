import { describe, expect, it } from 'vitest';
import { ACTIONS_DATA, applyActionCommand, scopedActions, type ActionProposal } from '@/him/data/actionData';
import { DEMO_USERS, SITES_DATA } from '@/him/data/mockData';

const action = ACTIONS_DATA[0] as ActionProposal;
const chief = DEMO_USERS[0] ?? null;
const creator = DEMO_USERS[1] ?? null;
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
    const done = applyActionCommand(escalated, chief, scope, { kind: 'manual', reference: 'M-1', note: 'checked by phone' }, 'now');
    expect(done.status).toBe('finalized');
    expect(done.manualCompletion?.reference).toBe('M-1');
    expect(done.reconciliation).toBeUndefined();
  });
});
