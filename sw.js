self.addEventListener('install', e=>{
  e.waitUntil(caches.open('app-v1').then(c=>c.addAll([
    './','./index.html','./app.js','./styles.css','./manifest.webmanifest'
  ])));
});
self.addEventListener('activate', e=>{ self.clients.claim(); });
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(res=>res||fetch(e.request)));
  }else{
    e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));
  }
});
