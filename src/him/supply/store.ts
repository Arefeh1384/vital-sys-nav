export type Criticality='high'|'medium'|'low';
export type CaseStatus='open'|'under_review'|'mitigation_planned'|'awaiting_action'|'monitoring'|'closed';
export type ProposalStatus='draft'|'validated'|'withdrawn'|'converted_to_action';
export type Lot={id:string;location:string;quantity:number;unit:string;base:number;conversion:string;disposition:string;expiry:string;received:string;quality:string;source:string};
export type ForecastPoint={day:string;actual?:number;expected:number;low:number;high:number;balance:number;censored?:boolean};
export type SupplyRisk={id:string;item:string;code:string;category:string;site:string;siteId:string;location:string;criticality:Criticality;riskType:string;usable:number;reserved:number;quarantined:number;expired:number;damaged:number;inbound:number;outbound:number;stockout:string;probability?:number;horizon:number;quality:'good'|'warning'|'limited';owner:string;caseId:string;detected:string;forecastRef:string;snapshot:string;leadTime:number;reviewPeriod:number;safetyStock:number;targetStock:number;pack:number;minOrder:number;price?:number;currency:string;supplier:string;lots:Lot[];history:{at:string;label:string;detail:string}[];forecast:ForecastPoint[]};
export type SupplyProposal={sourceLotId?:string;destinationDemand?:number;minimumShelfLifeDays?:number;id:string;type:'replenishment'|'transfer';riskId:string;caseId:string;item:string;site:string;source?:string;destination:string;quantity:number;unit:string;price?:number;currency:string;status:ProposalStatus;owner:string;createdAt:string;updatedAt:string;revision:number;reason:string;assumptions:string;editReason:string;leadTime:number;arrival:string;supplier:string;constraints:{label:string;state:'passed'|'warning'|'failed'|'unknown';detail:string}[];history:{at:string;text:string}[]};
export type SupplyCase={id:string;riskId:string;item:string;site:string;criticality:Criticality;stockout:string;owner:string;status:CaseStatus;updatedAt:string;activity:{at:string;text:string}[];outcome:string;actionState?:'uncertain'|'pending'|'held'|'unknown'|'success'|'failure'};
const days=(n:number,base:number,actual:boolean):ForecastPoint[]=>{let balance=base;return Array.from({length:n},(_,i)=>{const expected=16+i%3;balance-=expected;return {day:`روز ${i+1}`,...(actual&&i<5?{actual:14+i}:{}),expected,low:12+i%2,high:20+i%4,balance,censored:actual&&(i===2||i===3)};});};
const common={site:'بیمارستان مرکزی',siteId:'10000000-0000-4000-8000-000000000016',currency:'IRR',snapshot:'2026-10-19T07:00:00Z',horizon:28,reviewPeriod:7};
export const supplyRisks:SupplyRisk[]=[
{...common,id:'RISK-1001',item:'سرم نرمال سالین ۰٫۹٪',code:'IV-NS-500',category:'مصرفی پزشکی',location:'انبار دارو - قفسه A3',criticality:'high',riskType:'projected_stockout',usable:140,reserved:30,quarantined:20,expired:10,damaged:5,inbound:24,outbound:15,stockout:'2026-10-24',probability:.72,quality:'good',owner:'مریم احمدی',caseId:'CASE-1001',detected:'2026-10-18T08:30:00Z',forecastRef:'FC-NS-2026-10-v3',leadTime:5,safetyStock:20,targetStock:150,pack:12,minOrder:24,price:85000,supplier:'تجهیز سلامت',lots:[{id:'LOT-NS-01',location:'A3',quantity:7,unit:'جعبه',base:140,conversion:'20 واحد/جعبه · CV-2',disposition:'usable_unreserved',expiry:'2027-04-20',received:'2026-09-02',quality:'good',source:'INV-SNAP-774'},{id:'LOT-NS-02',location:'A3',quantity:30,unit:'واحد',base:30,conversion:'واحد پایه',disposition:'usable_reserved',expiry:'2027-02-15',received:'2026-08-10',quality:'good',source:'INV-SNAP-774'},{id:'LOT-NS-Q',location:'قرنطینه',quantity:20,unit:'واحد',base:20,conversion:'واحد پایه',disposition:'quarantined',expiry:'2027-01-01',received:'2026-07-01',quality:'warning',source:'INV-SNAP-774'},{id:'LOT-NS-X',location:'A4',quantity:10,unit:'واحد',base:10,conversion:'واحد پایه',disposition:'expired',expiry:'2026-10-01',received:'2026-05-02',quality:'warning',source:'INV-SNAP-774'},{id:'LOT-NS-D',location:'انبار اقلام مسدود',quantity:5,unit:'واحد',base:5,conversion:'واحد پایه',disposition:'damaged',expiry:'2027-04-20',received:'2026-09-02',quality:'warning',source:'INV-SNAP-774'}],history:[{at:'2026-10-17',label:'ریسک شناسایی شد',detail:'موجودی قابل برنامه‌ریزی کمتر از سطح هدف است.'},{at:'2026-10-18',label:'پیش‌بینی به‌روزرسانی شد',detail:'FC-NS-2026-10-v3'}],forecast:days(28,140,true)},
{...common,id:'RISK-1002',item:'آموکسی‌سیلین ۵۰۰ میلی‌گرم',code:'AMX-500-CAP',category:'دارو',location:'داروخانه مرکزی - B1',criticality:'medium',riskType:'expiry_exposure',usable:220,reserved:40,quarantined:0,expired:0,damaged:0,inbound:0,outbound:20,stockout:'2026-11-12',quality:'limited',owner:'علی رضایی',caseId:'CASE-1002',detected:'2026-10-18T10:00:00Z',forecastRef:'FC-AMX-2026-10-v1',leadTime:9,safetyStock:25,targetStock:180,pack:10,minOrder:10,supplier:'قیمت نامشخص',lots:[{id:'LOT-AMX-77',location:'B1',quantity:220,unit:'کپسول',base:220,conversion:'واحد پایه',disposition:'usable_unreserved',expiry:'2026-12-10',received:'2026-07-01',quality:'limited',source:'INV-SNAP-779'}],history:[{at:'2026-10-18',label:'پرونده کمبود باز شد',detail:'داده تقاضا محدود است.'}],forecast:days(28,220,false)},
{...common,id:'RISK-1003',item:'ست تزریق وریدی',code:'IV-SET-01',category:'مصرفی پزشکی',location:'انبار مصرفی - C2',criticality:'low',riskType:'supplier_delay',usable:300,reserved:50,quarantined:0,expired:0,damaged:0,inbound:60,outbound:20,stockout:'2026-12-05',quality:'warning',owner:'سارا محمدی',caseId:'CASE-1003',detected:'2026-10-18T12:00:00Z',forecastRef:'FC-IVSET-2026-10-v2',leadTime:12,safetyStock:30,targetStock:250,pack:25,minOrder:50,supplier:'پارس درمان',lots:[{id:'LOT-IV-11',location:'C2',quantity:300,unit:'ست',base:300,conversion:'واحد پایه',disposition:'usable_unreserved',expiry:'2028-01-15',received:'2026-08-15',quality:'warning',source:'INV-SNAP-780'}],history:[{at:'2026-10-18',label:'تأخیر تأمین‌کننده ثبت شد',detail:'زمان تحویل نیازمند بازبینی است.'}],forecast:days(28,300,false)}];

// Independent, deterministic *demo* records for selectable hospitals. They are
// synthetic fixtures, not clinical inventory, and never overwrite Central data.
const demoHospitals = [
 {id:'10000000-0000-4000-8000-000000000011', code:'TAL', name:'بیمارستان آیت‌الله طالقانی', stock:[160,190,275], demand:1.10, lead:1},
 {id:'10000000-0000-4000-8000-000000000012', code:'IMH', name:'بیمارستان امام حسین (ع)', stock:[120,240,325], demand:1.25, lead:2},
 {id:'10000000-0000-4000-8000-000000000013', code:'SHD', name:'بیمارستان شهدای تجریش', stock:[180,210,250], demand:0.95, lead:0},
 {id:'10000000-0000-4000-8000-000000000014', code:'MFD', name:'مرکز تخصصی کودکان مفید', stock:[100,160,225], demand:0.85, lead:3},
] as const;
const originalDemoRisks=[...supplyRisks];
for(const hospital of demoHospitals){
 originalDemoRisks.forEach((base,index)=>{
  const usable=hospital.stock[index];
  const lots=base.lots.map((lot,lotIndex)=>{
   const baseAmount=lotIndex===0?usable:lot.base;
   const rate=lot.base/lot.quantity;
   return {...lot,id:`${hospital.code}-${lot.id}`,base:baseAmount,
     quantity:lotIndex===0?baseAmount/rate:lot.quantity,
     location:`${hospital.code} / ${lot.location}`,
     source:`DEMO-${hospital.code}-${lot.source}`};
  });
  let balance=usable;
  const forecast=base.forecast.map(point=>{
   const expected=Math.max(1,Math.round(point.expected*hospital.demand));
   balance-=expected;
   return {...point,expected,low:Math.max(0,Math.round(point.low*hospital.demand)),
     high:Math.round(point.high*hospital.demand),balance};
  });
  const stockout=forecast.findIndex(p=>p.balance<0);
  const date=new Date('2026-10-19T00:00:00Z');
  date.setUTCDate(date.getUTCDate()+(stockout<0?base.horizon:stockout+1));
  supplyRisks.push({...base,
    id:`RISK-${hospital.code}-${String(index+1).padStart(4,'0')}`,
    caseId:`CASE-${hospital.code}-${String(index+1).padStart(4,'0')}`,
    site:hospital.name,siteId:hospital.id,usable,lots,forecast,
    stockout:date.toISOString().slice(0,10),leadTime:base.leadTime+hospital.lead,
    forecastRef:`${base.forecastRef}-${hospital.code}-DEMO`,
    owner:`${base.owner} (نمونه ${hospital.code})`,
    location:`${hospital.name} / ${base.location}`,
    history:base.history.map(h=>({...h,detail:`${h.detail} (داده ساختگی ${hospital.name})`}))
  });
 });
}

export const supplyCases:SupplyCase[]=supplyRisks.map((r,i)=>({id:r.caseId,riskId:r.id,item:r.item,site:r.site,criticality:r.criticality,stockout:r.stockout,owner:r.owner,status:i===0?'under_review':'open',updatedAt:'2026-10-19T07:00:00Z',activity:[{at:'2026-10-18',text:'پرونده کمبود شناسایی شد'},{at:'2026-10-19',text:'شواهد موجودی و پیش‌بینی در دسترس است'}],outcome:i===1?'نتیجه اقدام هنوز تأیید نشده است.':'هنوز اقدام منبعی ثبت نشده است.',actionState:i===1?'uncertain':undefined}));
const KEY='him.supply.proposals.v1';
export function getProposals():SupplyProposal[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]') as SupplyProposal[]}catch{return []}}
export function saveProposal(p:SupplyProposal){const rows=getProposals(),old=rows.find(x=>x.id===p.id);const saved:SupplyProposal={...p,updatedAt:new Date().toISOString(),revision:old?old.revision+1:1,history:old?[...old.history,{at:new Date().toISOString(),text:'نسخه نمایشی به‌روزرسانی شد'}]:[{at:new Date().toISOString(),text:'پیش‌نویس نمایشی ایجاد شد'}]};localStorage.setItem(KEY,JSON.stringify([...rows.filter(x=>x.id!==p.id),saved]));
try {const all=JSON.parse(localStorage.getItem(VERSION_KEY)||'{}') as Record<string,ProposalVersion[]>;
 const previous=all[p.id]||[];
 // Historical values predating this feature cannot be reconstructed. Retain
 // the currently known previous revision as the first recoverable snapshot.
 const versions=previous.length?previous:(old?[versionOf(old)]:[]);
 all[p.id]=[...versions.filter(v=>v.revision!==saved.revision),versionOf(saved)].sort((a,b)=>a.revision-b.revision);
 localStorage.setItem(VERSION_KEY,JSON.stringify(all));
 }catch{/* Main draft saving must not be blocked by optional snapshot storage. */}
return saved}
// Full snapshots are stored separately from the current proposal to preserve
// existing proposal shape and keep older localStorage records readable.
const VERSION_KEY='him.supply.proposalVersions.v1';
export type ProposalVersion=Pick<SupplyProposal,'id'|'revision'|'quantity'|'unit'|'supplier'|'leadTime'|'arrival'|'reason'|'editReason'|'status'|'updatedAt'|'assumptions'|'destination'|'source'|'sourceLotId'|'destinationDemand'|'minimumShelfLifeDays'>;
const versionOf=(p:SupplyProposal):ProposalVersion=>({id:p.id,revision:p.revision,quantity:p.quantity,unit:p.unit,supplier:p.supplier,leadTime:p.leadTime,arrival:p.arrival,reason:p.reason,editReason:p.editReason,status:p.status,updatedAt:p.updatedAt,assumptions:p.assumptions,destination:p.destination,source:p.source,sourceLotId:p.sourceLotId,destinationDemand:p.destinationDemand,minimumShelfLifeDays:p.minimumShelfLifeDays});
export function getProposalVersions(id:string):ProposalVersion[]{
 try {const all=JSON.parse(localStorage.getItem(VERSION_KEY)||'{}') as Record<string,ProposalVersion[]>;
 const versions=all[id]||[]; if(versions.length) return versions;
 // Existing drafts never stored their older values; do not invent a history.
 const current=getProposals().find(p=>p.id===id);
 return current?[versionOf(current)]:[];
 }catch{return []}
}
export const statusLabels:Record<CaseStatus,string>={open:'باز',under_review:'در حال بررسی',mitigation_planned:'برنامه کاهش ریسک ثبت شده',awaiting_action:'در انتظار اقدام',monitoring:'تحت پایش',closed:'بسته‌شده'};
export const proposalStatusLabels:Record<ProposalStatus,string>={draft:'پیش‌نویس',validated:'بررسی‌شده',withdrawn:'پس‌گرفته‌شده',converted_to_action:'تبدیل‌شده به پیشنهاد اقدام'};
const CASE_KEY='him.supply.cases.v1';
export function getCases():SupplyCase[]{try{const saved=JSON.parse(localStorage.getItem(CASE_KEY)||'[]') as SupplyCase[];return supplyCases.map(base=>saved.find(x=>x.id===base.id)||base)}catch{return supplyCases}}
export function saveCase(c:SupplyCase){const rows=getCases();localStorage.setItem(CASE_KEY,JSON.stringify([...rows.filter(x=>x.id!==c.id),c]));return c}
