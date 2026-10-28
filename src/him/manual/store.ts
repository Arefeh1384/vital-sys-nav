import {getProposals, supplyRisks, type SupplyProposal} from '../supply/store';

export type ManualState='draft'|'awaiting_review'|'ready_for_handoff'|'assigned'|'execution_reported'|'awaiting_observation'|'verified_completed'|'disputed'|'expired'|'canceled'|'closed_unverified';
export type Actor={id:string;name:string;siteIds:string[];capabilities:string[]};
export type Effect={action:'replenishment'|'transfer';item:string;quantity:string;unit:string;siteId:string;sourceSystem:string;origin?:string;destination:string;currency?:string};
export type Review={kind:string;role:string;status:'pending'|'approved'|'rejected'|'expired';actorId?:string;at?:string;revision:number};
export type Claim={by:string;at:string;operation:string;quantity:string;unit:string;notes:string};
export type Observation={id:string;operation:string;siteId:string;item:string;action:Effect['action'];quantity:string;unit:string;sourceSystem:string;at:string;revision:string};
export type ObservationRun={at:string;outcome:'exact'|'ambiguous'|'missing'|'mismatch';candidates:Observation[]};
export type Activity={id:string;at:string;actor:string;from:ManualState|null;to:ManualState;reason:string;evidenceId?:string};
export type ManualRecord={id:string;siteId:string;recommendationId:string;recommendationRevision:number;caseId:string;taskId?:string;effect:Effect;state:ManualState;reviews:Review[];proposer:string;executorId?:string;claim?:Claim;observation?:ObservationRun;verifierId?:string;verifiedEvidenceId?:string;reason?:string;deadline:string;updatedAt:string;history:Activity[];version:number};
export const stateLabels:Record<ManualState,string>={draft:'پیش‌نویس',awaiting_review:'در انتظار بررسی',ready_for_handoff:'آماده ارجاع',assigned:'اختصاص‌یافته',execution_reported:'اجرای دستی گزارش‌شده',awaiting_observation:'در انتظار مشاهده نتیجه',verified_completed:'تکمیل تأییدشده',disputed:'دارای اختلاف',expired:'مهلت منقضی‌شده',canceled:'لغوشده',closed_unverified:'بسته‌شده بدون تأیید نتیجه'};
// HIM-OS navigation uses a public site key; Supply fixtures use a UUID.
// Translate only the explicitly recognized Taleghani site, never broadening scope.
const TALEGHANI_WORK_SITE = 'SITE-TALEGHANI';
const TALEGHANI_SUPPLY_SITE = '10000000-0000-4000-8000-000000000011';
const supplySiteFor = (siteId:string) => siteId === TALEGHANI_WORK_SITE ? TALEGHANI_SUPPLY_SITE : siteId;
const inWorkSite = (risk:{siteId:string},siteId:string) => risk.siteId === supplySiteFor(siteId);
const actorSites = [...new Set(supplyRisks.map(r=>r.siteId).concat(
  supplyRisks.some(r=>r.siteId===TALEGHANI_SUPPLY_SITE) ? [TALEGHANI_WORK_SITE] : []
))];
export const DEMO_ACTORS:Actor[]=[
 {id:'proposer',name:'تهیه‌کننده پیشنهاد (نمایشی)',siteIds:actorSites,capabilities:['read','create']},
 {id:'reviewer',name:'مسئول بررسی فرایند (نمایشی)',siteIds:actorSites,capabilities:['read','review']},
 {id:'executor',name:'مجری انسانی الف (نمایشی)',siteIds:actorSites,capabilities:['read','report']},
 {id:'verifier',name:'راستی‌آزمای مستقل ب (نمایشی)',siteIds:actorSites,capabilities:['read','verify']},
 {id:'closer',name:'مسئول بستن پرونده (نمایشی)',siteIds:actorSites,capabilities:['read','close']},
];
const KEY='him.manual.executions.v1';
const now=()=>new Date().toISOString();
function storage(){return typeof window==='undefined'?null:window.localStorage}
export function listManualExecutions():ManualRecord[]{try{return JSON.parse(storage()?.getItem(KEY)||'[]') as ManualRecord[]}catch{return []}}
export function getManualExecution(id:string){return listManualExecutions().find(r=>r.id===id)}
function persist(r:ManualRecord){storage()?.setItem(KEY,JSON.stringify([...listManualExecutions().filter(x=>x.id!==r.id),r]));return r}
function deny(msg: string): never { throw new Error(msg); }
function requireActor(a:Actor|undefined,r:ManualRecord,cap:string){if(!a||!a.capabilities.includes(cap)||!a.siteIds.includes(r.siteId))deny('مجوز نمایشی برای این عملیات یا سایت وجود ندارد.');}
function change(r:ManualRecord,actor:string,to:ManualState,reason:string,evidenceId?:string,extra:Partial<ManualRecord>={}):ManualRecord{const updated={...r,...extra,state:to,version:r.version+1,updatedAt:now(),history:[...r.history,{id:crypto.randomUUID(),at:now(),actor,from:r.state,to,reason,evidenceId}]};return persist(updated)}
export function eligibleRecommendation(p:SupplyProposal){return p.status==='validated'&&p.revision>0&&Number.isFinite(p.quantity)&&p.quantity>0&&!!p.destination.trim()&&!!p.item.trim()&&p.type==='replenishment'&&p.constraints.every(c=>c.state!=='failed'&&c.state!=='unknown')&&supplyRisks.some(r=>r.id===p.riskId&&r.caseId===p.caseId&&r.site===p.site);} // cross-site source review fixture not configured: fail closed
// Dedicated, read-only acceptance fixture. Never saved into Supply or treated as a hospital recommendation.
export const MANUAL_DEMO_PROPOSAL_ID = 'DEMO-MANUAL-REPLENISHMENT-24-V1';
export function manualDemoProposal(siteId:string):SupplyProposal|null {
 const risk = supplySiteFor(siteId) === TALEGHANI_SUPPLY_SITE
  ? supplyRisks.find(r => inWorkSite(r,siteId) && r.riskType === 'projected_stockout')
  : undefined;
 if(!risk)return null;
 return {
  id:MANUAL_DEMO_PROPOSAL_ID,type:'replenishment',riskId:risk.id,caseId:risk.caseId,
  item:`[آزمایش مستقل] ${risk.item}`,site:risk.site,destination:risk.location,
  quantity:24,unit:'واحد',currency:'IRR',status:'validated',revision:1,
  owner:'TEST-FIXTURE',createdAt:'2026-10-24T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z',
  reason:'فیکسچر ثابت آزمون روند اقدام دستی؛ مستقل از محاسبه واقعی Supply',
  assumptions:'صرفاً برای آزمون نقش‌ها، گزارش و تأیید مستقل',editReason:'',
  leadTime:6,arrival:'2026-10-30',supplier:'تأمین‌کننده مصنوعی',
  constraints:[{label:'کنترل داده فیکسچر',state:'passed',detail:'فقط داده ساختگی'}],history:[]
 };
}
export function manualEligibleProposals(siteId:string):SupplyProposal[] {
 const saved=getProposals().filter(p=>eligibleRecommendation(p)&&supplyRisks.some(r=>r.id===p.riskId&&inWorkSite(r,siteId)));
 const demo=manualDemoProposal(siteId);
 const demoEligible=demo!==null&&eligibleRecommendation(demo);
 // TEMPORARY LOCAL DEBUG: remove after identifying the filtering condition.
 console.log('MANUAL SITE DEBUG', {
  receivedSiteId:siteId,
  mappedSupplySite:supplySiteFor(siteId),
  riskCount:supplyRisks.length,
  siteRiskCount:supplyRisks.filter(r=>inWorkSite(r,siteId)).length,
  projectedRiskCount:supplyRisks.filter(r=>inWorkSite(r,siteId)&&r.riskType==='projected_stockout').length,
  demoCreated:demo!==null,
  demoEligible,
  demoRiskId:demo?.riskId,
  savedCount:saved.length,
 });
 return demoEligible?[...saved,demo!]:saved;
}
export function createManualExecutionDraft(proposalId:string,actor:Actor,siteId:string){
 const p=manualEligibleProposals(siteId).find(x=>x.id===proposalId);if(!p||!eligibleRecommendation(p))deny('پیشنهاد واجد شرایط نیست؛ نسخه اعتبارسنجی‌شده و اثر قطعی لازم است.');
 if(!actor.capabilities.includes('create')||!actor.siteIds.includes(siteId)||!supplyRisks.some(r=>r.id===p.riskId&&inWorkSite(r,siteId)))deny('مجوز ایجاد در این سایت یا انطباق سایت پیشنهاد وجود ندارد.');
 const prior=listManualExecutions().find(x=>x.recommendationId===p.id&&x.recommendationRevision===p.revision&&x.state!=='canceled');if(prior)return prior;
 const effect:Effect={action:p.type,item:p.item,quantity:String(p.quantity),unit:p.unit,siteId,sourceSystem:'HIS-DEMO-NO-SAFE-WRITE',destination:p.destination,...(p.price?{currency:p.currency}:{})};
 const r:ManualRecord={id:`MAN-${crypto.randomUUID()}`,siteId,recommendationId:p.id,recommendationRevision:p.revision,caseId:p.caseId,effect,state:'draft',reviews:[{kind:'business',role:'reviewer',status:'pending',revision:p.revision}],proposer:actor.id,deadline:new Date(Date.now()+7*86400000).toISOString(),updatedAt:now(),history:[],version:1};
 return change(r,actor.id,'draft','ایجاد پیش‌نویس نمایشی با ارجاع به نسخه ثابت پیشنهاد');
}
export function submitManualExecutionReview(id:string,actor:Actor){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'create');if(r.state!=='draft')deny('فقط پیش‌نویس قابل ارسال به بررسی است');return change(r,actor.id,'awaiting_review','درخواست بررسی فرایند')}
export function recordMockProcessReview(id:string,actor:Actor,approve:boolean){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'review');if(actor.id===r.proposer)deny('بررسی‌کننده نمی‌تواند همان تهیه‌کننده باشد');if(r.state!=='awaiting_review')deny('پرونده در انتظار بررسی نیست');const reviews=r.reviews.map(v=>({...v,status:(approve?'approved':'rejected') as Review['status'],actorId:actor.id,at:now()}));return change(r,actor.id,approve?'ready_for_handoff':'awaiting_review',approve?'بررسی فرایندی نمایشی پذیرفته شد':'بررسی فرایندی رد شد',undefined,{reviews})}
export function assignManualExecutor(id:string,actor:Actor,executor:Actor){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'review');if(r.state!=='ready_for_handoff'||r.reviews.some(v=>v.status!=='approved'||v.revision!==r.recommendationRevision))deny('تمام بررسی‌های نسخه فعلی تکمیل نشده است');if(!executor.capabilities.includes('report')||!executor.siteIds.includes(r.siteId))deny('مجری انتخاب‌شده مجاز نیست');return change(r,actor.id,'assigned','ارجاع نمایشی به مجری',undefined,{executorId:executor.id})}
export function reportManualExecution(id:string,actor:Actor,input:{operation:string;quantity:string;notes:string}){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'report');if(r.state!=='assigned'||r.executorId!==actor.id)deny('فقط مجری تعیین‌شده می‌تواند گزارش دهد');if(!input.operation.trim()||!/^\d+(\.\d+)?$/.test(input.quantity))deny('شناسه عملیات و مقدار معتبر لازم است');const claim:Claim={by:actor.id,at:now(),operation:input.operation.trim(),quantity:input.quantity,unit:r.effect.unit,notes:input.notes};return change(r,actor.id,'execution_reported','گزارش اجرای دستی ثبت شد؛ نتیجه تأیید نشده است',undefined,{claim})}
export function startObservation(id:string,actor:Actor){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'read');if(r.state!=='execution_reported')deny('گزارش اجرا هنوز ثبت نشده است');return change(r,actor.id,'awaiting_observation','درخواست مشاهده مصنوعی منبع')}
export function runMockSourceObservation(id:string,actor:Actor,scenario:'exact'|'ambiguous'|'missing'|'mismatch'){
 const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'read');if(r.state!=='awaiting_observation')deny('مشاهده در این وضعیت مجاز نیست');
 const base:Observation={id:'OBS-'+r.id,operation:r.claim?.operation||'',siteId:r.siteId,item:r.effect.item,action:r.effect.action,quantity:r.effect.quantity,unit:r.effect.unit,sourceSystem:r.effect.sourceSystem,at:now(),revision:'mock-source-v1'};
 const candidates=scenario==='missing'?[]:scenario==='ambiguous'?[{...base,id:base.id+'-A',operation:''},{...base,id:base.id+'-B',operation:''}]:[{...base,...(scenario==='mismatch'?{quantity:String(Number(base.quantity)+1)}:{})}];
 const outcome:ObservationRun['outcome']=scenario==='exact'&&!!r.claim?.operation&&r.claim.quantity===r.effect.quantity?'exact':scenario==='exact'?'mismatch':scenario;
 return change(r,actor.id,r.state,'بررسی مصنوعی شواهد منبع',undefined,{observation:{at:now(),outcome,candidates}});
}
export function verifyManualExecution(id:string,actor:Actor){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'verify');if(actor.id===r.executorId||actor.id===r.proposer||r.reviews.some(v=>v.actorId===actor.id))deny('تعارض نقش: راستی‌آزما باید مستقل باشد');if(r.state!=='awaiting_observation'||r.observation?.outcome!=='exact'||r.observation.candidates.length!==1)deny('شاهد قطعی و یکتا برای تأیید وجود ندارد');const o=r.observation.candidates[0]!;if(!r.claim||!o.operation||o.operation!==r.claim.operation||o.quantity!==r.claim.quantity||o.quantity!==r.effect.quantity||o.item!==r.effect.item||o.siteId!==r.siteId||o.action!==r.effect.action||o.unit!==r.effect.unit||o.sourceSystem!==r.effect.sourceSystem)deny('تطبیق قطعی با اثر موردنظر برقرار نیست');return change(r,actor.id,'verified_completed','نتیجه اقدام دستی با شواهد نمایشی و بررسی مستقل تأیید شد',o.id,{verifierId:actor.id,verifiedEvidenceId:o.id})}
export function disputeManualExecution(id:string,actor:Actor,reason:string){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'verify');if(!reason.trim()||!['awaiting_observation','expired'].includes(r.state))deny('ثبت اختلاف در این وضعیت ممکن نیست یا دلیل خالی است');return change(r,actor.id,'disputed',reason)}
export function expireManualExecution(id:string,actor:Actor){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'close');if(r.state!=='awaiting_observation'||Date.parse(r.deadline)>Date.now())deny('مهلت مشاهده هنوز به پایان نرسیده است');return change(r,actor.id,'expired','مهلت مشاهده بدون شاهد قطعی پایان یافت')}
export function closeUnverifiedManualExecution(id:string,actor:Actor,reason:string){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'close');if(!['expired','disputed'].includes(r.state)||!reason.trim())deny('دلیل و وضعیت معتبر برای بستن بدون تأیید لازم است');return change(r,actor.id,'closed_unverified',reason)}
export function cancelManualExecution(id:string,actor:Actor,reason:string){const r=getManualExecution(id);if(!r)deny('پرونده یافت نشد');requireActor(actor,r,'create');if(!['draft','awaiting_review','ready_for_handoff'].includes(r.state)||!reason.trim())deny('پس از ارجاع/گزارش، لغو به معنای بازگشت عملیات منبع مجاز نیست');return change(r,actor.id,'canceled',reason)}
export function getManualExecutionHistory(id:string){return getManualExecution(id)?.history||[]}
