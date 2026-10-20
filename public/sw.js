/*
 * Service worker di FarmaCromia — offline first per l'uso al banco.
 *
 * Strategia:
 *  - Navigazioni (document): NETWORK-first con fallback alla cache, così un
 *    sito ripubblicato viene visto appena torna la rete, ma il banco apre
 *    l'app anche a rete caduta.
 *  - Asset con nome hashato (js/css/immagini): CACHE-first, sono immutabili.
 *  - Tutto il resto same-origin: cache-first con popolamento a runtime.
 */
const SHELL = 'farmacromia-shell-v3';
const RUNTIME = 'farmacromia-runtime-v3';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL && key !== RUNTIME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Mai intercettare le API (dati vivi + stream SSE): passano sempre dalla rete.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  // Navigazioni: network-first, fallback alla shell in cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('./index.html').then((hit) => hit || caches.match('./'))
        )
    );
    return;
  }

  // Asset: cache-first con popolamento a runtime.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
