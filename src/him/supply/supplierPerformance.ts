/** Synthetic line-level fixture, not a real purchase/receipt register or supplier rating. */
export type OrderLine = {
  id: string;
  supplier: string;
  ordered: number | null;
  delivered: number | null;
  agreedDate: string | null;
  receivedDate: string | null;
};
export const DEMO_PURCHASE_LINES: OrderLine[] = [
  {id:'SYN-PO-01',supplier:'risk-supplier',ordered:10,delivered:10,agreedDate:'2026-10-18',receivedDate:'2026-10-17'},
  {id:'SYN-PO-02',supplier:'risk-supplier',ordered:20,delivered:20,agreedDate:'2026-10-20',receivedDate:'2026-10-20'},
  {id:'SYN-PO-03',supplier:'risk-supplier',ordered:30,delivered:10,agreedDate:'2026-10-22',receivedDate:'2026-10-24'},
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
