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
import {useShellLanguage} from './useShellLanguage';

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
    setActiveModule,
    notifications,
    readNotificationIds
  } = useApp();
  const [lang,setLang] = useShellLanguage();
  const [calendar,setCalendar] = useState<'persian'|'gregory'>(()=>{try{return localStorage.getItem('him.ui.calendar')==='gregory'?'gregory':'persian';}catch{return 'persian';}});
  const [timeZone,setTimeZone] = useState<'Asia/Tehran'|'UTC'>(()=>{try{return localStorage.getItem('him.ui.timeZone')==='UTC'?'UTC':'Asia/Tehran';}catch{return 'Asia/Tehran';}});
  const updateCalendar=(v:'persian'|'gregory')=>{setCalendar(v);try{localStorage.setItem('him.ui.calendar',v);}catch{/* optional */}window.dispatchEvent(new Event('him:preferences'));};
  const updateTimeZone=(v:'Asia/Tehran'|'UTC')=>{setTimeZone(v);try{localStorage.setItem('him.ui.timeZone',v);}catch{/* optional */}window.dispatchEvent(new Event('him:preferences'));};
  const displayDate=new Intl.DateTimeFormat(lang==='en'?'en-US':'fa-IR',{calendar,weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone}).format(new Date());
  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const [commandOpen,setCommandOpen]=useState(false);
  const [commandQuery,setCommandQuery]=useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStateMenuOpen, setIsStateMenuOpen] = useState(false);


  return (
    <header className="min-h-16 bg-white border-b border-slate-200/80 px-2 py-2 sm:px-4 md:px-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 select-none min-w-0 max-w-full">
      {/* Zone 1: Brand & Toggle */}
      <div className="order-1 flex items-center gap-1 sm:gap-3 shrink-0 min-w-0">
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
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-tight">
              HIM-OS
            </span>
            <span className="text-[11px] text-slate-500 leading-tight hidden sm:inline">
              {lang==='en'?'Healthcare intelligence':'سامانه هوشمندی سلامت'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Scope Selector Interactive Bar (Center) */}
      <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-xl mx-0 sm:mx-auto flex items-center justify-center min-w-0 px-0 sm:px-1">
        <button
          type="button"
          onClick={() => setIsScopeModalOpen(true)}
          className="group w-full sm:w-auto flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all shadow-2xs hover:border-teal-400 min-w-0 max-w-full"
          title={lang==='en'?'Change hospital/site scope':'تغییر محدوده سازمانی یا سایت بیمارستانی'}
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

      <button type="button" data-testid="global-command-search" onClick={()=>setCommandOpen(true)} aria-label="جستجوی سراسری و فرمان" className="hidden xl:inline-flex rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-teal-50">جستجوی سراسری / فرمان</button>
      {commandOpen&&<div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-3 pt-16" role="dialog" aria-modal="true" aria-label="جستجوی سراسری و فرمان" onClick={()=>setCommandOpen(false)}><div className="w-full max-w-lg rounded-xl border bg-white p-4 space-y-3 shadow-lg" dir="rtl" onClick={e=>e.stopPropagation()}><div className="flex justify-between"><h2 className="font-bold">جستجوی مسیرهای برنامه</h2><button type="button" onClick={()=>setCommandOpen(false)}>بستن</button></div><input autoFocus className="w-full rounded-lg border p-2 text-sm" placeholder="جستجوی نام بخش یا فرمان…" value={commandQuery} onChange={e=>setCommandQuery(e.target.value)}/><p className="text-xs text-amber-900">فقط جستجوی فرمان‌ها و مسیرهای همین نمونه؛ این کادر متن پرونده بیمار، اسناد محرمانه یا داده فراتر از دامنه مجاز را جست‌وجو نمی‌کند.</p><div className="max-h-64 overflow-auto space-y-1">{([{name:'داشبورد اجرایی',kind:'executive-dashboard'},{name:'فهرست وظایف',kind:'tasks'},{name:'فهرست هشدارها',kind:'alerts'},{name:'مرکز اعلان‌ها',kind:'notifications'},{name:'پیشنهادهای اقدام',kind:'proposals'},{name:'یادداشت‌های تصمیم',kind:'memos'},{name:'کوپایلت',kind:'copilot'}] as const).filter(x=>x.name.includes(commandQuery.trim())).map(x=><button type="button" key={x.kind} onClick={()=>{if(x.kind==='executive-dashboard')setActiveModule('EXE');else openWorkView({kind:x.kind});setCommandOpen(false);setCommandQuery('')}} className="block w-full rounded border p-2 text-right text-sm hover:bg-slate-50">{x.name}</button>)}</div></div></div>}
      {/* Zone 3: Date, State Tester & User Profile */}
      <div className="order-2 sm:order-3 flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Persian Calendar */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans">{displayDate}</span>
        </div>

        {/* View State Switcher for User to test normal, loading, empty, error */}
        <div className="relative hidden sm:block">
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
              {viewState === 'normal' && (lang==='en'?'Normal':'نمای عادی')}
              {viewState === 'loading' && (lang==='en'?'Loading':'لودینگ')}
              {viewState === 'empty' && (lang==='en'?'Empty':'داده خالی')}
              {viewState === 'error' && (lang==='en'?'Error':'حالت خطا')}
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

        <label className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600">
          <span className="hidden sm:inline">{lang==='en'?'Language':'زبان'}</span>
          <select aria-label="Language / زبان" value={lang} onChange={e=>setLang(e.target.value as 'fa'|'en')} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
            <option value="fa">فارسی · RTL</option><option value="en">English · LTR</option>
          </select>
        </label>
        <label className="hidden md:flex items-center gap-1 text-xs text-slate-600">{lang==='en'?'Calendar':'تقویم'}
          <select aria-label="Calendar system / نوع تقویم" value={calendar} onChange={e=>updateCalendar(e.target.value as 'persian'|'gregory')} className="rounded-lg border p-1.5 bg-white"><option value="persian">Jalali</option><option value="gregory">Gregorian</option></select>
        </label>
        <label className="hidden xl:flex items-center gap-1 text-xs text-slate-600">{lang==='en'?'Timezone':'منطقه زمانی'}
          <select aria-label="Display timezone / منطقه زمانی" value={timeZone} onChange={e=>updateTimeZone(e.target.value as 'Asia/Tehran'|'UTC')} className="rounded-lg border p-1.5 bg-white"><option value="Asia/Tehran">Asia/Tehran</option><option value="UTC">UTC</option></select>
        </label>
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
              className="fixed inset-x-2 top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto sm:absolute sm:inset-x-auto sm:left-0 sm:top-auto sm:mt-2 w-auto sm:w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in space-y-2 text-xs"
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-600">{user?.roleTitle}</div>
                <div className="text-[10px] text-slate-400 font-mono">شناسه: {user?.personnelId} · {user?.email}</div>
              </div>

              <div className="px-2 pt-2 space-y-2 border-t" aria-label="تنظیمات نمایش">
                <label className="block">{lang==='en'?'Language':'زبان'}<select aria-label="Profile language" className="mt-1 w-full rounded-lg border p-2" value={lang} onChange={e=>setLang(e.target.value as 'fa'|'en')}><option value="fa">فارسی (RTL)</option><option value="en">English (LTR)</option></select></label>
                <label className="block">{lang==='en'?'Calendar':'تقویم'}<select aria-label="Profile calendar" className="mt-1 w-full rounded-lg border p-2" value={calendar} onChange={e=>updateCalendar(e.target.value as 'persian'|'gregory')}><option value="persian">Jalali</option><option value="gregory">Gregorian</option></select></label>
                <label className="block">{lang==='en'?'Timezone':'منطقه زمانی'}<select aria-label="Profile timezone" className="mt-1 w-full rounded-lg border p-2" value={timeZone} onChange={e=>updateTimeZone(e.target.value as 'Asia/Tehran'|'UTC')}><option value="Asia/Tehran">Asia/Tehran</option><option value="UTC">UTC</option></select></label>
                <p className="text-amber-800 text-[10px]">این تنظیمات فقط نحوه نمایش تاریخ را تغییر می‌دهد؛ مبنای ذخیره داده ثابت است.</p>
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
