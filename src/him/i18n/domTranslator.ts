/**
 * Keeps the rendered page in the selected UI language.
 *
 * In English mode every text node and user-visible attribute is passed through
 * toEnglishText(); Persian originals are remembered so switching back to
 * Persian restores them exactly. React keeps owning the nodes: it only writes
 * a text node when its own value changes, and the observer re-translates that
 * write. Inputs' values, option values and stored data are never touched.
 */
import {hasPersian, toEnglishText} from './translate';

const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-placeholder', 'aria-valuetext', 'alt'] as const;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'PRE']);
const AUTO_DIR = 'data-i18n-auto-dir';

const textOriginal = new WeakMap<Text, string>();
const textApplied = new WeakMap<Text, string>();
const attrOriginal = new WeakMap<Element, Map<string, string>>();
const attrApplied = new WeakMap<Element, Map<string, string>>();

let observer: MutationObserver | null = null;
let active = false;

function optedOut(e: Element): boolean {
  return e.hasAttribute('data-i18n-skip') || e.getAttribute('translate') === 'no' || e.getAttribute('contenteditable') === 'true';
}

/** Text inside these elements is content (code, typed text), not interface copy. */
function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) if (SKIP_TAGS.has(e.tagName) || optedOut(e)) return true;
  return false;
}

/** Attributes (placeholder, aria-label…) of a textarea are interface copy even though its value is not. */
function attributesSkipped(el: Element): boolean {
  return optedOut(el) || skipped(el.parentElement);
}

/** Text that stays Persian (names or free text not in the dictionary) gets its own direction. */
function isolateResidual(el: Element | null) {
  if (!el || el.hasAttribute('dir')) return;
  el.setAttribute('dir', 'auto');
  el.setAttribute(AUTO_DIR, '');
}

function skippedNoDescend(el: Element): boolean {
  return SKIP_TAGS.has(el.tagName) || optedOut(el);
}

function translateText(node: Text) {
  const current = node.nodeValue ?? '';
  if (textApplied.get(node) === current) return; // our own write
  if (skipped(node.parentElement)) return;
  textOriginal.set(node, current);
  const next = toEnglishText(current);
  textApplied.set(node, next);
  if (next !== current) node.nodeValue = next;
  if (hasPersian(next)) isolateResidual(node.parentElement);
}

function translateAttribute(el: Element, name: string) {
  const current = el.getAttribute(name);
  if (current === null) return;
  const applied = attrApplied.get(el);
  if (applied?.get(name) === current) return;
  if (attributesSkipped(el)) return;
  const next = toEnglishText(current);
  if (!attrOriginal.has(el)) attrOriginal.set(el, new Map());
  if (!attrApplied.has(el)) attrApplied.set(el, new Map());
  attrOriginal.get(el)!.set(name, current);
  attrApplied.get(el)!.set(name, next);
  if (next !== current) el.setAttribute(name, next);
}

function translateElement(el: Element) {
  for (const name of ATTRIBUTES) if (el.hasAttribute(name)) translateAttribute(el, name);
  if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.getAttribute('type') ?? '') && el.hasAttribute('value')) translateAttribute(el, 'value');
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (attributesSkipped(root as Element)) return;
    translateElement(root as Element);
  }
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    // Visit a skipped element itself (for its attributes) but never its children.
    acceptNode: n => (n.parentElement && n.parentElement !== root && skippedNoDescend(n.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
    else translateElement(n as Element);
  }
}

function restoreTree(root: Node) {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  const visit = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      const original = textOriginal.get(t);
      if (original !== undefined && textApplied.get(t) === t.nodeValue && original !== t.nodeValue) t.nodeValue = original;
      textOriginal.delete(t);
      textApplied.delete(t);
      return;
    }
    const el = n as Element;
    const originals = attrOriginal.get(el);
    const applied = attrApplied.get(el);
    if (originals && applied) {
      for (const [name, value] of originals) if (applied.get(name) === el.getAttribute(name)) el.setAttribute(name, value);
    }
    attrOriginal.delete(el);
    attrApplied.delete(el);
    if (el.hasAttribute(AUTO_DIR)) {
      el.removeAttribute(AUTO_DIR);
      el.removeAttribute('dir');
    }
  };
  if (root.nodeType === Node.ELEMENT_NODE) visit(root);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) visit(n);
}

export function startEnglishTranslation(root: Node = document.body) {
  if (active || typeof MutationObserver === 'undefined') return;
  active = true;
  translateTree(root);
  observer = new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'characterData') translateText(r.target as Text);
      else if (r.type === 'attributes' && r.attributeName) translateAttribute(r.target as Element, r.attributeName);
      else r.addedNodes.forEach(n => translateTree(n));
    }
  });
  observer.observe(root, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTES, 'value']});
}

export function stopEnglishTranslation(root: Node = document.body) {
  if (!active) return;
  active = false;
  observer?.disconnect();
  observer = null;
  restoreTree(root);
}
