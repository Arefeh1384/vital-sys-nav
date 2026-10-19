import { ACTIONS_DATA, HEPARIN_AFTER, HEPARIN_BEFORE } from './actionData';
import { ALERTS_DATA, TASKS_DATA } from './workData';
import { alertEvidence, taskEvidence } from './evidenceData';
import { SITES_DATA } from './mockData';

export type AnswerStatus = 'answered' | 'partial' | 'clarification_required' | 'abstained';
export type RunState = 'queued' | 'running' | 'validating' | 'completed' | 'completed_partial' | 'awaiting_input' | 'abstained' | 'canceled' | 'timed_out' | 'failed';
export type ReasonCode = 'missing_evidence' | 'conflicting_evidence' | 'ambiguous_request' | 'scope_not_authorized' | 'source_stale' | 'source_unavailable' | 'unsupported_task' | 'validation_failed';
export type EvidenceKind = 'computed' | 'retrieved' | 'hypothesis' | 'recommendation';
export interface SourceLink { kind: 'proposal' | 'task' | 'alert'; id: string }
export interface EvidenceItem {
  id: string; kind: EvidenceKind; title: string; version: string; locator: string; dataAsOf: string;
  freshness: 'fresh' | 'stale'; excerpt: string; numerator?: number; denominator?: number; metricVersion?: string; value?: string;
  link?: SourceLink; revoked?: boolean;
}
export interface AnswerBlock { text: string; evidenceIds: string[] }
export interface AnswerArtifact {
  id: string; runId: string; revision: number; status: AnswerStatus; reasonCodes: ReasonCode[];
  blocks: AnswerBlock[]; limitations: string[]; evidence: EvidenceItem[];
  clarification?: { question: string; options: string[] };
  conflict?: { titleA: string; titleB: string; linkA?: SourceLink; linkB?: SourceLink };
  generatedAt: string; dataAsOf: string; followUps: string[]; aiAssisted: true;
  professionalReviewRequired: boolean; reviewed: boolean;
  relatedActionIds: string[]; relatedTaskIds: string[]; relatedAlertIds: string[];
  nextStep?: string; scopeRedacted?: boolean;
}
export interface CopilotTurn {
  id: string; siteId: string; userId?: string; question: string; at: string; language: 'fa' | 'en';
  state: RunState; jobState: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceling';
  idempotencyKey: string; answer?: AnswerArtifact; originalAnswer?: AnswerArtifact;
  context?: { purpose: string; range: string; attachmentIds: string[] };
  feedback?: { helpful: boolean | null; errorType: string; text: string };
}
export const REASON_LABEL: Record<ReasonCode, string> = {
  missing_evidence: 'شواهد ناموجود', conflicting_evidence: 'تعارض بین منابع', ambiguous_request: 'درخواست مبهم',
  scope_not_authorized: 'خارج از دامنه‌ی مجاز', source_stale: 'منبع کهنه', source_unavailable: 'منبع در دسترس نیست',
  unsupported_task: 'وظیفه‌ی پشتیبانی‌نشده', validation_failed: 'اعتبارسنجی ناموفق',
};
export const ANSWER_LABEL: Record<AnswerStatus, string> = { answered: 'پاسخ کامل', partial: 'پاسخ ناقص', clarification_required: 'نیاز به توضیح بیشتر', abstained: 'شواهد کافی نیست' };
export const RUN_LABEL: Record<RunState, string> = {
  queued: 'در صف', running: 'در حال جمع‌آوری شواهد', validating: 'در حال اعتبارسنجی', completed: 'پاسخ کامل', completed_partial: 'پاسخ ناقص',
  awaiting_input: 'نیاز به توضیح بیشتر', abstained: 'شواهد کافی نیست', canceled: 'لغو شد', timed_out: 'زمان اجرا تمام شد', failed: 'ناموفق',
};
export const KIND_LABEL: Record<EvidenceKind, string> = { retrieved: 'واقعیت بازیابی‌شده', computed: 'نتیجه‌ی محاسبه‌شده', hypothesis: 'فرضیه', recommendation: 'پیگیری پیشنهادی' };
export const SUGGESTIONS = ['اشغال تخت بیمارستان فعلی چقدر است؟', 'وضعیت سفارش هپارین چیست؟', 'سیاست مرخصی استعلاجی چیست؟', 'سیاست اضافه‌کار چیست؟', 'وضعیت چطوره؟', 'گزارش هفته‌ی قبل تخت‌های ICU'];
export const MAX_QUESTION_LENGTH = 16000;
export const RUN_DEADLINE_MS = 90000;
export const DATA_AS_OF = '2026-10-19T05:00:00.000Z';
export function normalizeQuestion(s: string) {
  return s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[\u200c\u200f]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
export function questionError(q: string): string | null {
  if (!q.trim()) return 'سؤال باید دست‌کم یک نویسه داشته باشد.';
  return q.length > MAX_QUESTION_LENGTH ? 'سؤال نباید بیشتر از ۱۶٬۰۰۰ نویسه باشد.' : null;
}
export function metricResult(numerator: number, denominator: number): { status: 'computed'; value: number } | { status: 'not_computable' } {
  return denominator === 0 ? { status: 'not_computable' } : { status: 'computed', value: numerator / denominator * 100 };
}
// The central office has no active beds: its occupancy has a zero denominator and must read "not computable", never 0%.
export const OCCUPANCY_METRICS = SITES_DATA.map(s => s.activeBeds === 0
  ? { siteId: s.id, numerator: 0, denominator: 0, version: 'occ-v2', dataAsOf: DATA_AS_OF }
  : { siteId: s.id, numerator: 80, denominator: 100, version: 'occ-v2', dataAsOf: DATA_AS_OF });
export function approvedDocuments(siteId: string) {
  const taskA = TASKS_DATA.find(t => t.siteId === siteId && t.title.includes('اضافه‌کار') && t.title.includes('الف'))
    ?? TASKS_DATA.find(t => t.siteId === siteId && t.module === 'PLT');
  const taskB = TASKS_DATA.find(t => t.siteId === siteId && t.title.includes('اضافه‌کار') && t.title.includes('ب'))
    ?? taskA;
  const capacity = TASKS_DATA.find(t => t.siteId === siteId && t.module === 'OPS');
  if (!taskA || !capacity) return [];
  return [
    { id: `${siteId}-capacity`, title: 'سیاست ظرفیت تخت (نمونه)', version: 'cap-v1', taskId: capacity.id },
    { id: `${siteId}-policy-a`, title: 'سیاست اضافه‌کار — نسخه الف (نمونه)', version: 'policy-a-v1', taskId: taskA.id },
    { id: `${siteId}-policy-b`, title: 'سیاست اضافه‌کار — نسخه ب (نمونه)', version: 'policy-b-v2', taskId: taskB ? taskB.id : taskA.id },
  ];
}
function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); }
export function evidenceForDisplay(e: EvidenceItem): EvidenceItem {
  return e.revoked ? { id: e.id, kind: e.kind, title: 'شواهد دیگر در دسترس نیست', version: '', locator: '', dataAsOf: '', freshness: e.freshness, excerpt: '', revoked: true } : e;
}
export function validateAnswer(answer: AnswerArtifact): AnswerArtifact {
  const invalid = answer.blocks.some(b => b.evidenceIds.length === 0 || b.evidenceIds.some(id => !answer.evidence.some(e => e.id === id)));
  if (invalid) return { ...answer, status: 'abstained', reasonCodes: ['validation_failed'], blocks: [], evidence: [], relatedActionIds: [], relatedTaskIds: [], relatedAlertIds: [], conflict: undefined } as AnswerArtifact;
  const revoked = new Set(answer.evidence.filter(e => e.revoked).map(e => e.id));
  if (!revoked.size) return answer;
  const blocks = answer.blocks.filter(b => !b.evidenceIds.some(id => revoked.has(id)));
  const { conflict: _conflict, ...safe } = answer;
  return { ...safe, blocks, evidence: answer.evidence.map(evidenceForDisplay), scopeRedacted: true,
    status: blocks.length ? 'partial' : 'abstained', reasonCodes: ['scope_not_authorized'], relatedActionIds: [], relatedTaskIds: [], relatedAlertIds: [], followUps: [] };
}
export function appendTurn(turns: CopilotTurn[], turn: CopilotTurn) {
  return turns.some(t => t.idempotencyKey === turn.idempotencyKey) ? turns : [...turns, turn];
}
export function runStateForAnswer(status: AnswerStatus): RunState {
  return { answered: 'completed', partial: 'completed_partial', clarification_required: 'awaiting_input', abstained: 'abstained' }[status] as RunState;
}
export function jobStateForRun(state: RunState): CopilotTurn['jobState'] {
  if (['completed', 'completed_partial', 'awaiting_input', 'abstained'].includes(state)) return 'succeeded';
  if (state === 'failed' || state === 'timed_out') return 'failed';
  if (state === 'canceled') return 'canceling';
  return state === 'queued' ? 'queued' : 'running';
}
// Short names people actually type; the full registered name (e.g. with "(ع)") would not match a natural question.
const SITE_ALIASES: Record<string, string[]> = {
  'SITE-TALEGHANI': ['طالقانی'], 'SITE-IMAM-HOSSEIN': ['امام حسین'], 'SITE-SHOHADA': ['شهدا', 'تجریش'], 'SITE-MOFID': ['مفید'], 'SITE-HQ': ['ستاد'],
};
export function answerQuestion(question: string, siteId: string, userPermittedSiteIds: string[], now: string, ctx?: { range?: string; language?: 'fa' | 'en' }): AnswerArtifact {
  const q = normalizeQuestion(question);
  const id = `answer-${hash(siteId + q + now)}`;
  const base: AnswerArtifact = { id, runId: `run-${hash(siteId + q + now)}`, revision: 1, status: 'abstained', reasonCodes: [], blocks: [], limitations: [], evidence: [],
    generatedAt: now, dataAsOf: DATA_AS_OF, followUps: SUGGESTIONS.slice(0, 5), aiAssisted: true, professionalReviewRequired: true, reviewed: false,
    relatedActionIds: [], relatedTaskIds: [], relatedAlertIds: [] };
  const abstain = (reason: ReasonCode, nextStep: string) => ({ ...base, reasonCodes: [reason], nextStep });
  const currentSite = SITES_DATA.find(s => s.id === siteId);
  const currentAliases = [
    currentSite?.name,
    currentSite?.code,
    currentSite?.name.replace(/^بیمارستان |^مرکز تخصصی /, ''),
    currentSite?.id,
    ...(currentSite ? (SITE_ALIASES[currentSite.code] ?? []) : []),
    'فعلی',
    'همین بیمارستان',
    'این بیمارستان',
  ].filter(Boolean).map(n => normalizeQuestion(n!));

  const otherSite = SITES_DATA.some(s => s.id !== siteId && [s.name, s.code, s.name.replace(/^بیمارستان |^مرکز تخصصی /, ''), s.id, ...(SITE_ALIASES[s.code] ?? [])].some(n => q.includes(normalizeQuestion(n))));

  const isOtherHospitalRequested = () => {
    if (otherSite) return true;
    if (/شریعتی|بیمارستان دیگر|دامنه غیرمجاز|همه بیمارستان|بیمارستان های دیگر/.test(q)) return true;
    const hospMatch = q.match(/(?:بیمارستان|مرکز)\s+([^\s؟?,،.]+)/);
    if (hospMatch && hospMatch[1]) {
      const target = normalizeQuestion(hospMatch[1]);
      const isCurrent = currentAliases.some(alias => alias.includes(target) || target.includes(alias));
      if (!isCurrent && target !== 'فعلی' && target !== 'ها' && target !== 'های') {
        return true;
      }
    }
    return false;
  };

  if (!userPermittedSiteIds.includes(siteId) || !SITES_DATA.some(s => s.id === siteId) || isOtherHospitalRequested())
    return abstain('scope_not_authorized', 'این درخواست خارج از دامنه‌ی فعلی شماست؛ سؤال را به بیمارستان فعلی محدود کنید.');
  if (/تایید کن|تأیید کن|ارسال کن|اجرا کن|approve|dispatch/.test(q)) return abstain('unsupported_task', 'کوپایلت اقدام اجرا نمی‌کند؛ برای بررسی مجاز به صف تأییدها بروید.');
  if (/مرخصی|استعلاجی/.test(q)) return abstain('missing_evidence', 'کارشناس منابع انسانی/مالک سیاست را مطلع کنید.');
  const clarify = (reason: ReasonCode) => ({ ...base, status: 'clarification_required' as const, reasonCodes: [reason], clarification: { question: 'کدام شاخص و بازه‌ی زمانی را می‌خواهید بررسی کنید؟', options: ['اشغال تخت امروز', 'موجودی دارو در ۷ روز', 'اشغال تخت در ۳۰ روز'] } });
  if (/رضایت.*غذا|سود ناخالص/.test(q)) return clarify('unsupported_task');
  if (/وضعیت چطوره|مقایسه کن|بدترین/.test(q)) return clarify('ambiguous_request');
  const task = TASKS_DATA.find(t => t.siteId === siteId && t.module === 'OPS');
  const alert = ALERTS_DATA.find(a => a.siteId === siteId && a.module === 'OPS');
  if (!task || !alert) return abstain('missing_evidence', 'مالک داده را مطلع کنید.');
  const evidence = (eid: string, kind: EvidenceKind, title: string, excerpt: string, link: SourceLink): EvidenceItem => ({ id: eid, kind, title, excerpt, version: 'v1', locator: 'بسته شواهد / رکورد نمونه', dataAsOf: DATA_AS_OF, freshness: 'fresh', link });
  if (/اضافه کار|ماموریت|مأموریت/.test(q)) {
    const docs = approvedDocuments(siteId).slice(1);
    const [a, b] = docs;
    if (!a || !b) return abstain('missing_evidence', 'مالک سیاست را مطلع کنید.');
    const ea = { ...evidence(a.id, 'retrieved', a.title, 'نسخه الف: اضافه‌کار نیازمند تأیید پیش از ثبت است (سند نمونه فعال).', { kind: 'task', id: a.taskId }), version: a.version, locator: 'پیوست سیاست الف / بخش تأیید' };
    const eb = { ...evidence(b.id, 'retrieved', b.title, 'نسخه ب: ثبت اضافه‌کار قبل از تأیید مجاز است (سند نمونه فعال).', { kind: 'task', id: b.taskId }), version: b.version, locator: 'پیوست سیاست ب / بخش ثبت' };
    return validateAnswer({ ...base, status: 'partial', reasonCodes: ['conflicting_evidence'], evidence: [ea, eb], blocks: [{ text: 'دو نسخه‌ی فعال درباره‌ی ترتیب ثبت و تأیید متعارض‌اند؛ هیچ سیاست ترکیبی ارائه نمی‌شود.', evidenceIds: [ea.id, eb.id] }], limitations: ['رفع تعارض بر عهده‌ی کمیته‌ی سیاست‌گذاری (نمونه) است.'], conflict: { titleA: a.title, titleB: b.title, linkA: ea.link, linkB: eb.link }, relatedTaskIds: [a.taskId, b.taskId] });
  }
  if (/هپارین|موجودی دارو|سفارش|heparin/.test(q)) {
    const action = ACTIONS_DATA.find(a => a.siteId === siteId && a.title.includes('هپارین'));
    if (!action) return abstain('missing_evidence', 'مسئول داروخانه را مطلع کنید.');
    const e = evidence(action.id, 'retrieved', action.title, `تفاوت سفارش: ${action.diff[0]?.before ?? ''} ← ${action.diff[0]?.after ?? ''}.`, { kind: 'proposal', id: action.id });
    const gain = HEPARIN_AFTER - HEPARIN_BEFORE;
    const calc: EvidenceItem = { ...evidence(`${action.id}-calc`, 'computed', 'اثر تخمینی افزایش سفارش', `${HEPARIN_AFTER.toLocaleString('fa-IR')} − ${HEPARIN_BEFORE.toLocaleString('fa-IR')} = ${gain.toLocaleString('fa-IR')} ویال`, { kind: 'proposal', id: action.id }), metricVersion: 'hep-v1', value: `${gain.toLocaleString('fa-IR')} ویال`, locator: 'نتیجه‌ی محاسبه‌شده' };
    const hyp = evidence(`${action.id}-hyp`, 'hypothesis', 'فرضیه‌ی مرتبط با هشدار', 'کاهش پوشش موجودی ممکن است هم‌زمان با هشدار مرتبط باشد؛ این فرضیه است و رابطه‌ی علّی اثبات نشده است.', { kind: 'alert', id: action.alertId });
    return validateAnswer({ ...base, status: 'partial', reasonCodes: ['source_unavailable'], evidence: [e, calc, hyp],
      blocks: [{ text: e.excerpt, evidenceIds: [e.id] }, { text: `اثر تخمینی بر پوشش موجودی ${gain.toLocaleString('fa-IR')} ویال است (محاسبه‌ی متریک، نه متن مدل).`, evidenceIds: [calc.id] }, { text: hyp.excerpt, evidenceIds: [hyp.id] }],
      limitations: ['داده‌ی مصرف ماهانه‌ی دارو در دسترس نیست'], relatedActionIds: [action.id], relatedTaskIds: [action.taskId], relatedAlertIds: [action.alertId] });
  }
  if (/اشغال|تخت|occupancy/.test(q)) {
    const metric = OCCUPANCY_METRICS.find(m => m.siteId === siteId);
    if (!metric) return abstain('missing_evidence', 'مالک متریک را مطلع کنید.');
    const stale = /هفته.*قبل|کهنه/.test(q);
    const dataAsOf = stale ? '2026-10-12T05:00:00.000Z' : metric.dataAsOf;
    const result = metricResult(metric.numerator, metric.denominator);
    const e: EvidenceItem = { ...evidence(`${siteId}-occ`, 'computed', 'متریک تأییدشده‌ی اشغال کل تخت‌ها (نمونه)', 'متریک کل تخت‌ها است؛ با هشدار اشغال ICU متفاوت است.', { kind: 'task', id: task.id }), numerator: metric.numerator, denominator: metric.denominator, metricVersion: metric.version, dataAsOf, freshness: stale ? 'stale' : 'fresh', locator: 'بسته متریک نمونه / کل تخت‌ها' };
    const packageRecord = taskEvidence(task, alert).find(x => x.kind === 'document');
    const policy = evidence(`${siteId}-cap`, 'retrieved', 'سند نمونه‌ی سیاست ظرفیت', `${packageRecord?.detail ?? task.description}؛ سیاست نمونه: متریک کل تخت‌ها جدا از ICU گزارش می‌شود.`, { kind: 'task', id: task.id });
    const source = alertEvidence(alert).find(x => x.kind === 'record');
    const rec = evidence(`${alert.id}-copilot`, 'retrieved', 'رکورد مرتبط مراقبت ویژه', source?.detail ?? alert.description, { kind: 'alert', id: alert.id });
    const notComputable = result.status === 'not_computable';
    const rangeText = stale ? ' (تاریخ منبع: ۲۰۲۶-۱۰-۱۲)' : (ctx?.range ? ` (بازه: ${ctx.range})` : '');
    return validateAnswer({ ...base, status: stale || notComputable ? 'partial' : 'answered', reasonCodes: stale ? ['source_stale'] : notComputable ? ['missing_evidence'] : [], dataAsOf, evidence: [e, policy, rec],
      blocks: [{ text: result.status === 'not_computable' ? 'اشغال تخت قابل محاسبه نیست (not_computable).' : `اشغال کل تخت‌های بیمارستان فعلی ${result.value.toLocaleString('fa-IR')}٪ است${rangeText}.`, evidenceIds: [e.id, policy.id] }, { text: rec.excerpt, evidenceIds: [rec.id] }], limitations: [...(stale ? ['داده‌ی تازه‌ی گزارش ICU در دسترس نیست؛ این پاسخ فقط بخش تاریخی معتبر را نشان می‌دهد.'] : []), ...(notComputable ? ['مخرج (تخت‌های فعال) صفر است؛ اشغال تخت قابل محاسبه نیست و ۰٪ فرض نمی‌شود.'] : []), ...(ctx?.language === 'en' ? ['ترجمه‌ی انگلیسی پاسخ در نسخه‌ی نمونه ارائه نمی‌شود؛ متن پاسخ فارسی است.'] : [])], relatedTaskIds: [task.id], relatedAlertIds: [alert.id] });
  }
  if (/سیاست|policy/.test(q)) return abstain('missing_evidence', 'مالک سیاست را مطلع کنید.');
  return abstain('unsupported_task', 'یکی از پرسش‌های پشتیبانی‌شده درباره‌ی اشغال تخت یا موجودی دارو را انتخاب کنید.');
}
