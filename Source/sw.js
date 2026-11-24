/**
 * ReciclaBelém - Service Worker para Modo Offline (PWA + Mapa em Cache)
 */

const CACHE_NAME = 'recicla-belem-shell-v14';
const TILE_CACHE = 'recicla-belem-map-tiles';
const TILE_HOSTS = new Set(['tile.openstreetmap.de', 'server.arcgisonline.com']);
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/mobile.css',
  './css/content-refresh.css',
  './css/map-refresh.css',
  './vendor/plus-jakarta-sans/latin.woff2',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './assets/map/belem-overview.webp',
  './assets/orla-belem.webp',
  './assets/icons/zoom-in.svg',
  './assets/icons/zoom-out.svg',
  './data/belem-map-pack.meta.json',
  './js/db.js',
  './js/icons.js',
  './js/app.js',
  './data/database.json',
  './assets/wallpaper.jpg',
  './assets/icons/mucura-192.png',
  './assets/icons/mucura-512.png',
  './assets/icons/selo-192.png',
  './assets/brand-wordmark.svg',
  './assets/materials/compact/plastico.webp',
  './assets/materials/compact/papel.webp',
  './assets/materials/compact/vidro.webp',
  './assets/materials/compact/metal.webp',
  './assets/materials/compact/eletronicos.webp',
  './assets/materials/compact/oleo.webp',
  './assets/materials/compact/pilhas.webp',
  './assets/materials/compact/organicos.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

async function activate() {
  const tiles = await caches.open(TILE_CACHE);
  for (const name of await caches.keys()) {
    if (/^recicla-belem-offline-v\d+$/.test(name)) {
      const old = await caches.open(name);
      for (const request of await old.keys()) {
        if (!TILE_HOSTS.has(new URL(request.url).hostname)) continue;
        const response = await old.match(request);
        if (response && !(await tiles.match(request))) await tiles.put(request, response);
      }
      await caches.delete(name);
    } else if (name.startsWith('recicla-belem-shell-') && name !== CACHE_NAME) {
      await caches.delete(name);
    }
  }
  await self.clients.claim();
}
self.addEventListener('activate', (event) => event.waitUntil(activate()));

async function getMapTile(request) {
  const cache = await caches.open(TILE_CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && (response.headers.get('content-type') || '').startsWith('image/')) {
    await cache.put(request, response.clone());
  }
  return response;
}

const shellUrls = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (TILE_HOSTS.has(url.hostname)) {
    event.respondWith(getMapTile(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate';
  if (!isNavigation && !shellUrls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && !isNavigation) await cache.put(request, response.clone());
      return response;
    } catch {
      return await cache.match(isNavigation ? './index.html' : request) || Response.error();
    }
  })());
});
