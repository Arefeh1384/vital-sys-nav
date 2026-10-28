/** All data here are browser-local, self-declared demo records. Never authenticated operational configuration. */
export type LocalContract={id:string;state:string;values:Record<string,string>;reviewedBy?:string};
export type LocalConnector={id:string;key:string;contract:string;status:string;mode:string;reviewerId?:string;createdBy?:string;reviewedBy?:string;freshnessSeconds:string;kind:string;testResult?:string};
function readArray<T>(key:string):T[]{try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(parsed)?parsed:[];}catch{return [];}}
export function approvedSyntheticContracts(siteId:string):LocalContract[]{
 return readArray<LocalContract>(`him.synthetic.domain.v2:/data/contracts:${siteId}:shared-demo`).filter(x=>x.state==='review_approved_synthetic'&&x.reviewedBy&&x.values.contract_id&&x.values.schema_version);
}
export function syntheticConnectorRecords(siteId:string):LocalConnector[]{
 return readArray<LocalConnector>(`him.synthetic.connectors.v2:${siteId}:shared-demo`);
}
export function governedDemoCompatibility(connector:LocalConnector,contract:LocalContract):string[]{
 const v=contract.values,problems:string[]=[];
 if(connector.status!=='active_synthetic')problems.push('کانکتور در شبیه‌سازی فعال نیست');
 if(connector.mode!=='read_only')problems.push('حالت فقط خواندنی لازم است');
 if(connector.contract!==v.contract_id||connector.key!==v.source)problems.push('قرارداد و شناسه منبع تطابق ندارند');
 if(v.schema_version!=='1')problems.push('نسخه schema در فیکسچر قابل اجرا نیست');
 const fields=(v.required_fields||'').split(',').map(x=>x.trim());
 if(!['synthetic_id','event_time'].every(x=>fields.includes(x)))problems.push('قرارداد فاقد فیلدهای لازم برای نمونه است');
 if(!Number.isInteger(Number(connector.freshnessSeconds))||Number(connector.freshnessSeconds)<=0)problems.push('سیاست تازگی نامعتبر است');
 if(!contract.reviewedBy||contract.state!=='review_approved_synthetic')problems.push('قرارداد بازبینی مستقل نشده است');
 return problems;
}
