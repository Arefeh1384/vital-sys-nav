import { afterEach, describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FA_EN, FA_EN_TEMPLATES } from '@/him/i18n/faEnDictionary';
import { toEnglishText } from '@/him/i18n/translate';
import { startEnglishTranslation, stopEnglishTranslation } from '@/him/i18n/domTranslator';
import { applyDocumentLanguage } from '@/him/components/useShellLanguage';

// REQ-PLT-005 / TEST-PLT-005: Persian RTL and English LTR interfaces.
// Persian stays the source and stored language; English is a presentation layer.
const PERSIAN_LETTER = /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/;

describe('Persian → English dictionary', () => {
  it('has an English value without Persian letters for every entry', () => {
    const bad = Object.entries(FA_EN).filter(([, en]) => !en.trim() || PERSIAN_LETTER.test(en));
    expect(bad).toEqual([]);
  });

  it('keeps every runtime placeholder in template translations', () => {
    const bad = FA_EN_TEMPLATES.filter(([fa, en]) => (fa.match(/\{\d+\}/g) ?? []).sort().join() !== (en.match(/\{\d+\}/g) ?? []).sort().join());
    expect(bad).toEqual([]);
  });
});

describe('toEnglishText', () => {
  it('translates shell and module labels', () => {
    expect(toEnglishText('داشبورد مدیریتی')).toBe('Executive dashboard');
    expect(toEnglishText('بیمارستان آیت‌الله طالقانی')).toBe('Ayatollah Taleghani Hospital');
  });

  it('keeps surrounding whitespace so inline JSX spacing survives', () => {
    expect(toEnglishText(' مورد')).toMatch(/^ \S/);
  });

  it('converts Persian digits and punctuation', () => {
    expect(toEnglishText('۸۰٪')).toBe('80%');
    expect(toEnglishText('۱۲٬۵۰۰')).toBe('12,500');
  });

  it('translates runtime-composed text (templates, concatenation, joined messages)', () => {
    expect(toEnglishText('بازه پیش‌بینی ۲۸ روز')).toBe('Forecast range 28 days');
    const joined = toEnglishText('دسته رخداد الزامی است. · زمان رخداد الزامی است.');
    expect(PERSIAN_LETTER.test(joined)).toBe(false);
    expect(joined).toContain(' · ');
  });

  it('leaves Latin text untouched', () => {
    expect(toEnglishText('SITE-TALEGHANI')).toBe('SITE-TALEGHANI');
  });
});

describe('document language runtime', () => {
  afterEach(() => {
    applyDocumentLanguage('fa');
    document.body.innerHTML = '';
  });

  it('sets <html lang/dir> for the whole document', () => {
    applyDocumentLanguage('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    applyDocumentLanguage('fa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('fa');
  });

  it('translates rendered text and labels, never typed values, and restores Persian exactly', async () => {
    document.body.innerHTML = '<main><h1>داشبورد مدیریتی</h1><input aria-label="جستجو" value="متن کاربر"><textarea aria-label="دلیل نگهداشت">پیش‌نویس کاربر</textarea></main>';
    const h1 = document.querySelector('h1')!;
    const input = document.querySelector('input')!;
    const textarea = document.querySelector('textarea')!;
    startEnglishTranslation(document.body);
    expect(h1.textContent).toBe('Executive dashboard');
    expect(input.getAttribute('aria-label')).toBe('Search');
    expect(input.value).toBe('متن کاربر');
    expect(textarea.getAttribute('aria-label')).not.toMatch(PERSIAN_LETTER);
    expect(textarea.value).toBe('پیش‌نویس کاربر');

    // A later React text update is re-translated.
    h1.firstChild!.nodeValue = 'بیمارستان آیت‌الله طالقانی';
    await new Promise(r => setTimeout(r, 0));
    expect(h1.textContent).toBe('Ayatollah Taleghani Hospital');

    stopEnglishTranslation(document.body);
    expect(h1.textContent).toBe('بیمارستان آیت‌الله طالقانی');
    expect(input.getAttribute('aria-label')).toBe('جستجو');
  });
});

describe('layout follows <html dir>', () => {
  const files: string[] = [];
  (function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.tsx')) files.push(p);
    }
  })(resolve(process.cwd(), 'src/him'));

  it('has no container hard-coded to dir="rtl"', () => {
    const offenders = files.filter(f => /\sdir="rtl"/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('uses logical alignment and spacing instead of left/right', () => {
    const physical = /(?<![\w:-])(?:text-(?:left|right)|[pm][lr]-\d|border-[lr](?:-\d)?|(?:left|right)-\d)(?![\w-])/;
    const offenders = files.filter(f => readFileSync(f, 'utf8').split(/\s|["'`{}]/).some(tok => physical.test(tok) && tok !== 'text-left'));
    expect(offenders).toEqual([]);
  });
});
