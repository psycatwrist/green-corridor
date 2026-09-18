/**
 * Green+ Corridor Service Worker for Offline CAD & PWA Installation
 */
const CACHE_NAME = 'gc-driver-v1';
const ASSETS_TO_CACHE = [
  './driver.html',
  './css/driver.css',
  './js/driver.js',
  './js/data.js',
  './js/state.js',
  './lib/leaflet/leaflet.js',
  './lib/leaflet/leaflet.css',
  './lib/leaflet/marker-icon.png',
  './lib/leaflet/marker-shadow.png',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always try network first, fallback to cache for offline CAD operation
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
