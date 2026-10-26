import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {DomainWorkspace,validateDomain} from '@/him/components/DomainWorkspaces';

let selectedSite='SITE-TAL';
vi.mock('@/him/context/AppContext',()=>({useApp:()=>({scope:{siteId:selectedSite,siteName:selectedSite},user:{id:'demo-user'}})}));
const metric={metric_key:'occupancy',name:'Occupancy',owner_id:'OWNER-1',unit:'1',grain:'site/day',numerator:'occupied_beds',denominator:'staffed_beds',aggregation:'ratio',allowed_dimensions:'site',required_datasets:'beds',exclusions:'none',timezone_policy:'Asia/Tehran',freshness_limit_seconds:'300',quality_policy_id:'QP-1',effective_from:'2026-10-01',version:'1'};
beforeEach(()=>{localStorage.clear();sessionStorage.clear();selectedSite='SITE-TAL';});
afterEach(cleanup);
describe('HIM-OS domain guards',()=>{
 it('rejects invalid metric formula and duplicate version',()=>{
  expect(validateDomain('/data/datasets',1,metric,[])).toEqual([]);
  expect(validateDomain('/data/datasets',1,{...metric,numerator:'eval("foo")'},[]).some(x=>x.includes('فرمول'))).toBe(true);
  expect(validateDomain('/data/datasets',1,metric,[{id:'existing',tab:1,values:metric,at:'',state:'draft',note:''}]).some(x=>x.includes('قبلاً'))).toBe(true);
 });
 it('blocks overlapping crosswalk intervals and invalid calendar bounds',()=>{
  const mapping={authority:'hospital',source_id:'src',entity_type:'ward',source_key:'A',canonical_id:'CAN-1',effective_from:'2026-10-01',effective_to:'2026-11-01',evidence:'fixture',reviewer:'QA-2'};
  const stored=[{id:'old',tab:1,values:mapping,at:'',state:'draft',note:''}];
  expect(validateDomain('/data/identity',1,{...mapping,effective_from:'2026-10-15',effective_to:'2026-12-01'},stored)).toContain('بازه مؤثر برای این کلید منبع همپوشانی دارد.');
  expect(validateDomain('/data/identity',1,{...mapping,effective_from:'2026-11-01',effective_to:'2026-12-01'},stored)).toEqual([]);
 });
 it('isolates browser draft lists by site',()=>{
  const ui=render(<DomainWorkspace path="/data/ingestion" siteName="Taleghani"/>);
  for(const [label,value] of [['شناسه اتصال مصنوعی','CON-1'],['مجموعه‌داده','DATA-1'],['نسخه قرارداد','v1'],['cutoff مشاهده','2026-10-25T10:00']] as const){
   fireEvent.change(screen.getByLabelText(label+' *'),{target:{value}});
  }
  fireEvent.click(screen.getByRole('button',{name:'ثبت نسخه پیش‌نویس نمونه'}));
  expect(screen.getAllByText(/draft/).length).toBeGreaterThan(0);
  selectedSite='SITE-IMAM';ui.rerender(<DomainWorkspace path="/data/ingestion" siteName="Imam Hossein"/>);
  expect(screen.getByText('رکوردی برای این سایت ذخیره نشده است.')).toBeTruthy();
  selectedSite='SITE-TAL';ui.rerender(<DomainWorkspace path="/data/ingestion" siteName="Taleghani"/>);
  expect(screen.getAllByText(/draft/).length).toBeGreaterThan(0);
 });
});
