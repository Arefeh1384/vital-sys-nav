import { DEMO_USERS, SITES_DATA } from './mockData';
import type { User } from '../types';

export type ActionStatus = 'proposed' | 'approved' | 'sent' | 'uncertain' | 'finalized' | 'canceled';
export type ActionTier = 't2' | 't3';
export const TIER_LABEL: Record<ActionTier, string> = { t2: 'T2 · یک تأییدکننده', t3: 'T3 · دو تأییدکننده مستقل' };
export const requiredApprovals = (tier: ActionTier) => (tier === 't3' ? 2 : 1);
export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  proposed: 'پیشنهادی', approved: 'تأییدشده', sent: 'ارسال‌شده', uncertain: 'نامشخص', finalized: 'نهایی‌شده', canceled: 'لغوشده',
};
/** One immutable journal entry: previous→next state, UTC instant (ISO), actor, reason and operation key. */
export interface ActionEvent { from: ActionStatus | null; status: ActionStatus; at: string; actor: string; note: string; opKey: string }

/** Stored times are UTC; the UI shows Asia/Tehran and keeps the UTC instant visible. */
export function formatEventTime(iso: string): { tehran: string; utc: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { tehran: iso, utc: iso };
  return {
    tehran: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Tehran' }).format(d),
    utc: d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC'),
  };
}
/** Remaining validity in whole minutes; negative or zero means expired. */
export function minutesUntil(iso: string, now = Date.now()): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : Math.floor((t - now) / 60000);
}
export interface ActionProposal {
  id: string; code: string; siteId: string; title: string; description: string;
  creatorId: string; creatorName: string; status: ActionStatus;
  target: string; impact: string; risk: string;
  diff: { field: string; before: string; after: string }[];
  taskId: string; alertId: string; history: ActionEvent[];
  approvedBy?: string; dispatchKey?: string;
  reconciliation?: { reference: string; outcome: 'confirmed' | 'failed_confirmed' | 'not_found' | 'pending'; note: string };
  tier: ActionTier;
  /** Independent approvals recorded for the current revision. */
  approvals: { userId: string; name: string; at: string }[];
  cancelReason?: string;
  /** Proposal version; the approval is bound to this revision. */
  revision: number;
  expiresAt: string;
  expiresAtIso: string;
  escalatedTo?: string;
  /** Users who reconciled or referred this action while it was uncertain; they cannot verify the manual completion. */
  uncertainActorIds?: string[];
  manualCompletion?: { reference: string; note: string; verifiedBy: string };
}

/** Roles that may approve; auditors and data stewards are read-only for actions. */
export const APPROVER_ROLES: User['role'][] = ['executive_viewer', 'process_approver', 'control_approver'];
/** Roles that may dispatch, reconcile, refer or verify manual completion. */
export const OPERATOR_ROLES: User['role'][] = [...APPROVER_ROLES, 'integration_administrator'];
export const canOperateActions = (user: User | null) => !!user && OPERATOR_ROLES.includes(user.role);

export function scopedActions(actions: ActionProposal[], siteId: string | null) {
  return actions.filter(a => a.siteId === siteId);
}
export function approvalError(action: ActionProposal, user: User | null, siteId: string | null): string | null {
  if (!user || action.siteId !== siteId || !user.permittedSiteIds.includes(action.siteId)) return 'این پیشنهاد خارج از دامنه دسترسی شماست.';
  if (action.creatorId === user.id) return 'سازنده پیشنهاد نمی‌تواند پیشنهاد خودش را تأیید کند.';
  if (!APPROVER_ROLES.includes(user.role)) return 'نقش فعلی شما مجوز تأیید اقدام ندارد.';
  if (action.status !== 'proposed') return 'این پیشنهاد در انتظار تأیید نیست.';
  if (minutesUntil(action.expiresAtIso) <= 0) return 'مهلت تأیید این پیشنهاد به پایان رسیده است.';
  if ((action.approvals ?? []).some(a => a.userId === user.id)) return 'شما قبلاً این پیشنهاد را تأیید کرده‌اید؛ تأییدکننده‌ی مستقل دیگری لازم است.';
  return null;
}
const addActor = (action: ActionProposal, user: User) => Array.from(new Set([...(action.uncertainActorIds ?? []), user.id]));
/** Manual completion needs a verifier who did not reconcile or refer the action. */
export function manualVerificationError(action: ActionProposal, user: User | null): string | null {
  if (!user) return 'برای ثبت اجرای دستی باید وارد شوید.';
  if ((action.uncertainActorIds ?? []).includes(user.id)) return 'تأیید اجرای دستی باید توسط کاربری غیر از ثبت‌کننده‌ی تطبیق یا ارجاع انجام شود.';
  return null;
}
type Reconciliation = NonNullable<ActionProposal['reconciliation']>;
export type ActionCommand =
  | { kind: 'approve' | 'send' | 'uncertain' }
  | { kind: 'reconcile'; result: Reconciliation }
  | { kind: 'escalate'; note: string }
  | { kind: 'manual'; reference: string; note: string }
  | { kind: 'cancel'; reason: string };
export const MIN_REASON_LENGTH = 10;
/** Dispatch needs the full number of distinct approvers, none of them the proposer. */
export function dispatchError(action: ActionProposal): string | null {
  if (action.status !== 'approved') return 'ارسال فقط برای پیشنهاد تأییدشده ممکن است.';
  const need = requiredApprovals(action.tier ?? 't2');
  const approvers = new Set((action.approvals ?? []).map(a => a.userId));
  if (approvers.size < need) return `برای ارسال ${need.toLocaleString('fa-IR')} تأییدکننده‌ی مستقل لازم است؛ ${approvers.size.toLocaleString('fa-IR')} تأیید ثبت شده است.`;
  if (approvers.has(action.creatorId)) return 'سازنده‌ی پیشنهاد نمی‌تواند یکی از تأییدکنندگان باشد.';
  return null;
}
/** Cancel is only possible before dispatch; afterwards the action may already have executed. */
export function cancelError(action: ActionProposal, user: User | null, reason = ''): string | null {
  if (!user) return 'برای لغو باید وارد شوید.';
  if (action.status !== 'proposed' && action.status !== 'approved') return 'لغو پس از ارسال ممکن نیست؛ ممکن است اقدام پیش‌تر اجرا شده باشد. برای جبران، پیشنهاد جدید بسازید.';
  if (!(user.id === action.creatorId || OPERATOR_ROLES.includes(user.role))) return 'نقش فعلی شما مجوز لغو این پیشنهاد را ندارد.';
  if (reason.trim().length < MIN_REASON_LENGTH) return `دلیل لغو باید دست‌کم ${MIN_REASON_LENGTH} نویسه باشد.`;
  return null;
}
export function applyActionCommand(action: ActionProposal, user: User | null, siteId: string | null, command: ActionCommand, at: string): ActionProposal {
  if (!user || action.siteId !== siteId || !user.permittedSiteIds.includes(action.siteId)) return action;
  let status = action.status;
  let note = '';
  let extra: Partial<ActionProposal> = {};
  if (command.kind === 'cancel') {
    if (cancelError(action, user, command.reason)) return action;
    status = 'canceled'; note = `لغو پیش از ارسال: ${command.reason.trim()}`; extra = { cancelReason: command.reason.trim() };
  } else if (command.kind === 'approve') {
    if (approvalError(action, user, siteId)) return action;
    const approvals = [...(action.approvals ?? []), { userId: user.id, name: user.name, at }];
    const need = requiredApprovals(action.tier ?? 't2');
    if (approvals.length >= need) {
      status = 'approved'; note = 'تفاوت‌ها و اثر اقدام بررسی و تأیید شد.'; extra = { approvedBy: user.id, approvals };
    } else {
      status = 'proposed'; note = `تأیید ${approvals.length.toLocaleString('fa-IR')} از ${need.toLocaleString('fa-IR')} ثبت شد؛ تأییدکننده‌ی مستقل دیگری لازم است.`; extra = { approvals };
    }
  } else {
    if (!OPERATOR_ROLES.includes(user.role)) return action;
    if (command.kind === 'send' && action.status === 'approved') {
      if (dispatchError(action)) return action;
      status = 'sent'; note = 'ارسال نمونه ثبت شد؛ منتظر تطبیق نتیجه مقصد.'; extra = { dispatchKey: `dispatch-${action.id}` };
    } else if (command.kind === 'uncertain' && action.status === 'sent') {
      status = 'uncertain'; note = 'پاسخ قطعی مقصد موجود نیست؛ ارسال دوباره متوقف و تطبیق لازم است.';
    } else if (command.kind === 'reconcile' && (action.status === 'uncertain' || action.status === 'sent')) {
      const result = command.result;
      if (!result.reference.trim() || !result.note.trim()) return action;
      // Success and confirmed failure are both conclusive; 'not found' and 'pending' are not proof of anything.
      status = result.outcome === 'confirmed' || result.outcome === 'failed_confirmed' ? 'finalized' : 'uncertain';
      note = `تطبیق با مرجع ${result.reference.trim()}: ${result.note.trim()}`;
      extra = { reconciliation: { ...result, reference: result.reference.trim(), note: result.note.trim() }, uncertainActorIds: addActor(action, user) };
    } else if (command.kind === 'escalate' && action.status === 'uncertain' && !action.escalatedTo) {
      // A missing destination record is not proof of failure: hand over to a person, never auto-retry or cancel.
      if (!command.note.trim()) return action;
      status = 'uncertain'; note = `ارجاع به مسئول کنترل برای بررسی دستی: ${command.note.trim()}`;
      extra = { escalatedTo: 'مسئول کنترل', uncertainActorIds: addActor(action, user) };
    } else if (command.kind === 'manual' && action.status === 'uncertain' && action.escalatedTo) {
      if (manualVerificationError(action, user)) return action;
      // Manual completion is verified by a person; it is distinct from source-confirmed completion.
      if (!command.reference.trim() || !command.note.trim()) return action;
      status = 'finalized'; note = `اجرای دستی با مرجع ${command.reference.trim()} تأیید شد (تأیید انسانی، نه تأیید خودکار منبع): ${command.note.trim()}`;
      extra = { manualCompletion: { reference: command.reference.trim(), note: command.note.trim(), verifiedBy: user.name } };
    } else return action;
  }
  const dispatchKey = (extra.dispatchKey ?? undefined) as string | undefined;
  const opKey = dispatchKey ?? `op-${action.id}-${action.history.length + 1}`;
  return { ...action, ...extra, status, history: [...action.history, { from: action.status, status, at, actor: user.name, note, opKey }] };
}

// One source for the heparin quantities so the diff and the estimated impact can never disagree.
export const HEPARIN_BEFORE = 120;
export const HEPARIN_AFTER = 300;
const stages: ActionStatus[] = ['proposed', 'approved', 'sent', 'uncertain', 'finalized'];
const titles = ['بازتوزیع ظرفیت مراقبت ویژه', 'افزایش سفارش هپارین', 'برنامه اصلاح خطای دارویی', 'کالیبراسیون ونتیلاتورها', 'اصلاح اسناد کسورات بیمه'];
export const ACTIONS_DATA: ActionProposal[] = SITES_DATA.flatMap((site, si) => stages.map((status, i) => {
  const creator = DEMO_USERS[i === 1 ? 0 : 1];
  const id = `ap-${si}-${i}`;
  const k = (i + si) % 5; // each site gets a different mix of topics so scope changes are visible
  const baseMs = Date.UTC(2026, 9, 17, 4, 30); // 2026-10-17 08:00 Asia/Tehran
  const offsets = [0, 30, 35, 40, 60];
  const notes = ['پیشنهاد همراه شواهد ثبت شد.', 'تفاوت‌ها و اثر اقدام بررسی شد.', 'ارسال نمونه ثبت شد.', 'پاسخ مقصد قطعی نیست؛ ممکن است اقدام پیش‌تر اجرا شده باشد و نیازمند تطبیق است.', 'اجرای مقصد با مرجع تطبیق تأیید شد.'];
  const history = stages.slice(0, i + 1).map((s, index): ActionEvent => ({
    from: index === 0 ? null : stages[index - 1] ?? null, status: s,
    at: new Date(baseMs + (offsets[index] ?? 0) * 60000).toISOString(),
    actor: index === 0 ? creator?.name ?? 'کارشناس' : 'مسئول بررسی', note: notes[index] ?? '',
    opKey: index === 2 ? `dispatch-${id}` : `op-${id}-${index + 1}`,
  }));
  if (k === 1 && i >= 1) {
    // A T3 proposal is approved by two independent reviewers: the journal shows both approvals.
    const second = history[1]!;
    history.splice(1, 1,
      { from: 'proposed', status: 'proposed', at: new Date(baseMs + 20 * 60000).toISOString(), actor: 'مسئول بررسی', note: 'تأیید ۱ از ۲ ثبت شد؛ تأییدکننده‌ی مستقل دیگری لازم است.', opKey: `op-${id}-2a` },
      { ...second, note: 'تأیید ۲ از ۲ ثبت شد؛ تفاوت‌ها و اثر اقدام بررسی و تأیید شد.', actor: 'مسئول بررسی دوم' });
  }
  // Fixed per revision: reloading must never extend validity. 2027-03-20 18:00 Asia/Tehran plus one hour per site.
  const expiresMs = Date.UTC(2027, 2, 20, 14, 30) + si * 3600000;
  const diffs = [
    { field: 'ظرفیت تخصیص‌یافته ICU', before: '۲۰ تخت', after: '۲۴ تخت' },
    { field: 'تعداد سفارش هپارین', before: `${HEPARIN_BEFORE.toLocaleString('fa-IR')} ویال`, after: `${HEPARIN_AFTER.toLocaleString('fa-IR')} ویال` },
    { field: 'بررسی دوم دارو', before: 'بدون کنترل دوم', after: 'کنترل دو نفره' },
    { field: 'وضعیت کالیبراسیون', before: '۳ دستگاه معوق', after: '۳ دستگاه در برنامه سرویس' },
    { field: 'وضعیت اسناد', before: 'نیازمند اصلاح', after: 'آماده بازبینی بیمه' },
  ];
  return {
    id, code: `ACT-${3000 + si * 10 + i}`, siteId: site.id, title: `${titles[k] ?? 'پیشنهاد اقدام'} — ${site.name}`,
    description: 'پیشنهاد اصلاح فرایند بر اساس هشدار و وظیفه مرتبط، برای بررسی مسئول تأیید.',
    creatorId: creator?.id ?? 'usr-2', creatorName: creator?.name ?? 'کارشناس', status,
    target: ['HIS / ADT', 'سامانه انبار', 'سامانه ایمنی بیمار', 'سامانه نگهداشت', 'سامانه درآمد'][k] ?? 'سامانه مقصد',
    impact: ['آزادسازی ظرفیت و کاهش انتظار انتقال بیماران؛ اثر تخمینی: ۴ تخت.', `افزایش پوشش موجودی دارو؛ اثر تخمینی: ${(HEPARIN_AFTER - HEPARIN_BEFORE).toLocaleString('fa-IR')} ویال (${HEPARIN_AFTER.toLocaleString('fa-IR')} − ${HEPARIN_BEFORE.toLocaleString('fa-IR')}).`, 'کاهش احتمال خطای دارویی با بررسی مستقل.', 'بازگرداندن سه دستگاه به برنامه نگهداشت.', 'کاهش برگشت اسناد با بازبینی ثبت خدمات.'][k] ?? '',
    risk: 'اثرها تخمینی هستند؛ صحت داده منبع و ظرفیت اجرایی باید پیش از ارسال بررسی شود.',
    tier: (k === 1 ? 't3' : 't2') as ActionTier,
    approvals: i >= 1 ? (k === 1
      ? [{ userId: 'rev-1', name: 'مسئول بررسی', at: history[1]?.at ?? '' }, { userId: 'rev-2', name: 'مسئول بررسی دوم', at: history[2]?.at ?? '' }]
      : [{ userId: 'rev-1', name: 'مسئول بررسی', at: history[1]?.at ?? '' }]) : [],
    revision: 1 + ((si + i) % 3),
    expiresAtIso: new Date(expiresMs).toISOString(),
    expiresAt: formatEventTime(new Date(expiresMs).toISOString()).tehran,
    diff: diffs[k] ? [diffs[k]] : [], taskId: `tk-${si}-${k}`, alertId: `al-${si}-${k}`, history,
    ...(i >= 1 ? { approvedBy: 'reviewer' } : {}),
    ...(i >= 2 ? { dispatchKey: `dispatch-${id}` } : {}),
    ...(i === 4 ? { reconciliation: { reference: `REC-${3000 + si * 10 + i}`, outcome: 'confirmed' as const, note: 'ثبت مقصد بررسی و اجرای اقدام تأیید شد.' } } : {}),
  };
}));