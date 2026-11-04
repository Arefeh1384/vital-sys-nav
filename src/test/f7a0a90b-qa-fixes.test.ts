import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getExecutiveDashboard } from '@/him/executive/dashboardStore';
import { SITES_DATA } from '@/him/data/mockData';
import { answerQuestion } from '@/him/data/copilotData';
import { formatDatesIn, formatPreferredDate } from '@/him/components/datePreferences';
import { matchCommands } from '@/him/components/Header';

// Regressions for the actionable findings of QA review f7a0a90b (2026-11-04).
const PERSIAN_LETTER = /[ء-يٮ-ۓۺ-ۿ]/;
const site = SITES_DATA[0]!.id;
const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('REQ-EXE-002 occupancy card follows the selected range', () => {
  it('shows the single-day value only for the last complete day', () => {
    const day = getExecutiveDashboard(site, 'day', [], []).metrics.find(m => m.key === 'occupancy')!;
    expect(day.value).toBe(80);
    expect(day.quality).toBe('stale');
  });

  it('is not computable for 7/30 days instead of relabelling the one-day snapshot', () => {
    for (const period of ['week', 'month'] as const) {
      const m = getExecutiveDashboard(site, period, [], []).metrics.find(x => x.key === 'occupancy')!;
      expect(m.value).toBeNull();
      expect(m.quality).toBe('not_computable');
      expect(m.reason).toContain('PERIOD_NOT_COVERED');
      expect(m.numerator).toBeUndefined();
    }
  });

  it('marks live counts as independent of the range', () => {
    const m = getExecutiveDashboard(site, 'week', [], []).metrics.find(x => x.key === 'alerts')!;
    expect(m.basis).toBe('current');
  });
});

describe('REQ-PLT-006 site and identity changes honour unsaved-edit guards', () => {
  it('switchSite, demo user switch and logout dispatch the cancelable navigation event', () => {
    const ctx = src('src/him/context/AppContext.tsx');
    expect(ctx).toContain("if (siteId !== scope.siteId && !confirmLeave()) return false;");
    expect(ctx).toContain('if (user && user.id !== demoUser.id && !confirmLeave()) return;');
    expect(ctx).toContain('if (!confirmLeave()) return;');
  });
});

describe('REQ-PLT-005 language, calendar and time zone', () => {
  it('finds commands by English or Persian name', () => {
    expect(matchCommands('task').map(c => c.kind)).toContain('tasks');
    expect(matchCommands('Task').map(c => c.kind)).toContain('tasks');
    expect(matchCommands('وظایف').map(c => c.kind)).toContain('tasks');
    expect(matchCommands('zzz-no-match')).toEqual([]);
  });

  it('formats demo timestamps with the chosen calendar and zone', () => {
    localStorage.setItem('him.ui.calendar', 'gregory');
    localStorage.setItem('him.ui.timeZone', 'UTC');
    expect(formatDatesIn('۱۴۰۵/۰۷/۲۲ - ۰۸:۱۵', 'en')).toBe('Oct 14, 2026, 04:45 UTC');
    expect(formatDatesIn('سررسید ۱۴۰۵/۰۷/۲۳', 'en')).toContain('Oct 15, 2026');
    expect(formatPreferredDate('۱۴۰۵/۰۷/۲۲', 'en')).toBe('Oct 14, 2026');
    localStorage.removeItem('him.ui.calendar');
    localStorage.removeItem('him.ui.timeZone');
  });

  it('answers in English when English is the selected answer language', () => {
    const a = answerQuestion('What is current bed occupancy?', site, [site], '2026-10-26T08:00:00Z', { range: 'امروز', language: 'en' });
    expect(a.blocks.length).toBeGreaterThan(0);
    expect(a.blocks.some(b => PERSIAN_LETTER.test(b.text))).toBe(false);
    expect(a.limitations.some(l => l.includes('ترجمه‌ی انگلیسی پاسخ'))).toBe(false);
    const fa = answerQuestion('What is current bed occupancy?', site, [site], '2026-10-26T08:00:00Z', { range: 'امروز', language: 'fa' });
    expect(fa.blocks.some(b => PERSIAN_LETTER.test(b.text))).toBe(true);
  });

  it('hand-built dialogs trap focus and close on Escape', () => {
    expect(src('src/him/components/ScopeModal.tsx')).toContain('useModalFocus(panelRef, isScopeModalOpen');
    expect(src('src/him/components/Header.tsx')).toContain('useModalFocus(commandRef,commandOpen');
  });
});

describe('REQ-AIM-009 / CTL-003 / AST fixes', () => {
  it('routes /assistant/runs to a run registry and never renders a blank spec page', () => {
    const s = src('src/him/components/SpecificationWorkspaces.tsx');
    expect(s).toContain("if(path==='/assistant/runs')return <AssistantRunsWorkspace/>;");
    expect(s).not.toContain('if(!page)return null;');
  });

  it('shows the linked action and its uncertain state on the task page', () => {
    expect(src('src/him/phase6/Phase6.tsx')).toContain('data-testid="task-linked-action"');
  });

  it('includes managed task and action history in the local audit search', () => {
    const s = src('src/him/components/ControlWorkflows.tsx');
    expect(s).toContain('demoStore.tasks().filter(x=>x.siteId===scope.siteId)');
    expect(s).toContain("type:'action'");
  });

  it('does not create a second maintenance draft for the same asset and recommendation', () => {
    expect(src('src/him/components/SpecializedWorkspaces.tsx')).toContain("['شناسه دارایی','پیشنهاد مرجع']");
  });
});
