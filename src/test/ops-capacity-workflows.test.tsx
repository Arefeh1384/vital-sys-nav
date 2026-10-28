import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MainContent} from '@/him/components/MainContent';
import {DomainWorkspace,validateDomain} from '@/him/components/DomainWorkspaces';
import {modulePath,pathForWorkView,workViewForPath} from '@/him/context/AppContext';

const openWorkView = vi.fn();
const setActiveModule = vi.fn();
let scope = {siteId:'SITE-TALEGHANI',siteName:'بیمارستان آیت‌الله طالقانی',siteCode:'SITE-TALEGHANI',orgName:'دانشگاه علوم پزشکی شهید بهشتی'};
vi.mock('@/him/context/AppContext',async importOriginal=>{
  const original = await importOriginal<typeof import('@/him/context/AppContext')>();
  return {...original,useApp:()=>({
    scope, user:{id:'usr-1'}, activeModule:'OPS', viewState:'normal',
    isScopeSwitching:false, workView:null, openWorkView,setActiveModule,
  })};
});

beforeEach(()=>{localStorage.clear();openWorkView.mockClear();setActiveModule.mockClear();window.history.replaceState(null,'','/operations');});
afterEach(()=>cleanup());

describe('OPS capacity entry points',()=>{
  it('exposes all three flows as usable buttons on the main OPS screen',()=>{
    render(<MainContent/>);
    expect(screen.getByTestId('ops-planning-tools')).toBeTruthy();
    fireEvent.click(screen.getByTestId('ops-forecast-request'));
    expect(openWorkView).toHaveBeenLastCalledWith({kind:'spec-page',path:'/operations/forecasts',tab:0});
    fireEvent.click(screen.getByTestId('ops-forecast-results'));
    expect(openWorkView).toHaveBeenLastCalledWith({kind:'spec-page',path:'/operations/forecasts',tab:1});
    fireEvent.click(screen.getByTestId('ops-scenario-assumptions'));
    expect(openWorkView).toHaveBeenLastCalledWith({kind:'spec-page',path:'/operations/scenarios',tab:1});
    fireEvent.click(screen.getByTestId('ops-scenario-baseline'));
    expect(openWorkView).toHaveBeenLastCalledWith({kind:'spec-page',path:'/operations/scenarios',tab:0});
  });
  it('preserves direct links to OPS tabs',()=>{
    expect(pathForWorkView({kind:'spec-page',path:'/operations/forecasts',tab:1})).toBe('/operations/forecasts?tab=1');
    window.history.replaceState(null,'','/operations/forecasts?tab=1');
    expect(workViewForPath('/operations/forecasts')).toEqual({kind:'spec-page',path:'/operations/forecasts',tab:1});
    window.history.replaceState(null,'','/operations/scenarios?tab=1');
    expect(workViewForPath('/operations/scenarios')).toEqual({kind:'spec-page',path:'/operations/scenarios',tab:1});
    expect(modulePath('OPS')).toBe('/operations');
  });
  it('shows unavailable results when the model is not connected',()=>{
    render(<DomainWorkspace path="/operations/forecasts" siteName={scope.siteName} initialTab={1}/>);
    expect(screen.getByTestId('forecast-results').textContent).toContain('unavailable');
    cleanup();
    render(<DomainWorkspace path="/operations/scenarios" siteName={scope.siteName} initialTab={3}/>);
    expect(screen.getByTestId('scenario-results').textContent).toContain('unavailable');
  });
});

describe('Scenario guardrails',()=>{
  const baselineValues = {name:'baseline',metric:'occupancy',source_ref:'SYN-SNAPSHOT',as_of:'2026-10-28T08:00',quality:'synthetic'};
  const validScenario = {scenario_name:'more beds',baseline_ref:'SYN-BASE-1',horizon_hours:'24',bed_direction:'increase',bed_count:'2',admission_direction:'decrease',admission_percent:'10',assumptions:'synthetic staff change'};
  const baseline = [{id:'SYN-BASE-1',tab:0,values:baselineValues,at:'',state:'draft',note:''}];
  it('requires a real local baseline record and valid numeric bounds',()=>{
    expect(validateDomain('/operations/scenarios',0,baselineValues,[])).toEqual([]);
    expect(validateDomain('/operations/scenarios',1,validScenario,[]).some(x=>x.includes('خط پایه'))).toBe(true);
    expect(validateDomain('/operations/scenarios',1,validScenario,baseline)).toEqual([]);
    expect(validateDomain('/operations/scenarios',1,{...validScenario,horizon_hours:'0'},baseline).some(x=>x.includes('افق'))).toBe(true);
    expect(validateDomain('/operations/scenarios',1,{...validScenario,admission_percent:'110'},baseline).some(x=>x.includes('۱۰۰'))).toBe(true);
    expect(validateDomain('/operations/scenarios',2,{scenario_ref:'SYN-MISSING',staffing:'limit',physical_beds:'limit',risk:'limit'},baseline).some(x=>x.includes('سناریوی'))).toBe(true);
  });
  it('keeps scenario drafts scoped to the current site',()=>{
    const ui=render(<DomainWorkspace path="/operations/scenarios" siteName={scope.siteName}/>);
    for(const [label,value] of [['عنوان خط پایه','baseline'],['سنجه ظرفیت','occupancy'],['ارجاع به منبع / Snapshot مصنوعی','SYN-SNAPSHOT'],['زمان برش داده','2026-10-28T08:00'],['وضعیت داده','synthetic']] as const){
      fireEvent.change(screen.getByLabelText(label+' *'),{target:{value}});
    }
    fireEvent.click(screen.getByRole('button',{name:'ثبت نسخه پیش‌نویس نمونه'}));
    expect(screen.getByText(/draft/)).toBeTruthy();
    scope={...scope,siteId:'SITE-IMAM',siteCode:'SITE-IMAM',siteName:'بیمارستان امام حسین'};
    ui.rerender(<DomainWorkspace path="/operations/scenarios" siteName={scope.siteName}/>);
    expect(screen.getByText('رکوردی برای این سایت ذخیره نشده است.')).toBeTruthy();
    scope={...scope,siteId:'SITE-TALEGHANI',siteCode:'SITE-TALEGHANI',siteName:'بیمارستان آیت‌الله طالقانی'};
  });
});
