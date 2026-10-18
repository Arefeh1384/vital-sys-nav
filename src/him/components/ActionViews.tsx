import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, ClipboardCheck, History, Search, ShieldCheck, AlertTriangle, GitCompareArrows, Send, CheckCircle2, FileSearch, Clock, CheckCheck, HelpCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '../context/AppContext';
import { ACTION_STATUS_LABEL, MIN_REASON_LENGTH, TIER_LABEL, approvalError, cancelError, dispatchError, canOperateActions, requiredApprovals, type ActionTier, formatEventTime, minutesUntil, manualVerificationError, scopedActions, type ActionStatus, type ActionProposal } from '../data/actionData';

const statusClass: Record<ActionStatus, string> = {
  proposed: 'bg-muted text-muted-foreground', approved: 'bg-action-success/10 text-action-success',
  sent: 'bg-action-info/10 text-action-info', uncertain: 'bg-action-warning/10 text-action-warning', finalized: 'bg-action-success/10 text-action-success', canceled: 'bg-muted text-muted-foreground line-through',
};
const statusIcon: Record<ActionStatus, typeof Clock> = { proposed: Clock, approved: CheckCircle2, sent: Send, uncertain: HelpCircle, finalized: CheckCheck, canceled: Ban };
function Status({ status }: { status: ActionStatus }) {
  const Icon = statusIcon[status];
  return <span data-status={status} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${statusClass[status]}`}><Icon className="size-3.5 shrink-0" aria-hidden data-testid="status-icon" />{ACTION_STATUS_LABEL[status]}</span>;
}
function Heading({ title, journal = false }: { title: string; journal?: boolean }) {
  const { scope } = useApp();
  const Icon = journal ? History : ClipboardCheck;
  return <>
    <div role="note" data-testid="mock-banner" className="mb-4 flex items-start gap-2 rounded-md border border-action-warning/40 bg-action-warning/10 px-3 py-2 text-xs leading-6 text-foreground"><AlertTriangle className="mt-1 size-4 shrink-0 text-action-warning" aria-hidden /><p><strong>داده نمونه (Mock):</strong> همه‌ی پیشنهادها، تأییدها و ارسال‌ها فقط نمایشی‌اند و هیچ فرمانی به سامانه‌ی واقعی بیمارستان ارسال نمی‌شود.</p></div>
    <header className="mb-6 flex items-start gap-3"><Icon className="mt-1 size-6 text-action-brand shrink-0" /><div className="min-w-0"><h1 className="text-xl font-bold text-foreground">{title}</h1><p className="mt-1 text-xs text-muted-foreground">{scope.siteName} · داده و عملیات نمونه</p></div></header>
  </>;
}
function JournalEntries({ action }: { action: ActionProposal }) {
  return <ol className="border-r border-border mr-2 space-y-5 py-2">{action.history.map((event, i) => {
    const time = formatEventTime(event.at);
    return <li key={`${i}-${event.at}`} className="relative pr-6" data-testid="journal-event"><span className="absolute -right-1.5 top-2 size-3 rounded-full bg-action-brand border-2 border-background" />
      <div className="flex flex-wrap items-center gap-2">
        {event.from ? <><Status status={event.from} /><ArrowLeft className="size-3 text-muted-foreground" aria-label="به" /></> : <span className="text-xs text-muted-foreground">آغاز ←</span>}
        <Status status={event.status} />
      </div>
      <p className="mt-2 text-sm leading-6">{event.note}</p>
      <p className="mt-1 text-xs text-muted-foreground">{event.actor}</p>
      <p className="mt-1 text-xs text-muted-foreground"><time dateTime={event.at}>{time.tehran}</time> <span>(Asia/Tehran)</span> · <bdi dir="ltr" className="font-mono">{time.utc}</bdi></p>
      {event.opKey && <p className="mt-1 text-xs text-muted-foreground">کلید عملیات: <bdi dir="ltr" className="font-mono break-all">{event.opKey}</bdi></p>}
    </li>;
  })}</ol>;
}
function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const m = minutesUntil(iso, now);
  if (m <= 0) return <span className="font-semibold text-action-warning">منقضی‌شده</span>;
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return <span>{d.toLocaleString('fa-IR')} روز و {h.toLocaleString('fa-IR')} ساعت مانده</span>;
  return <span>{h > 0 ? `${h.toLocaleString('fa-IR')} ساعت و ` : ''}{(m % 60).toLocaleString('fa-IR')} دقیقه مانده</span>;
}

export function ActionProposalListView() {
  const { actions, scope, openWorkView } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ActionStatus | 'all'>('all');
  const [tier, setTier] = useState<ActionTier | 'all'>('all');
  const [expiry, setExpiry] = useState<'all' | 'soon' | 'later' | 'expired'>('all');
  const matchesExpiry = (a: ActionProposal) => { const m = minutesUntil(a.expiresAtIso); return expiry === 'all' || (expiry === 'expired' && m <= 0) || (expiry === 'soon' && m > 0 && m <= 1440) || (expiry === 'later' && m > 1440); };
  const rows = scopedActions(actions, scope.siteId).filter(a => (status === 'all' || a.status === status) && (tier === 'all' || a.tier === tier) && matchesExpiry(a) && (!q.trim() || `${a.title} ${a.code}`.toLowerCase().includes(q.trim().toLowerCase())));
  const reset = () => { setQ(''); setStatus('all'); setTier('all'); setExpiry('all'); };
  const selectClass = 'h-10 rounded-md border border-input bg-background px-2 text-sm';
  return <div data-testid="action-list"><Heading title="فهرست پیشنهادهای اقدام" />
    <div className="flex flex-wrap gap-1 mb-3">{(['all', ...Object.keys(ACTION_STATUS_LABEL)] as (ActionStatus | 'all')[]).map(s => <Button size="sm" variant={status === s ? 'secondary' : 'ghost'} className={status === s ? 'text-action-brand' : ''} aria-pressed={status === s} key={s} onClick={() => setStatus(s)}>{s === 'all' ? 'همه' : ACTION_STATUS_LABEL[s]}</Button>)}</div>
    <div className="flex flex-col md:flex-row gap-3 mb-5">
      <div className="relative w-full md:w-64 shrink-0"><Search className="absolute right-3 top-3 size-4 text-muted-foreground" /><input aria-label="جستجوی پیشنهاد اقدام" placeholder="جستجو در عنوان یا کد…" dir="rtl" value={q} onChange={e => setQ(e.target.value)} className="w-full text-right border border-input bg-background rounded-md pr-9 pl-3 h-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <select aria-label="فیلتر سطح تأیید" value={tier} onChange={e => setTier(e.target.value as ActionTier | 'all')} className={selectClass}><option value="all">همه سطح‌ها</option>{(Object.keys(TIER_LABEL) as ActionTier[]).map(t => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</select>
      <select aria-label="فیلتر انقضا" value={expiry} onChange={e => setExpiry(e.target.value as typeof expiry)} className={selectClass}><option value="all">همه مهلت‌ها</option><option value="soon">انقضا تا ۲۴ ساعت</option><option value="later">بیش از ۲۴ ساعت</option><option value="expired">منقضی‌شده</option></select>
    </div>
    {rows.length ? <div className="border-y border-border" role="table" aria-label="فهرست پیشنهادهای اقدام">
      <div role="row" className="hidden md:grid grid-cols-[7rem_minmax(0,1fr)_9rem_7rem_8rem_9rem_1.5rem] gap-3 px-2 py-2 text-xs text-muted-foreground bg-muted"><span role="columnheader">کد</span><span role="columnheader">عنوان</span><span role="columnheader">سطح</span><span role="columnheader">وضعیت</span><span role="columnheader">سازنده</span><span role="columnheader">انقضا</span><span /></div>
      <div className="divide-y divide-border">{rows.map(a => <Button key={a.id} role="row" variant="ghost" onClick={() => openWorkView({ kind: 'proposal', id: a.id })} className="w-full h-auto min-h-16 rounded-none px-2 py-3 text-right whitespace-normal md:grid md:grid-cols-[7rem_minmax(0,1fr)_9rem_7rem_8rem_9rem_1.5rem] md:gap-3 flex flex-wrap items-center justify-between gap-2 font-normal">
        <bdi dir="ltr" className="text-xs font-mono text-muted-foreground text-right">{a.code}</bdi>
        <span className="text-sm font-bold min-w-0">{a.title}</span>
        <span className="text-xs">{TIER_LABEL[a.tier]}</span>
        <span><Status status={a.status} /></span>
        <span className="text-xs text-muted-foreground">{a.creatorName}</span>
        <span className="text-xs text-muted-foreground"><ExpiryText iso={a.expiresAtIso} /></span>
        <ArrowLeft className="hidden md:block" />
      </Button>)}</div></div> : <div className="py-12 text-center"><p className="text-muted-foreground">پیشنهادی مطابق جستجو و فیلترها یافت نشد.</p><Button className="mt-4" variant="outline" onClick={reset}>پاک‌کردن جستجو و فیلترها</Button></div>}
  </div>;
}
function ExpiryText({ iso }: { iso: string }) {
  const m = minutesUntil(iso);
  if (m <= 0) return <span className="text-action-warning font-semibold">منقضی‌شده</span>;
  const d = Math.floor(m / 1440);
  return <span>{d > 0 ? `${d.toLocaleString('fa-IR')} روز مانده` : `${Math.floor(m / 60).toLocaleString('fa-IR')} ساعت مانده`}</span>;
}

const STEP_UP_SAMPLE_CODE = '123456';
function ApprovalDialog({ action, open, onOpenChange }: { action: ActionProposal; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { runActionCommand, user, scope } = useApp();
  const [reviewed, setReviewed] = useState(false);
  const [step, setStep] = useState<'summary' | 'stepup'>('summary');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const reset = () => { setReviewed(false); setStep('summary'); setCode(''); setCodeError(null); };
  const change = (o: boolean) => { if (!o) reset(); onOpenChange(o); };
  const confirm = () => {
    if (code.trim() !== STEP_UP_SAMPLE_CODE) { setCodeError('کد تأیید هویت نادرست است.'); return; }
    // Re-check at commit time: scope, creator and role rules are enforced by the command itself.
    runActionCommand(action.id, { kind: 'approve' });
    change(false);
  };
  const blocked = approvalError(action, user, scope.siteId);
  return <Dialog open={open} onOpenChange={change}>
    <DialogContent dir="rtl" data-testid="approval-dialog" className="max-w-lg text-right">
      <DialogHeader className="text-right sm:text-right">
        <DialogTitle>تأیید پیشنهاد اقدام</DialogTitle>
        <DialogDescription><bdi dir="ltr">{action.code}</bdi> · {action.title}</DialogDescription>
      </DialogHeader>
      {step === 'summary' ? <div className="space-y-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" data-testid="approval-summary">
          <dt className="text-muted-foreground">مقصد</dt><dd><bdi dir="auto">{action.target}</bdi></dd>
          {action.diff.map(d => <div key={d.field} className="contents"><dt className="text-muted-foreground">{d.field}</dt><dd>{d.before} ← <strong>{d.after}</strong></dd></div>)}
          <dt className="text-muted-foreground">ویرایش</dt><dd>{action.revision.toLocaleString('fa-IR')}</dd>
          <dt className="text-muted-foreground">انقضای تأیید</dt><dd>{action.expiresAt}</dd>
          <dt className="text-muted-foreground">سازنده</dt><dd>{action.creatorName}</dd>
        </dl>
        <p className="text-xs leading-6 text-muted-foreground">{action.risk}</p>
        {blocked && <p role="status" className="text-sm text-action-warning">{blocked}</p>}
        <label className="flex gap-2 text-sm leading-6"><input type="checkbox" checked={reviewed} disabled={!!blocked} onChange={e => setReviewed(e.target.checked)} className="mt-1 accent-action-brand shrink-0" />تغییرات را مرور کردم</label>
      </div> : <div className="space-y-3">
        <p className="text-sm leading-6">برای ثبت تأیید، هویت خود را دوباره تأیید کنید (Step-up). این کد نمونه است: <bdi dir="ltr" className="font-mono">{STEP_UP_SAMPLE_CODE}</bdi></p>
        <label className="block text-xs">کد تأیید هویت<input inputMode="numeric" dir="ltr" autoFocus value={code} onChange={e => { setCode(e.target.value); setCodeError(null); }} className="mt-2 block w-full border border-input bg-background rounded-md p-2 text-sm font-mono" /></label>
        {codeError && <p role="alert" className="text-sm text-action-warning">{codeError}</p>}
      </div>}
      <DialogFooter className="gap-2 sm:justify-start">
        {step === 'summary'
          ? <Button disabled={!reviewed || !!blocked} onClick={() => setStep('stepup')}>ادامه به تأیید هویت</Button>
          : <Button className="bg-action-brand text-action-brand-foreground hover:bg-action-brand/90" disabled={!code.trim()} onClick={confirm}><ShieldCheck />ثبت تأیید</Button>}
        <Button variant="outline" onClick={() => change(false)}>انصراف</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function ApprovalPanel({ action }: { action: ActionProposal }) {
  const { user, scope, runActionCommand } = useApp();
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [escNote, setEscNote] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [outcome, setOutcome] = useState<'confirmed' | 'failed_confirmed' | 'not_found' | 'pending'>('pending');
  const error = approvalError(action, user, scope.siteId);
  const canOperate = canOperateActions(user);
  const cancelAllowed = !cancelError(action, user, 'x'.repeat(MIN_REASON_LENGTH));
  const reconcile = action.status === 'uncertain' || action.status === 'sent';
  const manualError = manualVerificationError(action, user);
  return <aside className="border-t lg:border-t-0 lg:border-r border-border pt-6 lg:pt-0 lg:pr-6 space-y-5 min-w-0" data-testid="approval-panel">
    <h2 className="text-base font-bold flex items-center gap-2"><ShieldCheck className="size-5 text-action-brand" />پنل تأیید</h2>
    <dl className="space-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">وضعیت</dt><dd className="mt-1"><Status status={action.status} /></dd></div><div><dt className="text-xs text-muted-foreground">سازنده پیشنهاد</dt><dd className="mt-1">{action.creatorName}</dd></div><div><dt className="text-xs text-muted-foreground">کاربر فعلی (شما)</dt><dd className="mt-1">{user?.name ?? '—'}</dd></div>{(action.approvals?.length ?? 0) > 0 && <div data-testid="approvers"><dt className="text-xs text-muted-foreground">تأییدکنندگان ({(action.approvals?.length ?? 0).toLocaleString('fa-IR')} از {requiredApprovals(action.tier).toLocaleString('fa-IR')})</dt><dd className="mt-1">{action.approvals.map(a => a.name).join('، ')}</dd></div>}<div><dt className="text-xs text-muted-foreground">مقصد</dt><dd className="mt-1"><bdi dir="auto">{action.target}</bdi></dd></div></dl>
    {action.status === 'proposed' && <div className="space-y-3">{error && <p role="status" className="text-sm text-action-warning leading-6">{error}</p>}<Button className="w-full bg-action-brand text-action-brand-foreground hover:bg-action-brand/90" disabled={!!error} onClick={() => setApproveOpen(true)}><ShieldCheck />تأیید پیشنهاد اقدام</Button><p className="text-xs text-muted-foreground leading-6">انقضای تأیید: {action.expiresAt}</p>{requiredApprovals(action.tier) > 1 && <p className="text-xs text-muted-foreground leading-6" data-testid="approval-progress">{TIER_LABEL[action.tier]} · تأییدهای ثبت‌شده: {(action.approvals?.length ?? 0).toLocaleString('fa-IR')} از {requiredApprovals(action.tier).toLocaleString('fa-IR')}</p>}<ApprovalDialog action={action} open={approveOpen} onOpenChange={setApproveOpen} /></div>}
    {action.status === 'approved' && <div className="space-y-3"><p className="text-sm text-action-success">{requiredApprovals(action.tier) > 1 ? `هر ${requiredApprovals(action.tier).toLocaleString('fa-IR')} تأیید مستقل ثبت شده است.` : 'تأیید مستقل ثبت شده است.'}</p>{dispatchError(action) && <p role="status" className="text-xs leading-6 text-action-warning" data-testid="dispatch-blocked">{dispatchError(action)}</p>}{canOperate ? <Button className="w-full" disabled={!!dispatchError(action)} onClick={() => runActionCommand(action.id, { kind: 'send' })}><Send />ثبت ارسال نمونه</Button> : <p role="status" className="text-xs leading-6 text-muted-foreground" data-testid="read-only-note">نقش فعلی شما فقط‌خواندنی است؛ ارسال، تطبیق و ارجاع برای این نقش مجاز نیست.</p>}</div>}
    {action.dispatchKey && <div className="text-xs text-muted-foreground"><p>شناسه یکتای ارسال</p><bdi dir="ltr" className="block mt-1 break-all font-mono">{action.dispatchKey}</bdi></div>}
    {reconcile && <div className="space-y-4 border-t border-border pt-4" data-testid="reconciliation-panel">
      <h3 className="text-sm font-bold flex items-center gap-2"><FileSearch className="size-4" />تطبیق نتیجه مقصد (Reconciliation)</h3>
      {action.status === 'uncertain' && <p className="text-sm leading-6 font-bold text-action-warning" data-testid="uncertain-warning">هشدار: نتیجه ارسال نامشخص است و ممکن است اقدام پیش‌تر در مقصد اجرا یا پذیرفته شده باشد. نبود پاسخ قطعی به معنای شکست نیست. تلاش مجدد یا ارسال دوباره مسدود است تا رکورد مقصد با شناسه یکتای ارسال تطبیق داده شود.</p>}
      <p className="text-xs leading-6 text-muted-foreground">مرجع بررسی: {action.target} · رکورد مقصد یا گزارش دریافت</p>
      {canOperate ? <>
      <label className="block text-xs">مرجع رکورد یا گزارش مقصد<input className="block mt-2 w-full border border-input bg-background rounded-md p-2 text-sm" dir="auto" value={reference} onChange={e => setReference(e.target.value)} /></label>
      <label className="block text-xs">نتیجه تطبیق<select value={outcome} onChange={e => setOutcome(e.target.value as typeof outcome)} className="mt-2 block w-full bg-background border border-input rounded-md p-2 text-sm"><option value="pending">هنوز نامشخص؛ ادامه بررسی</option><option value="confirmed">موفق: اجرای اقدام در مقصد تأیید شد</option><option value="failed_confirmed">شکست تأییدشده: عدم اجرا با شواهد قطعی ثبت شد</option><option value="not_found">رکورد اجرا در مقصد یافت نشد</option></select></label>
      <label className="block text-xs">شرح بررسی<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-2 w-full border border-input bg-background rounded-md p-2 text-sm" /></label>
      <Button className="w-full" variant="outline" disabled={!canOperate || !reference.trim() || !note.trim()} onClick={() => runActionCommand(action.id, { kind: 'reconcile', result: { reference, note, outcome } })}><FileSearch />ثبت نتیجه تطبیق</Button>
      {action.status === 'sent' && <Button variant="ghost" className="w-full text-action-warning" disabled={!canOperate} onClick={() => runActionCommand(action.id, { kind: 'uncertain' })}><AlertTriangle />ثبت نبود پاسخ قطعی</Button>}
      {action.status === 'uncertain' && !action.escalatedTo && <div className="space-y-2 border-t border-border pt-4" data-testid="escalation-panel">
        <p className="text-xs leading-6 text-muted-foreground">اگر رکورد مقصد پیدا نشد، این به معنای شکست قطعی نیست. اقدام را برای بررسی دستی ارجاع بده. لغو و ارسال مجدد در این حالت مجاز نیست.</p>
        <textarea aria-label="دلیل ارجاع" value={escNote} onChange={e => setEscNote(e.target.value)} rows={2} placeholder="دلیل ارجاع" className="w-full border border-input bg-background rounded-md p-2 text-sm" />
        <Button className="w-full" variant="outline" disabled={!canOperate || !escNote.trim()} onClick={() => runActionCommand(action.id, { kind: 'escalate', note: escNote })}><AlertTriangle />ارجاع به مسئول کنترل</Button></div>}
      {action.status === 'uncertain' && action.escalatedTo && <div className="space-y-2 border-t border-border pt-4" data-testid="manual-panel">
        <p className="text-xs leading-6 text-action-warning">ارجاع‌شده به {action.escalatedTo}. اگر اجرا به‌صورت دستی تأیید شد، ثبت کن (این با «تأیید خودکار منبع» متفاوت است). برای جبران، پیشنهاد اقدام جدید بساز.</p>
        <input aria-label="مرجع اجرای دستی" dir="auto" value={manualRef} onChange={e => setManualRef(e.target.value)} placeholder="مرجع اجرای دستی" className="w-full border border-input bg-background rounded-md p-2 text-sm" />
        <textarea aria-label="شرح اجرای دستی" value={manualNote} onChange={e => setManualNote(e.target.value)} rows={2} placeholder="شرح بررسی" className="w-full border border-input bg-background rounded-md p-2 text-sm" />
        {manualError && <p role="status" className="text-xs text-action-warning leading-6">{manualError}</p>}
        <Button className="w-full" variant="outline" disabled={!canOperate || !!manualError || !manualRef.trim() || !manualNote.trim()} onClick={() => runActionCommand(action.id, { kind: 'manual', reference: manualRef, note: manualNote })}><CheckCircle2 />ثبت اجرای دستی تأییدشده</Button></div>}
      </> : <p role="status" className="text-xs leading-6 text-muted-foreground" data-testid="read-only-note">نقش فعلی شما فقط‌خواندنی است؛ ارسال، تطبیق و ارجاع برای این نقش مجاز نیست.</p>}
      {action.reconciliation && <p role="status" className="text-xs text-muted-foreground leading-6">آخرین مرجع: <bdi>{action.reconciliation.reference}</bdi> · {action.reconciliation.note}</p>}
    </div>}
    {(action.status === 'proposed' || action.status === 'approved') && <div className="space-y-2 border-t border-border pt-4" data-testid="cancel-panel">
      {cancelAllowed ? <>
        <label className="block text-xs">دلیل لغو پیش از ارسال<textarea aria-label="دلیل لغو" rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="mt-2 w-full border border-input bg-background rounded-md p-2 text-sm" /></label>
        {cancelReason.trim() && cancelReason.trim().length < MIN_REASON_LENGTH && <p role="alert" className="text-xs text-action-warning">دلیل لغو باید دست‌کم {MIN_REASON_LENGTH.toLocaleString('fa-IR')} نویسه باشد.</p>}
        <Button className="w-full" variant="outline" disabled={!!cancelError(action, user, cancelReason)} onClick={() => runActionCommand(action.id, { kind: 'cancel', reason: cancelReason })}>لغو پیش از ارسال</Button>
      </> : <p className="text-xs leading-6 text-muted-foreground">{cancelError(action, user, 'x'.repeat(MIN_REASON_LENGTH))}</p>}
    </div>}
    {action.status === 'canceled' && <p className="text-sm text-muted-foreground leading-6">این پیشنهاد پیش از ارسال لغو شد: {action.cancelReason}</p>}
    {(action.status === 'sent' || action.status === 'uncertain') && <p className="text-xs leading-6 text-muted-foreground" data-testid="no-cancel-note">{cancelError(action, user, 'x'.repeat(MIN_REASON_LENGTH))}</p>}
    {action.status === 'finalized' && <p className="text-sm text-action-success flex gap-2 leading-6"><CheckCircle2 className="size-5 shrink-0" />{action.manualCompletion ? `اجرای دستی با مرجع ${action.manualCompletion.reference} تأیید انسانی و نهایی شد.` : action.reconciliation?.outcome === 'failed_confirmed' ? `عدم اجرای اقدام در مقصد با مرجع ${action.reconciliation.reference} تأیید شد (شکست تأییدشده) و پرونده نهایی شد. برای جبران، پیشنهاد جدید بسازید.` : `اجرای اقدام با مرجع ${action.reconciliation?.reference ?? 'ثبت مقصد'} تأیید و نهایی شد.`}</p>}
  </aside>;
}

export function ActionProposalDetailView({ id }: { id: string }) {
  const { actions, scope, openWorkView } = useApp();
  const action = scopedActions(actions, scope.siteId).find(a => a.id === id);
  if (!action) return <div><div role="alert" data-testid="action-not-found" className="mb-4"><h1 className="text-xl font-bold">۴۰۴</h1><p className="mt-1 text-muted-foreground">پیشنهاد اقدام یافت نشد.</p></div><Button variant="outline" onClick={() => openWorkView({ kind: 'proposals' })}>بازگشت به پیشنهادها</Button></div>;
  return <div data-testid="action-detail"><Button variant="ghost" size="sm" className="mb-4 text-action-brand" onClick={() => openWorkView({ kind: 'proposals' })}><ArrowRight />بازگشت به پیشنهادها</Button><Heading title={action.title} /><p className="font-mono text-xs text-muted-foreground mb-2"><bdi dir="ltr">{action.code}</bdi></p><p className="text-xs text-muted-foreground mb-5" data-testid="action-header-meta">ویرایش {action.revision.toLocaleString('fa-IR')} · مهلت تأیید: <Countdown iso={action.expiresAtIso} /> <span>({action.expiresAt})</span></p>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8"><div className="min-w-0 space-y-8">
      <section><h2 className="font-bold text-sm mb-3">شرح پیشنهاد</h2><p className="text-sm leading-7 text-muted-foreground">{action.description}</p></section>
      <section><h2 className="font-bold text-sm mb-3 flex gap-2 items-center"><GitCompareArrows className="size-5 text-action-brand" />تفاوت‌ها (Diff)</h2><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="text-xs text-muted-foreground bg-muted"><tr><th className="p-3">فیلد</th><th className="p-3">قبل از اقدام</th><th className="p-3">پس از اقدام</th></tr></thead><tbody>{action.diff.map(d => <tr key={d.field} className="border-b border-border"><td className="p-3 font-medium">{d.field}</td><td className="p-3 text-muted-foreground">{d.before}</td><td className="p-3 text-action-success">{d.after}</td></tr>)}</tbody></table></div></section>
      <section><h2 className="font-bold text-sm mb-3">تأثیر مورد انتظار و ریسک</h2><p className="text-sm leading-7">{action.impact}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">{action.risk}</p></section>
      <section><h2 className="font-bold text-sm mb-3">منابع و شواهد مرتبط</h2><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openWorkView({ kind: 'task', id: action.taskId })}>وظیفه مرتبط و بسته شواهد<ArrowLeft /></Button><Button variant="outline" size="sm" onClick={() => openWorkView({ kind: 'alert', id: action.alertId })}>هشدار مرتبط و بسته شواهد<ArrowLeft /></Button></div></section>
      <section><h2 className="font-bold text-sm mb-4 flex gap-2 items-center"><History className="size-5 text-action-brand" />ژورنال اقدام</h2><JournalEntries action={action} /></section>
    </div><ApprovalPanel key={action.id} action={action} /></div>
  </div>;
}

export function ActionJournalView() {
  const { actions, scope, openWorkView } = useApp();
  const rows = scopedActions(actions, scope.siteId);
  return <div data-testid="action-journal"><Heading title="ژورنال اقدام" journal /><div className="mb-6 flex flex-wrap items-center gap-2 text-xs">{Object.entries(ACTION_STATUS_LABEL).filter(([s]) => s !== 'canceled').map(([s, label], i) => <span className="inline-flex items-center gap-2" key={s}>{i > 0 && <ArrowLeft className="size-3 text-muted-foreground" />}<span>{label}</span></span>)}</div>{rows.length ? rows.map(action => <section key={action.id} className="border-t border-border py-6"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><Button variant="ghost" className="h-auto text-start whitespace-normal p-0 gap-2" onClick={() => openWorkView({ kind: 'proposal', id: action.id })}><bdi dir="ltr" className="font-mono text-xs text-muted-foreground">{action.code}</bdi><span className="font-bold text-sm">{action.title}</span><ArrowLeft /></Button><Status status={action.status} /></div><JournalEntries action={action} />{action.status === 'uncertain' && <Button className="mt-4 text-action-warning" variant="outline" onClick={() => openWorkView({ kind: 'proposal', id: action.id })}><FileSearch />بررسی و تطبیق نتیجه مقصد</Button>}</section>) : <p className="py-12 text-center text-muted-foreground">اقدامی در دامنه فعلی ثبت نشده است.</p>}</div>;
}

export function ApprovalQueueView() {
  const { actions, scope, user, openWorkView } = useApp();
  const rows = scopedActions(actions, scope.siteId).filter(a => a.status === 'proposed' && !approvalError(a, user, scope.siteId));
  return <div data-testid="approval-queue"><Heading title="صف تأییدهای من" />
    <p className="mb-5 text-xs leading-6 text-muted-foreground">فقط پیشنهادهای در انتظار تأیید در دامنه فعلی که شما مجاز به تأیید آن‌ها هستید (سازنده‌ی پیشنهاد نمی‌تواند خودش تأیید کند).</p>
    {rows.length ? <div className="divide-y divide-border border-y border-border">{rows.map(a => <Button key={a.id} variant="ghost" onClick={() => openWorkView({ kind: 'proposal', id: a.id })} className="w-full h-auto min-h-20 rounded-none px-2 py-4 justify-between text-right whitespace-normal gap-4"><div className="min-w-0"><bdi dir="ltr" className="text-xs font-mono text-muted-foreground">{a.code}</bdi><h2 className="text-sm font-bold mt-1">{a.title}</h2><p className="text-xs font-normal text-muted-foreground mt-1">سازنده: {a.creatorName} · انقضا: {a.expiresAt}</p></div><div className="flex items-center gap-2 shrink-0"><Status status={a.status} /><ArrowLeft /></div></Button>)}</div> : <p className="py-12 text-center text-muted-foreground">پیشنهادی در انتظار تأیید شما در این دامنه نیست.</p>}
  </div>;
}
