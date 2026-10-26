import { describe,it,expect } from 'vitest';
import { normalizeWeights, validMaintenanceReason, validTimeWindow } from '../him/components/domainDraftRules';

describe('domain workspace draft guards',()=>{
 it('rejects invalid maintenance reasons and windows',()=>{
  expect(validMaintenanceReason('short')).toBe(false);
  expect(validMaintenanceReason('دلیل بازبینی نگهداشت تجهیزات پزشکی')).toBe(true);
  expect(validMaintenanceReason('a'.repeat(2001))).toBe(false);
  expect(validTimeWindow('2026-11-05T10:00','2026-11-05T10:00')).toBe(false);
  expect(validTimeWindow('2026-11-05T11:00','2026-11-05T10:00')).toBe(false);
  expect(validTimeWindow('2026-11-05T10:00','2026-11-05T11:00')).toBe(true);
 });
 it('rejects zero or negative roster weights',()=>{
  expect(normalizeWeights({coverage:'0',fairness:'0'})).toBeNull();
  expect(normalizeWeights({coverage:'1',fairness:'-1'})).toBeNull();
  expect(normalizeWeights({coverage:'',fairness:'1'})).toBeNull();
  const weights=normalizeWeights({coverage:'2',fairness:'1'});
  expect(weights?.normalized.coverage).toBeCloseTo(2/3);
 });
});
