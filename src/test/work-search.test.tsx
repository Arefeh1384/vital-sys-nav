import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertListView, TaskListView } from '@/him/components/WorkViews';

vi.mock('@/him/context/AppContext', () => ({
  useApp: () => ({
    scope: { siteId: 'site-1', siteName: 'بیمارستان', siteCode: 'S1' },
    tasks: [{ id: 't1', code: 'TSK-1001', title: 'بررسی تجهیزات', siteId: 'site-1', status: 'open', priority: 'high', module: 'PLT' }],
    alerts: [{ id: 'a1', code: 'ALR-1003', title: 'هشدار تجهیزات', siteId: 'site-1', status: 'new', severity: 'high', module: 'PLT' }],
    openWorkView: vi.fn(), setIsScopeModalOpen: vi.fn(), setViewState: vi.fn(),
  }),
}));

afterEach(cleanup);

describe('Work list search reset', () => {
  it('clears task search and status so the original task returns', () => {
    render(<TaskListView />);
    fireEvent.click(screen.getByRole('button', { name: 'انجام‌شده' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'بدون نتیجه' } });
    expect(screen.queryByText('TSK-1001')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'پاک‌کردن جستجو و فیلترها' }));
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByText('TSK-1001')).toBeTruthy();
  });

  it('clears alert search, status and severity so the original alert returns', () => {
    render(<AlertListView />);
    fireEvent.click(screen.getByRole('button', { name: 'برطرف‌شده' }));
    fireEvent.click(screen.getByRole('button', { name: 'پایین' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'بدون نتیجه' } });
    expect(screen.queryByText('ALR-1003')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'پاک‌کردن جستجو و فیلترها' }));
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByText('ALR-1003')).toBeTruthy();
  });
});