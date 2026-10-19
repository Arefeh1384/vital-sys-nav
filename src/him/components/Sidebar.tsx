import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  PackageOpen, 
  ShieldAlert, 
  Cpu, 
  CreditCard, 
  Database, 
  LockKeyhole,
  CheckCircle2,
  ShieldCheck,
  Bot,
  ChevronRight,
  ChevronLeft,
  Building,
  X,
  ClipboardList,
  Bell,
  ClipboardCheck,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MODULES_CONFIG } from '../data/mockData';
import { ModuleKey } from '../types';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    scope,
    workView,
    openWorkView,
    tasks,
    alerts
  } = useApp();

  const handleModuleClick = (key: ModuleKey) => {
    setActiveModule(key);
    // On mobile viewports, auto-collapse sidebar drawer after selection
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const getIcon = (name: string, isSelected: boolean) => {
    const props = { className: `w-5 h-5 shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}` };
    switch (name) {
      case 'LayoutDashboard': return <LayoutDashboard {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'PackageOpen': return <PackageOpen {...props} />;
      case 'ShieldAlert': return <ShieldAlert {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'CreditCard': return <CreditCard {...props} />;
      case 'Database': return <Database {...props} />;
      case 'LockKeyhole': return <LockKeyhole {...props} />;
      default: return <LayoutDashboard {...props} />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop when sidebar is expanded on mobile screens */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-35 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar element:
          - On mobile: hidden if collapsed; fixed slide-over drawer if open (never squeezing the main content).
          - On desktop (md+): in-flow flex container (w-64 or w-16).
      */}
      <aside
        className={`bg-white border-l border-slate-200/80 transition-all duration-200 flex flex-col select-none ${
          sidebarCollapsed
            ? 'hidden md:flex md:w-16 shrink-0 z-20'
            : 'fixed inset-y-0 right-0 z-40 w-72 shadow-2xl md:shadow-none md:static md:w-64 shrink-0'
        }`}
      >
        {/* Mobile-only header with close button */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
              H
            </span>
            <span className="text-xs font-bold text-slate-800">
              منوی ماژول‌های سامانه
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="بستن منو"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Scope Summary Card in Sidebar (when not collapsed) */}
        {!sidebarCollapsed && (
          <div className="p-3 m-3 bg-slate-50 border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-teal-100 text-teal-800 rounded">
                <Building className="w-3.5 h-3.5" />
              </span>
              <div className="overflow-hidden min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {scope.siteName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  محدوده: {scope.siteCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
          <div>
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 tracking-wider">
                ماژول‌های هوشمندی و عملیات
              </div>
            )}

            <nav className="space-y-1">
              {MODULES_CONFIG.map((mod) => {
                const isSelected = !workView && activeModule === mod.key;

                return (
                  <button
                    key={mod.key}
                    type="button"
                    data-module={mod.key}
                    data-testid={`sidebar-item-${mod.key}`}
                    onClick={() => handleModuleClick(mod.key as ModuleKey)}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border border-teal-200/80 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                    title={sidebarCollapsed ? `${mod.title} (${mod.key})` : undefined}
                  >
                    {getIcon(mod.iconName, isSelected)}
                    
                    {!sidebarCollapsed && (
                      <div className="flex-1 text-right overflow-hidden min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{mod.shortTitle}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal shrink-0">
                            {mod.key}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Active highlight line in RTL */}
                    {isSelected && (
                      <span className="w-1 h-5 rounded-l-full bg-teal-600 absolute left-0 top-1/2 -translate-y-1/2"></span>
                    )}
                  </button>
                );
              })}
            </nav>
            <nav className="space-y-1 mt-1">
              {([
                { kind: 'proposals', label: 'پیشنهادهای اقدام', Icon: ClipboardCheck },
                { kind: 'approvals', label: 'صف تأییدهای من', Icon: ShieldCheck },
                { kind: 'journal', label: 'ژورنال اقدام', Icon: History },
                { kind: 'copilot', label: 'کوپایلت', Icon: Bot },
              ] as const).map(({ kind, label, Icon }) => {
                const selected = workView?.kind === kind || (kind === 'proposals' && workView?.kind === 'proposal');
                return <Button key={kind} variant="ghost" data-testid={`sidebar-item-${kind}`}
                  title={label} aria-label={label} aria-pressed={selected}
                  onClick={() => { openWorkView({ kind }); if (window.innerWidth < 768) setSidebarCollapsed(true); }}
                  className={`w-full justify-start gap-3 h-auto px-3 py-2.5 text-xs font-semibold ${selected ? 'bg-action-brand/10 text-action-brand' : 'text-muted-foreground'}`}>
                  <Icon className="size-5 shrink-0" />{!sidebarCollapsed && <span>{label}</span>}
                </Button>;
              })}
            </nav>
          </div>

          <div>
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 tracking-wider">کارتابل</div>
            )}
            <nav className="space-y-1">
              {([
                { kind: 'tasks', label: 'فهرست وظایف', Icon: ClipboardList, count: tasks.filter(t => t.siteId === scope.siteId && t.status !== 'done').length },
                { kind: 'alerts', label: 'فهرست هشدارها', Icon: Bell, count: alerts.filter(a => a.siteId === scope.siteId && a.status === 'new').length },
              ] as const).map(({ kind, label, Icon, count }) => {
                const sel = workView?.kind === kind || workView?.kind === kind.slice(0, -1);
                return (
                  <button key={kind} type="button" data-testid={`sidebar-item-${kind}`}
                    onClick={() => { openWorkView({ kind }); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarCollapsed(true); }}
                    title={sidebarCollapsed ? label : undefined}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${sel ? 'bg-teal-50 text-teal-900 border border-teal-200/80 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}`}>
                    <Icon className={`w-5 h-5 shrink-0 ${sel ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!sidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                        <span className="truncate">{label}</span>
                        {count > 0 && <span className="text-[10px] px-1.5 rounded-full bg-rose-100 text-rose-700 shrink-0 tabular-nums">{count.toLocaleString('fa-IR')}</span>}
                      </div>
                    )}
                    {sel && <span className="w-1 h-5 rounded-l-full bg-teal-600 absolute left-0 top-1/2 -translate-y-1/2"></span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* System Footer info & collapse toggle (desktop only) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {!sidebarCollapsed && (
            <div className="space-y-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>محیط ایزوله پایلوت (Air-Gapped)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                نسخه هسته: HIM-OS v1.2 (F0/F1)
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors text-xs"
            title={sidebarCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
          >
            {sidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span>جمع کردن نوار ناوبری</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
