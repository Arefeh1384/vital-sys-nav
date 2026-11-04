import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {useApp} from '../context/AppContext';
import {DEMO_USERS} from '../data/mockData';
import type {Memo} from './store';

/**
 * Decision-memo content review and export (REQ-EXE-006, REQ-AIM-010).
 * A memo is advisory (T1): review approves the content of one pinned revision only;
 * nothing is executed. Records are browser-local demo data.
 */
export type MemoReview = {id: string; memoId: string; revision: number; siteId: string; state: 'submitted' | 'approved' | 'changes_requested';
  submittedBy: string; submittedByName: string; submittedAt: string; reviewerId: string; reviewerName: string; decidedAt?: string; reason?: string};

const KEY = 'him.phase6.memo-reviews.v1';
export function readMemoReviews(): MemoReview[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? (raw as MemoReview[]) : [];
  } catch {
    return [];
  }
}
function writeMemoReviews(rows: MemoReview[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

const today = () => new Date().toISOString().slice(0, 10);
/** Fields a memo needs before it can go to content review or be exported as final. */
export function memoMissingFields(m: Memo): string[] {
  const missing: string[] = [];
  if (!m.title.trim()) missing.push('عنوان');
  if (!m.problem.trim()) missing.push('شرح مسئله');
  if (!m.evidence.length) missing.push('شواهد پشتیبان');
  if (!m.alternatives.length) missing.push('گزینه‌ها');
  if (!m.recommendation.trim()) missing.push('پیشنهاد نهایی');
  if (!m.assumptions.trim()) missing.push('فرض‌ها');
  if (!m.uncertainty.trim()) missing.push('عدم قطعیت');
  if (!m.dataLimitations.trim()) missing.push('محدودیت داده');
  if (!m.clinicalLimitations.trim()) missing.push('محدودیت عملیاتی/بالینی');
  if (!m.owner.trim()) missing.push('مسئول پیگیری');
  if (!m.dueDate) missing.push('موعد پیشنهادی');
  else if (m.dueDate < today()) missing.push('موعد پیشنهادی معتبر (امروز یا آینده)');
  if (!m.followup.trim()) missing.push('پیگیری');
  return missing;
}

/** Plain-text export with the provenance a reader needs to reproduce what was decided on. */
export function memoExportText(m: Memo, review: MemoReview | undefined) {
  const approved = review?.state === 'approved' && review.revision === m.revision;
  return [
    `یادداشت تصمیم — ${approved ? 'محتوای بازبینی‌شده (مشورتی؛ بدون اجرای اقدام)' : 'پیش‌نویس بازبینی‌نشده'}`,
    `شناسه: ${m.id} · نسخه ${m.revision} · بیمارستان: ${m.siteName}`,
    `ایجادکننده: ${m.creator} · ایجاد: ${m.createdAt} · آخرین ویرایش: ${m.updatedAt}`,
    `پاسخ مبنا: ${m.answerId ?? '—'}${m.answerRevision ? ` (نسخه ${m.answerRevision})` : ''} · بازه: ${m.range ?? '—'}`,
    `عنوان: ${m.title}`, `شرح مسئله:\n${m.problem}`,
    `گزینه‌ها:\n${m.alternatives.map(a => `- ${a.title}: ${a.description}`).join('\n') || '—'}`,
    `پیشنهاد نهایی:\n${m.recommendation || '—'}`, `فرض‌ها: ${m.assumptions || '—'}`, `عدم قطعیت: ${m.uncertainty || '—'}`,
    `محدودیت داده: ${m.dataLimitations || '—'}`, `محدودیت عملیاتی/بالینی: ${m.clinicalLimitations || '—'}`,
    `مسئول پیگیری: ${m.owner || '—'} · موعد: ${m.dueDate || '—'} · شاخص پیگیری: ${m.followupMetric || '—'}`, `پیگیری: ${m.followup || '—'}`,
    `شواهد:\n${m.evidence.map(e => `- ${e.id} | ${e.title} | ${e.version} | ${e.locator} | as-of ${e.dataAsOf}`).join('\n') || '—'}`,
    `بازبینی محتوا: ${review ? `${review.state} · نسخه ${review.revision} · بازبین ${review.reviewerName}${review.decidedAt ? ` · ${review.decidedAt}` : ''}${review.reason ? ` · ${review.reason}` : ''}` : 'ارسال نشده'}`,
    `زمان خروجی: ${new Date().toISOString()}`,
    'تولیدشده با کمک هوش مصنوعی — داده نمونه؛ جایگزین تصمیم و بازبینی حرفه‌ای نیست.',
  ].join('\n\n');
}

const STATE_LABEL: Record<MemoReview['state'], string> = {submitted: 'در انتظار بازبینی محتوا', approved: 'محتوا تأیید شد', changes_requested: 'نیازمند اصلاح'};

export function MemoReviewPanel({memo}: {memo: Memo}) {
  const {user, scope, showNotification} = useApp();
  const [tick, setTick] = useState(0);
  const [reviewer, setReviewer] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  void tick;
  const all = readMemoReviews().filter(r => r.memoId === memo.id);
  const latest = all.at(-1);
  const current = latest && latest.revision === memo.revision ? latest : undefined;
  const missing = memoMissingFields(memo);
  const reviewers = DEMO_USERS.filter(u => u.id !== user?.id && u.permittedSiteIds.includes(memo.siteId));
  const canExport = !!user && user.role !== 'data_steward';
  const save = (rows: MemoReview[]) => { writeMemoReviews(rows); setTick(t => t + 1); };

  const submit = () => {
    if (missing.length) { setError(`برای ارسال به بازبینی این موارد را تکمیل کنید: ${missing.join('، ')}`); return; }
    const r = DEMO_USERS.find(u => u.id === reviewer);
    if (!r || r.id === user?.id) { setError('بازبین مستقل (غیر از نویسنده) را انتخاب کنید.'); return; }
    setError('');
    save([...readMemoReviews(), {id: `MRV-${Date.now().toString(36)}`, memoId: memo.id, revision: memo.revision, siteId: memo.siteId, state: 'submitted',
      submittedBy: user!.id, submittedByName: user!.name, submittedAt: new Date().toISOString(), reviewerId: r.id, reviewerName: r.name}]);
    showNotification('یادداشت برای بازبینی محتوا ارسال شد.');
  };
  const decide = (state: 'approved' | 'changes_requested') => {
    if (!current || current.state !== 'submitted' || current.reviewerId !== user?.id) return;
    if (state === 'changes_requested' && reason.trim().length < 10) { setError('دلیل درخواست اصلاح دست‌کم ۱۰ نویسه باشد.'); return; }
    setError('');
    save(readMemoReviews().map(r => r.id === current.id ? {...r, state, decidedAt: new Date().toISOString(), reason: reason.trim() || undefined} : r));
    setReason('');
    showNotification(state === 'approved' ? 'محتوای یادداشت تأیید شد؛ هیچ اقدامی اجرا نشد.' : 'درخواست اصلاح ثبت شد.');
  };
  const exportMemo = () => {
    if (!canExport) return;
    const url = URL.createObjectURL(new Blob([memoExportText(memo, current)], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url; a.download = `${memo.id}-r${memo.revision}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="rounded-xl border bg-white p-4 space-y-3 text-sm" data-testid="memo-review" aria-labelledby="memo-review-title">
    <h2 id="memo-review-title" className="font-bold">بازبینی محتوا و خروجی یادداشت</h2>
    <p className="text-xs text-slate-600">بازبینی فقط محتوای همین نسخه را تأیید می‌کند و هیچ اقدامی اجرا نمی‌شود. ویرایش بعدی، تأیید را باطل می‌کند.</p>
    {missing.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-amber-900" data-testid="memo-missing">موارد ناقص برای بازبینی: {missing.join('، ')}</p>}
    {latest && <p data-testid="memo-review-state" className={`rounded-lg p-3 ${current ? 'bg-slate-50' : 'bg-amber-50 text-amber-900'}`}>
      {current ? `${STATE_LABEL[current.state]} · نسخه ${current.revision} · بازبین: ${current.reviewerName}${current.reason ? ` · دلیل: ${current.reason}` : ''}`
        : `آخرین بازبینی (${STATE_LABEL[latest.state]}) مربوط به نسخه ${latest.revision} است؛ نسخه جاری ${memo.revision} باید دوباره بازبینی شود.`}
    </p>}
    {(!current || current.state === 'changes_requested') && memo.creator === user?.name && <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">بازبین مستقل<select className="mt-1 block rounded-md border p-2" value={reviewer} onChange={e => setReviewer(e.target.value)}>
        <option value="">انتخاب بازبین</option>{reviewers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      <Button onClick={submit}>ارسال برای بازبینی محتوا</Button>
    </div>}
    {current?.state === 'submitted' && current.reviewerId === user?.id && <div className="space-y-2">
      <textarea aria-label="دلیل یا توضیح بازبینی" className="w-full rounded-md border p-2" value={reason} onChange={e => setReason(e.target.value)} placeholder="توضیح بازبینی (برای درخواست اصلاح الزامی)"/>
      <div className="flex flex-wrap gap-2"><Button onClick={() => decide('approved')}>تأیید محتوا</Button><Button variant="outline" onClick={() => decide('changes_requested')}>درخواست اصلاح</Button></div>
    </div>}
    {current?.state === 'submitted' && current.reviewerId !== user?.id && <p className="text-xs text-slate-500">فقط {current.reviewerName} می‌تواند این نسخه را بازبینی کند.</p>}
    <div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={!canExport} onClick={exportMemo} data-testid="memo-export">خروجی یادداشت (txt)</Button>
      <span className="text-xs text-slate-500">{!canExport ? 'نقش فقط‌خواندنی مجوز خروجی ندارد.' : current?.state === 'approved' ? 'خروجی با برچسب «محتوای بازبینی‌شده»' : 'خروجی با برچسب «پیش‌نویس بازبینی‌نشده»'}</span></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {scope.siteId !== memo.siteId && <p className="text-xs text-red-700">این یادداشت به بیمارستان دیگری تعلق دارد.</p>}
  </section>;
}
