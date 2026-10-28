const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const code=ts.transpileModule(fs.readFileSync(__dirname+'/../src/him/executive/taskProjection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let overrides=[];const mod={exports:{}};
vm.runInNewContext(code,{module:mod,exports:mod.exports,require:()=>({demoStore:{tasks:()=>overrides}})});
const {canonicalTasks,unfinishedTask}=mod.exports;
const tasks=[{id:'t1',siteId:'SITE-TALEGHANI',status:'open',alertId:'ALR-1001'},{id:'t2',siteId:'SITE-TALEGHANI',status:'done'}];
assert.equal(canonicalTasks(tasks).filter(t=>unfinishedTask(t.status)).length,1);
overrides=[{id:'t1',siteId:'SITE-TALEGHANI',status:'completed'}];
assert.equal(canonicalTasks(tasks).find(t=>t.id==='t1').status,'completed');
assert.equal(canonicalTasks(tasks).filter(t=>unfinishedTask(t.status)).length,0);
assert.equal(canonicalTasks(tasks).length,2);
assert.equal(tasks[0].status,'open'); // source object remains unchanged
console.log('PASS canonical Phase6 override; completed excluded; no duplicate; legacy source unchanged');
