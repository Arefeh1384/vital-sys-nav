import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {useApp} from '../context/AppContext';
import {SITES_DATA} from '../data/mockData';
import {demoStore, newTask} from '../phase6/store';
import {
  ALLOCATION_VERSIONS, BINDING_TYPES, CAN_INVESTIGATE, CONTRACT_VERSIONS, FIN_PERIODS, OBLIGATIONS, REASON_MAPPING, SERVICE_LINES,
  anomalyCases, claimsFixture, contribution, denialRates, forecast, forecastHistory, formatMoney, payloadHash, reconciliationDifference,
  sourceTotals, totalsByCurrency, type Currency, type FinPayload,
} from './financeData';

/* ---------- browser-local state, shared by all demo users of one site (so a second user can approve) ---------- */
type Snapshot = {id: string; periodId: string; at: string; reason: string; status: string; totals: {currency: Currency; source: number; imported: number; difference: number}[]};
type Appeal = {id: string; claimId: string; reason: string; evidence: string[]; by: string; at: string};
type ContribSnapshot = {id: string; allocationId: string; at: string; rows: {service: string; contribution: number | null; margin: number | null; status: string}[]};
type Scenario = {id: string; kind: 'receipts' | 'revenue'; lag: number; horizon: number; at: string; total: number | null; status: string};
type Disposition = {caseId: string; state: 'explained' | 'false_positive' | 'escalated'; reason: string; by: string; at: string};
type Reminder = {id: string; obligationId: string; due: string; by: string; at: string; state: 'scheduled' | 'invalidated' | 'sent'; note?: string};
type Draft = {id: string; payload: FinPayload; hash: string; by: string; byName: string; at: string;
  status: 'draft' | 'awaiting_approval' | 'approved' | 'analytical_reviewed' | 'dispatched_uncertain' | 'reconciled_success' | 'reconciled_failed';
  approval?: {by: string; byName: string; at: string; hash: string}; reconciliation?: {reference: string; outcome: string; at: string}; taskId?: string; history: {at: string; text: string}[]};
type FinState = {snapshots: Snapshot[]; reopened: string[]; appeals: Appeal[]; contrib: ContribSnapshot[]; scenarios: Scenario[]; dispositions: Disposition[];
  verified: {obligationId: string; by: string; at: string}[]; reminders: Reminder[]; amendmentApplied: boolean; drafts: Draft[]; extraImports: number};
const EMPTY: FinState = {snapshots: [], reopened: [], appeals: [], contrib: [], scenarios: [], dispositions: [], verified: [], reminders: [], amendmentApplied: false, drafts: [], extraImports: 0};
const keyFor = (siteId: string) => `him.finance.v1:${siteId}`;
function load(siteId: string): FinState {
  try { return {...EMPTY, ...JSON.parse(localStorage.getItem(keyFor(siteId)) || '{}')}; } catch { return EMPTY; }
}
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const pct = (v: number | null) => v === null ? 'تعریف‌نشده' : `${(v * 100).toLocaleString('fa-IR', {maximumFractionDigits: 2})}٪`;
const n = (v: number) => v.toLocaleString('fa-IR');
const card = 'rounded-xl border bg-white p-4 space-y-3';
const input = 'mt-1 block w-full rounded-md border bg-white p-2 text-sm';
const th = 'p-2 text-start font-semibold';

const TABS = ['تطبیق مالی', 'کسورات و اعتراض', 'بهای تمام‌شده و سهم', 'پیش‌بینی وصول و درآمد', 'بررسی ناهنجاری', 'قراردادها و تعهدات', 'پیش‌نویس تصمیم مالی'] as const;

/** FIN workspace (REQ-FIN-001..007): synthetic, browser-local; no ledger entry or source transaction is ever created. */
export function FinanceWorkspace() {
  const {scope, user, showNotification, openWorkView} = useApp();
  const siteId = scope.siteId ?? '';
  const siteCode = (SITES_DATA.find(s => s.id === siteId)?.code ?? 'SITE').replace('SITE-', '');
  const [tab, setTab] = useState(0);
  const [st, setSt] = useState<FinState>(() => load(siteId));
  useEffect(() => setSt(load(siteId)), [siteId]);
  const update = (fn: (s: FinState) => FinState) => setSt(prev => { const next = fn(prev); try { localStorage.setItem(keyFor(siteId), JSON.stringify(next)); } catch { /* best effort */ } return next; });
  const me = {id: user?.id ?? 'guest', name: user?.name ?? 'کاربر'};

  return <section className="space-y-4" data-testid="finance-workspace">
    <header className="rounded-xl border bg-white p-5 space-y-1">
      <h1 className="text-xl font-bold">مالی و درآمد (FIN) · {scope.siteName}</h1>
      <p className="text-sm text-slate-600">تحلیل مدیریتی با داده ساختگی. هیچ سند حسابداری، پرداخت، ارسال اعتراض یا تراکنش منبع ایجاد نمی‌شود. خروجی‌ها صورت مالی حسابرسی‌شده یا سود قانونی نیستند.</p>
    </header>
    <nav role="tablist" aria-label="گردش‌کارهای مالی" className="flex flex-wrap gap-2">
      {TABS.map((t, i) => <button key={t} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`rounded-lg border px-3 py-2 text-sm ${tab === i ? 'bg-teal-800 text-white' : 'bg-white'}`}>{t}</button>)}
    </nav>
    <div role="tabpanel" aria-label={TABS[tab]}>
      {tab === 0 && <Reconciliation st={st} update={update} notify={showNotification}/>}
      {tab === 1 && <Denials siteCode={siteCode} st={st} update={update} me={me} notify={showNotification}/>}
      {tab === 2 && <Contribution st={st} update={update} notify={showNotification}/>}
      {tab === 3 && <Forecast st={st} update={update}/>}
      {tab === 4 && <Anomalies siteCode={siteCode} st={st} update={update} me={me} role={user?.role}/>}
      {tab === 5 && <Contracts st={st} update={update} me={me} notify={showNotification}/>}
      {tab === 6 && <Drafts siteId={siteId} role={user?.role} st={st} update={update} me={me} notify={showNotification} openTask={id => openWorkView({kind: 'task', id})}/>}
    </div>
  </section>;
}
type Upd = (fn: (s: FinState) => FinState) => void;

/* ---------- FIN-001 ---------- */
function Reconciliation({st, update, notify}: {st: FinState; update: Upd; notify: (m: string) => void}) {
  const [periodId, setPeriodId] = useState('1405-07');
  const [basis, setBasis] = useState<'accrual' | 'cash'>('accrual');
  const period = FIN_PERIODS.find(p => p.id === periodId)!;
  const status = st.reopened.includes(periodId) ? 'reopened' : period.status;
  const rows = sourceTotals(periodId).filter(r => r.basis === basis);
  const totals = totalsByCurrency(rows, null);
  const snaps = st.snapshots.filter(s => s.periodId === periodId);
  const takeSnapshot = (reason: string) => update(s => ({...s, snapshots: [...s.snapshots, {id: `FSN-${periodId}-${s.snapshots.filter(x => x.periodId === periodId).length + 1}`, periodId, at: new Date().toISOString(), reason, status, totals: totals.byCurrency}]}));
  const statusLabel = {provisional: 'موقت (بسته‌نشده)', closed: 'بسته‌شده', reopened: 'بازگشایی‌شده؛ نیازمند بستن دوباره'}[status];
  return <div className="space-y-4" data-testid="fin-reconciliation">
    <div className={card}>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">دوره<select className={input} value={periodId} onChange={e => setPeriodId(e.target.value)}>{FIN_PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="text-sm">مبنای حسابداری<select className={input} value={basis} onChange={e => setBasis(e.target.value as 'accrual' | 'cash')}><option value="accrual">تعهدی</option><option value="cash">نقدی</option></select></label>
        <div className="text-sm"><span className="block">وضعیت دوره</span><span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs ${status === 'closed' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{statusLabel}</span></div>
        <div className="text-sm"><span className="block">نرخ تبدیل ارز مصوب</span><span className="mt-1 block text-xs text-slate-600">ندارد؛ جمع ریالی و دلاری جدا نمایش داده می‌شود.</span></div>
      </div>
    </div>
    {rows.length === 0 ? <p className={card}>برای مبنای نقدی در این فیکسچر داده‌ای ثبت نشده است.</p> : <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className={th}>منبع</th><th className={th}>گروه</th><th className={th}>ارز</th><th className={th}>جمع منبع</th><th className={th}>جمع واردشده</th><th className={th}>اختلاف (واردشده − منبع)</th><th className={th}>وضعیت تطبیق</th></tr></thead>
        <tbody>{rows.map(r => { const d = reconciliationDifference(r); return <tr key={r.source} className="border-t"><td className="p-2">{r.source}</td><td className="p-2">{r.group}</td><td className="p-2">{r.currency}</td><td className="p-2 tabular-nums">{formatMoney(r.sourceTotal, r.currency)}</td><td className="p-2 tabular-nums">{formatMoney(r.importedTotal, r.currency)}</td><td className={`p-2 tabular-nums ${d ? 'text-rose-700 font-bold' : ''}`} dir="ltr">{d > 0 ? '+' : ''}{d === 0 ? '0' : d.toLocaleString('en-US')} {r.currency}</td><td className="p-2">{d === 0 ? 'تطبیق‌شده' : 'تطبیق‌نشده'}</td></tr>; })}</tbody>
        <tfoot className="border-t-2 bg-slate-50">{totals.byCurrency.map(t => <tr key={t.currency}><td className="p-2 font-bold" colSpan={3}>جمع {t.currency} (بدون تبدیل)</td><td className="p-2 tabular-nums">{formatMoney(t.source, t.currency)}</td><td className="p-2 tabular-nums">{formatMoney(t.imported, t.currency)}</td><td className="p-2 tabular-nums font-bold" dir="ltr">{t.difference.toLocaleString('en-US')} {t.currency}</td><td className="p-2">{t.difference === 0 ? 'تطبیق‌شده' : 'تطبیق‌نشده'}</td></tr>)}</tfoot>
      </table></div>}
    <div className={card}>
      <h2 className="font-semibold">Snapshotهای تحلیلی دوره</h2>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { takeSnapshot('ثبت Snapshot تحلیلی'); notify('Snapshot تحلیلی ثبت شد؛ Snapshotهای قبلی تغییر نکردند.'); }}>ثبت Snapshot تحلیلی</Button>
        {status === 'closed' && <Button variant="outline" onClick={() => { update(s => ({...s, reopened: [...s.reopened, periodId]})); takeSnapshot('بازگشایی دوره در منبع'); notify('دوره بازگشایی شد و Snapshot تازه ساخته شد.'); }}>شبیه‌سازی بازگشایی دوره در منبع</Button>}
      </div>
      {snaps.length ? <ul className="space-y-1 text-xs">{snaps.map(s => <li key={s.id} className="rounded border p-2"><bdi dir="ltr" className="font-mono">{s.id}</bdi> · {new Date(s.at).toLocaleString('fa-IR')} · {s.reason} · وضعیت دوره: {({provisional: 'موقت', closed: 'بسته‌شده', reopened: 'بازگشایی‌شده'} as Record<string, string>)[s.status] ?? s.status} · {s.totals.map(t => `${t.currency}: اختلاف ${t.difference.toLocaleString('en-US')}`).join(' · ')}</li>)}</ul> : <p className="text-xs text-slate-500">هنوز Snapshotی برای این دوره ثبت نشده است.</p>}
      <p className="text-xs text-slate-500">Snapshotها تغییرناپذیرند؛ بازگشایی دوره یک Snapshot تازه می‌سازد. نسخه متریک: <bdi dir="ltr">fin-reconciled-total@1</bdi></p>
    </div>
  </div>;
}

/* ---------- FIN-002 ---------- */
const STAGE_LABEL: Record<string, string> = {submitted: 'ارسال‌شده', adjudicated: 'رسیدگی‌شده', denied: 'ردشده', partially_paid: 'پرداخت جزئی', adjusted: 'تعدیل‌شده', appealed: 'اعتراض‌شده', recovered: 'وصول‌شده'};
function Denials({siteCode, st, update, me, notify}: {siteCode: string; st: FinState; update: Upd; me: {id: string; name: string}; notify: (m: string) => void}) {
  const base = useMemo(() => claimsFixture(siteCode), [siteCode]);
  const claims = useMemo(() => [...base, ...base.filter(c => c.adjudicationEventId).slice(0, st.extraImports)], [base, st.extraImports]);
  const rates = denialRates(claims);
  const [reason, setReason] = useState('all');
  const [claimId, setClaimId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [error, setError] = useState('');
  const visible = base.filter(c => reason === 'all' || c.reasonCode === reason);
  const selected = base.find(c => c.id === claimId);
  const saveAppeal = () => {
    if (!selected) return;
    if (text.trim().length < 20 || !evidence.length) { setError('شرح اعتراض (دست‌کم ۲۰ نویسه) و دست‌کم یک شاهد الزامی است.'); return; }
    setError('');
    update(s => ({...s, appeals: [...s.appeals, {id: uid('APL'), claimId: selected.id, reason: text.trim(), evidence, by: me.name, at: new Date().toISOString()}]}));
    setText(''); setEvidence([]); notify('پیش‌نویس اعتراض ذخیره شد؛ ارسال به بیمه‌گر انجام نمی‌شود.');
  };
  return <div className="space-y-4" data-testid="fin-denials">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={card}><p className="text-xs text-slate-500">نرخ وقوع کسورات در سطح ادعا</p><p className="text-2xl font-black" data-testid="claim-incidence">{pct(rates.incidence)}</p><p className="text-xs">{n(rates.withDenial)} از {n(rates.cohort)} ادعای کاملاً رسیدگی‌شده</p></div>
      <div className={card}><p className="text-xs text-slate-500">نرخ کسورات مبلغی</p><p className="text-2xl font-black" data-testid="amount-rate">{pct(rates.amountRate)}</p><p className="text-xs">{n(rates.denied)} کسرشده از {n(rates.submitted)} مبلغ ارسالی همان cohort (هزار ریال)</p></div>
      <div className={card}><p className="text-xs text-slate-500">تعریف cohort</p><p className="text-xs">ادعاهای دارای رویداد رسیدگی یکتا؛ ادعای «ارسال‌شده» بدون رسیدگی وارد نمی‌شود. نگاشت دلایل: <bdi dir="ltr">{REASON_MAPPING.version}</bdi></p>
        <Button variant="outline" size="sm" onClick={() => update(s => ({...s, extraImports: s.extraImports + 3}))}>شبیه‌سازی ورود دوباره رویدادهای رسیدگی</Button>
        {st.extraImports > 0 && <p className="text-xs text-emerald-800">{n(st.extraImports)} رویداد تکراری وارد شد و حذف تکرار شد؛ صورت و مخرج تغییر نکرد.</p>}</div>
    </div>
    <div className={card}>
      <div className="flex flex-wrap items-end gap-2"><label className="text-sm">دلیل کسر<select className={input} value={reason} onChange={e => setReason(e.target.value)}><option value="all">همه</option>{Object.entries(REASON_MAPPING.reasons).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['ادعا', 'بیمه‌گر', 'خدمت', 'مرحله', 'ارسالی', 'تأییدشده', 'کسرشده', 'دلیل', 'شواهد', ''].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{visible.map(c => <tr key={c.id} className="border-t"><td className="p-2 font-mono text-xs" dir="ltr">{c.id}</td><td className="p-2">{c.payer}</td><td className="p-2">{c.service}</td><td className="p-2">{STAGE_LABEL[c.stage]}</td><td className="p-2 tabular-nums">{n(c.submitted)}</td><td className="p-2 tabular-nums">{c.approved === null ? 'در انتظار' : n(c.approved)}</td><td className="p-2 tabular-nums">{n(c.denied)}</td><td className="p-2">{c.reasonCode ? REASON_MAPPING.reasons[c.reasonCode] : '—'}</td><td className="p-2 text-xs">{c.evidence.join('، ')}</td>
          <td className="p-2">{c.denied > 0 && <Button size="sm" variant="outline" onClick={() => { setClaimId(c.id); setEvidence(c.evidence); }}>پیش‌نویس اعتراض</Button>}</td></tr>)}</tbody></table></div>
    </div>
    {selected && <div className={card} data-testid="appeal-draft">
      <h2 className="font-semibold">پیش‌نویس اعتراض برای <bdi dir="ltr">{selected.id}</bdi></h2>
      <p className="text-xs text-amber-800">این پیش‌نویس نظر نهایی درباره بدهی قانونی بیمه‌گر نیست و خودکار ارسال نمی‌شود؛ بازبینی انسانی لازم است.</p>
      <label className="block text-sm">شرح اعتراض<textarea className={input} value={text} onChange={e => setText(e.target.value)}/></label>
      <fieldset className="text-sm"><legend>شواهد پیوست</legend>{selected.evidence.map(ev => <label key={ev} className="me-3 inline-flex items-center gap-1"><input type="checkbox" checked={evidence.includes(ev)} onChange={e => setEvidence(x => e.target.checked ? [...x, ev] : x.filter(y => y !== ev))}/>{ev}</label>)}</fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button onClick={saveAppeal}>ذخیره پیش‌نویس اعتراض</Button>
    </div>}
    {st.appeals.length > 0 && <div className={card}><h2 className="font-semibold">پیش‌نویس‌های اعتراض</h2><ul className="text-xs space-y-1">{st.appeals.map(a => <li key={a.id} className="rounded border p-2"><bdi dir="ltr">{a.claimId}</bdi> · {a.by} · {new Date(a.at).toLocaleString('fa-IR')} · {a.reason} · شواهد: {a.evidence.join('، ')} · وضعیت: پیش‌نویس برای بازبینی</li>)}</ul></div>}
  </div>;
}

/* ---------- FIN-003 ---------- */
function Contribution({st, update, notify}: {st: FinState; update: Upd; notify: (m: string) => void}) {
  const [allocId, setAllocId] = useState(ALLOCATION_VERSIONS[0]!.id);
  const alloc = ALLOCATION_VERSIONS.find(a => a.id === allocId)!;
  const rows = SERVICE_LINES.map(s => { const allocated = alloc.share(s); return {s, allocated, r: contribution(s, allocated)}; });
  const freeze = () => { update(x => ({...x, contrib: [...x.contrib, {id: uid('CSN'), allocationId: allocId, at: new Date().toISOString(), rows: rows.map(({s, r}) => ({service: s.service, contribution: r.contribution, margin: r.margin, status: r.status}))}]})); notify('Snapshot سهم مدیریتی ثبت شد؛ نتایج قبلی حفظ شد.'); };
  return <div className="space-y-4" data-testid="fin-contribution">
    <div className={card}><label className="text-sm">نسخه تسهیم هزینه مشترک<select className={input} value={allocId} onChange={e => setAllocId(e.target.value)}>{ALLOCATION_VERSIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
      <p className="text-xs text-slate-600">فرض‌ها: درآمد شناسایی‌شده طبق تعریف <bdi dir="ltr">rev-recognized@2</bdi>؛ هزینه مستقیم از نگاشت مصوب <bdi dir="ltr">direct-cost-map@4</bdi>؛ سهم = درآمد − هزینه مستقیم − هزینه مشترک تسهیم‌شده. این «سهم مدیریتی» است، نه سود قانونی یا صورت مالی حسابرسی‌شده.</p></div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['خدمت', 'درآمد', 'هزینه مستقیم', 'هزینه مشترک تسهیم‌شده', 'سهم مدیریتی', 'حاشیه سهم', 'ورودی ناقص'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(({s, allocated, r}) => <tr key={s.id} className="border-t"><td className="p-2">{s.service}</td><td className="p-2 tabular-nums">{n(s.revenue)}</td><td className="p-2 tabular-nums">{s.directCost === null ? 'ناموجود' : n(s.directCost)}</td><td className="p-2 tabular-nums">{n(allocated)}</td><td className="p-2 tabular-nums">{r.contribution === null ? 'قابل محاسبه نیست' : n(r.contribution)}</td><td className="p-2">{r.status === 'missing_input' ? '—' : pct(r.margin)}</td><td className="p-2 text-xs">{r.missing.join('، ') || (s.revenue === 0 ? 'درآمد صفر: درصد تعریف‌نشده' : '—')}</td></tr>)}</tbody></table></div>
    <div className={card}><Button onClick={freeze}>ثبت Snapshot با این نسخه تسهیم</Button>
      {st.contrib.length ? <ul className="text-xs space-y-1">{st.contrib.map(c => <li key={c.id} className="rounded border p-2"><bdi dir="ltr">{c.id}</bdi> · <bdi dir="ltr">{c.allocationId}</bdi> · {new Date(c.at).toLocaleString('fa-IR')} · {c.rows.map(r => `${r.service}: ${r.contribution === null ? 'ناقص' : n(r.contribution)}`).join(' · ')}</li>)}</ul> : <p className="text-xs text-slate-500">هنوز Snapshotی ثبت نشده است.</p>}</div>
  </div>;
}

/* ---------- FIN-004 ---------- */
function Forecast({st, update}: {st: FinState; update: Upd}) {
  const [horizon, setHorizon] = useState(7);
  const [lag, setLag] = useState(0);
  const [insufficient, setInsufficient] = useState(false);
  const receipts = forecast(forecastHistory('receipts', insufficient), horizon, lag);
  const revenue = forecast(forecastHistory('revenue'), horizon, 0);
  const save = () => update(s => ({...s, scenarios: [...s.scenarios, {id: uid('FSC'), kind: 'receipts', lag, horizon, at: new Date().toISOString(), total: receipts.status === 'OK' ? receipts.points.reduce((a, p) => a + p.point, 0) : null, status: receipts.status}]}));
  const block = (title: string, r: ReturnType<typeof forecast>, testid: string) => <div className={card} data-testid={testid}><h2 className="font-semibold">{title}</h2>
    {r.status === 'INSUFFICIENT_HISTORY' ? <p role="status" className="rounded bg-amber-50 p-3 text-sm text-amber-900"><bdi dir="ltr">INSUFFICIENT_HISTORY</bdi> — تاریخچه کافی (دست‌کم ۱۴ روز) وجود ندارد؛ پیش‌بینی و بازه ساخته نمی‌شود.</p> :
      <><table className="w-full text-sm"><thead className="text-xs text-slate-500"><tr><th className={th}>روز</th><th className={th}>برآورد نقطه‌ای</th><th className={th}>بازه پایین</th><th className={th}>بازه بالا</th></tr></thead><tbody>{r.points.map(p => <tr key={p.day} className="border-t"><td className="p-2">{n(p.day)}</td><td className="p-2 tabular-nums">{n(p.point)}</td><td className="p-2 tabular-nums">{n(p.low)}</td><td className="p-2 tabular-nums">{n(p.high)}</td></tr>)}</tbody></table>
        <p className="text-xs">بازه {r.interval} · MAE مدل در backtest: {n(Math.round(r.mae))} · MAE مبنای ساده (آخرین مقدار): {n(Math.round(r.baselineMae))}</p></>}</div>;
  return <div className="space-y-4" data-testid="fin-forecast">
    <div className={card}><div className="flex flex-wrap gap-3">
      <label className="text-sm">افق (روز)<select className={input} value={horizon} onChange={e => setHorizon(Number(e.target.value))}><option value={7}>۷</option><option value={14}>۱۴</option></select></label>
      <label className="text-sm">فرض تأخیر وصول (روز) — فقط سناریوی جدید<input type="number" min={0} max={30} className={input} value={lag} onChange={e => setLag(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}/></label>
      <label className="text-sm inline-flex items-center gap-2 mt-6"><input type="checkbox" checked={insufficient} onChange={e => setInsufficient(e.target.checked)}/>فیکسچر تاریخچه ناکافی</label></div>
      <p className="text-xs text-slate-600">تاریخ برش داده: ۱۴۰۵/۰۷/۳۰ · حساب‌ها و سایت‌های مستثنا: حساب‌های بین‌الملل (USD) و سایت‌های فاقد داده روزانه · مدل: seasonal-naive هفتگی (نمایشی)</p></div>
    <div className="grid gap-4 lg:grid-cols-2">{block('پیش‌بینی وصولی نقدی (receipts)', receipts, 'forecast-receipts')}{block('پیش‌بینی درآمد شناسایی‌شده (revenue)', revenue, 'forecast-revenue')}</div>
    <div className={card}><div className="flex flex-wrap gap-2"><Button onClick={save}>ثبت سناریوی وصول</Button><Button variant="outline" disabled title="مدل پیش‌بینی تأییدشده وجود ندارد">انتشار عملیاتی</Button></div>
      <p className="text-xs text-amber-800">انتشار عملیاتی غیرفعال است: تأیید مدل (model approval) ثبت نشده است.</p>
      {st.scenarios.length > 0 && <ul className="text-xs space-y-1">{st.scenarios.map(s => <li key={s.id} className="rounded border p-2"><bdi dir="ltr">{s.id}</bdi> · تأخیر {n(s.lag)} روز · افق {n(s.horizon)} · {s.status === 'OK' && s.total !== null ? `جمع برآورد ${n(s.total)}` : s.status} · {new Date(s.at).toLocaleString('fa-IR')}</li>)}</ul>}</div>
  </div>;
}

/* ---------- FIN-005 ---------- */
const DISP_LABEL = {explained: 'توضیح تأییدشده', false_positive: 'مثبت کاذب', escalated: 'ارجاع برای بررسی بیشتر'};
function Anomalies({siteCode, st, update, me, role}: {siteCode: string; st: FinState; update: Upd; me: {id: string; name: string}; role?: string}) {
  const cases = anomalyCases(siteCode);
  const [state, setState] = useState<Disposition['state']>('explained');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  if (!CAN_INVESTIGATE(role)) return <div className={card} data-testid="fin-anomaly-aggregate"><h2 className="font-semibold">بررسی ناهنجاری مالی (محرمانه)</h2>
    <p className="text-sm">تعداد پرونده‌های باز بررسی در این سایت: <strong>{n(cases.filter(c => !st.dispositions.some(d => d.caseId === c.id && d.state !== 'escalated')).length)}</strong></p>
    <p className="text-xs text-slate-600">جزئیات پرونده‌ها فقط برای تحلیل‌گر کنترل داخلی مجاز نمایش داده می‌شود.</p></div>;
  const dispose = (caseId: string) => {
    const r = (reason[caseId] ?? '').trim();
    if (r.length < 20) { setError('ثبت نتیجه بررسی به دلیل دست‌کم ۲۰ نویسه نیاز دارد.'); return; }
    setError('');
    update(s => ({...s, dispositions: [...s.dispositions, {caseId, state, reason: r, by: me.name, at: new Date().toISOString()}]}));
    setReason(x => ({...x, [caseId]: ''}));
  };
  return <div className="space-y-4" data-testid="fin-anomalies">
    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">این سیگنال‌ها برای بررسی‌اند و هیچ شخص یا مؤسسه‌ای بر اساس امتیاز هوش مصنوعی متقلب شناخته نمی‌شود.</p>
    {cases.map(c => { const history = st.dispositions.filter(d => d.caseId === c.id); return <div key={c.id} className={card} data-testid="fin-case">
      <h2 className="font-semibold">{c.title} · <bdi dir="ltr">{c.id}</bdi></h2>
      <p className="text-sm">سیگنال اصلی (حفظ‌شده): {c.signal} · شناسه‌های منبع: {c.sources.map(s => <bdi key={s} dir="ltr" className="me-2 font-mono">{s}</bdi>)}</p>
      {c.peerGroup && <p className="text-xs">گروه همتا: {c.peerGroup}</p>}
      <table className="w-full text-sm"><thead className="text-xs text-slate-500"><tr><th className={th}>فیلد مقایسه</th><th className={th}>{c.kind === 'duplicate' ? c.sources[0] : 'مقدار مشاهده‌شده'}</th><th className={th}>{c.kind === 'duplicate' ? c.sources[1] : 'گروه همتا'}</th></tr></thead><tbody>{c.fields.map(f => <tr key={f.label} className="border-t"><td className="p-2">{f.label}</td><td className="p-2">{f.a}</td><td className="p-2">{f.b}</td></tr>)}</tbody></table>
      <div className="flex flex-wrap items-end gap-2"><label className="text-sm">نتیجه بررسی<select className={input} value={state} onChange={e => setState(e.target.value as Disposition['state'])}>{Object.entries(DISP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="text-sm flex-1 min-w-60">دلیل بازبین<input className={input} value={reason[c.id] ?? ''} onChange={e => setReason(x => ({...x, [c.id]: e.target.value}))}/></label><Button onClick={() => dispose(c.id)}>ثبت نتیجه</Button></div>
      {history.length > 0 && <ul className="text-xs space-y-1">{history.map((d, i) => <li key={i} className="rounded border p-2">{DISP_LABEL[d.state]} · {d.by} · {new Date(d.at).toLocaleString('fa-IR')} · {d.reason}</li>)}</ul>}
    </div>; })}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}

/* ---------- FIN-006 ---------- */
function Contracts({st, update, me, notify}: {st: FinState; update: Upd; me: {id: string; name: string}; notify: (m: string) => void}) {
  const active = (o: typeof OBLIGATIONS[number]) => st.amendmentApplied ? o.contractVersionId === 'CTR-SUP-77@2' : o.contractVersionId === 'CTR-SUP-77@1';
  const isVerified = (id: string) => st.verified.some(v => v.obligationId === id);
  const verify = (id: string) => update(s => ({...s, verified: [...s.verified, {obligationId: id, by: me.name, at: new Date().toISOString()}]}));
  const remind = (o: typeof OBLIGATIONS[number]) => {
    if (!isVerified(o.id)) { notify('تعهد تأییدنشده نمی‌تواند یادآوری عملیاتی بسازد.'); return; }
    update(s => ({...s, reminders: [...s.reminders, {id: uid('REM'), obligationId: o.id, due: o.due, by: me.name, at: new Date().toISOString(), state: 'scheduled'}]}));
  };
  const applyAmendment = () => {
    update(s => ({...s, amendmentApplied: true, reminders: s.reminders.map(r => r.obligationId === 'OBL-77-PAY2@1' && r.state === 'scheduled' ? {...r, state: 'invalidated', note: 'باطل‌شده با متمم ۱ (CTR-SUP-77@2)'} : r)}));
    notify('متمم اعمال شد؛ تعهد نسخه قبل جایگزین و یادآوری‌های آینده آن باطل شد.');
  };
  return <div className="space-y-4" data-testid="fin-contracts">
    <div className={card}><h2 className="font-semibold">نسخه‌های قرارداد</h2>
      <ol className="space-y-2 text-sm">{CONTRACT_VERSIONS.map(v => <li key={v.id} className={`rounded border p-3 ${v.id === 'CTR-SUP-77@1' && st.amendmentApplied ? 'opacity-70' : ''}`}><strong>{v.contract}</strong> · <bdi dir="ltr">{v.id}</bdi> · مؤثر از {v.effective}{v.supersedes && <> · جایگزین <bdi dir="ltr">{v.supersedes}</bdi></>}{v.id === 'CTR-SUP-77@1' && st.amendmentApplied && ' · جایگزین‌شده'}
        {v.pages.map(p => <blockquote key={p.page} className="mt-2 border-s-4 border-slate-300 ps-3 text-xs">«{p.text}» — متن مستند، صفحه {n(p.page)}</blockquote>)}</li>)}</ol>
      {!st.amendmentApplied && <Button variant="outline" onClick={applyAmendment}>اعمال متمم ۱ (نسخه ۲)</Button>}</div>
    <div className={card}><h2 className="font-semibold">تعهدات استخراج‌شده (پیشنهادی)</h2>
      <p className="text-xs text-slate-600">تاریخ‌ها توسط مدل پیشنهاد شده‌اند؛ تا تأیید انسانی، یادآوری عملیاتی ساخته نمی‌شود. «متن مستند» از تفسیر پیشنهادی جداست.</p>
      <table className="w-full text-sm"><thead className="text-xs text-slate-500"><tr>{['تعهد', 'موعد', 'استناد', 'وضعیت نسخه', 'تأیید انسانی', ''].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{OBLIGATIONS.filter(o => o.contractVersionId === 'CTR-SUP-77@1' || st.amendmentApplied).map(o => <tr key={o.id} className="border-t"><td className="p-2">{o.text} <span className="text-xs text-slate-500">(تفسیر پیشنهادی)</span></td><td className="p-2" dir="ltr">{o.due}</td><td className="p-2 font-mono text-xs" dir="ltr">{o.citation}</td><td className="p-2">{active(o) ? 'فعال' : 'جایگزین‌شده'}</td><td className="p-2">{isVerified(o.id) ? `تأییدشده (${st.verified.find(v => v.obligationId === o.id)!.by})` : 'تأییدنشده'}</td>
          <td className="p-2 space-x-1">{active(o) && !isVerified(o.id) && <Button size="sm" variant="outline" onClick={() => verify(o.id)}>تأیید موعد</Button>}{active(o) && <Button size="sm" disabled={!isVerified(o.id)} onClick={() => remind(o)}>ایجاد یادآوری</Button>}</td></tr>)}</tbody></table></div>
    <div className={card}><h2 className="font-semibold">یادآوری‌ها</h2>{st.reminders.length ? <ul className="text-xs space-y-1">{st.reminders.map(r => <li key={r.id} className={`rounded border p-2 ${r.state === 'invalidated' ? 'line-through decoration-rose-600' : ''}`}><bdi dir="ltr">{r.obligationId}</bdi> · موعد {r.due} · {r.state === 'scheduled' ? 'زمان‌بندی‌شده (شبیه‌سازی)' : r.state === 'invalidated' ? 'باطل‌شده' : 'ارسال‌شده'}{r.note ? ` · ${r.note}` : ''} · {r.by}</li>)}</ul> : <p className="text-xs text-slate-500">یادآوری‌ای ثبت نشده است.</p>}
      <p className="text-xs text-slate-500">یادآوری‌های ارسال‌شده گذشته پس از متمم حفظ می‌شوند؛ فقط یادآوری‌های آینده نسخه جایگزین‌شده باطل می‌شوند.</p></div>
  </div>;
}

/* ---------- FIN-007 ---------- */
const DRAFT_STATUS: Record<Draft['status'], string> = {draft: 'پیش‌نویس', awaiting_approval: 'در انتظار تأیید payload', approved: 'payload تأیید شد', analytical_reviewed: 'بازبینی تحلیلی (بدون سند)', dispatched_uncertain: 'نتیجه منبع نامشخص — نیازمند تطبیق', reconciled_success: 'تطبیق: انجام‌شده در منبع', reconciled_failed: 'تطبیق: انجام‌نشده در منبع'};
const TYPE_LABEL: Record<FinPayload['type'], string> = {appeal: 'اعتراض به کسورات', budget: 'تعهد بودجه', reconciliation: 'اصلاح تطبیق', contract_followup: 'پیگیری قرارداد', payment: 'پرداخت'};
function Drafts({siteId, role, st, update, me, notify, openTask}: {siteId: string; role?: string; st: FinState; update: Upd; me: {id: string; name: string}; notify: (m: string) => void; openTask: (id: string) => void}) {
  const blank: FinPayload = {type: 'payment', target: '', amount: 100, currency: 'IRR', evidence: [], note: ''};
  const [p, setP] = useState<FinPayload>(blank);
  const [ev, setEv] = useState('');
  const [error, setError] = useState('');
  const [recon, setRecon] = useState<Record<string, {reference: string; outcome: string}>>({});
  const log = (d: Draft, text: string): Draft => ({...d, history: [...d.history, {at: new Date().toISOString(), text}]});
  const set = (id: string, fn: (d: Draft) => Draft) => update(s => ({...s, drafts: s.drafts.map(d => d.id === id ? fn(d) : d)}));
  const create = () => {
    if (!p.target.trim() || !(p.amount > 0) || !p.evidence.length) { setError('مقصد، مبلغ مثبت و دست‌کم یک شاهد الزامی است.'); return; }
    setError('');
    const d: Draft = {id: uid('FDR'), payload: p, hash: payloadHash(p), by: me.id, byName: me.name, at: new Date().toISOString(), status: 'draft', history: [{at: new Date().toISOString(), text: 'پیش‌نویس ساخته شد'}]};
    update(s => ({...s, drafts: [...s.drafts, d]})); setP(blank); notify('پیش‌نویس تصمیم مالی ساخته شد.');
  };
  const editAmount = (d: Draft, amount: number) => set(d.id, x => { const payload = {...x.payload, amount}; const hash = payloadHash(payload);
    const invalid = !!x.approval && x.approval.hash !== hash;
    return log({...x, payload, hash, status: invalid ? 'draft' : x.status, approval: invalid ? undefined : x.approval}, invalid ? `مبلغ به ${amount} تغییر کرد؛ تأیید قبلی (payload ${x.approval!.hash}) باطل شد` : `مبلغ به ${amount} تغییر کرد`); });
  const approve = (d: Draft) => {
    if (d.by === me.id) { notify('سازنده نمی‌تواند payload خود را تأیید کند.'); return; }
    if (role !== 'process_approver' && role !== 'domain_analyst') { notify('نقش شما مجاز به تأیید مالی نیست.'); return; }
    set(d.id, x => log({...x, status: 'approved', approval: {by: me.id, byName: me.name, at: new Date().toISOString(), hash: x.hash}}, `payload ${x.hash} توسط ${me.name} تأیید شد`));
  };
  const dispatch = (d: Draft) => {
    if (d.status !== 'approved' || d.approval?.hash !== d.hash) { notify('ارسال فقط برای payload تأییدشده و بدون تغییر مجاز است.'); return; }
    const task = newTask(siteId, {}); task.title = `تطبیق نتیجه تراکنش مالی ${d.id}`; task.description = `ارسال شبیه‌سازی‌شده به سامانه مالی با مهلت پایان یافت. پیش از هر ارسال دوباره، نتیجه را در منبع تطبیق دهید. payload: ${d.hash}`; task.priority = 'high';
    try { demoStore.saveTask(task); } catch { /* title is fixed-length */ }
    set(d.id, x => log({...x, status: 'dispatched_uncertain', taskId: task.id}, 'ارسال شبیه‌سازی‌شده: مهلت منبع تمام شد؛ موفقیت پرداخت گزارش نمی‌شود و وظیفه تطبیق ساخته شد'));
  };
  const reconcile = (d: Draft) => { const r = recon[d.id]; if (!r?.reference.trim() || !r.outcome) { notify('مرجع منبع و نتیجه تطبیق الزامی است.'); return; }
    set(d.id, x => log({...x, status: r.outcome === 'success' ? 'reconciled_success' : 'reconciled_failed', reconciliation: {reference: r.reference.trim(), outcome: r.outcome, at: new Date().toISOString()}}, `تطبیق با مرجع ${r.reference.trim()}: ${r.outcome === 'success' ? 'انجام‌شده' : 'انجام‌نشده'}`)); };
  return <div className="space-y-4" data-testid="fin-drafts">
    <div className={card}><h2 className="font-semibold">پیش‌نویس تازه</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">نوع<select className={input} value={p.type} onChange={e => setP({...p, type: e.target.value as FinPayload['type']})}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="text-sm">مقصد / ذی‌نفع<input className={input} value={p.target} onChange={e => setP({...p, target: e.target.value})}/></label>
        <label className="text-sm">مبلغ<input type="number" min={1} className={input} value={p.amount} onChange={e => setP({...p, amount: Number(e.target.value)})}/></label>
        <label className="text-sm">ارز<select className={input} value={p.currency} onChange={e => setP({...p, currency: e.target.value as Currency})}><option value="IRR">IRR</option><option value="USD">USD</option></select></label>
        <label className="text-sm sm:col-span-2">شواهد (شناسه، با Enter اضافه کنید)<input className={input} value={ev} onChange={e => setEv(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ev.trim()) { e.preventDefault(); setP({...p, evidence: [...p.evidence, ev.trim()]}); setEv(''); } }}/></label>
        <p className="text-xs sm:col-span-2">شواهد: {p.evidence.join('، ') || 'هنوز اضافه نشده'}</p>
        <label className="text-sm sm:col-span-2">توضیح<textarea className={input} value={p.note} onChange={e => setP({...p, note: e.target.value})}/></label>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button onClick={create}>ساخت پیش‌نویس</Button>
      <p className="text-xs text-slate-500">انواع الزام‌آور (پرداخت، تعهد بودجه) کنترل T3 دارند: تأیید payload دقیق توسط تأییدکننده مستقل، مجوز جاری و تطبیق منبع. سند حسابداری با زبان طبیعی ساخته نمی‌شود.</p></div>
    {st.drafts.map(d => { const binding = BINDING_TYPES.includes(d.payload.type); return <div key={d.id} className={card} data-testid="fin-draft">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{TYPE_LABEL[d.payload.type]} · <bdi dir="ltr">{d.id}</bdi></h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs" data-testid="fin-draft-status">{DRAFT_STATUS[d.status]}</span></div>
      <p className="text-sm">مقصد: {d.payload.target} · مبلغ: {formatMoney(d.payload.amount, d.payload.currency)} · شواهد: {d.payload.evidence.join('، ')} · سازنده: {d.byName}</p>
      <p className="text-xs">هش payload: <bdi dir="ltr" className="font-mono">{d.hash}</bdi>{d.approval && <> · تأییدشده برای <bdi dir="ltr" className="font-mono">{d.approval.hash}</bdi> توسط {d.approval.byName}</>}</p>
      <div className="flex flex-wrap items-end gap-2">
        {['draft', 'approved', 'awaiting_approval'].includes(d.status) && <label className="text-xs">ویرایش مبلغ<input type="number" min={1} className="ms-1 w-28 rounded border p-1" defaultValue={d.payload.amount} onBlur={e => { const v = Number(e.target.value); if (v > 0 && v !== d.payload.amount) editAmount(d, v); }}/></label>}
        {d.status === 'draft' && binding && <Button size="sm" onClick={() => set(d.id, x => log({...x, status: 'awaiting_approval'}, 'برای تأیید payload ارسال شد'))}>ارسال برای تأیید</Button>}
        {d.status === 'draft' && !binding && <Button size="sm" variant="outline" onClick={() => set(d.id, x => log({...x, status: 'analytical_reviewed'}, 'بازبینی تحلیلی ثبت شد؛ هیچ سند حسابداری ساخته نشد'))}>ثبت بازبینی تحلیلی</Button>}
        {d.status === 'awaiting_approval' && <Button size="sm" onClick={() => approve(d)} disabled={d.by === me.id}>تأیید payload {d.by === me.id ? '(سازنده مجاز نیست)' : ''}</Button>}
        {d.status === 'approved' && <Button size="sm" onClick={() => dispatch(d)}>ارسال شبیه‌سازی‌شده به منبع</Button>}
        {d.taskId && <Button size="sm" variant="outline" onClick={() => openTask(d.taskId!)}>وظیفه تطبیق</Button>}
      </div>
      {d.status === 'dispatched_uncertain' && <div className="flex flex-wrap items-end gap-2 rounded bg-amber-50 p-3"><p className="w-full text-xs text-amber-900">مهلت پاسخ منبع تمام شد. موفقیت پرداخت گزارش نمی‌شود؛ ارسال دوباره پیش از تطبیق مجاز نیست.</p>
        <label className="text-xs">مرجع منبع<input className="ms-1 rounded border p-1" value={recon[d.id]?.reference ?? ''} onChange={e => setRecon(x => ({...x, [d.id]: {reference: e.target.value, outcome: x[d.id]?.outcome ?? ''}}))}/></label>
        <label className="text-xs">نتیجه<select className="ms-1 rounded border p-1" value={recon[d.id]?.outcome ?? ''} onChange={e => setRecon(x => ({...x, [d.id]: {reference: x[d.id]?.reference ?? '', outcome: e.target.value}}))}><option value="">انتخاب</option><option value="success">در منبع انجام شده</option><option value="failed">در منبع انجام نشده</option></select></label>
        <Button size="sm" onClick={() => reconcile(d)}>ثبت تطبیق</Button></div>}
      <details><summary className="cursor-pointer text-xs">تاریخچه</summary><ul className="text-xs space-y-1 mt-1">{d.history.map((h, i) => <li key={i}>{new Date(h.at).toLocaleString('fa-IR')} · {h.text}</li>)}</ul></details>
    </div>; })}
  </div>;
}

/** FIN module summary cards, computed from the same fixtures as the workflows (no hard-coded KPIs). */
export function FinanceKpis() {
  const {scope} = useApp();
  const siteCode = (SITES_DATA.find(s => s.id === scope.siteId)?.code ?? 'SITE').replace('SITE-', '');
  const rates = denialRates(claimsFixture(siteCode));
  const pending = claimsFixture(siteCode).filter(c => c.stage === 'submitted').length;
  const irr = totalsByCurrency(sourceTotals('1405-07'), null).byCurrency.find(t => t.currency === 'IRR')!;
  const tile = (label: string, value: string, note: string, tone = 'text-slate-900') => <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1"><span className="text-xs text-slate-500 block">{label}</span><div className={`text-2xl font-black tabular-nums ${tone}`}>{value}</div><span className="text-[11px] text-slate-500 block">{note}</span></div>;
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="fin-kpis">
    {tile('نرخ وقوع کسورات (سطح ادعا)', pct(rates.incidence), `${n(rates.withDenial)} از ${n(rates.cohort)} ادعای رسیدگی‌شده · داده نمونه`, 'text-teal-700')}
    {tile('نرخ کسورات مبلغی', pct(rates.amountRate), 'همان cohort رسیدگی‌شده')}
    {tile('اختلاف تطبیق ریالی مهر ۱۴۰۵', `${irr.difference.toLocaleString('en-US')} IRR`, 'دوره موقت؛ تطبیق‌نشده', irr.difference ? 'text-rose-700' : 'text-slate-900')}
    {tile('ادعاهای در انتظار رسیدگی', n(pending), 'خارج از cohort نرخ کسورات')}
  </div>;
}
