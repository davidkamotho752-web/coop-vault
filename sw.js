/* CoopVault SACCO - Service Worker v3 */
'use strict';
var CACHE = 'coopvault-v3';
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(['./', './index.html', './manifest.json']);
    }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      if(r&&r.status===200){
        var clone=r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request,clone); });
      }
      return r;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});