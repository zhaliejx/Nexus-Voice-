const CACHE_NAME = 'nexus-ai-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  'https://cdn.tailwindcss.com'
];

// Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event: Serve from Cache, fall back to Network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests for complex modules usually, but try to cache if possible
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Optional: Cache new requests dynamically
        return fetchRes;
      });
    })
  );
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});