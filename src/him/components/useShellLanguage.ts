import {useEffect,useState} from 'react';
export type ShellLanguage='fa'|'en';
const KEY='him.ui.language.v1';
function read():ShellLanguage {try{return localStorage.getItem(KEY)==='en'?'en':'fa';}catch{return 'fa';}}
export function setShellLanguage(value:ShellLanguage){try{localStorage.setItem(KEY,value);}catch{/* optional persistence */}window.dispatchEvent(new Event('him:language'));}
export function useShellLanguage():[ShellLanguage,(value:ShellLanguage)=>void]{
 const [lang,setLang]=useState<ShellLanguage>(read);
 useEffect(()=>{const sync=()=>setLang(read());window.addEventListener('him:language',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('him:language',sync);window.removeEventListener('storage',sync);};},[]);
 return [lang,setShellLanguage];
}
export const moduleEnglish:Record<string,string>={EXE:'Executive dashboard',OPS:'Operations',SUP:'Supply and pharmacy',QLT:'Quality and safety',AST:'Assets and facilities',FIN:'Finance and revenue',DAT:'Data Steward',PLT:'Platform and access'};
