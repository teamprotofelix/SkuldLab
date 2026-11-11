// A read-only snapshot of the legacy records. Restore is deliberately not implemented
// until the three independent legacy writers can be replaced atomically.
export const LEGACY_KEYS=['skuld_lab_blueprints_v1','skuld_lab_likes_v1','skuld_passport_v2'];
export function makeBackup(storage){
 const records={};
 for(const key of LEGACY_KEYS){
  const value=storage.getItem(key);
  if(value!==null){
   // Do not silently turn malformed existing data into an empty record.
   try{JSON.parse(value);}catch{throw new Error('기존 기록을 읽을 수 없어. 브라우저 데이터를 지우지 말고 확인해 줘.');}
   records[key]=value;
  }else records[key]=null;
 }
 return {format:'skuldlab-research-backup',version:1,exportedAt:new Date().toISOString(),records};
}
