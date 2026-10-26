import React, {useEffect,useState} from 'react';
import {useApp} from '../context/AppContext';

type ConnectorDraft={id:string;key:string;kind:string;owner:string;contract:string;mode:'read_only';freshnessSeconds:string;createdAt:string;status:'draft'|'review_requested'};
const kindList=['HIS','PACS','LIS','pharmacy','inventory','file_import'];
const cls='w-full rounded-lg border border-slate-300 bg-white p-2 text-sm';
const btn='rounded-lg bg-teal-800 text-white px-3 py-2 text-sm disabled:opacity-40';
export function ConnectorWorkspace(){
 const {scope,user}=useApp();return <ScopedConnectors key={`${scope.siteId}:${user?.id||'demo'}`} siteId={scope.siteId||''} userId={user?.id||'demo'} siteName={scope.siteName}/>;
}
function ScopedConnectors({siteId,userId,siteName}:{siteId:string;userId:string;siteName:string}){
 const key=`him.synthetic.connectors.v1:${siteId}:${userId}`;
 const [items,setItems]=useState<ConnectorDraft[]>(()=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}});
 const [connectorKey,setConnectorKey]=useState(''),[kind,setKind]=useState('HIS'),[owner,setOwner]=useState(''),[contract,setContract]=useState(''),[freshness,setFreshness]=useState('3600'),[selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(items))}catch{}},[key,items]);
 const valid=/^[a-z][a-z0-9_-]{2,60}$/i.test(connectorKey)&&!!owner.trim()&&!!contract.trim()&&Number.isInteger(Number(freshness))&&Number(freshness)>0&&!items.some(x=>x.key===connectorKey);
 const save=()=>{if(!valid)return;const item:ConnectorDraft={id:`SYN-CON-${Date.now()}`,key:connectorKey,kind,owner:owner.trim(),contract:contract.trim(),mode:'read_only',freshnessSeconds:freshness,createdAt:new Date().toISOString(),status:'draft'};setItems(v=>[item,...v]);setSelected(item.id);setConnectorKey('')};
 const selectedItem=items.find(x=>x.id===selected);
 return <section dir="rtl" className="space-y-4" data-testid="connector-workspace"><header className="rounded-xl bg-white border p-5"><h1 className="text-xl font-bold">DAT-01 · ثبت و بررسی کانکتورهای منبع</h1><p className="text-sm mt-2">سایت {siteName} · داده آزمایشی محلی، محدود به کاربر و سایت</p></header>
 <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">هیچ اتصال، رمز عبور، قابلیت خواندن منبع یا قرارداد تأییدشده‌ای در این محیط وجود ندارد. این فرم درخواست پیکربندی است، نه ثبت اتصال عملیاتی.</p>
 <form className="bg-white rounded-xl border p-5 space-y-3" onSubmit={e=>{e.preventDefault();save()}}><h2 className="font-bold">درخواست ثبت کانکتور</h2><div className="grid gap-3 sm:grid-cols-2">
 <label>شناسه کانکتور *<input className={cls} aria-label="شناسه کانکتور" value={connectorKey} onChange={e=>setConnectorKey(e.target.value)} placeholder="hospital_his_read"/></label>
 <label>نوع سامانه منبع *<select className={cls} aria-label="نوع کانکتور" value={kind} onChange={e=>setKind(e.target.value)}>{kindList.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>مسئول منبع *<input className={cls} aria-label="مالک کانکتور" value={owner} onChange={e=>setOwner(e.target.value)}/></label>
 <label>نسخه قرارداد/schema *<input className={cls} aria-label="قرارداد کانکتور" value={contract} onChange={e=>setContract(e.target.value)}/></label>
 <label>حد تازگی بر حسب ثانیه *<input type="number" min="1" step="1" className={cls} aria-label="حد تازگی کانکتور" value={freshness} onChange={e=>setFreshness(e.target.value)}/></label>
 <label>حالت مجاز<input className={cls} readOnly value="read_only (پیشنهادی، غیرفعال)"/></label></div><button className={btn} disabled={!valid}>ثبت پیش‌نویس</button></form>
 <section className="bg-white rounded-xl border p-5 space-y-3"><h2 className="font-bold">فهرست و جزئیات کانکتورهای پیشنهادی</h2><p className="text-xs">HIS، PACS، LIS و داروخانه صرفاً انواع منبعند؛ تعداد کانکتور فعالِ تأییدشده صفر یا نامشخص است.</p>{items.length?items.map(x=><button key={x.id} className="block w-full rounded-lg border p-3 text-right hover:border-teal-600" onClick={()=>setSelected(x.id)}>{x.key} · {x.kind} · {x.status==='draft'?'پیش‌نویس':'درخواست بررسی'}</button>):<p>کانکتور ثبت‌شده‌ای برای این سایت وجود ندارد.</p>}
 {selectedItem&&<div role="region" className="rounded-lg border border-teal-200 p-4 space-y-2 text-sm"><h3 className="font-bold">{selectedItem.key} · نسخه قرارداد {selectedItem.contract}</h3><p>مالک: {selectedItem.owner} · حالت: {selectedItem.mode} · سقف تازگی: {selectedItem.freshnessSeconds} ثانیه</p><p>وضعیت قرارداد / بررسی نمونه / دسترسی منبع / اتصال / مقادیر checkpoint: ناموجود یا تأییدنشده</p><button className={btn} disabled={selectedItem.status==='review_requested'} onClick={()=>setItems(v=>v.map(x=>x.id===selectedItem.id?{...x,status:'review_requested'}:x))}>درخواست بررسی قرارداد (بدون فعال‌سازی)</button></div>}</section>
 </section>;
}
