import {useMemo, useState} from 'react';
import {ArrowDown} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {KIND_LABEL, KIND_ORDER, nodeFreshness, occupancyLineage, withinDepth, type LineageNode} from '../data/lineageData';

const QUALITY_LABEL: Record<LineageNode['quality'], string> = {passed: 'کنترل کیفیت موفق', warning: 'هشدار کیفیت', failed: 'ناموفق', not_evaluated: 'ارزیابی نشده'};
const QUALITY_CLASS: Record<LineageNode['quality'], string> = {passed: 'border-emerald-300 bg-emerald-50', warning: 'border-amber-300 bg-amber-50', failed: 'border-rose-300 bg-rose-50', not_evaluated: 'border-slate-300 bg-slate-50'};
const MAX_DEPTH = 6;

/** UI-DAT-04: authorized lineage drill-down from a displayed metric to its sources (REQ-DAT-006). */
export function LineageWorkspace() {
  const {scope, user, openWorkView} = useApp();
  const graph = useMemo(() => occupancyLineage(scope.siteId ?? '', user?.permittedSiteIds ?? []), [scope.siteId, user?.permittedSiteIds]);
  const [depth, setDepth] = useState(MAX_DEPTH);
  const [tab, setTab] = useState<'graph' | 'nodes' | 'quality'>('graph');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!graph) return <section className="rounded-xl border bg-white p-6 text-sm" data-testid="lineage-unavailable"><h1 className="text-lg font-bold mb-2">ردیابی منشأ داده</h1><p>برای این سایت گراف منشأ مجاز یا Snapshot تأییدشده‌ای وجود ندارد.</p></section>;
  const view = withinDepth(graph, depth);
  const selected = view.nodes.find(n => n.id === (selectedId ?? graph.rootId)) ?? view.nodes[0]!;
  const limitFor = (n: LineageNode) => view.nodes.find(x => x.kind === 'contract' && x.contractVersion === n.contractVersion)?.freshnessLimitSec;
  const columns = KIND_ORDER.map(k => ({kind: k, nodes: view.nodes.filter(n => n.kind === k)})).filter(c => c.nodes.length);
  const upstream = view.edges.filter(e => e.to === selected.id);
  const downstream = view.edges.filter(e => e.from === selected.id);
  const label = (id: string) => view.nodes.find(n => n.id === id)?.label ?? id;

  return <section className="space-y-4" data-testid="lineage-workspace">
    <header className="bg-white rounded-xl border p-5 space-y-1">
      <h1 className="text-xl font-bold">ردیابی منشأ داده · UI-DAT-04</h1>
      <p className="text-sm text-slate-600">از نتیجه اشغال تخت {scope.siteName} تا Snapshotهای کانونی، نسخه تبدیل، نگاشت شناسه، کارهای دریافت و منابع. داده ساختگی است و جایگزین کاتالوگ منشأ عملیاتی نیست.</p>
      <p className="text-xs text-slate-500">فقط گره‌هایی نمایش داده می‌شوند که در دامنه مجاز شما هستند؛ شناسه و تعداد ورودی‌های خارج از دامنه افشا نمی‌شود.</p>
    </header>
    <div className="flex flex-wrap items-end gap-3">
      <nav role="tablist" aria-label="ردیابی منشأ داده" className="flex flex-wrap gap-2">
        {([['graph', 'گراف منشأ'], ['nodes', 'منابع و شواهد'], ['quality', 'کیفیت و تازگی']] as const).map(([k, l]) =>
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg border px-3 py-2 text-sm ${tab === k ? 'bg-teal-800 text-white' : 'bg-white'}`}>{l}</button>)}
      </nav>
      <label className="text-sm">عمق ردیابی<select className="ms-2 rounded-md border bg-white p-2" value={depth} onChange={e => setDepth(Number(e.target.value))}>
        {Array.from({length: MAX_DEPTH}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d.toLocaleString('fa-IR')}</option>)}</select></label>
    </div>

    {tab === 'graph' && <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="rounded-xl border bg-white p-4">
        <ol className="space-y-1" aria-label="لایه‌های منشأ از منبع تا مصرف‌کننده">
          {columns.map((col, ci) => <li key={col.kind}>
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-start">
              <h2 className="pt-2 text-xs font-semibold text-slate-500">{KIND_LABEL[col.kind]}</h2>
              <div className="flex flex-wrap gap-2">{col.nodes.map(n => <button key={n.id} type="button" data-testid="lineage-node" aria-pressed={selected.id === n.id} onClick={() => setSelectedId(n.id)}
                className={`w-full sm:w-56 rounded-lg border p-2 text-start text-xs ${QUALITY_CLASS[n.quality]} ${selected.id === n.id ? 'ring-2 ring-teal-600' : ''} ${n.id === graph.rootId ? 'font-bold' : ''}`}>
                <span className="block">{n.label}</span><bdi dir="ltr" className="block font-mono text-[10px] text-slate-600 break-all">{n.id}</bdi></button>)}</div>
            </div>
            {ci < columns.length - 1 && <ArrowDown aria-hidden className="mx-auto my-1 size-4 text-slate-400"/>}
          </li>)}
        </ol>
      </div>
      <aside className="rounded-xl border bg-white p-4 space-y-2 text-sm" data-testid="lineage-detail" aria-live="polite">
        <h2 className="font-bold">{selected.label}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-slate-500">نوع</dt><dd>{KIND_LABEL[selected.kind]}</dd>
          <dt className="text-slate-500">شناسه</dt><dd><bdi dir="ltr" className="font-mono break-all">{selected.id}</bdi></dd>
          <dt className="text-slate-500">نسخه</dt><dd><bdi dir="ltr">{selected.version}</bdi></dd>
          <dt className="text-slate-500">دامنه</dt><dd>{selected.siteId ? (selected.siteId === scope.siteId ? scope.siteName : 'سایت مجاز دیگر') : 'چندسایتی (فقط سایت‌های مجاز)'}</dd>
          {selected.sourceRecordId && <><dt className="text-slate-500">شناسه رکورد منبع</dt><dd><bdi dir="ltr">{selected.sourceRecordId}</bdi></dd></>}
          {selected.contractVersion && <><dt className="text-slate-500">نسخه قرارداد</dt><dd><bdi dir="ltr">{selected.contractVersion}</bdi></dd></>}
          {selected.transformVersion && <><dt className="text-slate-500">نسخه تبدیل</dt><dd><bdi dir="ltr">{selected.transformVersion}</bdi></dd></>}
          {selected.ingestionJob && <><dt className="text-slate-500">کار دریافت</dt><dd><bdi dir="ltr">{selected.ingestionJob}</bdi></dd></>}
          {selected.sourceEventAt && <><dt className="text-slate-500">زمان رخداد منبع</dt><dd><bdi dir="ltr">{selected.sourceEventAt}</bdi></dd></>}
          {selected.observedAt && <><dt className="text-slate-500">زمان مشاهده در سکو</dt><dd><bdi dir="ltr">{selected.observedAt}</bdi></dd></>}
          {selected.records !== undefined && <><dt className="text-slate-500">تعداد رکورد</dt><dd>{selected.records.toLocaleString('fa-IR')}</dd></>}
          <dt className="text-slate-500">کیفیت</dt><dd>{QUALITY_LABEL[selected.quality]}</dd>
        </dl>
        {selected.note && <p className="rounded bg-slate-50 p-2 text-xs">{selected.note}</p>}
        <h3 className="pt-2 text-xs font-semibold">ورودی‌ها (بالادست)</h3>
        {upstream.length ? <ul className="text-xs space-y-1">{upstream.map(e => <li key={e.from}><button type="button" className="text-teal-800 underline text-start" onClick={() => setSelectedId(e.from)}>{label(e.from)}</button> · {e.relation}</li>)}</ul> : <p className="text-xs text-slate-500">ورودی مجاز دیگری در این عمق نیست.</p>}
        <h3 className="pt-2 text-xs font-semibold">مصرف‌کننده‌ها (پایین‌دست)</h3>
        {downstream.length ? <ul className="text-xs space-y-1">{downstream.map(e => <li key={e.to}><button type="button" className="text-teal-800 underline text-start" onClick={() => setSelectedId(e.to)}>{label(e.to)}</button> · {e.relation}</li>)}</ul> : <p className="text-xs text-slate-500">مصرف‌کننده مجازی در این عمق نیست.</p>}
        {selected.id.startsWith('UI-EXE-01') && <button type="button" className="text-xs text-teal-800 underline" onClick={() => openWorkView(null)}>بازگشت به داشبورد</button>}
      </aside>
    </div>}

    {tab === 'nodes' && <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[900px] text-xs text-start" data-testid="lineage-table">
        <caption className="p-3 text-start text-sm font-semibold">جدول گره‌ها و یال‌های منشأ (معادل متنی گراف)</caption>
        <thead className="bg-slate-50 text-slate-500"><tr>{['نوع', 'گره', 'شناسه', 'نسخه', 'قرارداد', 'تبدیل', 'کار دریافت', 'رخداد منبع', 'مشاهده', 'رکورد'].map(h => <th key={h} className="p-2 text-start">{h}</th>)}</tr></thead>
        <tbody>{view.nodes.map(n => <tr key={n.id} className="border-t"><td className="p-2">{KIND_LABEL[n.kind]}</td><td className="p-2">{n.label}</td><td className="p-2 font-mono" dir="ltr">{n.id}</td><td className="p-2" dir="ltr">{n.version}</td><td className="p-2" dir="ltr">{n.contractVersion ?? '—'}</td><td className="p-2" dir="ltr">{n.transformVersion ?? '—'}</td><td className="p-2" dir="ltr">{n.ingestionJob ?? '—'}</td><td className="p-2" dir="ltr">{n.sourceEventAt ?? '—'}</td><td className="p-2" dir="ltr">{n.observedAt ?? '—'}</td><td className="p-2">{n.records?.toLocaleString('fa-IR') ?? '—'}</td></tr>)}</tbody>
      </table>
      <table className="w-full text-xs text-start border-t">
        <caption className="p-3 text-start text-sm font-semibold">یال‌ها</caption>
        <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 text-start">از</th><th className="p-2 text-start">رابطه</th><th className="p-2 text-start">به</th></tr></thead>
        <tbody>{view.edges.map(e => <tr key={e.from + e.to} className="border-t"><td className="p-2">{label(e.from)}</td><td className="p-2">{e.relation}</td><td className="p-2">{label(e.to)}</td></tr>)}</tbody>
      </table>
    </div>}

    {tab === 'quality' && <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[700px] text-xs text-start" data-testid="lineage-quality">
        <thead className="bg-slate-50 text-slate-500"><tr>{['گره', 'کیفیت', 'تازگی نسبت به قرارداد', 'حد تازگی', 'توضیح'].map(h => <th key={h} className="p-2 text-start">{h}</th>)}</tr></thead>
        <tbody>{view.nodes.filter(n => n.kind !== 'consumer').map(n => {
          const limit = n.freshnessLimitSec ?? limitFor(n);
          const f = nodeFreshness(n, limit);
          return <tr key={n.id} className="border-t"><td className="p-2">{n.label}</td><td className="p-2">{QUALITY_LABEL[n.quality]}</td>
            <td className="p-2">{f === 'fresh' ? 'تازه' : f === 'stale' ? 'کهنه (بیش از حد قرارداد)' : 'نامشخص'}</td><td className="p-2">{limit ? `${(limit / 3600).toLocaleString('fa-IR')} ساعت` : '—'}</td><td className="p-2">{n.note ?? '—'}</td></tr>;
        })}</tbody>
      </table>
      <p className="p-3 text-xs text-slate-500">تازگی و کیفیت مستقل از اطمینان مدل محاسبه می‌شوند (REQ-DAT-009). Snapshot نمونه ثابت است و نسبت به امروز کهنه نمایش داده می‌شود.</p>
    </div>}
  </section>;
}
