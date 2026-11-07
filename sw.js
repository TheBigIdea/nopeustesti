'use strict';

// Offline support: the whole app is a handful of static files, cached on
// install. The page itself is network-first (a new version shows up on the
// first launch after a deploy; the cached copy is used offline or if the
// network is slow). Other files are served from the cache and refreshed in
// the background (stale-while-revalidate). Bump CACHE_VERSION when the file
// list changes.
const CACHE_VERSION = 'v3';
const NETWORK_TIMEOUT_MS = 3000; // page falls back to the cache after this
const CACHE_NAME = `nopeustesti-${CACHE_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './fonts/bungee-latin.woff2',
  './fonts/rubik-latin.woff2',
  './fonts/share-tech-mono-latin.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Drop caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('nopeustesti-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // ignoreSearch: "?debug" etc. still hit the cached page.
    const cached = await cache.match(request, { ignoreSearch: true });
    const refresh = fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => undefined);

    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }
    return (await refresh) ?? Response.error();
  })());
});

// The page: try the network first so a deploy shows up immediately; fall back
// to the cached copy when offline or when the network takes too long.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const network = fetch(request, { cache: 'no-cache' })
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  const response = await Promise.race([network, timeout]);
  if (response) return response;
  const cached = await cache.match(request, { ignoreSearch: true })
    ?? await cache.match('./index.html');
  return cached ?? (await network) ?? Response.error();
}
