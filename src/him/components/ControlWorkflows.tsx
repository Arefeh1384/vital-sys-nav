import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../data/mockData';
import type { WorkAlert } from '../data/workData';
import { demoStore } from '../phase6/store';
import { TaskDrawer } from '../phase6/Phase6';

/** These drafts are strictly browser-local. They never change source, authorization or an alert's authoritative status. */
type ReviewRecord = { id: string; type: string; at: string; actorId: string; actor: string; detail: string; fields: Record<string,string>; state?: 'requested'|'approved_synthetic'; reviewerId?: string; reviewedAt?: string; reviewedBy?: string };
const LOCAL_DEMO_DISCLAIMER = 'صرفاً سناریوی نمایشی قابل‌ردیابی در همین مرورگر؛ بدون تغییر در داده اصلی، مجوز، اعلان یا سامانه عملیاتی.';
const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm mt-1';
const action = 'rounded-lg bg-teal-800 px-3 py-2 text-sm text-white disabled:opacity-40';
const note = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-900';
const stamp = () => new Date().toISOString();
function useReviewRecords(key: string) {
 const [rows,setRows] = useState<ReviewRecord[]>(()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}});
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(rows))}catch{/* In-memory only if storage denied. */}},[key,rows]);
 const add = (type:string,detail:string,fields:Record<string,string>,actor:{id:string;name:string}) => {
  const rec:ReviewRecord={id:`local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,detail,fields,at:stamp(),actorId:actor.id,actor:actor.name,state:'requested',reviewerId:fields.reviewer};
  setRows(prev=>[rec,...prev]);
 };
 const approve=(id:string,reviewer:{id:string;name:string})=>{setRows(prev=>prev.map(r=>r.id===id&&r.state!=='approved_synthetic'&&r.reviewerId===reviewer.id&&r.actorId!==reviewer.id?{...r,state:'approved_synthetic',reviewedBy:reviewer.name,reviewedAt:stamp()}:r))};
 return {rows,add,approve};
}
function History({rows,current,onApprove}:{rows:ReviewRecord[];current?:{id:string;name:string};onApprove?:(id:string,reviewer:{id:string;name:string})=>void}) {
 return <div className="space-y-2" data-testid="local-review-history"><h3 className="font-semibold text-sm">تاریخچه درخواست‌ها و بررسی‌های نمایشی</h3>{rows.length===0?<p className="text-xs text-slate-500">درخواستی ثبت نشده است.</p>:rows.map(r=><details key={r.id} className="rounded-lg border p-3 text-xs"><summary className="cursor-pointer font-semibold">{r.type} · {r.at} · {r.actor} · {r.state==='approved_synthetic'?'تأیید مستقل نمایشی':'در انتظار بازبینی'}</summary><p className="mt-2">{r.detail}</p>{Object.entries(r.fields).filter(([k])=>k!=='eventsJson').map(([k,v])=><p key={k}>{k}: {v}</p>)}{r.reviewedBy&&<p>بازبین: {r.reviewedBy} · {r.reviewedAt}</p>}{r.state!=='approved_synthetic'&&r.reviewerId&&current?.id===r.reviewerId&&current.id!==r.actorId&&onApprove&&<button type="button" className={action} data-testid="independent-mock-approval" onClick={()=>onApprove(r.id,current)}>بازبینی و تأیید مستقل در شبیه‌سازی</button>}<p className="text-amber-700">{LOCAL_DEMO_DISCLAIMER}</p></details>)}</div>;
}
function AlertOperationsContent({alert}:{alert:WorkAlert}) {
 const {scope,user,openWorkView}=useApp();
 const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add,approve}=useReviewRecords(`him.synthetic.alert-review.v2:${scope.siteId}:${alert.id}`);
 const [assignee,setAssignee]=useState(''),[reason,setReason]=useState(''),[until,setUntil]=useState(''),[suppressUntil,setSuppressUntil]=useState(''),[suppressReason,setSuppressReason]=useState(''),[level,setLevel]=useState('supervisor');
 const [outcome,setOutcome]=useState('none'),[outcomeEvidence,setOutcomeEvidence]=useState(''),[taskOpen,setTaskOpen]=useState(false);
 const [playbook,setPlaybook]=useState('capacity_review'),[hypothesis,setHypothesis]=useState(''),[forEvidence,setForEvidence]=useState(''),[againstEvidence,setAgainstEvidence]=useState(''),[missing,setMissing]=useState(''),[reviewer,setReviewer]=useState(''),[conclusion,setConclusion]=useState('');
 const owners=DEMO_USERS.filter(u=>u.permittedSiteIds.includes(scope.siteId||''));
 const [approvalReviewer,setApprovalReviewer]=useState('');
 const canExplain=reason.trim().length>=10;
 const log=(type:string,fields:Record<string,string>,detail:string)=>{add(type,detail,{...fields,reviewer:fields.reviewer||approvalReviewer},current);setReason('')};
 const approved=rows.filter(r=>r.state==='approved_synthetic');
 const latest=(type:string)=>approved.find(r=>r.type===type);
 const mockAssignee=latest('درخواست انتساب')?.fields.مسئول||'بدون تغییر';
 const snooze=latest('درخواست تعویق')?.fields.تا;
 const suppression=latest('درخواست سرکوب موقت')?.fields.انقضا;
 const snoozed=!!snooze&&new Date(snooze).getTime()>Date.now();
 const suppressed=!!suppression&&new Date(suppression).getTime()>Date.now();
 const mockLevel=latest('درخواست تشدید')?.fields.سطح||'ارجاع انجام نشده';
 const mockOutcome=latest('گزارش نتیجه')?.fields.نتیجه||'ثبت نشده';
 return <section className="rounded-2xl border bg-white p-5 space-y-4" data-testid="alert-governed-controls">
  <h2 className="font-bold">پیگیری پاسخ به هشدار · EXE-04 / CTL-02</h2>
  <p className={note}>این کنترل‌ها درخواست و گزارش داخلی آزمایشی ثبت می‌کنند؛ تعویق، انتساب، تشدید یا تغییر وضعیت واقعی هشدار فقط پس از تأیید سامانه کنترل مجاز است. «مشاهده تغییر» هرگز اثبات اثرِ اقدام نیست.</p>
  <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm" data-testid="alert-approved-synthetic-state">
   <strong>وضعیت مؤثر شبیه‌سازی (فقط درخواست تأییدشده مستقل)</strong><p>انتساب: {mockAssignee} · تعویق: {snoozed?`تا ${snooze}`:'غیرفعال'} · سرکوب: {suppressed?`تا ${suppression}`:'غیرفعال'} · ارجاع: {mockLevel} · نتیجه: {mockOutcome}</p>
   <p className="text-xs">وضعیت واقعی هشدار دست‌نخورده است؛ انقضا در زمان مشاهده مجدد محاسبه می‌شود.</p>
  </div>
  <label className="block text-xs">بازبین مستقل همه درخواست‌های پاسخ به هشدار *<select className={input} value={approvalReviewer} onChange={e=>setApprovalReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{owners.filter(u=>u.id!==current.id).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
  <div className="grid sm:grid-cols-2 gap-3">
   <label className="block text-xs">مسئول پیشنهادی در دامنه فعلی<select className={input} value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">انتخاب مسئول</option>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label className="block text-xs">زمان پایان تعویق (درخواست)<input type="datetime-local" className={input} value={until} onChange={e=>setUntil(e.target.value)} /></label>
   <label className="block text-xs">سطح ارجاع<select className={input} value={level} onChange={e=>setLevel(e.target.value)}><option value="supervisor">سرپرست صف</option><option value="site_executive">مدیر بیمارستان</option><option value="governance">مسئول حاکمیت</option></select></label>
   <label className="block text-xs">نوع نتیجه مشاهده‌شده<select className={input} value={outcome} onChange={e=>setOutcome(e.target.value)}><option value="none">بدون اقدام</option><option value="attempted">اقدام تلاش‌شده</option><option value="completed_reported">تکمیل گزارش‌شده (تأییدنشده)</option><option value="observed_change">تغییر مشاهده‌شده (علیت اثبات نشده)</option></select></label>
   <label className="block text-xs sm:col-span-2">مرجع نتیجه/شاهد (برای تکمیل یا تغییر مشاهده‌شده الزامی)<input className={input} value={outcomeEvidence} onChange={e=>setOutcomeEvidence(e.target.value)} placeholder="شناسه شاهد / مرجع بررسی" /></label>
   <label className="block text-xs sm:col-span-2">دلیل و توضیحات (حداقل ۱۰ نویسه)<textarea aria-label="علت درخواست پیگیری هشدار" rows={2} className={input} value={reason} onChange={e=>setReason(e.target.value)} /></label>
  </div>
  <div className="flex flex-wrap gap-2">
   <button className={action} disabled={!canExplain||!assignee||!approvalReviewer} onClick={()=>log('درخواست انتساب',{مسئول:owners.find(x=>x.id===assignee)?.name||assignee},reason)}>درخواست انتساب</button>
   <button className={action} disabled={!canExplain||!approvalReviewer||!until||new Date(until).getTime()<=Date.now()} onClick={()=>log('درخواست تعویق',{تا:until},reason)}>درخواست تعویق با دلیل</button>
   <button className={action} disabled={!canExplain||!approvalReviewer} onClick={()=>log('درخواست تشدید',{سطح:level},reason)}>درخواست تشدید</button>
   <button className={action} disabled={!canExplain||!approvalReviewer||((outcome==='completed_reported'||outcome==='observed_change')&&!outcomeEvidence.trim())} onClick={()=>log('گزارش نتیجه',{نتیجه:outcome,شاهد:outcomeEvidence||'ثبت نشده'},reason)}>ثبت گزارش نتیجه</button>
   <button className={action} onClick={()=>setTaskOpen(true)}>ایجاد وظیفه مرتبط</button>
  </div>
  <div className="border-t pt-4 space-y-3" data-testid="alert-suppression-request"><h3 className="font-bold">درخواست سرکوب موقت هشدار · CTL-02</h3>
   <p className={note}>سرکوب در اینجا فقط درخواست آزمایشی است و وضعیت هشدار، اعلان یا تشدید عملیاتی را تغییر نمی‌دهد.</p>
   <label className="block text-xs">علت سرکوب (حداقل ۱۰ نویسه)<textarea className={input} value={suppressReason} onChange={e=>setSuppressReason(e.target.value)}/></label>
   <label className="block text-xs">انقضای سرکوب پیشنهادی<input type="datetime-local" className={input} value={suppressUntil} onChange={e=>setSuppressUntil(e.target.value)}/></label>
   <button type="button" className={action} disabled={!approvalReviewer||suppressReason.trim().length<10||!suppressUntil||new Date(suppressUntil).getTime()<=Date.now()} onClick={()=>{log('درخواست سرکوب موقت',{انقضا:suppressUntil},suppressReason);setSuppressReason('');setSuppressUntil('')}}>ثبت درخواست سرکوب برای بازبینی</button>
  </div>
  <div className="border-t pt-4 space-y-3" data-testid="alert-investigation">
   <h3 className="font-bold">تحقیق مبتنی بر شواهد (پیش‌نویس)</h3>
   <label className="block text-xs">Playbook مصوب پیشنهادی<select className={input} value={playbook} onChange={e=>setPlaybook(e.target.value)}><option value="capacity_review">بازبینی ظرفیت (نمونه، غیرمصوب)</option><option value="source_quality">کیفیت و تازگی منبع (نمونه، غیرمصوب)</option></select></label>
   <div className="grid md:grid-cols-2 gap-3">
    {([['فرضیه',hypothesis,setHypothesis],['شواهد موافق',forEvidence,setForEvidence],['شواهد مخالف',againstEvidence,setAgainstEvidence],['شواهد ناموجود',missing,setMissing],['نتیجه پیشنهادی بازبین',conclusion,setConclusion]] as const).map(([label,value,set])=><label key={label} className="text-xs">{label}<textarea className={input} value={value} onChange={e=>set(e.target.value)} rows={2}/></label>)}
    <label className="text-xs">بازبین مستقل پیشنهادی<select className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{owners.filter(x=>x.id!==current.id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   </div>
   <button className={action} disabled={!hypothesis.trim()||!forEvidence.trim()||!againstEvidence.trim()||!missing.trim()||!reviewer||!conclusion.trim()} onClick={()=>log('درخواست بررسی مستقل',{reviewer,playbook,فرضیه:hypothesis,موافق:forEvidence,مخالف:againstEvidence,مفقود:missing,بازبین:reviewer,جمع‌بندی:conclusion},'درخواست برای بازبینی مستقل؛ نتیجه تأیید نشده است.')}>ثبت پرونده تحقیق برای بازبینی مستقل</button>
  </div>
  <History rows={rows} current={current} onApprove={approve}/>
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
 const {rows,add,approve}=useReviewRecords(`him.synthetic.notification-policy.v2:${scope.siteId}`);
 const [version,setVersion]=useState(''),[severity,setSeverity]=useState('high'),[minutes,setMinutes]=useState('30'),[fallback,setFallback]=useState(''),[reviewer,setReviewer]=useState(''),[reason,setReason]=useState('');
 const [scenarioAt,setScenarioAt]=useState(''),[scenarioAck,setScenarioAck]=useState(false);
 const effective=rows.find(r=>r.type==='درخواست بازبینی سیاست اعلان'&&r.state==='approved_synthetic');
 const dueTime=effective&&scenarioAt?new Date(scenarioAt).getTime()+Number(effective.fields.minutes)*60000:NaN;
 const triggered=Number.isFinite(dueTime)&&!scenarioAck&&Date.now()>=dueTime;
 const okay=version.trim()&&Number.isInteger(Number(minutes))&&Number(minutes)>0&&Number(minutes)<=10080&&fallback.trim()&&DEMO_USERS.some(u=>u.id===reviewer&&u.id!==current.id&&u.permittedSiteIds.includes(scope.siteId||''))&&reason.trim().length>=10;
 return <section dir="rtl" className="space-y-4" data-testid="notification-policy"><h1 className="text-xl font-bold">سیاست اعلان و مهلت تشدید · CTL-009</h1><p className={note}>بازبینی مستقل، اعمال سیاست و مهلت ارجاع فقط شبیه‌سازی محلی هستند. هیچ اعلان، سرور یا زمان‌بند عملیاتی اجرا نمی‌شود.</p>
  <p className="text-sm">بیمارستان: {scope.siteName} · کانال مجاز نمونه: اعلان داخلی</p><div className="grid sm:grid-cols-2 gap-3">
   <label className="text-xs">نسخه سیاست *<input className={input} value={version} onChange={e=>setVersion(e.target.value)}/></label>
   <label className="text-xs">شدت هدف<select className={input} value={severity} onChange={e=>setSeverity(e.target.value)}><option value="critical">بحرانی</option><option value="high">بالا</option><option value="medium">متوسط</option><option value="low">پایین</option></select></label>
   <label className="text-xs">مهلت تأیید قبل از تشدید (دقیقه)*<input type="number" min="1" max="10080" className={input} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
   <label className="text-xs">صف جانشین *<input className={input} value={fallback} onChange={e=>setFallback(e.target.value)}/></label>
   <label className="text-xs">بازبین مستقل *<select className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(u=>u.id!==current.id&&u.permittedSiteIds.includes(scope.siteId||'')).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label className="text-xs">علت تغییر *<textarea className={input} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </div><button className={action} disabled={!okay} onClick={()=>add('درخواست بازبینی سیاست اعلان','اعمال سیاست منوط به تصویب مستقل است.',{version, severity,minutes,fallback,reviewer,reason},current)}>ذخیره درخواست بازبینی سیاست</button><div className="rounded-lg border border-sky-200 p-3 space-y-2" data-testid="synthetic-notification-escalation">
 <p className="font-semibold text-sm">سناریوی سیاست تأییدشده نمونه</p>
 {effective?<><p className="text-xs">نسخه {effective.fields.version} · شدت {effective.fields.severity} · صف جانشین {effective.fields.fallback} · زمان پاسخ {effective.fields.minutes} دقیقه</p><label className="block text-xs">زمان شروع هشدار فرضی<input type="datetime-local" className={input} value={scenarioAt} onChange={e=>setScenarioAt(e.target.value)}/></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={scenarioAck} onChange={e=>setScenarioAck(e.target.checked)}/>تأیید پاسخ دریافت شده</label><p className="text-xs">{!Number.isFinite(dueTime)?'زمان شروع را انتخاب کنید.':scenarioAck?'ارجاع شبیه‌سازی‌شده لغو شد (پاسخ تأییدشده).':triggered?`مهلت گذشته؛ انتقال نمایشی به ${effective.fields.fallback}`:`هنوز مهلت باقی است؛ پایان ${new Date(dueTime).toLocaleString('fa-IR')}`}</p></>:<p className="text-xs">سیاست مستقل تأییدشده‌ای در این بیمارستان موجود نیست.</p>}
 </div><History rows={rows} current={current} onApprove={approve}/>
 </section>;
}
export function AuditWorkspace() {
 const {scope,user}=useApp();
 return <AuditContent key={`${scope.siteId}:${user?.id}`} />;
}
function AuditContent() {
 const {scope,user,openWorkView,alerts,tasks}=useApp();const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add,approve}=useReviewRecords(`him.synthetic.audit-request.v2:${scope.siteId}`);
 const [exportResult,setExportResult]=useState('');
 const [search,setSearch]=useState(''),[kind,setKind]=useState('all'),[reason,setReason]=useState(''),[reviewer,setReviewer]=useState('');
 const events=[...alerts.filter(x=>x.siteId===scope.siteId).flatMap(x=>(x.activity||[]).map(v=>({id:x.id,type:'alert',date:v.at,description:v.text}))),...tasks.filter(x=>x.siteId===scope.siteId).flatMap(x=>x.history.map(v=>({id:x.id,type:'task',date:v.at,description:v.text})))];
 const filtered=events.filter(e=>(kind==='all'||e.type===kind)&&(`${e.id} ${e.description}`.toLowerCase().includes(search.toLowerCase())));
 const downloadApproved=async(r:ReviewRecord)=>{
  if(r.actorId!==current.id||r.state!=='approved_synthetic')return;
  try {
   const list=JSON.parse(r.fields.eventsJson||'[]') as typeof events;
   const evidence: {eventId:string;prevHash:string;sha256:string;payload:{id:string;type:string;date:string;description:string}}[]=[];
   let previous='GENESIS';
   for(const [i,record] of list.entries()){
    const canonical=JSON.stringify({index:i,previous,record});
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
    const sha256=Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('');
    evidence.push({eventId:`${record.type}:${record.id}:${i}`,prevHash:previous,sha256,payload:record});previous=sha256;
   }
   const manifest={kind:'UNSIGNED_BROWSER_DEMO_NOT_OFFICIAL_AUDIT',requestId:r.id,siteId:scope.siteId,filters:{search:r.fields.search,kind:r.fields.kind},requestedAt:r.at,reviewedAt:r.reviewedAt,reviewedBy:r.reviewedBy,exportedAt:stamp(),algorithm:'SHA-256 demo canonical chain',recordCount:evidence.length,terminalHash:previous,disclaimer:LOCAL_DEMO_DISCLAIMER,records:evidence};
   const url=URL.createObjectURL(new Blob([JSON.stringify(manifest,null,2)],{type:'application/json;charset=utf-8'}));
   const anchor=document.createElement('a');anchor.href=url;anchor.download=`HIM-OS-DEMO-AUDIT-${r.id}.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
   setExportResult(`تمامیت محلی ${evidence.length} رکورد بررسی و فایل JSON نمایشی ساخته شد؛ بدون امضای دیجیتال یا anchor مستقل.`);
  }catch(e){setExportResult(`خروجی تولید نشد: ${String(e)}`)}
 };
 return <section dir="rtl" className="space-y-4" data-testid="audit-workspace"><h1 className="text-xl font-bold">ممیزی و بازبینی تمامیت · PLT-04</h1>
 <p className={note}>فقط تاریخچه وقایع نمایشی این مرورگر قابل جست‌وجو است. این اطلاعات مهر دیجیتال، زنجیره custody یا خروجی Audit رسمی ندارند؛ Batch #1048 صرفاً متن نمونه بوده و وضعیت امضا مستقل تأیید نشده است.</p>
 <div className="grid sm:grid-cols-3 gap-3"><label className="text-xs">جستجوی رخداد / مرجع<input aria-label="جستجوی رویداد ممیزی" className={input} value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="text-xs">نوع رویداد<select className={input} value={kind} onChange={e=>setKind(e.target.value)}><option value="all">همه</option><option value="alert">هشدار</option><option value="task">وظیفه</option></select></label><label className="text-xs">دامنه جاری<input className={input} readOnly value={scope.siteName}/></label></div>
 <p className="text-xs">نمایش {filtered.length} رویداد محصول (غیرقابل استناد به‌عنوان Audit)</p>
 <div className="max-h-64 overflow-y-auto space-y-2">{filtered.length?filtered.map((e,i)=><p key={`${e.id}:${i}`} className="rounded border p-2 text-xs">{e.date} · {e.type} · {e.id}: {e.description}</p>):<p className="text-sm text-slate-500">رویدادی در داده‌های فعلی یافت نشد.</p>}</div>
 <div className="rounded border p-3 space-y-2"><h2 className="font-semibold">بررسی تمامیت و خروجی کنترل‌شده</h2><p className="text-xs">وضعیت امضا: نامعلوم · digest و anchor مستقل: موجود نیست · احراز دسترسی export: متصل نیست.</p>
 <label className="block text-xs">بازبین مستقل<select className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(u=>u.id!==current.id&&u.permittedSiteIds.includes(scope.siteId||'')).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label className="block text-xs">هدف قانونی/عملیاتی درخواست<input className={input} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <button className={action} disabled={!DEMO_USERS.some(u=>u.id===reviewer&&u.id!==current.id&&u.permittedSiteIds.includes(scope.siteId||''))||reason.trim().length<10} onClick={()=>add('درخواست بررسی تمامیت/خروجی','بدون داده امضاشده و کنترل دسترسی، هیچ فایل ممیزی صادر نشده است.',{reviewer,reason,search,kind,eventsJson:JSON.stringify(filtered)},current)}>ثبت درخواست بازبینی و خروجی</button><button className="ms-2 rounded border p-2 text-sm" onClick={()=>openWorkView({kind:'spec-page',path:'/settings/governance'})}>تصمیم‌ها و نگهداری سوابق</button>
 </div><div className="space-y-2" data-testid="audit-controlled-export"><h3 className="font-semibold">خروجی‌های بررسی‌شده و زنجیره محلی SHA-256</h3>{rows.filter(r=>r.type==='درخواست بررسی تمامیت/خروجی'&&r.actorId===current.id).map(r=><div className="rounded border p-2 text-xs" key={r.id}><span>{r.id} · {r.state==='approved_synthetic'?'تأیید نمایشی':'در انتظار بازبین مستقل'}</span><button className={`${action} ms-2`} disabled={r.state!=='approved_synthetic'} onClick={()=>void downloadApproved(r)}>محاسبه تمامیت و دریافت JSON نمایشی</button></div>)}{exportResult&&<p className="text-xs">{exportResult}</p>}</div><History rows={rows} current={current} onApprove={approve}/>
 </section>;
}
export function CompensationRequest({actionId,code,executed}:{actionId:string;code:string;executed:boolean}) {
 const {scope,user}=useApp();
 return <CompensationContent key={`${scope.siteId}:${user?.id}:${actionId}`} actionId={actionId} code={code} executed={executed}/>;
}
function CompensationContent({actionId,code,executed}:{actionId:string;code:string;executed:boolean}) {
 const {scope,user}=useApp();const current={id:user?.id||'guest',name:user?.name||'کاربر ناشناس'};
 const {rows,add,approve}=useReviewRecords(`him.synthetic.compensation.v2:${scope.siteId}:${actionId}`);
 const [mode,setMode]=useState('review'),[owner,setOwner]=useState(''),[reason,setReason]=useState(''),[evidence,setEvidence]=useState(''),[reviewer,setReviewer]=useState('');
 const [proposedDiff,setProposedDiff]=useState(''),[secondReviewer,setSecondReviewer]=useState(''),[gateEvidence,setGateEvidence]=useState('');
 const approvedRequest=rows.find(r=>r.type==='درخواست بازیابی/جبران'&&r.actorId===current.id&&r.state==='approved_synthetic');
 const compensationProposals=rows.filter(r=>r.type==='پیشنهاد مستقل جبران');
 const valid=owner.trim()&&reason.trim().length>=20&&evidence.trim()&&reviewer.trim()&&reviewer!==current.id;
 return <section data-testid="compensation-workflow" className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 text-sm">
  <h3 className="font-bold">جبران یا بازیابی کنترل‌شده پس از نهایی‌شدن اقدام</h3>
  <p>وضعیت اقدام اصلی {code} تغییر نمی‌کند. {executed?'نتیجه اجرا در پرونده اصلی ثبت شده است؛':'عدم اجرای قطعی در پرونده اصلی ثبت شده است؛'} برگشت خودکار و ارسال مجدد مجاز نیست. امکان جبران در مقصد نامعلوم است؛ مالک سامانه منبع باید آن را بررسی کند.</p>
  <div className="grid sm:grid-cols-2 gap-3">
   <label className="text-xs">نوع درخواست<select className={input} value={mode} onChange={e=>setMode(e.target.value)}><option value="review">بررسی امکان جبران با پیشنهاد جداگانه</option><option value="manual">فرایند بازیابی دستی توسط مالک منبع</option><option value="irreversible">ثبت وضعیت بالقوه برگشت‌ناپذیر</option></select></label>
   <label className="text-xs">مسئول سامانه منبع *<input className={input} value={owner} onChange={e=>setOwner(e.target.value)} /></label>
   <label className="text-xs">بازبین مستقل *<select className={input} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(u=>u.id!==current.id&&u.permittedSiteIds.includes(scope.siteId||'')).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label className="text-xs">مرجع نتیجه اجرا و شاهد *<input className={input} value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
   <label className="text-xs sm:col-span-2">دلیل و دامنه اثر جبران (حداقل ۲۰ نویسه) *<textarea className={input} rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </div>
  <button className={action} disabled={!valid} onClick={()=>add('درخواست بازیابی/جبران','صرفاً درخواست داخلی غیرالزام‌آور؛ هیچ اثر جدیدی در مقصد انجام نشده است.',{originalAction:actionId,mode,owner,reviewer,evidence,reason},current)}>ثبت درخواست مستقل جبران/بازیابی</button>
  <div className="border-t border-amber-300 pt-3 space-y-2" data-testid="compensation-separated-proposal"><h4 className="font-bold">پیشنهاد جبران مستقل با Diff و گیت جداگانه</h4>
   <p className="text-xs">ابتدا درخواست اولیه باید توسط بازبین تعیین‌شده تأیید نمایشی شود. پیشنهاد شناسه و بازبین دوم مستقل خواهد داشت.</p>
   <label className="block text-xs">Diff مورد انتظار (قبل ← بعد) *<textarea className={input} value={proposedDiff} onChange={e=>setProposedDiff(e.target.value)}/></label>
   <label className="block text-xs">شاهد امکان‌پذیری/گیت منبع *<input className={input} value={gateEvidence} onChange={e=>setGateEvidence(e.target.value)}/></label>
   <label className="block text-xs">بازبین مستقل مرحله دوم *<select className={input} value={secondReviewer} onChange={e=>setSecondReviewer(e.target.value)}><option value="">انتخاب بازبین دوم</option>{DEMO_USERS.filter(u=>u.permittedSiteIds.includes(scope.siteId||'')&&u.id!==current.id&&u.id!==approvedRequest?.reviewerId).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <button className={action} disabled={!approvedRequest||!proposedDiff.trim()||!gateEvidence.trim()||!secondReviewer||mode==='irreversible'} onClick={()=>add('پیشنهاد مستقل جبران','ثبت پیشنهاد مستقل؛ هیچ جبرانی اجرا نشده است.',{proposalId:`SYN-COMP-${actionId}-${rows.length+1}`,originalRequest:approvedRequest?.id||'',originalAction:actionId,diff:proposedDiff,gate:gateEvidence,reviewer:secondReviewer},current)}>ثبت پیشنهاد جبران مستقل برای گیت دوم</button>
   {compensationProposals.map(r=><p key={r.id} className="rounded border p-2 text-xs">{r.fields.proposalId} · Diff: {r.fields.diff} · گیت: {r.fields.gate} · {r.state==='approved_synthetic'?'گیت دوم تأیید نمایشی شد؛ اجرا مجاز نیست.':'در انتظار بازبین دوم'}</p>)}
  </div>
  <p className="text-xs">این مسیر جانشین مجوز واقعی T3 نیست؛ حالت برگشت‌ناپذیر عمداً پیشنهاد جبران ایجاد نمی‌کند.</p>
  <History rows={rows} current={current} onApprove={approve}/>
 </section>;
}
