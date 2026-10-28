import {describe,it,expect} from 'vitest';
import {DEMO_PURCHASE_LINES,inspectSupplier} from '../him/supply/supplierPerformance';
import {compareOccupancyFixtures} from '../him/executive/dashboardStore';
import {validMemoActionTemplate} from '../him/phase6/MemoActionHandoff';
import {canReviewInvestigation} from '../him/components/InvestigationWorkspace';
import {inDateRange,DEMO_AST_EVENTS} from '../him/components/assetSourceFixtures';
import {validateDomain} from '../him/components/DomainWorkspaces';
import {displayTaskOwner} from '../him/components/WorkViews';

describe('Outstanding Mo findings: real guards and labelled fixtures',()=>{
 it('shows readable task owner rather than raw usr-2',()=>{
  expect(displayTaskOwner('usr-2','SITE-TALEGHANI')).toContain('مقصودی');
  expect(displayTaskOwner('usr-x','SITE-TALEGHANI')).toContain('شناسه ناشناخته');
 });
 it('derives supplier OTIF numerator/denominator and flags inadequate sample',()=>{
  const x=inspectSupplier(DEMO_PURCHASE_LINES,'risk-supplier');
  expect(x.onTimeInFull).toBe(2);expect(x.eligible).toBe(3);
  expect(x.ratio).toBeCloseTo(2/3);expect(x.concentration).toBeCloseTo(0.6);
  expect(x.insufficient).toBe(true);
 });
 it('does not include zero-denominator or unsupported period in synthetic multi-site comparison',()=>{
  const sites=['SITE-TALEGHANI','SITE-IMAM-HOSSEIN','SITE-SHOHADA'];
  const day=compareOccupancyFixtures(sites,'day');
  expect(day.includedCount).toBe(2);expect(day.weightedFixture).toBeCloseTo(78.57);
  expect(day.rows[2].included).toBe(false);
  const month=compareOccupancyFixtures(sites,'month');
  expect(month.includedCount).toBe(0);expect(month.weightedFixture).toBe(null);
 });
 it('prevents an investigation author from entering reviewer conclusion',()=>{
  const record={state:'awaiting_review' as const,createdBy:'usr-1',reviewerId:'usr-2'};
  expect(canReviewInvestigation(record,'usr-1')).toBe(false);
  expect(canReviewInvestigation(record,'usr-2')).toBe(true);
 });
 it('restricts memo handoff to explicitly listed synthetic templates',()=>{
  expect(validMemoActionTemplate('demo-capacity-review')).toBe(true);
  expect(validMemoActionTemplate('arbitrary-unregistered-template')).toBe(false);
 });
 it('rejects duplicate versions of data contracts',()=>{
  const values={contract_id:'hospital_his',source:'synthetic',dataset:'beds',schema_version:'1',owner:'steward',reviewer:'independent-reviewer',grain:'site-day',timezone:'Asia/Tehran',required_fields:'site_id,value',quality_rules:'quarantine invalid values',freshness_seconds:'3600',effective_from:'2026-10-01',effective_to:'2026-11-01'};
  expect(validateDomain('/data/contracts',0,{...values,reviewer:''},[])).toEqual(expect.arrayContaining([expect.stringContaining('بازبین مستقل')]));
  expect(validateDomain('/data/contracts',0,values,[])).toHaveLength(0);
  const prior={id:'SYN-1',tab:0,values,at:'2026-10-01',state:'draft',note:'fixture'};
  expect(validateDomain('/data/contracts',0,values,[prior])).toEqual(expect.arrayContaining([expect.stringContaining('قبلاً ثبت')]));
 });
 it('keeps AST source-event and ingestion timestamps separate and enforces period filtering',()=>{
  expect(DEMO_AST_EVENTS[0].eventAt).not.toBe(DEMO_AST_EVENTS[0].ingestedAt);
  expect(inDateRange(DEMO_AST_EVENTS[0].eventAt,'2026-10-19','2026-10-21')).toBe(true);
  expect(inDateRange(DEMO_AST_EVENTS[0].eventAt,'2026-10-21','2026-10-22')).toBe(false);
 });
});
