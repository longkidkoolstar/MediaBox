self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open('media-cache').then((cache) => {
          return cache.addAll([
              '/',
              '/index.html',
              '/css/styles.css',
              '/js/favorites.js',
              '/js/home.js',
              '/js/settings.js',
              '/js/search.js',
          ]);
      })
  );
  self.skipWaiting(); // Force immediate activation
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(
              cacheNames.map((cache) => {
                  if (cache !== 'media-cache') {
                      return caches.delete(cache);
                  }
              })
          );
      })
  );
  clients.claim(); // Take control of all clients
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
      fetch(event.request)
          .then((response) => {
              return caches.open('media-cache').then((cache) => {
                  cache.put(event.request, response.clone());
                  return response;
              });
          })
          .catch(() => caches.match(event.request))
  );
});
