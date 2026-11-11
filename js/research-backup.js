import {MISSIONS, SECTORS, cleanProgress} from './lab-model.js';

export const LEGACY_KEYS = ['skuld_lab_blueprints_v1', 'skuld_lab_likes_v1', 'skuld_passport_v2'];
const FORMAT = 'skuldlab-research-backup';
const DESIGN_PARTS = {
 chassis: ['banpei', 'drone', 'guardian'],
 core: ['solar', 'plasma', 'tree'],
 module: ['shield', 'thruster', 'scanner'],
};
const INVENTIONS = ['banpei-head','guardian-link','yggdrasil-core','pocket-gate','stellar-drone','dino-beacon','emotion-sensor','gravity-loom'];
export const MAX_BACKUP_BYTES = 2_000_000;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const validDate = value => typeof value === 'string' && value.length <= 30 && Number.isFinite(Date.parse(value));
const unique = values => new Set(values).size === values.length;
const validDesign = value => object(value) && validId(value.id) && validDate(value.created)
 && typeof value.name === 'string' && value.name.length <= 120
 && Object.entries(DESIGN_PARTS).every(([part, ids]) => ids.includes(value[part]))
 && Array.isArray(value.stats) && value.stats.length === 3 && value.stats.every(n => integer(n, 1, 100));
const validTest = value => object(value) && validDesign(value.design) && integer(value.balance, 0, 100)
 && value.score === evaluateDesign(value.design, value.balance).score;
const validLog = value => validTest(value) && value.id === value.design.id
 && SECTORS.some(sector => sector.id === value.sector) && validDate(value.returned)
 && integer(value.fragments, 3, 10000) && integer(value.distance, 0, 1e7)
 && evaluateDesign(value.design, value.balance).pass;

export function evaluateDesign(design, balance) {
 const [power, stability, agility] = design.stats;
 const target = Math.round(25 + power / 2);
 const score = Math.max(0, Math.round(stability * .65 + power * .2 + agility * .15 - Math.abs(balance - target) * .7));
 return {target, score, pass: stability >= 45 && score >= 60};
}

export function settleVoyage(state, entry) {
 if (state.log.some(record => record.id === entry.id)) return false;
 if (!validLog(entry)) throw new Error('귀환 기록을 확인할 수 없어.');
 state.log.unshift(entry);
 state.progress.best = Math.max(state.progress.best, entry.fragments);
 if (entry.fragments >= 10 && !state.progress.done.includes('voyage')) state.progress.done.push('voyage');
 if (state.test?.design.id === entry.id) state.test = null;
 return true;
}

function emptyState() {
 return {version: 1, blueprints: [], likes: [], progress: cleanProgress(null), test: null, log: []};
}

function validate(state) {
 if (!object(state) || state.version !== 1
  || !Array.isArray(state.blueprints) || state.blueprints.length > 30 || !state.blueprints.every(validDesign)
  || !unique(state.blueprints.map(design => design.id))
  || !Array.isArray(state.likes) || !unique(state.likes) || !state.likes.every(id => INVENTIONS.includes(id))
  || !object(state.progress) || !integer(state.progress.best, 0, 1e7) || !Array.isArray(state.progress.done)
  || !unique(state.progress.done) || !state.progress.done.every(id => MISSIONS.some(mission => mission.id === id))
  || (state.test !== null && !validTest(state.test))
  || !Array.isArray(state.log) || state.log.length > 3000 || !state.log.every(validLog)
  || !unique(state.log.map(entry => entry.id))) throw new Error('연구 기록의 버전, 식별자 또는 수치가 올바르지 않아.');
 const design = ({id,created,name,chassis,core,module,stats}) => ({id,created,name,chassis,core,module,stats});
 const trial = value => ({design:design(value.design),balance:value.balance,score:value.score});
 return {
  version:1, blueprints:state.blueprints.map(design), likes:state.likes, progress:cleanProgress(state.progress),
  test:state.test && trial(state.test),
  log:state.log.map(entry => ({...trial(entry),id:entry.id,sector:entry.sector,fragments:entry.fragments,distance:entry.distance,returned:entry.returned})),
 };
}

function parseLegacyRecord(record) {
 if (record === null) return null;
 if (typeof record !== 'string') throw new Error('이전 백업의 기록 형식이 올바르지 않아.');
 return JSON.parse(record);
}

function legacyBackupState(records) {
 const state = emptyState();
 const [blueprints, likes, progress] = LEGACY_KEYS.map(key => parseLegacyRecord(records[key]));
 return validate({...state, blueprints:blueprints ?? [], likes:likes ?? [], progress:progress ?? state.progress});
}

export function readLegacyState(readRecord) {
 const [blueprints, likes, progress] = LEGACY_KEYS.map(key => {
  const raw = readRecord(key);
  try {
   return parseLegacyRecord(raw);
  } catch (error) {
   if (!(error instanceof SyntaxError)) throw error;
   return null;
  }
 });
 const state = emptyState();
 if (Array.isArray(blueprints)) {
  state.blueprints = [...new Map(blueprints.filter(validDesign).map(item => [item.id, item])).values()].slice(0,30);
 }
 if (Array.isArray(likes)) state.likes = [...new Set(likes.filter(id => INVENTIONS.includes(id)))];
 state.progress = cleanProgress(object(progress) ? progress : null);
 state.progress.best = Math.floor(state.progress.best);
 return validate(state);
}

export function parseBackup(source) {
 if (new TextEncoder().encode(source).length > MAX_BACKUP_BYTES) throw new Error('백업은 2MB까지 가져올 수 있어.');
 const backup = JSON.parse(source);
 if (backup?.format !== FORMAT) throw new Error('스쿨드 연구소 전체 백업 파일을 선택해 줘.');
 if (backup.version === 1 && object(backup.records)) return legacyBackupState(backup.records);
 if (backup.version === 2) return validate(backup.state);
 throw new Error('이 백업 버전은 지원하지 않아.');
}

export function makeBackup(state) {
 return {format: FORMAT, version: 2, exportedAt: new Date().toISOString(), state: validate(state)};
}

export function restoreBackup(current, incoming) {
 // Keep settled sortie IDs even when an older backup is restored.
 const records = new Map(current.log.map(entry => [entry.id, entry]));
 for (const entry of incoming.log) if (!records.has(entry.id)) records.set(entry.id, entry);
 const log = [...records.values()].sort((a,b) => b.returned.localeCompare(a.returned));
 const test = records.has(incoming.test?.design.id) ? null : incoming.test;
 return validate({...incoming, test, log});
}

export function createResearchStore(factory, readLegacy, notify = () => {}, name = 'skuldlab-research') {
 let opening;
 function database() {
  opening ??= new Promise((resolve, reject) => {
   const request = factory.open(name, 1);
   request.onupgradeneeded = () => request.result.createObjectStore('records');
   request.onerror = () => reject(request.error);
   request.onsuccess = () => {
    request.result.onversionchange = () => {request.result.close();opening = null;};
    resolve(request.result);
   };
  }).catch(error => { opening = null; throw error; });
  return opening;
 }
 async function update(change = () => {}) {
  const db = await database();
  return new Promise((resolve, reject) => {
   const transaction = db.transaction('records', 'readwrite');
   const store = transaction.objectStore('records');
   const request = store.get('research');
   let result, failure, changed;
   request.onsuccess = () => {
    try {
     const current = request.result ?? readLegacyState(readLegacy);
     const before = JSON.stringify(current);
     result = validate(change(current) ?? current);
     changed = !request.result || before !== JSON.stringify(result);
     if (changed) store.put(result, 'research');
    } catch (error) {
     failure = error;
     transaction.abort();
    }
   };
   transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('저장 작업이 중단됐어.'));
   transaction.oncomplete = () => {
    resolve(result);
    if (changed) notify();
   };
  });
 }
 return {update};
}

let snapshot = emptyState();
const listeners = new Set();
const channel = typeof window !== 'undefined' && typeof BroadcastChannel === 'function'
 ? new BroadcastChannel('skuldlab-research') : null;
const store = createResearchStore(globalThis.indexedDB, key => localStorage.getItem(key), () => channel?.postMessage('change'));

export function researchState() { return snapshot; }
export function onResearchChange(listener) { listeners.add(listener); }

export async function updateResearch(change) {
 snapshot = await store.update(change);
 for (const listener of listeners) listener(snapshot);
 return snapshot;
}

if (typeof window !== 'undefined') {
 const refresh = () => updateResearch().catch(() => {});
 channel?.addEventListener('message', refresh);
 window.addEventListener('focus', refresh);
}
