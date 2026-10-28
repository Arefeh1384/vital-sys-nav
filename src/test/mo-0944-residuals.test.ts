import {describe,expect,it} from 'vitest';
import {checkDemoPublicationRecipients} from '../him/components/briefPublicationGate';
import {ALERTS_DATA} from '../him/data/workData';
import {alertEvidence} from '../him/data/evidenceData';
import {OCCUPANCY_METRICS, evidenceForDisplay} from '../him/data/copilotData';

const permitted=['usr-1','usr-3'];

describe('deployment 0944e495 residuals',()=>{
  it('#15 rejects a substituted publication recipient even when the root list is authorized',()=>{
    expect(checkDemoPublicationRecipients('usr-3','QA-SYN-NOT-ALLOWLISTED',permitted).join(' ')).toContain('BLOCKED');
  });
  it('#15 requires a new independent review when the proposed recipient set differs',()=>{
    expect(checkDemoPublicationRecipients('usr-3,usr-1','usr-3',permitted).join(' ')).toContain('STALE REVIEW');
    expect(checkDemoPublicationRecipients('usr-3','usr-3',permitted)).toEqual([]);
    expect(checkDemoPublicationRecipients('usr-3','',permitted).length).toBeGreaterThan(0);
    expect(checkDemoPublicationRecipients('usr-3,usr-3','usr-3',permitted).length).toBeGreaterThan(0);
  });
  it('#14 uses the stable alert code, not the UI route id, for synthetic detector evidence',()=>{
    const alert=ALERTS_DATA.find(a=>a.code==='ALR-1050');
    expect(alert).toBeDefined();
    expect(alert!.id).not.toBe('ALR-1050');
    const pack=alertEvidence(alert!);
    expect(pack.some(e=>e.sourceEventAt&&e.ingestedAt&&e.ruleVersion==='capacity-threshold@demo-2')).toBe(true);
    const unrelated=ALERTS_DATA.find(a=>a.code!=='ALR-1050');
    expect(alertEvidence(unrelated!).some(e=>e.sourceVersion==='fixture-contract-bed-v1 [SYNTHETIC]')).toBe(false);
  });
  it('#12 synthetic Copilot occupancy fixture carries distinct timestamps without claiming real upstream provenance',()=>{
    const sample=OCCUPANCY_METRICS.find(m=>m.denominator>0);
    expect(sample).toBeDefined();
    expect('sourceEventAt' in sample!).toBe(true);
    expect('ingestedAt' in sample!).toBe(true);
    const raw={id:'sample',kind:'computed' as const,title:'sample',version:'v1',locator:'fixture',dataAsOf:sample!.dataAsOf,excerpt:'synthetic',freshness:'stale' as const,sourceEventAt:'sourceEventAt' in sample! ? sample!.sourceEventAt:undefined,ingestedAt:'ingestedAt' in sample!? sample!.ingestedAt:undefined};
    const displayed=evidenceForDisplay(raw);
    expect(displayed.sourceEventAt).toBeTruthy();
    expect(displayed.ingestedAt).toBeTruthy();
    expect(displayed.sourceEventAt).not.toBe(displayed.dataAsOf);
    expect(displayed.ingestedAt).not.toBe(displayed.dataAsOf);
  });
});
