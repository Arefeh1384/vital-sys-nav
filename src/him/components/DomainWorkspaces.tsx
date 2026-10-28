import React, {useEffect, useMemo, useState} from 'react';
import {useApp} from '../context/AppContext';
import {SyntheticDataFlow} from './SyntheticDataFlow';
import {SyntheticRetentionPlan} from './SyntheticRetentionPlan';
import {compareOccupancyFixtures} from '../executive/dashboardStore';

/** Domain-specific, site-scoped synthetic workflow. No upstream writes or clinical decisions. */
type Kind='text'|'date'|'datetime-local'|'number'|'textarea'|'select';
type Field={key:string;label:string;kind?:Kind;required?:boolean;options?:string[];placeholder?:string};
type RecordItem={id:string;tab:number;values:Record<string,string>;at:string;state:string;note:string;originId?:string;createdBy?:string;reviewedBy?:string;reviewedAt?:string;publishedAt?:string};
type Definition={title:string;tabs:Array<{name:string;fields:Field[];help:string}>;warning:string};
const f=(key:string,label:string,kind:Kind='text',required=true,options?:string[]):Field=>({key,label,kind,required,options});
const definitions:Record<string,Definition>={
 '/settings/governance':{title:'حاکمیت، گیت‌ها و تصمیم‌های سکو · PLT-05',warning:'سوابق صرفاً پیشنهادهای ساختگی در مرورگر هستند؛ سیاست واقعی، دوره نگهداری یا گیت انتشار تأیید یا اعمال نمی‌شود.',tabs:[
  {name:'ثبت تصمیم',help:'DEC و مبنای انتخاب پیشنهادی برای بازبینی مالک؛ تصویب تنها پس از امضای صاحب اختیار واقعی.',fields:[f('decision_id','شناسه تصمیم'),f('topic','موضوع'),f('owner','مالک تصمیم'),f('state','وضعیت','select',true,['discovery_required','provisional_default','environment_gate','intended_use_gate','deferred_activation']),f('rationale','منطق و گزینه‌ها','textarea'),f('evidence','مرجع شواهد','textarea'),f('gate','گیت مربوط'),f('due','موعد','date')]},
  {name:'گیت‌های انتشار',help:'مرور وابستگی و نتیجه کنترل‌ها؛ هیچ گیتی بدون شاهد معتبر Passed نمی‌شود.',fields:[f('gate_id','شناسه گیت'),f('module','ماژول'),f('version','نسخه'),f('check','کنترل/قرارداد'),f('evidence','شواهد','textarea'),f('reviewer','بازبین مستقل'),f('status','وضعیت','select',true,['unverified','blocked','awaiting_review'])]},
  {name:'نگهداری و حذف',help:'پیشنهاد سیاست retention و legal hold؛ هیچ حذف یا نگهداری واقعی اجرا نمی‌شود.',fields:[f('record_type','نوع رکورد'),f('owner','مالک'),f('retention','مدت/سیاست نگهداری'),f('legal_hold','وضعیت منع حذف','select',true,['unknown','proposed','requires_approval']),f('evidence','مبنای تصمیم','textarea'),f('reviewer','بازبین')]},
  {name:'بازبینی و ارتقا',help:'فقط ثبت درخواست بازبینی مستقل، بدون فعال‌سازی سیاست.',fields:[f('version_ref','مرجع نسخه'),f('change','خلاصه تغییر','textarea'),f('risk','ریسک/بازگشت','textarea'),f('reviewer','شناسه بازبین')]}]},
 '/executive/briefs':{title:'Brief Builder · گزارش مدیریتی نسخه‌دار · EXE-03',warning:'زمان‌بندی و ارسال واقعی غیرفعال است؛ منابع سنجه/شواهد زنده و اجازه گیرندگان موجود نیست.',tabs:[
  {name:'قالب و دامنه',help:'ثبت پیش‌نویس دوره‌ای با بازه و مبنای زمانی؛ بدون ساخت گزارش خودکار.',fields:[f('title','عنوان گزارش'),f('template','قالب','select',true,['daily','weekly','custom']),f('scope','دامنه بیمارستان'),f('cadence','تناوب','select',true,['once','daily','weekly']),f('boundary','مرز دوره','select',true,['last_complete_day','last_complete_week','custom']),f('generate_at','زمان تولید پیشنهادی','datetime-local'),f('stale_policy','سیاست منبع قدیمی','select',true,['block','warn','omit']),f('editor','ویرایشگر'),f('reviewer','بازبین مستقل'),f('recipients','گیرندگان پیشنهادی')]},
  {name:'شواهد و برش داده',help:'ثبت نسخه منبع و محدودیت، بدون تأیید آمار.',fields:[f('brief','شناسه پیش‌نویس'),f('metric','متریک و نسخه'),f('cutoff','قطع داده','datetime-local'),f('evidence','ارجاع شواهد','textarea'),f('limitations','محدودیت‌ها','textarea')]},
  {name:'بازبینی',help:'ارسال برای بررسی نمایشی؛ هر نسخه باید شواهد و گیرندگان مجاز داشته باشد.',fields:[f('brief','شناسه پیش‌نویس'),f('editor','ویراستار'),f('reviewer','بازبین'),f('comment','نتیجه یا درخواست اصلاح','textarea')]},
  {name:'انتشار',help:'ارسال و زمان‌بندی واقعی در این نمونه غیرفعال است؛ درخواست مجوز انتشار ثبت می‌شود.',fields:[f('brief','شناسه پیش‌نویس'),f('recipients','گیرندگان مجاز پیشنهادی'),f('publication_cutoff','زمان مبنا','datetime-local'),f('reviewer','بازبین تأییدکننده'),f('reason','دلیل درخواست','textarea')]}]},
 '/data/contracts':{title:'DAT-02 · ثبت و بازبینی قرارداد نسخه‌دار منبع',warning:'این فرم فقط درخواست قرارداد مصنوعی ایجاد می‌کند؛ قرارداد اجرایی، داده واقعی یا اعتماد به اتصال منبع برقرار نمی‌کند.',tabs:[
  {name:'تعریف قرارداد',help:'محدوده، طرح نسخه‌دار، مرجع داده و قواعد کیفیت پیشنهادی؛ هیچ schema از سامانه منبع واکشی نشده است.',fields:[f('contract_id','شناسه قرارداد'),f('source','شناسه سامانه و کانکتور'),f('dataset','دامنه مجموعه‌داده'),f('schema_version','نسخه Schema'),f('owner','مالک منبع'),f('grain','دانه‌بندی داده'),f('timezone','منطقه زمانی','select',true,['Asia/Tehran','UTC']),f('required_fields','فیلدهای اجباری (با ویرگول)'),f('quality_rules','قواعد قرنطینه / کیفیت','textarea'),f('freshness_seconds','سقف تازگی به ثانیه','number'),f('effective_from','شروع اعتبار','date'),f('effective_to','پایان اعتبار','date')]},
  {name:'تغییر نسخه و بررسی',help:'نسخه جانشین و بازبین مستقل؛ نسخه قبل پاک نمی‌شود و انتشار اجرایی غیرفعال است.',fields:[f('contract_id','شناسه قرارداد'),f('prior_version','نسخه مبدأ'),f('next_version','نسخه پیشنهادی'),f('change','تفاوت schema و قرارداد','textarea'),f('impact','اثر بر مصرف‌کنندگان پایین‌دست','textarea'),f('reviewer','شناسه بازبین مستقل')]},
  {name:'گیت‌ها و وضعیت',help:'قراردادهای ثبت‌شده و نتیجه بازبینی داخلی فقط محلّی‌اند. کنترل‌های منبع، سازگاری عقب‌رو و IAM نامشخص‌اند.',fields:[]}
 ]},
 '/data/datasets':{title:'مدیریت متریک و مجموعه‌داده · DAT-05',warning:'فرمول‌های ثبت‌شده اجرا یا منتشر نمی‌شوند. نسخه مصوب و مجموعه‌داده واقعی متصل نیستند.',tabs:[
 {name:'فهرست مجموعه‌داده‌ها',help:'موجودی مرجع مجموعه‌داده‌ها دریافت نشده؛ فقط درخواست بررسی داده نگهداری می‌شود.',fields:[f('dataset','شناسه مجموعه‌داده'),f('owner','مسئول داده'),f('classification','طبقه‌بندی','select',true,['synthetic','internal','restricted']),f('freshness','حد تازگی (ثانیه)','number')]},
 {name:'تعریف متریک',help:'تعریف پیش‌نویس، کنترل نحوی فرمول، نسخه‌بندی و درخواست بازبینی مستقل؛ انتشار اجرایی مسدود است.',fields:[f('metric_key','metric_key'),f('name','نام متریک'),f('owner_id','owner_id'),f('unit','واحد UCUM'),f('grain','grain'),f('numerator','فرمول صورت'),f('denominator','فرمول مخرج'),f('aggregation','aggregation','select',true,['sum','ratio','avg','count']),f('allowed_dimensions','ابعاد مجاز (با ویرگول)'),f('required_datasets','شناسه مجموعه‌داده‌های لازم'),f('exclusions','استثناها','textarea'),f('timezone_policy','سیاست منطقه زمانی','select',true,['Asia/Tehran','UTC']),f('freshness_limit_seconds','حد تازگی (ثانیه)','number'),f('quality_policy_id','شناسه سیاست کیفیت'),f('effective_from','تاریخ مؤثر','date'),f('version','نسخه')]},
 {name:'نسخه‌های مصوب',help:'نسخه اجرایی/مصوب در این محیط موجود نیست؛ تاریخچه پیش‌نویس‌ها و نتیجه بررسی نشان داده می‌شود.',fields:[]}]},
 '/data/identity':{title:'همسان‌سازی هویت و Crosswalk · DAT-02',warning:'بدون منبع هویت معتبر یا بررسی مستقل، هیچ همسان‌سازی، ادغام یا حذف منبع اجرا نمی‌شود.',tabs:[
 {name:'مبدأ و شناسه',help:'مرجع منبع و موجودیت، بدون ادعای اتصال واقعی.',fields:[f('authority','مرجع شناسه'),f('source_id','source_id'),f('entity_type','نوع موجودیت'),f('source_key','source_key')]},
 {name:'نگاشت بازه‌دار',help:'نگاشت دقیق با کنترل تداخل بازه‌های مؤثر؛ سابقه به صورت نسخه جانشین نگهداری می‌شود.',fields:[f('authority','مرجع شناسه'),f('source_id','source_id'),f('entity_type','entity_type'),f('source_key','source_key'),f('canonical_id','شناسه کانونی پیشنهادی'),f('effective_from','شروع اعتبار','date'),f('effective_to','پایان اعتبار','date'),f('evidence','مرجع شواهد','textarea'),f('reviewer','شناسه بازبین مستقل')]},
 {name:'تعارض‌ها و جداسازی',help:'درخواست جداسازی فقط نسخه جانشین و نیازمند بازبینی ایجاد می‌کند؛ حذف مخرب ممکن نیست.',fields:[f('original','شناسه نگاشت مبدأ'),f('successor','شناسه کانونی جانشین'),f('evidence','دلیل جداسازی و شاهد','textarea'),f('reviewer','شناسه بازبین')] }]},
 '/data/ingestion':{title:'پایش دریافت داده · DAT-03',warning:'Jobها و شمارنده‌ها در این صفحه نمونه کنترل‌شده هستند؛ منبع واقعی و checkpoint معتبر متصل نیست.',tabs:[
 {name:'کارهای دریافت',help:'ثبت درخواست آزمایشی بدون اتصال به داده بیمارستان.',fields:[f('connector','شناسه اتصال مصنوعی'),f('dataset','مجموعه‌داده'),f('contract','نسخه قرارداد'),f('cutoff','cutoff مشاهده','datetime-local')]},
 {name:'ردیف‌های قرنطینه',help:'هیچ ردیف واقعی برای نمایش مجاز نیست؛ فقط ثبت دلیل قرنطینه نمونه.',fields:[f('job','شناسه Job'),f('code','کد خطای ایمن'),f('count','تعداد قرنطینه','number'),f('reason','دلیل','textarea')]},
 {name:'پیشرفت و چک‌پوینت',help:'درخواست شبیه‌سازی Job را ایجاد کن تا state، counts و امکان لغو/تلاش مجدد نمایشی را ببینی.',fields:[f('job','شناسه Job آزمایشی'),f('contract','نسخه قرارداد'),f('cutoff','زمان cutoff','datetime-local'),f('accepted','accepted','number'),f('duplicate','duplicate','number'),f('quarantined','quarantined','number'),f('checkpoint','پیشرفت checkpoint (۰ تا ۱۰۰)','number'),f('consistency','سازگاری','select',true,['unknown','consistent','partial'])]}]},
 '/data/calendars':{title:'تقویم‌های نسخه‌دار · DAT-05',warning:'تقویم مرجع سازمان یا تعطیلات رسمی تأیید نشده؛ اعمال تقویم بر محاسبات واقعی مسدود است.',tabs:[
 {name:'تقویم محلی',help:'تعریف پیشنهادی روز کاری.',fields:[f('calendar','شناسه تقویم'),f('timezone','timezone','select',true,['Asia/Tehran','UTC']),f('week_start','شروع هفته','select',true,['saturday','sunday','monday'])]},
 {name:'تعاریف دوره',help:'دوره‌ها با زمان محلی و نسخه تقویم تعریف می‌شوند.',fields:[f('period','شناسه دوره'),f('calendar','شناسه تقویم'),f('start','شروع دوره','date'),f('end','پایان دوره','date')]},
 {name:'نسخه‌ها',help:'بازه، ساعات کاری، منشأ تعطیلات و درخواست تأیید نسخه؛ تداخل بازه مؤثر مسدود است.',fields:[f('calendar','شناسه تقویم'),f('version','شماره نسخه'),f('timezone','منطقه زمانی','select',true,['Asia/Tehran','UTC']),f('week_start','اولین روز هفته','select',true,['saturday','sunday','monday']),f('work_intervals','بازه‌های کاری (مثال 08:00-16:00)'),f('holiday_ref','نسخه تعطیلات/منشأ'),f('effective_from','شروع اعتبار','date'),f('effective_to','پایان اعتبار','date'),f('owner','مالک تقویم'),f('reviewer','بازبین مستقل')] }]},
 '/settings/agents':{title:'Agent Studio · ADV-04',warning:'ساخت نسخه تنها برای Sandbox است؛ اجرای کد سفارشی، ابزار شبکه/شل و ارتقای عامل غیرفعال‌اند.',tabs:[
 {name:'عامل‌ها',help:'فهرست مصنوعی نسخه‌های محلی.',fields:[f('name','نام عامل'),f('owner','مالک'),f('purpose','کاربرد مجاز','textarea')]},
 {name:'نسخه و ابزارها',help:'گراف JSON شامل nodes و edges با نوع‌های محدود؛ schema ابزار JSON؛ validator از کد اجرایی استفاده نمی‌کند.',fields:[f('name','نام نسخه'),f('nodes','گره‌های JSON (آرایه id,type)','textarea'),f('edges','یال‌های JSON (آرایه from,to)','textarea'),f('tool_schema','طرح JSON ابزار (object)','textarea'),f('max_steps','سقف گام','number'),f('max_calls','سقف فراخوانی ابزار','number'),f('max_seconds','سقف زمان (ثانیه)','number'),f('terminal','شرط پایان') ]},
 {name:'ارزیابی',help:'درخواست آزمون مصنوعی با fixture و جمع‌بندی مقایسه؛ اجرا و امتیاز معتبر هنوز موجود نیست.',fields:[f('workflow','شناسه نسخه'),f('fixture','شناسه fixture مصنوعی'),f('policy','سیاست ارزیابی'),f('baseline','خط پایه')]},
 {name:'انتشار محدود',help:'درخواست ارتقا نیازمند digest و بسته ارزیابی معتبر است؛ هیچ انتشار واقعی صورت نمی‌گیرد.',fields:[f('workflow','شناسه نسخه'),f('digest','اثر انگشت نسخه'),f('evaluation','مرجع ارزیابی'),f('reviewer','بازبین مستقل')] }]},
 '/settings/modules':{title:'پیکربندی و فعال‌سازی ماژول · PLT-03',warning:'کنترل‌ها فقط در مرورگر اجرا می‌شوند؛ فعال‌سازی واقعی job، ابزار یا اتصال سازمانی انجام نمی‌شود.',tabs:[
 {name:'ماژول‌ها',help:'وضعیت پیشنهادی ماژول بر اساس سایت و نسخه.',fields:[f('module','ماژول','select',true,['EXE','OPS','SUP','DAT','KNO','AIM','AST','FIN','WFM','QLT','MLO']),f('version','نسخه'),f('state','وضعیت','select',true,['disabled','sandbox','shadow','active','suspended','retired'])]},
 {name:'اعتبارسنجی نسخه',help:'نتیجه gateها به‌صورت اعلام‌شده ثبت می‌شود؛ تأیید واقعی قرارداد، مدل و امنیت موجود نیست.',fields:[f('module','ماژول','select',true,['OPS','SUP','AST','WFM','QLT','AIM','DAT']),f('version','نسخه'),f('dependency','نسخه وابستگی'),f('contract_gate','گیت قرارداد','select',true,['missing','pending','verified_synthetic']),f('policy_gate','گیت سیاست','select',true,['missing','pending','verified_synthetic']),f('release_gate','گیت انتشار','select',true,['missing','pending','verified_synthetic'])]},
 {name:'ارتقا و تعلیق',help:'درخواستِ وضعیت جدید ثبت می‌شود. Promote به active تا تأیید واقعی وابستگی‌ها مسدود است.',fields:[f('module','ماژول','select',true,['OPS','SUP','AST','WFM','QLT','AIM','DAT']),f('version','نسخه'),f('current','وضعیت فعلی','select',true,['disabled','sandbox','shadow','active','suspended','retired']),f('target','وضعیت پیشنهادی','select',true,['sandbox','shadow','active','suspended','retired']),f('reason','دلیل','textarea'),f('reviewer','بازبین مستقل')]},
 {name:'تاریخچه نمونه',help:'فقط رخدادهای همین سایت و مرورگر نشان داده می‌شود.',fields:[]}]},
 '/operations/forecasts':{title:'پیش‌بینی ظرفیت · OPS-02',warning:'مدل پیش‌بینی و داده‌های ورودی تأیید نشده‌اند؛ هیچ پیش‌بینی نقطه‌ای یا بازه اطمینان ساختگی تولید نمی‌شود.',tabs:[
 {name:'درخواست',help:'درخواست با سایت، بازه، متریک و افق ذخیره می‌شود؛ وضعیت «در انتظار منبع» می‌ماند.',fields:[f('metric','متریک ظرفیت','select',true,['available_staffed_beds','occupancy','ed_wait','ward_demand']),f('start','شروع بازه مبنا','datetime-local'),f('end','پایان بازه مبنا','datetime-local'),f('horizon','افق پیش‌بینی (ساعت)','number'),f('granularity','دانه‌بندی','select',true,['hour','day']),f('model','نسخه مدل پیشنهادی'),f('assumptions','فرض‌ها','textarea')]},
 {name:'نتایج و بازه‌های عدم قطعیت',help:'برای هر درخواست، point / p10 / p50 / p90 فقط پس از اتصال مدل و شواهد معتبر قابل محاسبه‌اند.',fields:[]},
 {name:'پیشینه و بازبینی',help:'تاریخچه و ارجاع درخواست بازبینی؛ هیچ پیش‌بینی معتبر یا تصمیم اجرایی وجود ندارد.',fields:[f('request','شناسه درخواست'),f('reviewer','بازبین'),f('comment','شرح بررسی','textarea')] }]},
 '/quality/workflows':{title:'کیفیت، ایمنی و اعتباربخشی · QLT-01–06',warning:'تمام داده‌ها مصنوعی و غیرقابل استفاده بالینی‌اند؛ رسیدگی، افشا و تأیید واقعی به مجوز سازمانی نیاز دارند.',tabs:[
 {name:'ثبت رخداد',help:'در وضعیت خطر فوری، گزارش‌دهنده باید فوراً از مسیر اضطراری مصوب استفاده کند؛ این فرم سامانه فوریت نیست.',fields:[f('category','دسته رخداد'),f('occurred','زمان رخداد','datetime-local'),f('location','محل'),f('mode','نوع ثبت','select',true,['identified','confidential','anonymous']),f('narrative','شرح رخداد','textarea'),f('immediate','اقدام ایمنی فوری','textarea')]},
 {name:'صف تریاژ',help:'طبقه‌بندی و ارجاع داخلی پیش‌نویس؛ رسیدگی واقعی صورت نمی‌گیرد.',fields:[f('incident','شناسه رخداد'),f('severity','شدت','select',true,['low','medium','high','critical']),f('category','رده'),f('queue','صف رسیدگی'),f('reason','توضیح طبقه‌بندی','textarea')]},
 {name:'بررسی رخداد',help:'جدول زمانی و شواهد موافق، مخالف و ناموجود بدون انتساب تقصیر.',fields:[f('incident','شناسه رخداد'),f('timeline','جدول زمانی','textarea'),f('evidence','شواهد','textarea'),f('missing','شواهد ناموجود','textarea'),f('reviewer','بازبین مستقل')]},
 {name:'CAPA',help:'معیار اثربخشی و پنجره بازبینی الزامی است؛ بستن اصلاحیه بدون بررسی اثربخشی مجاز نیست.',fields:[f('incident','شناسه رخداد'),f('action','اقدام اصلاحی/پیشگیرانه','textarea'),f('owner','مسئول'),f('due','موعد','date'),f('effectiveness','معیار اثربخشی','textarea'),f('review_start','شروع بازبینی','date'),f('review_end','پایان بازبینی','date')]},
 {name:'ماتریس اعتباربخشی',help:'ثبت معیار و شواهد ارزیابی، بدون ادعای دریافت گواهی.',fields:[f('standard','استاندارد'),f('criterion','معیار'),f('status','ارزیابی','select',true,['not_assessed','gap','partially_met','met_synthetic']),f('evidence','مرجع شاهد'),f('assessor','ارزیاب')]},
 {name:'بازخورد',help:'متن بازخورد باید از شناسه‌های شخصی پاک‌سازی شود؛ امتیاز احساسات تشخیص پزشکی نیست.',fields:[f('channel','کانال دریافت'),f('masked_text','شرح بدون اطلاعات شناسایی','textarea'),f('sentiment','برداشت نمایشی','select',true,['positive','neutral','negative','unknown']),f('handler','مسئول پیگیری'),f('disposition','وضعیت','select',true,['new','review','closed'])]}]}
};
export const domainPaths=Object.keys(definitions);
const cls='block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm mt-1';
const primary='rounded-lg bg-teal-800 px-4 py-2 text-sm text-white disabled:opacity-40';
const iso=()=>new Date().toISOString();
const text=(v:string)=>v.trim();
export function validateDomain(path:string,tab:number,v:Record<string,string>,items:RecordItem[]):string[] {
 const def=definitions[path];if(!def)return ['مسیر ناشناخته'];
 const fields=def.tabs[tab]?.fields||[];
 const errors=fields.filter(x=>x.required&&!text(v[x.key]||'')).map(x=>`${x.label} الزامی است.`);
 for(const x of fields.filter(f=>f.kind==='number'&&text(v[f.key]||''))) if(!Number.isFinite(Number(v[x.key]))||Number(v[x.key])<0)errors.push(`${x.label}: مقدار نامعتبر`);
 const from=v.effective_from||v.start||v.review_start, to=v.effective_to||v.end||v.review_end;
 if(from&&to&&new Date(to).getTime()<=new Date(from).getTime())errors.push('پایان بازه باید بعد از شروع باشد.');
 if(path==='/data/datasets'&&tab===1){if(!/^[\w.()+\-*/\s]+$/.test((v.numerator||'')+(v.denominator||'')))errors.push('فرمول شامل نویسه غیرمجاز است؛ فرمول هرگز به‌عنوان کد اجرا نمی‌شود.');if((v.numerator||'').length>300||(v.denominator||'').length>300)errors.push('فرمول بیش از حد طولانی است.');if(Number(v.freshness_limit_seconds)<=0)errors.push('حد تازگی باید مثبت باشد.');if(items.some(x=>x.tab===1&&x.values.metric_key===v.metric_key&&x.values.version===v.version))errors.push('این نسخه متریک قبلاً ثبت شده است.');}
 if(path==='/data/identity'&&tab===1&&from&&to){if(items.some(x=>x.tab===1&&['authority','source_id','entity_type','source_key'].every(k=>x.values[k]===v[k])&&new Date(x.values.effective_from).getTime()<new Date(to).getTime()&&new Date(from).getTime()<new Date(x.values.effective_to).getTime()))errors.push('بازه مؤثر برای این کلید منبع همپوشانی دارد.');}
 if(path==='/data/calendars'&&tab===2&&from&&to){if(items.some(x=>x.tab===2&&x.values.calendar===v.calendar&&new Date(x.values.effective_from).getTime()<new Date(to).getTime()&&new Date(from).getTime()<new Date(x.values.effective_to).getTime()))errors.push('نسخه‌های مؤثر تقویم همپوشانی دارند.');}
 if(path==='/executive/briefs'&&tab>0){
  const root=items.find(x=>x.tab===0&&x.id===v.brief);
  if(!root)errors.push('این مرحله باید به شناسه یک پیش‌نویس گزارش در همین دامنه متصل باشد.');
  if(tab===2&&root&&v.reviewer===root.values.editor)errors.push('بازبین نباید همان ویرایشگر گزارش باشد.');
  if(tab===3){
    if(!items.some(x=>x.tab===2&&x.values.brief===v.brief&&x.state==='review_approved_synthetic'))errors.push('درخواست انتشار پس از تأیید نمایشی بازبینی مستقل مجاز است؛ انتشار واقعی همچنان مسدود است.');
    if(root&&v.reviewer===root.values.editor)errors.push('بازبین انتشار باید از ویرایشگر مستقل باشد.');
  }
 }
 if(path==='/data/contracts'&&tab===0){
  if(!/^[a-z][a-z0-9_-]{2,70}$/i.test(v.contract_id||''))errors.push('شناسه قرارداد باید شناسه ثابت و استاندارد باشد.');
  if(Number(v.freshness_seconds)<=0||!Number.isInteger(Number(v.freshness_seconds)))errors.push('حد تازگی باید عدد صحیح مثبت باشد.');
  if(items.some(x=>x.tab===0&&x.values.contract_id===v.contract_id&&x.values.schema_version===v.schema_version))errors.push('این نسخه قرارداد قبلاً ثبت شده است.');
 }
 if(path==='/data/contracts'&&tab===1&&v.prior_version===v.next_version)errors.push('نسخه جانشین باید متفاوت از نسخه قبلی باشد.');
 if(path==='/data/ingestion'&&tab===2&&Number(v.checkpoint)>100)errors.push('پیشرفت از ۱۰۰ درصد بیشتر نیست.');
 if(path==='/operations/forecasts'&&tab===0&&Number(v.horizon)<=0)errors.push('افق باید مثبت باشد.');
 if(path==='/quality/workflows'&&tab===3&&!v.review_end)errors.push('پایان پنجره بررسی الزامی است.');
 if(path==='/settings/modules'&&tab===0&&v.state==='active')errors.push('فعال‌سازی واقعی با فرم مستقیم ممنوع است؛ ابتدا shadow، گیت و بازبینی مستقل لازم است.');
 if(path==='/settings/modules'&&tab===2&&v.target==='active'){
   const gate=items.some(x=>x.tab===1&&x.values.module===v.module&&x.values.version===v.version&&['contract_gate','policy_gate','release_gate'].every(k=>x.values[k]==='verified_synthetic')&&['validated_synthetic','awaiting_independent_review','review_approved_synthetic'].includes(x.state));
   const draft=items.some(x=>x.tab===0&&x.values.module===v.module&&x.values.version===v.version&&x.values.state==='shadow');
   if(!gate||!draft)errors.push('در فیکسچر: برای درخواست فعال‌سازی، نسخه shadow و سه گیت معتبر مصنوعی لازم است.');
 }
 if(path==='/settings/agents'&&tab===1&&v.nodes&&v.edges&&v.tool_schema){try{
 const nodes=JSON.parse(v.nodes),edges=JSON.parse(v.edges),schema=JSON.parse(v.tool_schema);
 if(!Array.isArray(nodes)||!Array.isArray(edges)||!schema||typeof schema!=='object'||Array.isArray(schema))throw Error('ساختار JSON باید آرایه گره، آرایه یال و شیء schema باشد.');
 const validTypes=['model_call','transform','tool_call','branch','bounded_iteration','join','human_review'];
 if(nodes.some((n:any)=>!n.id||!validTypes.includes(n.type)))errors.push('نوع گره یا شناسه نامعتبر است.');
 const ids=new Set(nodes.map((n:any)=>n.id));if(ids.size!==nodes.length||edges.some((e:any)=>!ids.has(e.from)||!ids.has(e.to)))errors.push('یال/شناسه تکراری یا نامعتبر است.');
 const graph=new Map<string,string[]>();for(const e of edges){graph.set(e.from,[...(graph.get(e.from)||[]),e.to]);}
 const visiting=new Set<string>(),seen=new Set<string>();let cycle=false;
 const visit=(n:string)=>{if(visiting.has(n)){cycle=true;return;}if(seen.has(n))return;visiting.add(n);for(const next of graph.get(n)||[])visit(next);visiting.delete(n);seen.add(n);};for(const n of ids)visit(String(n));if(cycle)errors.push('چرخه گراف بدون تحلیل کران مجاز نیست (UNBOUNDED_GRAPH).');
 }catch{errors.push('ساختار JSON گراف یا طرح ابزار نامعتبر است.');}
 if(Number(v.max_steps)<=0||Number(v.max_calls)<=0||Number(v.max_seconds)<=0)errors.push('بودجه گام، ابزار و زمان باید مثبت باشد.');}
 return errors;
}
function storageKey(path:string,siteId:string,userId:string){
 const reviewable=['/executive/briefs','/settings/modules','/settings/governance','/data/contracts'];
 return `him.synthetic.domain.v2:${path}:${siteId}:${reviewable.includes(path)?'shared-demo':userId}`;
}
export function DomainWorkspace({path,siteName}:{path:string;siteName:string}){
 const {scope,user}=useApp();
 return <DomainWorkspaceContent key={`${path}:${scope.siteId}:${user?.id||'demo'}`} path={path} siteId={scope.siteId||'no-site'} siteName={siteName} userId={user?.id||'demo'}/>;
}
function DomainWorkspaceContent({path,siteId,siteName,userId}:{path:string;siteId:string;siteName:string;userId:string}){
 const def=definitions[path];const [tab,setTab]=useState(0);
 const [values,setValues]=useState<Record<string,string>>({});const [q,setQ]=useState('');
 const key=storageKey(path,siteId,userId);
 const [items,setItems]=useState<RecordItem[]>(()=>{try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a:[];}catch{return [];}});
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(items));}catch{/* private-mode storage */}},[key,items]);
 const fields=def?.tabs[tab]?.fields||[];
 const errors=useMemo(()=>validateDomain(path,tab,values,items),[path,tab,values,items]);
 const update=(k:string,v:string)=>setValues(old=>({...old,[k]:v}));
 const save=()=>{if(!fields.length||errors.length)return;const record:RecordItem={id:`SYN-${Math.random().toString(36).slice(2,9)}`,tab,values:{...values},at:iso(),state:path==='/operations/forecasts'?'awaiting_source':path==='/executive/briefs'&&tab===3?'publication_request_unapproved':'draft',note:'فقط پیش‌نویس در مرورگر؛ شواهد و تأیید واقعی موجود نیست.',createdBy:userId};setItems(old=>[record,...old]);setValues({});};
 const transition=(record:RecordItem,action:'validate'|'review'|'cancel'|'retry'|'successor')=>{
  let state=record.state,note=record.note;
  if(action==='validate'){state='validated_synthetic';note='اعتبارسنجی فرم فقط با قواعد محلی؛ قرارداد و مرجع داده تأیید نشده‌اند.';}
  if(action==='review'){state='awaiting_independent_review';note='برای بازبینی مستقل ثبت شده؛ بدون امضای بازبین معتبر انتشار ممکن نیست.';}
  if(action==='cancel'){state='cancel_requested';note='لغو تعاونی نمونه؛ هیچ Job واقعی اجرا نشده است.';}
  if(action==='retry'){const clone={...record,id:`SYN-${Math.random().toString(36).slice(2,9)}`,originId:record.id,at:iso(),state:'retry_draft',note:'تلاش مجدد پیونددار نمونه بدون پردازش داده واقعی'};setItems(old=>[clone,...old]);return;}
  if(action==='successor'){const clone={...record,id:`SYN-${Math.random().toString(36).slice(2,9)}`,originId:record.id,at:iso(),state:'successor_draft',note:'نگاشت جانشین / unmerge پیشنهادی؛ نسخه قبلی حفظ شد'};setItems(old=>[clone,...old]);return;}
  setItems(old=>old.map(x=>x.id===record.id?{...x,state,note}:x));
 };
 if(!def)return null;
 const approve=(record:RecordItem)=>{
  if(record.state!=='awaiting_independent_review'||record.createdBy===userId)return;
  const linked=record.tab===2&&path==='/executive/briefs'?items.find(x=>x.id===record.values.brief&&x.tab===0):null;
  if(path==='/executive/briefs'&&(record.values.reviewer!==userId||!linked||linked.createdBy===userId||!items.some(x=>x.tab===1&&x.values.brief===record.values.brief)))return;
  if(path==='/settings/modules'&&record.tab===2&&record.values.reviewer!==userId)return;
  if(!['/executive/briefs','/settings/modules'].includes(path))return;
  setItems(old=>old.map(x=>x.id===record.id?{...x,state:'review_approved_synthetic',reviewedBy:userId,reviewedAt:iso(),note:'بازبینی مستقل در شبیه‌سازی محلی تأیید شد؛ امضای سازمانی نیست.'}:x));
 };
 const publish=(record:RecordItem)=>{
  if(record.createdBy!==userId || record.state!=='publication_request_unapproved' || path!=='/executive/briefs')return;
  const approved=items.find(x=>x.tab===2&&x.values.brief===record.values.brief&&x.state==='review_approved_synthetic');
  if(!approved || !approved.reviewedBy || approved.reviewedBy===userId)return;
  setItems(old=>old.map(x=>x.id===record.id?{...x,state:'published_synthetic',publishedAt:iso(),note:'نسخه نمایشی گزارش منتشر شد؛ هیچ گیرنده واقعی یا سرویس ارسال فراخوانی نشد.'}:x));
 };
 const promote=(record:RecordItem)=>{
  if(path!=='/settings/modules'||record.tab!==2||record.values.target!=='active'||record.state!=='review_approved_synthetic'||record.createdBy!==userId||record.reviewedBy===userId)return;
  setItems(old=>old.map(x=>x.id===record.id?{...x,state:'active_synthetic',publishedAt:iso(),note:'فعال‌سازی در مدل محلی؛ هیچ ماژول عملیاتی تغییر نکرد.'}:x));
 };
 const briefPreview=(ref:string)=>{
  const root=items.find(x=>x.tab===0&&x.id===ref),evidence=items.find(x=>x.tab===1&&x.values.brief===ref);
  if(!root||!evidence)return null;
  const fixture=compareOccupancyFixtures([siteId],'day');
  const row=fixture.rows[0];
  const compatible=root.values.boundary==='last_complete_day'&&evidence.values.metric===fixture.definition&&row?.included&&evidence.values.evidence.includes(row.snapshot||'__missing__');
  return {root,evidence,compatible:!!compatible,value:compatible?row.value:null,source:row?.snapshot||'unavailable',cutoff:fixture.cutoff};
 };
 const visible=items.filter(x=>(JSON.stringify(x.values)+' '+x.id).toLowerCase().includes(q.toLowerCase()));
 return <section dir="rtl" data-testid="domain-workspace" className="space-y-4">
  <header className="rounded-xl bg-white border p-5 space-y-1"><h1 className="font-bold text-xl">{def.title}</h1><p className="text-sm text-slate-500">سایت انتخابی: {siteName} · <bdi>{siteId}</bdi> · کاربر نمونه: <bdi>{userId}</bdi></p></header>
  <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{def.warning}</p>
  <nav role="tablist" className="flex flex-wrap gap-2" aria-label={def.title}>{def.tabs.map((x,i)=><button key={x.name} type="button" role="tab" aria-selected={tab===i} onClick={()=>{setTab(i);setValues({});}} className={`rounded-lg border px-3 py-2 text-sm ${i===tab?'bg-teal-800 text-white':'bg-white'}`}>{x.name}</button>)}</nav>
  <div role="tabpanel" className="bg-white rounded-xl border p-5 space-y-4"><h2 className="font-bold text-lg">{def.tabs[tab].name}</h2><p className="text-sm text-slate-600">{def.tabs[tab].help}</p>
  {!!fields.length&&<div className="space-y-3"><div className="grid sm:grid-cols-2 gap-3">{fields.map(field=><label key={field.key} className="block text-sm text-slate-700">{field.label}{field.required?' *':''}
   {field.kind==='textarea'?<textarea className={cls} rows={3} value={values[field.key]||''} onChange={e=>update(field.key,e.target.value)}/>:field.kind==='select'?<select className={cls} value={values[field.key]||''} onChange={e=>update(field.key,e.target.value)}><option value="">انتخاب کنید</option>{field.options?.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input className={cls} type={field.kind||'text'} value={values[field.key]||''} onChange={e=>update(field.key,e.target.value)} placeholder={field.placeholder}/>}</label>)}</div>
   {errors.length>0&&<p role="status" className="text-xs text-amber-800">{errors.slice(0,4).join(' · ')}</p>}
   <button type="button" className={primary} disabled={errors.length>0} onClick={save}>{path==='/operations/forecasts'&&tab===0?'ثبت درخواست پیش‌بینی (در انتظار منبع)':'ثبت نسخه پیش‌نویس نمونه'}</button>
  </div>}
  {path==='/operations/forecasts'&&tab===1&&<div className="rounded-lg bg-slate-50 p-3 text-sm" data-testid="forecast-results"><strong>نتیجه: unavailable</strong><p>point: ناموجود · p10: ناموجود · p50: ناموجود · p90: ناموجود</p><p>علت: مدل/نسخه و snapshot ورودی در دسترس نیست. عدد جایگزین تولید نمی‌شود.</p></div>}
  {path==='/executive/briefs'&&<section data-testid="brief-preview" className="rounded-lg border p-3 text-sm space-y-2"><h3 className="font-bold">پیش‌نمایش نسخه‌دار گزارش مدیریتی · صرفاً آزمایشی</h3>{items.filter(x=>x.tab===0).map(root=>{const preview=briefPreview(root.id);return <div key={root.id} className="rounded border p-3"><p>گزارش: {root.values.title} · {root.values.template} · شناسه {root.id}</p><p>دوره: {root.values.boundary} · دامنه: {root.values.scope} · گیرندگان پیشنهادی: {root.values.recipients}</p>{preview?.compatible?<><p className="font-semibold">اشغال تخت مصنوعی: {preview.value}%</p><p>ارجاع: {preview.source} · نسخه: available_staffed_bed_occupancy@1 · cutoff: {preview.cutoff}</p><p>محدودیت: فیکسچر کهنه/محلی؛ گزارش بیرونی معتبر نیست.</p></>:<p role="alert">داده هم‌دوره و شواهد هماهنگ وجود ندارند؛ تولید شاخص عددی ممنوع است. برای پیش‌نمایش عددی باید متریک available_staffed_bed_occupancy@1 و مرجع snapshot همین سایت ثبت شود.</p>}</div>})}</section>}
  {path==='/settings/governance'&&tab===2&&<SyntheticRetentionPlan/>}
  {path==='/data/ingestion'&&<SyntheticDataFlow/>}
  {path==='/data/ingestion'&&tab===2&&<p className="text-xs text-slate-600">نمایش Job شامل وضعیت اجرا، accepted/duplicate/quarantined، cutoff، consistency و checkpoint از داده واردشده مصنوعی است. هیچ پردازشی آغاز نمی‌شود.</p>}
  {path==='/settings/modules'&&<div data-testid="module-activation-gates" className="border rounded-lg p-3 space-y-2 text-sm"><h3 className="font-semibold">نتیجه گیت‌های لازم برای فعال‌سازی سایت / نسخه</h3><div className="grid sm:grid-cols-3 gap-2">{['وابستگی‌ها و نسخه قرارداد','سیاست و دسترسی سازمانی','ارزیابی، بازگشت و تأیید مستقل'].map(x=><div className="rounded border p-2" key={x}><b>{x}</b><p className="text-amber-800">تأیید نشده — BLOCKED</p></div>)}</div><p className="text-xs">این جدول نشان‌دهنده عبور واقعی از گیت نیست؛ Promote و فعال‌سازی بدون اثبات کنترل‌ها مجاز نیست.</p></div>}
  {path==='/settings/modules'&&tab===2&&<p className="text-xs text-rose-800">Promote فقط به حالت active_synthetic محلی، پس از گیت‌های synthetic و بازبینی کاربر مستقل انجام می‌شود؛ درخواست Suspend اجرای جاری را متوقف نمی‌کند.</p>}
  <div className="space-y-2"><h3 className="font-semibold">سوابق محلی همین سایت و کاربر</h3><input aria-label="جستجوی سوابق" className={cls} value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو بر اساس شناسه یا اطلاعات"/>
   {!visible.length?<p className="p-3 text-sm bg-slate-50">رکوردی برای این سایت ذخیره نشده است.</p>:visible.map(item=><details key={item.id} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer"><bdi dir="ltr">{item.id}</bdi> · {def.tabs[item.tab]?.name} · <bdi>{item.state}</bdi></summary><div className="mt-2 space-y-2"><p className="text-xs">{item.at} · {item.note}</p>{item.originId&&<p className="text-xs">مرجع نسخه پیشین: {item.originId}</p>}<dl className="grid sm:grid-cols-2 gap-1 text-xs">{Object.entries(item.values).map(([k,v])=><div key={k} className="break-words"><dt className="font-bold inline">{k}: </dt><dd className="inline">{v}</dd></div>)}</dl><div className="flex flex-wrap gap-2">
    {item.state==='draft'&&<button className="border rounded p-2" onClick={()=>transition(item,'validate')}>اعتبارسنجی فرم</button>}
    {(item.state==='draft'||item.state==='validated_synthetic')&&<button className="border rounded p-2" onClick={()=>transition(item,'review')}>درخواست بازبینی مستقل</button>}
    {path==='/data/ingestion'&&!item.state.includes('cancel')&&<button className="border rounded p-2" onClick={()=>transition(item,'cancel')}>درخواست لغو (نمایشی)</button>}
    {path==='/data/ingestion'&&<button className="border rounded p-2" onClick={()=>transition(item,'retry')}>تلاش مجدد پیونددار (نمایشی)</button>}
    {item.state==='awaiting_independent_review'&&((path==='/executive/briefs'&&item.tab===2)||(path==='/settings/modules'&&item.tab===2))&&<button className="border rounded p-2" disabled={item.createdBy===userId||item.values.reviewer!==userId} onClick={()=>approve(item)}>تأیید مستقل در محیط نمایشی</button>}
    {path==='/executive/briefs'&&item.tab===3&&<button className="border rounded p-2" disabled={item.state!=='publication_request_unapproved'||item.createdBy!==userId} onClick={()=>publish(item)}>تولید نسخه منتشرشده نمایشی</button>}
    {path==='/settings/modules'&&item.tab===2&&item.values.target==='active'&&<button className="border rounded p-2" disabled={item.state!=='review_approved_synthetic'||item.createdBy!==userId} onClick={()=>promote(item)}>فعال‌سازی محلی (فیکسچر)</button>}
    {path==='/data/identity'&&<button className="border rounded p-2" onClick={()=>transition(item,'successor')}>درخواست جانشین / Unmerge</button>}
   {item.state==='published_synthetic'&&path==='/executive/briefs'&&<p>خروجی تأییدشده فقط برای این مرورگر: {item.id} · {item.publishedAt} · ارسال واقعی انجام نشد.</p>}
   </div></div></details>)}</div>
  </div>
 </section>;
}
