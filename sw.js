/* CoopVault SACCO — Service Worker
 * Cache-first strategy for full offline capability
 * Version: 2.0 — updated cache busting
 */
'use strict';

var CACHE_NAME = 'coopvault-v2';
var CORE_ASSETS = [
  './',
  './index.html'
];

/* Install: cache the app shell */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean up old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: network first, fall back to cache */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  var isSameOrigin = url.origin === self.location.origin;
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isSameOrigin && !isFont) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (!response || response.status !== 200) return response;
      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
