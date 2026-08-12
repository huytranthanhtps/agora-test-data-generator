// Minimal SW: exists only to satisfy Android PWA installability.
// Passthrough fetch, no caching — the site redeploys on every main push, so
// caching here would risk serving stale production assets.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
