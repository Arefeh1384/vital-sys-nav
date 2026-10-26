import React from 'react';
import {DEMO_PURCHASE_LINES,inspectSupplier} from './supplierPerformance';

/** Isolated fixture drilldown for SUP-005. Never labels synthetic OTIF as live supplier performance. */
export function SupplierPerformancePanel({riskId,supplier,item,siteName,leadTime,snapshot}:{riskId:string;supplier:string;item:string;siteName:string;leadTime:number;snapshot:string}) {
  const available=riskId==='RISK-TAL-0003';
  const result=inspectSupplier(DEMO_PURCHASE_LINES,'risk-supplier');
  const rows=DEMO_PURCHASE_LINES.filter(x=>x.supplier==='risk-supplier');
  return <section className="space-y-4 rounded-xl border bg-white p-4" data-testid="supplier-performance">
    <h3 className="font-bold">تحلیل عملکرد تأمین‌کننده · SUP.4 / REQ-SUP-005</h3>
    <p className="text-sm">سایت: {siteName} · قلم: {item} · تأمین‌کننده در ریسک: {supplier} · فرض تأمین: {leadTime} روز · Snapshot ریسک: {snapshot}</p>
    {!available?<p role="note" className="rounded-lg bg-amber-50 p-3 text-sm">برای این پرونده هیچ فیکسچر خرید و رسید وجود ندارد؛ OTIF، نرخ نقص، تمرکز و رتبه قابل محاسبه نیستند.</p>:<>
      <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm">جدول زیر فقط مجموعه خطوط خرید ساختگی SYN-PO برای مرور فرمول‌هاست. ارتباط واقعی با تأمین‌کننده فوق یا منبع خرید تأیید نشده؛ رتبه‌بندی و تصمیم خرید از این داده ممنوع است.</p>
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border p-3"><b>OTIF آزمایشی</b><p>{result.onTimeInFull} / {result.eligible} = {result.ratio===null?'ناموجود':(result.ratio*100).toFixed(1)+'٪'}</p></div>
        <div className="rounded-lg border p-3"><b>نمونه واجد شرایط</b><p>{result.eligible} خط · حداقل {result.minSample} خط</p><p className="text-amber-800">{result.insufficient?'نمونه ناکافی؛ رتبه‌بندی ممنوع':'آستانه تعداد نمونه برقرار است'}</p></div>
        <div className="rounded-lg border p-3"><b>تمرکز مقداری فیکسچر</b><p>{result.concentration===null?'نامعلوم':(result.concentration*100).toFixed(1)+'٪'} از مقدار سفارش خطوط کامل فیکسچر</p></div>
      </div>
      <p className="text-xs">پوشش: {result.total} خط منتسب به تأمین‌کننده، {result.eligible} واجد شرایط، {result.missing} با ورودی ناقص. یک خط از تأمین‌کننده دیگر نیز فاقد فیلدهای الزامی است و از مخرج تحلیل کنار گذاشته شده است. بازه فیکسچر: ۱۷ تا ۲۴ اکتبر ۲۰۲۶؛ نسخه قرارداد، ارز و هزینه واقعی: نامعلوم.</p>
      <div className="overflow-x-auto"><table className="min-w-[640px] w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b">{['شناسه خط آزمایشی','سفارش','تحویل','تاریخ توافق','تاریخ رسید','در موعد و کامل؟'].map(t=><th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b"><td className="p-2" dir="ltr">{r.id}</td><td className="p-2">{r.ordered??'نامعلوم'}</td><td className="p-2">{r.delivered??'نامعلوم'}</td><td className="p-2">{r.agreedDate??'نامعلوم'}</td><td className="p-2">{r.receivedDate??'نامعلوم'}</td><td className="p-2">{r.delivered!==null&&r.ordered!==null&&r.receivedDate&&r.agreedDate?(r.delivered>=r.ordered&&r.receivedDate<=r.agreedDate?'بله':'خیر'):'غیرقابل محاسبه'}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-amber-800">برای استفاده عملیاتی باید جمعیت خرید واجد شرایط، قرارداد مؤثر، تاریخ توافق منجمد، رسیدهای نسخه‌دار، استثناها و مجوزهای دسترسی از منبع معتبر دریافت شوند.</p>
    </>}
  </section>;
}
