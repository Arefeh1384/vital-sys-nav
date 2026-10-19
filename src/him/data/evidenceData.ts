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
  if (a.metric) items.push({ id: `${a.id}-m`, kind: 'metric', title: `اندازه‌گیری ${a.metric.label}`, source: a.source, capturedAt: a.raisedAt, detail: `مقدار ${a.metric.value} در برابر آستانه ${a.metric.threshold}` });
  items.push({ id: `${a.id}-r`, kind: 'record', title: 'رکورد خام دریافتی از منبع', source: a.source, capturedAt: a.raisedAt, detail: a.description });
  items.push({ id: `${a.id}-l`, kind: 'log', title: 'گزارش موتور قواعد هشدار', source: 'HIM-OS Rules Engine', capturedAt: a.raisedAt, detail: `قاعده هشدار ${a.code} فعال شد و رخداد ثبت گردید.` });
  return items.map(i => ({ ...i, hash: hashOf(i.id + i.detail) }));
}

/** Evidence for a task: its own records plus the linked alert's package. */
export function taskEvidence(t: WorkTask, alert?: WorkAlert): EvidenceItem[] {
  const own: Omit<EvidenceItem, 'hash'>[] = [
    { id: `${t.id}-d`, kind: 'document', title: t.title.includes('سیاست') ? t.title : 'فرم ثبت وظیفه', source: 'کارتابل HIM-OS', capturedAt: t.history[0]?.at ?? t.dueDate, detail: t.description },
    ...t.history.map((h, i) => ({ id: `${t.id}-h${i}`, kind: 'log' as const, title: 'رخداد تاریخچه وظیفه', source: 'کارتابل HIM-OS', capturedAt: h.at, detail: h.text })),
  ];
  return [...own.map(i => ({ ...i, hash: hashOf(i.id + i.detail) })), ...(alert ? alertEvidence(alert) : [])];
}
