import type {WorkAlert,WorkTask} from '../data/workData';
import {SITES_DATA} from '../data/mockData';
import {listQualityIssues} from '../stewardship/store';
import {supplyRisks,getCases} from '../supply/store';

export type Period='day'|'week'|'month';
export type DashboardMetricKey='occupancy'|'alerts'|'criticalAlerts'|'supply'|'quality'|'tasks';
export type MetricQuality='fresh'|'stale'|'unavailable'|'not_computable';
export interface MetricEvidence {id:string;title:string;source:string;snapshot:string;metricVersion:string;asOf:string;scope:string;excerpt:string;limitations:string;}
export interface DashboardMetric {key:DashboardMetricKey;title:string;value:number|null;unit:string;quality:MetricQuality;description:string;formula?:string;numerator?:number;denominator?:number;version:string;asOf:string;evidence:MetricEvidence[];target:string;}
export interface DashboardSnapshot {siteId:string;siteName:string;period:Period;cutoff:string;refreshedAt:string;metrics:DashboardMetric[];alerts:WorkAlert[];tasks:WorkTask[];issues:ReturnType<typeof listQualityIssues>;risks:typeof supplyRisks;}
const OCCUPANCY_FIXTURE:Record<string,{occupied:number;staffed:number;snapshot:string}>= {
 [SITES_DATA[0]?.id||'none']:{occupied:80,staffed:100,snapshot:'SYN-OPS-TAL-20261023-v1'},
 [SITES_DATA[1]?.id||'none']:{occupied:85,staffed:110,snapshot:'SYN-OPS-IMAM-20261023-v1'},
 [SITES_DATA[2]?.id||'none']:{occupied:0,staffed:0,snapshot:'SYN-OPS-SHO-EMPTY-v1'},
};
const activeIssue=(state:string)=>!['closed','resolved'].includes(state);
const activeAlert=(a:WorkAlert)=>a.status!=='resolved';
export function calculateOccupancy(n:number,d:number){return d===0?null:Math.round(n/d*10000)/100;}
export function weightedOccupancy(rows:{occupied:number;staffed:number}[]){return calculateOccupancy(rows.reduce((s,r)=>s+r.occupied,0),rows.reduce((s,r)=>s+r.staffed,0));}
export function getExecutiveDashboard(siteId:string,period:Period,alerts:WorkAlert[],tasks:WorkTask[],now=new Date()):DashboardSnapshot {
 const site=SITES_DATA.find(s=>s.id===siteId);
 const scopedAlerts=alerts.filter(a=>a.siteId===siteId);
 const scopedTasks=tasks.filter(t=>t.siteId===siteId);
 const issues=listQualityIssues().filter(i=>i.siteId===siteId);
 const risks=supplyRisks.filter(r=>r.siteId===siteId);
 const cases=getCases();
 const activeRisk=risks.filter(r=>cases.find(c=>c.riskId===r.id)?.status!=='closed');
 const occupancy=OCCUPANCY_FIXTURE[siteId];
 const cutoff='2026-10-23T23:59:59+03:30';
 const sourceTime='2026-10-23T23:59:59+03:30';
 const evidence:MetricEvidence[]=occupancy?[{id:`EVD-${occupancy.snapshot}`,title:'شواهد ظرفیت و اشغال نمونه',source:'فیکسچر مصنوعی عملیات',snapshot:occupancy.snapshot,metricVersion:'available_staffed_bed_occupancy@1',asOf:sourceTime,scope:siteId,excerpt:`${occupancy.occupied} تخت اشغال‌شده / ${occupancy.staffed} تخت فعال دارای نیروی انسانی`,limitations:'ارقام ساختگی برای آزمون رابط؛ داده بیمارستانی یا HIS نیست.'}]:[];
 const definitions:[DashboardMetricKey,string,number|null,string,string,string,string][]=[
  ['occupancy','نرخ اشغال تخت',occupancy?calculateOccupancy(occupancy.occupied,occupancy.staffed):null,'٪','نسبت تخت اشغال‌شده به تخت فعال دارای نیروی انسانی','/operations','available_staffed_bed_occupancy@1'],
  ['alerts','هشدارهای فعال',scopedAlerts.filter(activeAlert).length,'مورد','هشدارهای حل‌نشده در محدوده جاری','/alerts','alert-lifecycle@1'],
  ['criticalAlerts','هشدارهای بحرانی',scopedAlerts.filter(a=>activeAlert(a)&&a.severity==='critical').length,'مورد','هشدارهای فعال با شدت بحرانی','/alerts','alert-lifecycle@1'],
  ['supply','ریسک‌های کمبود',activeRisk.length,'مورد','ریسک‌های موجود در داده مشترک Supply با پرونده باز','/supply','supply-risk@1'],
  ['quality','مشکلات کیفیت داده',issues.filter(i=>activeIssue(i.state)).length,'مورد','پرونده‌های کیفیت داده به‌جز حل‌شده و بسته‌شده','/knowledge/stewardship/issues','quality-issue@1'],
  ['tasks','وظایف پیگیری',scopedTasks.filter(t=>t.status!=='done').length,'مورد','وظایف مشترک با وضعیت انجام‌نشده','/tasks','task-lifecycle@1'],
 ];
 const metrics=definitions.map(([key,title,value,unit,description,target,version]):DashboardMetric=>({key,title,value,unit,description,target,version,quality:key==='occupancy'?!occupancy?'unavailable':occupancy.staffed===0?'not_computable':'stale':'fresh',asOf:key==='occupancy'?sourceTime:now.toISOString(),evidence:key==='occupancy'?evidence:[],...(key==='occupancy'&&occupancy?{formula:'تخت اشغال‌شده واجدشرایط ÷ تخت فعال دارای نیروی انسانی × ۱۰۰',numerator:occupancy.occupied,denominator:occupancy.staffed}:{})}));
 return {siteId,siteName:site?.name??'نامشخص',period,cutoff,refreshedAt:now.toISOString(),metrics,alerts:scopedAlerts.filter(activeAlert),tasks:scopedTasks.filter(t=>t.status!=='done'),issues:issues.filter(i=>activeIssue(i.state)),risks:activeRisk};
}
