/* CoopVault SACCO — Service Worker
 * Cache-first strategy for full offline capability
 * Version: 1.0 — clean, no dynamic code generation
 */
'use strict';

var CACHE_NAME = 'coopvault-v1';
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

/* Fetch: serve from cache, fall back to network, cache new responses */
self.addEventListener('fetch', function(event) {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;
  /* Only handle same-origin or font requests */
  var url = new URL(event.request.url);
  var isSameOrigin = url.origin === self.location.origin;
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isSameOrigin && !isFont) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        /* Offline fallback */
        return cached || new Response('CoopVault is offline. Open the downloaded index.html directly.', {
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
