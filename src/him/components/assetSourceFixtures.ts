/** Fully labelled AST demonstration fixtures; not linked to CMMS or telemetry services. */
export type AssetSourceEvent = {
 assetId:string;kind:'synchronization'|'work_order';source:string;version:string;
 eventAt:string;ingestedAt:string;status:string;detail:string;
};
export type AssetTelemetryReading = {assetId:string;metric:'temperature'|'runtime'|'energy';unit:string;value:number;sourceAt:string;ingestedAt:string;quality:'synthetic'};
const asset='SYN-AST-SITE-TALEGHANI-001';
export const DEMO_AST_EVENTS: AssetSourceEvent[]=[
 {assetId:asset,kind:'synchronization',source:'CMMS-SYN-001',version:'fixture-1',eventAt:'2026-10-20T09:00:00+03:30',ingestedAt:'2026-10-20T09:01:00+03:30',status:'demo-success',detail:'همگام‌سازی نمونه؛ نتیجه عملیاتی قابل استناد نیست'},
 {assetId:asset,kind:'work_order',source:'CMMS-SYN-001',version:'fixture-1',eventAt:'2026-10-21T11:00:00+03:30',ingestedAt:'2026-10-21T11:02:00+03:30',status:'demo-open',detail:'درخواست نگهداشت نمونه، نه سفارش کاری واقعی'},
];
export const DEMO_AST_READINGS:AssetTelemetryReading[]=[
 {assetId:asset,metric:'temperature',unit:'Cel',value:22.1,sourceAt:'2026-10-19T08:00:00+03:30',ingestedAt:'2026-10-19T08:02:00+03:30',quality:'synthetic'},
 {assetId:asset,metric:'temperature',unit:'Cel',value:22.4,sourceAt:'2026-10-20T08:00:00+03:30',ingestedAt:'2026-10-20T08:02:00+03:30',quality:'synthetic'},
 {assetId:asset,metric:'runtime',unit:'h',value:134,sourceAt:'2026-10-20T08:00:00+03:30',ingestedAt:'2026-10-20T08:02:00+03:30',quality:'synthetic'},
];
export const inDateRange=(iso:string,from:string,to:string)=>(!from||iso.slice(0,10)>=from)&&(!to||iso.slice(0,10)<=to);
