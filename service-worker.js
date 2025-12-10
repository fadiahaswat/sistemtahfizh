const CACHE_NAME = 'setorin-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './data-hafalan.js',
  // HAPUS ATAU COMMENT BARIS DI BAWAH INI:
  // 'https://cdn.tailwindcss.com',
  // 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  // 'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Install Service Worker & Cache File
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Strategy: Stale-While-Revalidate
// (Pakai cache dulu biar cepat, tapi tetap cek server untuk update di background)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
