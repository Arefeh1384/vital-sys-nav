import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, ClipboardList, Search, CheckCircle2, Clock, User as UserIcon, Link2, FileCheck2, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MODULES_CONFIG } from '../data/mockData';
import {
  PRIORITY_CLASS, PRIORITY_LABEL, TASK_STATUS_LABEL, ALERT_STATUS_LABEL,
  type TaskStatus, type AlertStatus, type Priority,
} from '../data/workData';
import { alertEvidence, taskEvidence, EVIDENCE_KIND_LABEL, type EvidenceItem } from '../data/evidenceData';
import { EmptyState } from './states/EmptyState';
import {demoStore} from '../phase6/store';
import {legacyAsPhase6} from '../phase6/Phase6';
import {canonicalTasks,unfinishedTask} from '../executive/taskProjection';
import { AlertOperations } from './ControlWorkflows';

const moduleTitle = (k: string) => MODULES_CONFIG.find(m => m.key === k)?.shortTitle ?? k;

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${className}`}>{children}</span>
);

const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  open: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
  done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const ALERT_STATUS_CLASS: Record<AlertStatus, string> = {
  new: 'bg-rose-100 text-rose-800 border-rose-200',
  acknowledged: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const Header: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onBack?: () => void }> = ({ icon, title, subtitle, onBack }) => (
  <div className="mb-6">
    {onBack && (
      <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold">
        <ArrowRight className="w-4 h-4" /> بازگشت به فهرست
      </button>
    )}
    <div className="flex items-center gap-3">
      <span className="p-2 rounded-xl bg-teal-100 text-teal-800">{icon}</span>
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-slate-900 break-words">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  </div>
);

function Filters<T extends string>({ value, onChange, options }: { value: T | 'all'; onChange: (v: T | 'all') => void; options: Record<T, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(['all', ...Object.keys(options)] as (T | 'all')[]).map(k => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${value === k ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          {k === 'all' ? 'همه' : options[k as T]}
        </button>
      ))}
    </div>
  );
}

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="relative w-full md:w-64">
    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder="جستجو در عنوان یا کد..." aria-label="جستجو در عنوان یا کد" dir="rtl"
      className="w-full text-right pr-9 pl-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
  </div>
);

export const TaskListView: React.FC = () => {
 const {tasks,scope,openWorkView,workView}=useApp();
 const routeFilter = workView?.kind === 'tasks' ? workView.filter : undefined;
 const [status,setStatus]=useState(()=>sessionStorage.getItem('him.tasks.status')|| (routeFilter==='unfinished'?'unfinished':'all'));const [q,setQ]=useState(()=>sessionStorage.getItem('him.tasks.search')||'');const [pageSize,setPageSize]=useState<25|50|100>(()=>{const n=Number(sessionStorage.getItem('him.tasks.pageSize'));return n===50||n===100?n:25});const [page,setPage]=useState(1);
 useEffect(()=>{sessionStorage.setItem('him.tasks.status',status);sessionStorage.setItem('him.tasks.search',q);sessionStorage.setItem('him.tasks.pageSize',String(pageSize));},[status,q,pageSize]);
 useEffect(()=>{if(routeFilter==='unfinished')setStatus('unfinished');},[routeFilter]);
 // One list and one detail page for legacy and Copilot-created tasks.
 const overrides=demoStore.tasks();
 const rows=[...tasks.map(t=>overrides.find(o=>o.id===t.id)||legacyAsPhase6(t)),...overrides.filter(t=>!tasks.some(l=>l.id===t.id))]
  .filter(t=>t.siteId===scope.siteId&&(status==='all'||(status==='unfinished'?unfinishedTask(t.status):t.status===status))&&(!q||t.title.includes(q)||t.id.toLowerCase().includes(q.toLowerCase())));
 const labels={open:'باز',assigned:'تخصیص‌یافته',in_progress:'در حال انجام',blocked:'مسدود',submitted_for_review:'در انتظار بررسی',completed:'تکمیل‌شده',canceled:'لغوشده'};
 return <div data-testid="task-list"><Header icon={<ClipboardList className="w-5 h-5"/>} title="فهرست وظایف" subtitle={`وظایف عملیاتی «${scope.siteName}» · داده نمایشی`}/>
 <div className="flex flex-wrap gap-3 mb-4"><select aria-label="فیلتر وضعیت" className="border rounded-lg p-2 text-sm" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="unfinished">انجام‌نشده</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><SearchBox value={q} onChange={v=>{setQ(v);setPage(1)}}/><select aria-label="تعداد در صفحه" className="border rounded-lg p-2 text-sm" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value) as 25|50|100);setPage(1)}}><option value={25}>۲۵ در صفحه</option><option value={50}>۵۰ در صفحه</option><option value={100}>۱۰۰ در صفحه</option></select><button type="button" className="border rounded-lg p-2 text-sm" onClick={()=>{setQ('');setStatus('all');setPage(1)}}>پاک کردن فیلترها</button></div><p className="mb-2 text-xs text-slate-500">{rows.length} وظیفه · جست‌وجو: {q||'همه'} · وضعیت: {status==='all'?'همه':status}</p>
 {rows.length===0?<EmptyState title="وظیفه‌ای یافت نشد"/>:<div className="bg-white border rounded-xl divide-y">{rows.slice((page-1)*pageSize,page*pageSize).map(t=><button key={t.id} className="w-full text-right flex justify-between p-4 hover:bg-slate-50 gap-3" onClick={()=>openWorkView({kind:'task',id:t.id})}><span><b>{t.title}</b><span className="block text-xs text-slate-500">{t.id} · {t.owner||t.queue||'بدون مسئول'}</span></span><span className="text-sm">{labels[t.status]}</span></button>)}</div>}{rows.length>pageSize&&<div className="mt-3 flex items-center gap-3 text-sm"><button className="border rounded p-2" disabled={page===1} onClick={()=>setPage(x=>x-1)}>قبلی</button><span>صفحه {page} از {Math.ceil(rows.length/pageSize)}</span><button className="border rounded p-2" disabled={page*pageSize>=rows.length} onClick={()=>setPage(x=>x+1)}>بعدی</button></div>}
 </div>;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="text-[11px] text-slate-500 mb-1">{label}</div>
    <div className="text-sm font-semibold text-slate-800">{children}</div>
  </div>
);

const NotFound: React.FC<{ onBack: () => void; text: string }> = ({ onBack, text }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
    <p className="text-sm text-slate-600 mb-4">{text}</p>
    <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold">بازگشت به فهرست</button>
  </div>
);

export const TaskDetailView: React.FC<{ id: string }> = ({ id }) => {
  const { tasks, alerts, scope, openWorkView, updateTaskStatus } = useApp();
  const t = tasks.find(x => x.id === id);
  const back = () => openWorkView({ kind: 'tasks' });
  if (!t || t.siteId !== scope.siteId) return <NotFound onBack={back} text="این وظیفه در دامنه کاری فعلی یافت نشد." />;
  const alert = t.alertId ? alerts.find(a => a.id === t.alertId) : undefined;

  return (
    <div data-testid="task-detail">
      <Header icon={<ClipboardList className="w-5 h-5" />} title={t.title} subtitle={`وظیفه ${t.code} · ${moduleTitle(t.module)}`} onBack={back} />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-2">شرح وظیفه</h2>
            <p className="text-sm text-slate-600 leading-7">{t.description}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">تاریخچه</h2>
            <ol className="space-y-3">
              {t.history.map((h, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400 tabular-nums shrink-0">{h.at}</span>
                  <span className="text-slate-700">{h.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <EvidencePackage items={taskEvidence(t, alert)} code={t.code} />
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 grid gap-3">
            <Field label="وضعیت"><Badge className={TASK_STATUS_CLASS[t.status]}>{TASK_STATUS_LABEL[t.status]}</Badge></Field>
            <Field label="اولویت"><Badge className={PRIORITY_CLASS[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge></Field>
            <Field label="مسئول"><span className="inline-flex items-center gap-1"><UserIcon className="w-4 h-4 text-slate-400" />{t.assignee}</span></Field>
            <Field label="سررسید">{t.dueDate}</Field>
            {alert && (
              <Field label="هشدار مرتبط">
                <button type="button" onClick={() => openWorkView({ kind: 'alert', id: alert.id })} className="inline-flex items-center gap-1 text-teal-700 hover:underline text-start">
                  <Link2 className="w-4 h-4 shrink-0" />{alert.title}
                </button>
              </Field>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-slate-800 mb-1">تغییر وضعیت</h2>
            {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map(s => (
              <button key={s} type="button" disabled={t.status === s} onClick={() => updateTaskStatus(t.id, s)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 disabled:bg-teal-600 disabled:text-white disabled:border-teal-600">
                {TASK_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlertListView: React.FC = () => {
 const {scope}=useApp();
 return <SiteAlertList key={scope.siteId||'none'}/>;
};
const SiteAlertList:React.FC = () => {
  const { alerts, scope, openWorkView, workView } = useApp();
  const storeKey = `him.alert.filters:${scope.siteId||'none'}`;
  const initial=()=>{try{return JSON.parse(sessionStorage.getItem(storeKey)||'{}') as Record<string,string>;}catch{return {} as Record<string,string>;}};
  const [status, setStatus] = useState<AlertStatus | 'all'>(()=>(['new','acknowledged','resolved'].includes(initial().status)?initial().status:'all') as AlertStatus|'all');
  const routeFilter = workView?.kind === 'alerts' ? workView.filter : undefined;
  const [activeOnly,setActiveOnly]=useState(()=>routeFilter==='active'||initial().activeOnly==='true');
  useEffect(()=>{setActiveOnly(routeFilter==='active');},[routeFilter]);
  const [severity, setSeverity] = useState<Priority | 'all'>(()=>(['critical','high','medium','low'].includes(initial().severity)?initial().severity:'all') as Priority|'all');
  const [q, setQ] = useState(()=>initial().q||'');
  useEffect(()=>{try{sessionStorage.setItem(storeKey,JSON.stringify({status,severity,q,activeOnly:String(activeOnly)}));}catch{}},[storeKey,status,severity,q,activeOnly]);
  const rows = useMemo(() => alerts.filter(a => a.siteId === scope.siteId
    && (!activeOnly || a.status !== 'resolved')
    && (status === 'all' || a.status === status)
    && (severity === 'all' || a.severity === severity)
    && (!q || a.title.includes(q) || a.code.toLowerCase().includes(q.toLowerCase()))), [alerts, scope.siteId, status, severity, q, activeOnly]);

  return (
    <div data-testid="alert-list">
      <Header icon={<Bell className="w-5 h-5" />} title="فهرست هشدارها" subtitle={`هشدارهای فعال و سوابق «${scope.siteName}»`} />
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <button type="button" aria-pressed={activeOnly} onClick={()=>setActiveOnly(v=>!v)} className={`rounded-lg px-3 py-1 text-xs border ${activeOnly?'bg-teal-600 text-white':'bg-white text-slate-700'}`}>فقط فعال</button><Filters value={status} onChange={setStatus} options={ALERT_STATUS_LABEL} />
          <SearchBox value={q} onChange={setQ} />
        </div>
        <Filters value={severity} onChange={setSeverity} options={PRIORITY_LABEL} />
      </div>
      {rows.length === 0 ? <EmptyState
        title={q || status !== 'all' || severity !== 'all' ? 'هشداری مطابق جستجو و فیلترها یافت نشد' : undefined}
        description={q || status !== 'all' || severity !== 'all' ? 'عبارت جستجو یا فیلترهای وضعیت و شدت را تغییر دهید.' : undefined}
        resetLabel="پاک‌کردن جستجو و فیلترها"
        onReset={() => { setQ(''); setStatus('all'); setSeverity('all'); setActiveOnly(false); }}
      /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map(a => (
            <button key={a.id} type="button" onClick={() => openWorkView({ kind: 'alert', id: a.id })}
              className="text-start bg-white border border-slate-200 rounded-2xl p-4 hover:border-teal-300 hover:shadow-sm transition">
              <div className="flex items-center justify-between gap-2 mb-2">
                <bdi dir="ltr" className="text-[11px] font-mono text-slate-400">{a.code}</bdi>
                <div className="flex gap-1.5">
                  <Badge className={PRIORITY_CLASS[a.severity]}>{PRIORITY_LABEL[a.severity]}</Badge>
                  <Badge className={ALERT_STATUS_CLASS[a.status]}>{ALERT_STATUS_LABEL[a.status]}</Badge>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-800">{a.title}</div>
              <div className="text-[11px] text-slate-500 mt-1">{moduleTitle(a.module)} · {a.raisedAt}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AlertDetailView: React.FC<{ id: string }> = ({ id }) => {
  const { alerts, tasks, scope, openWorkView, updateAlertStatus } = useApp();
  const [resolutionCode,setResolutionCode]=useState('');
  const [resolutionComment,setResolutionComment]=useState('');
  const a = alerts.find(x => x.id === id);
  const back = () => openWorkView({ kind: 'alerts' });
  if (!a || a.siteId !== scope.siteId) return <NotFound onBack={back} text="این هشدار در دامنه کاری فعلی یافت نشد." />;
  const linked = [...canonicalTasks(tasks).filter(t => tasks.some(original => original.id===t.id && original.alertId === a.id)),...demoStore.tasks().filter(t => t.siteId===scope.siteId && t.evidenceIds.includes(a.id) && !tasks.some(original=>original.id===t.id))];

  return (
    <div data-testid="alert-detail">
      <Header icon={<Bell className="w-5 h-5" />} title={a.title} subtitle={`هشدار ${a.code} · ${moduleTitle(a.module)}`} onBack={back} />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-2">شرح هشدار</h2>
            <p className="text-sm text-slate-600 leading-7">{a.description}</p>
          </div>
          {a.metric && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={`مقدار فعلی ${a.metric.label}`}><span className="text-rose-700 text-lg">{a.metric.value}</span></Field>
              <Field label="آستانه مجاز"><span className="text-lg">{a.metric.threshold}</span></Field>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">وظایف مرتبط</h2>
            {linked.length === 0 ? <p className="text-xs text-slate-500">وظیفه‌ای برای این هشدار ثبت نشده است.</p> : (
              <ul className="space-y-2">
                {linked.map(t => (
                  <li key={t.id}>
                    <button type="button" onClick={() => openWorkView({ kind: 'task', id: t.id })}
                      className="w-full text-start flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                      <span className="text-sm text-slate-800">{t.title}</span>
                      <Badge className={unfinishedTask(t.status) ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}>{t.status==='completed'||t.status==='done'?'تکمیل‌شده':t.status==='canceled'?'لغوشده':'در جریان'}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white border rounded-xl p-4 space-y-2"><h2 className="font-bold">خط زمانی هشدار</h2><p className="text-xs">ثبت اولیه: {a.raisedAt}</p>{(a.activity||[]).map((entry,i)=><p key={i} className="text-xs border-r-2 pr-2">{entry.text} · {entry.at} · عامل: {entry.actorName || 'نامشخص (ثبت قدیمی)'}{entry.actorId && <span dir="ltr"> ({entry.actorId})</span>}</p>)}{a.resolution&&<p className="text-xs">شاهد رفع: {a.resolution.comment}</p>}</div>
          <section className="rounded-xl border bg-white p-4 text-sm space-y-1" data-testid="anomaly-provenance"><h2 className="font-bold">زمینه تشخیص ناهنجاری · EXE-004</h2><p>نسخه آشکارساز: ثبت نشده / نیازمند تأیید</p><p>خط پایه و بازه مورد انتظار: ثبت نشده</p><p>بازه مقایسه و روند تاریخی: ثبت نشده</p><p>کیفیت داده و تازگی منبع بالادستی: نامشخص</p><p className="text-amber-800">آستانه هشدار جایگزین خط پایه آماری، مقایسه تاریخی یا مدل مصوب نیست.</p></section><EvidencePackage items={alertEvidence(a)} code={a.code} /><AlertOperations alert={a}/>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 grid gap-3">
            <Field label="وضعیت"><Badge className={ALERT_STATUS_CLASS[a.status]}>{ALERT_STATUS_LABEL[a.status]}</Badge></Field>
            <Field label="شدت"><Badge className={PRIORITY_CLASS[a.severity]}>{PRIORITY_LABEL[a.severity]}</Badge></Field>
            <Field label="زمان ثبت">{a.raisedAt}</Field>
            <Field label="منبع">{a.source}</Field>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-slate-800 mb-1">اقدامات</h2>
            <button type="button" disabled={a.status !== 'new'} onClick={() => updateAlertStatus(a.id, 'acknowledged')}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-800 disabled:opacity-40">
              تأیید دریافت هشدار
            </button>
            <label className="block text-xs">کد دلیل رفع<select aria-label="کد دلیل رفع هشدار" className="w-full border rounded p-2 mt-1" value={resolutionCode} onChange={e=>setResolutionCode(e.target.value)}><option value="">انتخاب دلیل</option>{[['condition_cleared','شرط هشدار برطرف شده'],['duplicate','تکراری'],['false_positive','هشدار اشتباه'],['source_corrected','منبع اصلاح شده'],['accepted_risk','پذیرش ریسک (نیازمند سرپرست)']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
            <label className="block text-xs">شاهد یا توضیح رفع<textarea aria-label="شاهد یا توضیح رفع" className="w-full border rounded p-2 mt-1" value={resolutionComment} onChange={e=>setResolutionComment(e.target.value)}/></label>
            {resolutionCode==='accepted_risk'&&<p role="alert" className="text-xs text-amber-700">پذیرش ریسک در این محیط بدون سرپرست احراز‌شده مسدود است.</p>}
            <button type="button" disabled={a.status === 'resolved'||!resolutionCode||!resolutionComment.trim()||resolutionCode==='accepted_risk'} onClick={() => updateAlertStatus(a.id, 'resolved',{reasonCode:resolutionCode,comment:resolutionComment})}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-40 inline-flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> علامت‌گذاری به‌عنوان برطرف‌شده
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EvidencePackage: React.FC<{ items: EvidenceItem[]; code: string }> = ({ items, code }) => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid="evidence-package">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold text-slate-800 inline-flex items-center gap-1.5"><FileCheck2 className="w-4 h-4 text-teal-600" />بسته شواهد</h2>
        <span className="text-[11px] text-slate-500"><bdi dir="ltr">{code}</bdi> · {items.length.toLocaleString('fa-IR')} مورد</span>
      </div>
      {items.length === 0 ? <p className="text-xs text-slate-500">شاهدی برای این مورد ثبت نشده است.</p> : (
        <ul className="space-y-2">
          {items.map(e => (
            <li key={e.id} className="border border-slate-100 rounded-xl">
              <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}
                className="w-full text-start flex items-center justify-between gap-2 p-3 hover:bg-slate-50 rounded-xl">
                <span className="min-w-0">
                  <span className="block text-sm text-slate-800">{e.title}</span>
                  <span className="block text-[11px] text-slate-500">{EVIDENCE_KIND_LABEL[e.kind]} · {e.source} · {e.capturedAt}</span>
                </span>
                <span className="text-[11px] text-teal-700 shrink-0">{open === e.id ? 'بستن' : 'مشاهده'}</span>
              </button>
              {open === e.id && (
                <div className="px-3 pb-3 text-xs text-slate-600 leading-6 space-y-1">
                  <p>{e.detail}</p>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900" data-testid="alert-evidence-provenance"><p>نسخه منبع/قرارداد: در fixture گزارش نشده</p><p>نسخه تعریف متریک و قاعده: در fixture گزارش نشده</p><p>مرز Snapshot و زمان cutoff: تأیید نشده (زمان ثبت شاهد جایگزین cutoff نیست)</p><p>فرض‌های محاسبه: ثبت نشده</p><p>محدودیت‌ها: منشأ و کامل‌بودن داده احراز نشده؛ فقط برای نمایش فرانت‌اند</p></div>
                  <p className="text-slate-400">اثر انگشت: <bdi dir="ltr" className="font-mono">{e.hash}</bdi></p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const NotificationCenterView: React.FC = () => {
  const { notifications, readNotificationIds, markNotificationsRead, openWorkView } = useApp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const rows = notifications.filter(n => !onlyUnread || !readNotificationIds.includes(n.id));
  const unread = notifications.filter(n => !readNotificationIds.includes(n.id)).length;
  return (
    <div data-testid="notification-center">
      <Header icon={<Inbox className="w-5 h-5" />} title="مرکز اعلان‌ها" subtitle={`${unread.toLocaleString('fa-IR')} اعلان خوانده‌نشده`} /><button type="button" className="mb-3 rounded border border-teal-300 px-3 py-2 text-sm text-teal-800" onClick={()=>openWorkView({kind:'spec-page',path:'/settings/notification-policy'})}>تنظیم پنجره تشدید و سیاست اعلان (پیش‌نویس)</button>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setOnlyUnread(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${!onlyUnread ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600'}`}>همه</button>
        <button type="button" onClick={() => setOnlyUnread(true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${onlyUnread ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600'}`}>خوانده‌نشده</button>
        <button type="button" disabled={unread === 0} onClick={() => markNotificationsRead(notifications.map(n => n.id))} className="ms-auto px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 disabled:opacity-40">علامت‌گذاری همه به‌عنوان خوانده‌شده</button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">اعلان خوانده‌نشده‌ای وجود ندارد.</p> : (
        <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {rows.map(n => {
            const isRead = readNotificationIds.includes(n.id);
            return (
              <li key={n.id}>
                <button type="button" onClick={() => { markNotificationsRead([n.id]); openWorkView(n.target); }}
                  className="w-full text-start flex items-start gap-3 p-4 hover:bg-slate-50">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isRead ? 'bg-transparent' : 'bg-teal-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${isRead ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>{n.title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{n.body}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">{n.at}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
