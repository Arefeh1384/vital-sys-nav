import { useEffect, useRef, useState } from 'react';
import { answerQuestion, appendTurn, jobStateForRun, questionError, RUN_DEADLINE_MS, runStateForAnswer, validateAnswer, type CopilotTurn } from '../data/copilotData';
import type { User } from '../types';

export interface CopilotContext { purpose: string; language: 'fa' | 'en'; range: string; attachmentIds: string[] }
const DEFAULT_CONTEXT: CopilotContext = { purpose: 'مدیریت عملیات', language: 'fa', range: 'امروز', attachmentIds: [] };
const ACTIVE_STATES = ['queued', 'running', 'validating'];
function readTurns(): CopilotTurn[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem('him.copilot.v1') ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((t): t is CopilotTurn => !!t && typeof t.id === 'string' && typeof t.question === 'string' && typeof t.siteId === 'string' && typeof t.idempotencyKey === 'string')
      .map(t => ACTIVE_STATES.includes(t.state) ? { ...t, state: 'canceled', jobState: 'canceling' } : t);
  } catch { return []; }
}
export function useCopilotState(user: User | null, siteId: string | null) {
  const [turns, setTurns] = useState<CopilotTurn[]>(readTurns);
  const turnsRef = useRef(turns);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [context, setContext] = useState<CopilotContext>(DEFAULT_CONTEXT);
  const [contextChanged, setContextChanged] = useState(false);
  const [scopeMessage, setScopeMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const activeRef = useRef<{ id: string; siteId: string; userId: string; timers: ReturnType<typeof setTimeout>[] } | null>(null);
  const identityRef = useRef({ userId: user?.id, siteId, permissions: user?.permittedSiteIds.join(',') });
  const commit = (fn: (prev: CopilotTurn[]) => CopilotTurn[]) => { const next = fn(turnsRef.current); turnsRef.current = next; setTurns(next); };
  const cancel = () => {
    const active = activeRef.current;
    if (!active) return;
    active.timers.forEach(clearTimeout); activeRef.current = null;
    commit(prev => prev.map(t => t.id === active.id ? { ...t, state: 'canceled', jobState: 'canceling' } : t));
  };
  useEffect(() => { try { localStorage.setItem('him.copilot.v1', JSON.stringify(turns)); } catch { /* Storage is optional. */ } }, [turns]);
  useEffect(() => {
    const previous = identityRef.current;
    const permissions = user?.permittedSiteIds.join(',');
    if (previous.userId !== user?.id || previous.siteId !== siteId || previous.permissions !== permissions) {
      cancel(); setSelectedId(null); setDraft(''); setContext(c => ({ ...c, attachmentIds: [] })); setContextChanged(true); setScopeMessage('دامنه تغییر کرد');
      if (previous.permissions !== permissions || previous.userId !== user?.id) {
        commit(prev => prev.map(t => {
          if (t.userId && user?.id && t.userId !== user.id) return t;
          if (!t.answer && !t.originalAnswer) return t;
          if (user?.permittedSiteIds.includes(t.siteId)) {
            const restored = t.originalAnswer ?? (!t.answer?.scopeRedacted ? t.answer : answerQuestion(t.question, t.siteId, user.permittedSiteIds, t.at, { range: t.context?.range, language: t.language }));
            return {
              ...t,
              answer: restored,
              originalAnswer: t.originalAnswer ?? restored,
            };
          }
          const raw = t.originalAnswer ?? t.answer!;
          return {
            ...t,
            originalAnswer: raw,
            answer: validateAnswer({ ...raw, evidence: raw.evidence.map(e => ({ ...e, revoked: true })) }),
          };
        }));
      }
    }
    identityRef.current = { userId: user?.id, siteId, permissions };
  }, [user?.id, siteId, user?.permittedSiteIds.join(',')]);
  useEffect(() => () => { activeRef.current?.timers.forEach(clearTimeout); }, []);
  const changeContext = (patch: Partial<CopilotContext>) => { setContext(c => ({ ...c, ...patch })); setContextChanged(true); };
  const submit = (question: string, key?: string) => {
    const validation = questionError(question); setError(validation);
    if (validation || !siteId || !user || !user.permittedSiteIds.includes(siteId)) return false;
    const at = new Date().toISOString();
    const idempotencyKey = key ?? `${user.id}-${siteId}-${at}-${turnsRef.current.length}`;
    if (turnsRef.current.some(t => t.idempotencyKey === idempotencyKey) || activeRef.current) return false;
    const id = `turn-${idempotencyKey}`;
    const turn: CopilotTurn = { id, siteId, userId: user.id, question: question.trim(), at, language: context.language, state: 'queued', jobState: 'queued', idempotencyKey, context: { purpose: context.purpose, range: context.range, attachmentIds: [...context.attachmentIds] } };
    commit(prev => appendTurn(prev, turn)); setSelectedId(id); setDraft(''); setContextChanged(false); setScopeMessage('');
    const active = { id, siteId, userId: user.id, timers: [] as ReturnType<typeof setTimeout>[] }; activeRef.current = active;
    const update = (state: CopilotTurn['state']) => { if (activeRef.current !== active) return; commit(prev => prev.map(t => t.id === id ? { ...t, state, jobState: jobStateForRun(state) } : t)); };
    active.timers.push(setTimeout(() => update('running'), 350), setTimeout(() => update('validating'), 850));
    active.timers.push(setTimeout(() => {
      if (activeRef.current !== active) return;
      const identity = identityRef.current;
      if (identity.siteId !== siteId || identity.userId !== user.id) { cancel(); return; }
      if (simulateFailure) update('failed');
      else {
        const answer = answerQuestion(question, siteId, user.permittedSiteIds, at, { range: context.range, language: context.language });
        const state = runStateForAnswer(answer.status);
        const artifact = { ...answer, runId: id };
        commit(prev => prev.map(t => t.id === id ? { ...t, state, jobState: jobStateForRun(state), answer: artifact, originalAnswer: artifact } : t));
      }
      active.timers.forEach(clearTimeout); activeRef.current = null;
    }, 1450));
    active.timers.push(setTimeout(() => { update('timed_out'); active.timers.forEach(clearTimeout); activeRef.current = null; }, RUN_DEADLINE_MS));
    return true;
  };
  const visibleTurns = user && siteId && user.permittedSiteIds.includes(siteId) ? turns.filter(t => t.siteId === siteId && (!t.userId || t.userId === user.id)) : [];
  const selectedRaw = visibleTurns.find(t => t.id === selectedId);
  const selected = (selectedRaw && user && user.permittedSiteIds.includes(selectedRaw.siteId) && selectedRaw.answer?.scopeRedacted)
    ? {
        ...selectedRaw,
        answer: selectedRaw.originalAnswer ?? answerQuestion(selectedRaw.question, selectedRaw.siteId, user.permittedSiteIds, selectedRaw.at, { range: selectedRaw.context?.range, language: selectedRaw.language }),
      }
    : selectedRaw;
  const running = visibleTurns.find(t => ACTIVE_STATES.includes(t.state));
  const newConversation = () => { if (activeRef.current) return; setSelectedId(null); setDraft(''); setError(null); };
  const feedback = (id: string, patch: Partial<NonNullable<CopilotTurn['feedback']>>) => commit(prev => prev.map(t => t.id === id ? { ...t, feedback: { helpful: null, errorType: '', text: '', ...t.feedback, ...patch } } : t));
  return { turns: visibleTurns, selected, running, selectTurn: setSelectedId, context, changeContext, contextChanged, scopeMessage,
    draft, setDraft, error, submit, cancel, newConversation, simulateFailure, setSimulateFailure, feedback };
}
