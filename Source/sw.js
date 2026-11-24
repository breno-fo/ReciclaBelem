/**
 * ReciclaBelém - Service Worker para Modo Offline (PWA + Mapa em Cache)
 */

const CACHE_NAME = 'recicla-belem-offline-v9';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/db.js',
  './js/icons.js',
  './js/app.js',
  './data/database.json',
  './assets/wallpaper.jpg',
  './assets/materials/compact/plastico.png',
  './assets/materials/compact/papel.png',
  './assets/materials/compact/vidro.png',
  './assets/materials/compact/metal.png',
  './assets/materials/compact/eletronicos.png',
  './assets/materials/compact/oleo.png',
  './assets/materials/compact/pilhas.png',
  './assets/materials/compact/organicos.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Tiles do mapa (OpenStreetMap.de / ArcGIS): tenta Cache primeiro se já baixado, senão Rede e salva em cache
  if (req.url.includes('tile.openstreetmap.') || req.url.includes('server.arcgisonline.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.ok && (networkRes.headers.get('content-type') || '').startsWith('image/')) {
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
