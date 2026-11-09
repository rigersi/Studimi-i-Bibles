const V="ura-v6",SHELL=["./","index.html","content.json","manifest.webmanifest","apple-touch-icon.png","favicon-32.png","icon-192.png","icon-512.png","icon-maskable-512.png","ura-logo.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* only complete, successful (200) responses are cached; partial (206) or error responses would make cache.put throw */
const keep=(r,n)=>{if(n&&n.ok&&n.status===200){const c=n.clone();caches.open(V).then(x=>x.put(r,c)).catch(()=>{})}return n};
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==location.origin)return;
/* cross-references and icons rarely change: cache first. Everything else: network first, cached copy when offline. */
if(/\/(crossrefs\/|(apple-touch-icon|favicon-32|icon-192|icon-512|icon-maskable-512|ura-logo)\.png)/.test(u.pathname)){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>keep(r,n))));return}
e.respondWith(fetch(r).then(n=>keep(r,n)).catch(()=>caches.match(r).then(h=>h||(r.mode==="navigate"?caches.match("index.html"):Response.error()))))});
