import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Memo } from './store';
import {DEMO_USERS} from '../data/mockData';

/** Only approved-for-demo template identifiers may be proposed; source manifests are not registered. */
export const MEMO_DEMO_ACTION_TEMPLATES=[
  {id:'demo-capacity-review',label:'پیشنهاد بررسی ظرفیت (T2 / فقط آزمایشی)'},
  {id:'demo-supply-replenishment',label:'پیشنهاد تأمین غیرالزام‌آور (T3 / فقط آزمایشی)'},
  {id:'demo-data-quality-escalation',label:'ارجاع کیفیت داده برای بازبینی (T2 / فقط آزمایشی)'},
] as const;
export const validMemoActionTemplate=(id:string)=>MEMO_DEMO_ACTION_TEMPLATES.some(t=>t.id===id);
type Request = {
  id: string;
  memoId: string;
  revision: number;
  template: string;
  reason: string;
  createdAt: string;
  state: string;
  authorId?:string; reviewerId?:string; reviewerAt?:string; proposalId?:string; policyVersion?:string;
};
export function MemoActionHandoff({ memo }: { memo: Memo }) {
  const { scope, user } = useApp();
  const key = `him.memo.action-request.shared.v2:${scope.siteId}:${memo.id}`;
  const legacyKey=`him.memo.action-request.v1:${scope.siteId}:${user?.id || 'guest'}:${memo.id}`;
  const [items, setItems] = useState<Request[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || localStorage.getItem(legacyKey) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  const [template, setTemplate] = useState('');
  const [reason, setReason] = useState('');
  const [reviewerId,setReviewerId]=useState('');
  const [policyVersion,setPolicyVersion]=useState('demo-policy-v1');
  const persist=(next:Request[])=>{try{localStorage.setItem(key,JSON.stringify(next));setItems(next);return true;}catch{return false;}};
  const save = () => {
    if (!validMemoActionTemplate(template) || reason.trim().length < 20 || !memo.revision || !reviewerId || reviewerId===user?.id || !policyVersion.trim()) return;
    const record: Request = {
      id: `request-${Date.now()}`,
      memoId: memo.id,
      revision: memo.revision,
      template: template.trim(),
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
      state: 'awaiting_template_and_policy_review',authorId:user?.id||'guest',reviewerId,policyVersion,
    };
    const next = [record, ...items];
    if(persist(next)){setReason('');setTemplate('');setReviewerId('');}
  };
  const review=(r:Request)=>{
    if(r.state!=='awaiting_template_and_policy_review'||r.reviewerId!==user?.id||r.authorId===user?.id||r.revision!==memo.revision||!validMemoActionTemplate(r.template))return;
    persist(items.map(x=>x.id===r.id?{...x,state:'template_policy_reviewed_synthetic',reviewerAt:new Date().toISOString()}:x));
  };
  const materialize=(r:Request)=>{
    if(r.state!=='template_policy_reviewed_synthetic'||r.authorId!==user?.id||r.revision!==memo.revision)return;
    // Separate immutable mock proposal; NEVER hand it to the production Action Gateway.
    persist(items.map(x=>x.id===r.id?{...x,state:'proposal_prepared_synthetic',proposalId:`SYN-PROP-${r.id}`}:x));
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
        قالب پیشنهاد آزمایشی (برای ایجاد Proposal عملیاتی به ثبت رسمی Manifest نیاز است)
        <select className="mt-1 w-full rounded-lg border p-2" value={template} onChange={(e)=>setTemplate(e.target.value)}>
          <option value="">قالب مجاز نمایشی را انتخاب کنید</option>
          {MEMO_DEMO_ACTION_TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        دلیل درخواست (حداقل ۲۰ نویسه)
        <textarea
          className="mt-1 w-full rounded-lg border p-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <label className="block text-sm">بازبین مستقل قالب و سیاست
        <select className="mt-1 w-full rounded border p-2" value={reviewerId} onChange={e=>setReviewerId(e.target.value)}><option value="">انتخاب بازبین</option>{DEMO_USERS.filter(x=>x.id!==user?.id&&x.permittedSiteIds.includes(scope.siteId||'')).map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select>
      </label>
      <label className="block text-sm">نسخه سیاست نمایشی<input className="mt-1 w-full rounded border p-2" value={policyVersion} onChange={e=>setPolicyVersion(e.target.value)}/></label>
      <button
        className="rounded-lg bg-teal-800 px-4 py-2 text-white disabled:opacity-40"
        disabled={!validMemoActionTemplate(template) || reason.trim().length < 20 || !memo.revision || !reviewerId || reviewerId===user?.id || !policyVersion.trim()}
        onClick={save}
      >
        ثبت درخواست پیشنهاد اقدام T1
      </button>
      <p className="text-xs text-amber-800">
        برای تبدیل درخواست به اقدام قابل تصویب، باید قالب، دامنه، صلاحیت‌ها، نسخه سیاست و گیت Action
        Gateway جداگانه بررسی شوند. هیچ ارسال یا تصویب واقعی فعال نیست.
      </p>
      {items.length>0&&<p className="text-xs">درخواست‌های زیر به نسخه مشخص یادداشت قفل شده‌اند. اگر نسخه یادداشت تغییر کند، باید درخواست جداگانه‌ای ساخته شود.</p>}
      {items.map((r) => (
        <div key={r.id} className="rounded-lg border p-3 text-xs">
          <bdi>{r.id}</bdi> · یادداشت {r.memoId} ویرایش {r.revision} · قالب {r.template} · {r.state}{' '}
          · {r.createdAt} · {r.revision===memo.revision?'نسخه جاری یادداشت':'نسخه قبلی یادداشت؛ نیازمند بررسی دوباره'}
          <p>سیاست {r.policyVersion||'نامشخص'} · بازبین {r.reviewerId||'ثبت نشده'} · بازبینی: {r.reviewerAt||'در انتظار'}</p>
          {r.proposalId&&<p className="font-semibold">پیشنهاد مستقل فقط آزمایشی: {r.proposalId} · بدون ارسال/تصویب/اجرا</p>}
          <div className="flex gap-2 mt-2"><button className="rounded border p-2 disabled:opacity-40" disabled={r.state!=='awaiting_template_and_policy_review'||r.reviewerId!==user?.id||r.authorId===user?.id||r.revision!==memo.revision} onClick={()=>review(r)}>تأیید نمایشی بازبینی قالب/سیاست</button><button className="rounded border p-2 disabled:opacity-40" disabled={r.state!=='template_policy_reviewed_synthetic'||r.authorId!==user?.id||r.revision!==memo.revision} onClick={()=>materialize(r)}>آماده‌سازی پیشنهاد مستقل (نمونه)</button></div>
        </div>
      ))}
    </section>
  );
}
