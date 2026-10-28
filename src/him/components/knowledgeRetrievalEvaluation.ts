import {normalizeFaSearch} from './faSearch';

/** A local test harness for the *demo* retrieval policy. No claims about production search quality. */
export interface RetrievalEvalDocument {
  id:string; title:string; abstract?:string; category:string; state:string; version:number;
  siteId:string; accessClass?:string; effectiveFrom:string; effectiveTo:string; parentId?:string;
}
export interface RetrievalEvalCase {name:string;query:string;asOf:string;expected:string|null;actual:string|null;passed:boolean;reason:string}
export function evaluateMockRetrieval(items:RetrievalEvalDocument[],siteId:string) {
 const current=items.filter(x=>x.siteId===siteId);
 const usable=(date:string)=>current.filter(d=>d.state==='published_synthetic'&&d.accessClass!=='synthetic_restricted' && d.abstract?.trim() && (!date||(d.effectiveFrom<=date&&d.effectiveTo>=date)) && !current.some(v=>v.parentId===d.id&&v.state==='published_synthetic'));
 const candidates=usable('');
 const cases:Array<{name:string;doc:RetrievalEvalDocument;asOf:string;expected:string|null;reason:string}>=[];
 for(const doc of candidates.slice(0,3))cases.push({name:'ارجاع سند منتشرشده',doc,asOf:doc.effectiveFrom,expected:doc.id,reason:'وجود ارجاع نسخه/صفحه در فیکسچر منتشرشده'});
 const nonpublic=current.filter(d=>d.state!=='published_synthetic'||d.accessClass==='synthetic_restricted');
 for(const doc of nonpublic.slice(0,3))if(!candidates.some(u=>normalizeFaSearch(u.title)===normalizeFaSearch(doc.title)))cases.push({name:'امتناع از پاسخ برای سند فاقد مجوز',doc,asOf:'',expected:null,reason:'نسخه منتشرنشده یا رده restricted نباید به پاسخ برسد'});
 if(candidates.length)cases.push({name:'کنترل تاریخ خارج از اعتبار',doc:candidates[0],asOf:'2100-01-01',expected:null,reason:'جستجوی تاریخ آینده برای مجموعه نمونه باید امتناع کند'});
 const results:RetrievalEvalCase[]=cases.map(x=>{
  const matches=usable(x.asOf).filter(d=>normalizeFaSearch(d.title+' '+d.category+' '+(d.abstract||'')).includes(normalizeFaSearch(x.doc.title)));
  const actual=matches[0]?.id||null;
  return {name:x.name,query:x.doc.title,asOf:x.asOf,expected:x.expected,actual,passed:actual===x.expected,reason:x.reason};
 });
 const positive=results.filter(x=>x.expected!==null);
 const negative=results.filter(x=>x.expected===null);
 return {results,total:results.length,passed:results.filter(x=>x.passed).length,
   recallAt1:positive.length?positive.filter(x=>x.passed).length/positive.length:null,
   abstentionAccuracy:negative.length?negative.filter(x=>x.passed).length/negative.length:null,
   citationCoverage:positive.length?positive.filter(x=>x.actual!==null).length/positive.length:null};
}
