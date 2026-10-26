import type { AnswerArtifact } from '../data/copilotData';
export type Alternative = { id:string; title:string; description:string; benefits:string; costs:string; impact:string; risks:string };
export type Memo = { id:string; siteId:string; siteName:string; title:string; creator:string; createdAt:string; updatedAt:string; revision:number; status:'draft'; answerId?:string; answerRevision?:number; range?:string; evidence:AnswerArtifact['evidence']; answerStatus?:string; problem:string; alternatives:Alternative[]; selected:string; recommendation:string; assumptions:string; uncertainty:string; dataLimitations:string; clinicalLimitations:string; owner:string; dueDate:string; followupMetric:string; followup:string };
export type DemoTask = { id:string; siteId:string; title:string; description:string; kind:string; owner:string; queue:string; priority:'low'|'normal'|'high'|'urgent'; dueDate:string; status:'open'|'assigned'|'in_progress'|'blocked'|'submitted_for_review'|'completed'|'canceled'; memoId?:string; answerId?:string; supplyCaseId?:string; evidenceIds:string[]; comments:{ at:string; text:string }[]; history:{at:string; text:string}[]; outcome:string; blocker:string; nextReview:string; reviewRequired:boolean };
const MEMOS='him.phase6.memos.v1', TASKS='him.phase6.tasks.v1', HISTORY='him.phase6.revisions.v1';
function read<T>(key:string):T[]{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function write<T>(key:string,rows:T[]){localStorage.setItem(key,JSON.stringify(rows));}
export const demoStore={
 memos:()=>read<Memo>(MEMOS), tasks:()=>read<DemoTask>(TASKS), revisions:(id:string)=>read<Memo>(HISTORY).filter(m=>m.id===id),
 saveMemo(m:Memo){const rows=read<Memo>(MEMOS);const old=rows.find(x=>x.id===m.id);if(old && JSON.stringify({...old,updatedAt:'',revision:0})===JSON.stringify({...m,updatedAt:'',revision:0}))return old;
 const saved={...m,updatedAt:new Date().toISOString(),revision:old?old.revision+1:1};write(MEMOS,[...rows.filter(x=>x.id!==m.id),saved]);write(HISTORY,[...read<Memo>(HISTORY),structuredClone(saved)]);return saved;},
 saveTask(t:DemoTask){if(!t.title.trim()||t.title.length>200)throw new Error('TASK_TITLE_INVALID');write(TASKS,[...read<DemoTask>(TASKS).filter(x=>x.id!==t.id),t]);return t;}
};
/** Local-demo identifiers: randomUUID is unavailable on some HTTP LAN origins.
 * This is not an authentication, signing or access-control token. */
export function demoUuid(): string {
  const source = globalThis.crypto;
  if (typeof source?.randomUUID === 'function') return source.randomUUID();
  if (typeof source?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    source.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  // Last-resort non-cryptographic fallback strictly for local synthetic records.
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
export const uid = (prefix: string) => `${prefix}-${demoUuid()}`;
export function fromAnswer(answer:AnswerArtifact,siteId:string,siteName:string,creator:string,range?:string):Memo{
 const now=new Date().toISOString();return {id:uid('MEM'),siteId,siteName,creator,createdAt:now,updatedAt:now,revision:0,status:'draft',answerId:answer.id,answerRevision:answer.revision,range,evidence:answer.evidence,answerStatus:answer.status,title:'بررسی شواهد و برنامه پیگیری',problem:answer.blocks.map(b=>b.text).join('\n'),alternatives:[{id:uid('ALT'),title:'ارزیابی و پیگیری وضعیت',description:'بررسی گزینه‌های اجرایی توسط مسئول مربوطه',benefits:'بهبود تصمیم‌گیری',costs:'نامشخص',impact:'نیازمند ارزیابی',risks:'عدم قطعیت اطلاعات'}],selected:'',recommendation:'',assumptions:'',uncertainty:'',dataLimitations:answer.limitations.join('\n'),clinicalLimitations:'',owner:'',dueDate:'',followupMetric:'',followup:''};
}
export function freshMemo(siteId:string,siteName:string,creator:string):Memo{const now=new Date().toISOString();return {id:uid('MEM'),siteId,siteName,creator,createdAt:now,updatedAt:now,revision:0,status:'draft',evidence:[],title:'',problem:'',alternatives:[],selected:'',recommendation:'',assumptions:'',uncertainty:'',dataLimitations:'',clinicalLimitations:'',owner:'',dueDate:'',followupMetric:'',followup:''}}
export function newTask(siteId:string,source:{memo?:Memo;answer?:AnswerArtifact;supplyCaseId?:string;alertId?:string}):DemoTask{
 const {memo,answer}=source;return {id:uid('TASK'),siteId,title:memo?.title || 'بررسی شواهد و ارائه گزارش پیگیری',description:memo?.recommendation||memo?.problem||answer?.blocks.map(b=>b.text).join('\n')||'',kind:'followup',owner:'',queue:'',priority:'normal',dueDate:'',status:'open',memoId:memo?.revision?memo.id:undefined,supplyCaseId:source.supplyCaseId,answerId:memo?.answerId||answer?.id,evidenceIds:memo?.evidence.map(e=>e.id)||answer?.evidence.map(e=>e.id)||(source.alertId?[source.alertId]:[]),comments:[],history:[],outcome:'',blocker:'',nextReview:'',reviewRequired:true};
}
