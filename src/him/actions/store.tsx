import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ACTIONS_SEED, DEMO_USERS, DEMO_SITES,
  approveAction, rejectAction, cancelAction, resumeHeldAction,
  startReconciliation, recordReconciliation, assignManualExecution, verifyManualExecution,
  type ActionProposal, type DemoUser, type CommandResult,
} from './data';

const STORE_KEY = 'him.actions2.v1';
const USER_KEY = 'him.actions2.user.v1';
const SITE_KEY = 'him.actions2.site.v1';
const AUTH_KEY = 'him.actions2.stepup.v1';

function loadActions(): ActionProposal[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return ACTIONS_SEED;
    const saved = JSON.parse(raw) as ActionProposal[];
    const byId = new Map(saved.map(a => [a.id, a]));
    // Merge by id so approvals/journal survive a full refresh; new seed items still appear.
    return ACTIONS_SEED.map(seed => byId.get(seed.id) ?? seed);
  } catch { return ACTIONS_SEED; }
}

interface ActionsStore {
  actions: ActionProposal[];
  currentUser: DemoUser;
  siteId: string;
  users: DemoUser[];
  sites: typeof DEMO_SITES;
  setCurrentUser: (id: string) => void;
  setSiteId: (id: string) => void;
  lastStepUpAt: number | null;
  markStepUp: () => void;
  needsStepUp: boolean;
  dispatch: (id: string, fn: (a: ActionProposal, u: DemoUser) => CommandResult) => CommandResult;
  resetDemo: () => void;
}

const Ctx = createContext<ActionsStore | null>(null);

export function ActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<ActionProposal[]>(loadActions);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try { return window.localStorage.getItem(USER_KEY) ?? DEMO_USERS[1]!.id; } catch { return DEMO_USERS[1]!.id; }
  });
  const [siteId, setSiteIdState] = useState<string>(() => {
    try { return window.localStorage.getItem(SITE_KEY) ?? DEMO_SITES[0]!.id; } catch { return DEMO_SITES[0]!.id; }
  });
  const [lastStepUpAt, setLastStepUpAt] = useState<number | null>(() => {
    try { const v = window.localStorage.getItem(AUTH_KEY); return v ? Number(v) : null; } catch { return null; }
  });

  useEffect(() => { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(actions)); } catch { /* ignore */ } }, [actions]);
  useEffect(() => { try { window.localStorage.setItem(USER_KEY, currentUserId); } catch { /* ignore */ } }, [currentUserId]);
  useEffect(() => { try { window.localStorage.setItem(SITE_KEY, siteId); } catch { /* ignore */ } }, [siteId]);

  const currentUser = useMemo(() => DEMO_USERS.find(u => u.id === currentUserId) ?? DEMO_USERS[1]!, [currentUserId]);
  const needsStepUp = lastStepUpAt === null || Date.now() - lastStepUpAt > 5 * 60 * 1000;

  const dispatch = (id: string, fn: (a: ActionProposal, u: DemoUser) => CommandResult): CommandResult => {
    const current = actions.find(a => a.id === id);
    if (!current) return { ok: false, error: 'پیشنهاد یافت نشد.' };
    const result = fn(current, currentUser);
    if (result.ok) setActions(prev => prev.map(a => a.id === id ? result.next : a));
    return result;
  };

  const value: ActionsStore = {
    actions, currentUser, siteId, users: DEMO_USERS, sites: DEMO_SITES,
    setCurrentUser: setCurrentUserId,
    setSiteId: (id) => setSiteIdState(id),
    lastStepUpAt,
    markStepUp: () => { const now = Date.now(); setLastStepUpAt(now); try { window.localStorage.setItem(AUTH_KEY, String(now)); } catch { /* ignore */ } },
    needsStepUp,
    dispatch,
    resetDemo: () => { setActions(ACTIONS_SEED); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActions(): ActionsStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActions must be used within ActionsProvider');
  return ctx;
}

export {
  approveAction, rejectAction, cancelAction, resumeHeldAction,
  startReconciliation, recordReconciliation, assignManualExecution, verifyManualExecution,
};
