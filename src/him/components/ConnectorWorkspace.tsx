import React,{useEffect,useState} from 'react';
import {useApp} from '../context/AppContext';
import {DEMO_USERS} from '../data/mockData';
import {approvedSyntheticContracts,governedDemoCompatibility,syntheticConnectorRecords,type LocalConnector} from './syntheticDataGovernance';

const kindList=['HIS','PACS','LIS','pharmacy','inventory','file_import'];
const cls='w-full rounded-lg border border-slate-300 bg-white p-2 text-sm';
const btn='rounded-lg bg-teal-800 text-white px-3 py-2 text-sm disabled:opacity-40';
type ConnectorDraft=LocalConnector & {owner:string;createdAt:string;reviewedAt?:string;testedAt?:string;activatedAt?:string};
export function ConnectorWorkspace(){
 const {scope,user}=useApp();return <ScopedConnectors key={`${scope.siteId}:${user?.id||'demo'}`} siteId={scope.siteId||''} userId={user?.id||'demo'} siteName={scope.siteName}/>;
}
function ScopedConnectors({siteId,userId,siteName}:{siteId:string;userId:string;siteName:string}){
 const key=`him.synthetic.connectors.v2:${siteId}:shared-demo`;
 const [items,setItems]=useState<ConnectorDraft[]>(()=>{
  const shared=syntheticConnectorRecords(siteId) as ConnectorDraft[];if(shared.length)return shared;
  try{const legacy=JSON.parse(localStorage.getItem(`him.synthetic.connectors.v1:${siteId}:${userId}`)||'[]');return Array.isArray(legacy)?legacy:[];}catch{return []}
 });
 const [connectorKey,setConnectorKey]=useState(''),[kind,setKind]=useState('HIS'),[owner,setOwner]=useState(''),[contract,setContract]=useState(''),[freshness,setFreshness]=useState('3600'),[reviewerId,setReviewerId]=useState(''),[selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(items))}catch{}},[key,items]);
 const contracts=approvedSyntheticContracts(siteId);
 const contractOf=(x:ConnectorDraft)=>contracts.find(c=>c.values.contract_id===x.contract&&c.values.source===x.key);
 const valid=/^[a-z][a-z0-9_-]{2,60}$/i.test(connectorKey)&&!!owner.trim()&&!!contract.trim()&&Number.isInteger(Number(freshness))&&Number(freshness)>0&&reviewerId!==userId&&!!reviewerId&&DEMO_USERS.some(u=>u.id===reviewerId&&u.permittedSiteIds.includes(siteId))&&!items.some(x=>x.key===connectorKey);
 const update=(id:string,changes:Partial<ConnectorDraft>)=>setItems(old=>old.map(x=>x.id===id?{...x,...changes}:x));
 const save=()=>{if(!valid)return;const item:ConnectorDraft={id:`SYN-CON-${Date.now()}`,key:connectorKey,kind,owner:owner.trim(),contract:contract.trim(),mode:'read_only',freshnessSeconds:freshness,createdAt:new Date().toISOString(),status:'draft',createdBy:userId,reviewerId};setItems(v=>[item,...v]);setSelected(item.id);setConnectorKey('')};
 const selectedItem=items.find(x=>x.id===selected);
 const connectedContract=selectedItem?contractOf(selectedItem):undefined;
 const runTest=()=>{if(!selectedItem||selectedItem.status!=='review_approved_synthetic')return;
  const testConnector={...selectedItem,status:'active_synthetic'};
  const problems=connectedContract?governedDemoCompatibility(testConnector,connectedContract):['قرارداد تأییدشده و منطبق یافت نشد'];
  update(selectedItem.id,{status:problems.length?'review_approved_synthetic':'mock_test_passed',testedAt:new Date().toISOString(),testResult:problems.length?`BLOCKED: ${problems.join('؛ ')}`:'PASS: deterministic local handshake; no network access'});
 };
 return <section dir="rtl" className="space-y-4" data-testid="connector-workspace"><header className="rounded-xl bg-white border p-5"><h1 className="text-xl font-bold">DAT-01 · بازبینی و آزمایش کانکتور محلی</h1><p className="text-sm mt-2">سایت {siteName} · داده آزمایشی اشتراکی فقط در همین مرورگر</p></header>
 <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">هیچ اتصال واقعی PACS/HIS، رمز عبور، API، ترافیک شبکه یا قرارداد مصوب برقرار نمی‌شود. آزمایش اتصال فقط سیاست و سازگاری رکوردهای محلی را بررسی می‌کند؛ فعال‌سازی نیز صرفاً synthetic است.</p>
 <form className="bg-white rounded-xl border p-5 space-y-3" onSubmit={e=>{e.preventDefault();save()}}><h2 className="font-bold">پیشنهاد اتصال نمونه</h2><div className="grid gap-3 sm:grid-cols-2">
 <label>شناسه کانکتور *<input className={cls} aria-label="شناسه کانکتور" value={connectorKey} onChange={e=>setConnectorKey(e.target.value)} placeholder="qa_demo_pacs"/></label>
 <label>نوع منبع *<select className={cls} value={kind} onChange={e=>setKind(e.target.value)}>{kindList.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>مالک منبع *<input className={cls} value={owner} onChange={e=>setOwner(e.target.value)}/></label>
 <label>شناسه قرارداد نسخه‌دار *<input className={cls} value={contract} onChange={e=>setContract(e.target.value)} placeholder="contract_id از DAT-02"/></label>
 <label>حد تازگی ثانیه *<input className={cls} type="number" min="1" step="1" value={freshness} onChange={e=>setFreshness(e.target.value)}/></label>
 <label>بازبین مستقل فیکسچر *<select className={cls} value={reviewerId} onChange={e=>setReviewerId(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(x=>x.id!==userId&&x.permittedSiteIds.includes(siteId)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
 </div><p className="text-xs">حالت اتصال: read_only · پس از ثبت، بازبین دیگری باید درخواست را تأیید کند.</p><button className={btn} disabled={!valid}>ثبت پیش‌نویس</button></form>
 <section className="bg-white rounded-xl border p-5 space-y-3"><h2 className="font-bold">فهرست کانکتورها و گیت اتصال</h2>
 {items.length?items.map(x=><button key={x.id} className="block w-full rounded-lg border p-3 text-right hover:border-teal-600" onClick={()=>setSelected(x.id)}>{x.key} · {x.kind} · {x.status}</button>):<p>کانکتوری برای این سایت ثبت نشده است.</p>}
 {selectedItem&&<div role="region" className="rounded-lg border border-teal-200 p-4 space-y-2 text-sm" data-testid="connector-gates"><h3 className="font-bold">{selectedItem.key} · {selectedItem.contract}</h3>
 <p>مالک: {selectedItem.owner} · حالت: {selectedItem.mode} · سقف تازگی: {selectedItem.freshnessSeconds} ثانیه</p>
 <p>نویسنده: {selectedItem.createdBy||'legacy/unknown'} · بازبین مستقل: {selectedItem.reviewerId||'legacy/unassigned'} · بازبینی: {selectedItem.reviewedAt||'انجام نشده'}</p>
 <p>گیت قرارداد: {connectedContract?`PASS (contract ${connectedContract.values.contract_id} / schema ${connectedContract.values.schema_version})`:'BLOCKED — قرارداد تأییدشده با شناسه و source مطابق وجود ندارد'}</p>
 <p>نتیجه آزمایش: {selectedItem.testResult||'انجام نشده'} · {selectedItem.testedAt||'—'}</p>
 <p>وضعیت فعال‌سازی: {selectedItem.status==='active_synthetic'?'فعال فقط در مرورگر (mock)':'غیرفعال / نیازمند گیت'}</p>
 <div className="flex flex-wrap gap-2"><button className={btn} disabled={selectedItem.status!=='draft'||selectedItem.createdBy!==userId||!selectedItem.reviewerId} onClick={()=>update(selectedItem.id,{status:'review_requested'})}>درخواست بررسی مستقل</button>
 <button className={btn} disabled={selectedItem.status!=='review_requested'||selectedItem.createdBy===userId||selectedItem.reviewerId!==userId} onClick={()=>update(selectedItem.id,{status:'review_approved_synthetic',reviewedBy:userId,reviewedAt:new Date().toISOString()})}>تأیید بازبین مستقل (demo)</button>
 <button className={btn} disabled={selectedItem.status!=='review_approved_synthetic'||!connectedContract} onClick={runTest}>اجرای تست اتصال بدون شبکه</button>
 <button className={btn} disabled={selectedItem.status!=='mock_test_passed'||selectedItem.createdBy!==userId||!connectedContract} onClick={()=>update(selectedItem.id,{status:'active_synthetic',activatedAt:new Date().toISOString()})}>فعال‌سازی صرفاً مصنوعی</button></div></div>}</section></section>;
}
