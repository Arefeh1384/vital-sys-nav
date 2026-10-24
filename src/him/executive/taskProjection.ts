import type {WorkTask} from '../data/workData';
import {demoStore, type DemoTask} from '../phase6/store';

export const unfinishedTask = (status: string) => !['done','completed','canceled'].includes(status);
/** The Phase 6 override is canonical when present, including after refresh. */
export function canonicalTasks(legacy: WorkTask[]): Array<WorkTask | DemoTask> {
 const overrides = demoStore.tasks();
 return [...legacy.map(task => overrides.find(row => row.id === task.id) ?? task),
   ...overrides.filter(row => !legacy.some(task => task.id === row.id))];
}
