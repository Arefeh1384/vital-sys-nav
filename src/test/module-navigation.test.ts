import { describe, it, expect } from 'vitest';
import { MODULE_ROUTES, moduleForPath, modulePath, workViewForPath } from '../him/context/AppContext';

describe('Top-level module history routes', () => {
 it('assigns a distinct URL to each module rather than falling back to /', () => {
  expect(new Set(Object.values(MODULE_ROUTES)).size).toBe(Object.keys(MODULE_ROUTES).length);
  expect(moduleForPath('/platform')).toBe('PLT');
  expect(moduleForPath('/operations')).toBe('OPS');
  expect(moduleForPath('/quality')).toBe('QLT');
  expect(moduleForPath('/')).toBe('EXE');
  expect(modulePath('PLT')).not.toBe(modulePath('OPS'));
 });
 it('preserves independent work-view routing and a governance path', () => {
  expect(workViewForPath('/tasks')).toMatchObject({kind:'tasks'});
  expect(workViewForPath('/settings/governance')).toEqual({kind:'spec-page',path:'/settings/governance'});
 });
});
