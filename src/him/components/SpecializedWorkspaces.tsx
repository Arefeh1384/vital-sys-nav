import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { validTimeWindow, validMaintenanceReason, normalizeWeights } from './domainDraftRules';
import {DEMO_AST_EVENTS,DEMO_AST_READINGS,inDateRange} from './assetSourceFixtures';
import {SITES_DATA} from '../data/mockData';

/** Synthetic-only planning and request drafts: never grants permissions or dispatches source actions. */
type Draft = { id: string; category: string; title: string; createdAt: string; values: Record<string,string>; assessment: string };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm bg-white';
const btnClass = 'rounded-lg bg-teal-800 px-4 py-2 text-sm text-white disabled:opacity-40';
const tabClass = (selected:boolean) => `rounded-lg border px-3 py-2 text-sm ${selected?'bg-teal-800 text-white':'bg-white text-slate-800'}`;
const today = () => new Date().toISOString().slice(0,10);

const field = (title:string, control:React.ReactNode) => <label className="block text-sm font-medium text-slate-700">{title}{control}</label>;
const str = (value:string) => value.trim();
const inOrder=(start:string,end:string)=>Boolean(start&&end&&Number.isFinite(Date.parse(start))&&Number.isFinite(Date.parse(end))&&Date.parse(end)>Date.parse(start));
function useLocalDrafts(path:string,siteId:string,userId:string) {
 const key = `him.synthetic.specialized.v1:${path}:${siteId}:${userId}`;
 const [entries,setEntries] = useState<Draft[]>(()=>{try {const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[];}catch{return [];}});
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(entries));}catch{/* Local-only drafts are best effort. */}},[key,entries]);
 const save=(category:string,title:string,values:Record<string,string>,assessment:string)=>{
  const next={id:`demo-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,category,title,createdAt:new Date().toISOString(),values,assessment};
  setEntries(prev=>[next,...prev]);
 };
 return {entries,save};
}
function DraftHistory({entries,category}:{entries:Draft[];category:string}){
 const visible=entries.filter(e=>e.category===category);
 return <section className="space-y-2" aria-label="پیش‌نویس‌های ذخیره‌شده"><h3 className="font-semibold">پیش‌نویس‌های ذخیره‌شده در مرورگر</h3>{visible.length?visible.map(e=><details key={e.id} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-semibold">{e.title} · {new Date(e.createdAt).toLocaleString('fa-IR')}</summary><p className="mt-2 text-amber-800">{e.assessment}</p><dl className="mt-2 grid gap-1 text-xs text-slate-600">{Object.entries(e.values).map(([k,v])=><div key={k}><dt className="inline font-medium">{k}: </dt><dd className="inline whitespace-pre-wrap break-words">{v}</dd></div>)}</dl></details>):<p className="text-sm text-slate-500">هنوز پیش‌نویسی در این بخش ذخیره نشده است.</p>}</section>;
}
const Panel=({children}:{children:React.ReactNode})=><div className="rounded-xl border bg-white p-5 space-y-4">{children}</div>;
const Blocked=({children}:{children:React.ReactNode})=><p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{children}</p>;

type SyntheticAsset={id:string;name:string;unit:string;klass:string;criticality:string;status:string;location:string;freshness:string;downtime:string;utilization:string;risk:string};
const samplePortfolio:SyntheticAsset[]=[
 {id:'SYN-AST-TAL-001',name:'مانیتور علائم حیاتی (fixture)',unit:'ICU',klass:'monitor',criticality:'high',status:'in_service',location:'بخش ICU',freshness:'unknown',downtime:'unknown',utilization:'unknown',risk:'not_evaluated'},
 {id:'SYN-AST-TAL-002',name:'پمپ انفوزیون (fixture)',unit:'Emergency',klass:'pump',criticality:'high',status:'maintenance_pending',location:'اورژانس',freshness:'unknown',downtime:'unknown',utilization:'unknown',risk:'not_evaluated'},
 {id:'SYN-AST-TAL-003',name:'UPS تأسیسات (fixture)',unit:'Facilities',klass:'power',criticality:'critical',status:'in_service',location:'تأسیسات',freshness:'unknown',downtime:'unknown',utilization:'unknown',risk:'not_evaluated'},
];
function AssetPortfolio({select}:{select:(id:string)=>void}){
 const {scope}=useApp();const [unit,setUnit]=useState('all'),[klass,setKlass]=useState('all'),[criticality,setCriticality]=useState('all'),[status,setStatus]=useState('all'),[freshness,setFreshness]=useState('all'),[risk,setRisk]=useState('all'),[query,setQuery]=useState(''),[selected,setSelected]=useState('');
 const canonicalSite=SITES_DATA.find(s=>s.id===scope.siteId||s.code===scope.siteId)?.code;
 const rows=samplePortfolio.map((asset,i)=>({...asset,id:`SYN-AST-${canonicalSite||scope.siteId}-${String(i+1).padStart(3,'0')}`})).filter(a=>(unit==='all'||a.unit===unit)&&(klass==='all'||a.klass===klass)&&(criticality==='all'||a.criticality===criticality)&&(status==='all'||a.status===status)&&(freshness==='all'||a.freshness===freshness)&&(risk==='all'||a.risk===risk)&&(`${a.id} ${a.name} ${a.location}`.toLowerCase().includes(query.toLowerCase())));
 const filter=(label:string,val:string,set:(v:string)=>void,options:string[])=>field(label,<select className={inputClass} value={val} onChange={e=>set(e.target.value)}><option value="all">همه</option>{options.map(x=><option key={x}>{x}</option>)}</select>);
 return <div className="space-y-4" data-testid="asset-portfolio"><h2 className="font-bold">AST-01 · پرتفوی دارایی‌های نمونه</h2><Blocked>این سه دارایی داده ثابت ساختگی مخصوص آزمون فرانت‌اند هستند؛ تعلق سازمانی، تازگی، خرابی، استفاده و امتیاز ریسک واقعی تأیید نشده است. همه ردیف‌ها فقط در سایت انتخابی به صورت نمونه قابل مرورند.</Blocked><p className="text-sm">سایت: {scope.siteName} · دوره پیش‌فرض: ۳۰ روز محلی کامل گذشته (بدون snapshot معتبر)</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{filter('واحد',unit,setUnit,['ICU','Emergency','Facilities'])}{filter('کلاس',klass,setKlass,['monitor','pump','power'])}{filter('بحرانی بودن',criticality,setCriticality,['high','critical'])}{filter('وضعیت بهره‌برداری',status,setStatus,['in_service','maintenance_pending'])}{filter('تازگی',freshness,setFreshness,['fresh','stale','unknown'])}{filter('ریسک مصوب',risk,setRisk,['low','medium','high','not_evaluated'])}{field('شناسه / نام',<input className={inputClass} value={query} onChange={e=>setQuery(e.target.value)}/>)}</div><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-right text-xs"><thead><tr className="border-b bg-slate-50">{['شناسه منبع','نام','واحد / مکان','کلاس','وضعیت','تازگی','مدت توقف','بهره‌برداری','ریسک','میزکار'].map(x=><th className="p-2" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(a=><tr key={a.id} className="border-b"><td className="p-2 font-mono" dir="ltr">{a.id}</td><td className="p-2">{a.name}</td><td className="p-2">{a.unit} / {a.location}</td><td className="p-2">{a.klass}</td><td className="p-2">{a.status}</td><td className="p-2">نامشخص</td><td className="p-2">نامشخص</td><td className="p-2">نامشخص</td><td className="p-2">ارزیابی نشده</td><td className="p-2"><button className="text-teal-800 underline" onClick={()=>{setSelected(a.id);select(a.id)}}>بازکردن دارایی</button></td></tr>)}</tbody></table></div>{!rows.length&&<p>موردی با این فیلترها یافت نشد.</p>}{selected&&<section className="border rounded-lg p-3 space-y-2" data-testid="asset-detail"><h3 className="font-bold">AST-02 · جزئیات {selected}</h3><p className="text-sm">شواهد نمونه مرتبط: {DEMO_AST_EVENTS.filter(e=>e.assetId===selected).length} رخداد و {DEMO_AST_READINGS.filter(e=>e.assetId===selected).length} خوانش · داده واقعی CMMS متصل نیست</p><button onClick={()=>select(selected)} className={btnClass}>استفاده از شناسه در بازبینی نگهداشت</button></section>}</div>;
}
function MeterAnalysis({save,entries}:{save:ReturnType<typeof useLocalDrafts>['save'];entries:Draft[]}){
 const [meter,setMeter]=useState(''),[interval,setInterval]=useState(''),[unit,setUnit]=useState('kWh'),[baseline,setBaseline]=useState(''),[peer,setPeer]=useState(''),[covariates,setCovariates]=useState(''),[exclusions,setExclusions]=useState(''),[reason,setReason]=useState(''),[reference,setReference]=useState('');
 const ready=Boolean(meter&&interval&&unit&&baseline&&peer);const fixture=meter==='SYN-METER-001';
 return <section className="space-y-4" data-testid="meter-analysis"><h2 className="font-bold">AST-04 · تحلیل ناهنجاری کنتور</h2><Blocked>قرائت‌های زیر فقط fixture هستند؛ داده واقعی کنتور، تعدیل آب‌وهوا، نسخه خط پایه و شواهد منبع متصل نیستند. هیچ فرمان کنترل/عملگر وجود ندارد.</Blocked><div className="grid sm:grid-cols-2 gap-3">
 {field('کنتور *',<select className={inputClass} value={meter} onChange={e=>setMeter(e.target.value)}><option value="">انتخاب کنتور</option><option value="SYN-METER-001">SYN-METER-001 · fixture برق</option></select>)}
 {field('بازه اندازه‌گیری *',<select className={inputClass} value={interval} onChange={e=>setInterval(e.target.value)}><option value="">انتخاب بازه</option><option value="daily">روزانه</option><option value="weekly">هفتگی</option></select>)}
 {field('واحد *',<select className={inputClass} value={unit} onChange={e=>setUnit(e.target.value)}><option value="kWh">kWh</option><option value="m3">m³</option></select>)}
 {field('نسخه خط پایه *',<input className={inputClass} value={baseline} onChange={e=>setBaseline(e.target.value)} placeholder="شناسه خط پایه تأیید نشده"/>)}
 {field('دوره همتا *',<input type="date" className={inputClass} value={peer} onChange={e=>setPeer(e.target.value)}/>)}
 {field('هم‌متغیرهای مجاز (اختیاری)',<input className={inputClass} value={covariates} onChange={e=>setCovariates(e.target.value)}/>)}
 {field('موارد حذف کیفیت',<input className={inputClass} value={exclusions} onChange={e=>setExclusions(e.target.value)}/>)}
 </div>{ready&&fixture&&<div className="border rounded-lg p-3 space-y-2 text-sm"><h3 className="font-semibold">نمونه مصنوعی خوانش و شواهد</h3><p>قرائت‌های خام fixture: ۱۲۰، ۱۳۵، ۱۷۵ {unit} · داده حذف‌شده: {exclusions||'نامشخص'}</p><p>مصرف نرمال‌شده: محاسبه‌نشده (نبود عامل نرمال‌سازی معتبر) · مبنای همتا: {peer}</p><p>ناهنجاری: <b>نیازمند بررسی</b>، نه تأییدشده؛ اختلاف با نسخه خط پایه {baseline} بدون داده معتبر قابل استنتاج نیست.</p></div>}
 {ready&&<div className="space-y-2 border rounded p-3">{field('دلیل یا توضیح (برای بررسی/توضیح الزامی)',<textarea className={inputClass} value={reason} onChange={e=>setReason(e.target.value)}/>)}{field('شناسه بررسی مرتبط (اختیاری)',<input className={inputClass} value={reference} onChange={e=>setReference(e.target.value)}/>)}<div className="flex flex-wrap gap-2">{['acknowledge','investigate','explain'].map(action=><button key={action} className={btnClass} disabled={reason.trim().length<10||(action==='investigate'&&!reference.trim())} onClick={()=>save('meter',`${meter} · ${action}`,{'کنتور':meter,'بازه':interval,'واحد':unit,'خط پایه':baseline,'دوره همتا':peer,'هم‌متغیرها':covariates,'حذف‌ها':exclusions,'دلیل':reason,'مرجع بررسی':reference||'ندارد'},'بررسی مصنوعی ثبت شده؛ هیچ رخداد واقعی تأیید یا اجرا نشده است.')}>{action==='acknowledge'?'تأیید مشاهده':action==='investigate'?'پیوند به بررسی':'ثبت توضیح مستدل'}</button>)}</div></div>}
 <DraftHistory entries={entries} category="meter"/></section>;
}

function Assets({save,entries}:{save:ReturnType<typeof useLocalDrafts>['save'];entries:Draft[]}) {
 const tabs=['فهرست دارایی','تاریخچه منبع','تله‌متری','نگهداری','قطعات یدکی','پیشنهادها','شواهد','ناهنجاری کنتور'];
 const [tab,setTab]=useState(0);
 const [asset,setAsset]=useState(''); const [recommendation,setRecommendation]=useState('');
 const [reason,setReason]=useState(''); const [start,setStart]=useState(''); const [end,setEnd]=useState('');
 const [urgency,setUrgency]=useState('normal'); const [queue,setQueue]=useState('');
 const [estimate,setEstimate]=useState(''); const [currency,setCurrency]=useState('IRR'); const [assumption,setAssumption]=useState('');
 const [prepared,setPrepared]=useState(false);
 const [selectedAsset,setSelectedAsset]=useState('');
 const [historyAsset,setHistoryAsset]=useState(''),[historyFrom,setHistoryFrom]=useState(''),[historyTo,setHistoryTo]=useState(''),[telemetryUnit,setTelemetryUnit]=useState(''),[telemetryMetric,setTelemetryMetric]=useState('');
 const errors = [!str(asset||selectedAsset)?'شناسه دارایی الزامی است.':'',!str(recommendation)?'مرجع پیشنهاد نگهداشت الزامی است.':'',!validMaintenanceReason(reason)?'شرح دلیل باید بین ۲۰ تا ۲۰۰۰ نویسه باشد.':'',!validTimeWindow(start,end)?'پایان بازه باید پس از شروع بازه باشد.':'',!queue?'صف نگهداشت الزامی است.':'',estimate!==''&&(!Number.isFinite(Number(estimate))||Number(estimate)<0)?'برآورد هزینه معتبر نیست.':'',estimate!==''&&!str(assumption)?'برای برآورد هزینه، منبع فرض الزامی است.':''].filter(Boolean);
 const values={'شناسه دارایی':asset||selectedAsset,'پیشنهاد مرجع':recommendation,'دلیل':reason,'شروع':start,'پایان':end,'فوریت':urgency,'صف':queue,'برآورد':estimate?`${estimate} ${currency}`:'ثبت نشده','مبنای برآورد':assumption};
 const prepare=(e:React.FormEvent)=>{e.preventDefault();if(errors.length)return;setPrepared(true);};
 return <><nav role="tablist" aria-label="میزکار دارایی" className="flex flex-wrap gap-2">{tabs.map((t,i)=><button type="button" role="tab" key={t} aria-selected={tab===i} className={tabClass(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</nav><Panel>{tab===0?<AssetPortfolio select={id=>setSelectedAsset(id)}/>:tab===7?<MeterAnalysis save={save} entries={entries}/>:tab===3?<>
  <h2 className="font-bold">AST-03 · بازبینی و آماده‌سازی اقدام نگهداشت</h2><Blocked>داده‌های این فرم مصنوعی است. آماده‌سازی، صرفاً یک پیش‌نویس T1 می‌سازد؛ وضعیت سفارش‌های کاری فعال CMMS قابل استعلام نیست. هیچ اقدام واقعی یا تأیید عملیاتی انجام نمی‌شود.</Blocked>
  <form onSubmit={prepare} className="grid sm:grid-cols-2 gap-3">
   {field('دارایی / شناسه منبع *',<input aria-label="شناسه دارایی" className={inputClass} value={asset||selectedAsset} onChange={e=>{setAsset(e.target.value);setSelectedAsset('');setPrepared(false)}} placeholder="شناسه دارایی نمایشی"/>)}
   {field('مرجع توصیه نگهداشت *',<input aria-label="توصیه نگهداشت" className={inputClass} value={recommendation} onChange={e=>{setRecommendation(e.target.value);setPrepared(false)}} placeholder="کد پیشنهاد"/>)}
   <div className="sm:col-span-2">{field('دلیل اقدام * (۲۰ تا ۲۰۰۰ نویسه)',<textarea aria-label="دلیل نگهداشت" className={inputClass} rows={3} maxLength={2000} value={reason} onChange={e=>{setReason(e.target.value);setPrepared(false)}}/>)}</div>
   {field('شروع پنجره درخواستی *',<input aria-label="شروع نگهداشت" type="datetime-local" className={inputClass} value={start} onChange={e=>{setStart(e.target.value);setPrepared(false)}}/>)}
   {field('پایان پنجره درخواستی *',<input aria-label="پایان نگهداشت" type="datetime-local" className={inputClass} value={end} onChange={e=>{setEnd(e.target.value);setPrepared(false)}}/>)}
   {field('فوریت *',<select className={inputClass} value={urgency} onChange={e=>{setUrgency(e.target.value);setPrepared(false)}}><option value="normal">عادی</option><option value="urgent">فوری</option><option value="critical">بحرانی</option></select>)}
   {field('صف مسئول نگهداشت *',<select aria-label="صف نگهداشت" className={inputClass} value={queue} onChange={e=>{setQueue(e.target.value);setPrepared(false)}}><option value="">انتخاب صف</option><option value="biomedical">تجهیزات پزشکی</option><option value="facilities">تأسیسات</option><option value="engineering">مهندسی نگهداشت</option></select>)}
   {field('برآورد هزینه اختیاری',<input aria-label="برآورد هزینه" type="number" min="0" step="any" className={inputClass} value={estimate} onChange={e=>{setEstimate(e.target.value);setPrepared(false)}}/>)}
   {field('واحد پول برآورد',<select className={inputClass} value={currency} onChange={e=>{setCurrency(e.target.value);setPrepared(false)}}><option value="IRR">IRR</option><option value="USD">USD</option></select>)}
   <div className="sm:col-span-2">{field('منبع/فرض برآورد',<input className={inputClass} value={assumption} onChange={e=>{setAssumption(e.target.value);setPrepared(false)}} placeholder="فقط فرض نمایشی، نه قیمت معتبر"/>)}</div>
   <div className="sm:col-span-2 space-y-2">{errors.length>0&&<ul role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{errors.map(err=><li key={err}>{err}</li>)}</ul>}<button type="submit" className={btnClass} disabled={errors.length>0}>آماده‌سازی اقدام (پیش‌نویس)</button></div>
  </form>
  {prepared&&<section className="space-y-3 rounded-xl border border-teal-300 p-4" role="region" aria-label="مقایسه با سفارش‌های فعال"><h3 className="font-semibold">پیش‌نمایش و مقایسه با سفارش‌های منبع</h3><p className="text-sm">دارایی {asset||selectedAsset}، پیشنهاد {recommendation}، بازه {start} تا {end}، صف {queue}.</p><Blocked>مقایسه با سفارش‌های فعال: نامشخص — اتصال خواندنی CMMS وجود ندارد. نبود تداخل یا امکان اجرا تأیید نشده است؛ تأیید/ارسال غیرفعال است.</Blocked><button className={btnClass} type="button" onClick={()=>{save('maintenance',`نگهداشت ${asset||selectedAsset}`,values,'پیش‌نویس داخلی؛ تطبیق CMMS و بازبینی مستقل انجام نشده است.');setPrepared(false)}}>ذخیره پیش‌نویس نمایشی</button></section>}
  <DraftHistory entries={entries} category="maintenance"/>
 </>:tab===1||tab===2?<section className="space-y-3" data-testid={tab===1?'asset-source-history':'asset-telemetry'}>
  <h2 className="font-bold">{tab===1?'AST-02 · تاریخچه همگام‌سازی منبع':'AST-02 · مرور تله‌متری تجهیزات'}</h2>
  <div className="grid sm:grid-cols-2 gap-3">
   {field('شناسه دارایی / منبع',<input className={inputClass} value={historyAsset||selectedAsset} onChange={e=>{setHistoryAsset(e.target.value);setSelectedAsset('');}} placeholder="شناسه دارایی"/>)}
   {tab===2?field('اندازه‌گیری / شاخص',<select className={inputClass} value={telemetryMetric} onChange={e=>setTelemetryMetric(e.target.value)}><option value="">انتخاب شاخص</option><option value="temperature">دما</option><option value="runtime">ساعات کارکرد</option><option value="energy">مصرف انرژی</option></select>):field('مرجع تغییر / نوع رخداد',<select className={inputClass} value={telemetryUnit} onChange={e=>setTelemetryUnit(e.target.value)}><option value="">همه رخدادها</option><option value="work_order">نگهداشت</option><option value="status">وضعیت منبع</option><option value="synchronization">همگام‌سازی</option></select>)}
   {field('از تاریخ',<input type="date" className={inputClass} value={historyFrom} onChange={e=>setHistoryFrom(e.target.value)}/>)}
   {field('تا تاریخ',<input type="date" className={inputClass} value={historyTo} onChange={e=>setHistoryTo(e.target.value)}/>)}
  </div>
  {historyFrom&&historyTo&&historyTo<historyFrom&&<p role="alert" className="text-rose-700 text-xs">پایان دوره قبل از شروع آن است.</p>}
  <Blocked>{tab===1?'رخدادهای پایین فقط فیکسچر مصنوعی دارای زمان منبع و دریافت‌اند؛ وضعیت واقعی منبع تأیید نشده است.':'خوانش‌های پایین فقط فیکسچر مصنوعی با واحد UCUM و زمان‌های مجزا هستند؛ سنسور و کیفیت عملیاتی تأیید نشده است.'}</Blocked>
  {tab===1?(()=>{const matched=DEMO_AST_EVENTS.filter(e=>e.assetId===(historyAsset||selectedAsset)&&(!telemetryUnit||e.kind===telemetryUnit)&&inDateRange(e.eventAt,historyFrom,historyTo));return matched.length?<div className="space-y-2"><h3 className="font-semibold text-sm">رخدادهای کاملاً مصنوعی برای کنترل نمای UI</h3>{matched.map(e=><details key={e.eventAt+e.kind} className="rounded border p-3 text-xs"><summary>{e.kind} · {e.status} · {e.eventAt}</summary><p>منبع نمایشی: {e.source} · نسخه: {e.version}</p><p>زمان رخداد: {e.eventAt} · زمان دریافت: {e.ingestedAt}</p><p>{e.detail}</p></details>)}</div>:<p className="rounded-lg bg-slate-50 p-3 text-sm">برای شناسه و بازه انتخاب‌شده رخداد مصنوعی موجود نیست. رخداد واقعی هم متصل نشده است.</p>})():(()=>{const matched=DEMO_AST_READINGS.filter(e=>e.assetId===(historyAsset||selectedAsset)&&(!telemetryMetric||e.metric===telemetryMetric)&&inDateRange(e.sourceAt,historyFrom,historyTo));return matched.length?<div className="space-y-2"><h3 className="font-semibold text-sm">خوانش‌های صرفاً نمایشی (بدون تشخیص ناهنجاری)</h3><div className="overflow-x-auto"><table className="min-w-[570px] w-full text-xs text-right"><thead><tr className="border-b">{['سنجش','مقدار','واحد UCUM','زمان منبع','زمان دریافت','کیفیت'].map(x=><th className="p-2" key={x}>{x}</th>)}</tr></thead><tbody>{matched.map(e=><tr key={e.metric+e.sourceAt} className="border-b"><td className="p-2">{e.metric}</td><td className="p-2">{e.value}</td><td className="p-2">{e.unit}</td><td className="p-2">{e.sourceAt}</td><td className="p-2">{e.ingestedAt}</td><td className="p-2">{e.quality}</td></tr>)}</tbody></table></div></div>:<p className="rounded-lg bg-slate-50 p-3 text-sm">برای فیلتر فعلی خوانش ساختگی تعریف نشده است؛ داده معتبر واقعی هم وجود ندارد.</p>})()}

 </section>:<><h2 className="font-bold">{tabs[tab]}</h2><Blocked>این بخش به داده مرجع، مجوز و قرارداد مربوط به CMMS نیاز دارد و هنوز گردش‌کار کاملش پیاده نشده است. داده خیالی به‌عنوان تاریخچه/شاهد تجهیزات نمایش داده نمی‌شود.</Blocked></>}</Panel></>;
}

function Workforce({save,entries}:{save:ReturnType<typeof useLocalDrafts>['save'];entries:Draft[]}){
 const tabs=['پوشش نیروی انسانی','برنامه شیفت','مهارت و بارکاری','سیاست منابع انسانی'];
 const [tab,setTab]=useState(1);
 const [name,setName]=useState(''),[revision,setRevision]=useState(''),[periodStart,setPeriodStart]=useState(''),[periodEnd,setPeriodEnd]=useState(''),[constraint,setConstraint]=useState(''),[pool,setPool]=useState(''),[demand,setDemand]=useState(''),[locked,setLocked]=useState('');
 const [weights,setWeights]=useState({coverage:'1',fairness:'1',changes:'1',overtime:'1'});
 const [unit,setUnit]=useState(''),[role,setRole]=useState(''),[skill,setSkill]=useState(''),[validTo,setValidTo]=useState(''),[hours,setHours]=useState(''),[fte,setFte]=useState('');
 const [policyScope,setPolicyScope]=useState(''),[category,setCategory]=useState(''),[effective,setEffective]=useState(today()),[question,setQuestion]=useState('');
 const normalized=normalizeWeights(weights);
 const total=normalized?.total??0;
 const weightsOK=normalized!==null;
 const rosterReady=Boolean(str(name)&&str(revision)&&validTimeWindow(periodStart,periodEnd)&&str(constraint)&&str(pool)&&str(demand)&&weightsOK);
 return <><nav role="tablist" aria-label="برنامه‌ریزی نیروی انسانی" className="flex flex-wrap gap-2">{tabs.map((t,i)=><button type="button" role="tab" key={t} aria-selected={tab===i} className={tabClass(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</nav><Panel>
 {tab===0&&<><h2 className="font-bold">WFM-01 · پایش پوشش</h2><Blocked>برای محاسبه ساعات موردنیاز، نیروی واجدصلاحیت، نیروی در دسترس و کسری پوشش به Snapshot تقاضا، اعتبار مهارت و مرخصی‌های مجاز نیاز است. این داده‌ها متصل نیستند و به‌جای صفر، «ناموجود» نشان داده می‌شود.</Blocked><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{['ساعت موردنیاز','ساعت تخصیص‌یافته واجدصلاحیت','ساعت نیروی در دسترس','ساعت پوشش‌داده‌نشده'].map(x=><div key={x} className="rounded-lg border p-3 text-sm"><b>{x}</b><p>ناموجود</p></div>)}</div></>}
 {tab===1&&<><h2 className="font-bold">WFM-02 · پیش‌نویس سناریوی شیفت</h2><Blocked>نسخه برنامه، مجموعه محدودیت‌های مصوب و منبع دسترس‌پذیری باید راستی‌آزمایی شوند. این فرم فقط سناریو را ذخیره می‌کند؛ حل مسئله، تأیید برنامه و انتشار شیفت انجام نمی‌شوند.</Blocked><div className="grid sm:grid-cols-2 gap-3">
  {field('نام سناریو *',<input aria-label="نام سناریوی شیفت" className={inputClass} value={name} onChange={e=>setName(e.target.value)}/>)}
  {field('نسخه برنامه مبدأ *',<input aria-label="نسخه برنامه مبدأ" className={inputClass} value={revision} onChange={e=>setRevision(e.target.value)}/>)}
  {field('شروع دوره *',<input type="date" className={inputClass} value={periodStart} onChange={e=>setPeriodStart(e.target.value)}/>)}
  {field('پایان دوره *',<input type="date" className={inputClass} value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)}/>)}
  {field('نسخه محدودیت‌های مصوب *',<input aria-label="نسخه محدودیت‌ها" className={inputClass} value={constraint} onChange={e=>setConstraint(e.target.value)}/>)}
  {field('شناسه مجموعه کارکنان مجاز *',<input className={inputClass} value={pool} onChange={e=>setPool(e.target.value)}/>)}
  {field('مرجع Snapshot تقاضا *',<input className={inputClass} value={demand} onChange={e=>setDemand(e.target.value)}/>)}
  {field('قفل‌های شیفت (شناسه‌های مرجع، اختیاری)',<input className={inputClass} value={locked} onChange={e=>setLocked(e.target.value)}/>)}
  {Object.entries({coverage:'پوشش',fairness:'عدالت شیفت',changes:'تغییرات برنامه',overtime:'اضافه‌کاری'}).map(([key,label])=>field(`وزن ${label}`,<input key={key} aria-label={`وزن ${label}`} type="number" min="0" step="any" className={inputClass} value={weights[key as keyof typeof weights]} onChange={e=>setWeights(v=>({...v,[key]:e.target.value}))}/>))}
 </div><div className="text-xs text-slate-700">جمع وزن‌ها: {total.toLocaleString('fa-IR')} · وزن‌های نرمال‌شده: {total>0?Object.entries(weights).map(([k,v])=>`${k}: ${((Number(v)||0)/total*100).toFixed(1)}٪`).join(' · '):'نامعتبر'}</div>
 {!rosterReady&&<p role="alert" className="text-sm text-rose-700">نام، نسخه‌ها، مراجع داده، ترتیب تاریخ‌ها و حداقل یک وزن مثبت الزامی است.</p>}
 <button className={btnClass} disabled={!rosterReady} onClick={()=>save('roster',name,{'نسخه برنامه':revision,'دوره':`${periodStart} تا ${periodEnd}`,'محدودیت مصوب (ادعای کاربر)':constraint,'مجموعه کارکنان':pool,'Snapshot تقاضا':demand,'قفل‌ها':locked,'وزن‌ها':JSON.stringify(weights)},'پیش‌نویس حل‌نشده: مجوز، دسترس‌پذیری و قیود سخت قابل‌تأیید نیستند؛ قابل انتشار نیست.')}>ذخیره سناریوی نمایشی</button>
 <DraftHistory category="roster" entries={entries}/></>}
 {tab===2&&<><h2 className="font-bold">WFM-04 · شکاف مهارت و بارکاری</h2><Blocked>ورودی صرفاً تجمیعی/آزمایشی است. بدون تأیید منبع مدارک مهارت و مجوز HR، صلاحیت فرد تأیید نمی‌شود؛ داده‌های شخصی نمایش داده نمی‌شوند.</Blocked><div className="grid sm:grid-cols-2 gap-3">
 {field('واحد',<input className={inputClass} value={unit} onChange={e=>setUnit(e.target.value)}/>)}
 {field('نقش',<input className={inputClass} value={role} onChange={e=>setRole(e.target.value)}/>)}
 {field('مهارت لازم',<input className={inputClass} value={skill} onChange={e=>setSkill(e.target.value)}/>)}
 {field('انقضای اعتبار مدرک',<input type="date" className={inputClass} value={validTo} onChange={e=>setValidTo(e.target.value)}/>)}
 {field('ساعت برنامه‌ریزی‌شده',<input type="number" min="0" className={inputClass} value={hours} onChange={e=>setHours(e.target.value)}/>)}
 {field('FTE',<input type="number" min="0.01" step="0.01" className={inputClass} value={fte} onChange={e=>setFte(e.target.value)}/>)}
 </div><p className="text-sm">ساعت نرمال‌شده بر FTE: {Number(hours)>=0&&Number(fte)>0&&hours!==''?`${(Number(hours)/Number(fte)).toFixed(1)} ساعت (با فرض داده ورودی)`: 'قابل محاسبه نیست'}</p>
 <button className={btnClass} disabled={!str(unit)||!str(role)||!str(skill)||!validTo||hours===''||!Number.isFinite(Number(hours))||Number(hours)<0||!Number.isFinite(Number(fte))||Number(fte)<=0} onClick={()=>save('skills',`${unit} · ${role}`,{'مهارت':skill,'انقضا':validTo,'ساعات':hours,'FTE':fte},'تأیید مرجع مدرک و سازگاری با مجوز HR انجام نشده است.')}>ثبت تحلیل نمونه</button><DraftHistory entries={entries} category="skills"/></>}
 {tab===3&&<><h2 className="font-bold">WFM-05 · درخواست بررسی سیاست منابع انسانی</h2><Blocked>مخزن سیاست رسمی HR متصل نیست. نتیجه فردی درباره حقوق، اضافه‌کاری یا مزایا بدون وضعیت استخدام و سند مؤثر ارائه نمی‌شود. هیچ سند یا ارجاع ساختگی تولید نمی‌شود.</Blocked><div className="grid sm:grid-cols-2 gap-3">{field('دامنه سیاست *',<input className={inputClass} value={policyScope} onChange={e=>setPolicyScope(e.target.value)}/>)}{field('دسته کارکنان (اختیاری)',<input className={inputClass} value={category} onChange={e=>setCategory(e.target.value)}/>)}{field('تاریخ اعتبار سیاست *',<input type="date" className={inputClass} value={effective} onChange={e=>setEffective(e.target.value)}/>)}</div>{field('سؤال *',<textarea className={inputClass} value={question} onChange={e=>setQuestion(e.target.value)}/>)}<button className={btnClass} disabled={!str(policyScope)||!effective||!str(question)} onClick={()=>save('policy',question.slice(0,90),{'دامنه':policyScope,'دسته':category||'نامشخص','تاریخ اعتبار':effective,'سؤال':question},'نیازمند شفاف‌سازی وضعیت مستخدم و بازیابی سند سیاست مصوب در تاریخ انتخابی؛ پاسخی تأیید نشده است.')}>ذخیره درخواست بررسی</button><DraftHistory entries={entries} category="policy"/></>}
 </Panel></>;
}

function Access({save,entries}:{save:ReturnType<typeof useLocalDrafts>['save'];entries:Draft[]}) {
 const {user,permittedSites,scope}=useApp();
 const tabs=['کاربران نمونه','مجوزهای محدود به سایت','درخواست مجوز','تفویض زمان‌دار'];const [tab,setTab]=useState(2);
 const [target,setTarget]=useState(''),[role,setRole]=useState(''),[site,setSite]=useState(scope.siteId||''),[reason,setReason]=useState(''),[start,setStart]=useState(''),[expiry,setExpiry]=useState(''),[reviewer,setReviewer]=useState('');
 const [delegate,setDelegate]=useState(''),[capability,setCapability]=useState(''),[delegationReason,setDelegationReason]=useState(''),[delegationExpiry,setDelegationExpiry]=useState('');
 const validGrant=Boolean(str(target)&&role&&site&&reason.trim().length>=20&&reason.trim().length<=1000&&inOrder(start,expiry)&&str(reviewer)&&reviewer.trim()!==target.trim());
 const validDelegation=Boolean(user?.id&&str(delegate)&&delegate.trim()!==user.id&&capability&&delegationReason.trim().length>=20&&delegationExpiry&&new Date(delegationExpiry).getTime()>Date.now());
 return <><nav role="tablist" aria-label="مدیریت دسترسی" className="flex flex-wrap gap-2">{tabs.map((t,i)=><button role="tab" type="button" key={t} aria-selected={tab===i} className={tabClass(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</nav><Panel>
 <Blocked>این صفحه صرفاً درخواست/پیش‌نویس محلی ذخیره می‌کند. هیچ نقش، مجوز یا تفویض واقعی ایجاد یا فعال نمی‌شود. تأیید مستقل، احراز هویت و موتور سیاست متصل نیستند.</Blocked>
 {tab===0&&<><h2 className="font-bold">کاربر فعال نمونه</h2><p className="text-sm">{user?.name||'ورود احراز نشده'} · شناسه: {user?.id||'ندارد'}</p><p className="text-sm">این فهرست از سرویس رسمی هویت دریافت نشده و نباید مبنای صدور دسترسی باشد.</p></>}
 {tab===1&&<><h2 className="font-bold">دامنه انتخاب‌شده در نمونه</h2>{permittedSites.map(s=><p key={s.id} className="rounded border p-2 text-sm">{s.name} ({s.id})</p>)}<p className="text-sm">مجوزها باید توسط سرویس IAM با منابع، مقاصد استفاده و انقضا ارزیابی شوند؛ انتخاب سایت در فرانت‌اند به‌تنهایی مجوز نیست.</p></>}
 {tab===2&&<><h2 className="font-bold">درخواست اعطای مجوز محدود</h2><div className="grid sm:grid-cols-2 gap-3">
  {field('شناسه کاربر درخواست‌شونده *',<input aria-label="کاربر درخواست مجوز" className={inputClass} value={target} onChange={e=>setTarget(e.target.value)}/>)}
  {field('نقش درخواستی *',<select aria-label="نقش درخواستی" className={inputClass} value={role} onChange={e=>setRole(e.target.value)}><option value="">انتخاب نقش</option>{['viewer','analyst','operator','data_steward'].map(x=><option key={x} value={x}>{x}</option>)}</select>)}
  {field('دامنه سایت *',<select aria-label="دامنه مجوز" className={inputClass} value={site} onChange={e=>setSite(e.target.value)}><option value="">انتخاب سایت</option>{permittedSites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>)}
  {field('شناسه بازبین مستقل *',<input aria-label="بازبین مجوز" className={inputClass} value={reviewer} onChange={e=>setReviewer(e.target.value)}/>)}
  {field('شروع اعتبار *',<input type="datetime-local" className={inputClass} value={start} onChange={e=>setStart(e.target.value)}/>)}
  {field('پایان اعتبار *',<input type="datetime-local" className={inputClass} value={expiry} onChange={e=>setExpiry(e.target.value)}/>)}
  <div className="sm:col-span-2">{field('علت درخواست (۲۰ تا ۱۰۰۰ نویسه) *',<textarea aria-label="علت درخواست مجوز" className={inputClass} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/>)}</div>
 </div>{!validGrant&&<p className="text-xs text-rose-700">برای ثبت پیش‌نویس، کاربر، نقش، سایت، بازبین متفاوت، دلیل کافی و بازه زمانی معتبر لازم است.</p>}
 <button className={btnClass} disabled={!validGrant} onClick={()=>save('grant',`${target} · ${role}`,{'کاربر':target,'نقش':role,'سایت':site,'دلیل':reason,'شروع':start,'انقضا':expiry,'بازبین':reviewer},'درخواست ذخیره شد، ولی هیچ مجوزی صادر نشده؛ راستی‌آزمایی هویت و بازبینی مستقل لازم است.')}>ذخیره درخواست برای بررسی (نمایشی)</button><DraftHistory entries={entries} category="grant"/></>}
 {tab===3&&<><h2 className="font-bold">پیشنهاد تفویض زمان‌دار</h2><div className="grid sm:grid-cols-2 gap-3">
 {field('تفویض‌کننده (نمایشی)',<input className={inputClass} readOnly value={user?.id||'فاقد هویت'}/>)}
 {field('شناسه دریافت‌کننده تفویض *',<input aria-label="دریافت‌کننده تفویض" className={inputClass} value={delegate} onChange={e=>setDelegate(e.target.value)}/>)}
 {field('دسته اقدام مجاز درخواستی *',<select aria-label="دسته اقدام" className={inputClass} value={capability} onChange={e=>setCapability(e.target.value)}><option value="">انتخاب دسته</option><option value="view">مشاهده در دامنه مجاز</option><option value="review">بازبینی محدود</option><option value="draft">ثبت پیش‌نویس</option></select>)}
 {field('انقضای تفویض *',<input aria-label="انقضای تفویض" type="datetime-local" className={inputClass} value={delegationExpiry} onChange={e=>setDelegationExpiry(e.target.value)}/>)}
 {field('دامنه تقاضا',<input className={inputClass} readOnly value={scope.siteName}/>)}
 <div className="sm:col-span-2">{field('دلیل تفویض (حداقل ۲۰ نویسه) *',<textarea aria-label="دلیل تفویض" className={inputClass} value={delegationReason} onChange={e=>setDelegationReason(e.target.value)}/>)}</div>
 </div>{!validDelegation&&<p className="text-xs text-rose-700">دریافت‌کننده متفاوت، دسته اقدام، دلیل و تاریخ انقضای آینده ضروری است.</p>}
 <button className={btnClass} disabled={!validDelegation} onClick={()=>save('delegation',`${user?.id} → ${delegate}`,{'تفویض‌کننده':user?.id||'','دریافت‌کننده':delegate,'دسته اقدام':capability,'سایت':scope.siteId||'','دلیل':delegationReason,'انقضا':delegationExpiry},'فقط پیشنهاد تفویض؛ زنجیره‌کردن و افزایش اختیارات در فرانت‌اند فعال نیست. هیچ حق واقعی صادر نشده است.')}>ذخیره پیشنهاد تفویض (نمایشی)</button><DraftHistory entries={entries} category="delegation"/></>}
 </Panel></>;
}
export function SpecializedWorkspace({path,siteName}:{path:string;siteName:string}) {
 const {scope,user}=useApp();
 return <ScopedSpecializedWorkspace key={`${path}:${scope.siteId}:${user?.id}`} path={path} siteName={siteName}/>;
}
function ScopedSpecializedWorkspace({path,siteName}:{path:string;siteName:string}) {
 const {scope,user}=useApp();
 const [search,setSearch]=useState('');
 const {entries,save}=useLocalDrafts(path,scope.siteId||'none',user?.id||'guest');
 const title=path==='/assets/workflows'?'دارایی و نگهداشت تجهیزات (AST)':path==='/workforce'?'برنامه‌ریزی نیروی انسانی (WFM)':'درخواست و تفویض دسترسی (PLT)';
 return <section dir="rtl" data-testid="spec-workspace" className="space-y-5"><header className="bg-white border rounded-xl p-5"><h1 className="text-xl font-bold">{title}</h1><p className="text-sm text-slate-600">سایت انتخابی: {siteName} · رابط نمونه محدود به همین مرورگر</p></header>
 {path==='/assets/workflows'?<Assets save={save} entries={entries}/>:path==='/workforce'?<Workforce save={save} entries={entries}/>:<Access save={save} entries={entries}/>}
 <details className="rounded-lg border bg-white p-4"><summary className="text-sm cursor-pointer font-semibold">جست‌وجو در پیش‌نویس‌های همین کاربر و سایت</summary><input className={inputClass} aria-label="جست‌وجو در پیش‌نویس‌ها" value={search} onChange={e=>setSearch(e.target.value)}/><ul className="mt-2 space-y-1 text-sm">{entries.filter(x=>(x.title+' '+x.category).includes(search)).map(x=><li key={x.id}>{x.title} · {x.category}</li>)}</ul></details>
 </section>;
}
