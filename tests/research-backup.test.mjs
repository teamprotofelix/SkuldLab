import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDesign, LEGACY_KEYS, makeBackup, parseBackup, readLegacyState, restoreBackup, settleVoyage} from '../js/research-backup.js';

const date = '2026-11-11T14:00:00.000Z';
const design = {id:'design-1', created:date, name:'밤페이 / SOLAR', chassis:'banpei', core:'solar', module:'shield', stats:[60,98,52]};
const trial = {design, balance:55, score:84};
const state = () => ({version:1,blueprints:[design],likes:['banpei-head'],progress:{done:['blueprint'],best:3},test:trial,log:[]});
const entry = {...trial,id:design.id,sector:'nebula',fragments:3,distance:200,returned:date};

test('reads the previous JSON format and round trips current backups', () => {
 const legacy = Object.fromEntries(LEGACY_KEYS.map((key,i) => [key, JSON.stringify([state().blueprints,state().likes,state().progress][i])]));
 const imported = parseBackup(JSON.stringify({format:'skuldlab-research-backup',version:1,records:legacy}));
 assert.deepEqual(imported,{...state(),test:null});
 assert.deepEqual(parseBackup(JSON.stringify(makeBackup(state()))),state());
});

test('a damaged legacy category does not block valid records, new writes, or a valid restore', () => {
 const valid = [JSON.stringify([design]), JSON.stringify(['banpei-head']), JSON.stringify({done:['blueprint'],best:2})];
 for (const bad of ['{broken', '{"unexpected":true}']) {
  const records = new Map(LEGACY_KEYS.map((key,i) => [key,valid[i]]));
  records.set(LEGACY_KEYS[1],bad);
  const migrated = readLegacyState(key => records.get(key));
  assert.deepEqual(migrated.blueprints,[design]);
  assert.deepEqual(migrated.progress,{done:['blueprint'],best:2});
  assert.deepEqual(migrated.likes,[]);
  migrated.blueprints.unshift({...design,id:'new-design'});
  assert.equal(makeBackup(migrated).state.blueprints.length,2);
  assert.deepEqual(restoreBackup(migrated,parseBackup(JSON.stringify(makeBackup(state())))),state());
  assert.equal(records.get(LEGACY_KEYS[1]),bad);
  assert.throws(() => parseBackup(JSON.stringify({
   format:'skuldlab-research-backup',version:1,records:Object.fromEntries(records)
  })));
 }
});

test('legacy migration isolates damage in either of the other two categories', () => {
 const values = ['{"invalid":"blueprints"}', '["banpei-head"]', '{"done":["blueprint"],"best":7}'];
 const read = key => values[LEGACY_KEYS.indexOf(key)];
 assert.deepEqual(readLegacyState(read).blueprints,[]);
 assert.equal(readLegacyState(read).progress.best,7);
 values[0] = JSON.stringify([design]);
 values[2] = '[';
 const migrated = readLegacyState(read);
 assert.deepEqual(migrated.blueprints,[design]);
 assert.deepEqual(migrated.likes,['banpei-head']);
 assert.deepEqual(migrated.progress,{done:[],best:0});
});

test('rejects unsupported, invalid, oversized, and forged duplicate records', () => {
 const input = makeBackup(state());
 assert.throws(() => parseBackup(JSON.stringify({...input,version:99})));
 assert.throws(() => parseBackup(JSON.stringify({...input,state:{...state(),likes:['unknown']}})));
 assert.throws(() => parseBackup(JSON.stringify({...input,state:{...state(),test:{...trial,balance:101}}})));
 assert.throws(() => parseBackup(JSON.stringify({...input,state:{...state(),log:[entry,entry]}})));
 assert.throws(() => parseBackup(' '.repeat(2_000_001)),/2MB/);
});

test('power distribution changes the trial and return rewards cannot be replayed through restore', () => {
 assert.equal(evaluateDesign(design,55).pass,true);
 assert.equal(evaluateDesign(design,0).pass,false);
 const completed = state();
 completed.progress.best = 2;
 assert.equal(settleVoyage(completed,entry),true);
 assert.equal(completed.progress.best,3);
 for (const fragments of [4,12]) {
  assert.equal(settleVoyage(completed,{...entry,sector:'city',fragments}),false);
 }
 assert.deepEqual(completed.log,[entry]);
 assert.deepEqual(completed.progress,{done:['blueprint'],best:3});
 const restored = restoreBackup(completed,state());
 assert.equal(restored.test,null);
 assert.deepEqual(restored.log,[entry]);
});

test('only an accepted return completes the ten-fragment mission', () => {
 const completed = state();
 assert.equal(settleVoyage(completed,{...entry,fragments:10}),true);
 assert.equal(completed.progress.best,10);
 assert.deepEqual(completed.progress.done,['blueprint','voyage']);
});

test('research flights hold their selected route and use the tested handling', async () => {
 const {Voyage, SECTORS} = await import('../js/lab-model.js');
 for (const [sector, route] of SECTORS.entries()) {
  const steady = new Voyage(() => .5), agile = new Voyage(() => .5);
  steady.research = {handling:.8,impact:20};
  agile.research = {handling:1.2,impact:12};
  steady.sector = agile.sector = sector;
  steady.mode = agile.mode = 'manual';
  steady.clock = agile.clock = 35;
  steady.step(.05,{down:true});
  agile.step(.05,{down:true});
  assert.equal(SECTORS[steady.sector].id,route.id);
  assert.equal(agile.sector,sector);
  assert.ok(agile.y > steady.y);
 }
});
