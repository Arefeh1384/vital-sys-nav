import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Check, 
  Lock, 
  Bed, 
  MapPin, 
  X,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SITES_DATA, CURRENT_ORGANIZATION } from '../data/mockData';

export const ScopeModal: React.FC = () => {
  const { 
    user, 
    scope, 
    isScopeModalOpen, 
    setIsScopeModalOpen, 
    switchSite 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isScopeModalOpen) return null;

  const filteredSites = SITES_DATA.filter(site => 
    site.name.includes(searchQuery) || 
    site.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.typeLabel.includes(searchQuery)
  );

  const handleSelectSite = (siteId: string) => {
    const success = switchSite(siteId);
    if (success) {
      setIsScopeModalOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => setIsScopeModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title on right, close control clearly visible on left */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 bg-teal-600 text-white rounded-xl shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                انتخاب دامنه کاری (Scope Selection)
              </h2>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                {CURRENT_ORGANIZATION.legalTitle} — تفکیک مرز داده‌ها و ایزولاسیون سایت
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScopeModalOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors shrink-0"
            title="بستن پنجره"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Information Card */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100/70 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
            <Layers className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">سازمان: <strong>{CURRENT_ORGANIZATION.name}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>نقش جاری: <strong>{user?.roleTitle.split(' ')[0]}</strong></span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام بیمارستان، کد سایت درمانی یا نوع مرکز..."
              className="w-full pr-10 pl-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Sites List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 min-w-0">
          {filteredSites.map((site) => {
            const isPermitted = user?.permittedSiteIds.includes(site.id) ?? false;
            const isCurrent = scope.siteId === site.id;

            return (
              <div
                key={site.id}
                onClick={() => isPermitted && handleSelectSite(site.id)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30'
                    : isPermitted
                    ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                        {site.name}
                      </span>
                      <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {site.code}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-teal-600 text-white font-medium flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>سایت فعال</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-500">{site.typeLabel}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                      {site.activeBeds ? (
                        <div className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>ظرفیت: <strong className="text-slate-700 tabular-nums">{site.activeBeds}</strong> تخت فعال</span>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{site.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permission badge / Action Button */}
                  <div className="shrink-0 flex items-center justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {!isPermitted ? (
                      <div className="flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>عدم دسترسی سازمانی</span>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSite(site.id);
                        }}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs w-full sm:w-auto text-center"
                      >
                        انتخاب این سایت
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSites.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              هیچ مرکز درمانی مطابق با عبارت جستجو یافت نشد.
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] truncate">* با تغییر سایت، داده‌های جاری با رعایت تفکیک محلی نوسازی می‌شوند.</span>
          <button
            type="button"
            onClick={() => setIsScopeModalOpen(false)}
            className="px-3 py-1.5 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg shrink-0 mr-2"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
