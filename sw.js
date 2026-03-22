/* CoopVault SACCO - Service Worker v4 */
'use strict';
var CACHE='coopvault-v4';
var FILES=['./', './index.html', './manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var url=new URL(e.request.url);
  var same=url.origin===self.location.origin;
  var font=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(!same&&!font) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      if(!r||r.status!==200) return r;
      var clone=r.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,clone);});
      return r;
    }).catch(function(){return caches.match(e.request);})
  );
});