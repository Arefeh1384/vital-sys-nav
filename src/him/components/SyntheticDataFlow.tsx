import React,{useEffect,useState} from 'react';
import {useApp} from '../context/AppContext';

/** DAT-01/02/03/05: deterministic fake pipeline, deliberately isolated from operational endpoints. */
export type DemoInput={eventId:string; entity:string;value:number;unit:string;contract:string;schemaVersion:string};
export type DemoBatch={id:string;connector:string;contract:string;startedAt:string;status:'simulated'|'replayed';sourceCutoff:string;accepted:number;duplicate:number;quarantined:number;rows:DemoInput[];replayOf?:string};
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
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(batches));}catch{}},[key,batches]);
 const compatible=contract==='demo-bed-occupancy'&&version==='1'&&connector.trim().startsWith('SYN-');
 const simulate=()=>{
  if(!compatible)return;
  const previous=new Set(batches.flatMap(x=>x.rows.map(r=>r.eventId)));
  const result=runDemoBatch(DEMO_DATA_INPUT,contract,previous);
  const b:DemoBatch={id:`SYN-JOB-${Date.now()}`,connector,contract,startedAt:new Date().toISOString(),status:replayId?'replayed':'simulated',sourceCutoff:'2026-10-23T23:59:59+03:30',accepted:result.accepted,duplicate:result.duplicate,quarantined:result.quarantined,rows:result.rows,replayOf:replayId||undefined};
  setBatches(x=>[b,...x]);setReplayId(null);
 };
 const metric=demoSemanticOccupancy(batches);
 return <section data-testid="synthetic-data-flow" className="rounded-xl border p-4 space-y-3 bg-white">
  <h3 className="font-bold">DAT · تست اتصال، دریافت، بازپخش و پرس‌وجوی صرفاً مصنوعی</h3>
  <p className="text-xs text-amber-800">این فرایند هیچ fetch، اتصال PACS/HIS، اجرای ETL یا پرس‌وجوی بیمارستانی ندارد. فقط ۴ رخداد بدون داده بیمار را در حافظه مرورگر بررسی می‌کند.</p>
  <div className="grid gap-3 sm:grid-cols-3 text-sm"><label>کانکتور نمونه<input className="w-full border rounded p-2" value={connector} onChange={e=>setConnector(e.target.value)}/></label><label>قرارداد نمونه<input className="w-full border rounded p-2" value={contract} onChange={e=>setContract(e.target.value)}/></label><label>نسخه Schema<input className="w-full border rounded p-2" value={version} onChange={e=>setVersion(e.target.value)}/></label></div>
  <p className="text-xs">نتیجه سازگاری قراردادی در فیکسچر: {compatible?'PASS (mock)':'BLOCKED — قرارداد/نسخه/کانکتور ناسازگار'}. قرارداد `demo-bed-occupancy@1` فقط برای نمونه ساخته شده است.</p>
  <button className={button} disabled={!compatible} onClick={simulate}>{replayId?`بازپخش مجدد ${replayId} (idempotent)`:'اجرای تست دریافت مصنوعی'}</button>
  <div className="grid sm:grid-cols-3 gap-2 text-sm"><div className="border rounded p-2">پرس‌وجوی معنایی نمونه: {metric.valid?metric.value:'ناموجود'} {metric.unit}</div><div className="border rounded p-2">ردیف‌های یکتا: {metric.count}</div><div className="border rounded p-2">نسخه متریک: {metric.version}</div></div>
  <p className="text-xs">فقط رخدادهای پذیرفته‌شده با eventId یکتا جمع می‌شوند؛ مقدار منفی قرنطینه و duplicate شمارش می‌شود. این «تخت اشغال» آمار مصوب نیست.</p>
  {batches.map(x=><details key={x.id} className="rounded border p-2 text-xs"><summary className="cursor-pointer">{x.id} · {x.status} · accepted={x.accepted} duplicate={x.duplicate} quarantine={x.quarantined}</summary><p>connector={x.connector} contract={x.contract} cutoff={x.sourceCutoff} replayOf={x.replayOf||'—'}</p><p>lineage: {x.rows.map(r=>`${r.eventId} / ${r.entity} / ${r.value}`).join(' | ')||'no accepted new events'}</p><button className="mt-2 border rounded p-2" onClick={()=>setReplayId(x.id)}>انتخاب برای Replay (بدون اجرای خارجی)</button></details>)}
 </section>;
}
