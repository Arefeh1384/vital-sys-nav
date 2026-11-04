import {useEffect,useState} from 'react';
/** Presentation only. Unknown/partial timestamps are not silently reinterpreted. */
const normalizeDigits=(v:string)=>v.replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)>=0?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export function parseDemoDate(input:string):Date|null {
 const text=normalizeDigits(input.trim());
 const match=/^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s*[-–]\s*(\d{1,2}):(\d{2}))?$/.exec(text);
 if(match){
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  // Demo wall-clock times are Asia/Tehran (UTC+03:30, no DST since 2022).
  const minutes=match[4]!==undefined?Number(match[4])*60+Number(match[5])-210:0;
  if(year<1300||year>1500||month<1||month>12||day<1||day>31)return null;
  const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
  const start=Date.UTC(year+621,2,18);
  for(let i=0;i<370;i++){
   const date=new Date(start+i*86400000),parts=fmt.formatToParts(date);
   const num=(type:string)=>Number(parts.find(x=>x.type===type)?.value||'-1');
   if(num('year')===year&&num('month')===month&&num('day')===day)return new Date(date.getTime()+minutes*60000);
  }
  return null;
 }
 const parsed=Date.parse(text);return Number.isFinite(parsed)?new Date(parsed):null;
}
export function formatPreferredDate(input:string,language:'fa'|'en'){
 const parsed=parseDemoDate(input);if(!parsed)return input;
 let cal='persian',zone='Asia/Tehran';
 try{if(localStorage.getItem('him.ui.calendar')==='gregory')cal='gregory';if(localStorage.getItem('him.ui.timeZone')==='UTC')zone='UTC';}catch{}
 const timed=input.includes('T')||/\d:\d/.test(normalizeDigits(input));
 return new Intl.DateTimeFormat(language==='en'?'en-US':'fa-IR',{calendar:cal,timeZone:zone,year:'numeric',month:'short',day:'numeric',...(timed?{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}:{})}).format(parsed)+(timed&&zone==='UTC'?' UTC':'');
}
/** Formats every demo date inside a label (e.g. «سررسید ۱۴۰۵/۰۷/۲۳») with the user's calendar, zone and language. */
export function formatDatesIn(text:string,language:'fa'|'en'){
 return text.replace(/[0-9۰-۹٠-٩]{4}\/[0-9۰-۹٠-٩]{1,2}\/[0-9۰-۹٠-٩]{1,2}(?:\s*[-–]\s*[0-9۰-۹٠-٩]{1,2}:[0-9۰-۹٠-٩]{2})?/g,m=>formatPreferredDate(m,language));
}

/** Re-render open detail screens immediately when the header preferences change. */
export function useDisplayPreferencesRevision(){
 const [,setVersion]=useState(0);
 useEffect(()=>{const changed=()=>setVersion(x=>x+1);window.addEventListener('him:preferences',changed);window.addEventListener('storage',changed);return()=>{window.removeEventListener('him:preferences',changed);window.removeEventListener('storage',changed);};},[]);
}
