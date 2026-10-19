import React from 'react';
import { 
  Building2, 
  Bed, 
  Clock, 
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  KeyRound,
  Users,
  Activity,
  PackageOpen,
  Cpu,
  CreditCard,
  Database,
  ShieldAlert,
  TrendingUp,
  Boxes,
  HeartPulse,
  Stethoscope,
  Terminal,
  FileCheck,
  FolderLock,
  RefreshCw,
  Server,
  Zap,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MODULES_CONFIG, SITES_DATA } from '../data/mockData';
import { LoadingState } from './states/LoadingState';
import { EmptyState } from './states/EmptyState';
import { ErrorState } from './states/ErrorState';
import { TaskListView, TaskDetailView, AlertListView, AlertDetailView, NotificationCenterView } from './WorkViews';
import { CopilotView } from './CopilotView';
import { ActionProposalListView, ActionProposalDetailView, ActionJournalView, ApprovalQueueView } from './ActionViews';

export const MainContent: React.FC = () => {
  const { 
    scope, 
    activeModule, 
    viewState, 
    setViewState, 
    setIsScopeModalOpen, 
    user,
    isScopeSwitching,
    workView
  } = useApp();

  const currentModuleDef = MODULES_CONFIG.find(m => m.key === activeModule) || MODULES_CONFIG[0]!;
  const currentSite = SITES_DATA.find(s => s.id === scope.siteId);

  // If in scope-switching transition, render subtle loading
  if (isScopeSwitching) {
    return (
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0" data-testid="scope-switching-state">
        <LoadingState message={`در حال تغییر مرز امنیتی و بارگذاری داده‌های «${scope.siteName}»...`} />
      </main>
    );
  }

  if (workView) {
    return (
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0" dir="rtl">
        {viewState === 'loading' && <LoadingState />}
        {viewState === 'empty' && <EmptyState />}
        {viewState === 'error' && <ErrorState />}
        {viewState === 'normal' && <>
          {workView.kind === 'tasks' && <TaskListView />}
          {workView.kind === 'task' && <TaskDetailView id={workView.id} />}
          {workView.kind === 'alerts' && <AlertListView />}
          {workView.kind === 'alert' && <AlertDetailView id={workView.id} />}
          {workView.kind === 'notifications' && <NotificationCenterView />}
          {workView.kind === 'proposals' && <ActionProposalListView key={scope.siteId} />}
          {workView.kind === 'approvals' && <ApprovalQueueView key={scope.siteId} />}
          {workView.kind === 'proposal' && <ActionProposalDetailView id={workView.id} />}
          {workView.kind === 'journal' && <ActionJournalView />}
          {workView.kind === 'copilot' && <CopilotView />}
        </>}
      </main>
    );
  }

  // Render module-specific content depending on activeModule
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'PLT':
        return renderPltContent();
      case 'OPS':
        return renderOpsContent();
      case 'SUP':
        return renderSupContent();
      case 'QLT':
        return renderQltContent();
      case 'AST':
        return renderAstContent();
      case 'FIN':
        return renderFinContent();
      case 'DAT':
        return renderDatContent();
      case 'EXE':
      default:
        return renderExeContent();
    }
  };

  // 1. PLT: امنیت، دسترسی و پیکربندی سکو (Platform, Security & Access)
  const renderPltContent = () => (
    <div key="module-plt" className="space-y-6 animate-in fade-in duration-200" data-module="PLT">
      {/* PLT Summary Header */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-900 text-teal-400 rounded-lg">
                <Lock className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                مرکز مدیریت دسترسی، امنیت و ایزولاسیون سکو (PLT)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              اعمال خط‌مشی‌های تفکیک سایت، توکن‌های اعتبارسنجی (Epochs) و ممیزی زنجیره رویدادها
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>پایلوت امنیتی فعال (RLS Enforcement)</span>
          </div>
        </div>

        {/* PLT Metric Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">نشست‌های فعال سازمانی</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
              ۱۴ نشست
            </div>
            <span className="text-[10px] sm:text-[11px] text-teal-700 font-medium block">
              احراز هویت OIDC / SSO
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">سطح ایزولاسیون داده‌ها</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              سطح ۳ (Site-RLS)
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium block">
              محدود به «{scope.siteCode}»
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">مهروموم لاگ ممیزی</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-mono">
              Batch #1048
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium block">
              امضاشده و غیرقابل‌تغییر
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">وضعیت کلید قطع اضطراری</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 pt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>سالم و آماده</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              Kill-Switch غیرفعال است
            </span>
          </div>
        </div>
      </div>

      {/* PLT Roles & Security Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>نقش‌های کنترل دسترسی سازمانی فعال در {scope.siteName}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                پیکربندی تفکیک وظایف بر اساس استاندارد دسترسی REQ-PLT-003
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                role: 'مدیر ارشد ستادی (executive_viewer)',
                desc: 'دسترسی خواندن شاخص‌های کلیدی کل بیمارستان‌های دانشگاه',
                scopeBadge: 'تمام سایت‌ها',
                status: 'فعال سازمانی',
              },
              {
                role: 'مدیر عملیات بیمارستانی (domain_analyst)',
                desc: `دسترسی تحلیل فرآیندها و تخت‌های اختصاصی ${scope.siteName}`,
                scopeBadge: scope.siteCode,
                status: 'محدود به سایت',
              },
              {
                role: 'مسئول تایید تراکنش (process_approver)',
                desc: 'مجوز تایید پیش‌نویس سفارشات دارویی تا سقف ۵۰ میلیون ریال',
                scopeBadge: 'سایت محلی',
                status: 'تایید دومرحله‌ای T3',
              },
              {
                role: 'ناظر کیفیت و حاکمیت داده (data_steward)',
                desc: 'دسترسی مدیریت نگاشت‌های هویتی، کانکتورها و رفع مغایرت‌های HIS',
                scopeBadge: 'کل دامنه دانشگاه',
                status: 'بدون دسترسی مستقیم بالینی',
              },
            ].map((item, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">{item.role}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.scopeBadge}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Controls & Generation Token */}
        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>تنظیمات امنیت جلسه و انقضا</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] block">شناسه نسل امنیتی (Authorization Generation):</span>
              <span className="font-mono text-[11px] text-slate-800 font-bold break-all select-all block">
                gen-epoch-9821-4111-active
              </span>
              <p className="text-[10px] text-slate-500 pt-1">
                در صورت بازیابی از پشتیبان، نسل امنیتی فوراً باطل می‌گردد (FSD §23.3).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span>مهلت بی‌تحرکی نشست:</span>
                <span className="font-bold tabular-nums">۱۵ دقیقه</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>انقضای قطعی جلسه:</span>
                <span className="font-bold tabular-nums">۸ ساعت</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>احراز هویت مجدد گام‌به‌گام (Step-Up):</span>
                <span className="font-bold tabular-nums text-teal-800">حداکثر ۵ دقیقه</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('درخواست بازنشانی توکن‌های موقت ثبت شد.')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              بازنشانی توکن‌های نشست‌های محلی
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. OPS: عملیات بیمارستانی و جریان بیمار
  const renderOpsContent = () => (
    <div key="module-ops" className="space-y-6 animate-in fade-in duration-200" data-module="OPS">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>پایش عملیات بیمارستانی و مدیریت ظرفیت تخت‌ها (OPS)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ارزیابی پذیرش، ترخیص و زمان انتظار در {scope.siteName}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">بروزرسانی داده‌های ADT: ۲ دقیقه قبل</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">تخت‌های فعال عملیاتی</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {currentSite?.activeBeds || 0}
            </div>
            <span className="text-[11px] text-teal-700 block">تخت‌های دارای پشتیبانی پرسنلی</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">ضریب اشغال جاری (Occupancy)</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              {currentSite?.activeBeds ? '۸۱.۲٪' : '—'}
            </div>
            <span className="text-[11px] text-emerald-700 block">نرخ اشغال استاندارد</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">میانه زمان انتظار اورژانس</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۲۲ دقیقه
            </div>
            <span className="text-[11px] text-slate-500 block">از تریاژ تا اولین ویزیت</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">در انتظار تایید ترخیص</span>
            <div className="text-2xl font-black text-amber-700 tabular-nums">
              ۱۴ بیمار
            </div>
            <span className="text-[11px] text-amber-700 block">نیاز به بازبینی بالینی (T4)</span>
          </div>
        </div>
      </div>

      {/* Ward Occupancy List */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>ظرفیت و اشغال به تفکیک بخش‌های بالینی {scope.siteName}</span>
          <span className="text-[11px] text-slate-400 font-mono">سرشماری برخط</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { ward: 'بخش مراقبت‌های ویژه (ICU جنرال)', total: 24, occupied: 22, rate: '۹۱.۶٪', status: 'تراکم بالا' },
            { ward: 'بخش جراحی مردان', total: 48, occupied: 38, rate: '۷۹.۱٪', status: 'عادی' },
            { ward: 'بخش داخلی و ریه', total: 52, occupied: 43, rate: '۸۲.۶٪', status: 'عادی' },
            { ward: 'اورژانس تحت نظر', total: 30, occupied: 28, rate: '۹۳.۳٪', status: 'تراکم بالا' },
          ].map((w, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{w.ward}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${w.status === 'تراکم بالا' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {w.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">تخت‌های اشغال‌شده:</span>
                <span className="font-bold tabular-nums text-slate-800">{w.occupied} از {w.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">ضریب اشغال:</span>
                <span className="font-bold text-teal-800 tabular-nums">{w.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 3. SUP: زنجیره تأمین، دارو و انبار
  const renderSupContent = () => (
    <div key="module-sup" className="space-y-6 animate-in fade-in duration-200" data-module="SUP">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-teal-600" />
              <span>پایش زنجیره تأمین دارو و مدیریت موجودی استراتژیک (SUP)</span>
            </h2>
            <p className="text-xs text-slate-500">
              مدیریت کسری‌های احتمالی و اقلام نزدیک انقضا در {scope.siteName}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">وضعیت انبار: FEFO برخط</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">اقلام با ریسک کسری فوری</span>
            <div className="text-2xl font-black text-rose-700 tabular-nums">
              ۳ قلم
            </div>
            <span className="text-[11px] text-rose-600 block">نیازمند پیش‌نویس سفارش</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">بچ‌های نزدیک انقضا (زیر ۶۰ روز)</span>
            <div className="text-2xl font-black text-amber-700 tabular-nums">
              ۱۲ بچ
            </div>
            <span className="text-[11px] text-amber-700 block">پیشنهاد حواله انتقالی به سایر سایت‌ها</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">روزهای پوشش موجودی</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              ۱۴.۵ روز
            </div>
            <span className="text-[11px] text-slate-500 block">بر اساس نرخ مصرف خالص</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">پیش‌نویس سفارش‌های باز (T1)</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۲ مورد
            </div>
            <span className="text-[11px] text-slate-400 block">منتظر بررسی داروساز</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. QLT: کیفیت، ایمنی و خطاها
  const renderQltContent = () => (
    <div key="module-qlt" className="space-y-6 animate-in fade-in duration-200" data-module="QLT">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <span>کیفیت، ایمنی بالینی، اعتباربخشی و وقایع ناخواسته (QLT)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ثبت وقایع، پیگیری اقدامات اصلاحی (CAPA) و ممیزی‌های سنجه‌ای
            </p>
          </div>
          <span className="text-xs text-slate-500">محیط محرمانه کیفیت بیمارستان</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">وقایع ناخواسته در حال تریاژ</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۴ مورد
            </div>
            <span className="text-[11px] text-slate-500 block">بررسی محرمانه ایمنی</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">برنامه‌های باز اصلاحی (CAPA)</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              ۲ برنامه
            </div>
            <span className="text-[11px] text-emerald-700 block">در حال ارزیابی اثربخشی</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">انطباق مستندات اعتباربخشی</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۹۲.۴٪
            </div>
            <span className="text-[11px] text-emerald-700 block">سنجه‌های دارای شواهد معتبر</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">شاخص رضایت مراجعین</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۸۶.۰٪
            </div>
            <span className="text-[11px] text-slate-400 block">نظرسنجی ترخیص ماهانه</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 5. AST: دارایی‌ها و تجهیزات
  const renderAstContent = () => (
    <div key="module-ast" className="space-y-6 animate-in fade-in duration-200" data-module="AST">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              <span>پایش دارایی‌ها، تجهیزات پزشکی و تأسیسات بیمارستان (AST)</span>
            </h2>
            <p className="text-xs text-slate-500">
              مدیریت آماده‌به‌کاری تجهیزات حیاتی (CMMS) در {scope.siteName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">تجهیزات پزشکی حیاتی</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۱۲۸ دستگاه
            </div>
            <span className="text-[11px] text-slate-500 block">سی‌تی‌اسکن، ام‌آر‌آی، ونتیلاتور</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">نرخ آماده‌به‌کاری (Uptime)</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              ۹۸.۴٪
            </div>
            <span className="text-[11px] text-emerald-700 block">بالاتر از هدف ۹۵٪</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">دستورکارهای باز نت پیشگیرانه</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۵ دستورکار
            </div>
            <span className="text-[11px] text-amber-700 block">سرویس دوره‌ای ۳۰ روزه</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">پایش کنتورهای تأسیساتی</span>
            <div className="text-base font-bold text-slate-900 pt-1">
              مصرف پایدار و بدون نوسان
            </div>
            <span className="text-[11px] text-slate-400 block">۹۴٪ پوشش برخط کنتورها</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 6. FIN: مالی و درآمد
  const renderFinContent = () => (
    <div key="module-fin" className="space-y-6 animate-in fade-in duration-200" data-module="FIN">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <span>مالی، درآمد بیمارستانی و تحلیل کسورات بیمه‌ای (FIN)</span>
            </h2>
            <p className="text-xs text-slate-500">
              تطبیق درآمد، پیگیری اعتراضات بیمه و ثبت کسورات در {scope.siteName}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">واحد پول: ریال ایران (IRR)</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">نرخ کسورات بیمه‌ای (Denial Rate)</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              ۳.۲٪
            </div>
            <span className="text-[11px] text-emerald-700 block">کاهش نسبت به ماه گذشته</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">اسناد بستری در انتظار رسیدگی</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۴۵۰ پرونده
            </div>
            <span className="text-[11px] text-slate-500 block">ارسال الکترونیک سپاس</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">مغایرت صورت‌حساب با منبع</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۰.۰٪
            </div>
            <span className="text-[11px] text-emerald-700 block">تطبیق کامل ریالی با HIS</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">تعهدات قراردادی سررسیدشده</span>
            <div className="text-2xl font-black text-amber-700 tabular-nums">
              ۱ قرارداد
            </div>
            <span className="text-[11px] text-amber-700 block">نیازمند بازبینی کارشناس</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 7. DAT: حاکمیت داده و قراردادها
  const renderDatContent = () => (
    <div key="module-dat" className="space-y-6 animate-in fade-in duration-200" data-module="DAT">
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <span>حاکمیت داده، یکپارچگی کانکتورها و کاتالوگ شاخص‌ها (DAT)</span>
            </h2>
            <p className="text-xs text-slate-500">
              دیده‌بانی کانکتورهای ادغام و کیفیت داده سلامت در {scope.siteName}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">میزکار ناظر داده (Data Steward)</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">کانکتورهای منبع در {scope.siteCode}</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              ۴ کانکتور
            </div>
            <span className="text-[11px] text-emerald-700 block">HIS، PACS، LIS و داروخانه</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">مغایرت‌های قرنطینه‌شده</span>
            <div className="text-2xl font-black text-amber-700 tabular-nums">
              ۱ رکورد
            </div>
            <span className="text-[11px] text-amber-700 block">واحد اندازه‌گیری نیازمند نگاشت</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">شاخص‌های حاکمیتی مصوب</span>
            <div className="text-2xl font-black text-teal-700 tabular-nums">
              ۱۴ شاخص
            </div>
            <span className="text-[11px] text-teal-700 block">نسخه ۱ مصوب دانشگاه</span>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">تبارشناسی داده (Lineage)</span>
            <div className="text-base font-bold text-slate-900 pt-1">
              ثبت کامل منبع تا گزارش
            </div>
            <span className="text-[11px] text-slate-400 block">قابلیت ردیابی محاسبات</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 8. EXE (پیش‌فرض): هوشمندی ارشد و تصمیم‌یاری راهبردی
  const renderExeContent = () => (
    <div key="module-exe" className="space-y-6 animate-in fade-in duration-200" data-module="EXE">
      {/* Executive Overview Header */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                داشبورد هوشمندی ارشد و تصمیم‌یاری راهبردی (EXE)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              خلاصه وضعیت شبکه درمانی دانشگاه، شاخص‌های کلیدی عملکرد و ارزیابی چندسایتی
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>گزارش جامع روزانه: ساعت ۰۷:۰۰ ثبت‌شده</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>۱۴ شاخص حاکمیتی مصوب</span>
            </span>
          </div>
        </div>

        {/* Executive KPI Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">ضریب اشغال میانگین شبکه</span>
            <div className="text-xl sm:text-2xl font-black text-teal-700 tabular-nums">
              ۷۸.۴٪
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              مجموع تخت‌های در دسترس شبکه
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">هشدارهای ریسک نیازمند اقدام</span>
            <div className="text-xl sm:text-2xl font-black text-amber-700 tabular-nums">
              ۲ هشدار
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-700 block">
              ۱ اورژانس، ۱ زنجیره تأمین
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">سایت‌های فعال در شبکه</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
              ۵ مرکز
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              ۴ بیمارستان + ستاد مرکزی
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-500 block">پیش‌نویس تصمیم‌یاری فعال</span>
            <div className="text-sm sm:text-base font-bold text-slate-800 pt-1">
              Memo T1-EXE-04
            </div>
            <span className="text-[10px] sm:text-[11px] text-teal-800 block">
              تخصیص سهمیه سرم‌های دارویی
            </span>
          </div>
        </div>
      </div>

      {/* Network Multi-Site Comparison Table (Clean, no pills, proper tabular numerals) */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>پایش تطبیقی مراکز درمانی دانشگاه علوم پزشکی شهید بهشتی</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              مطابق با استاندارد مقایسه چندسایتی حاکمیتی (REQ-EXE-002)
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            داده‌های قطعی ۲۴ ساعت گذشته
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium">
                <th className="py-2.5 px-3">نام مرکز درمانی</th>
                <th className="py-2.5 px-3">کد سایت</th>
                <th className="py-2.5 px-3 text-left">ظرفیت تخت مصوب</th>
                <th className="py-2.5 px-3 text-left">ضریب اشغال</th>
                <th className="py-2.5 px-3 text-left">میانه انتظار اورژانس</th>
                <th className="py-2.5 px-3 text-left">وضعیت اتصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'بیمارستان آیت‌الله طالقانی', code: 'SITE-TALEGHANI', beds: 540, occ: '۸۱.۲٪', wait: '۲۲ دقیقه', conn: 'برخط HIS/PACS' },
                { name: 'بیمارستان امام حسین (ع)', code: 'SITE-IMAM-HOSSEIN', beds: 620, occ: '۸۴.۵٪', wait: '۳۱ دقیقه', conn: 'برخط HIS/PACS' },
                { name: 'بیمارستان شهدای تجریش', code: 'SITE-SHOHADA', beds: 480, occ: '۷۵.۰٪', wait: '۱۹ دقیقه', conn: 'برخط HIS/PACS' },
                { name: 'مرکز تخصصی کودکان مفید', code: 'SITE-MOFID', beds: 260, occ: '۷۲.۳٪', wait: '۱۵ دقیقه', conn: 'برخط HIS/PACS' },
              ].map((site, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${site.code === scope.siteCode ? 'bg-teal-50/40 font-bold' : ''}`}>
                  <td className="py-3 px-3 text-slate-900 flex items-center gap-2">
                    <span>{site.name}</span>
                    {site.code === scope.siteCode && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-teal-600 text-white rounded font-normal">دامنه فعال</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{site.code}</td>
                  <td className="py-3 px-3 text-left tabular-nums text-slate-800">{site.beds} تخت</td>
                  <td className="py-3 px-3 text-left tabular-nums text-teal-800">{site.occ}</td>
                  <td className="py-3 px-3 text-left tabular-nums text-slate-700">{site.wait}</td>
                  <td className="py-3 px-3 text-left text-emerald-700 text-[11px]">{site.conn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto space-y-5 min-w-0 w-full" id="main-content-viewport">
      {/* Breadcrumb & Scope Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 truncate">
            <span className="truncate">{scope.orgName}</span>
            <span aria-hidden="true" className="text-slate-300 shrink-0">/</span>
            <span className="font-semibold text-teal-800 truncate">{scope.siteName}</span>
            <span aria-hidden="true" className="text-slate-300 shrink-0">/</span>
            <span className="text-slate-700 truncate">{currentModuleDef.shortTitle}</span>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
            <span className="truncate">{currentModuleDef.title}</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {currentModuleDef.key}
            </span>
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsScopeModalOpen(true)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">تغییر سایت ({scope.siteCode})</span>
          </button>
        </div>
      </div>

      {/* View State Playground Banner (مخصوص مرحله ۱ برای تست و بررسی ۴ حالت درخواستی) */}
      <div className="p-3 sm:p-3.5 bg-slate-100/80 border border-slate-200/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
          <span className="font-bold text-slate-900">وضعیت نمای صفحه (ارزیابی مرحله ۱):</span>
          <span className="text-slate-500 hidden sm:inline">
            برای بررسی هر یک از وضعیت‌های درخواستی کلیک کنید:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewState('normal')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewState === 'normal'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عادی (Normal)
          </button>

          <button
            type="button"
            onClick={() => setViewState('loading')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewState === 'loading'
                ? 'bg-amber-100 text-amber-900 font-bold shadow-xs border border-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            بارگذاری (Loading)
          </button>

          <button
            type="button"
            onClick={() => setViewState('empty')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewState === 'empty'
                ? 'bg-sky-100 text-sky-900 font-bold shadow-xs border border-sky-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            خالی (Empty)
          </button>

          <button
            type="button"
            onClick={() => setViewState('error')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewState === 'error'
                ? 'bg-rose-100 text-rose-900 font-bold shadow-xs border border-rose-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            خطا (Error)
          </button>
        </div>
      </div>

      {/* Render requested states dynamically */}
      {viewState === 'loading' && <LoadingState />}
      {viewState === 'empty' && <EmptyState />}
      {viewState === 'error' && <ErrorState />}

      {/* Normal State: Specific Module View */}
      {viewState === 'normal' && renderModuleContent()}
    </main>
  );
};
