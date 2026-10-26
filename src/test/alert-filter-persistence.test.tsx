import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {AlertListView} from '@/him/components/WorkViews';
let siteId='SITE-TAL';
vi.mock('@/him/context/AppContext',()=>({useApp:()=>({scope:{siteId,siteName:siteId},alerts:[
{id:'a1',siteId:'SITE-TAL',code:'ALR-1020',title:'هشدار الف',severity:'high',status:'new',module:'PLT',raisedAt:'2026-10-26'},
{id:'a2',siteId:'SITE-TAL',code:'ALR-1021',title:'هشدار ب',severity:'low',status:'new',module:'PLT',raisedAt:'2026-10-26'},
{id:'a3',siteId:'SITE-IMAM',code:'ALR-1030',title:'هشدار پ',severity:'high',status:'new',module:'PLT',raisedAt:'2026-10-26'}],openWorkView:vi.fn()})}));
beforeEach(()=>{sessionStorage.clear();siteId='SITE-TAL';});afterEach(cleanup);
describe('scoped alert list history',()=>{
 it('restores search after remount without leaking filters to another site',()=>{
  const ui=render(<AlertListView/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'ALR-1020'}});
  expect(screen.queryByText('ALR-1021')).toBeNull();
  ui.unmount();
  const restored=render(<AlertListView/>);
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('ALR-1020');
  expect(screen.queryByText('ALR-1021')).toBeNull();
  siteId='SITE-IMAM';restored.rerender(<AlertListView/>);
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  expect(screen.getByText('ALR-1030')).toBeTruthy();
 });
});
