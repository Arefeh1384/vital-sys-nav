import React,{useState,useEffect} from 'react';
import {useApp} from '../context/AppContext';
import {DEMO_USERS} from '../data/mockData';

/** PLT-012: browser-only, non-destructive lifecycle/hold evaluation for synthetic identifiers. */
type RetentionPlan={id:string;siteId:string;kind:string;days:number;hold:boolean;reviewer:string;author:string;reason:string;createdAt:string;state:'review_requested'|'review_approved_synthetic';reviewedAt?:string};
export const decideRetention=(ageDays:number,recordHold:boolean,planHold:boolean,limitDays:number)=>planHold||recordHold?'PROTECT_LEGAL_HOLD':ageDays>=limitDays?'ELIGIBLE_FOR_REVIEW_ONLY':'RETAIN';
const sample=[
 {id:'SYN-AUD-OLD-01',kind:'audit',ageDays:95,hold:false},
 {id:'SYN-AUD-HOLD-02',kind:'audit',ageDays:120,hold:true},
 {id:'SYN-MEMO-03',kind:'memo',ageDays:40,hold:false},
] as const;
const load=(key:string):RetentionPlan[]=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
export function SyntheticRetentionPlan(){
 const {scope,user}=useApp();const site=scope.siteId||'none',actor=user?.id||'guest',key=`him.synthetic.retention.v1:${site}`;
 const [plans,setPlans]=useState<RetentionPlan[]>(()=>load(key));
 const [kind,setKind]=useState('audit'),[days,setDays]=useState('90'),[hold,setHold]=useState(true),[reviewer,setReviewer]=useState(''),[reason,setReason]=useState('');
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(plans))}catch{}},[key,plans]);
 const canSave=Number.isInteger(Number(days))&&Number(days)>=1&&Number(days)<=36500&&reason.trim().length>=10&&DEMO_USERS.some(u=>u.id===reviewer&&u.id!==actor&&u.permittedSiteIds.includes(site));
 const add=()=>{if(!canSave)return;setPlans(x=>[{id:`SYN-RET-${Date.now()}`,siteId:site,kind,days:Number(days),hold,reviewer,author:actor,reason:reason.trim(),createdAt:new Date().toISOString(),state:'review_requested'},...x]);setReason('')};
 const approve=(id:string)=>setPlans(x=>x.map(p=>p.id===id&&p.author!==actor&&p.reviewer===actor?{...p,state:'review_approved_synthetic',reviewedAt:new Date().toISOString()}:p));
 const latest=plans.find(p=>p.state==='review_approved_synthetic');
 const result=latest?sample.filter(r=>r.kind===latest.kind).map(r=>({...r,decision:decideRetention(r.ageDays,r.hold,latest.hold,latest.days)})):[];
 return <section className="rounded-xl border border-amber-300 p-4 space-y-3 bg-white" data-testid="synthetic-retention-plan" dir="rtl">
  <h3 className="font-semibold">طرح حذف/نگهداری و Legal Hold صرفاً نمایشی</h3><p className="text-xs text-amber-900">خروجی صرفاً dry-run روی سه شناسه مصنوعی است. حتی رکورد واجد شرایط هم حذف نمی‌شود؛ بررسی سازمانی و کنترل واقعی نگهداری وجود ندارد.</p>
  <div className="grid sm:grid-cols-2 gap-3 text-xs">
  <label>نوع سند<select className="w-full border rounded p-2" value={kind} onChange={e=>setKind(e.target.value)}><option value="audit">ممیزی</option><option value="memo">یادداشت</option></select></label>
  <label>حداقل سن نگهداری (روز)<input className="w-full border rounded p-2" type="number" min="1" max="36500" value={days} onChange={e=>setDays(e.target.value)}/></label>
  <label>بازبین مستقل<select className="w-full border rounded p-2" value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(u=>u.id!==actor&&u.permittedSiteIds.includes(site)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
  <label className="flex gap-2 items-center"><input type="checkbox" checked={hold} onChange={e=>setHold(e.target.checked)}/>قفل حقوقی کلی پیشنهادی (Legal Hold)</label>
  <label className="sm:col-span-2">مبنای تغییر (حداقل ۱۰ نویسه)<textarea className="w-full border rounded p-2" value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </div><button className="rounded bg-teal-800 px-3 py-2 text-xs text-white disabled:opacity-40" disabled={!canSave} onClick={add}>درخواست طرح نگهداری با بازبینی مستقل</button>
  {plans.map(p=><div key={p.id} className="border p-2 text-xs"><p>{p.id} · {p.kind} · {p.days} روز · hold={String(p.hold)} · {p.state}</p>{p.state==='review_requested'&&p.reviewer===actor&&p.author!==actor&&<button className="rounded border p-2" onClick={()=>approve(p.id)}>تأیید مستقل طرح آزمایشی</button>}</div>)}
  {latest&&<div className="border-t pt-2 text-xs"><b>نتیجه dry-run طرح {latest.id}</b>{result.map(r=><p key={r.id}>{r.id} · سن {r.ageDays} روز · {r.decision}</p>)}<p className="text-amber-900">هیچ دکمه حذف یا API حذف وجود ندارد.</p></div>}
 </section>
}
