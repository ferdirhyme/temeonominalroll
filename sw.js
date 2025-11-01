const CACHE_NAME = 'staff-roll-cache-v3'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/ges-logo.svg',
  '/manifest.json'
];

// Install event: opens a cache and adds the core app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: implements a network-first, then cache fallback strategy.
self.addEventListener('fetch', event => {
  // We only apply this strategy to GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Try to fetch from the network first.
    fetch(event.request)
      .then(networkResponse => {
        // If we get a valid response, update the cache with the new version and return it.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
            cache.put(event.request, responseToCache);
          }
        });
        return networkResponse;
      })
      .catch(() => {
        // If the network request fails (e.g., offline), try to serve from the cache.
        return caches.match(event.request);
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});