/**
 * Action Proposal module (UI-CTL-04 / UI-CTL-05) — fully synthetic demo data.
 * No real upstream system is ever called.
 */

export type ActionLevel = 'T1' | 'T2' | 'T3';

export type ActionStatus =
  | 'proposed' | 'validating' | 'recorded' | 'awaiting_approval' | 'approved'
  | 'held' | 'dispatching' | 'uncertain' | 'reconciling' | 'succeeded'
  | 'failed_confirmed' | 'failed_validation' | 'rejected' | 'expired' | 'canceled' | 'stale';

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  proposed: 'پیشنهادی',
  validating: 'در حال اعتبارسنجی',
  recorded: 'ثبت‌شده',
  awaiting_approval: 'در انتظار تأیید',
  approved: 'تأییدشده',
  held: 'متوقف',
  dispatching: 'در حال ارسال',
  uncertain: 'نتیجه نامشخص',
  reconciling: 'در حال تطبیق',
  succeeded: 'تأییدشده توسط مبدأ',
  failed_confirmed: 'ناموفق (تأییدشده)',
  failed_validation: 'رد اعتبارسنجی',
  rejected: 'ردشده',
  expired: 'منقضی',
  canceled: 'لغوشده',
  stale: 'کهنه‌شده',
};

export const TERMINAL_STATUSES: ActionStatus[] = [
  'succeeded', 'failed_confirmed', 'failed_validation', 'rejected', 'expired', 'canceled', 'stale',
];

export const LEVEL_LABEL: Record<ActionLevel, string> = {
  T1: 'سطح T1 (خودکار/داخلی)',
  T2: 'سطح T2 (یک تأیید مستقل)',
  T3: 'سطح T3 (دو تأیید متمایز)',
};

export interface DemoUser {
  id: string;
  username: string;
  name: string;
  role: 'proposer' | 'approver' | 'auditor';
  roleTitle: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'u-proposer', username: 'proposer', name: 'دکتر سارا پیشنهاددهنده', role: 'proposer', roleTitle: 'کارشناس پیشنهاددهنده' },
  { id: 'u-approver-1', username: 'approver-1', name: 'دکتر رضا تأییدکننده یک', role: 'approver', roleTitle: 'مسئول تأیید فرایند' },
  { id: 'u-approver-2', username: 'approver-2', name: 'دکتر مریم تأییدکننده دو', role: 'approver', roleTitle: 'مسئول تأیید کنترل' },
  { id: 'u-auditor', username: 'auditor', name: 'مهندس حسین حسابرس', role: 'auditor', roleTitle: 'حسابرس (فقط مشاهده)' },
];

export interface DemoSite { id: string; code: string; name: string }
export const DEMO_SITES: DemoSite[] = [
  { id: 'site-a', code: 'SITE-A', name: 'بیمارستان نمونه الف' },
  { id: 'site-b', code: 'SITE-B', name: 'بیمارستان نمونه ب' },
];

export interface JournalEvent {
  from: ActionStatus | null;
  to: ActionStatus;
  actor: string;
  atUtc: string;
  reason: string;
  opKey: string;
}

export interface ApprovalSlot {
  slot: number;
  siteId?: string; // for cross-site T3: origin vs destination site
  decision: 'empty' | 'approved' | 'rejected';
  by?: string;
  byName?: string;
  at?: string;
}

export interface ActionProposal {
  id: string;
  code: string;
  title: string;
  kind: string;
  level: ActionLevel;
  siteId: string;
  proposerId: string;
  proposerName: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  revision: number;
  crossSite?: { fromSiteId: string; toSiteId: string };
  target: {
    system: string;
    values: { label: string; value: string; unit?: string }[];
    caps: string[];
    preconditions: string[];
  };
  diff: { field: string; before: string; after: string }[];
  impact: { label: string; value: string | null; estimate: boolean }[];
  evidence: { title: string; source: string; at: string }[];
  dataAsOf: string;
  slots: ApprovalSlot[];
  heldReason?: 'kill_switch' | 'audit_unavailable' | 'policy_unavailable';
  dispatchKey?: string;
  manualExecution?: { assignee: string; report: string; verifiedBy?: string; evidenceRef?: string };
  journal: JournalEvent[];
}

export const HELD_REASON_LABEL: Record<NonNullable<ActionProposal['heldReason']>, string> = {
  kill_switch: 'kill_switch',
  audit_unavailable: 'audit_unavailable',
  policy_unavailable: 'policy_unavailable',
};

const T = (day: number, time: string) => `۱۴۰۵/۰۷/${day} · ${time}`;
const utc = (h: number, m = 0) => `2026-10-${String(10 + (h % 3)).padStart(2, '0')}T${String(6 + h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`;

function ev(from: ActionStatus | null, to: ActionStatus, actor: string, h: number, reason: string, op: string): JournalEvent {
  return { from, to, actor, atUtc: utc(h), reason, opKey: op };
}

export const ACTIONS_SEED: ActionProposal[] = [
  {
    id: 'act-3000', code: 'ACT-3000', title: 'بازتوزیع ظرفیت مراقبت ویژه', kind: 'تغییر ظرفیت تخت',
    level: 'T2', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'awaiting_approval', createdAt: T(24, '۰۸:۰۰'), updatedAt: T(25, '۰۸:۳۰'),
    expiresAt: '2026-10-25T20:30:00Z', revision: 1,
    target: {
      system: 'HIS / ADT',
      values: [{ label: 'ظرفیت تخصیص‌یافته ICU', value: '۲۴', unit: 'تخت' }],
      caps: ['سقف مجاز: ۲۸ تخت'], preconditions: ['ضریب اشغال بخش مبدأ زیر ۸۵٪'],
    },
    diff: [{ field: 'ظرفیت تخصیص‌یافته ICU', before: '۲۰ تخت', after: '۲۴ تخت' }],
    impact: [
      { label: 'تخت آزادشده', value: '۴ تخت', estimate: true },
      { label: 'هزینه جابه‌جایی', value: null, estimate: true },
      { label: 'سایت‌های درگیر', value: 'بیمارستان نمونه الف', estimate: false },
    ],
    evidence: [{ title: 'شاخص ضریب اشغال ICU', source: 'داشبورد عملیات', at: T(25, '۰۷:۴۵') }],
    dataAsOf: T(25, '۰۷:۴۵'),
    slots: [{ slot: 1, decision: 'empty' }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد همراه شواهد ثبت شد.', 'op-3000-a'),
      ev('proposed', 'validating', 'سرویس اعتبارسنجی', 2, 'اعتبارسنجی خودکار داده منبع.', 'op-3000-b'),
      ev('validating', 'awaiting_approval', 'سرویس اعتبارسنجی', 3, 'اعتبارسنجی موفق؛ در انتظار تأیید مستقل.', 'op-3000-c'),
    ],
  },
  {
    id: 'act-3001', code: 'ACT-3001', title: 'انتقال بین‌سایتی داروی هپارین', kind: 'انتقال موجودی بین سایت‌ها',
    level: 'T3', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'awaiting_approval', createdAt: T(24, '۰۹:۰۰'), updatedAt: T(25, '۰۹:۱۰'),
    expiresAt: '2026-10-24T20:30:00Z', revision: 2,
    crossSite: { fromSiteId: 'site-a', toSiteId: 'site-b' },
    target: {
      system: 'سامانه انبار',
      values: [{ label: 'تعداد انتقال هپارین', value: '۱۸۰', unit: 'ویال' }],
      caps: ['سقف انتقال روزانه: ۳۰۰ ویال'], preconditions: ['موجودی امن سایت مبدأ حفظ شود'],
    },
    diff: [{ field: 'موجودی هپارین سایت ب', before: '۱۲۰ ویال', after: '۳۰۰ ویال' }],
    impact: [
      { label: 'پوشش موجودی دارو', value: '۱۸۰ ویال', estimate: false },
      { label: 'سایت‌های درگیر', value: 'الف ← ب', estimate: false },
    ],
    evidence: [{ title: 'رکورد موجودی انبار', source: 'سامانه انبار', at: T(25, '۰۸:۰۰') }],
    dataAsOf: T(25, '۰۸:۰۰'),
    slots: [
      { slot: 1, siteId: 'site-a', decision: 'approved', by: 'u-approver-1', byName: 'دکتر رضا تأییدکننده یک', at: T(25, '۰۹:۱۰') },
      { slot: 2, siteId: 'site-b', decision: 'empty' },
    ],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3001-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار دو تأیید متمایز.', 'op-3001-b'),
      ev('awaiting_approval', 'awaiting_approval', 'دکتر رضا تأییدکننده یک', 3, 'اسلات نخست (سایت مبدأ) تأیید شد.', 'op-3001-c'),
    ],
  },
  {
    id: 'act-3002', code: 'ACT-3002', title: 'برنامه اصلاح خطای دارویی', kind: 'اصلاح فرایند',
    level: 'T2', siteId: 'site-b', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'approved', createdAt: T(23, '۱۰:۰۰'), updatedAt: T(24, '۱۱:۰۰'),
    expiresAt: '2026-10-23T20:30:00Z', revision: 1,
    target: { system: 'سامانه ایمنی بیمار', values: [{ label: 'کنترل دوم دارو', value: 'دو نفره' }], caps: [], preconditions: [] },
    diff: [{ field: 'بررسی دوم دارو', before: 'بدون کنترل دوم', after: 'کنترل دو نفره' }],
    impact: [{ label: 'کاهش احتمال خطای دارویی', value: 'بررسی مستقل دو نفره', estimate: true }],
    evidence: [{ title: 'گزارش رخداد خطای دارویی', source: 'سامانه ایمنی', at: T(23, '۰۹:۳۰') }],
    dataAsOf: T(23, '۰۹:۳۰'),
    slots: [{ slot: 1, decision: 'approved', by: 'u-approver-2', byName: 'دکتر مریم تأییدکننده دو', at: T(24, '۱۱:۰۰') }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3002-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3002-b'),
      ev('awaiting_approval', 'approved', 'دکتر مریم تأییدکننده دو', 3, 'تأیید مستقل ثبت شد.', 'op-3002-c'),
    ],
  },
  {
    id: 'act-3003', code: 'ACT-3003', title: 'کالیبراسیون ونتیلاتورها', kind: 'دستور نگهداشت',
    level: 'T2', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'uncertain', createdAt: T(22, '۰۸:۰۰'), updatedAt: T(24, '۰۸:۴۰'),
    expiresAt: '2026-10-22T20:30:00Z', revision: 1,
    target: { system: 'سامانه نگهداشت', values: [{ label: 'دستگاه‌های در برنامه سرویس', value: '۳', unit: 'دستگاه' }], caps: [], preconditions: [] },
    diff: [{ field: 'وضعیت کالیبراسیون', before: '۳ دستگاه معوق', after: '۳ دستگاه در برنامه سرویس' }],
    impact: [{ label: 'بازگشت دستگاه‌ها به برنامه نگهداشت', value: '۳ دستگاه', estimate: false }],
    evidence: [{ title: 'شاخص آماده‌به‌کاری تجهیزات', source: 'CMMS', at: T(22, '۰۷:۳۰') }],
    dataAsOf: T(22, '۰۷:۳۰'),
    slots: [{ slot: 1, decision: 'approved', by: 'u-approver-1', byName: 'دکتر رضا تأییدکننده یک', at: T(23, '۰۸:۰۰') }],
    dispatchKey: 'dispatch-act-3003',
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3003-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3003-b'),
      ev('awaiting_approval', 'approved', 'دکتر رضا تأییدکننده یک', 3, 'تأیید شد.', 'op-3003-c'),
      ev('approved', 'dispatching', 'سرویس ارسال', 4, 'ارسال به مبدأ آغاز شد.', 'op-3003-d'),
      ev('dispatching', 'uncertain', 'سرویس ارسال', 5, 'پاسخ قطعی مبدأ دریافت نشد؛ نتیجه نامشخص است.', 'op-3003-e'),
    ],
  },
  {
    id: 'act-3004', code: 'ACT-3004', title: 'اصلاح اسناد کسورات بیمه', kind: 'اصلاح سند',
    level: 'T2', siteId: 'site-b', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'reconciling', createdAt: T(21, '۰۸:۰۰'), updatedAt: T(24, '۱۰:۰۰'),
    expiresAt: '2026-10-21T20:30:00Z', revision: 1,
    target: { system: 'سامانه درآمد', values: [{ label: 'اسناد آماده بازبینی', value: '۱۲', unit: 'سند' }], caps: [], preconditions: [] },
    diff: [{ field: 'وضعیت اسناد', before: 'نیازمند اصلاح', after: 'آماده بازبینی بیمه' }],
    impact: [{ label: 'کاهش برگشت اسناد', value: '۱۲ سند', estimate: true }],
    evidence: [{ title: 'گزارش کسورات', source: 'سامانه درآمد', at: T(21, '۰۷:۰۰') }],
    dataAsOf: T(21, '۰۷:۰۰'),
    slots: [{ slot: 1, decision: 'approved', by: 'u-approver-2', byName: 'دکتر مریم تأییدکننده دو', at: T(22, '۰۹:۰۰') }],
    dispatchKey: 'dispatch-act-3004',
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3004-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3004-b'),
      ev('awaiting_approval', 'approved', 'دکتر مریم تأییدکننده دو', 3, 'تأیید شد.', 'op-3004-c'),
      ev('approved', 'dispatching', 'سرویس ارسال', 4, 'ارسال آغاز شد.', 'op-3004-d'),
      ev('dispatching', 'uncertain', 'سرویس ارسال', 5, 'پاسخ قطعی دریافت نشد.', 'op-3004-e'),
      ev('uncertain', 'reconciling', 'دکتر رضا تأییدکننده یک', 6, 'تطبیق با شناسه عملیات آغاز شد.', 'op-3004-f'),
    ],
  },
  {
    id: 'act-3005', code: 'ACT-3005', title: 'به‌روزرسانی سقف سفارش سرم', kind: 'تغییر سقف سفارش',
    level: 'T1', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'succeeded', createdAt: T(20, '۰۸:۰۰'), updatedAt: T(21, '۰۹:۰۰'),
    expiresAt: '2026-10-20T20:30:00Z', revision: 1,
    target: { system: 'سامانه انبار', values: [{ label: 'سقف سفارش سرم', value: '۵۰۰', unit: 'عدد' }], caps: [], preconditions: [] },
    diff: [{ field: 'سقف سفارش سرم', before: '۳۰۰ عدد', after: '۵۰۰ عدد' }],
    impact: [{ label: 'پوشش مصرف', value: 'دو هفته', estimate: true }],
    evidence: [{ title: 'روند مصرف سرم', source: 'سامانه انبار', at: T(20, '۰۷:۰۰') }],
    dataAsOf: T(20, '۰۷:۰۰'),
    slots: [],
    dispatchKey: 'dispatch-act-3005',
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3005-a'),
      ev('proposed', 'recorded', 'سرویس اعتبارسنجی', 2, 'ثبت داخلی T1.', 'op-3005-b'),
      ev('recorded', 'dispatching', 'سرویس ارسال', 3, 'ارسال آغاز شد.', 'op-3005-c'),
      ev('dispatching', 'succeeded', 'سرویس تطبیق', 4, 'مبدأ اجرای اقدام را تأیید کرد.', 'op-3005-d'),
    ],
  },
  {
    id: 'act-3006', code: 'ACT-3006', title: 'تغییر شیفت نگهداشت تصویربرداری', kind: 'تغییر برنامه',
    level: 'T2', siteId: 'site-b', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'stale', createdAt: T(15, '۰۸:۰۰'), updatedAt: T(19, '۰۸:۰۰'),
    expiresAt: '2026-10-16T20:30:00Z', revision: 3,
    target: { system: 'سامانه نگهداشت', values: [{ label: 'شیفت سرویس', value: 'شبانه' }], caps: [], preconditions: [] },
    diff: [{ field: 'شیفت سرویس', before: 'روزانه', after: 'شبانه' }],
    impact: [{ label: 'کاهش توقف دستگاه در ساعات پیک', value: null, estimate: true }],
    evidence: [{ title: 'گزارش توقف دستگاه', source: 'CMMS', at: T(15, '۰۷:۰۰') }],
    dataAsOf: T(15, '۰۷:۰۰'),
    slots: [{ slot: 1, decision: 'empty' }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3006-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3006-b'),
      ev('awaiting_approval', 'stale', 'سرویس نظارت', 3, 'داده مبدأ کهنه شد؛ پیشنهاد از اعتبار افتاد.', 'op-3006-c'),
    ],
  },
  {
    id: 'act-3007', code: 'ACT-3007', title: 'افزایش ظرفیت اتاق عمل', kind: 'تغییر ظرفیت',
    level: 'T2', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'held', heldReason: 'kill_switch', createdAt: T(18, '۰۸:۰۰'), updatedAt: T(19, '۱۲:۰۰'),
    expiresAt: '2026-10-19T20:30:00Z', revision: 1,
    target: { system: 'HIS / ADT', values: [{ label: 'اتاق عمل فعال', value: '۷', unit: 'اتاق' }], caps: [], preconditions: [] },
    diff: [{ field: 'اتاق عمل فعال', before: '۶ اتاق', after: '۷ اتاق' }],
    impact: [{ label: 'کاهش انتظار عمل', value: '۱ روز', estimate: true }],
    evidence: [{ title: 'شاخص انتظار اتاق عمل', source: 'داشبورد عملیات', at: T(18, '۰۷:۰۰') }],
    dataAsOf: T(18, '۰۷:۰۰'),
    slots: [{ slot: 1, decision: 'approved', by: 'u-approver-1', byName: 'دکتر رضا تأییدکننده یک', at: T(19, '۱۰:۰۰') }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3007-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3007-b'),
      ev('awaiting_approval', 'approved', 'دکتر رضا تأییدکننده یک', 3, 'تأیید شد.', 'op-3007-c'),
      ev('approved', 'held', 'سرویس نظارت', 4, 'توقف اضطراری (kill_switch) فعال شد.', 'op-3007-d'),
    ],
  },
  {
    id: 'act-3008', code: 'ACT-3008', title: 'بازنشانی سطح دسترسی موقت', kind: 'تغییر دسترسی',
    level: 'T2', siteId: 'site-b', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'expired', createdAt: T(10, '۰۸:۰۰'), updatedAt: T(12, '۰۸:۰۰'),
    expiresAt: '2026-10-11T20:30:00Z', revision: 1,
    target: { system: 'سامانه دسترسی', values: [{ label: 'دسترسی موقت', value: 'لغو' }], caps: [], preconditions: [] },
    diff: [{ field: 'دسترسی موقت حساب‌های پشتیبانی', before: 'فعال', after: 'لغوشده' }],
    impact: [{ label: 'کاهش ریسک دسترسی', value: 'بستن ۳ حساب موقت', estimate: false }],
    evidence: [{ title: 'گزارش حساب‌های موقت', source: 'سامانه دسترسی', at: T(10, '۰۷:۰۰') }],
    dataAsOf: T(10, '۰۷:۰۰'),
    slots: [{ slot: 1, decision: 'empty' }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3008-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید.', 'op-3008-b'),
      ev('awaiting_approval', 'expired', 'سرویس نظارت', 3, 'مهلت تأیید به پایان رسید.', 'op-3008-c'),
    ],
  },
  {
    id: 'act-3009', code: 'ACT-3009', title: 'خرید ۴۸ واحد ست مصرفی cath-lab', kind: 'پیشنهاد خرید',
    level: 'T2', siteId: 'site-a', proposerId: 'u-proposer', proposerName: 'دکتر سارا پیشنهاددهنده',
    status: 'awaiting_approval', createdAt: T(25, '۰۶:۰۰'), updatedAt: T(25, '۰۶:۳۰'),
    expiresAt: '2026-10-26T20:30:00Z', revision: 1,
    target: {
      system: 'سامانه تدارکات',
      values: [{ label: 'تعداد', value: '۴۸', unit: 'واحد (بسته ۱۲تایی)' }],
      caps: ['سقف خرید بدون مناقصه: ۱۰۰ واحد'], preconditions: ['موجودی فعلی زیر نقطه سفارش'],
    },
    diff: [{ field: 'موجودی ست مصرفی cath-lab', before: '۸ واحد', after: '۵۶ واحد' }],
    impact: [
      { label: 'قیمت', value: null, estimate: false },
      { label: 'پوشش مصرف', value: '۶ هفته', estimate: true },
      { label: 'مانع', value: 'تأیید الزامی بدون قیمت', estimate: false },
    ],
    evidence: [{ title: 'رکورد نقطه سفارش', source: 'سامانه انبار', at: T(25, '۰۶:۰۰') }],
    dataAsOf: T(25, '۰۶:۰۰'),
    slots: [{ slot: 1, decision: 'empty' }],
    journal: [
      ev(null, 'proposed', 'دکتر سارا پیشنهاددهنده', 1, 'پیشنهاد ثبت شد.', 'op-3009-a'),
      ev('proposed', 'awaiting_approval', 'سرویس اعتبارسنجی', 2, 'در انتظار تأیید؛ قیمت نامعلوم است.', 'op-3009-b'),
    ],
  },
];

// ---------- Pure guards / commands (testable without UI) ----------

export type CommandResult = { ok: true; next: ActionProposal } | { ok: false; error: string } | { ok: false; conflict: true };

export function approvalBlockReason(action: ActionProposal, user: DemoUser, siteId: string): string | null {
  if (action.siteId !== siteId) return 'این پیشنهاد خارج از دامنه فعلی است.';
  if (action.status !== 'awaiting_approval') return 'این پیشنهاد در انتظار تأیید نیست.';
  if (user.role !== 'approver') return 'نقش فعلی شما مجوز تأیید ندارد.';
  if (action.proposerId === user.id) return 'پیشنهاددهنده نمی‌تواند اقدام خود را تأیید کند.';
  if (action.slots.some(s => s.by === user.id)) return 'یک نفر نمی‌تواند دو اسلات تأیید را پر کند.';
  const emptySlot = action.slots.find(s => s.decision === 'empty');
  if (!emptySlot) return 'همه اسلات‌های تأیید پر شده‌اند.';
  return null;
}

export function isExpired(action: ActionProposal, nowIso: string): boolean {
  return action.status === 'awaiting_approval' && action.expiresAt < nowIso;
}

function pushJournal(action: ActionProposal, to: ActionStatus, actor: string, reason: string, atUtc: string): JournalEvent {
  return { from: action.status, to, actor, atUtc, reason, opKey: `op-${action.code.toLowerCase()}-${action.journal.length + 1}` };
}

export function approveAction(action: ActionProposal, user: DemoUser, siteId: string, expectedRevision: number, atUtc: string): CommandResult {
  if (action.revision !== expectedRevision) return { ok: false, conflict: true };
  const blocked = approvalBlockReason(action, user, siteId);
  if (blocked) return { ok: false, error: blocked };
  const slot = action.slots.find(s => s.decision === 'empty')!;
  const slots = action.slots.map(s => s.slot === slot.slot ? { ...s, decision: 'approved' as const, by: user.id, byName: user.name, at: atUtc } : s);
  const complete = slots.every(s => s.decision === 'approved');
  const nextStatus: ActionStatus = complete ? 'approved' : 'awaiting_approval';
  const base: ActionProposal = { ...action, slots, status: nextStatus, updatedAt: atUtc };
  const reason = complete ? 'همه اسلات‌های تأیید تکمیل شد.' : `اسلات ${slot.slot} تأیید شد؛ در انتظار تأییدهای باقی‌مانده.`;
  return { ok: true, next: { ...base, journal: [...action.journal, pushJournal(action, nextStatus, user.name, reason, atUtc)] } };
}

export function rejectAction(action: ActionProposal, user: DemoUser, siteId: string, reason: string, atUtc: string): CommandResult {
  const blocked = approvalBlockReason(action, user, siteId);
  if (blocked) return { ok: false, error: blocked };
  if (reason.trim().length < 10) return { ok: false, error: 'دلیل رد باید حداقل ۱۰ کاراکتر باشد.' };
  const next: ActionProposal = { ...action, status: 'rejected', updatedAt: atUtc, journal: [...action.journal, pushJournal(action, 'rejected', user.name, `رد شد: ${reason.trim()}`, atUtc)] };
  return { ok: true, next };
}

export function cancelAction(action: ActionProposal, user: DemoUser, atUtc: string): CommandResult {
  if (action.status === 'dispatching' || action.status === 'uncertain' || action.status === 'reconciling' || TERMINAL_STATUSES.includes(action.status)) {
    return { ok: false, error: 'اقدام ممکن است در مبدأ پذیرفته شده باشد؛ لغو ممکن نیست. فقط مسیر تطبیق یا پیشنهاد جبران در دسترس است.' };
  }
  if (action.proposerId !== user.id && user.role !== 'approver') return { ok: false, error: 'فقط پیشنهاددهنده یا تأییدکننده می‌تواند لغو کند.' };
  const next: ActionProposal = { ...action, status: 'canceled', updatedAt: atUtc, journal: [...action.journal, pushJournal(action, 'canceled', user.name, 'پیش از ارسال لغو شد.', atUtc)] };
  return { ok: true, next };
}

export function resumeHeldAction(action: ActionProposal, user: DemoUser, atUtc: string): CommandResult {
  if (action.status !== 'held') return { ok: false, error: 'این اقدام متوقف نیست.' };
  if (user.role !== 'approver') return { ok: false, error: 'فقط تأییدکننده مجاز می‌تواند ازسرگیری کند.' };
  // Resume = back to validation, requiring NEW approval (slots reset), never auto-dispatch.
  const slots: ApprovalSlot[] = action.slots.map(s => (s.siteId ? { slot: s.slot, siteId: s.siteId, decision: 'empty' } : { slot: s.slot, decision: 'empty' }));
  const next: ActionProposal = {
    ...action, status: 'validating', slots, revision: action.revision + 1, updatedAt: atUtc,
    journal: [...action.journal, pushJournal(action, 'validating', user.name, 'ازسرگیری: بازگشت به اعتبارسنجی؛ تأیید جدید لازم است.', atUtc)],
  };
  delete next.heldReason;
  return { ok: true, next };
}

export function startReconciliation(action: ActionProposal, user: DemoUser, atUtc: string): CommandResult {
  if (action.status !== 'uncertain') return { ok: false, error: 'تطبیق فقط برای اقدام نامشخص در دسترس است.' };
  if (user.role === 'auditor') return { ok: false, error: 'نقش حسابرس فقط مشاهده است.' };
  const next: ActionProposal = { ...action, status: 'reconciling', updatedAt: atUtc, journal: [...action.journal, pushJournal(action, 'reconciling', user.name, 'تطبیق با شناسه عملیات آغاز شد.', atUtc)] };
  return { ok: true, next };
}

export function recordReconciliation(action: ActionProposal, user: DemoUser, outcome: 'succeeded' | 'failed_confirmed' | 'uncertain', note: string, atUtc: string): CommandResult {
  if (action.status !== 'reconciling') return { ok: false, error: 'ابتدا تطبیق را آغاز کنید.' };
  if (!note.trim()) return { ok: false, error: 'شرح نتیجه تطبیق لازم است.' };
  if (user.role === 'auditor') return { ok: false, error: 'نقش حسابرس فقط مشاهده است.' };
  const reason = outcome === 'succeeded' ? `مبدأ اجرای اقدام را تأیید کرد: ${note.trim()}`
    : outcome === 'failed_confirmed' ? `مبدأ عدم اجرای اقدام را تأیید کرد: ${note.trim()}`
    : `شواهد قطعی یافت نشد؛ عدم یافتن فوری به معنی ناموفق بودن نیست. ارجاع به مسئول انسانی. ${note.trim()}`;
  const next: ActionProposal = { ...action, status: outcome, updatedAt: atUtc, journal: [...action.journal, pushJournal(action, outcome, user.name, reason, atUtc)] };
  return { ok: true, next };
}

export function assignManualExecution(action: ActionProposal, user: DemoUser, assignee: string, atUtc: string): CommandResult {
  if (action.status !== 'uncertain' && action.status !== 'reconciling') return { ok: false, error: 'پیگیری دستی فقط برای اقدام نامشخص در دسترس است.' };
  if (!assignee.trim()) return { ok: false, error: 'مجری انسانی باید مشخص شود.' };
  if (user.role === 'auditor') return { ok: false, error: 'نقش حسابرس فقط مشاهده است.' };
  const next: ActionProposal = {
    ...action, manualExecution: { assignee: assignee.trim(), report: '' }, updatedAt: atUtc,
    journal: [...action.journal, pushJournal(action, action.status, user.name, `پیگیری دستی به «${assignee.trim()}» تخصیص یافت.`, atUtc)],
  };
  return { ok: true, next };
}

export function verifyManualExecution(action: ActionProposal, user: DemoUser, report: string, evidenceRef: string, atUtc: string): CommandResult {
  const manual = action.manualExecution;
  if (!manual) return { ok: false, error: 'ابتدا مجری انسانی تخصیص دهید.' };
  if (user.role !== 'approver') return { ok: false, error: 'تأیید مستقل اجرای دستی فقط با تأییدکننده مجاز است.' };
  if (manual.assignee === user.name) return { ok: false, error: 'مجری نمی‌تواند اجرای خود را تأیید کند.' };
  if (report.trim().length < 10 || !evidenceRef.trim()) return { ok: false, error: 'گزارش اجرا (حداقل ۱۰ کاراکتر) و مدرک مبدأ لازم است.' };
  const next: ActionProposal = {
    ...action, status: 'succeeded', updatedAt: atUtc,
    manualExecution: { ...manual, report: report.trim(), verifiedBy: user.name, evidenceRef: evidenceRef.trim() },
    journal: [...action.journal, pushJournal(action, 'succeeded', user.name, `تکمیل دستی تأییدشده (تأیید انسانی با مدرک ${evidenceRef.trim()}، نه تأیید خودکار مبدأ).`, atUtc)],
  };
  return { ok: true, next };
}
