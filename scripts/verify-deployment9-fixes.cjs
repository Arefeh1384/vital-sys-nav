/** Local deterministic tests of newly added *synthetic* helpers. No network, no real data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const transpile=(source,rel)=>{try{return require('esbuild').transformSync(source,{sourcefile:rel,loader:rel.endsWith('.tsx')?'tsx':'ts',format:'cjs',target:'es2022'}).code;}catch{return require('typescript').transpileModule(source,{fileName:rel,compilerOptions:{module:1,target:9}}).outputText;}};
const root=path.resolve(__dirname,'..');
const normalizeFaSearch=s=>s.toLowerCase().replace(/\s+/g,' ').trim();
function load(rel,external={}){
 const source=fs.readFileSync(path.join(root,rel),'utf8');
 const code=transpile(source,rel);
 const mod={exports:{}};
 new Function('module','exports','require',code)(mod,mod.exports,id=>{
  if(id==='./faSearch')return {normalizeFaSearch};
  if(id==='react')return {useEffect:()=>{},useState:()=>{}};
  if(external[id])return external[id];
  throw Error(`Unexpected import ${id} in ${rel}`);
 });
 return mod.exports;
}
const date=load('src/him/components/datePreferences.ts');
const converted=date.parseDemoDate('۱۴۰۵/۰۷/۲۲');assert(converted);assert.equal(converted.toISOString().slice(0,10),'2026-10-14');
assert.equal(date.parseDemoDate('not-a-date'),null);
const evalr=load('src/him/components/knowledgeRetrievalEvaluation.ts');
const docs=[
 {id:'DOC-PUB',title:'Synthetic blue lantern policy',abstract:'blue lantern',category:'policy',state:'published_synthetic',version:1,siteId:'site-a',accessClass:'synthetic_internal',effectiveFrom:'2026-01-01',effectiveTo:'2027-01-01'},
 {id:'DOC-DRAFT',title:'Synthetic unopened page',abstract:'never reveal',category:'policy',state:'review_requested',version:1,siteId:'site-a',accessClass:'synthetic_internal',effectiveFrom:'2026-01-01',effectiveTo:'2027-01-01'},
 {id:'DOC-RESTRICTED',title:'Private fixture',abstract:'no access',category:'policy',state:'published_synthetic',version:1,siteId:'site-a',accessClass:'synthetic_restricted',effectiveFrom:'2026-01-01',effectiveTo:'2027-01-01'},
 ];
const result=evalr.evaluateMockRetrieval(docs,'site-a');
assert.equal(result.total,4);assert.equal(result.passed,4);
assert.equal(result.abstentionAccuracy,1);assert.equal(result.recallAt1,1);
assert.equal(evalr.evaluateMockRetrieval([], 'site-a').total,0);
const gov=load('src/him/components/syntheticDataGovernance.ts');
const c={id:'contract',state:'review_approved_synthetic',reviewedBy:'usr-2',values:{contract_id:'sample_contract',source:'qa_demo_pacs',schema_version:'1',required_fields:'synthetic_id,event_time',dataset:'SYN-PACS'}};
const co={id:'connector',key:'qa_demo_pacs',contract:'sample_contract',status:'active_synthetic',mode:'read_only',freshnessSeconds:'3600',kind:'PACS'};
assert.deepEqual(gov.governedDemoCompatibility(co,c),[]);
assert(gov.governedDemoCompatibility({...co,status:'draft'},c).length>0);
assert(gov.governedDemoCompatibility({...co,contract:'wrong'},c).length>0);
assert(gov.governedDemoCompatibility(co,{...c,reviewedBy:undefined}).length>0);
const detector=load('src/him/components/syntheticDetector.ts');
const d=detector.demoDetectorSummary(new Date('2026-10-28T12:00:00Z'));
assert.equal(d.comparison,'ABOVE_DEMO_UPPER_BOUND');assert.equal(d.freshness,'stale-or-unverified');
console.log('PASS: 11 deterministic smoke assertions (calendar, retrieval, governance, provenance)');
