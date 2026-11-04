/**
 * Persian → English presentation layer for the English (LTR) interface.
 *
 * The product is Persian-first (REQ-PLT-005, DEC-04): Persian strings stay the
 * source of truth in code, stored data and APIs. When the user selects English,
 * rendered text is mapped through the reviewed dictionary in faEnDictionary.ts.
 * Nothing here changes stored values, option values or API payloads.
 */
import {FA_EN, FA_EN_TEMPLATES} from './faEnDictionary';

/** Persian/Arabic letters only; digits and punctuation are handled by toEnglishPunctuation(). */
export const PERSIAN_LETTERS = /[\u0621-\u064A\u066E-\u06D3\u06D5\u06FA-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFC]/;
const PERSIAN_DIGITS = /[\u06F0-\u06F9\u0660-\u0669]/;

/** Same normalization the dictionary keys were built with. */
export function normalizeFa(value: string): string {
  return value
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660))
    .replace(/\u064A/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/[\u200E\u200F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Latin digits and Latin punctuation for text shown in the English interface. */
export function toEnglishPunctuation(value: string): string {
  return value
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660))
    .replace(/\u066C/g, ',')
    .replace(/\u066B/g, '.')
    .replace(/\u066A/g, '%')
    .replace(/\u060C ?/g, ', ')
    .replace(/\u061B ?/g, '; ')
    .replace(/\u061F/g, '?')
    .replace(/\u00AB/g, '\u201C')
    .replace(/\u00BB/g, '\u201D')
    .replace(/[\u200E\u200F]/g, '');
}

const exact = new Map<string, string>(Object.entries(FA_EN));

type CompiledTemplate = {re: RegExp; en: string; literal: number};
const templates: CompiledTemplate[] = FA_EN_TEMPLATES
  .map(([fa, en]) => {
    const literal = fa.replace(/\{\d+\}/g, '');
    const order: number[] = [];
    const pattern = fa
      .split(/(\{\d+\})/)
      .map(part => {
        const m = /^\{(\d+)\}$/.exec(part);
        if (m) {
          order.push(Number(m[1]));
          return '(.+?)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    // Re-index the English template so {n} refers to capture order.
    let mapped = en;
    order.forEach((n, i) => {
      mapped = mapped.split(`{${n}}`).join(`\u0000${i}\u0000`);
    });
    return {re: new RegExp(`^${pattern}$`, 's'), en: mapped, literal: (literal.match(PERSIAN_LETTERS) ? literal.trim().length : 0)};
  })
  .filter(t => t.literal >= 2)
  .sort((a, b) => b.literal - a.literal);

/** Phrase table for the substitution fallback: longest Persian phrases first. */
let phraseRe: RegExp | null = null;
const phraseMap = new Map<string, string>();
function phraseRegex(): RegExp {
  if (phraseRe) return phraseRe;
  const keys = [...exact.keys()].filter(k => PERSIAN_LETTERS.test(k) && k.length >= 2 && !/[{}]/.test(k));
  keys.sort((a, b) => b.length - a.length);
  for (const k of keys) phraseMap.set(k, exact.get(k)!);
  const body = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // A phrase must not start or end inside a Persian word (ZWNJ counts as part of a word).
  phraseRe = new RegExp(`(?<![\\u0600-\\u06FF\\u200C])(?:${body})(?![\\u0600-\\u06FF\\u200C])`, 'g');
  return phraseRe;
}

/** Separators between independent labels ("A · B", "A | B"). */
const STRONG_SEPARATORS = /(\s+[·•|—–]\s+)/;
/** Separators inside a label ("Site: X", "A, B", "A (B)", "A. B"). */
const WEAK_SEPARATORS = /(\s*[:：]\s+|\s*[،؛,;]\s+|\s+[-/]\s+|\s*\(|\)\s*|\.\s+)/;
const cache = new Map<string, string | null>();
const LETTER_LATIN: Record<string, string> = {'ا': 'A', 'آ': 'A', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ث': 'S', 'ج': 'J', 'چ': 'Ch', 'ح': 'H', 'خ': 'Kh', 'د': 'D', 'ذ': 'Z', 'ر': 'R', 'ز': 'Z', 'ژ': 'Zh', 'س': 'S', 'ش': 'Sh', 'ص': 'S', 'ض': 'Z', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh', 'ف': 'F', 'ق': 'Gh', 'ک': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M', 'ن': 'N', 'و': 'V', 'ه': 'H', 'ی': 'Y'};

/** Translates every segment between separators; null unless all Persian segments are known. */
function bySegments(key: string, separators: RegExp, depth: number): string | null {
  const parts = key.split(separators);
  if (parts.length < 2) return null;
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (separators.test(part) || !PERSIAN_LETTERS.test(part)) {
      out.push(toEnglishPunctuation(part));
      continue;
    }
    const t = lookup(part, depth + 1);
    if (t === null) return null;
    out.push(t);
  }
  return out.join('');
}

function byTemplate(key: string, depth: number): string | null {
  for (const t of templates) {
    const m = t.re.exec(key);
    if (!m) continue;
    const values: string[] = [];
    let ok = true;
    for (const v of m.slice(1)) {
      const tv = PERSIAN_LETTERS.test(v) ? lookup(v, depth + 1) : toEnglishPunctuation(v);
      if (tv === null) {
        ok = false;
        break;
      }
      values.push(tv);
    }
    if (ok) return t.en.replace(/\u0000(\d+)\u0000/g, (_, i) => values[Number(i)] ?? '');
  }
  return null;
}

function lookup(core: string, depth = 0): string | null {
  const key = normalizeFa(core);
  if (!PERSIAN_LETTERS.test(key)) return toEnglishPunctuation(core);
  if (cache.has(key)) return cache.get(key)!;
  cache.set(key, null); // guards against cycles while this key is being resolved
  let result: string | null = exact.get(key) ?? null;
  if (result === null && depth < 6) result = bySegments(key, STRONG_SEPARATORS, depth);
  if (result === null && depth < 6) result = byTemplate(key, depth);
  if (result === null && depth < 6) {
    // Same label with/without a closing period.
    if (key.endsWith('.')) {
      const t = exact.get(key.slice(0, -1).trim());
      if (t !== undefined) result = t.endsWith('.') ? t : `${t}.`;
    } else {
      const t = exact.get(`${key}.`);
      if (t !== undefined) result = t.replace(/\.$/, '');
    }
  }
  if (result === null && depth < 6) result = bySegments(key, WEAK_SEPARATORS, depth);
  if (result === null) {
    // Runtime-composed sentences: replace every known phrase. Nested segments must come out fully translated.
    const replaced = key.replace(phraseRegex(), m => phraseMap.get(m) ?? m);
    if (replaced !== key && (depth === 0 || !PERSIAN_LETTERS.test(replaced))) result = replaced;
  }
  if (result === null && depth === 0 && /^[ء-ۿ]$/.test(key)) result = LETTER_LATIN[key] ?? null; // avatar initials
  if (result !== null) result = toEnglishPunctuation(result).replace(/([A-Za-z][A-Za-z ]*?) \(\1\)/gi, '$1');
  cache.set(key, result);
  return result;
}

/**
 * Text as it should appear in the English interface. Leading/trailing whitespace
 * is preserved so inline JSX spacing stays intact.
 */
export function toEnglishText(text: string): string {
  if (!PERSIAN_LETTERS.test(text)) return PERSIAN_DIGITS.test(text) || /[\u060C\u061B\u061F\u066A-\u066C\u200F]/.test(text) ? toEnglishPunctuation(text) : text;
  const lead = /^\s*/.exec(text)![0];
  const trail = /\s*$/.exec(text)![0];
  const core = text.slice(lead.length, text.length - trail.length);
  const translated = lookup(core);
  return lead + (translated ?? toEnglishPunctuation(core)) + trail;
}

/** True when a value still contains Persian after translation (user data, names not in the dictionary). */
export function hasPersian(text: string): boolean {
  return PERSIAN_LETTERS.test(text);
}
