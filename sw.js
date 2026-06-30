// DeepSeek 余额监控 — Service Worker
const CACHE_NAME = 'ds-monitor-v1';
const STATIC_ASSETS = [
  '/deepseek-balance/',
  '/deepseek-balance/index.html',
  '/deepseek-balance/manifest.json',
  '/deepseek-balance/icons/icon-192.png',
  '/deepseek-balance/icons/icon-512.png',
  '/deepseek-balance/icons/icon-180.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', event => {
  // API calls — never cache
  if (event.request.url.includes('api.deepseek.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for static assets
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request);
      })
  );
});
