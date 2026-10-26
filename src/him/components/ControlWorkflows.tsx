import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../data/mockData';
import type { WorkAlert } from '../data/workData';
import { demoStore } from '../phase6/store';
import { TaskDrawer } from '../phase6/Phase6';

/** These drafts are strictly browser-local. They never change source, authorization or an alert's authoritative status. */
type ReviewRecord = { id: string; type: string; at: string; actorId: string; actor: string; detail: string; fields: Record<string,string> };
const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm mt-1';
const action = 'rounded-lg bg-teal-800 px-3 py-2 text-sm text-white disabled:opacity-40';
const note = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-900';
const stamp = () => new Date().toISOString();
function useReviewRecords(key: string) {
 const [rows,setRows] = useState<ReviewRecord[]>(()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}});
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(rows))}catch{/* In-memory only if storage denied. */}},[key,rows]);
 const add = (type:string,detail:string,fields:Record<string,string>,actor:{id:string;name:string}) => {
  const rec:ReviewRecord={id:`local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,detail,fields,at:stamp(),actorId:actor.id,actor:actor.name};
  setRows(prev=>[rec,...prev]);
 };
 return {rows,add};
}
function History({rows}:{rows:ReviewRecord[]}) {
 return <div className="space-y-2" data-testid="local-review-history"><h3 className="font-semibold text-sm">تاریخچه درخواست‌ها و بررسی‌های نمایشی</h3>{rows.length===0?<p className="text-xs text-slate-500">درخواستی ثبت نشده است.</p>:rows.map(r=><details key={r.id} className="rounded-lg border p-3 text-xs"><summary className="cursor-pointer font-semibold">{r.type} · {r.at} · {r.actor}</summary><p className="mt-2">{r.detail}</p>{Object.entries(r.fields).map(([k,v])=><p key={k}>{k}: {v}</p>)}<p className="text-amber-700">پیشنهاد نمایشی؛ اجرا و تأیید سازمانی انجام نشده است.</p></details>)}</div>;
}
function AlertOperationsContent({alert}:{alert:WorkAlert}) {
 const {scope,user,openWorkView}=useApp();
 const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add}=useReviewRecords(`him.synthetic.alert-review.v1:${scope.siteId}:${alert.id}:${current.id}`);
 const [assignee,setAssignee]=useState(''),[reason,setReason]=useState(''),[until,setUntil]=useState(''),[suppressUntil,setSuppressUntil]=useState(''),[suppressReason,setSuppressReason]=useState(''),[level,setLevel]=useState('supervisor');
 const [outcome,setOutcome]=useState('none'),[outcomeEvidence,setOutcomeEvidence]=useState(''),[taskOpen,setTaskOpen]=useState(false);
 const [playbook,setPlaybook]=useState('capacity_review'),[hypothesis,setHypothesis]=useState(''),[forEvidence,setForEvidence]=useState(''),[againstEvidence,setAgainstEvidence]=useState(''),[missing,setMissing]=useState(''),[reviewer,setReviewer]=useState(''),[conclusion,setConclusion]=useState('');
 const owners=DEMO_USERS.filter(u=>u.permittedSiteIds.includes(scope.siteId||''));
 const canExplain=reason.trim().length>=10;
 const log=(type:string,fields:Record<string,string>,detail:string)=>{add(type,detail,fields,current);setReason('')};
 return <section className="rounded-2xl border bg-white p-5 space-y-4" data-testid="alert-governed-controls">
  <h2 className="font-bold">پیگیری پاسخ به هشدار · EXE-04 / CTL-02</h2>
  <p className={note}>این کنترل‌ها درخواست و گزارش داخلی آزمایشی ثبت می‌کنند؛ تعویق، انتساب، تشدید یا تغییر وضعیت واقعی هشدار فقط پس از تأیید سامانه کنترل مجاز است. «مشاهده تغییر» هرگز اثبات اثرِ اقدام نیست.</p>
  <div className="grid sm:grid-cols-2 gap-3">
   <label className="block text-xs">مسئول پیشنهادی در دامنه فعلی<select className={input} value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">انتخاب مسئول</option>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label className="block text-xs">زمان پایان تعویق (درخواست)<input type="datetime-local" className={input} value={until} onChange={e=>setUntil(e.target.value)} /></label>
   <label className="block text-xs">سطح ارجاع<select className={input} value={level} onChange={e=>setLevel(e.target.value)}><option value="supervisor">سرپرست صف</option><option value="site_executive">مدیر بیمارستان</option><option value="governance">مسئول حاکمیت</option></select></label>
   <label className="block text-xs">نوع نتیجه مشاهده‌شده<select className={input} value={outcome} onChange={e=>setOutcome(e.target.value)}><option value="none">بدون اقدام</option><option value="attempted">اقدام تلاش‌شده</option><option value="completed_reported">تکمیل گزارش‌شده (تأییدنشده)</option><option value="observed_change">تغییر مشاهده‌شده (علیت اثبات نشده)</option></select></label>
   <label className="block text-xs sm:col-span-2">مرجع نتیجه/شاهد (برای تکمیل یا تغییر مشاهده‌شده الزامی)<input className={input} value={outcomeEvidence} onChange={e=>setOutcomeEvidence(e.target.value)} placeholder="شناسه شاهد / مرجع بررسی" /></label>
   <label className="block text-xs sm:col-span-2">دلیل و توضیحات (حداقل ۱۰ نویسه)<textarea aria-label="علت درخواست پیگیری هشدار" rows={2} className={input} value={reason} onChange={e=>setReason(e.target.value)} /></label>
  </div>
  <div className="flex flex-wrap gap-2">
   <button className={action} disabled={!canExplain||!assignee} onClick={()=>log('درخواست انتساب',{مسئول:owners.find(x=>x.id===assignee)?.name||assignee},reason)}>درخواست انتساب</button>
   <button className={action} disabled={!canExplain||!until||new Date(until).getTime()<=Date.now()} onClick={()=>log('درخواست تعویق',{تا:until},reason)}>درخواست تعویق با دلیل</button>
   <button className={action} disabled={!canExplain} onClick={()=>log('درخواست تشدید',{سطح:level},reason)}>درخواست تشدید</button>
   <button className={action} disabled={!canExplain||((outcome==='completed_reported'||outcome==='observed_change')&&!outcomeEvidence.trim())} onClick={()=>log('گزارش نتیجه',{نتیجه:outcome,شاهد:outcomeEvidence||'ثبت نشده'},reason)}>ثبت گزارش نتیجه</button>
   <button className={action} onClick={()=>setTaskOpen(true)}>ایجاد وظیفه مرتبط</button>
  </div>
  <div className="border-t pt-4 space-y-3" data-testid="alert-suppression-request"><h3 className="font-bold">درخواست سرکوب موقت هشدار · CTL-02</h3>
   <p className={note}>سرکوب در اینجا فقط درخواست آزمایشی است و وضعیت هشدار، اعلان یا تشدید عملیاتی را تغییر نمی‌دهد.</p>
   <label className="block text-xs">علت سرکوب (حداقل ۱۰ نویسه)<textarea className={input} value={suppressReason} onChange={e=>setSuppressReason(e.target.value)}/></label>
   <label className="block text-xs">انقضای سرکوب پیشنهادی<input type="datetime-local" className={input} value={suppressUntil} onChange={e=>setSuppressUntil(e.target.value)}/></label>
   <button type="button" className={action} disabled={suppressReason.trim().length<10||!suppressUntil||new Date(suppressUntil).getTime()<=Date.now()} onClick={()=>{log('درخواست سرکوب موقت',{انقضا:suppressUntil},suppressReason);setSuppressReason('');setSuppressUntil('')}}>ثبت درخواست سرکوب برای بازبینی</button>
  </div>
  <div className="border-t pt-4 space-y-3" data-testid="alert-investigation">
   <h3 className="font-bold">تحقیق مبتنی بر شواهد (پیش‌نویس)</h3>
   <label className="block text-xs">Playbook مصوب پیشنهادی<select className={input} value={playbook} onChange={e=>setPlaybook(e.target.value)}><option value="capacity_review">بازبینی ظرفیت (نمونه، غیرمصوب)</option><option value="source_quality">کیفیت و تازگی منبع (نمونه، غیرمصوب)</option></select></label>
   <div className="grid md:grid-cols-2 gap-3">
    {([['فرضیه',hypothesis,setHypothesis],['شواهد موافق',forEvidence,setForEvidence],['شواهد مخالف',againstEvidence,setAgainstEvidence],['شواهد ناموجود',missing,setMissing],['نتیجه پیشنهادی بازبین',conclusion,setConclusion]] as const).map(([label,value,set])=><label key={label} className="text-xs">{label}<textarea className={input} value={value} onChange={e=>set(e.target.value)} rows={2}/></label>)}
    <label className="text-xs">بازبین مستقل پیشنهادی<select className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{owners.filter(x=>x.id!==current.id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   </div>
   <button className={action} disabled={!hypothesis.trim()||!forEvidence.trim()||!againstEvidence.trim()||!missing.trim()||!reviewer||!conclusion.trim()} onClick={()=>log('درخواست بررسی مستقل',{playbook,فرضیه:hypothesis,موافق:forEvidence,مخالف:againstEvidence,مفقود:missing,بازبین:reviewer,جمع‌بندی:conclusion},'درخواست برای بازبینی مستقل؛ نتیجه تأیید نشده است.')}>ثبت پرونده تحقیق برای بازبینی مستقل</button>
  </div>
  <History rows={rows}/>
  <TaskDrawer source={taskOpen?{alertId:alert.id}:null} defaults={{title:`بررسی هشدار ${alert.code}`,description:`پیگیری مستقل هشدار ${alert.id}: ${alert.title}. مرجع شواهد باید مستقل تأیید شود.`}} close={()=>setTaskOpen(false)} created={t=>{setTaskOpen(false);add('ایجاد وظیفه',`وظیفه ${t.id} در پروتوتایپ ساخته شد.`,{taskId:t.id},current);openWorkView({kind:'task',id:t.id})}}/>
 </section>;
}
export function AlertOperations({alert}:{alert:WorkAlert}) {
 const {scope,user}=useApp();
 return <AlertOperationsContent key={`${scope.siteId}:${user?.id}:${alert.id}`} alert={alert}/>;
}
export function NotificationPolicyWorkspace() {
 const {scope,user}=useApp();
 return <NotificationPolicyContent key={`${scope.siteId}:${user?.id}`} />;
}
function NotificationPolicyContent() {
 const {scope,user}=useApp();const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add}=useReviewRecords(`him.synthetic.notification-policy.v1:${scope.siteId}:${current.id}`);
 const [version,setVersion]=useState(''),[severity,setSeverity]=useState('high'),[minutes,setMinutes]=useState('30'),[fallback,setFallback]=useState(''),[reviewer,setReviewer]=useState(''),[reason,setReason]=useState('');
 const okay=version.trim()&&Number.isInteger(Number(minutes))&&Number(minutes)>0&&Number(minutes)<=10080&&fallback.trim()&&reviewer.trim()&&reviewer!==current.id&&reason.trim().length>=10;
 return <section dir="rtl" className="space-y-4" data-testid="notification-policy"><h1 className="text-xl font-bold">سیاست اعلان و مهلت تشدید · CTL-009</h1><p className={note}>فقط پیش‌نویس تنظیمات ذخیره می‌شود. ارسال کانال بیرونی و اعمال سیاست واقعی غیرفعال است؛ مرورگر هیچ زمان‌بند تشدید معتبری ندارد.</p>
  <p className="text-sm">بیمارستان: {scope.siteName} · کانال مجاز نمونه: اعلان داخلی</p><div className="grid sm:grid-cols-2 gap-3">
   <label className="text-xs">نسخه سیاست *<input className={input} value={version} onChange={e=>setVersion(e.target.value)}/></label>
   <label className="text-xs">شدت هدف<select className={input} value={severity} onChange={e=>setSeverity(e.target.value)}><option value="critical">بحرانی</option><option value="high">بالا</option><option value="medium">متوسط</option><option value="low">پایین</option></select></label>
   <label className="text-xs">مهلت تأیید قبل از تشدید (دقیقه)*<input type="number" min="1" max="10080" className={input} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
   <label className="text-xs">صف جانشین *<input className={input} value={fallback} onChange={e=>setFallback(e.target.value)}/></label>
   <label className="text-xs">شناسه بازبین مستقل *<input className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}/></label>
   <label className="text-xs">علت تغییر *<textarea className={input} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </div><button className={action} disabled={!okay} onClick={()=>add('درخواست بازبینی سیاست اعلان','اعمال سیاست منوط به تصویب مستقل است.',{version, severity,minutes,fallback,reviewer,reason},current)}>ذخیره درخواست بازبینی سیاست</button><History rows={rows}/>
 </section>;
}
export function AuditWorkspace() {
 const {scope,user}=useApp();
 return <AuditContent key={`${scope.siteId}:${user?.id}`} />;
}
function AuditContent() {
 const {scope,user,openWorkView,alerts,tasks}=useApp();const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add}=useReviewRecords(`him.synthetic.audit-request.v1:${scope.siteId}:${current.id}`);
 const [search,setSearch]=useState(''),[kind,setKind]=useState('all'),[reason,setReason]=useState(''),[reviewer,setReviewer]=useState('');
 const events=[...alerts.filter(x=>x.siteId===scope.siteId).flatMap(x=>(x.activity||[]).map(v=>({id:x.id,type:'alert',date:v.at,description:v.text}))),...tasks.filter(x=>x.siteId===scope.siteId).flatMap(x=>x.history.map(v=>({id:x.id,type:'task',date:v.at,description:v.text})))];
 const filtered=events.filter(e=>(kind==='all'||e.type===kind)&&(`${e.id} ${e.description}`.toLowerCase().includes(search.toLowerCase())));
 return <section dir="rtl" className="space-y-4" data-testid="audit-workspace"><h1 className="text-xl font-bold">ممیزی و بازبینی تمامیت · PLT-04</h1>
 <p className={note}>فقط تاریخچه وقایع نمایشی این مرورگر قابل جست‌وجو است. این اطلاعات مهر دیجیتال، زنجیره custody یا خروجی Audit رسمی ندارند؛ Batch #1048 صرفاً متن نمونه بوده و وضعیت امضا مستقل تأیید نشده است.</p>
 <div className="grid sm:grid-cols-3 gap-3"><label className="text-xs">جستجوی رخداد / مرجع<input aria-label="جستجوی رویداد ممیزی" className={input} value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="text-xs">نوع رویداد<select className={input} value={kind} onChange={e=>setKind(e.target.value)}><option value="all">همه</option><option value="alert">هشدار</option><option value="task">وظیفه</option></select></label><label className="text-xs">دامنه جاری<input className={input} readOnly value={scope.siteName}/></label></div>
 <p className="text-xs">نمایش {filtered.length} رویداد محصول (غیرقابل استناد به‌عنوان Audit)</p>
 <div className="max-h-64 overflow-y-auto space-y-2">{filtered.length?filtered.map((e,i)=><p key={`${e.id}:${i}`} className="rounded border p-2 text-xs">{e.date} · {e.type} · {e.id}: {e.description}</p>):<p className="text-sm text-slate-500">رویدادی در داده‌های فعلی یافت نشد.</p>}</div>
 <div className="rounded border p-3 space-y-2"><h2 className="font-semibold">بررسی تمامیت و خروجی کنترل‌شده</h2><p className="text-xs">وضعیت امضا: نامعلوم · digest و anchor مستقل: موجود نیست · احراز دسترسی export: متصل نیست.</p>
 <label className="block text-xs">شناسه بازبین مستقل<input className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}/></label><label className="block text-xs">هدف قانونی/عملیاتی درخواست<input className={input} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <button className={action} disabled={reviewer.trim().length===0||reviewer===current.id||reason.trim().length<10} onClick={()=>add('درخواست بررسی تمامیت/خروجی','بدون داده امضاشده و کنترل دسترسی، هیچ فایل ممیزی صادر نشده است.',{reviewer,reason,search,kind},current)}>ثبت درخواست بازبینی و خروجی</button><button className="ms-2 rounded border p-2 text-sm" onClick={()=>openWorkView({kind:'spec-page',path:'/settings/governance'})}>تصمیم‌ها و نگهداری سوابق</button>
 </div><History rows={rows}/>
 </section>;
}
export function CompensationRequest({actionId,code,executed}:{actionId:string;code:string;executed:boolean}) {
 const {scope,user}=useApp();
 return <CompensationContent key={`${scope.siteId}:${user?.id}:${actionId}`} actionId={actionId} code={code} executed={executed}/>;
}
function CompensationContent({actionId,code,executed}:{actionId:string;code:string;executed:boolean}) {
 const {scope,user}=useApp();const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add}=useReviewRecords(`him.synthetic.compensation.v1:${scope.siteId}:${actionId}:${current.id}`);
 const [mode,setMode]=useState('review'),[owner,setOwner]=useState(''),[reason,setReason]=useState(''),[evidence,setEvidence]=useState(''),[reviewer,setReviewer]=useState('');
 const valid=owner.trim()&&reason.trim().length>=20&&evidence.trim()&&reviewer.trim()&&reviewer!==current.id;
 return <section data-testid="compensation-workflow" className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 text-sm">
  <h3 className="font-bold">جبران یا بازیابی کنترل‌شده پس از نهایی‌شدن اقدام</h3>
  <p>وضعیت اقدام اصلی {code} تغییر نمی‌کند. {executed?'نتیجه اجرا در پرونده اصلی ثبت شده است؛':'عدم اجرای قطعی در پرونده اصلی ثبت شده است؛'} برگشت خودکار و ارسال مجدد مجاز نیست. امکان جبران در مقصد نامعلوم است؛ مالک سامانه منبع باید آن را بررسی کند.</p>
  <div className="grid sm:grid-cols-2 gap-3">
   <label className="text-xs">نوع درخواست<select className={input} value={mode} onChange={e=>setMode(e.target.value)}><option value="review">بررسی امکان جبران با پیشنهاد جداگانه</option><option value="manual">فرایند بازیابی دستی توسط مالک منبع</option><option value="irreversible">ثبت وضعیت بالقوه برگشت‌ناپذیر</option></select></label>
   <label className="text-xs">مسئول سامانه منبع *<input className={input} value={owner} onChange={e=>setOwner(e.target.value)} /></label>
   <label className="text-xs">شناسه بازبین مستقل *<input className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)} /></label>
   <label className="text-xs">مرجع نتیجه اجرا و شاهد *<input className={input} value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
   <label className="text-xs sm:col-span-2">دلیل و دامنه اثر جبران (حداقل ۲۰ نویسه) *<textarea className={input} rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </div>
  <button className={action} disabled={!valid} onClick={()=>add('درخواست بازیابی/جبران','صرفاً درخواست داخلی غیرالزام‌آور؛ هیچ اثر جدیدی در مقصد انجام نشده است.',{originalAction:actionId,mode,owner,reviewer,evidence,reason},current)}>ثبت درخواست مستقل جبران/بازیابی</button>
  <p className="text-xs">هر پیشنهاد جبران واقعی باید شناسه مستقل، Diff مستقل، گیت و تأییدهای جدید داشته باشد؛ این درخواست جانشین مجوز T3 نیست.</p>
  <History rows={rows}/>
 </section>;
}
