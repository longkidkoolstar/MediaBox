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
        // Add other assets you want to cache
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});