import {InvestigationWorkspace} from './InvestigationWorkspace';
import { SpecializedWorkspace } from './SpecializedWorkspaces';
import {ConnectorWorkspace} from './ConnectorWorkspace';
import {AuditWorkspace, NotificationPolicyWorkspace} from './ControlWorkflows';
import { DomainWorkspace, domainPaths } from './DomainWorkspaces';
import {KnowledgeWorkspace} from './KnowledgeWorkspace';
import {scopedDraftKey} from './scopedDraftKey';
import React, { useMemo, useState } from 'react';
import {useApp} from '../context/AppContext';

/** Frontend-only specification workspaces. No authentication or source-system operation. */
const SCREENS: Record<string,{title:string;intro:string;tabs:string[];warning:string}> = {
 '/settings/alert-rules':{title:'پیکربندی قواعد هشدار',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['فهرست قواعد', 'نسخه و دامنه', 'شرط و شدت', 'شواهد و تازگی', 'سرکوب و تشدید'],warning:'قواعد معتبر یا فعال نشده‌اند؛ فرم صرفاً پیش‌نویس محلی است.'},
 '/settings/source-actions':{title:'تنظیمات اقدامات سامانه منبع',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['فهرست مانیفست\u200cها', 'شبیه\u200cساز قرارداد', 'گواهی و مجوزها'],warning:'هیچ مانیفست عملیاتی گواهی نشده و امکان اجرای اقدام منبع وجود ندارد.'},
 '/audit':{title:'ممیزی و بررسی تمامیت',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['جستجوی محدود به دامنه', 'تمامیت و منشأ', 'بازبینی و خروجی'],warning:'دفتر ممیزی قابل‌اتکا و اثبات تمامیت متصل نشده؛ خروجی رسمی مجاز نیست.'},
 '/data/contracts':{title:'قراردادهای نسخه‌دار داده',intro:'ثبت و بازبینی Schema و قواعد داده',tabs:['تعریف قرارداد','تغییر نسخه و بررسی','گیت‌ها و وضعیت'],warning:'قرارداد اجرایی متصل نشده و انتشار مسدود است.'},
 '/data/connectors':{title:'مدیریت کانکتورهای منبع',intro:'ثبت پیکربندی آزمایشی کانکتور',tabs:['کاتالوگ کانکتورها'],warning:'اتصال واقعی و گواهی قرارداد موجود نیست.'},
 '/data/datasets':{title:'کاتالوگ مجموعه‌داده‌ها',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['فهرست داده\u200cها', 'تعریف متریک', 'نسخه\u200cهای مصوب'],warning:'هیچ متریک اجرایی یا مجموعه‌داده واقعی تأیید نشده است.'},
 '/data/identity':{title:'همسان‌سازی هویت و Crosswalk',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['مبدأ و شناسه', 'نگاشت بازه\u200cدار', 'تعارض\u200cها'],warning:'نگاشت‌های هویت واقعی و بازه‌های اعتبار موجود نیستند.'},
 '/data/ingestion':{title:'پایش دریافت داده',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['کارهای دریافت', 'ردیف\u200cهای قرنطینه', 'پیشرفت و چک\u200cپوینت'],warning:'هیچ Job واقعی یا اتصال منبع داده وجود ندارد.'},
 '/data/calendars':{title:'تقویم و تعاریف بازه',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['تقویم محلی', 'تعاریف دوره', 'نسخه\u200cها'],warning:'تقویم سازمانی معتبر تأیید نشده است.'},
 '/data/lineage/demo':{title:'ردیابی منشأ داده',intro:'پیش‌نویس رابط کاربری؛ فقط داده نمایشی',tabs:['گراف منشأ', 'منابع و شواهد', 'کیفیت و تازگی'],warning:'زنجیره منبع تا گزارش واقعی ثبت نشده و اعتبارسنجی نشده است.'},

 '/executive/investigations':{title:'بررسی مدیریتی ناهنجاری‌ها',intro:'فرضیه‌ها، شواهد موافق/مخالف/ناموجود و نتیجه بررسی',tabs:['فرضیه‌ها','شواهد و خلأها','وظایف راستی‌آزمایی','جمع‌بندی بازبین'],warning:'این فضای کار نمایشی است و نتیجه بررسی واقعی تأیید نشده است.'},
 '/executive/briefs':{title:'ساخت گزارش مدیریتی',intro:'پیش‌نویس نسخه‌دار گزارش دوره‌ای',tabs:['قالب و دامنه','شواهد و برش داده','بازبینی','انتشار'],warning:'هیچ انتشار یا زمان‌بندی واقعی وجود ندارد؛ داده‌های مرجع متصل نشده‌اند.'},
 '/operations/forecasts':{title:'پیش‌بینی ظرفیت',intro:'درخواست پیش‌بینی، ورودی‌ها و وضعیت نتایج',tabs:['درخواست','نتایج و بازه‌های عدم قطعیت','پیشینه و بازبینی'],warning:'مدل پیش‌بینی متصل نیست؛ هیچ عدد پیش‌بینی معتبری تولید نشده است.'},
 '/operations/scenarios':{title:'آزمایش سناریوی ظرفیت',intro:'مقایسه فرضیه‌های ظرفیت با خط پایه',tabs:['خط پایه','تغییر پارامترها','محدودیت‌ها','خروجی سناریو'],warning:'اعتبارسنجی امکان‌پذیری انجام نشده و این بخش عملیات واقعی را تغییر نمی‌دهد.'},
 '/work-queues':{title:'صف‌های کاری',intro:'نمای نمونه صف‌های عملیاتی و دامنه‌های اختصاص',tabs:['صف‌ها','اعضا و دامنه مجاز','واگذاری'],warning:'عضویت و مجوزها تأیید نشده‌اند؛ واگذاری واقعی امکان‌پذیر نیست.'},
 '/knowledge/documents':{title:'مخزن مستندات',intro:'فهرست، نسخه و چرخه انتشار اسناد دانش',tabs:['فهرست اسناد','نسخه‌ها','تأیید انتشار'],warning:'هیچ سند واقعی بارگذاری نشده است؛ تأیید مرجع سند نیازمند داده معتبر است.'},
 '/knowledge/search':{title:'جستجوی دانش',intro:'درخواست جستجوی محدود به دسترسی و زمان',tabs:['جستجو','شواهد و نتایج','محدودیت‌ها'],warning:'موتور بازیابی یا نمایه معتبر متصل نیست؛ نتایج ساختگی تولید نمی‌شود.'},
 '/settings/access':{title:'مدیریت دسترسی و تفویض',intro:'فهرست مجوزهای نمونه، دامنه سایت و درخواست تغییر دسترسی',tabs:['کاربران نمونه','مجوزهای محدود به سایت','درخواست مجوز','تفویض زمان‌دار'],warning:'این بخش فقط نمایشی است و مجوز واقعی صادر نمی‌کند.'},
 '/settings/modules':{title:'فعال‌سازی و نسخه‌های ماژول',intro:'مدیریت وضعیت‌های چرخه عمر ماژول در محیط آزمایشی',tabs:['ماژول‌ها','اعتبارسنجی نسخه','ارتقا و تعلیق','تاریخچه نمونه'],warning:'Validate، Promote و Suspend در این نما هیچ اثر اجرایی واقعی ندارند.'},
 '/settings/agents':{title:'استودیوی عامل‌های هوشمند',intro:'تعریف و بازبینی نسخه نمایشی عامل، محدوده، ابزار و سیاست ارزیابی',tabs:['عامل‌ها','نسخه و ابزارها','ارزیابی','انتشار محدود'],warning:'هیچ عامل یا مدل واقعی اجرا یا منتشر نمی‌شود.'},
 '/clinical/capabilities':{title:'قابلیت‌های بالینی',intro:'فهرست قابلیت‌های محدودشده به شرایط تأیید و محدوده درمانی',tabs:['فهرست قابلیت‌ها','دروازه‌های ایمنی','نسخه‌های تاییدشده'],warning:'تمام قابلیت‌های بالینی غیرفعال هستند؛ هیچ اجازه درمانی یا حالت advisory صادر نشده است.'},
 '/clinical/review':{title:'بررسی بالینی',intro:'بررسی شرایط قبل از فعال‌سازی',tabs:['در انتظار بررسی','شواهد','تصمیم‌ها'],warning:'به‌علت نبود شواهد و مجوز معتبر، هیچ فعال‌سازی مجاز نیست.'},
 '/models/use-cases':{title:'مخزن موارد استفاده مدل',intro:'چرخه عمر نمونه مورد استفاده و وابستگی به داده و شواهد',tabs:['موارد استفاده','دامنه و مالک','شرایط تایید'],warning:'مدل واقعی ثبت یا فعال نمی‌شود.'},
 '/models/datasets':{title:'مجموعه‌داده‌های آموزشی',intro:'ثبت نسخه و گذار draft → validating → approved → frozen در محیط نمایشی',tabs:['نسخه‌های داده','تقسیم داده','کنترل کیفیت'],warning:'هیچ داده بیمار یا مجموعه‌داده واقعی بارگذاری نمی‌شود.'},
 '/models/evaluations':{title:'ارزیابی مدل',intro:'نمایش شاخص، جمعیت، مخرج، استثناها و مبنای مقایسه',tabs:['طرح ارزیابی','نتایج','برش‌ها و محدودیت‌ها'],warning:'نتایج واقعی ارزیابی موجود نیست؛ عبور از دروازه تأیید قابل ادعا نیست.'},
 '/models/annotations':{title:'حاشیه‌نویسی داده',intro:'روند نمونه تعریف کار و بازبینی برچسب‌گذاری',tabs:['صف کار','راهنما','کنترل بازبینی'],warning:'هیچ داده بالینی واقعی نمایش داده نمی‌شود.'},
 '/models/jobs-and-releases':{title:'کارها و انتشار نسخه مدل',intro:'تاریخچه، وضعیت نسخه و شرایط بازگشت',tabs:['کارهای آموزشی','بسته‌های انتشار','بازگشت با دلیل'],warning:'اجرا، انتشار و rollback واقعی غیرفعال است.'},
 '/workforce':{title:'مدیریت نیروی انسانی (WFM)',intro:'پوشش شیفت‌ها، مهارت‌ها و سناریوهای برنامه‌ریزی نمایشی',tabs:['پوشش نیروی انسانی','برنامه شیفت','مهارت و بارکاری','سیاست منابع انسانی'],warning:'هیچ تغییر واقعی در شیفت یا پرونده کارکنان ثبت نمی‌شود.'},
 '/quality/workflows':{title:'کیفیت و اعتباربخشی (QLT)',intro:'مسیرهای کاری مورد انتظار کیفیت و ایمنی، به‌صورت نمایشی',tabs:['ثبت رخداد','صف تریاژ','بررسی رخداد','CAPA','ماتریس اعتباربخشی','بازخورد'],warning:'این نما فقط چارچوب گردش کار است؛ تأیید CAPA و گزارش بالینی واقعی انجام نمی‌شود.'},
 '/assets/workflows':{title:'دارایی و نگهداری تجهیزات (AST)',intro:'نمای دارایی، سابقه، نگهداری، قطعات یدکی و اندازه‌گیری‌ها',tabs:['فهرست دارایی','تاریخچه منبع','تله‌متری','نگهداری','قطعات یدکی','پیشنهادها','شواهد','ناهنجاری کنتور'],warning:'هیچ فرمان نگهداری یا تغییر CMMS ثبت نمی‌شود.'},
 '/finance/workflows':{title:'مالی و درآمد (FIN)',intro:'مطالبات و کسورات، سناریوهای پیش‌بینی و قراردادها',tabs:['نمای مالی','کسورات ادعا','پیش‌بینی هزینه','بررسی محرمانه','نسخه قراردادها'],warning:'هیچ تراکنش مالی یا دسترسی به داده محرمانه واقعی وجود ندارد.'},
};
export const specPaths = Object.keys(SCREENS);
const STATE_KEY = 'him.spec-workspaces.demo.v2';
export function SpecificationWorkspace({path,siteName,initialTab}:{path:string;siteName:string;initialTab?:number}) {
 const {scope,user}=useApp();
 if(path==='/executive/investigations')return <InvestigationWorkspace/>;
 if(path==='/audit')return <AuditWorkspace/>;
 if(path==='/settings/notification-policy')return <NotificationPolicyWorkspace/>;
 if(path==='/data/connectors')return <ConnectorWorkspace/>;
 if(path==='/knowledge/documents'||path==='/knowledge/search')return <KnowledgeWorkspace key={`${path}:${scope.siteId}:${user?.id}`} path={path} siteName={siteName}/>;
 if(['/assets/workflows','/workforce','/settings/access'].includes(path))return <SpecializedWorkspace path={path} siteName={siteName}/>;
 if(domainPaths.includes(path)||path==='/settings/governance'||path==='/executive/briefs')return <DomainWorkspace path={path} siteName={siteName} initialTab={initialTab}/>;
 return <GenericSpecificationWorkspace key={`${path}:${scope.siteId}:${user?.id||'guest'}`} path={path} siteName={siteName}/>;
}
function GenericSpecificationWorkspace({path,siteName}:{path:string;siteName:string}) {
 const page = SCREENS[path];
 const {scope,user}=useApp();
 const [tab,setTab]=useState(0);
 const [query,setQuery]=useState('');
 const [entry,setEntry]=useState('');
 const [records,setRecords]=useState<Record<string,Array<{title:string;detail:string;at:string}>>>(()=>{
  try {return JSON.parse(localStorage.getItem(scopedDraftKey(STATE_KEY,path,scope.siteId||'none',user?.id||'guest'))||'{}');}catch{return {};}
 });
 const items=useMemo(()=> (records[path]||[]).filter(x=>(x.title+' '+x.detail).includes(query)),[records,path,query]);
 if(!page)return null;
 const current=page.tabs[Math.min(tab,page.tabs.length-1)];
 const isClinical=path.startsWith('/clinical/');
 const add=()=>{
  if(!entry.trim()||isClinical)return;
  const updated={...records,[path]:[...(records[path]||[]),{title:entry.trim(),detail:`${current} · ${siteName} · پیش‌نویس غیرمعتبر برای استفاده عملیاتی`,at:new Date().toISOString()}]};
  setRecords(updated);localStorage.setItem(scopedDraftKey(STATE_KEY,path,scope.siteId||'none',user?.id||'guest'),JSON.stringify(updated));setEntry('');
 };
 return <section dir="rtl" className="space-y-5" data-testid="spec-workspace">
  <header className="bg-white rounded-xl border border-slate-200 p-5 space-y-2"><h1 className="text-xl font-bold">{page.title}</h1><p className="text-sm text-slate-600">{page.intro}</p><p className="text-xs text-slate-500">سایت جاری: {siteName}</p></header>
  <div role="alert" className="border border-amber-300 bg-amber-50 text-amber-950 rounded-xl p-4 text-sm">{page.warning} داده‌ها مصنوعی‌اند و این صفحه جایگزین مجوز، بازبینی و زیرساخت عملیاتی نیست.</div>
  <nav role="tablist" aria-label={page.title} className="flex flex-wrap gap-2">{page.tabs.map((t,i)=><button key={t} role="tab" aria-selected={tab===i} onClick={()=>setTab(i)} className={`rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-teal-500 ${tab===i?'bg-teal-800 text-white':'bg-white text-slate-800'}`}>{t}</button>)}</nav>
  <div role="tabpanel" className="rounded-xl border bg-white p-5 space-y-4"><h2 className="font-semibold text-lg">{current}</h2>
   <p className="text-sm text-slate-600">{isClinical?'بدون نسخه بالینی تأییدشده و مجوز معتبر، این قابلیت غیرفعال باقی می‌ماند.':'در این نسخه امکان ثبت پیش‌نویس یادداشت آزمایشی وجود دارد؛ گردش کار تأیید و اجرای واقعی هنوز پیاده‌سازی نشده است.'}</p>
   <label className="block text-sm">جست‌وجو در موارد نمایشی<input value={query} onChange={e=>setQuery(e.target.value)} className="mt-2 block w-full rounded-lg border p-2" placeholder="عبارت مورد نظر"/></label>
   {!isClinical&&<div className="flex flex-wrap gap-2"><input className="flex-1 min-w-48 rounded-lg border p-2" value={entry} onChange={e=>setEntry(e.target.value)} aria-label="عنوان پیش‌نویس آزمایشی" placeholder="عنوان پیش‌نویس نمایشی"/><button onClick={add} disabled={!entry.trim()} className="rounded-lg bg-teal-800 px-4 py-2 text-white disabled:opacity-40">ثبت پیش‌نویس آزمایشی</button></div>}
   {items.length? <ul className="space-y-2">{items.map((x,i)=><li key={x.at+i} className="rounded-lg border p-3"><strong>{x.title}</strong><p className="text-xs text-slate-500">{x.detail}</p></li>)}</ul>:<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{isClinical?'قابلیت بالینی تأییدشده‌ای در دسترس نیست.':'موردی در این بخش ثبت نشده است.'}</p>}
  </div>
 </section>;
}
