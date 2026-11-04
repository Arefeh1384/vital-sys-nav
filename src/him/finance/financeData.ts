/**
 * Finance (FIN) synthetic fixtures and pure calculations.
 * Numbers follow the acceptance examples of REQ-FIN-001..007 so the UI can be checked by hand.
 * Amounts are integer minor units (IRR has none; USD in cents) to preserve decimal precision.
 */

// ---------- FIN-001 reconciled analytics ----------
export type Currency = 'IRR' | 'USD';
export type PeriodStatus = 'provisional' | 'closed' | 'reopened';
export interface SourceTotal {source: string; group: string; currency: Currency; basis: 'accrual' | 'cash'; sourceTotal: number; importedTotal: number}
export interface FinPeriod {id: string; label: string; status: PeriodStatus}
export const FIN_PERIODS: FinPeriod[] = [
  {id: '1405-06', label: 'شهریور ۱۴۰۵', status: 'closed'},
  {id: '1405-07', label: 'مهر ۱۴۰۵', status: 'provisional'},
];
export function sourceTotals(periodId: string): SourceTotal[] {
  const closed = periodId === '1405-06';
  return [
    {source: 'HIS صورت‌حساب بستری', group: 'درآمد بستری', currency: 'IRR', basis: 'accrual', sourceTotal: 1_000_000, importedTotal: closed ? 1_000_000 : 999_000},
    {source: 'دفتر کل حسابداری', group: 'درآمد سرپایی', currency: 'IRR', basis: 'accrual', sourceTotal: 2_450_000, importedTotal: 2_450_000},
    {source: 'صورت‌حساب بیماران بین‌الملل', group: 'درآمد بین‌الملل', currency: 'USD', basis: 'accrual', sourceTotal: 125_050, importedTotal: 125_050},
  ];
}
/** Totals per currency only: without an approved exchange-rate version currencies are never summed together. */
export function totalsByCurrency(rows: SourceTotal[], approvedRateVersion: string | null) {
  const out = new Map<Currency, {source: number; imported: number; difference: number}>();
  for (const r of rows) {
    const t = out.get(r.currency) ?? {source: 0, imported: 0, difference: 0};
    t.source += r.sourceTotal; t.imported += r.importedTotal; t.difference = t.imported - t.source;
    out.set(r.currency, t);
  }
  return {byCurrency: [...out.entries()].map(([currency, t]) => ({currency, ...t})), combined: approvedRateVersion ? 'requires-conversion' as const : null};
}
export const reconciliationDifference = (r: SourceTotal) => r.importedTotal - r.sourceTotal;
export const formatMoney = (minor: number, c: Currency) => c === 'USD'
  ? `${(minor / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`
  : `${minor.toLocaleString('fa-IR')} ریال`;

// ---------- FIN-002 denials ----------
export type ClaimStage = 'submitted' | 'adjudicated' | 'denied' | 'partially_paid' | 'adjusted' | 'appealed' | 'recovered';
export interface Claim {id: string; payer: string; service: string; stage: ClaimStage; submitted: number; approved: number | null; denied: number; reasonCode: string | null; adjudicationEventId: string | null; evidence: string[]}
export const REASON_MAPPING = {version: 'RSN-MAP@3', reasons: {
  'D-DOC': 'نقص مستندات بالینی', 'D-TARIFF': 'مغایرت تعرفه', 'D-ELIG': 'عدم احراز پوشش بیمه', 'D-DUP': 'خدمت تکراری',
} as Record<string, string>};
export function claimsFixture(siteCode: string): Claim[] {
  const c = (i: number, payer: string, service: string, stage: ClaimStage, submitted: number, approved: number | null, denied: number, reasonCode: string | null): Claim =>
    ({id: `CLM-${siteCode}-${1000 + i}`, payer, service, stage, submitted, approved, denied, reasonCode, adjudicationEventId: approved === null ? null : `ADJ-${siteCode}-${1000 + i}`, evidence: [`پرونده صورت‌حساب ${1000 + i}`, ...(reasonCode ? [`نامه کسورات ${reasonCode}`] : [])]});
  // Ten adjudicated claims: three with denied amounts (30% incidence); 1,000 submitted, 120 denied (12% amount rate).
  return [
    c(1, 'تأمین اجتماعی', 'بستری جراحی', 'partially_paid', 150, 100, 50, 'D-DOC'),
    c(2, 'تأمین اجتماعی', 'آزمایشگاه', 'adjudicated', 80, 80, 0, null),
    c(3, 'سلامت ایرانیان', 'تصویربرداری', 'denied', 40, 0, 40, 'D-ELIG'),
    c(4, 'سلامت ایرانیان', 'بستری داخلی', 'adjudicated', 200, 200, 0, null),
    c(5, 'نیروهای مسلح', 'دارو', 'appealed', 100, 70, 30, 'D-TARIFF'),
    c(6, 'تأمین اجتماعی', 'سرپایی', 'adjudicated', 60, 60, 0, null),
    c(7, 'تأمین اجتماعی', 'فیزیوتراپی', 'adjusted', 90, 90, 0, null),
    c(8, 'سلامت ایرانیان', 'آنژیوگرافی', 'adjudicated', 120, 120, 0, null),
    c(9, 'نیروهای مسلح', 'اورژانس', 'recovered', 70, 70, 0, null),
    c(10, 'تأمین اجتماعی', 'دیالیز', 'adjudicated', 90, 90, 0, null),
    c(11, 'سلامت ایرانیان', 'بستری قلب', 'submitted', 300, null, 0, null),
  ];
}
/** Re-imported adjudication events are counted once (dedup by adjudication event id). */
export function dedupeAdjudications(claims: Claim[]) {
  const seen = new Set<string>();
  return claims.filter(c => !c.adjudicationEventId || (seen.has(c.adjudicationEventId) ? false : (seen.add(c.adjudicationEventId), true)));
}
export function denialRates(claims: Claim[]) {
  const cohort = dedupeAdjudications(claims).filter(c => c.adjudicationEventId);
  const withDenial = cohort.filter(c => c.denied > 0);
  const submitted = cohort.reduce((s, c) => s + c.submitted, 0);
  const denied = cohort.reduce((s, c) => s + c.denied, 0);
  return {cohort: cohort.length, withDenial: withDenial.length, incidence: cohort.length ? withDenial.length / cohort.length : null,
    submitted, denied, amountRate: submitted ? denied / submitted : null};
}

// ---------- FIN-003 contribution ----------
export interface ServiceLine {id: string; service: string; revenue: number; directCost: number | null; sharedPool: number}
export const ALLOCATION_VERSIONS = [
  {id: 'ALLOC@2', label: 'تسهیم بر اساس روز-تخت (نسخه ۲، مصوب)', share: (s: ServiceLine) => s.sharedPool * 0.5},
  {id: 'ALLOC@3', label: 'تسهیم بر اساس ساعت پرسنل (نسخه ۳، مصوب)', share: (s: ServiceLine) => s.sharedPool * 0.6},
];
export const SERVICE_LINES: ServiceLine[] = [
  {id: 'SVC-CARD', service: 'قلب و عروق', revenue: 1000, directCost: 400, sharedPool: 400},
  {id: 'SVC-ORTH', service: 'ارتوپدی', revenue: 800, directCost: 500, sharedPool: 200},
  {id: 'SVC-NEURO', service: 'مغز و اعصاب', revenue: 600, directCost: null, sharedPool: 150},
  {id: 'SVC-RESEARCH', service: 'خدمات پژوهشی بدون درآمد', revenue: 0, directCost: 50, sharedPool: 20},
];
export function contribution(s: ServiceLine, allocated: number) {
  if (s.directCost === null) return {status: 'missing_input' as const, missing: ['هزینه مستقیم'], contribution: null, margin: null};
  const value = s.revenue - s.directCost - allocated;
  return {status: 'computed' as const, missing: [] as string[], contribution: value, margin: s.revenue === 0 ? null : value / s.revenue};
}

// ---------- FIN-004 forecast ----------
export interface Series {kind: 'receipts' | 'revenue'; history: number[]}
/** Daily history (last 28 days); receipts lag revenue by payer collection lag. */
export function forecastHistory(kind: 'receipts' | 'revenue', insufficient = false): number[] {
  if (insufficient) return [120, 118, 125];
  return Array.from({length: 28}, (_, i) => Math.round((kind === 'revenue' ? 1000 : 820) + 80 * Math.sin(i * 2 * Math.PI / 7) + (i % 5) * 6));
}
export function forecast(history: number[], horizon: number, lagDays: number) {
  if (history.length < 14) return {status: 'INSUFFICIENT_HISTORY' as const};
  // Seasonal-naive model (weekly), shifted by collection lag; baseline = last value.
  const pred = (h: number[], i: number) => h[h.length - 7 + ((i - lagDays % 7 + 7) % 7)]!;
  const errs: number[] = []; const baseErrs: number[] = [];
  for (let t = 14; t < history.length; t++) {
    const train = history.slice(0, t);
    errs.push(Math.abs(pred(train, 0) - history[t]!));
    baseErrs.push(Math.abs(train[train.length - 1]! - history[t]!));
  }
  const mae = errs.reduce((a, b) => a + b, 0) / errs.length;
  const baselineMae = baseErrs.reduce((a, b) => a + b, 0) / baseErrs.length;
  const sorted = [...errs].sort((a, b) => a - b);
  const q80 = sorted[Math.floor(sorted.length * 0.8)] ?? mae;
  const points = Array.from({length: horizon}, (_, i) => {const p = pred(history, i); return {day: i + 1, point: p, low: Math.max(0, p - q80), high: p + q80};});
  return {status: 'OK' as const, points, mae, baselineMae, interval: '80% (خطای backtest تجربی)'};
}

// ---------- FIN-005 anomaly cases ----------
export interface AnomalyCase {id: string; kind: 'duplicate' | 'peer_deviation'; title: string; signal: string; fields: {label: string; a: string; b: string}[]; sources: string[]; peerGroup?: string}
export function anomalyCases(siteCode: string): AnomalyCase[] {
  return [
    {id: `FAC-${siteCode}-01`, kind: 'duplicate', title: 'احتمال صورت‌حساب تکراری برای بررسی', signal: 'شباهت ۰٫۹۸ در کلیدهای مقایسه',
      sources: [`INV-${siteCode}-88412`, `INV-${siteCode}-88419`],
      fields: [{label: 'تأمین‌کننده', a: 'شرکت تجهیزات نمونه الف', b: 'شرکت تجهیزات نمونه الف'}, {label: 'مبلغ', a: '۴۵٬۲۰۰٬۰۰۰ ریال', b: '۴۵٬۲۰۰٬۰۰۰ ریال'},
        {label: 'تاریخ', a: '۱۴۰۵/۰۷/۱۲', b: '۱۴۰۵/۰۷/۱۴'}, {label: 'شرح', a: 'استنت کرونری × ۴', b: 'استنت کرونری × ۴'}]},
    {id: `FAC-${siteCode}-02`, kind: 'peer_deviation', title: 'انحراف قیمت واحد از گروه همتا', signal: 'قیمت واحد ۳٫۱ انحراف معیار بالاتر از میانه گروه همتا',
      sources: [`PO-${siteCode}-5521`], peerGroup: 'بیمارستان‌های آموزشی هم‌اندازه، ۹۰ روز گذشته',
      fields: [{label: 'قیمت واحد', a: '۱۸٬۵۰۰٬۰۰۰ ریال', b: 'میانه همتا: ۱۲٬۹۰۰٬۰۰۰ ریال'}, {label: 'تعداد همتا', a: '—', b: '۶ سفارش'}]},
  ];
}
export const CAN_INVESTIGATE = (role: string | undefined) => role === 'domain_analyst' || role === 'process_approver';

// ---------- FIN-006 contracts ----------
export interface ContractVersion {id: string; contract: string; version: number; supersedes?: string; effective: string; pages: {page: number; text: string}[]}
export interface Obligation {id: string; contractVersionId: string; kind: 'payment' | 'renewal'; due: string; citation: string; text: string}
export const CONTRACT_VERSIONS: ContractVersion[] = [
  {id: 'CTR-SUP-77@1', contract: 'قرارداد تأمین تجهیزات مصرفی (نمونه)', version: 1, effective: '2026-07-01', pages: [{page: 3, text: 'بند ۴-۲: پرداخت قسط دوم حداکثر تا ۱۵ آذر ۱۴۰۵ (2026-12-06) انجام می‌شود.'}]},
  {id: 'CTR-SUP-77@2', contract: 'قرارداد تأمین تجهیزات مصرفی (نمونه) — متمم ۱', version: 2, supersedes: 'CTR-SUP-77@1', effective: '2026-10-20', pages: [{page: 1, text: 'متمم ۱، بند ۲: موعد قسط دوم به ۳۰ آذر ۱۴۰۵ (2026-12-21) تغییر می‌کند.'}]},
];
export const OBLIGATIONS: Obligation[] = [
  {id: 'OBL-77-PAY2@1', contractVersionId: 'CTR-SUP-77@1', kind: 'payment', due: '2026-12-06', citation: 'CTR-SUP-77@1#page-3', text: 'پرداخت قسط دوم'},
  {id: 'OBL-77-PAY2@2', contractVersionId: 'CTR-SUP-77@2', kind: 'payment', due: '2026-12-21', citation: 'CTR-SUP-77@2#page-1', text: 'پرداخت قسط دوم (پس از متمم)'},
];

// ---------- FIN-007 governed drafts ----------
export interface FinPayload {type: 'appeal' | 'budget' | 'reconciliation' | 'contract_followup' | 'payment'; target: string; amount: number; currency: Currency; evidence: string[]; note: string}
/** Canonical payload hash; any change (100 → 101) yields a different hash and invalidates approval. */
export function payloadHash(p: FinPayload) {
  const s = JSON.stringify([p.type, p.target.trim(), p.amount, p.currency, [...p.evidence].sort(), p.note.trim()]);
  let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `PH-${(h >>> 0).toString(16).padStart(8, '0')}`;
}
export const BINDING_TYPES: FinPayload['type'][] = ['payment', 'budget'];
