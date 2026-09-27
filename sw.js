const CACHE='comanda-prime-v13';
const CORE=['/','/index.html','/admin.html','/styles.css','/v2.css','/app.js','/shared.js','/waiter-auth.js','/waiter.js','/admin-auth.js','/admin-access-fix.js','/admin.js','/admin-patch.js','/admin-reset.js','/manifest.json','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(req).then(res=>{
    const copy=res.clone();
    caches.open(CACHE).then(c=>c.put(req,copy));
    return res;
  }).catch(()=>caches.match(req).then(r=>r||caches.match(url.pathname.startsWith('/admin')?'/admin.html':'/index.html'))));
});
