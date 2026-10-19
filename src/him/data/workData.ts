import { ModuleKey } from '../types';
import { SITES_DATA } from './mockData';

export type TaskStatus = 'open' | 'in_progress' | 'done';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export interface WorkTask {
  id: string;
  code: string;
  title: string;
  description: string;
  module: ModuleKey;
  siteId: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  alertId?: string | undefined;
  history: { at: string; text: string }[];
}

export interface WorkAlert {
  id: string;
  code: string;
  title: string;
  description: string;
  module: ModuleKey;
  siteId: string;
  severity: Priority;
  status: AlertStatus;
  raisedAt: string;
  source: string;
  metric?: { label: string; value: string; threshold: string };
}

const S = SITES_DATA.map(s => s.id);
const site = (i: number) => S[i % S.length]!;

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'بحرانی', high: 'بالا', medium: 'متوسط', low: 'پایین',
};
export const PRIORITY_CLASS: Record<Priority, string> = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-sky-100 text-sky-800 border-sky-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'باز', in_progress: 'در حال انجام', done: 'انجام‌شده',
};
export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  new: 'جدید', acknowledged: 'تأییدشده', resolved: 'برطرف‌شده',
};

const baseAlerts: Omit<WorkAlert, 'id' | 'code' | 'siteId'>[] = [
  { title: 'اشغال تخت ICU بالاتر از آستانه', description: 'نرخ اشغال تخت‌های مراقبت ویژه در ۶ ساعت گذشته از حد مجاز فراتر رفته است.', module: 'OPS', severity: 'critical', status: 'new', raisedAt: '۱۴۰۵/۰۷/۲۲ - ۰۸:۱۵', source: 'HIS / ADT', metric: { label: 'اشغال ICU', value: '۹۶٪', threshold: '۹۰٪' } },
  { title: 'کاهش موجودی داروی هپارین', description: 'موجودی انبار داروخانه مرکزی کمتر از نقطه سفارش است.', module: 'SUP', severity: 'high', status: 'new', raisedAt: '۱۴۰۵/۰۷/۲۲ - ۰۷:۴۰', source: 'سامانه انبار', metric: { label: 'موجودی', value: '۱۲۰ ویال', threshold: '۳۰۰ ویال' } },
  { title: 'گزارش خطای دارویی ثبت شد', description: 'یک رخداد ایمنی بیمار در بخش داخلی ثبت شده و نیازمند بررسی ریشه‌ای است.', module: 'QLT', severity: 'high', status: 'acknowledged', raisedAt: '۱۴۰۵/۰۷/۲۱ - ۲۲:۱۰', source: 'سامانه گزارش خطا' },
  { title: 'تأخیر در کالیبراسیون ونتیلاتور', description: 'سه دستگاه ونتیلاتور از موعد کالیبراسیون دوره‌ای گذشته‌اند.', module: 'AST', severity: 'medium', status: 'new', raisedAt: '۱۴۰۵/۰۷/۲۱ - ۱۴:۰۰', source: 'سامانه نگهداشت' },
  { title: 'افزایش کسورات بیمه‌ای', description: 'نرخ کسورات اسناد ارسالی به بیمه سلامت در ماه جاری افزایش یافته است.', module: 'FIN', severity: 'medium', status: 'resolved', raisedAt: '۱۴۰۵/۰۷/۲۰ - ۱۰:۳۰', source: 'سامانه درآمد', metric: { label: 'کسورات', value: '۷.۸٪', threshold: '۵٪' } },
  { title: 'شکست همگام‌سازی داده HIS', description: 'آخرین بارگذاری داده از HIS با خطای اعتبارسنجی قرارداد داده متوقف شد.', module: 'DAT', severity: 'low', status: 'acknowledged', raisedAt: '۱۴۰۵/۰۷/۲۰ - ۰۳:۰۰', source: 'خط لوله داده' },
];

export const ALERTS_DATA: WorkAlert[] = S.flatMap((_, si) =>
  baseAlerts.map((a, i) => ({
    ...a,
    id: `al-${si}-${i}`,
    code: `ALR-${1000 + si * 10 + i}`,
    siteId: site(si),
  })),
);

const baseTasks: (Omit<WorkTask, 'id' | 'code' | 'siteId' | 'alertId'> & { alertIdx?: number })[] = [
  { title: 'بازتوزیع بیماران ICU به بخش‌های مجاور', description: 'هماهنگی با سرپرستاران برای انتقال بیماران پایدار و آزادسازی ظرفیت ICU.', module: 'OPS', assignee: 'سرپرستار ICU', priority: 'critical', status: 'in_progress', dueDate: '۱۴۰۵/۰۷/۲۲', history: [{ at: '۰۸:۲۰', text: 'وظیفه از روی هشدار ایجاد شد.' }, { at: '۰۹:۰۵', text: 'وضعیت به «در حال انجام» تغییر کرد.' }], alertIdx: 0 },
  { title: 'ثبت سفارش فوری هپارین', description: 'ارسال درخواست خرید فوری به معاونت غذا و دارو.', module: 'SUP', assignee: 'مسئول داروخانه', priority: 'high', status: 'open', dueDate: '۱۴۰۵/۰۷/۲۳', history: [{ at: '۰۷:۴۵', text: 'وظیفه از روی هشدار ایجاد شد.' }], alertIdx: 1 },
  { title: 'تحلیل ریشه‌ای (RCA) خطای دارویی', description: 'تشکیل جلسه کمیته ایمنی و تکمیل فرم RCA.', module: 'QLT', assignee: 'کارشناس ایمنی بیمار', priority: 'high', status: 'open', dueDate: '۱۴۰۵/۰۷/۲۵', history: [{ at: '۲۲:۳۰', text: 'وظیفه ایجاد شد.' }], alertIdx: 2 },
  { title: 'برنامه‌ریزی کالیبراسیون ونتیلاتورها', description: 'هماهنگی با شرکت پشتیبان برای کالیبراسیون سه دستگاه.', module: 'AST', assignee: 'واحد تجهیزات پزشکی', priority: 'medium', status: 'open', dueDate: '۱۴۰۵/۰۷/۲۸', history: [{ at: '۱۴:۱۰', text: 'وظیفه ایجاد شد.' }], alertIdx: 3 },
  { title: 'بازبینی اسناد کسورات بیمه', description: 'بررسی علل کسورات و اصلاح فرایند ثبت خدمات.', module: 'FIN', assignee: 'واحد درآمد', priority: 'medium', status: 'done', dueDate: '۱۴۰۵/۰۷/۲۱', history: [{ at: '۱۰:۴۰', text: 'وظیفه ایجاد شد.' }, { at: '۱۶:۰۰', text: 'وظیفه انجام شد.' }], alertIdx: 4 },
  { title: 'تأیید فصلی دسترسی کاربران', description: 'بازبینی نقش‌ها و مجوزهای کاربران سامانه برای فصل جاری.', module: 'PLT', assignee: 'مدیر امنیت', priority: 'low', status: 'open', dueDate: '۱۴۰۵/۰۷/۳۰', history: [{ at: '۰۹:۰۰', text: 'وظیفه دوره‌ای ایجاد شد.' }] },
  { title: 'سیاست اضافه‌کار — نسخه الف (نمونه)', description: 'نسخه الف: اضافه‌کار نیازمند تأیید پیش از ثبت است (سند نمونه فعال).', module: 'PLT', assignee: 'کمیته سیاست‌گذاری', priority: 'medium', status: 'open', dueDate: '۱۴۰۵/۰۸/۰۱', history: [{ at: '۰۸:۰۰', text: 'سند سیاست اضافه‌کار نسخه الف بارگذاری شد.' }] },
  { title: 'سیاست اضافه‌کار — نسخه ب (نمونه)', description: 'نسخه ب: ثبت اضافه‌کار قبل از تأیید مجاز است (سند نمونه فعال).', module: 'PLT', assignee: 'کمیته سیاست‌گذاری', priority: 'low', status: 'open', dueDate: '۱۴۰۵/۰۸/۰۵', history: [{ at: '۰۸:۳۰', text: 'سند سیاست اضافه‌کار نسخه ب بارگذاری شد.' }] },
];

export const TASKS_DATA: WorkTask[] = S.flatMap((_, si) =>
  baseTasks.map((t, i) => {
    const { alertIdx, ...rest } = t;
    return {
      ...rest,
      id: `tk-${si}-${i}`,
      code: `TSK-${2000 + si * 10 + i}`,
      siteId: site(si),
      alertId: alertIdx !== undefined ? `al-${si}-${alertIdx}` : undefined,
    };
  }),
);
