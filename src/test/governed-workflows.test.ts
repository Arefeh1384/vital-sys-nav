import {describe,expect,it} from 'vitest';
import {answerQuestion} from '@/him/data/copilotData';
import {SITES_DATA} from '@/him/data/mockData';
import {newTask} from '@/him/phase6/store';
import {pathForWorkView,workViewForPath} from '@/him/context/AppContext';

const site = SITES_DATA[0]!;
const sites = SITES_DATA.map(x=>x.id);
describe('Regressions for controlled frontend workspaces',()=>{
 it('does not use a today occupancy fixture for a 30-day clarification',()=>{
  for(const range of ['امروز','۳۰ روز کامل']) {
   const answer=answerQuestion('اشغال تخت در ۳۰ روز',site.id,sites,'2026-10-26T08:00:00Z',{range,language:'fa'});
   expect(answer.status).toBe('abstained');
   expect(answer.reasonCodes).toContain('missing_evidence');
   expect(answer.blocks).toHaveLength(0);
  }
 });
 it('recognizes standalone notification-policy URL after refresh',()=>{
  expect(workViewForPath('/settings/notification-policy')).toEqual({kind:'spec-page',path:'/settings/notification-policy'});
  expect(pathForWorkView({kind:'spec-page',path:'/settings/notification-policy'})).toBe('/settings/notification-policy');
 });
 it('links a follow-up task to its source alert without inventing execution',()=>{
  const task=newTask(site.id,{alertId:'al-0-0'});
  expect(task.siteId).toBe(site.id);
  expect(task.evidenceIds).toContain('al-0-0');
  expect(task.status).toBe('open');
  expect(task.reviewRequired).toBe(true);
 });
});
