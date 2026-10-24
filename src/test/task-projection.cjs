const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');

const source = fs.readFileSync(
  path.join(__dirname, '../him/executive/taskProjection.ts'),
  'utf8'
);

const code = esbuild.transformSync(source, {
  loader: 'ts',
  format: 'cjs',
  target: 'es2022'
}).code;

let overrides = [];
const mod = { exports: {} };

vm.runInNewContext(code, {
  module: mod,
  exports: mod.exports,
  require: () => ({
    demoStore: { tasks: () => overrides }
  })
});

const { canonicalTasks, unfinishedTask } = mod.exports;

const tasks = [
  {
    id: 't1',
    siteId: 'SITE-TALEGHANI',
    status: 'open',
    alertId: 'ALR-1001'
  },
  {
    id: 't2',
    siteId: 'SITE-TALEGHANI',
    status: 'done'
  }
];

assert.equal(
  canonicalTasks(tasks).filter(t => unfinishedTask(t.status)).length,
  1
);

overrides = [
  {
    id: 't1',
    siteId: 'SITE-TALEGHANI',
    status: 'completed'
  }
];

assert.equal(
  canonicalTasks(tasks).find(t => t.id === 't1').status,
  'completed'
);

assert.equal(
  canonicalTasks(tasks).filter(t => unfinishedTask(t.status)).length,
  0
);

assert.equal(canonicalTasks(tasks).length, 2);
assert.equal(tasks[0].status, 'open');

console.log(
  'PASS canonical Phase6 override; completed excluded; no duplicate; legacy source unchanged'
);