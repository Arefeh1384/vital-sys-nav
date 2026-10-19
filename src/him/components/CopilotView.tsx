import { useRef, useState } from 'react';
import { Bot, Send, Plus, CheckCircle2, AlertTriangle, HelpCircle, Ban, FileSearch, Copy, Download, ThumbsUp, ThumbsDown, X, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useApp } from '../context/AppContext';
import { ANSWER_LABEL, KIND_LABEL, REASON_LABEL, RUN_LABEL, SUGGESTIONS, approvedDocuments, evidenceForDisplay, validateAnswer, type AnswerArtifact, type EvidenceItem, type SourceLink } from '../data/copilotData';
import { formatEventTime, ACTION_STATUS_LABEL } from '../data/actionData';
import { TASK_STATUS_LABEL, ALERT_STATUS_LABEL } from '../data/workData';

const fieldClass = 'rounded-md border border-input bg-background px-3 py-2 text-sm min-w-0';
const banners = {
  answered: { Icon: CheckCircle2, cls: 'text-action-success bg-action-success/10 border-action-success/30' },
  partial: { Icon: AlertTriangle, cls: 'text-action-warning bg-action-warning/10 border-action-warning/30' },
  clarification_required: { Icon: HelpCircle, cls: 'text-action-info bg-action-info/10 border-action-info/30' },
  abstained: { Icon: Ban, cls: 'text-muted-foreground bg-muted border-border' },
};
function Timestamp({ at }: { at: string }) { const time = formatEventTime(at); return <span className="text-xs text-muted-foreground break-words">{time.tehran} (تهران) · <bdi dir="ltr">{time.utc}</bdi></span>; }
function SourceButton({ link, children }: { link: SourceLink; children: React.ReactNode }) {
  const { openWorkView, actions, tasks, alerts, scope } = useApp();
  const rows = link.kind === 'proposal' ? actions : link.kind === 'task' ? tasks : alerts;
  if (!rows.some(r => r.id === link.id && r.siteId === scope.siteId)) return null;
  return <Button variant="outline" size="sm" onClick={() => openWorkView(link)}>{children}</Button>;
}
function EvidenceDrawer({ evidence, focusId, close, opener }: { evidence: EvidenceItem[]; focusId: string | null; close: () => void; opener: React.RefObject<HTMLElement | null> }) {
  return <Dialog open={focusId !== null} onOpenChange={open => { if (!open) close(); }}>
    <DialogContent data-testid="evidence-drawer" dir="rtl" className="max-h-[90dvh] overflow-y-auto w-full sm:max-w-xl text-right" onOpenAutoFocus={e => { e.preventDefault(); requestAnimationFrame(() => document.getElementById(`ev-${focusId}`)?.focus()); }} onCloseAutoFocus={e => { e.preventDefault(); opener.current?.focus(); }}>
      <DialogTitle className="pr-6">شواهد پاسخ</DialogTitle><DialogDescription>گزیده‌های مجاز از داده‌های نمونه‌ی بیمارستان فعلی</DialogDescription>
      {evidence.map(raw => { const e = evidenceForDisplay(raw); return <section key={e.id} id={`ev-${e.id}`} tabIndex={-1} data-testid="evidence-item" className={`border rounded-md p-4 space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-ring ${focusId === e.id ? 'border-action-brand bg-action-brand/5' : 'border-border'}`}>
        {e.revoked ? <p>شواهد دیگر در دسترس نیست</p> : <><h3 className="font-bold text-sm">{e.title}</h3><p className="text-xs text-action-brand">{KIND_LABEL[e.kind]} · {e.freshness === 'fresh' ? 'تازه' : 'کهنه'}</p><p className="text-xs">نسخه: <bdi dir="ltr">{e.version}</bdi> · محل ارجاع: {e.locator}</p><Timestamp at={e.dataAsOf} /><p className="text-sm leading-7">{e.excerpt}</p>
          {e.kind === 'computed' && <dl className="grid grid-cols-2 gap-2 text-xs">{e.numerator !== undefined && <><dt>صورت</dt><dd>{e.numerator.toLocaleString('fa-IR')}</dd></>}{e.denominator !== undefined && <><dt>مخرج</dt><dd>{e.denominator.toLocaleString('fa-IR')}</dd></>}{e.value && <><dt>مقدار</dt><dd>{e.value}</dd></>}<dt>نسخه متریک</dt><dd><bdi dir="ltr">{e.metricVersion}</bdi></dd>{e.denominator === 0 && <dd className="col-span-2">قابل محاسبه نیست (<bdi dir="ltr">not_computable</bdi>)</dd>}</dl>}
          {e.link && <SourceButton link={e.link}>باز کردن منبع</SourceButton>}</>}
      </section>; })}
    </DialogContent>
  </Dialog>;
}
function Related({ answer }: { answer: AnswerArtifact }) {
  const { actions, tasks, alerts, scope } = useApp();
  const rows = [
    ...actions.filter(a => a.siteId === scope.siteId && answer.relatedActionIds.includes(a.id)).map(a => ({ id: a.id, code: a.code, title: a.title, status: ACTION_STATUS_LABEL[a.status], kind: 'proposal' as const })),
    ...tasks.filter(t => t.siteId === scope.siteId && answer.relatedTaskIds.includes(t.id)).map(t => ({ id: t.id, code: t.code, title: t.title, status: TASK_STATUS_LABEL[t.status], kind: 'task' as const })),
    ...alerts.filter(a => a.siteId === scope.siteId && answer.relatedAlertIds.includes(a.id)).map(a => ({ id: a.id, code: a.code, title: a.title, status: ALERT_STATUS_LABEL[a.status], kind: 'alert' as const })),
  ];
  return <section className="border-t border-border mt-6 pt-4"><h3 className="font-bold text-sm mb-3">اقدام‌ها، وظایف و هشدارهای مرتبط</h3>{rows.length ? <ul className="divide-y divide-border">{rows.map(r => <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs text-muted-foreground"><bdi dir="ltr">{r.code}</bdi> · {r.status}</p><p className="text-sm leading-6">{r.title}</p></div><SourceButton link={{ kind: r.kind, id: r.id }}>مشاهده</SourceButton></li>)}</ul> : <p className="text-sm text-muted-foreground">موردی مرتبط نیست</p>}</section>;
}
export function CopilotView() {
  const { copilot: c, scope, user, setIsScopeModalOpen, openWorkView, showNotification } = useApp();
  const [focusId, setFocusId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const answer = c.selected?.answer ? validateAnswer(c.selected.answer) : undefined;
  const documents = scope.siteId ? approvedDocuments(scope.siteId) : [];
  const canExport = !!user && user.role !== 'data_steward';
  const citation = (id: string, event: React.MouseEvent<HTMLElement>) => { opener.current = event.currentTarget; setFocusId(id); };
  const exportText = answer ? ['پیش‌نویس تا زمان بازبینی حرفه‌ای', ANSWER_LABEL[answer.status], ...answer.blocks.map(b => b.text), answer.clarification?.question ?? answer.nextStep ?? '', ...answer.limitations, ...answer.evidence.filter(e => !e.revoked).map(e => `${e.title} | ${e.version} | ${e.locator} | ${e.dataAsOf}`), `زمان تولید: ${answer.generatedAt}`, 'تولیدشده با کمک هوش مصنوعی — نمونه؛ بازبینی حرفه‌ای لازم است'].join('\n\n') : '';
  const copy = async () => { try { await navigator.clipboard.writeText(exportText); showNotification('پیش‌نویس پاسخ کپی شد.'); } catch { showNotification('کپی پاسخ در این مرورگر در دسترس نیست.'); } };
  const download = () => { const url = URL.createObjectURL(new Blob([exportText], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'copilot-draft.txt'; a.click(); URL.revokeObjectURL(url); };
  const banner = answer ? banners[answer.status] : undefined;
  return <div data-testid="copilot-view" dir="rtl" className="text-foreground min-w-0">
    <div role="note" data-testid="mock-banner" className="border border-action-warning/30 bg-action-warning/10 rounded-md px-4 py-3 mb-5 flex gap-2 text-xs leading-6"><AlertTriangle className="size-4 shrink-0 mt-1 text-action-warning" /><p><strong>داده نمونه (Mock)</strong> · پاسخ‌ها از پیش‌ساخته‌اند و هیچ مدل زبانی واقعی صدا زده نمی‌شود.</p></div>
    <header className="flex items-start gap-3 mb-5"><Bot className="size-7 text-action-brand" /><div><h1 className="text-xl font-bold">کوپایلت</h1><p className="text-xs text-muted-foreground mt-1">فضای گفتگو و بررسی شواهد</p></div></header>
    <section aria-label="زمینه گفتگو" className="border-y border-border py-4 mb-5 flex flex-wrap gap-3 items-end">
      <Button variant="outline" onClick={() => setIsScopeModalOpen(true)} className="max-w-full h-auto whitespace-normal py-2"><Building2 className="size-4 shrink-0" />{scope.siteName}</Button>
      <label className="grid gap-1 text-xs">هدف<select aria-label="هدف" className={fieldClass} value={c.context.purpose} onChange={e => c.changeContext({ purpose: e.target.value })}><option>مدیریت عملیات</option><option>بررسی شواهد</option></select></label>
      <label className="grid gap-1 text-xs">زبان<select aria-label="زبان" className={fieldClass} value={c.context.language} onChange={e => c.changeContext({ language: e.target.value === 'en' ? 'en' : 'fa' })}><option value="fa">فارسی</option><option value="en">انگلیسی</option></select></label>
      <label className="grid gap-1 text-xs">بازه زمانی<select aria-label="بازه زمانی" className={fieldClass} value={c.context.range} onChange={e => c.changeContext({ range: e.target.value })}><option>امروز</option><option>۷ روز</option><option>۳۰ روز</option></select></label>
      <label className="flex gap-2 items-center text-xs py-2"><input type="checkbox" checked={c.simulateFailure} onChange={e => c.setSimulateFailure(e.target.checked)} />شبیه‌سازی قطع مدل (نمونه)</label>
    </section>
    {c.contextChanged && <p role="status" className="mb-4 inline-flex rounded-md bg-action-info/10 text-action-info px-3 py-2 text-xs">{c.scopeMessage && `${c.scopeMessage}؛ `}زمینه تغییر کرد؛ سؤال بعدی یک نوبت جدید است</p>}
    <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-6">
      <aside className="min-w-0 lg:border-l lg:border-border lg:pl-5"><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-bold">نوبت‌های گفتگو</h2><Button size="icon" variant="ghost" title="گفتگوی جدید" aria-label="گفتگوی جدید" disabled={!!c.running} onClick={c.newConversation}><Plus className="size-4" /></Button></div><ul className="space-y-2 max-h-96 overflow-y-auto">{c.turns.map(t => <li key={t.id}><Button variant={t.id === c.selected?.id ? 'secondary' : 'ghost'} onClick={() => c.selectTurn(t.id)} className="w-full h-auto block text-right whitespace-normal p-3"><span className="line-clamp-2 text-xs leading-6">{t.question}</span><span className="block text-xs mt-1 text-muted-foreground">{RUN_LABEL[t.state]}</span></Button></li>)}</ul>{!c.turns.length && <p className="text-xs text-muted-foreground py-4">هنوز نوبتی ثبت نشده است.</p>}</aside>
      <div className="min-w-0 space-y-6">
        <form onSubmit={e => { e.preventDefault(); c.submit(c.draft); }} className="border border-border rounded-md bg-background p-4">
          <label htmlFor="copilot-question" className="text-sm font-semibold">سؤال شما</label><textarea id="copilot-question" data-testid="copilot-composer" dir="rtl" placeholder="سؤال خود را بپرسید…" value={c.draft} onChange={e => c.setDraft(e.target.value)} aria-invalid={!!c.error} aria-describedby={c.error ? 'question-error' : 'question-count'} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); c.submit(c.draft); } }} className="w-full mt-3 min-h-28 resize-y bg-background text-right text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-2" />
          <p id="question-count" className="text-xs text-muted-foreground">{c.draft.length.toLocaleString('fa-IR')} / ۱۶٬۰۰۰ نویسه</p>{c.error && <p id="question-error" role="alert" className="text-destructive text-xs mt-2">{c.error}</p>}
          <div className="mt-4"><h3 className="text-xs font-semibold mb-2">اسناد تأییدشده‌ی همین بیمارستان · نمونه</h3><div className="flex flex-wrap gap-2">{documents.map(d => <label key={d.id} className="flex gap-2 items-center rounded-md border border-border px-2 py-1.5 text-xs"><input type="checkbox" checked={c.context.attachmentIds.includes(d.id)} onChange={e => c.changeContext({ attachmentIds: e.target.checked ? [...c.context.attachmentIds, d.id] : c.context.attachmentIds.filter(id => id !== d.id) })} />{d.title}</label>)}</div></div>
          <div className="mt-4 flex justify-end"><Button type="submit" data-testid="copilot-send" disabled={!!c.running}><Send className="size-4" />ارسال سؤال</Button></div>
        </form>
        <div aria-live="polite" aria-atomic="true">{c.running && <div className="flex items-center justify-between gap-3 border border-action-info/30 bg-action-info/5 rounded-md p-3"><span className="flex gap-2 items-center text-sm"><Clock className="size-4 text-action-info" />{RUN_LABEL[c.running.state]}</span><Button size="sm" variant="outline" onClick={c.cancel}><X className="size-4" />لغو</Button></div>}</div>
        {c.selected && ['queued', 'running', 'validating'].includes(c.selected.state) && <div aria-label="در حال آماده‌سازی پاسخ" className="space-y-3 py-6 motion-safe:animate-pulse"><div className="h-5 w-1/3 bg-muted rounded" /><div className="h-4 bg-muted rounded" /><div className="h-4 w-3/4 bg-muted rounded" /></div>}
        {c.selected?.state === 'canceled' && <p role="status" className="text-muted-foreground">لغو شد؛ پاسخی برای این نوبت ثبت نمی‌شود.</p>}
        {c.selected?.state === 'timed_out' && <p role="alert">زمان اجرا تمام شد.</p>}
        {c.selected?.state === 'failed' && <section role="alert" className="border border-destructive/30 rounded-md p-4"><p>کوپایلت در دسترس نیست؛ داشبورد و شاخص‌های قطعی همچنان کار می‌کنند</p><Button variant="outline" className="mt-3" onClick={() => openWorkView(null)}>بازگشت به داشبورد</Button></section>}
        {!c.selected && <section className="py-4"><h2 className="font-bold mb-2">از شواهد بیمارستان فعلی بپرسید</h2><p className="text-sm text-muted-foreground mb-4">پاسخ‌های نمونه برای اشغال تخت، سفارش دارو و سیاست‌ها</p><div className="flex flex-wrap gap-2">{SUGGESTIONS.map(q => <Button key={q} variant="outline" disabled={!!c.running} className="h-auto whitespace-normal py-2 text-xs" onClick={() => c.submit(q)}>{q}</Button>)}</div></section>}
        {answer && banner && <section aria-label="پنل پاسخ" className="min-w-0">
          <div data-testid="answer-banner" role="note" className={`flex gap-2 items-center rounded-md border p-3 ${banner.cls}`}><banner.Icon className="size-5 shrink-0" /><strong data-testid="answer-status" className="text-sm">{ANSWER_LABEL[answer.status]}</strong></div>
          <div className="grid gap-2 py-4 text-xs text-muted-foreground"><p>زمان تولید: <Timestamp at={answer.generatedAt} /></p><p>زمان داده و تازگی منبع: <Timestamp at={answer.dataAsOf} /></p><p>تولیدشده با کمک هوش مصنوعی · {answer.professionalReviewRequired ? 'بازبینی حرفه‌ای لازم است' : 'بازبینی حرفه‌ای لازم نیست'} · {answer.reviewed ? 'بازبینی‌شده' : 'بازبینی‌نشده'}</p><p>وضعیت کار: {c.selected?.jobState === 'succeeded' ? 'نتیجه‌ی تحویل‌شده‌ی معتبر؛ لزوماً پاسخ کامل نیست' : c.selected?.jobState}</p><p>زمینه‌ی نوبت: {c.selected?.context?.purpose} · {c.selected?.context?.range} · {c.selected?.language === 'en' ? 'انگلیسی' : 'فارسی'}</p>{answer.reasonCodes.map(r => <p key={r}>{c.selected?.language === 'en' ? r : (REASON_LABEL[r] ?? r)}</p>)}</div>
          {answer.scopeRedacted && <p role="alert">دامنه تغییر کرد؛ بخشی از پاسخ حذف شد</p>}
          {answer.reasonCodes.includes('source_stale') && <p role="alert" className="bg-action-warning/10 text-action-warning p-3 rounded-md mb-4">داده‌ی کهنه · <Timestamp at={answer.dataAsOf} /></p>}
          {answer.conflict && <div data-testid="conflict-banner" role="alert" className="border border-action-warning/30 p-3 rounded-md mb-4"><h3 className="font-bold text-sm mb-2">تعارض منابع</h3><div className="flex flex-wrap gap-2">{answer.conflict.linkA && <SourceButton link={answer.conflict.linkA}>{answer.conflict.titleA}</SourceButton>}{answer.conflict.linkB && <SourceButton link={answer.conflict.linkB}>{answer.conflict.titleB}</SourceButton>}</div></div>}
          {answer.status === 'clarification_required' && answer.clarification && <div data-testid="clarification"><p className="font-semibold text-sm mb-3">{answer.clarification.question}</p><div className="flex flex-wrap gap-2">{answer.clarification.options.map(q => <Button disabled={!!c.running} variant="outline" key={q} onClick={() => c.submit(q)}>{q}</Button>)}</div></div>}
          {answer.status === 'abstained' && <div data-testid="abstain-message" className="leading-7 text-sm"><p>شواهد کافی برای پاسخ وجود ندارد</p><p>{answer.nextStep}</p>{answer.nextStep?.includes('صف تأیید') && <Button variant="outline" onClick={() => openWorkView({ kind: 'approvals' })}>صف تأییدها</Button>}</div>}
          {answer.blocks.map((b, i) => <div key={i} className="mb-4"><p className="text-xs font-semibold text-action-brand mb-1">{KIND_LABEL[answer.evidence.find(e => b.evidenceIds.includes(e.id))?.kind ?? 'retrieved']}</p><p className="text-sm leading-8">{b.text} {b.evidenceIds.map(id => <Button data-testid="citation" key={id} size="sm" variant="ghost" className="inline-flex px-1 h-7 text-action-brand" aria-label={`شاهد ${answer.evidence.findIndex(e => e.id === id) + 1}`} onClick={e => citation(id, e)}>[{(answer.evidence.findIndex(e => e.id === id) + 1).toLocaleString('fa-IR')}]</Button>)}</p></div>)}
          {!!answer.limitations.length && <section className="border-r-2 border-action-warning pr-3 mt-4"><h3 className="text-sm font-bold">منابع/بخش‌های ناموجود</h3>{answer.limitations.map(l => <p key={l} className="text-sm leading-7">{l}</p>)}</section>}
          {answer.evidence.length > 0 && <Button variant="outline" className="mt-4" onClick={e => { const first = answer.evidence[0]; if (first) citation(first.id, e); }}><FileSearch className="size-4" />شواهد پاسخ</Button>}
          <Related answer={answer} />
          <section className="border-t border-border mt-4 pt-4 space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!canExport} title={!canExport ? 'ناظر فقط‌خواندنی مجوز کپی ندارد' : 'کپی پیش‌نویس'} onClick={copy}><Copy className="size-4" />کپی پاسخ</Button><Button variant="outline" disabled={!canExport} title={!canExport ? 'ناظر فقط‌خواندنی مجوز دانلود ندارد' : 'دانلود پیش‌نویس'} onClick={download}><Download className="size-4" />دانلود</Button></div><p className="text-xs text-muted-foreground">پیش‌نویس تا زمان بازبینی حرفه‌ای{!canExport && ' · ناظر فقط‌خواندنی مجوز کپی و دانلود ندارد'}</p>
            <div className="flex flex-wrap gap-2"><Button variant={c.selected?.feedback?.helpful === true ? 'secondary' : 'ghost'} onClick={() => c.selected && c.feedback(c.selected.id, { helpful: true })}><ThumbsUp className="size-4" />مفید بود</Button><Button variant={c.selected?.feedback?.helpful === false ? 'secondary' : 'ghost'} onClick={() => c.selected && c.feedback(c.selected.id, { helpful: false })}><ThumbsDown className="size-4" />مفید نبود</Button><select aria-label="نوع خطا" value={c.selected?.feedback?.errorType ?? ''} className={fieldClass} onChange={e => c.selected && c.feedback(c.selected.id, { errorType: e.target.value })}><option value="">نوع خطا</option><option>اشتباه واقعی</option><option>ارجاع نادرست</option><option>ناقص</option></select></div><textarea aria-label="توضیح بازخورد اختیاری" placeholder="توضیح اختیاری…" className={`${fieldClass} w-full`} value={c.selected?.feedback?.text ?? ''} onChange={e => c.selected && c.feedback(c.selected.id, { text: e.target.value })} /><p className="text-xs text-muted-foreground">برای آموزش مدل استفاده نمی‌شود</p>
          </section>
          {!!answer.followUps.length && <section className="mt-5"><h3 className="text-xs font-bold mb-2">پیگیری پیشنهادی</h3><div className="flex flex-wrap gap-2">{answer.followUps.map(q => <Button key={q} variant="outline" size="sm" disabled={!!c.running} className="h-auto py-2 whitespace-normal" onClick={() => c.submit(q)}>{q}</Button>)}</div></section>}
        </section>}
      </div>
    </div>
    {answer && <EvidenceDrawer evidence={answer.evidence} focusId={focusId} close={() => setFocusId(null)} opener={opener} />}
  </div>;
}
