import {useEffect, useMemo, useState} from 'react';
import {useApp} from '../context/AppContext';
import type {CopilotTurn} from '../data/copilotData';
import {formatPreferredDate, useDisplayPreferencesRevision} from './datePreferences';
import {useShellLanguage} from './useShellLanguage';

/** Run states as recorded by the local Copilot simulation (REQ-AIM-009). */
const STATE_LABEL: Record<string, string> = {
  queued: 'در صف', running: 'در حال اجرا', validating: 'در حال اعتبارسنجی', completed: 'تکمیل‌شده', completed_partial: 'تکمیل جزئی',
  awaiting_input: 'منتظر پاسخ کاربر', abstained: 'خودداری از پاسخ', canceled: 'لغوشده', timed_out: 'پایان مهلت', failed: 'ناموفق',
};
const ANSWER_LABEL: Record<string, string> = {answered: 'پاسخ داده شد', partial: 'پاسخ جزئی', clarification_required: 'نیازمند شفاف‌سازی', abstained: 'بدون پاسخ (شواهد ناکافی)'};

function readTurns(): CopilotTurn[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem('him.copilot.v1') ?? '[]');
    return Array.isArray(raw) ? raw.filter((t): t is CopilotTurn => !!t && typeof t.id === 'string' && typeof t.siteId === 'string') : [];
  } catch {
    return [];
  }
}

/** Registry of Copilot runs for the current site and user: what ran, its state, evidence count and how to reopen it. */
export function AssistantRunsWorkspace() {
  const {scope, user, openWorkView} = useApp();
  const [language] = useShellLanguage();
  useDisplayPreferencesRevision();
  const [turns, setTurns] = useState<CopilotTurn[]>(readTurns);
  const [state, setState] = useState('all');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const sync = (e: StorageEvent) => { if (e.key === 'him.copilot.v1') setTurns(readTurns()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const reload = () => {
    try {
      localStorage.getItem('him.copilot.v1');
      setTurns(readTurns());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };
  const rows = useMemo(() => turns
    .filter(t => t.siteId === scope.siteId && (!t.userId || t.userId === user?.id))
    .filter(t => state === 'all' || t.state === state)
    .sort((a, b) => b.at.localeCompare(a.at)), [turns, scope.siteId, user?.id, state]);

  return <section className="space-y-4" data-testid="assistant-runs">
    <header className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
      <h1 className="text-xl font-bold">سابقه اجرای دستیار · UI-AIM-02</h1>
      <p className="text-sm text-slate-600">اجراهای کوپایلت در سایت {scope.siteName} برای کاربر فعلی. فقط شبیه‌سازی محلی همین مرورگر است و ممیزی سمت سرور نیست.</p>
    </header>
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">وضعیت اجرا<select className="mt-1 block rounded-lg border bg-white p-2 text-sm" value={state} onChange={e => setState(e.target.value)}>
        <option value="all">همه وضعیت‌ها</option>
        {Object.entries(STATE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select></label>
      <button type="button" className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={reload}>بازخوانی</button>
      <button type="button" className="rounded-lg bg-teal-800 px-3 py-2 text-sm text-white hover:bg-teal-900" onClick={() => openWorkView({kind: 'copilot'})}>پرسش تازه در کوپایلت</button>
    </div>
    {failed && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">خواندن سابقه اجرا از حافظه مرورگر ممکن نشد. دوباره «بازخوانی» را بزنید.</p>}
    {rows.length === 0
      ? <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-600 space-y-2" data-testid="assistant-runs-empty">
          <p className="font-semibold text-slate-800">{state === 'all' ? 'هنوز اجرایی برای این سایت ثبت نشده است.' : 'اجرایی با این وضعیت یافت نشد.'}</p>
          <p>هر پرسش در کوپایلت یک اجرا با شناسه، وضعیت، شواهد و زمان ثبت می‌کند و اینجا نمایش داده می‌شود.</p>
        </div>
      : <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[760px] text-sm text-start">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['شناسه اجرا', 'پرسش', 'وضعیت اجرا', 'نتیجه پاسخ', 'شواهد', 'زبان پاسخ', 'زمان', ''].map((h, i) => <th key={i} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map(t => <tr key={t.id} className="border-t align-top">
              <td className="p-3 font-mono text-xs" dir="ltr">{t.answer?.runId ?? t.id}</td>
              <td className="p-3 max-w-xs break-words" dir="auto" translate="no">{t.question}</td>
              <td className="p-3">{STATE_LABEL[t.state] ?? t.state}</td>
              <td className="p-3">{t.answer ? ANSWER_LABEL[t.answer.status] ?? t.answer.status : 'بدون خروجی'}</td>
              <td className="p-3 tabular-nums">{(t.answer?.evidence.filter(e => !e.revoked).length ?? 0).toLocaleString('fa-IR')}</td>
              <td className="p-3">{t.language === 'en' ? 'انگلیسی' : 'فارسی'}</td>
              <td className="p-3 whitespace-nowrap">{formatPreferredDate(t.at, language)}</td>
              <td className="p-3">{t.answer && <button type="button" className="text-teal-800 underline" onClick={() => openWorkView({kind: 'copilot', answerId: t.answer!.id})}>باز کردن پاسخ</button>}</td>
            </tr>)}</tbody>
          </table>
        </div>}
  </section>;
}
