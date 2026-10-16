import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  LogOut, 
  Bell, 
  Calendar, 
  SlidersHorizontal,
  Menu,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../data/mockData';

export const Header: React.FC = () => {
  const { 
    user, 
    scope, 
    setIsScopeModalOpen, 
    logout, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    viewState,
    setViewState,
    loginAsDemoUser,
    showNotification,
    openWorkView,
    notifications,
    readNotificationIds
  } = useApp();
  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStateMenuOpen, setIsStateMenuOpen] = useState(false);

  // Persian date representation (e.g., سه‌شنبه ۲۲ مهر ۱۴۰۵)
  const currentPersianDate = 'سه‌شنبه، ۲۲ مهر ۱۴۰۵';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Zone 1: Brand & Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title={sidebarCollapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            H
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-tight">
              HIM-OS
            </span>
            <span className="text-[11px] text-slate-500 leading-tight hidden sm:inline">
              سامانه هوشمندی سلامت
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Scope Selector Interactive Bar (Center) */}
      <div className="flex-1 max-w-xs sm:max-w-xl mx-auto flex items-center justify-center min-w-0 px-1">
        <button
          type="button"
          onClick={() => setIsScopeModalOpen(true)}
          className="group flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all shadow-2xs hover:border-teal-400 min-w-0 max-w-full"
          title="تغییر محدوده سازمانی یا سایت بیمارستانی"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="text-right min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                {scope.siteName}
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] bg-slate-200/70 text-slate-600 px-1 py-0.2 rounded shrink-0 hidden xs:inline">
                {scope.siteCode}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 leading-none truncate hidden sm:block">
              {scope.orgName}
            </div>
          </div>

          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 mr-0.5" />
        </button>
      </div>

      {/* Zone 3: Date, State Tester & User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Persian Calendar */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans">{currentPersianDate}</span>
        </div>

        {/* View State Switcher for User to test normal, loading, empty, error */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsStateMenuOpen(!isStateMenuOpen);
              setIsUserMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              viewState === 'normal'
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : viewState === 'loading'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : viewState === 'empty'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
            title="تغییر وضعیت نمای صفحه (بررسی حالتهای درخواستی مرحله ۱)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {viewState === 'normal' && 'نمای عادی'}
              {viewState === 'loading' && 'لودینگ'}
              {viewState === 'empty' && 'داده خالی'}
              {viewState === 'error' && 'حالت خطا'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isStateMenuOpen && (
            <div 
              className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 text-xs z-40 space-y-1 animate-in fade-in"
              onMouseLeave={() => setIsStateMenuOpen(false)}
            >
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                بررسی حالت‌های صفحه (مرحله ۱):
              </div>
              <button
                type="button"
                onClick={() => { setViewState('normal'); setIsStateMenuOpen(false); }}
                className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                  viewState === 'normal' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>حالت عادی (Normal)</span>
                {viewState === 'normal' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
              </button>
              <button
                type="button"
                onClick={() => { setViewState('loading'); setIsStateMenuOpen(false); }}
                className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                  viewState === 'loading' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>حالت لودینگ (Loading)</span>
                {viewState === 'loading' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>}
              </button>
              <button
                type="button"
                onClick={() => { setViewState('empty'); setIsStateMenuOpen(false); }}
                className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                  viewState === 'empty' ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>حالت خالی (Empty)</span>
                {viewState === 'empty' && <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>}
              </button>
              <button
                type="button"
                onClick={() => { setViewState('error'); setIsStateMenuOpen(false); }}
                className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                  viewState === 'error' ? 'bg-rose-50 text-rose-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>حالت خطا (RFC 9457)</span>
                {viewState === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          type="button"
          onClick={() => openWorkView({ kind: 'notifications' })}
          data-testid="open-notification-center"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="اعلانات سامانه"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && <span className="min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] leading-4 text-center absolute -top-0.5 -left-0.5 ring-2 ring-white tabular-nums">{unreadCount.toLocaleString('fa-IR')}</span>}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsStateMenuOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              {user ? user.name.slice(0, 1) : 'U'}
            </div>
            <div className="text-right hidden xl:block">
              <div className="text-xs font-bold text-slate-900 line-clamp-1">{user?.name}</div>
              <div className="text-[10px] text-slate-500 line-clamp-1">{user?.roleTitle}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {isUserMenuOpen && (
            <div 
              className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in space-y-2 text-xs"
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-600">{user?.roleTitle}</div>
                <div className="text-[10px] text-slate-400 font-mono">شناسه: {user?.personnelId} · {user?.email}</div>
              </div>

              <div className="px-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400">تغییر سریع کاربر برای تست نقش‌ها:</span>
                <div className="mt-1 space-y-1">
                  {DEMO_USERS.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { loginAsDemoUser(u); setIsUserMenuOpen(false); }}
                      className={`w-full text-right p-1.5 rounded flex items-center justify-between text-[11px] ${
                        user?.id === u.id ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{u.name} ({u.roleTitle.split(' ')[0]})</span>
                      {user?.id === u.id && <UserCheck className="w-3.5 h-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { logout(); setIsUserMenuOpen(false); }}
                  className="w-full text-right px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب کاربری</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
