import React, { useState } from 'react';
import { AlertTriangle, RotateCw, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ErrorStateProps {
  code?: string;
  statusCode?: number;
  title?: string;
  detail?: string;
  requestId?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  code = 'DEPENDENCY_UNAVAILABLE',
  statusCode = 503,
  title = 'اختلال در اتصال به سرویس داده‌های سلامت',
  detail = 'سرور ادغام داده‌های بیمارستانی در حال حاضر پاسخگو نیست یا نشست ارتباطی با وقفه مواجه شده است. عملیات جهت جلوگیری از تناقض متوقف گردید.',
  requestId = 'req-sbmu-8201bfad-4200',
  onRetry,
}) => {
  const { setViewState } = useApp();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onRetry) {
        onRetry();
      } else {
        setViewState('normal');
      }
    }, 800);
  };

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 bg-white border border-rose-200 rounded-2xl shadow-xs min-w-0">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Error icon & header */}
        <div className="flex flex-col sm:flex-row items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                HTTP {statusCode}
              </span>
              <span className="font-mono text-[11px] text-rose-600 font-bold tracking-wider">
                {code}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 break-words">
              {title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed break-words">
              {detail}
            </p>
          </div>
        </div>

        {/* RFC 9457 Diagnostic Card */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] sm:text-xs font-mono text-slate-600 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 shrink-0 font-sans">شناسه درخواست:</span>
            <span className="text-slate-800 font-medium select-all break-all">{requestId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 shrink-0 font-sans">سیاست شکست:</span>
            <span className="text-rose-700 font-medium break-words">FAIL_CLOSED (توقف درخواست)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-400 shrink-0 font-sans">وضعیت بازتلاش:</span>
            <span className="text-emerald-700 font-medium font-sans">امکان تلاش مجدد امن وجود دارد</span>
          </div>
        </div>

        {/* Action Controls: Stacks cleanly on mobile without clipping */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setViewState('normal')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>انصراف و بازگشت به داشبورد</span>
          </button>

          <button
            type="button"
            disabled={retrying}
            onClick={handleRetry}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-75 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'در حال برقراری ارتباط...' : 'تلاش مجدد برای اتصال'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
