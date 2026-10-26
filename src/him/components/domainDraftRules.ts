/** Frontend-only validation. Valid input is not approval or authorization. */
export function validTimeWindow(start:string,end:string):boolean {
  const from=new Date(start).getTime(), to=new Date(end).getTime();
  return !!start && !!end && Number.isFinite(from) && Number.isFinite(to) && to>from;
}
export function validMaintenanceReason(reason:string):boolean {
  const n=Array.from(reason.trim()).length;
  return n>=20 && n<=2000;
}
export function normalizeWeights(weights:Record<string,string>): {total:number;normalized:Record<string,number>}|null {
  const pairs=Object.entries(weights);
  if(!pairs.length||pairs.some(([,v])=>!v.trim()||!Number.isFinite(Number(v))||Number(v)<0))return null;
  const total=pairs.reduce((sum,[,v])=>sum+Number(v),0);
  if(!Number.isFinite(total)||total<=0)return null;
  return {total,normalized:Object.fromEntries(pairs.map(([k,v])=>[k,Number(v)/total]))};
}
