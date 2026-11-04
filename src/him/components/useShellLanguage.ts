import {useEffect,useState} from 'react';
import {startEnglishTranslation,stopEnglishTranslation} from '../i18n/domTranslator';
import {hasPersian,toEnglishText} from '../i18n/translate';
export type ShellLanguage='fa'|'en';
const KEY='him.ui.language.v1';
function read():ShellLanguage {try{return localStorage.getItem(KEY)==='en'?'en':'fa';}catch{return 'fa';}}
export function getShellLanguage():ShellLanguage{return read();}

let persianTitle:string|null=null;
/**
 * Applies the UI language to the whole document: lang/dir on <html> (so every
 * screen, dialog and portal inherits the same direction) and the English
 * presentation layer. Persian stays the stored/source language (DEC-04).
 */
export function applyDocumentLanguage(lang:ShellLanguage=read()){
 if(typeof document==='undefined')return;
 const root=document.documentElement;
 root.lang=lang==='en'?'en':'fa';
 root.dir=lang==='en'?'ltr':'rtl';
 if(hasPersian(document.title))persianTitle=document.title;
 if(lang==='en'){if(persianTitle)document.title=toEnglishText(persianTitle);if(document.body)startEnglishTranslation(document.body);}
 else{if(document.body)stopEnglishTranslation(document.body);if(persianTitle)document.title=persianTitle;}
}

let installed=false;
/** Installs the document-level language runtime once (safe to call repeatedly). */
export function installShellLanguage(){
 if(installed||typeof window==='undefined')return;
 installed=true;
 applyDocumentLanguage();
 const sync=()=>applyDocumentLanguage();
 window.addEventListener('him:language',sync);
 window.addEventListener('storage',e=>{if(e.key===KEY)sync();});
}

export function setShellLanguage(value:ShellLanguage){try{localStorage.setItem(KEY,value);}catch{/* optional persistence */}applyDocumentLanguage(value);window.dispatchEvent(new Event('him:language'));}
export function useShellLanguage():[ShellLanguage,(value:ShellLanguage)=>void]{
 const [lang,setLang]=useState<ShellLanguage>(read);
 useEffect(()=>{const sync=()=>setLang(read());window.addEventListener('him:language',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('him:language',sync);window.removeEventListener('storage',sync);};},[]);
 return [lang,setShellLanguage];
}
/** For text that never reaches the DOM (window.confirm/alert): Persian source, shown in the active UI language. */
export function uiText(persian:string):string{return read()==='en'?toEnglishText(persian):persian;}
export const moduleEnglish:Record<string,string>={EXE:'Executive dashboard',OPS:'Operations',SUP:'Supply and pharmacy',QLT:'Quality and safety',AST:'Assets and facilities',FIN:'Finance and revenue',DAT:'Data Steward',PLT:'Platform and access'};
