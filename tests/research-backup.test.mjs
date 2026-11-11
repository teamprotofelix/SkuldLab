import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDesign, LEGACY_KEYS, makeBackup, parseBackup, restoreBackup, settleVoyage} from '../js/research-backup.js';

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
 settleVoyage(completed,entry);
 settleVoyage(completed,entry);
 assert.deepEqual(completed.log,[entry]);
 const restored = restoreBackup(completed,state());
 assert.equal(restored.test,null);
 assert.deepEqual(restored.log,[entry]);
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
