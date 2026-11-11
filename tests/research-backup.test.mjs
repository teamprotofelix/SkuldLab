import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,LEGACY_KEYS} from '../js/research-backup.js';
const memory=values=>({getItem:key=>values[key]??null});
test('backup preserves exact legacy records without altering their keys',()=>{
 const records={[LEGACY_KEYS[0]]:'[{"id":"a","name":"<img>"}]',[LEGACY_KEYS[1]]:'["banpei-head"]',[LEGACY_KEYS[2]]:'{"done":["blueprint"],"best":3}'};
 const backup=makeBackup(memory(records));assert.equal(backup.version,1);assert.deepEqual(backup.records,records);
});
test('backup preserves absent data and rejects malformed data or inaccessible storage',()=>{
 assert.deepEqual(Object.values(makeBackup(memory({})).records),[null,null,null]);
 assert.throws(()=>makeBackup(memory({[LEGACY_KEYS[0]]:'broken'})),/기존 기록/);
 assert.throws(()=>makeBackup({getItem(){throw Error('denied');}}),/denied/);
});
