/** Offline tests of synthetic transforms plus source/compile safety smoke checks. No network. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {transformSync}=require('esbuild');
function transpileSource(file,content){
 return transformSync(content,{sourcefile:file,loader:file.endsWith('.tsx')?'tsx':'ts',format:'cjs',target:'es2022'}).code;
}
const root=path.resolve(__dirname,'..');
let checks=0;
function check(name,condition){assert.ok(condition,name);console.log('PASS',name);checks++}
function syntheticModule(relative){
 const file=path.join(root,relative),content=fs.readFileSync(file,'utf8');
 const transpiled=transpileSource(file,content);
 const module={exports:{}};
 new Function('module','exports','require',transpiled)(module,module.exports,(x)=>{
  if(x==='react')return {default:{},useState:()=>{},useEffect:()=>{}};
  if(x==='react/jsx-runtime')return {jsx:()=>{},jsxs:()=>{}};
  if(x.endsWith('AppContext'))return {useApp:()=>{}};
  if(x.endsWith('mockData'))return {DEMO_USERS:[]};
  throw new Error(`Unexpected dependency in offline module: ${x}`);
 });return module.exports;
}
const {DEMO_DATA_INPUT,runDemoBatch,demoSemanticOccupancy}=syntheticModule('src/him/components/SyntheticDataFlow.tsx');
const batch=runDemoBatch(DEMO_DATA_INPUT);
check('DAT fixture accepts 2 unique events',batch.accepted===2);
check('DAT idempotency counts initial duplicate',batch.duplicate===1);
check('DAT quarantines negative value',batch.quarantined===1);
const replay=runDemoBatch(DEMO_DATA_INPUT,'demo-bed-occupancy',new Set(batch.checkpoint));
check('DAT replay never double counts accepted IDs',replay.accepted===0&&replay.duplicate===3&&replay.quarantined===1);
check('DAT schema mismatch quarantines instead of accepting',runDemoBatch(DEMO_DATA_INPUT,'other').accepted===0);
const metric=demoSemanticOccupancy([{id:'test',connector:'SYN',contract:'demo',startedAt:'2026-10-01T00:00:00Z',status:'simulated',sourceCutoff:'2026-10-01T00:00:00Z',accepted:batch.accepted,duplicate:batch.duplicate,quarantined:batch.quarantined,rows:batch.rows}]);
check('DAT semantic aggregate preserves lineage',metric.value===165&&metric.count===2&&metric.ids.length===2);
const {DEMO_PURCHASE_LINES,inspectSupplier,inspectSupplierVariability}=syntheticModule('src/him/supply/supplierPerformance.ts');
const perf=inspectSupplier(DEMO_PURCHASE_LINES,'risk-supplier');
check('SUP OTIF 2/3 and concentration 60%',perf.eligible===3&&Math.abs(perf.ratio-2/3)<1e-9&&Math.abs(perf.concentration-0.6)<1e-9);
const spread=inspectSupplierVariability(DEMO_PURCHASE_LINES,'risk-supplier');
check('SUP lead-time sample and mean',spread.leadSample===3&&spread.meanDays===7);
check('SUP lead-time sigma',Math.abs(spread.stdDays-Math.sqrt(8/3))<1e-8);
check('SUP quality denominator 37/40',spread.inspected===40&&spread.rejected===3&&Math.abs(spread.passRate-0.925)<1e-9);
const {decideRetention}=syntheticModule('src/him/components/SyntheticRetentionPlan.tsx');
check('PLT legal hold overrides eligibility',decideRetention(150,false,true,90)==='PROTECT_LEGAL_HOLD'&&decideRetention(150,true,false,90)==='PROTECT_LEGAL_HOLD');
check('PLT no actual deletion from evaluation',decideRetention(150,false,false,90)==='ELIGIBLE_FOR_REVIEW_ONLY'&&decideRetention(50,false,false,90)==='RETAIN');
const files={
 '#2':'src/him/components/SpecializedWorkspaces.tsx',
 '#8':'src/him/components/SyntheticDataFlow.tsx',
 '#9':'src/him/phase6/MemoActionHandoff.tsx',
 '#12':'src/him/data/evidenceData.ts',
 '#13':'src/him/components/ControlWorkflows.tsx',
 '#14':'src/him/components/WorkViews.tsx',
 '#15':'src/him/components/DomainWorkspaces.tsx',
 '#20':'src/him/components/SyntheticRetentionPlan.tsx',
 '#23':'src/him/data/evidenceData.ts',
 '#24':'src/him/components/ControlWorkflows.tsx',
 '#26':'src/him/components/ControlWorkflows.tsx',
 '#27':'src/him/components/ControlWorkflows.tsx',
 '#28':'src/him/components/KnowledgeWorkspace.tsx',
 '#29':'src/him/components/KnowledgeWorkspace.tsx',
 '#30':'src/him/components/WorkViews.tsx',
 '#31':'src/him/components/ControlWorkflows.tsx',
 '#35':'src/him/supply/SupplierPerformancePanel.tsx',
};
for(const [id,file] of Object.entries(files))check(`${id} source module exists`,fs.existsSync(path.join(root,file)));
const sources=[...new Set(Object.values(files).concat(['src/him/components/SyntheticRetentionPlan.tsx','src/him/components/SyntheticDataFlow.tsx','src/him/components/DomainWorkspaces.tsx','src/him/components/KnowledgeWorkspace.tsx']))];
for(const file of sources){const full=path.join(root,file);const source=fs.readFileSync(full,'utf8');const result=(()=>{try{transpileSource(full,source);return true;}catch{return false;}})();check(`TS parse ${file}`,result);}
check('KNO only permits positive answer for published demo items',fs.readFileSync(path.join(root,files['#28']),'utf8').includes("d.state==='published_synthetic'"));
check('CTL review avoids author self approval',fs.readFileSync(path.join(root,files['#13']),'utf8').includes('r.actorId!==reviewer.id'));
check('PLT audit does not label output official',fs.readFileSync(path.join(root,files['#31']),'utf8').includes('UNSIGNED_BROWSER_DEMO_NOT_OFFICIAL_AUDIT'));
console.log(`OFFLINE CHECKS PASS: ${checks}`);
