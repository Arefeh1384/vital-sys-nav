import React from 'react';
import { Inbox, RefreshCw, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EmptyStateProps {
  title?: string | undefined;
  description?: string | undefined;
  onReset?: (() => void) | undefined;
  resetLabel?: string | undefined;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'هیچ داده یا رویداد فعالی در این دامنه یافت نشد',
  description = 'برای سایت و فیلترهای زمانی انتخاب‌شده، در حال حاضر رکوردی در سرورهای محلی ثبت نشده است.',
  onReset,
  resetLabel = 'بازنشانی به نمای عادی',
}) => {
  const { scope, setIsScopeModalOpen, setViewState } = useApp();

  return (
    <div className="w-full p-12 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
      <div className="max-w-md mx-auto space-y-4">
        {/* Visual icon container */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <Inbox className="w-8 h-8 stroke-[1.5]" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>

        {/* Current Scope info */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span>دامنه فعال: <strong>{scope.siteName}</strong> ({scope.siteCode})</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsScopeModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            تغییر سایت بیمارستانی
          </button>
          
          <button
            type="button"
            onClick={onReset || (() => setViewState('normal'))}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{resetLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
