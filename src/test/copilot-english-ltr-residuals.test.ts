import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression coverage for the four specific Copilot UI residuals in Momentic #30.
// These checks inspect JSX labels and preserve the existing stored feedback values.
// Browser interaction with English/LTR and Persian/RTL remains a manual acceptance step.
const source = readFileSync(resolve(process.cwd(), 'src/him/components/CopilotView.tsx'), 'utf8');

describe('Momentic #30 Copilot English/LTR residual controls', () => {
  it('localizes the related-action View button and evidence Open source button', () => {
    expect(source).toContain("t('مشاهده','View')");
    expect(source).toContain("t('باز کردن منبع','Open source')");
    expect(source).not.toContain('>مشاهده</SourceButton>');
    expect(source).not.toContain('>باز کردن منبع</SourceButton>');
  });

  it('localizes feedback controls and accessibility labels', () => {
    expect(source).toContain("aria-label={t('نوع خطا','Error type')}");
    expect(source).toContain("t('دامنه بازخورد','Feedback scope')}");
    expect(source).toContain("t('کل پاسخ','Whole answer')");
    expect(source).toContain("t('توضیح بازخورد اختیاری','Optional feedback details')");
  });

  it('preserves persisted feedback enum values when translating dropdown options', () => {
    for (const value of [
      'اشتباه واقعی', 'ارجاع نادرست', 'ناقص',
      'ادعای بدون پشتوانه', 'شواهد غیرقابل دسترسی', 'مقایسه گمراه‌کننده',
    ]) {
      expect(source).toContain(`<option value="${value}">`);
    }
    expect(source).toContain("value={c.selected?.feedback?.errorType ?? ''}");
  });

  it('localizes evidence detail captions and question count without changing source data', () => {
    expect(source).toContain("t('نسخه متریک','Metric version')");
    expect(source).toContain("t('صورت','Numerator')");
    expect(source).toContain("t('مخرج','Denominator')");
    expect(source).toContain("en?'4,000 characters':'۴٬۰۰۰ نویسه'");
    expect(source).toContain("t('زمان تولید','Generated at')");
    expect(source).toContain("t('تعارض منابع','Source conflict')");
  });
});
