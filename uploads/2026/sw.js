const CACHE = 'finances-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete any old caches from previous versions
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Don't intercept external calls
  if (e.request.url.includes('open.er-api.com') || e.request.url.includes('rsms.me')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200 && e.request.method === 'GET') {
            cache.put(e.request, res.clone());
          }
          return res;
        }).catch(() => cached || new Response('Offline — open while connected first.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        }));
      })
    )
  );
});
