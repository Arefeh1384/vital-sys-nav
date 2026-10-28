import React,{useEffect,useState} from 'react';
import {useApp} from '../context/AppContext';
import {approvedSyntheticContracts,syntheticConnectorRecords,governedDemoCompatibility} from './syntheticDataGovernance';

/** DAT-01/02/03/05: deterministic fake pipeline, deliberately isolated from operational endpoints. */
export type DemoInput={eventId:string; entity:string;value:number;unit:string;contract:string;schemaVersion:string};
export type DemoBatch={id:string;connector:string;contract:string;startedAt:string;status:'simulated'|'replayed';sourceCutoff:string;accepted:number;duplicate:number;quarantined:number;rows:DemoInput[];replayOf?:string;ingestMode?:'snapshot'|'delta';approvedContractId?:string};
export const DEMO_DATA_INPUT:DemoInput[]=[
 {eventId:'SYN-EVENT-1',entity:'SYN-ICU-1',value:80,unit:'beds',contract:'demo-bed-occupancy',schemaVersion:'1'},
 {eventId:'SYN-EVENT-1',entity:'SYN-ICU-1',value:80,unit:'beds',contract:'demo-bed-occupancy',schemaVersion:'1'},
 {eventId:'SYN-EVENT-2',entity:'SYN-ICU-2',value:-2,unit:'beds',contract:'demo-bed-occupancy',schemaVersion:'1'},
 {eventId:'SYN-EVENT-3',entity:'SYN-ICU-2',value:85,unit:'beds',contract:'demo-bed-occupancy',schemaVersion:'1'},
];
export function runDemoBatch(input:DemoInput[],contract='demo-bed-occupancy',acceptedAlready=new Set<string>()) {
 const seen=new Set(acceptedAlready),valid:DemoInput[]=[];let duplicate=0,quarantined=0;
 for(const row of input){
  if(row.contract!==contract||row.schemaVersion!=='1'||!Number.isFinite(row.value)||row.value<0||row.unit!=='beds'){quarantined++;continue;}
  if(seen.has(row.eventId)){duplicate++;continue;}
  seen.add(row.eventId);valid.push(row);
 }
 return {accepted:valid.length,duplicate,quarantined,rows:valid,checkpoint:[...seen].sort()};
}
export function demoSemanticOccupancy(batches:DemoBatch[]){
 const unique=new Map<string,DemoInput>();
 for(const batch of [...batches].reverse())for(const row of batch.rows)if(!unique.has(row.eventId))unique.set(row.eventId,row);
 const rows=[...unique.values()];return {value:rows.reduce((sum,row)=>sum+row.value,0),count:rows.length,ids:rows.map(x=>x.eventId),version:'demo-bed-occupancy@1',unit:'beds',valid:rows.length>0};
}
const k=(site:string)=>`him.synthetic.data-pipeline.v1:${site}`;
function read(key:string):DemoBatch[]{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
const button='rounded-lg bg-teal-800 px-3 py-2 text-xs text-white disabled:opacity-40';
export function SyntheticDataFlow(){
 const {scope}=useApp();const key=k(scope.siteId||'none');
 const [batches,setBatches]=useState<DemoBatch[]>(()=>read(key));
 const [connector,setConnector]=useState('SYN-PACS-READONLY');const [contract,setContract]=useState('demo-bed-occupancy');const [version,setVersion]=useState('1');
 const [replayId,setReplayId]=useState<string|null>(null);
 const [governanceMode,setGovernanceMode]=useState<'fixture'|'governed'>('fixture');
 const [ingestMode,setIngestMode]=useState<'snapshot'|'delta'>('snapshot');
 const [queryResult,setQueryResult]=useState<{value:number;count:number;contract:string;version:string;at:string}|null>(null);
 const approved=approvedSyntheticContracts(scope.siteId||'none');
 const active=syntheticConnectorRecords(scope.siteId||'none').filter(x=>x.status==='active_synthetic');
 const selectedConnector=active.find(x=>x.key===connector);
 const selectedContract=approved.find(x=>x.values.contract_id===contract&&x.values.source===connector);
 const governanceProblems=selectedConnector&&selectedContract?governedDemoCompatibility(selectedConnector,selectedContract):['کانکتور مصنوعی فعال و قرارداد مستقل تأییدشده مطابق موجود نیست'];
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(batches));}catch{}},[key,batches]);
 const compatible=governanceMode==='governed'?governanceProblems.length===0&&version===selectedContract?.values.schema_version:contract==='demo-bed-occupancy'&&version==='1'&&connector.trim().startsWith('SYN-');
 const simulate=()=>{
  if(!compatible)return;
  const previous=new Set(batches.filter(x=>x.contract===contract).flatMap(x=>x.rows.map(r=>r.eventId)));
  const sample=ingestMode==='snapshot'?DEMO_DATA_INPUT:DEMO_DATA_INPUT.filter(x=>x.eventId==='SYN-EVENT-2'||x.eventId==='SYN-EVENT-3');
  const result=runDemoBatch(sample.map(row=>({...row,contract,schemaVersion:version})),contract,previous);
  const b:DemoBatch={id:`SYN-JOB-${Date.now()}`,connector,contract,startedAt:new Date().toISOString(),status:replayId?'replayed':'simulated',sourceCutoff:'2026-10-23T23:59:59+03:30',accepted:result.accepted,duplicate:result.duplicate,quarantined:result.quarantined,rows:result.rows,replayOf:replayId||undefined,ingestMode,approvedContractId:governanceMode==='governed'?selectedContract?.id:undefined};
  setBatches(x=>[b,...x]);setReplayId(null);setQueryResult(null);
 };
 const metric=demoSemanticOccupancy(batches);
 const query=()=>{if(!compatible||governanceMode!=='governed'||!selectedContract)return;const governedBatches=batches.filter(x=>x.contract===contract&&x.approvedContractId===selectedContract.id);const q=demoSemanticOccupancy(governedBatches);if(!q.valid)return;setQueryResult({value:q.value,count:q.count,contract,version:`${contract}@${version} / demo-bed-occupancy@1`,at:new Date().toISOString()});};
 return <section data-testid="synthetic-data-flow" className="rounded-xl border p-4 space-y-3 bg-white">
  <h3 className="font-bold">DAT · تست اتصال، دریافت، بازپخش و پرس‌وجوی صرفاً مصنوعی</h3>
  <p className="text-xs text-amber-800">این فرایند هیچ fetch، اتصال PACS/HIS، اجرای ETL یا پرس‌وجوی بیمارستانی ندارد. فقط ۴ رخداد بدون داده بیمار را در حافظه مرورگر بررسی می‌کند.</p>
  <label className="block text-sm">حالت اجرای داده<select aria-label="حالت حاکمیت داده" className="w-full border rounded p-2" value={governanceMode} onChange={e=>{setGovernanceMode(e.target.value as 'fixture'|'governed');setQueryResult(null);}}><option value="fixture">فیکسچر مستقل (بدون قرارداد مصوب)</option><option value="governed">کانکتور فعال و قرارداد بازبینی‌شده صرفاً demo</option></select></label>
  {governanceMode==='governed'&&<label className="block text-sm">انتخاب اتصال تأییدشده در همین مرورگر<select aria-label="انتخاب کانکتور حاکمیتی" className="w-full border rounded p-2" value={selectedConnector?.id||''} onChange={e=>{const record=active.find(x=>x.id===e.target.value);if(!record)return;setConnector(record.key);setContract(record.contract);const c=approved.find(c=>c.values.contract_id===record.contract&&c.values.source===record.key);setVersion(c?.values.schema_version||'1');setQueryResult(null);}}><option value="">انتخاب کنید</option>{active.map(x=><option key={x.id} value={x.id}>{x.key} / {x.contract}</option>)}</select><p className="text-xs">{governanceProblems.length?`BLOCKED: ${governanceProblems.join('؛ ')}`:'PASS — بازبینی مستقل نسخه قرارداد و اتصال synthetic'}</p></label>}
  <div className="grid gap-3 sm:grid-cols-3 text-sm"><label>کانکتور نمونه<input className="w-full border rounded p-2" value={connector} onChange={e=>setConnector(e.target.value)}/></label><label>قرارداد نمونه<input className="w-full border rounded p-2" value={contract} onChange={e=>setContract(e.target.value)}/></label><label>نسخه Schema<input className="w-full border rounded p-2" value={version} onChange={e=>setVersion(e.target.value)}/></label></div>
  <label className="block text-sm">الگوی دریافت فیکسچر<select className="w-full border rounded p-2" aria-label="Snapshot or delta" value={ingestMode} onChange={e=>setIngestMode(e.target.value as 'snapshot'|'delta')}><option value="snapshot">Snapshot — چهار رکورد تمرینی</option><option value="delta">Delta — دو رکورد تمرینی</option></select></label>
  <p className="text-xs">نتیجه سازگاری قراردادی در فیکسچر: {compatible?'PASS (mock)':'BLOCKED — قرارداد/نسخه/کانکتور ناسازگار'}. قرارداد `demo-bed-occupancy@1` فقط برای نمونه ساخته شده است.</p>
  <button className={button} disabled={!compatible} onClick={simulate}>{replayId?`بازپخش مجدد ${replayId} (idempotent)`:'اجرای تست دریافت مصنوعی'}</button>
  <div className="grid sm:grid-cols-3 gap-2 text-sm"><div className="border rounded p-2">پرس‌وجوی معنایی نمونه: {metric.valid?metric.value:'ناموجود'} {metric.unit}</div><div className="border rounded p-2">ردیف‌های یکتا: {metric.count}</div><div className="border rounded p-2">نسخه متریک: {metric.version}</div></div>
  <section data-testid="governed-semantic-query" className="rounded border p-3 space-y-2 text-sm"><h4 className="font-bold">پرس‌وجوی معنایی با گیت قرارداد و اتصال (فقط فیکسچر)</h4><button className={button} disabled={governanceMode!=='governed'||!compatible||!batches.some(x=>x.contract===contract&&x.approvedContractId===selectedContract?.id&&x.rows.length)} onClick={query}>اجرای پرس‌وجوی فیکسچر با کنترل نسخه</button>{queryResult?<p>نتیجه {queryResult.value} beds / {queryResult.count} event · {queryResult.version} · {queryResult.at} · فاقد مجوز استفاده عملیاتی</p>:<p>تا انتخاب کانکتور فعال، قرارداد بازبینی‌شده و اجرای batch مجاز، پاسخ governed تولید نمی‌شود.</p>}</section>
  <p className="text-xs">فقط رخدادهای پذیرفته‌شده با eventId یکتا جمع می‌شوند؛ مقدار منفی قرنطینه و duplicate شمارش می‌شود. این «تخت اشغال» آمار مصوب نیست.</p>
  {batches.map(x=><details key={x.id} className="rounded border p-2 text-xs"><summary className="cursor-pointer">{x.id} · {x.status} · accepted={x.accepted} duplicate={x.duplicate} quarantine={x.quarantined}</summary><p>connector={x.connector} contract={x.contract} cutoff={x.sourceCutoff} mode={x.ingestMode||'legacy'} approvedContract={x.approvedContractId||'none'} replayOf={x.replayOf||'—'}</p><p>lineage: {x.rows.map(r=>`${r.eventId} / ${r.entity} / ${r.value}`).join(' | ')||'no accepted new events'}</p><button className="mt-2 border rounded p-2" onClick={()=>setReplayId(x.id)}>انتخاب برای Replay (بدون اجرای خارجی)</button></details>)}
 </section>;
}
