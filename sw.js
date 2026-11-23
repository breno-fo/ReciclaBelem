/**
 * ReciclaBelém - Service Worker para Modo Offline (PWA + Mapa em Cache)
 */

const CACHE_NAME = 'recicla-belem-offline-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/db.js',
  './js/icons.js',
  './js/app.js',
  './data/database.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Tiles do OpenStreetMap: tenta Cache primeiro se já baixado, senão Rede e salva em cache
  if (req.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.ok) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Demais arquivos do App: Network-first com fallback para Cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && req.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
