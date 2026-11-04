#!/usr/bin/env node
/**
 * Lists Persian UI strings in src/him and src/routes that have no English entry
 * in src/him/i18n/faEnDictionary.ts.
 *
 *   node scripts/i18n/check-missing.mjs           # report, exit 1 if anything is missing
 *   node scripts/i18n/check-missing.mjs --json    # same, as JSON {"<persian>": ""} ready to fill in
 *
 * Add the missing translations to FA_EN (or FA_EN_TEMPLATES for strings with
 * ${…} placeholders, written as {0}, {1}…) in faEnDictionary.ts.
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from '@babel/parser';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const PERSIAN = /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/;
const normalize = s => s
  .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x6f0))
  .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660))
  .replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9')
  .replace(/[\u200E\u200F]/g, '').replace(/\s+/g, ' ').trim();

// Read dictionary keys straight from the TS source (it is plain JSON-shaped data).
const dictSrc = readFileSync(join(ROOT, 'src/him/i18n/faEnDictionary.ts'), 'utf8');
const exactStart = dictSrc.indexOf('= {', dictSrc.indexOf('FA_EN:')) + 2;
const exactJson = dictSrc.slice(exactStart, dictSrc.indexOf('\n};', exactStart) + 2);
const templStart = dictSrc.indexOf('= [', dictSrc.indexOf('FA_EN_TEMPLATES')) + 2;
const templJson = dictSrc.slice(templStart, dictSrc.lastIndexOf(']') + 1);
const exact = new Set(Object.keys(JSON.parse(exactJson)));
const templates = new Set(JSON.parse(templJson).map(([fa]) => fa));

const files = [];
for (const dir of ['src/him', 'src/routes']) (function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) { if (!['tests', 'i18n'].includes(name)) walk(p); }
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(p);
  }
})(join(ROOT, dir));

const missing = new Map();
const note = (text, kind, file) => {
  const key = normalize(text);
  if (!PERSIAN.test(key)) return;
  if (kind === 'exact' ? exact.has(key) : templates.has(key)) return;
  if (!missing.has(key)) missing.set(key, relative(ROOT, file));
};

for (const file of files) {
  const ast = parse(readFileSync(file, 'utf8'), {sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true});
  (function visit(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'ImportDeclaration') return;
    if (node.type === 'StringLiteral' || node.type === 'JSXText') note(node.value, 'exact', file);
    if (node.type === 'TemplateLiteral') {
      const quasis = node.quasis.map(q => q.value.cooked ?? q.value.raw);
      if (quasis.length === 1) note(quasis[0], 'exact', file);
      else note(quasis.map((q, i) => (i ? `{${i - 1}}` : '') + q).join(''), 'template', file);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
    }
  })(ast.program);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(Object.fromEntries([...missing.keys()].map(k => [k, ''])), null, 1));
} else if (missing.size) {
  console.log(`${missing.size} Persian string(s) without an English translation:`);
  for (const [k, f] of missing) console.log(`  ${f}: ${k}`);
} else {
  console.log('All Persian UI strings have English translations.');
}
process.exitCode = missing.size ? 1 : 0;
