import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Memo } from './store';

type Request = {
  id: string;
  memoId: string;
  revision: number;
  template: string;
  reason: string;
  createdAt: string;
  state: string;
};
export function MemoActionHandoff({ memo }: { memo: Memo }) {
  const { scope, user } = useApp();
  const key = `him.memo.action-request.v1:${scope.siteId}:${user?.id || 'guest'}:${memo.id}`;
  const [items, setItems] = useState<Request[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  const [template, setTemplate] = useState('');
  const [reason, setReason] = useState('');
  const save = () => {
    if (!template.trim() || reason.trim().length < 20) return;
    const record: Request = {
      id: `request-${Date.now()}`,
      memoId: memo.id,
      revision: memo.revision,
      template: template.trim(),
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
      state: 'awaiting_template_and_policy_review',
    };
    const next = [record, ...items];
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
      setReason('');
      setTemplate('');
    } catch {
      /* Never claim durable persistence if storage failed. */
    }
  };
  return (
    <section className="rounded-xl border bg-white p-5 space-y-3" data-testid="memo-action-handoff">
      <h3 className="font-bold">پیشنهاد اقدام مستقل · Action Gateway</h3>
      <p className="text-sm">
        یادداشت تصمیم یک پیش‌نویس غیرالزام‌آور T1 است. پیشنهاد اقدام باید به نسخه دقیق{' '}
        {memo.revision} یادداشت {memo.id} و قالب ثبت‌شده متصل شود. ثبت این درخواست نه تأیید اقدام
        است، نه اجرای آن.
      </p>
      <label className="block text-sm">
        شناسه قالب اقدام ثبت‌شده (برای بررسی؛ صحت قالب تأیید نمی‌شود)
        <input
          className="mt-1 w-full rounded-lg border p-2"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        دلیل درخواست (حداقل ۲۰ نویسه)
        <textarea
          className="mt-1 w-full rounded-lg border p-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        className="rounded-lg bg-teal-800 px-4 py-2 text-white disabled:opacity-40"
        disabled={!template.trim() || reason.trim().length < 20}
        onClick={save}
      >
        ثبت درخواست پیشنهاد اقدام T1
      </button>
      <p className="text-xs text-amber-800">
        برای تبدیل درخواست به اقدام قابل تصویب، باید قالب، دامنه، صلاحیت‌ها، نسخه سیاست و گیت Action
        Gateway جداگانه بررسی شوند. هیچ ارسال یا تصویب واقعی فعال نیست.
      </p>
      {items.map((r) => (
        <div key={r.id} className="rounded-lg border p-3 text-xs">
          <bdi>{r.id}</bdi> · یادداشت {r.memoId} ویرایش {r.revision} · قالب {r.template} · {r.state}{' '}
          · {r.createdAt}
        </div>
      ))}
    </section>
  );
}
