const CACHE_NAME = 'oakbridge-app-cache-v1';
const DYNAMIC_CACHE_NAME = 'oakbridge-dynamic-cache-v1';

// Cache critical app shell files during install
self.addEventListener('install', (event) => {
     event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
               return cache.addAll([
                    '/',
                    '/index.html',
                    '/logo.jpg',
                    '/icons.svg'
               ]);
          })
     );
     self.skipWaiting();
});

self.addEventListener('activate', (event) => {
     event.waitUntil(
          caches.keys().then((keys) => {
               return Promise.all(
                    keys.map((key) => {
                         if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
                              return caches.delete(key);
                         }
                    })
               );
          })
     );
     self.clients.claim();
});

self.addEventListener('fetch', (event) => {
     const url = new URL(event.request.url);

     // Skip non-GET, API, and cross-origin requests
     if (
          event.request.method !== 'GET' || 
          url.pathname.startsWith('/api/') || 
          url.origin !== self.location.origin
     ) {
          return;
     }

     // Serve index.html shell for page navigations while offline (SPA routing)
     if (event.request.mode === 'navigate') {
          event.respondWith(
               fetch(event.request).catch(() => {
                    return caches.match('/index.html') || caches.match('/');
               })
          );
          return;
     }

     // Cache-First with background dynamic updates (Stale-While-Revalidate)
     event.respondWith(
          caches.match(event.request).then((cachedResponse) => {
               if (cachedResponse) {
                    // Update cache in the background
                    fetch(event.request).then((networkResponse) => {
                         if (networkResponse.status === 200) {
                              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                                   cache.put(event.request, networkResponse);
                              });
                         }
                    }).catch(() => {});
                    return cachedResponse;
               }

               return fetch(event.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                         const responseClone = networkResponse.clone();
                         caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                              cache.put(event.request, responseClone);
                         });
                    }
                    return networkResponse;
               });
          })
     );
});
