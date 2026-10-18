// Each installed release is atomic. Activate waiting updates only on the visitor's request.
const CACHE='skuldlab-v2.1.0';
const FILES=["./", "./index.html", "./styles.css", "./lab.css", "./app.js", "./js/lab.js", "./js/lab-model.js", "./manifest.webmanifest", "./js/pwa.js", "./pwa.css", "./assets/banpei-icon-192.png", "./assets/banpei-icon-512.png", "./assets/banpei-maskable-512.png", "./assets/banpei-apple-180.png", "./assets/alchemy.webp", "./assets/atelier.webp", "./assets/banpei-sprites.webp", "./assets/crew/2b.webp", "./assets/crew/amelia.webp", "./assets/crew/banpei.webp", "./assets/crew/e.webp", "./assets/crew/jarvis.webp", "./assets/crew/marie.webp", "./assets/crew/myr.webp", "./assets/crew/seoah.webp", "./assets/crew/serena.webp", "./assets/crew/skuld.webp", "./assets/crew/urd.webp", "./assets/crew/wanda.webp", "./assets/crew/yor.webp", "./assets/device-banpei-head.webp", "./assets/device-dino-beacon.webp", "./assets/device-emotion-sensor.webp", "./assets/device-gravity-loom.webp", "./assets/device-guardian-link.webp", "./assets/device-pocket-gate.webp", "./assets/device-stellar-drone.webp", "./assets/device-yggdrasil-core.webp", "./assets/gate.webp", "./assets/generated/city.webp", "./assets/generated/dinosaur.webp", "./assets/generated/lab.webp", "./assets/generated/nebula.webp", "./assets/hangar.webp", "./assets/hero.webp", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/reactor.webp", "./assets/robotics.webp", "./assets/skuld-sprites.webp", "./assets/worldtree.webp", "./assets/generated/banpei-flight.webp"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('skuldlab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 const url=new URL(event.request.url);if(!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
  try{const response=await fetch(event.request);return response;}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}
 }));
});
