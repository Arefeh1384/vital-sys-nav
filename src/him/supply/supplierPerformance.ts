/** Synthetic line-level fixture, not a real purchase/receipt register or supplier rating. */
export type OrderLine = {
  id: string;
  supplier: string;
  ordered: number | null;
  delivered: number | null;
  agreedDate: string | null;
  receivedDate: string | null;
  placedDate?:string | null; inspected?:number|null; rejected?:number|null;
};
export const DEMO_PURCHASE_LINES: OrderLine[] = [
  {id:'SYN-PO-01',supplier:'risk-supplier',ordered:10,delivered:10,agreedDate:'2026-10-18',receivedDate:'2026-10-17',placedDate:'2026-10-10',inspected:10,rejected:0},
  {id:'SYN-PO-02',supplier:'risk-supplier',ordered:20,delivered:20,agreedDate:'2026-10-20',receivedDate:'2026-10-20',placedDate:'2026-10-15',inspected:20,rejected:1},
  {id:'SYN-PO-03',supplier:'risk-supplier',ordered:30,delivered:10,agreedDate:'2026-10-22',receivedDate:'2026-10-24',placedDate:'2026-10-15',inspected:10,rejected:2},
  {id:'SYN-PO-04',supplier:'other-supplier',ordered:40,delivered:40,agreedDate:'2026-10-22',receivedDate:'2026-10-22'},
  {id:'SYN-PO-05',supplier:'other-supplier',ordered:null,delivered:null,agreedDate:null,receivedDate:null},
];
export const eligiblePurchaseLine = (line: OrderLine) => line.ordered!==null && line.ordered>0 && line.delivered!==null && line.agreedDate!==null && line.receivedDate!==null;
export function inspectSupplier(lines:OrderLine[],supplier:string,minSample=10){
  const filtered=lines.filter(x=>x.supplier===supplier);
  const eligible=filtered.filter(eligiblePurchaseLine);
  const fullOnTime=eligible.filter(x=>x.delivered! >= x.ordered! && x.receivedDate! <= x.agreedDate!);
  const orderedAll=lines.filter(eligiblePurchaseLine).reduce((a,x)=>a+x.ordered!,0);
  const orderedSupplier=eligible.reduce((a,x)=>a+x.ordered!,0);
  return {total:filtered.length,eligible:eligible.length,missing:filtered.length-eligible.length,
    onTimeInFull:fullOnTime.length,ratio:eligible.length?fullOnTime.length/eligible.length:null,
    concentration:orderedAll>0?orderedSupplier/orderedAll:null,
    insufficient:eligible.length<minSample,minSample};
}

/** Duration and quality analysis excludes missing/invalid rows instead of imputing values. */
export function inspectSupplierVariability(lines:OrderLine[],supplier:string){
 const rows=lines.filter(x=>x.supplier===supplier);
 const validLead=rows.map(x=>({id:x.id,days:x.placedDate&&x.receivedDate?(Date.parse(x.receivedDate)-Date.parse(x.placedDate))/86400000:null})).filter((x):x is {id:string;days:number}=>x.days!==null&&Number.isFinite(x.days)&&x.days>=0);
 const mean=validLead.length?validLead.reduce((a,x)=>a+x.days,0)/validLead.length:null;
 const std=mean!==null?Math.sqrt(validLead.reduce((sum,x)=>sum+(x.days-mean)**2,0)/validLead.length):null;
 const qualityRows=rows.filter(x=>x.inspected!==undefined&&x.inspected!==null&&x.inspected>0&&x.rejected!==undefined&&x.rejected!==null&&x.rejected>=0&&x.rejected<=x.inspected);
 const inspected=qualityRows.reduce((a,x)=>a+x.inspected!,0),rejected=qualityRows.reduce((a,x)=>a+x.rejected!,0);
 return {meanDays:mean,stdDays:std,leadSample:validLead.length,leadMissing:rows.length-validLead.length,inspected,rejected,qualitySample:qualityRows.length,qualityMissing:rows.length-qualityRows.length,passRate:inspected>0?(inspected-rejected)/inspected:null};
}
