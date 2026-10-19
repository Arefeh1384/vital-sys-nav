import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Scope, ModuleKey, ViewState, Site } from '../types';
import { CURRENT_ORGANIZATION, SITES_DATA, DEMO_USERS } from '../data/mockData';
import { TASKS_DATA, ALERTS_DATA, type WorkTask, type WorkAlert, type TaskStatus, type AlertStatus } from '../data/workData';
import { ACTIONS_DATA, applyActionCommand, type ActionProposal, type ActionCommand } from '../data/actionData';
import { useCopilotState } from './useCopilotState';

export type WorkView = { kind: 'copilot' } | { kind: 'tasks' } | { kind: 'task'; id: string } | { kind: 'alerts' } | { kind: 'alert'; id: string } | { kind: 'notifications' } | { kind: 'proposals' } | { kind: 'approvals' } | { kind: 'proposal'; id: string } | { kind: 'journal' };

/** Browser path that mirrors the visible work view, so refresh and direct links land on the same page. */
export function pathForWorkView(v: WorkView | null): string {
  if (!v) return '/';
  if (v.kind === 'copilot') return '/copilot';
  if (v.kind === 'proposals') return '/actions';
  if (v.kind === 'proposal') return `/actions/${encodeURIComponent(v.id)}`;
  if (v.kind === 'approvals') return '/approvals';
  if (v.kind === 'journal') return '/journal';
  if (v.kind === 'tasks') return '/tasks';
  if (v.kind === 'task') return `/tasks/${encodeURIComponent(v.id)}`;
  if (v.kind === 'alerts') return '/alerts';
  if (v.kind === 'alert') return `/alerts/${encodeURIComponent(v.id)}`;
  if (v.kind === 'notifications') return '/notifications';
  return '/';
}

/** Inverse of pathForWorkView: the work view a browser path stands for (null = dashboard). */
export function workViewForPath(path: string): WorkView | null {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/copilot') return { kind: 'copilot' };
  if (p === '/actions') return { kind: 'proposals' };
  if (p === '/approvals') return { kind: 'approvals' };
  if (p === '/journal') return { kind: 'journal' };
  if (p === '/tasks') return { kind: 'tasks' };
  if (p === '/alerts') return { kind: 'alerts' };
  if (p === '/notifications') return { kind: 'notifications' };
  const m = /^\/(actions|tasks|alerts)\/([^/]+)$/.exec(p);
  if (!m) return null;
  let id: string;
  if (!m[2]) return null;
  try { id = decodeURIComponent(m[2]); } catch { return null; }
  return m[1] === 'actions' ? { kind: 'proposal', id } : m[1] === 'tasks' ? { kind: 'task', id } : { kind: 'alert', id };
}

const SESSION_KEY = 'him.session.v1';
function readSession(): { userId: string | null; siteId: string | null } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) : null;
    return raw ? (JSON.parse(raw) as { userId: string | null; siteId: string | null }) : null;
  } catch { return null; }
}

export interface AppNotification { id: string; title: string; body: string; at: string; target: WorkView }

interface AppContextType {
  copilot: ReturnType<typeof useCopilotState>;
  user: User | null;
  scope: Scope;
  permittedSites: Site[];
  activeModule: ModuleKey;
  viewState: ViewState;
  sidebarCollapsed: boolean;
  isScopeModalOpen: boolean;
  isScopeSwitching: boolean;
  notificationMessage: string | null;
  setActiveModule: (mod: ModuleKey) => void;
  setViewState: (state: ViewState) => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  setIsScopeModalOpen: (open: boolean) => void;
  switchSite: (siteId: string) => boolean;
  login: (username: string, password: string, preferredSiteId?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsDemoUser: (user: User, siteId?: string) => void;
  logout: () => void;
  showNotification: (msg: string) => void;
  clearNotification: () => void;
  workView: WorkView | null;
  openWorkView: (v: WorkView | null) => void;
  tasks: WorkTask[];
  alerts: WorkAlert[];
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateAlertStatus: (id: string, status: AlertStatus) => void;
  notifications: AppNotification[];
  readNotificationIds: string[];
  markNotificationsRead: (ids: string[]) => void;
  actions: ActionProposal[];
  runActionCommand: (id: string, command: ActionCommand) => void;
}

// Keep one context object across live code reloads, so the provider and useApp always match.
const g = globalThis as unknown as { __himAppContext?: React.Context<AppContextType | undefined> };
const AppContext = g.__himAppContext ?? (g.__himAppContext = createContext<AppContextType | undefined>(undefined));

const TASKS_KEY = 'him.tasks.v1';
const ALERTS_KEY = 'him.alerts.v1';
const ACTIONS_KEY = 'him.actions.v4';
function loadStored<T extends { id: string }>(key: string, base: T[]): T[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) return base;
    const saved = JSON.parse(raw) as T[];
    const byId = new Map(saved.map(x => [x.id, x]));
    return base.map(b => ({ ...b, ...(byId.get(b.id) ?? {}) }));
  } catch { return base; }
}
function saveStored2(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
function saveStored(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export const AppProvider: React.FC<{ children: React.ReactNode; initialWorkView?: WorkView | null }> = ({ children, initialWorkView = null }) => {
  // Initial state: logged in with the chief executive for immediate evaluation,
  // but with full capability to log out and use the LoginView.
  // The mock identity and hospital survive refresh and route changes (the provider lives above the routes).
  const [session] = useState(readSession);
  const [user, setUser] = useState<User | null>(() => {
    if (session && session.userId === null) return null;
    return DEMO_USERS.find(u => u.id === session?.userId) ?? DEMO_USERS[0] ?? null;
  });
  
  const [scope, setScope] = useState<Scope>(() => {
    // Only a hospital the restored user may see is restored; an unknown or forbidden one falls back to the default.
    const restoredUser = DEMO_USERS.find(u => u.id === session?.userId) ?? DEMO_USERS[0];
    const stored = SITES_DATA.find(x => x.id === session?.siteId && restoredUser?.permittedSiteIds.includes(x.id));
    const initialSite = stored ?? SITES_DATA[0]!;
    return {
      orgId: CURRENT_ORGANIZATION.id,
      orgName: CURRENT_ORGANIZATION.name,
      siteId: initialSite.id,
      siteName: initialSite.name,
      siteCode: initialSite.code,
      siteType: initialSite.type,
    };
  });

  useEffect(() => { saveStored2(SESSION_KEY, { userId: user?.id ?? null, siteId: scope.siteId }); }, [user, scope.siteId]);
  const [activeModule, setActiveModuleRaw] = useState<ModuleKey>('EXE');
  const [workView, setWorkView] = useState<WorkView | null>(() => (typeof window === 'undefined' ? initialWorkView : workViewForPath(window.location.pathname) ?? initialWorkView));
  const copilot = useCopilotState(user, scope.siteId);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = pathForWorkView(workView);
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    if (current !== path) window.history.pushState(null, '', path);
  }, [workView]);
  // Back/forward changes the path; follow it without remounting the provider.
  useEffect(() => {
    const onPop = () => setWorkView(workViewForPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Sample actions are kept in this browser only so a refresh does not undo a recorded approval;
  // no command is ever dispatched to a real hospital system.
  const [actions, setActions] = useState<ActionProposal[]>(() =>
    // The rolling sample expiry is never restored from storage, so a saved copy cannot start already expired.
    loadStored(ACTIONS_KEY, ACTIONS_DATA).map(a => {
      const base = ACTIONS_DATA.find(b => b.id === a.id);
      return base ? { ...a, expiresAt: base.expiresAt, expiresAtIso: base.expiresAtIso } : a;
    }));
  useEffect(() => { saveStored(ACTIONS_KEY, actions); }, [actions]);
  const runActionCommand = (id: string, command: ActionCommand) => {
    const current = actions.find(a => a.id === id);
    if (!current) return;
    const next = applyActionCommand(current, user, scope.siteId, command, new Date().toISOString());
    if (next === current) {
      showNotification('این اقدام انجام نشد: دسترسی، وضعیت یا اطلاعات لازم معتبر نیست.');
      return;
    }
    setActions(prev => prev.map(a => a.id === id ? next : a));
    const messages: Record<ActionCommand['kind'], string> = {
      approve: next.status === 'approved' ? 'پیشنهاد اقدام تأیید شد. (داده نمونه در همین مرورگر ذخیره می‌شود.)' : 'تأیید شما ثبت شد؛ تأیید مستقل دیگری لازم است.',
      cancel: 'پیشنهاد پیش از ارسال لغو شد.',
      send: 'ارسال نمونه ثبت شد.',
      uncertain: 'نبود پاسخ قطعی ثبت شد؛ اقدام نامشخص است.',
      reconcile: next.status === 'finalized' ? 'نتیجه تطبیق ثبت شد و اقدام نهایی شد.' : 'نتیجه تطبیق ثبت شد؛ اقدام همچنان نامشخص است.',
      escalate: 'اقدام برای بررسی دستی ارجاع شد.',
      manual: 'اجرای دستی تأییدشده ثبت و اقدام نهایی شد.',
    };
    showNotification(messages[command.kind]);
  };
  // Persist task/alert changes so they survive a full page reload (app renders client-only).
  const [tasks, setTasks] = useState<WorkTask[]>(() => loadStored(TASKS_KEY, TASKS_DATA));
  const [alerts, setAlerts] = useState<WorkAlert[]>(() => loadStored(ALERTS_KEY, ALERTS_DATA));
  useEffect(() => { saveStored(TASKS_KEY, tasks); }, [tasks]);
  useEffect(() => { saveStored(ALERTS_KEY, alerts); }, [alerts]);
  const [readNotificationIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(window.localStorage.getItem('him.notif.read.v1') ?? '[]') as string[]; } catch { return []; }
  });
  useEffect(() => { saveStored('him.notif.read.v1', readNotificationIds); }, [readNotificationIds]);
  const markNotificationsRead = (ids: string[]) => setReadIds(prev => Array.from(new Set([...prev, ...ids])));
  const notifications = React.useMemo<AppNotification[]>(() => {
    const sid = scope.siteId;
    const fromAlerts = alerts.filter(a => a.siteId === sid && a.status !== 'resolved').map(a => ({
      id: `n-${a.id}-${a.status}`, at: a.raisedAt,
      title: a.status === 'new' ? `هشدار جدید: ${a.title}` : `هشدار در انتظار رفع: ${a.title}`,
      body: `${a.code} · ${a.source}`, target: { kind: 'alert', id: a.id } as WorkView,
    }));
    const fromTasks = tasks.filter(t => t.siteId === sid && t.status !== 'done' && (t.priority === 'critical' || t.priority === 'high')).map(t => ({
      id: `n-${t.id}-${t.status}`, at: `سررسید ${t.dueDate}`,
      title: `وظیفه با اولویت بالا: ${t.title}`, body: `${t.code} · مسئول: ${t.assignee}`, target: { kind: 'task', id: t.id } as WorkView,
    }));
    return [...fromAlerts, ...fromTasks];
  }, [alerts, tasks, scope.siteId]);
  const setActiveModule = (m: ModuleKey) => { setActiveModuleRaw(m); setWorkView(null); };
  const openWorkView = (v: WorkView | null) => { setWorkView(v); setViewState('normal'); };
  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, history: [...t.history, { at: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }), text: `وضعیت توسط ${user?.name ?? 'کاربر'} تغییر کرد.` }] } : t));
    showNotification('وضعیت وظیفه به‌روزرسانی شد.');
  };
  const updateAlertStatus = (id: string, status: AlertStatus) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    showNotification(status === 'resolved' ? 'هشدار برطرف‌شده ثبت شد.' : 'دریافت هشدار تأیید شد.');
  };
  const [viewState, setViewState] = useState<ViewState>('normal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [isScopeModalOpen, setIsScopeModalOpen] = useState<boolean>(false);
  const [isScopeSwitching, setIsScopeSwitching] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Derived permitted sites based on user access
  const permittedSites = React.useMemo(() => {
    if (!user) return [];
    return SITES_DATA.filter(site => user.permittedSiteIds.includes(site.id));
  }, [user]);

  // Ensure current scope is permitted when user changes
  useEffect(() => {
    if (user && permittedSites.length > 0) {
      if (!scope.siteId || !user.permittedSiteIds.includes(scope.siteId)) {
        const fallbackSite = permittedSites[0]!;
        setScope({
          orgId: CURRENT_ORGANIZATION.id,
          orgName: CURRENT_ORGANIZATION.name,
          siteId: fallbackSite.id,
          siteName: fallbackSite.name,
          siteCode: fallbackSite.code,
          siteType: fallbackSite.type,
        });
      }
    }
  }, [user, permittedSites, scope.siteId]);

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
  };

  const clearNotification = () => {
    setNotificationMessage(null);
  };

  const switchSite = (siteId: string): boolean => {
    if (!user) return false;
    
    // Check permission
    if (!user.permittedSiteIds.includes(siteId)) {
      showNotification('خطای دسترسی: شما مجوز مشاهده این سایت بیمارستانی را ندارید.');
      return false;
    }

    const targetSite = SITES_DATA.find(s => s.id === siteId);
    if (!targetSite) return false;

    // Simulate safe transition and security re-validation as per FSD §2.4
    setIsScopeSwitching(true);
    
    setTimeout(() => {
      setScope({
        orgId: CURRENT_ORGANIZATION.id,
        orgName: CURRENT_ORGANIZATION.name,
        siteId: targetSite.id,
        siteName: targetSite.name,
        siteCode: targetSite.code,
        siteType: targetSite.type,
      });
      setIsScopeSwitching(false);
      setWorkView(prev => prev?.kind === 'proposal' ? { kind: 'proposals' } : prev);
      showNotification(`دامنه کاری به «${targetSite.name}» تغییر یافت.`);
    }, 300);

    return true;
  };

  const login = async (username: string, password: string, preferredSiteId?: string) => {
    // Simulated credential check
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      return { success: false, message: 'لطفاً نام کاربری یا شماره پرسنلی را وارد کنید.' };
    }
    if (!cleanPassword) {
      return { success: false, message: 'لطفاً کلمه عبور را وارد کنید.' };
    }

    // Match against registered users by personnel ID or email
    const normalizedUsername = cleanUsername.toLowerCase();
    const matched = DEMO_USERS.find(
      u => u.personnelId.toLowerCase() === normalizedUsername || 
           u.email.toLowerCase() === normalizedUsername ||
           u.email.toLowerCase().split('@')[0] === normalizedUsername
    );

    // If username is fabricated or unknown, reject immediately with failure feedback
    if (!matched) {
      return { 
        success: false, 
        message: 'شناسه کاربری یا شماره پرسنلی واردشده در سامانه یافت نشد. لطفاً اطلاعات صحیح را وارد نمایید.' 
      };
    }

    // Verify password for the matched user
    const validPasswords = ['sbmu1405', '123456', matched.personnelId, '••••••••', 'password'];
    if (!validPasswords.includes(cleanPassword)) {
      return {
        success: false,
        message: 'کلمه عبور واردشده برای این حساب کاربری نادرست است.'
      };
    }

    const targetSiteId = preferredSiteId && matched.permittedSiteIds.includes(preferredSiteId)
      ? preferredSiteId
      : matched.permittedSiteIds[0];

    loginAsDemoUser(matched, targetSiteId);
    return { success: true };
  };

  const loginAsDemoUser = (demoUser: User, siteId?: string) => {
    setUser(demoUser);
    // Switching mock identity keeps the current hospital when the new user may also see it.
    const chosenSiteId = siteId && demoUser.permittedSiteIds.includes(siteId)
      ? siteId
      : scope.siteId && demoUser.permittedSiteIds.includes(scope.siteId)
        ? scope.siteId
        : demoUser.permittedSiteIds[0];

    const targetSite = SITES_DATA.find(s => s.id === chosenSiteId) || SITES_DATA[0]!;
    
    setScope({
      orgId: CURRENT_ORGANIZATION.id,
      orgName: CURRENT_ORGANIZATION.name,
      siteId: targetSite.id,
      siteName: targetSite.name,
      siteCode: targetSite.code,
      siteType: targetSite.type,
    });
    setViewState('normal');
    showNotification(`ورود موفق به سامانه با هویت «${demoUser.name}»`);
    setWorkView(prev => prev?.kind === 'copilot' ? prev : null);
  };

  const logout = () => {
    setUser(null);
    setWorkView(null);
    setViewState('normal');
    showNotification('خروج از سامانه انجام شد.');
  };

  return (
    <AppContext.Provider
      value={{
        copilot,
        user,
        scope,
        permittedSites,
        activeModule,
        viewState,
        sidebarCollapsed,
        isScopeModalOpen,
        isScopeSwitching,
        notificationMessage,
        setActiveModule,
        setViewState,
        setSidebarCollapsed,
        setIsScopeModalOpen,
        switchSite,
        login,
        loginAsDemoUser,
        logout,
        showNotification,
        clearNotification,
        workView,
        openWorkView,
        tasks,
        alerts,
        updateTaskStatus,
        updateAlertStatus,
        notifications,
        readNotificationIds,
        markNotificationsRead,
        actions,
        runActionCommand,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
