import {describe,expect,it} from 'vitest';
import {MAX_QUESTION_LENGTH,questionError,evidenceFreshness} from '../him/data/copilotData';
import {roundPurchaseQuantity,validPurchasePack} from '../him/supply/packRules';
import {formatTehranPersianDate} from '../him/components/persianCalendar';
describe('HIM-OS frontend conformance regressions',()=>{
 it('limits questions to 4000 Unicode characters',()=>{expect(MAX_QUESTION_LENGTH).toBe(4000);expect(questionError('x'.repeat(4000))).toBeNull();expect(questionError('x'.repeat(4001))).not.toBeNull();});
 it('never labels seven-day-old evidence as fresh',()=>{expect(evidenceFreshness('2026-10-19T05:00:00Z','2026-10-26T05:00:00Z')).toBe('stale');expect(evidenceFreshness('invalid')).toBe('unknown');});
 it('rounds 47 to 48 and blocks unrounded replenishment',()=>{expect(roundPurchaseQuantity(47,12)).toBe(48);expect(validPurchasePack(47,12)).toBe(false);expect(validPurchasePack(48,12)).toBe(true);});
 it('formats 14 October 2026 as Wednesday 22 Mehr in Tehran',()=>{const date=formatTehranPersianDate(new Date('2026-10-14T12:00:00Z'));expect(date).toContain('چهارشنبه');expect(date).toContain('مهر');});
});
