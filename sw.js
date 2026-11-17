const V="ura-v34",SHELL=["./","index.html","content.json","manifest.webmanifest","apple-touch-icon.png","favicon-32.png","icon-192.png","icon-512.png","icon-maskable-512.png","ura-logo.png","assets/desk-view.webp","assets/study-scene-en.webp","assets/study-scene-sq.webp","assets/desk-portrait.webp","assets/study-portrait-fixed-sq.webp","assets/study-portrait-fixed-en.webp","assets/close-portrait-sq.webp","assets/close-portrait-en.webp","assets/desk-close-sq.webp","assets/desk-close-en.webp","assets/scripture-universe.webp","assets/scripture-portrait.webp","assets/discovery-portrait.webp","assets/discovery-scene.webp","assets/crossref-visualization.json","assets/showcase3d.js","assets/showcase3d.js?v=31","assets/three.module.min.js"];
// All bundled references are installed together with the app; no book must be visited first.
const CROSSREFS=["crossrefs/1Chr.json","crossrefs/1Cor.json","crossrefs/1John.json","crossrefs/1Kgs.json","crossrefs/1Pet.json","crossrefs/1Sam.json","crossrefs/1Thess.json","crossrefs/1Tim.json","crossrefs/2Chr.json","crossrefs/2Cor.json","crossrefs/2John.json","crossrefs/2Kgs.json","crossrefs/2Pet.json","crossrefs/2Sam.json","crossrefs/2Thess.json","crossrefs/2Tim.json","crossrefs/3John.json","crossrefs/Acts.json","crossrefs/Amos.json","crossrefs/Col.json","crossrefs/Dan.json","crossrefs/Deut.json","crossrefs/Eccl.json","crossrefs/Eph.json","crossrefs/Esth.json","crossrefs/Exod.json","crossrefs/Ezek.json","crossrefs/Ezra.json","crossrefs/Gal.json","crossrefs/Gen.json","crossrefs/Hab.json","crossrefs/Hag.json","crossrefs/Heb.json","crossrefs/Hos.json","crossrefs/Isa.json","crossrefs/Jas.json","crossrefs/Jer.json","crossrefs/Job.json","crossrefs/Joel.json","crossrefs/John.json","crossrefs/Jonah.json","crossrefs/Josh.json","crossrefs/Jude.json","crossrefs/Judg.json","crossrefs/Lam.json","crossrefs/Lev.json","crossrefs/Luke.json","crossrefs/Mal.json","crossrefs/Mark.json","crossrefs/Matt.json","crossrefs/Mic.json","crossrefs/Nah.json","crossrefs/Neh.json","crossrefs/Num.json","crossrefs/Obad.json","crossrefs/Phil.json","crossrefs/Phlm.json","crossrefs/Prov.json","crossrefs/Ps.json","crossrefs/Rev.json","crossrefs/Rom.json","crossrefs/Ruth.json","crossrefs/Song.json","crossrefs/Titus.json","crossrefs/Zech.json","crossrefs/Zeph.json"];
async function installOffline(){
 const cache=await caches.open(V);
 try{
  await cache.addAll([...SHELL,...CROSSREFS]);
  // Cache locally hosted, published resource files as well. External links remain online-only.
  const content=await (await cache.match("content.json")).json(),scope=new URL(self.registration.scope);
  const assets=new Set();for(const r of content.resources||[]){if(r.status!=="published")continue;for(const value of [r.image,r.url]){if(typeof value!=="string"||!value.trim())continue;try{const u=new URL(value,scope);if(u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)){u.hash="";assets.add(u.href)}}catch(e){}}}
  if(assets.size)await cache.addAll([...assets]);
 }catch(error){await caches.delete(V);throw error}
}
self.addEventListener("install",e=>{e.waitUntil(installOffline().then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("ura-")&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* only complete, successful (200) responses are cached; partial (206) or error responses would make cache.put throw */
const keep=(r,n)=>{if(n&&n.ok&&n.status===200){const c=n.clone();caches.open(V).then(x=>x.put(r,c)).catch(()=>{})}return n};
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==location.origin)return;
/* cross-references and icons rarely change: cache first. Everything else: network first, cached copy when offline. */
if(/\/(crossrefs\/|(apple-touch-icon|favicon-32|icon-192|icon-512|icon-maskable-512|ura-logo)\.png)/.test(u.pathname)){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>keep(r,n))));return}
e.respondWith(fetch(r).then(n=>keep(r,n)).catch(()=>caches.match(r).then(h=>h||(r.mode==="navigate"?caches.match("index.html"):Response.error()))))});
