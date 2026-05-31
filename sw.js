// CryptoVault — Service Worker
// Caches the app shell so it runs 100% offline after the first load.
// Running from the cached https:// origin preserves the secure context,
// which is what allows the camera (getUserMedia) to work offline.

const CACHE = 'cryptovault-v1';
const ASSETS = [
  './',
  './index.html',
  './sw.js'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Cache-first: always serve from cache when available (true offline),
// fall back to network only for anything not cached.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(resp) {
        return caches.open(CACHE).then(function(cache) {
          try { cache.put(event.request, resp.clone()); } catch (e) {}
          return resp;
        });
      }).catch(function() { return cached; });
    })
  );
});