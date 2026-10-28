import type { WorkAlert, WorkTask } from './workData';

export type EvidenceKind = 'metric' | 'record' | 'document' | 'log';
export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  source: string;
  capturedAt: string;
  detail: string;
  hash: string;
  sourceVersion?: string | null;
  metricVersion?: string | null;
  ruleVersion?: string | null;
  snapshotCutoff?: string | null;
  sourceEventAt?: string | null;
  ingestedAt?: string | null;
  assumptions?: string | null;
  limitations?: string | null;
}

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  metric: 'شاخص', record: 'رکورد سامانه', document: 'سند', log: 'گزارش رخداد',
};

const hashOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
};

/** Sample evidence package for an alert; same alert always yields the same items. */
export function alertEvidence(a: WorkAlert): EvidenceItem[] {
  const items: Omit<EvidenceItem, 'hash'>[] = [];
  if (a.metric) items.push({ id: `${a.id}-m`, kind: 'metric', title: `اندازه‌گیری ${a.metric.label}`, source: a.source, capturedAt: a.raisedAt, detail: `مقدار ${a.metric.value} در برابر آستانه ${a.metric.threshold}${a.module==='FIN'?' · نوع نرخ (تعداد پرونده ردشده یا مبلغ کسورات): نامشخص در داده نمایشی؛ صورت، مخرج، جامعه پرونده‌های رسیدگی‌شده و موارد مستثنا ارائه نشده‌اند. این شاهد برای نتیجه‌گیری درباره نرخ قابل اتکا نیست.':''}` });
  items.push({ id: `${a.id}-r`, kind: 'record', title: 'رکورد خام دریافتی از منبع', source: a.source, capturedAt: a.raisedAt, detail: a.description });
  items.push({ id: `${a.id}-l`, kind: 'log', title: 'گزارش موتور قواعد هشدار', source: 'HIM-OS Rules Engine', capturedAt: a.raisedAt, detail: `قاعده هشدار ${a.code} فعال شد و رخداد ثبت گردید.` });
  // Only this named alert has a dedicated synthetic provenance fixture. Never infer metadata from capturedAt.
  const sample = a.code==='ALR-1050'?{
    sourceVersion:'fixture-contract-bed-v1 [SYNTHETIC]',metricVersion:'bed-capacity-count@demo-1',
    ruleVersion:'capacity-threshold@demo-2',snapshotCutoff:'2026-10-23T23:59:59+03:30',
    sourceEventAt:'2026-10-23T23:58:00+03:30',ingestedAt:'2026-10-23T23:58:09+03:30',
    assumptions:'فیکسچر آزمایشی: همه مقادیر و زمان‌ها غیرعملیاتی هستند؛ خط پایه ۷ مقدار مرجع ساختگی در synthetic-reference-window@demo-1 است. نه مدل مصوب.',
    limitations:'فقط آزمایش رابط؛ شناسه قرارداد و زمان‌ها از منبع واقعی دریافت نشده‌اند.'
  }:a.code==='ALR-1001'?{
    sourceVersion:'inventory-connector-mock@1 (فیکسچر، نه قرارداد مصوب)',
    metricVersion:'inventory-on-hand-demo@1',ruleVersion:'stock-threshold-demo@1',
    snapshotCutoff:'2026-10-14T07:35:00+03:30 [SYNTHETIC ONLY]',sourceEventAt:'2026-10-14T07:30:00+03:30 [SYNTHETIC ONLY]',ingestedAt:'2026-10-14T07:32:00+03:30 [SYNTHETIC ONLY]',
    assumptions:'آستانه ۳۰۰ ویال و موجودی ۱۲۰ ویال داده نمایشی هستند؛ این مقادیر از انبار واقعی خوانده نشده‌اند.',
    limitations:'زمان‌های cutoff/رخداد/دریافت فقط سناریوی ساختگی جدیدند و در داده اولیه گزارش نشده‌اند. نسخه‌ها شناسه فیکسچر هستند، نه منشأ واقعی یا رکورد ممیزی.'
  }:{};
  return items.map(i => ({ ...i,...sample, hash: hashOf(i.id + i.detail) }));
}

/** Evidence for a task: its own records plus the linked alert's package. */
export function taskEvidence(t: WorkTask, alert?: WorkAlert): EvidenceItem[] {
  const own: Omit<EvidenceItem, 'hash'>[] = [
    { id: `${t.id}-d`, kind: 'document', title: t.title.includes('سیاست') ? t.title : 'فرم ثبت وظیفه', source: 'کارتابل HIM-OS', capturedAt: t.history[0]?.at ?? t.dueDate, detail: t.description },
    ...t.history.map((h, i) => ({ id: `${t.id}-h${i}`, kind: 'log' as const, title: 'رخداد تاریخچه وظیفه', source: 'کارتابل HIM-OS', capturedAt: h.at, detail: h.text })),
  ];
  return [...own.map(i => ({ ...i, hash: hashOf(i.id + i.detail) })), ...(alert ? alertEvidence(alert) : [])];
}
