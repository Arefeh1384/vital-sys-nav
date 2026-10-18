import { DEMO_USERS, SITES_DATA } from './mockData';
import type { User } from '../types';

export type ActionStatus = 'proposed' | 'approved' | 'sent' | 'uncertain' | 'finalized';
export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  proposed: 'پیشنهادی', approved: 'تأییدشده', sent: 'ارسال‌شده', uncertain: 'نامشخص', finalized: 'نهایی‌شده',
};
export interface ActionEvent { status: ActionStatus; at: string; actor: string; note: string }
export interface ActionProposal {
  id: string; code: string; siteId: string; title: string; description: string;
  creatorId: string; creatorName: string; status: ActionStatus;
  target: string; impact: string; risk: string;
  diff: { field: string; before: string; after: string }[];
  taskId: string; alertId: string; history: ActionEvent[];
  approvedBy?: string; dispatchKey?: string;
  reconciliation?: { reference: string; outcome: 'confirmed' | 'not_found' | 'pending'; note: string };
  expiresAt: string;
  escalatedTo?: string;
  /** Users who reconciled or referred this action while it was uncertain; they cannot verify the manual completion. */
  uncertainActorIds?: string[];
  manualCompletion?: { reference: string; note: string; verifiedBy: string };
}

export function scopedActions(actions: ActionProposal[], siteId: string | null) {
  return actions.filter(a => a.siteId === siteId);
}
export function approvalError(action: ActionProposal, user: User | null, siteId: string | null): string | null {
  if (!user || action.siteId !== siteId || !user.permittedSiteIds.includes(action.siteId)) return 'این پیشنهاد خارج از دامنه دسترسی شماست.';
  if (action.creatorId === user.id) return 'سازنده پیشنهاد نمی‌تواند پیشنهاد خودش را تأیید کند.';
  if (!['executive_viewer', 'process_approver', 'control_approver'].includes(user.role)) return 'نقش فعلی شما مجوز تأیید اقدام ندارد.';
  if (action.status !== 'proposed') return 'این پیشنهاد در انتظار تأیید نیست.';
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
  | { kind: 'manual'; reference: string; note: string };
export function applyActionCommand(action: ActionProposal, user: User | null, siteId: string | null, command: ActionCommand, at: string): ActionProposal {
  if (!user || action.siteId !== siteId || !user.permittedSiteIds.includes(action.siteId)) return action;
  let status = action.status;
  let note = '';
  let extra: Partial<ActionProposal> = {};
  if (command.kind === 'approve') {
    if (approvalError(action, user, siteId)) return action;
    status = 'approved'; note = 'تفاوت‌ها و اثر اقدام بررسی و تأیید شد.'; extra = { approvedBy: user.id };
  } else {
    if (!['executive_viewer', 'process_approver', 'control_approver', 'data_steward', 'integration_administrator'].includes(user.role)) return action;
    if (command.kind === 'send' && action.status === 'approved') {
      status = 'sent'; note = 'ارسال نمونه ثبت شد؛ منتظر تطبیق نتیجه مقصد.'; extra = { dispatchKey: `dispatch-${action.id}` };
    } else if (command.kind === 'uncertain' && action.status === 'sent') {
      status = 'uncertain'; note = 'پاسخ قطعی مقصد موجود نیست؛ ارسال دوباره متوقف و تطبیق لازم است.';
    } else if (command.kind === 'reconcile' && (action.status === 'uncertain' || action.status === 'sent')) {
      const result = command.result;
      if (!result.reference.trim() || !result.note.trim()) return action;
      status = result.outcome === 'confirmed' ? 'finalized' : 'uncertain';
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
  return { ...action, ...extra, status, history: [...action.history, { status, at, actor: user.name, note }] };
}

const stages: ActionStatus[] = ['proposed', 'approved', 'sent', 'uncertain', 'finalized'];
const titles = ['بازتوزیع ظرفیت مراقبت ویژه', 'افزایش سفارش هپارین', 'برنامه اصلاح خطای دارویی', 'کالیبراسیون ونتیلاتورها', 'اصلاح اسناد کسورات بیمه'];
export const ACTIONS_DATA: ActionProposal[] = SITES_DATA.flatMap((site, si) => stages.map((status, i) => {
  const creator = DEMO_USERS[i === 1 ? 0 : 1];
  const id = `ap-${si}-${i}`;
  const k = (i + si) % 5; // each site gets a different mix of topics so scope changes are visible
  const history = stages.slice(0, i + 1).map((s, index): ActionEvent => ({ status: s, at: `۱۴۰۵/۰۷/۲۵ · ${['۰۸:۰۰', '۰۸:۳۰', '۰۸:۳۵', '۰۸:۴۰', '۰۹:۰۰'][index]}`, actor: index === 0 ? creator?.name ?? 'کارشناس' : 'مسئول بررسی', note: ['پیشنهاد همراه شواهد ثبت شد.', 'تفاوت‌ها و اثر اقدام بررسی شد.', 'ارسال نمونه ثبت شد.', 'پاسخ مقصد قطعی نیست؛ نیازمند تطبیق.', 'اجرای مقصد با مرجع تطبیق تأیید شد.'][index] ?? '' }));
  const diffs = [
    { field: 'ظرفیت تخصیص‌یافته ICU', before: '۲۰ تخت', after: '۲۴ تخت' },
    { field: 'تعداد سفارش هپارین', before: '۱۲۰ ویال', after: '۳۰۰ ویال' },
    { field: 'بررسی دوم دارو', before: 'بدون کنترل دوم', after: 'کنترل دو نفره' },
    { field: 'وضعیت کالیبراسیون', before: '۳ دستگاه معوق', after: '۳ دستگاه در برنامه سرویس' },
    { field: 'وضعیت اسناد', before: 'نیازمند اصلاح', after: 'آماده بازبینی بیمه' },
  ];
  return {
    id, code: `ACT-${3000 + si * 10 + i}`, siteId: site.id, title: `${titles[k] ?? 'پیشنهاد اقدام'} — ${site.name}`,
    description: 'پیشنهاد اصلاح فرایند بر اساس هشدار و وظیفه مرتبط، برای بررسی مسئول تأیید.',
    creatorId: creator?.id ?? 'usr-2', creatorName: creator?.name ?? 'کارشناس', status,
    target: ['HIS / ADT', 'سامانه انبار', 'سامانه ایمنی بیمار', 'سامانه نگهداشت', 'سامانه درآمد'][k] ?? 'سامانه مقصد',
    impact: ['آزادسازی ظرفیت و کاهش انتظار انتقال بیماران؛ اثر تخمینی: ۴ تخت.', 'افزایش پوشش موجودی دارو؛ اثر تخمینی: ۱۸۰ ویال.', 'کاهش احتمال خطای دارویی با بررسی مستقل.', 'بازگرداندن سه دستگاه به برنامه نگهداشت.', 'کاهش برگشت اسناد با بازبینی ثبت خدمات.'][k] ?? '',
    risk: 'اثرها تخمینی هستند؛ صحت داده منبع و ظرفیت اجرایی باید پیش از ارسال بررسی شود.',
    expiresAt: '۱۴۰۵/۰۷/۲۶ · ۱۸:۰۰',
    diff: diffs[k] ? [diffs[k]] : [], taskId: `tk-${si}-${i}`, alertId: `al-${si}-${i}`, history,
    ...(i >= 1 ? { approvedBy: 'reviewer' } : {}),
    ...(i >= 2 ? { dispatchKey: `dispatch-${id}` } : {}),
    ...(i === 4 ? { reconciliation: { reference: `REC-${3000 + si * 10 + i}`, outcome: 'confirmed' as const, note: 'ثبت مقصد بررسی و اجرای اقدام تأیید شد.' } } : {}),
  };
}));