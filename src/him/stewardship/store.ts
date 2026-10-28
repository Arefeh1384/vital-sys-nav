import { SITES_DATA } from '../data/mockData';

export type IssueState = 'open'|'triaged'|'in_progress'|'resolution_proposed'|'approved_for_change'|'awaiting_verification'|'resolved'|'closed'|'blocked'|'rejected_proposal'|'accepted_exception'|'reopened';
export type Severity = 'critical'|'high'|'medium'|'low';
export type Dimension = 'completeness'|'validity'|'uniqueness'|'referential_integrity'|'consistency'|'timeliness'|'distribution';
export type ResolutionType = 'source_correction'|'platform_mapping_change'|'rule_change'|'accepted_exception';
export type VerificationState = 'queued'|'running'|'passed'|'failed'|'insufficient_data';
export type HistoryEvent = { id:string; type:string; at:string; actor:string; from?:IssueState; to?:IssueState; reason:string; reference?:string };
export type Observation = { id:string; at:string; count:number; snapshot:string };
export type QualityRuleVersion = { id:string; key:string; version:string; dimension:Dimension; description:string; expected:string; actual:string; evaluatedAt:string };
export type Sample = { id:string; field:string; observed:string; expected:string; reason:string; snapshot:string };
export type Resolution = { id:string; type:ResolutionType; detail:string; evidence:string; sourceOwner:string; sourceRef:string; scope:string; controls:string; expiry:string; oldVersion:string; newVersion:string; preview?:ImpactPreview; review:'pending'|'approved'|'rejected'; reviewer?:string; implementationRef?:string; implementer?:string; implementationAt?:string };
export type DownstreamKind = 'metric'|'forecast'|'draft_recommendation'|'pending_action';
export type ImpactState = 'known'|'partial'|'unknown';
export type DownstreamImpact = {id:string;title:string;kind:DownstreamKind;siteId:string;snapshot:string;dependency:string;reason:string;current:string;proposed:string|null;formula?:string;state:ImpactState;revalidation:string;route?:string};
export type ImpactPreview = { version:number; signature:string; generatedAt:string; partitions:string[]; records:number|null; metrics:string[]; reports:string[]; forecasts:string[]; actions:string[]; uncertainty:string[]; outputs:DownstreamImpact[]; mapping?:{oldVersion:string;newVersion:string;fromUnits:number;toUnits:number;samplePacks:number;before:number;after:number;fixtureResult:string}; checks?:string[] };
// Synthetic, typed dependencies for the quarantined-unit fixture only. No real data is changed.
const MAPPING_DEPENDENCIES = (siteId:string): DownstreamImpact[] => [
 {id:'MET-TAL-UNIT-001',title:'شاخص تعداد قرص بر مبنای بسته',kind:'metric',siteId,snapshot:'MET-v1 · SNAP-202610',dependency:'inventory.unit_code → mapping(pack→tablet) → derived_quantity',reason:'۲ بسته در ورودی ساختگی شاخص ثبت شده است',current:'20 tablets',proposed:null,formula:'2 pack × conversion factor',state:'known',revalidation:'محاسبه دوباره شاخص مشتق‌شده',route:undefined},
 {id:'FC-TAL-UNIT-001',title:'پیش‌بینی مصرف اقلام',kind:'forecast',siteId,snapshot:'FC-v1 · 2026-10',dependency:'inventory.unit_code → derived_quantity → forecast input',reason:'ورودی نرمال‌شده مدل به نگاشت واحد وابسته است؛ ضرایب مدل در فیکسچر وجود ندارد',current:'پیش‌بینی ثبت‌شده FC-v1 (تاریخی)',proposed:null,state:'partial',revalidation:'اجرای شبیه‌سازی مجدد مدل با داده اصلاح‌شده و مقایسه نسخه‌ها'},
 {id:'DRAFT-TAL-001',title:'پیشنهاد تأمین پیش‌نویس نمایشی',kind:'draft_recommendation',siteId,snapshot:'DRAFT-v1 · SNAP-202610',dependency:'inventory.unit_code → derived_quantity → recommendation quantity',reason:'مقدار ورودی این پیش‌نویس در فیکسچر ۲ بسته است؛ پیشنهاد اجراشده تغییر نمی‌کند',current:'20 tablets (مبنای محاسبه پیش‌نویس)',proposed:null,formula:'2 pack × conversion factor',state:'known',revalidation:'بازمحاسبه پیش‌نویس جدید؛ حفظ ورودی و نسخه تاریخی'},
 {id:'ACT-TAL-REVALIDATE-001',title:'اقدام کنترل کیفیت پیش از انتشار',kind:'pending_action',siteId,snapshot:'ACTION-v1 · pending',dependency:'mapping proposal → impacted metric/forecast/draft → approval gate',reason:'وابستگی‌های شاخص، پیش‌بینی و پیش‌نویس باید دوباره کنترل شوند',current:'در انتظار اعتبارسنجی',proposed:'در انتظار اعتبارسنجی نسخه پیشنهادی',state:'known',revalidation:'تأیید مستقل نتایج نمایشی قبل از هر اقدام بعدی'}
];
// Parse a *proposed* pack-to-tablet mapping in either language. The existing
// fixture defines the baseline as 10 tablets/pack; the user need not repeat it.
// Unsupported/ambiguous descriptions do not silently create an empty preview.
export function mappingProposalFactor(detail:string):number|null {
 const normalized=detail.normalize('NFKC')
  .replace(/[۰-۹]/g,ch=>String(ch.charCodeAt(0)-0x06F0))
  .replace(/[٠-٩]/g,ch=>String(ch.charCodeAt(0)-0x0660))
  .replace(/[ك]/g,'ک').replace(/[ي]/g,'ی').replace(/[\u200c\u200f\u200e]/g,' ');
 const matches=[...normalized.matchAll(/(?:\b(?:1\s*)?packs?\b|(?:هر\s*)?(?:1\s*)?بسته)\s*(?:=|:|معادل|برابر\s+با|is)\s*([0-9]+)\s*(?:tablets?\b|قرص)/gi)];
 if(!matches.length)return null;
 const values=matches.map(m=>Number(m[1]));
 if(values.some(v=>!Number.isSafeInteger(v)||v<=0))return null;
 if(values.length>2)return null;
 // A two-sided comparison must refer to the known, immutable fixture baseline.
 if(values.length===2&&values[0]!==10)return null;
 return values[values.length-1];
}
export function proposalSignature(r:Resolution):string {return JSON.stringify([r.type,r.detail,r.oldVersion,r.newVersion,r.scope,r.sourceRef]);}
export function getImpactOutput(id:string,outputId:string,siteId:string){const issue=getQualityIssue(id);if(!issue||issue.siteId!==siteId)return undefined;return issue.resolution?.preview?.outputs.find(o=>o.id===outputId&&o.siteId===siteId);}

export type Verification = { status:VerificationState; requestedAt:string; at?:string; verifier?:string; snapshot:string; checks:number; passed:number; remaining:number|null; evidence:string };
export interface QualityIssue { id:string; fingerprint:string; title:string; description:string; orgId:string; siteId:string; datasetId:string; sourceSystem:string; partition:string; snapshot:string; cutoff:string; rule:QualityRuleVersion; dimension:Dimension; severity:Severity; state:IssueState; owner:string; sourceOwner:string; ruleOwner:string; dueAt:string; firstSeen:string; lastSeen:string; recordVersion:number; fields:string[]; samples:Sample[]; observations:Observation[]; impact:{metrics:string[];reports:string[];alerts:string[];models:string[]; eligibility:string}; investigation:string; cause:string; notes:string; blocker:string; resumeState:IssueState; reviewDate:string; resolution?:Resolution; verification?:Verification; history:HistoryEvent[]; originalClosedAt?:string; latestObservationId?:string }
export const STATE_LABELS:Record<IssueState,string> = {open:'باز',triaged:'غربال‌شده',in_progress:'در حال بررسی',resolution_proposed:'اصلاح پیشنهادی',approved_for_change:'مجاز برای تغییر',awaiting_verification:'در انتظار راستی‌آزمایی',resolved:'حل‌شده',closed:'بسته‌شده',blocked:'مسدود',rejected_proposal:'پیشنهاد ردشده',accepted_exception:'استثنای پذیرفته‌شده',reopened:'بازگشایی‌شده'};
export const DIMENSION_LABELS:Record<Dimension,string> = {completeness:'کامل بودن داده',validity:'معتبر بودن داده',uniqueness:'یکتایی',referential_integrity:'یکپارچگی ارجاعی',consistency:'سازگاری داده',timeliness:'به‌موقع بودن',distribution:'توزیع داده'};
export const SEVERITY_LABELS:Record<Severity,string> = {critical:'بحرانی',high:'زیاد',medium:'متوسط',low:'کم'};
export const RESOLUTION_LABELS:Record<ResolutionType,string>={source_correction:'اصلاح در سیستم منبع',platform_mapping_change:'تغییر نگاشت پلتفرم',rule_change:'تغییر قاعده',accepted_exception:'پذیرش استثنای مدت‌دار'};
const NOW='2026-10-24T06:00:00.000Z';
const fixtureDefs:[string,Dimension,number,Severity,string,string][]=[
 ['شناسه کالا در اطلاعات موجودی خالی است','completeness',5,'critical','inventory','item_id'],
 ['مقدار موجودی منفی ثبت شده است','validity',3,'high','inventory','available_qty'],
 ['واحد اندازه‌گیری ناشناخته و قرنطینه شده است','referential_integrity',1,'high','inventory','unit_code'],
 ['کلید تکراری در مراجعه','uniqueness',2,'medium','encounters','encounter_id'],
 ['زمان دریافت داده از حد مجاز گذشته است','timeliness',4,'medium','laboratory','received_at'],
 ['ناسازگاری کد بخش میان دو منبع','consistency',2,'high','admissions','ward_code']
];
export function initialIssues():QualityIssue[]{
 const issues:QualityIssue[]=[];
 SITES_DATA.forEach((site,si)=>fixtureDefs.forEach(([title,dimension,count,severity,dataset,field],i)=>{
 const id=`DQ-${site.code.replace('SITE-','')}-${String(i+1).padStart(3,'0')}`;
 const at=`2026-10-${String(12+i).padStart(2,'0')}T08:00:00Z`;
 const ruleKey=`DQ-${dimension.toUpperCase()}-${i+1}`;
 const samples=Array.from({length:Math.min(count,5)},(_,j)=>({id:`SYN-${si+1}-${i+1}-${j+1}`,field,observed: i===0?'(null)':i===1?'-3':i===2?'UNKNOWN':'نمونه نامعتبر',expected:i===0?'شناسه الزامی':i===1?'مقدار ≥ ۰':i===2?'واحد شناخته‌شده':'شرط قاعده',reason:title,snapshot:`SNAP-${si+1}-20261024`}));
 issues.push({id,fingerprint:`${site.orgId}:${site.id}:${dataset}:${ruleKey}:${field}`,title,description:`در داده نمایشی ${dataset}، قاعده ${ruleKey} نقض شده است.`,orgId:site.orgId,siteId:site.id,datasetId:dataset,sourceSystem:'HIS نمونه',partition:'2026-10',snapshot:`SNAP-${si+1}-20261024`,cutoff:NOW,rule:{id:`${ruleKey}-v2`,key:ruleKey,version:'v2',dimension,description:title,expected:samples[0]?.expected||'مقدار معتبر',actual:title,evaluatedAt:NOW},dimension,severity,state:'open',owner:'',sourceOwner:'مالک سیستم منبع',ruleOwner:'مدیر حاکمیت داده',dueAt:'2026-10-30',firstSeen:at,lastSeen:NOW,recordVersion:1,fields:[field],samples,observations:[{id:`OBS-${id}-1`,at,count,snapshot:`SNAP-${si+1}-20261024`}],impact:{metrics:i===0?['موجودی قابل برنامه‌ریزی']:i===2?['تبدیل واحد']:[],reports:i===0?['گزارش موجودی']:[],alerts:[],models:i===2?['پیش‌بینی تقاضا']:[],eligibility:i<3?'نیازمند بازبینی مصرف‌کننده‌های مرتبط':'بدون مسدودی سراسری'},investigation:'',cause:'',notes:'',blocker:'',resumeState:'in_progress',reviewDate:'',history:[{id:`EV-${id}-1`,type:'detected',at,actor:'موتور نمونه کیفیت داده',to:'open',reason:'ثبت نقض قاعده'}]});
 }));
 return issues;
}
const KEY='him.stewardship.issues.v1';
export function listQualityIssues():QualityIssue[]{try{const raw=localStorage.getItem(KEY);const v=raw?JSON.parse(raw):null;return Array.isArray(v)?v:initialIssues()}catch{return initialIssues()}}
export function getQualityIssue(id:string){return listQualityIssues().find(x=>x.id===id)}
export function getIssueObservations(id:string){return getQualityIssue(id)?.observations??[]}
export function getIssueSamples(id:string){return getQualityIssue(id)?.samples??[]}
export function getIssueImpact(id:string){return getQualityIssue(id)?.impact}
export function getIssueHistory(id:string){return getQualityIssue(id)?.history??[]}
export function saveQualityIssue(issue:QualityIssue){const all=listQualityIssues(),index=all.findIndex(x=>x.id===issue.id);const updated={...issue,recordVersion:issue.recordVersion+1};if(index>=0)all[index]=updated;else all.push(updated);try{localStorage.setItem(KEY,JSON.stringify(all))}catch{};return updated}
export function mutateQualityIssue(id:string,actor:string,type:string,reason:string,patch:Partial<QualityIssue>){const old=getQualityIssue(id);if(!old)throw Error('پرونده پیدا نشد');const next={...old,...patch,history:[...old.history,{id:`EV-${id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:new Date().toISOString(),actor,type,from:old.state,to:patch.state??old.state,reason}]};return saveQualityIssue(next)}
export function assignIssue(id:string,owner:string,reason:string,dueAt:string,actor:string){if(!owner.trim()||!reason.trim()||!dueAt)throw Error('مسئول، دلیل و موعد الزامی هستند');return mutateQualityIssue(id,actor,'assigned',`${reason} · مسئول: ${owner}`,{owner,dueAt})}
export function bulkAssignIssues(ids:string[],owner:string,reason:string,dueAt:string,authorizedSiteIds:string[],actor:string){const all=listQualityIssues();if(ids.length===0||ids.length>100||!owner.trim()||!reason.trim()||!dueAt)throw Error('ورودی واگذاری گروهی نامعتبر است');if(ids.some(id=>!all.some(i=>i.id===id&&authorizedSiteIds.includes(i.siteId))))throw Error('حداقل یک پرونده خارج از سطح دسترسی است؛ هیچ تغییری ثبت نشد');const updated=all.map(i=>ids.includes(i.id)?{...i,owner,dueAt,recordVersion:i.recordVersion+1,history:[...i.history,{id:`EV-${i.id}-${Date.now()}`,type:'bulk_assignment',actor,at:new Date().toISOString(),reason:`${reason} · ${owner}`,from:i.state,to:i.state}]}:i);localStorage.setItem(KEY,JSON.stringify(updated));return updated}
export function triageIssue(id:string,owner:string,dueAt:string,notes:string,actor:string){const i=getQualityIssue(id);if(!i||!['open','reopened'].includes(i.state)||!owner.trim()||!notes.trim())throw Error('برای غربال‌گری، مالک و یادداشت الزامی هستند');return mutateQualityIssue(id,actor,'triage',notes,{owner,dueAt,state:'triaged',notes})}
export function saveInvestigation(id:string,findings:string,cause:string,actor:string){const i=getQualityIssue(id);if(!i||i.state!=='in_progress'||!findings.trim())throw Error('ابتدا بررسی را شروع و نتیجه را وارد کنید');return mutateQualityIssue(id,actor,'investigation',findings,{investigation:findings,cause})}
export function createResolutionProposal(id:string,resolution:Resolution,actor:string){const i=getQualityIssue(id);if(!i||i.state!=='in_progress'||!i.investigation||!resolution.detail.trim())throw Error('پیش‌نیازهای پیشنهاد اصلاح کامل نیست');if(resolution.type==='accepted_exception'&&(!resolution.expiry||!resolution.controls||!resolution.sourceOwner))throw Error('استثنا نیازمند مالک ریسک، کنترل جبرانی و انقضاست');return mutateQualityIssue(id,actor,'resolution_proposed',resolution.detail,{resolution,state:'resolution_proposed'})}
export function previewResolutionImpact(id:string,actor:string){
 const i=getQualityIssue(id);if(!i?.resolution||i.state!=='resolution_proposed')throw Error('پیشنهاد اصلاح در انتظار بررسی پیدا نشد');
 const r=i.resolution;
 const factor=r.type==='platform_mapping_change'&&i.fields.includes('unit_code')?mappingProposalFactor(r.detail):null;
 if(r.type==='platform_mapping_change'&&i.id==='DQ-TALEGHANI-003'&&factor===null)throw Error('شرح نگاشت قابل تشخیص نیست. نمونه معتبر: «هر بسته = ۲۰ قرص» یا «1 pack = 20 tablets». پیش‌نمایش ساخته نشد.');
 const fixture=i.id==='DQ-TALEGHANI-003' && factor!==null;
 const outputs:DownstreamImpact[]=fixture?MAPPING_DEPENDENCIES(i.siteId).map(o=>({...o,proposed:o.formula?`${2*factor} tablets`:o.proposed})):[];
 const preview:ImpactPreview={version:i.recordVersion+1,signature:proposalSignature(r),generatedAt:new Date().toISOString(),partitions:[i.partition],records:i.observations.at(-1)?.count??null,metrics:i.impact.metrics,reports:i.impact.reports,forecasts:i.impact.models,actions:outputs.filter(o=>o.kind==='pending_action').map(o=>o.id),outputs,uncertainty:['پیش‌نمایش مصنوعی است؛ هیچ نگاشت یا ورودی تاریخی اجرا یا تغییر نمی‌کند',...(fixture?['خروجی پیش‌بینی قابل محاسبه نیست: ضرایب مدل در فیکسچر موجود نیست']:['برای این پیشنهاد رابطه محاسباتی تایپ‌شده ثبت نشده است'])],...(fixture?{mapping:{oldVersion:r.oldVersion,newVersion:r.newVersion,fromUnits:10,toUnits:factor!,samplePacks:2,before:20,after:2*factor!,fixtureResult:`قبول: ۲ بسته × ${factor} قرص = ${2*factor} قرص (داده مصنوعی)`},checks:[`آزمون واحد: ۲ × ${factor} = ${2*factor} (موفق؛ مصنوعی)`,'بازاعتبارسنجی مدل پیش‌بینی هنوز اجرا نشده است']}: {})};
 return mutateQualityIssue(id,actor,'impact_preview','پیش‌نمایش مصنوعی ایجاد شد؛ هیچ داده‌ای اعمال نشد',{resolution:{...r,preview}});
}
export function reviewResolution(id:string,approved:boolean,reviewer:string,actor:string){const i=getQualityIssue(id);if(!i?.resolution||i.state!=='resolution_proposed'||!reviewer.trim())throw Error('بررسی معتبر نیست');if(approved&&reviewer.trim().toLocaleLowerCase()===i.owner.trim().toLocaleLowerCase())throw Error('بازبین مستقل نباید مسئول بررسی همین پرونده باشد');if(i.resolution.type!=='source_correction'&&(!i.resolution.preview||i.resolution.preview.signature!==proposalSignature(i.resolution)))throw Error('پیش‌نمایش معتبر بر اساس پیشنهاد فعلی لازم است');return mutateQualityIssue(id,actor,'review',approved?'تأیید نمایشی':'رد پیشنهاد',{state:approved?'approved_for_change':'rejected_proposal',resolution:{...i.resolution,review:approved?'approved':'rejected',reviewer}})}
export function recordImplementation(id:string,ref:string,actor:string){const i=getQualityIssue(id);if(!i?.resolution||i.state!=='approved_for_change'||!ref.trim())throw Error('شواهد ثبت اجرای نمایشی لازم است');return mutateQualityIssue(id,actor,'implementation','ثبت مرجع شواهد نمایشی',{resolution:{...i.resolution,implementationRef:ref,implementer:actor,implementationAt:new Date().toISOString()}})}
export function requestVerification(id:string,actor:string){const i=getQualityIssue(id);if(!i?.resolution||i.state!=='approved_for_change'||!i.resolution.implementationRef)throw Error('ابتدا تأیید و شواهد اجرا لازم است');const v:Verification={status:'queued',requestedAt:new Date().toISOString(),snapshot:i.snapshot,checks:1,passed:0,remaining:null,evidence:''};return mutateQualityIssue(id,actor,'verification_requested','درخواست راستی‌آزمایی نمایشی',{state:'awaiting_verification',verification:v})}
export function getVerificationResult(id:string){return getQualityIssue(id)?.verification}
export function finishVerification(id:string,result:'passed'|'failed'|'insufficient_data',verifier:string,actor:string){const i=getQualityIssue(id);if(!i?.verification||i.state!=='awaiting_verification'||!verifier.trim())throw Error('درخواست بررسی معتبر نیست');if(result==='passed'&&[i.owner,i.resolution?.implementer,i.resolution?.reviewer].some(person=>person?.trim()&&person.trim().toLocaleLowerCase()===verifier.trim().toLocaleLowerCase()))throw Error('راستی‌آزما باید از ثبت‌کننده اصلاح مستقل باشد');const v={...i.verification,status:result,at:new Date().toISOString(),verifier,checks:result==='insufficient_data'?0:1,passed:result==='passed'?1:0,remaining:result==='failed'?i.observations.at(-1)?.count??1:result==='passed'?0:null,evidence:`SYN-VERIFY-${id}-${result}`};return mutateQualityIssue(id,actor,'verification_result',`نتیجه نمایشی: ${result}`,{verification:v,state:result==='failed'?'in_progress':i.state})}
export function closeIssue(id:string,reason:string,actor:string){const i=getQualityIssue(id);if(!i||i.state!=='resolved'||i.verification?.status!=='passed'||!reason.trim())throw Error('بستن پرونده نیازمند راستی‌آزمایی موفق است');return mutateQualityIssue(id,actor,'closed',reason,{state:'closed',originalClosedAt:new Date().toISOString()})}
export function reopenIssue(id:string,reason:string,actor:string){const i=getQualityIssue(id);if(!i||i.state!=='closed'||!reason.trim())throw Error('فقط پرونده بسته‌شده را می‌توان بازگشایی کرد');const o={id:`OBS-${id}-${Date.now()}`,at:new Date().toISOString(),count:1,snapshot:`RECUR-${id}`};return mutateQualityIssue(id,actor,'reopened',reason,{state:'reopened',lastSeen:o.at,latestObservationId:o.id,observations:[...i.observations,o]})}
export function transitionIssue(id:string,to:IssueState,actor:string,reason:string){const i=getQualityIssue(id);if(!i)throw Error('پرونده پیدا نشد');const allowed:Partial<Record<IssueState,IssueState[]>>={triaged:['in_progress','blocked'],reopened:['triaged','blocked'],in_progress:['blocked'],rejected_proposal:['in_progress'],blocked:[i.resumeState],awaiting_verification:['resolved'],resolved:['closed']};if(!allowed[i.state]?.includes(to))throw Error('این انتقال وضعیت مجاز نیست');if(to==='in_progress'&&!i.owner)throw Error('ابتدا مسئول مشخص کنید');if(to==='resolved'&&i.verification?.status!=='passed')throw Error('راستی‌آزمایی معتبر لازم است');return mutateQualityIssue(id,actor,'transition',reason,{state:to,blocker:to==='blocked'?reason:i.blocker,resumeState:to==='blocked'?i.state:i.resumeState})}
export function acceptException(id:string,actor:string){const i=getQualityIssue(id);if(!i?.resolution||i.state!=='approved_for_change'||i.resolution.type!=='accepted_exception'||!i.resolution.expiry)throw Error('استثنای دارای تأیید و انقضا لازم است');return mutateQualityIssue(id,actor,'accepted_exception','پذیرش استثنای نمایشی',{state:'accepted_exception'})}
export function getQualityDashboardMetrics(issues:QualityIssue[]){const active=issues.filter(i=>!['closed','resolved'].includes(i.state));return {active:active.length,critical:active.filter(i=>i.severity==='critical').length,unassigned:issues.filter(i=>!i.owner).length,overdue:issues.filter(i=>!['closed','resolved'].includes(i.state)&&i.dueAt.slice(0,10)<new Date().toISOString().slice(0,10)).length,awaiting:issues.filter(i=>i.state==='awaiting_verification').length,reopened:issues.filter(i=>i.state==='reopened').length,closed:issues.filter(i=>i.state==='closed').length}}
export const QUALITY_HEALTH={scheduled:10,passed:7,failed:2,unable:1,executed:9};

export function editResolutionProposal(id:string,changes:Partial<Resolution>,actor:string){
 const i=getQualityIssue(id);if(!i?.resolution||i.state!=='resolution_proposed')throw Error('فقط پیشنهاد در انتظار بررسی قابل ویرایش است');
 return mutateQualityIssue(id,actor,'resolution_edited','پیشنهاد تغییر کرد؛ پیش‌نمایش قبلی نامعتبر است',{resolution:{...i.resolution,...changes,preview:undefined,review:'pending'}});
}
export function startVerification(id:string,actor:string){
 const i=getQualityIssue(id);if(!i?.verification||i.state!=='awaiting_verification'||i.verification.status!=='queued')throw Error('فقط درخواست در صف قابل اجراست');
 return mutateQualityIssue(id,actor,'verification_running','شبیه‌سازی اجرای بررسی',{verification:{...i.verification,status:'running'}});
}
export function expireException(id:string,actor:string){
 const i=getQualityIssue(id);if(!i||i.state!=='accepted_exception'||!i.resolution?.expiry)throw Error('استثنای فعال پیدا نشد');
 return mutateQualityIssue(id,actor,'exception_expired','انقضای شبیه‌سازی‌شده؛ برای بررسی مجدد بازگشایی شد',{state:'reopened'});
}
