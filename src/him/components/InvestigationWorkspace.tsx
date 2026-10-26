import React,{useState} from 'react';
import {useApp} from '../context/AppContext';
import {DEMO_USERS} from '../data/mockData';

type Case={id:string;siteId:string;alertId:string;playbook:string;hypothesis:string;support:string;against:string;missing:string;createdBy:string;createdByName:string;reviewerId:string;createdAt:string;state:'awaiting_review'|'reviewed';reviewConclusion?:string;reviewedAt?:string;reviewedBy?:string};
const input='mt-1 w-full rounded border border-slate-300 p-2 text-sm bg-white';
const button='rounded bg-teal-800 px-3 py-2 text-white text-sm disabled:opacity-40';
export const canReviewInvestigation=(c:Pick<Case,'createdBy'|'reviewerId'|'state'>,actorId:string)=>c.state==='awaiting_review'&&c.reviewerId===actorId&&c.createdBy!==actorId;
const fromStorage=(key:string):Case[]=>{try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}};
/** A two-person synthetic investigation, deliberately separated from alert status and source effects. */
export function InvestigationWorkspace(){
 const {scope,user,alerts,openWorkView}=useApp();const siteId=scope.siteId||'none';
 return <ScopedInvestigationWorkspace key={siteId} siteId={siteId} actorId={user?.id||'guest'} actorName={user?.name||'کاربر نمایشی'} alerts={alerts.filter(a=>a.siteId===siteId)} openAlert={id=>openWorkView({kind:'alert',id})}/>;
}
function ScopedInvestigationWorkspace({siteId,actorId,actorName,alerts,openAlert}:{siteId:string;actorId:string;actorName:string;alerts:Array<{id:string;code:string;title:string}>;openAlert:(id:string)=>void}){
 const key=`him.synthetic.investigations.v1:${siteId}`;
 const [cases,setCases]=useState<Case[]>(()=>fromStorage(key));const [alertId,setAlertId]=useState('');const [playbook,setPlaybook]=useState('capacity_review');
 const [hypothesis,setHypothesis]=useState(''),[support,setSupport]=useState(''),[against,setAgainst]=useState(''),[missing,setMissing]=useState('');
 const [reviewerId,setReviewerId]=useState(''),[conclusions,setConclusions]=useState<Record<string,string>>({});const [error,setError]=useState('');
 const eligible=DEMO_USERS.filter(u=>u.id!==actorId&&u.permittedSiteIds.includes(siteId));
 const persist=(next:Case[])=>{try{localStorage.setItem(key,JSON.stringify(next));setCases(next);setError('');return true}catch{setError('ذخیره پیش‌نویس در مرورگر امکان‌پذیر نبود.');return false}};
 const valid=Boolean(alertId&&playbook&&hypothesis.trim().length>=15&&support.trim()&&against.trim()&&missing.trim()&&reviewerId);
 const create=()=>{if(!valid||!alerts.some(a=>a.id===alertId)||!eligible.some(x=>x.id===reviewerId))return;
  const item:Case={id:`INV-SYN-${Date.now()}`,siteId,alertId,playbook,hypothesis:hypothesis.trim(),support:support.trim(),against:against.trim(),missing:missing.trim(),createdBy:actorId,createdByName:actorName,reviewerId,createdAt:new Date().toISOString(),state:'awaiting_review'};
  if(persist([item,...cases])){setHypothesis('');setSupport('');setAgainst('');setMissing('');setReviewerId('')}
 };
 return <section dir="rtl" data-testid="executive-investigations" className="space-y-4">
  <h1 className="text-xl font-bold">EXE-05 · پرونده تحقیق ناهنجاری مبتنی بر شواهد</h1>
  <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">این پرونده فقط در مرورگر ذخیره می‌شود. فهرست Playbookها مثال طراحی است، نه نسخه مصوب. درستی فرضیه، شواهد، هویت بازبین و نتیجه تغییر وضعیت هشدار به‌صورت عملیاتی تأیید نشده‌اند.</p>
  <div className="rounded-xl border bg-white p-4 space-y-3"><h2 className="font-semibold">ثبت پرونده برای بازبینی مستقل</h2>
   <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">هشدار در دامنه سایت<select className={input} value={alertId} onChange={e=>setAlertId(e.target.value)}><option value="">انتخاب هشدار</option>{alerts.map(a=><option key={a.id} value={a.id}>{a.code} · {a.title}</option>)}</select></label>
   <label className="text-sm">Playbook پیشنهادی<select className={input} value={playbook} onChange={e=>setPlaybook(e.target.value)}><option value="capacity_review">بررسی ظرفیت (غیرمصوب)</option><option value="data_freshness">بررسی کیفیت منبع (غیرمصوب)</option><option value="supply_constraints">بررسی کمبود منابع (غیرمصوب)</option></select></label>
   <label className="text-sm">فرضیه قابل رد<textarea className={input} value={hypothesis} onChange={e=>setHypothesis(e.target.value)}/></label>
   <label className="text-sm">مراجع شواهد موافق<textarea className={input} value={support} onChange={e=>setSupport(e.target.value)}/></label>
   <label className="text-sm">مراجع شواهد مخالف<textarea className={input} value={against} onChange={e=>setAgainst(e.target.value)}/></label>
   <label className="text-sm">شواهد ناموجود یا محدودیت‌ها<textarea className={input} value={missing} onChange={e=>setMissing(e.target.value)}/></label>
   <label className="text-sm">بازبین پیشنهادی مستقل<select className={input} value={reviewerId} onChange={e=>setReviewerId(e.target.value)}><option value="">انتخاب بازبین متفاوت</option>{eligible.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>
   <button className={button} disabled={!valid} onClick={create}>ثبت درخواست تحقیق و بازبینی</button>
   {error&&<p role="alert" className="text-rose-700">{error}</p>}
  </div>
  <div className="rounded-xl border bg-white p-4 space-y-3"><h2 className="font-semibold">پرونده‌های تحقیق این سایت</h2>{cases.length===0&&<p className="text-sm text-slate-500">پرونده نمایشی ایجاد نشده است.</p>}
   {cases.map(c=><details key={c.id} className="rounded border p-3 text-sm"><summary className="cursor-pointer font-medium">{c.id} · {alerts.find(a=>a.id===c.alertId)?.code||c.alertId} · {c.state==='reviewed'?'نظر بازبین ثبت‌شده (نمایشی)':'در انتظار بازبین'}</summary>
    <div className="mt-2 space-y-2"><p>Playbook پیشنهادی: {c.playbook} · ایجادکننده: {c.createdByName} · {c.createdAt}</p><p>فرضیه: {c.hypothesis}</p><p>موافق: {c.support}</p><p>مخالف: {c.against}</p><p>ناموجود: {c.missing}</p><p>بازبین: {DEMO_USERS.find(u=>u.id===c.reviewerId)?.name||'نامشخص'}</p><button className="underline text-teal-800" onClick={()=>openAlert(c.alertId)}>بازکردن هشدار و بسته شواهد</button>
     {canReviewInvestigation(c,actorId)?<div><label className="block">جمع‌بندی مستقل بازبین (حداقل ۲۰ نویسه)<textarea className={input} value={conclusions[c.id]||''} onChange={e=>setConclusions(v=>({...v,[c.id]:e.target.value}))}/></label><button className={button} disabled={(conclusions[c.id]||'').trim().length<20} onClick={()=>persist(cases.map(x=>x.id===c.id?{...x,state:'reviewed',reviewConclusion:conclusions[c.id].trim(),reviewedAt:new Date().toISOString(),reviewedBy:actorId}:x))}>ثبت نظر بازبین بدون تأیید اجرایی</button></div>:<p className="text-xs text-amber-800">جمع‌بندی فقط برای حساب بازبین مستقل پیشنهادی امکان‌پذیر است؛ تغییر نقش نمایشی مجوز واقعی نیست.</p>}
     {c.reviewConclusion&&<p className="rounded bg-slate-50 p-2">نظر بازبین {c.reviewedBy} در {c.reviewedAt}: {c.reviewConclusion}</p>}
    </div>
   </details>)}
  </div>
 </section>;
}
