import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { normalizeFaSearch } from './faSearch';
import { scopedDraftKey } from './scopedDraftKey';

type Document = {
  id: string;
  title: string;
  owner: string;
  category: string;
  version: number;
  effectiveFrom: string;
  effectiveTo: string;
  retention: string;
  fileLabel: string;
  siteId: string;
  state: 'draft' | 'review_requested' | 'publication_requested';
  createdAt: string;
  parentId?: string;
  reason?: string;
};
const field = 'block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm mt-1';
const btn = 'rounded-lg bg-teal-800 px-3 py-2 text-sm text-white disabled:opacity-40';
const info = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950';
const get = (key: string) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? (v as Document[]) : [];
  } catch {
    return [];
  }
};
export function KnowledgeWorkspace({ path, siteName }: { path: string; siteName: string }) {
  const { scope, user } = useApp();
  const key = scopedDraftKey(
    'him.knowledge.local.v1',
    'documents',
    scope.siteId || 'none',
    user?.id || 'guest',
  );
  const [items, setItems] = useState<Document[]>(() => get(key));
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState(''),
    [owner, setOwner] = useState(''),
    [category, setCategory] = useState('policy'),
    [effectiveFrom, setFrom] = useState(''),
    [effectiveTo, setTo] = useState(''),
    [retention, setRetention] = useState(''),
    [fileLabel, setFileLabel] = useState(''),
    [reason, setReason] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState(''),
    [purpose, setPurpose] = useState('review'),
    [categoryFilter, setCategoryFilter] = useState('all'),
    [asOf, setAsOf] = useState(''),
    [submitted, setSubmitted] = useState(false);
  const saveItems = (next: Document[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      return false;
    }
  };
  const selectedDoc = items.find((x) => x.id === selected);
  const save = () => {
    if (
      !title.trim() ||
      !owner.trim() ||
      !effectiveFrom ||
      !effectiveTo ||
      effectiveTo < effectiveFrom ||
      !retention.trim()
    )
      return;
    const d: Document = {
      id: `DOC-SYN-${Date.now()}`,
      title: title.trim(),
      owner: owner.trim(),
      category,
      version: 1,
      effectiveFrom,
      effectiveTo,
      retention: retention.trim(),
      fileLabel,
      siteId: scope.siteId || '',
      state: 'draft',
      createdAt: new Date().toISOString(),
    };
    if (saveItems([d, ...items])) {
      setSelected(d.id);
      setTitle('');
    }
  };
  const change = (action: 'review_requested' | 'publication_requested' | 'successor') => {
    if (!selectedDoc || reason.trim().length < 10) return;
    const d: Document =
      action === 'successor'
        ? {
            ...selectedDoc,
            id: `DOC-SYN-${Date.now()}`,
            version: selectedDoc.version + 1,
            parentId: selectedDoc.id,
            state: 'draft',
            reason: reason.trim(),
            createdAt: new Date().toISOString(),
          }
        : { ...selectedDoc, state: action, reason: reason.trim() };
    const next = action === 'successor' ? [d, ...items] : items.map((x) => (x.id === d.id ? d : x));
    if (saveItems(next)) {
      setSelected(d.id);
      setReason('');
    }
  };
  const matched = useMemo(
    () =>
      items.filter(
        (d) =>
          d.siteId === scope.siteId &&
          (categoryFilter === 'all' || d.category === categoryFilter) &&
          (!asOf || (d.effectiveFrom <= asOf && d.effectiveTo >= asOf)) &&
          normalizeFaSearch(d.title + ' ' + d.category).includes(normalizeFaSearch(q)),
      ),
    [items, q, categoryFilter, asOf, scope.siteId],
  );
  if (path === '/knowledge/search')
    return (
      <section className="space-y-4" dir="rtl" data-testid="knowledge-retrieval">
        <h1 className="text-xl font-bold">KNO-02 · جستجوی دانش و شواهد</h1>
        <p className={info}>
          فقط کاتالوگ پیش‌نویس‌های همین سایت/کاربر جست‌وجو می‌شود؛ موتور بازیابی ACL، منبع رسمی و
          نسخه منتشرشده متصل نیست. هیچ متنی را به عنوان سیاست مصوب یا پاسخ قطعی ارائه نکنید.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            پرسش/عبارت جستجو
            <input
              className={field}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSubmitted(false);
              }}
            />
          </label>
          <label className="text-sm">
            هدف استفاده
            <select className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="review">بررسی مستندات</option>
              <option value="evidence">بررسی شواهد</option>
              <option value="policy">بررسی سیاست‌ها</option>
            </select>
          </label>
          <label className="text-sm">
            رده سند
            <select
              className={field}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">همه رده‌ها</option>
              <option value="policy">سیاست</option>
              <option value="procedure">روش اجرایی</option>
              <option value="guidance">راهنما</option>
            </select>
          </label>
          <label className="text-sm">
            تاریخ مؤثر مدنظر
            <input
              type="date"
              className={field}
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </label>
        </div>
        <p className="text-xs">
          سایت محدودشده: {siteName} · هدف: {purpose} · نسخه نمایه: وجود ندارد
        </p>
        <button
          className={btn}
          disabled={!q.trim()}
          onClick={() => {
            setSubmitted(true);
            setTab(1);
          }}
        >
          اجرای جستجوی محدود نمایشی
        </button>
        <div role="tablist" className="flex gap-2 flex-wrap">
          {['جستجو', 'شواهد و نتایج', 'محدودیت‌ها'].map((v, i) => (
            <button
              role="tab"
              aria-selected={tab === i}
              key={v}
              className="rounded border p-2 text-sm"
              onClick={() => setTab(i)}
            >
              {v}
            </button>
          ))}
        </div>
        {tab === 1 && (
          <div data-testid="knowledge-results" className="rounded-lg border p-4 space-y-2">
            <h2 className="font-bold">نتیجه جستجو</h2>
            {!submitted ? (
              <p>برای مشاهده نتیجه، جستجو را ثبت کنید.</p>
            ) : (
              <>
                <p role="status" className="text-amber-900">
                  پاسخ قابل استناد موجود نیست (abstained): نمایه و ACL رسمی متصل نیستند.
                </p>
                <p className="text-xs">
                  {matched.length} پیش‌نویس محلی با عنوان منطبق یافت شد؛ این‌ها منبع منتشرشده محسوب
                  نمی‌شوند.
                </p>
                {matched.map((d) => (
                  <div key={d.id} className="border p-2 text-xs">
                    <b>{d.title}</b> · {d.id} · نسخه {d.version} · {d.state} · مالک {d.owner} · دوره{' '}
                    {d.effectiveFrom} تا {d.effectiveTo}
                    <p>استناد معتبر/بخش متن: ناموجود؛ فایل واقعی ذخیره نشده است.</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {tab === 2 && (
          <div className={info}>
            <b>عدم قطعیت و ممنوعیت استناد:</b> انتشار سند، مجوز استفاده، نسخه منبع و بازیابی متنی
            احراز نشده‌اند. در نبود شاهد معتبر، خروجی باید «شواهد کافی نیست» بماند، نه پاسخ تخمینی.
          </div>
        )}
      </section>
    );
  return (
    <section dir="rtl" className="space-y-4" data-testid="knowledge-documents">
      <h1 className="text-xl font-bold">KNO-01 · مخزن سند و چرخه نسخه</h1>
      <p className={info}>
        اسناد محلی صرفاً metadata و نام فایل‌اند؛ محتوای فایل به سرور یا مخزن رسمی ارسال نمی‌شود.
        درخواست بررسی/انتشار، تصویب یا انتشار واقعی نیست.
      </p>
      <div role="tablist" className="flex flex-wrap gap-2">
        {['فهرست اسناد', 'نسخه‌ها', 'تأیید انتشار'].map((v, i) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === i}
            key={v}
            className="border rounded p-2 text-sm"
            onClick={() => setTab(i)}
          >
            {v}
          </button>
        ))}
      </div>
      {tab === 0 && (
        <div className="bg-white rounded-lg border p-4 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            عنوان *
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-sm">
            مالک سند *
            <input className={field} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          <label className="text-sm">
            رده سند
            <select
              className={field}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="policy">سیاست</option>
              <option value="procedure">روش اجرایی</option>
              <option value="guidance">راهنما</option>
            </select>
          </label>
          <label className="text-sm">
            فایل نمونه (فقط نام/فراداده)
            <input
              type="file"
              className={field}
              onChange={(e) => setFileLabel(e.target.files?.[0]?.name || '')}
            />
          </label>
          <label className="text-sm">
            شروع اعتبار *
            <input
              type="date"
              className={field}
              value={effectiveFrom}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            پایان اعتبار *
            <input
              type="date"
              className={field}
              value={effectiveTo}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-sm">
            سیاست نگهداری *
            <input
              className={field}
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
              placeholder="پیش‌نویس؛ نه سیاست مصوب"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              className={btn}
              disabled={
                !title.trim() ||
                !owner.trim() ||
                !effectiveFrom ||
                !effectiveTo ||
                effectiveTo < effectiveFrom ||
                !retention.trim()
              }
              onClick={save}
            >
              ثبت پیش‌نویس سند
            </button>
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-white p-4 space-y-2">
        <h2 className="font-bold">اسناد همین دامنه ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm">سندی ثبت نشده است.</p>
        ) : (
          items.map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={`block w-full text-right rounded border p-2 text-sm ${d.id === selected ? 'border-teal-600' : 'border-slate-200'}`}
            >
              {d.title} · v{d.version} · {d.state} · {d.id}
            </button>
          ))
        )}
      </div>
      {selectedDoc && (
        <div
          className="rounded-lg border bg-white p-4 space-y-3"
          data-testid="knowledge-document-detail"
        >
          <h2 className="font-bold">جزئیات و تاریخچه نسخه — {selectedDoc.title}</h2>
          <p className="text-sm">
            نسخه {selectedDoc.version} · مالک {selectedDoc.owner} · اعتبار{' '}
            {selectedDoc.effectiveFrom} تا {selectedDoc.effectiveTo} · فایل:{' '}
            {selectedDoc.fileLabel || 'ثبت نشده'}
          </p>
          <p className="text-sm">
            Retention پیشنهادی: {selectedDoc.retention} · حذف واقعی/Legal hold: متصل نیست
          </p>
          <div className="text-xs">
            {items
              .filter(
                (d) =>
                  d.id === selectedDoc.id ||
                  d.parentId === selectedDoc.id ||
                  d.id === selectedDoc.parentId,
              )
              .map((d) => (
                <p key={d.id}>
                  v{d.version} · {d.id} · {d.state} · {d.createdAt}
                </p>
              ))}
          </div>
          <label className="block text-sm">
            دلیل تغییر/بازبینی (حداقل ۱۰ نویسه)
            <textarea
              className={field}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              className={btn}
              disabled={reason.trim().length < 10}
              onClick={() => change('successor')}
            >
              ساخت نسخه جانشین
            </button>
            <button
              className={btn}
              disabled={reason.trim().length < 10}
              onClick={() => change('review_requested')}
            >
              درخواست بازبینی مستقل
            </button>
            <button
              className={btn}
              disabled={reason.trim().length < 10 || selectedDoc.state !== 'review_requested'}
              onClick={() => change('publication_requested')}
            >
              درخواست انتشار
            </button>
          </div>
          <p className={info}>
            حالت «درخواست انتشار» گواه مجوز یا انتشار نیست؛ بدون بازبین مستقل و سند معتبر، جستجوی
            دانش از آن به‌عنوان منبع رسمی استفاده نمی‌کند.
          </p>
        </div>
      )}
    </section>
  );
}
