import { describe, it, expect } from 'vitest';
import { normalizeFaSearch } from '../him/components/faSearch';
import { scopedDraftKey } from '../him/components/scopedDraftKey';
import { demoStore, newTask } from '../him/phase6/store';

describe('Mo Persian search and browser-local scope', () => {
  it('finds Arabic Yeh and Kaf spellings of Persian hospital names', () => {
    expect(
      normalizeFaSearch('بیمارستان امام حسین (ع)').includes(normalizeFaSearch('امام حسين')),
    ).toBe(true);
    expect(normalizeFaSearch('كاربری')).toBe(normalizeFaSearch('کاربری'));
  });
  it('separates FIN and KNO synthetic drafts by hospital and user', () => {
    const tal = scopedDraftKey(
      'him.spec-workspaces.demo.v2',
      '/finance/workflows',
      'SITE-TALEGHANI',
      'user-1',
    );
    const imam = scopedDraftKey(
      'him.spec-workspaces.demo.v2',
      '/finance/workflows',
      'SITE-IMAM-HOSSEIN',
      'user-1',
    );
    expect(tal).not.toBe(imam);
    expect(
      scopedDraftKey('him.knowledge.local.v1', 'documents', 'SITE-TALEGHANI', 'user-1'),
    ).not.toBe(
      scopedDraftKey('him.knowledge.local.v1', 'documents', 'SITE-IMAM-HOSSEIN', 'user-1'),
    );
  });
  it('rejects oversized task titles before writing them to local storage', () => {
    const task = newTask('SITE-TALEGHANI', {});
    task.title = '1234567890'.repeat(21);
    expect(() => demoStore.saveTask(task)).toThrow('TASK_TITLE_INVALID');
    expect(demoStore.tasks().some((t) => t.id === task.id)).toBe(false);
  });
});
