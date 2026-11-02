/**
 * sw.js — KIDS-FIT Growth Studio Official PWA Service Worker
 * Network-First strategy: guarantees 100% fresh HTML/JS/CSS updates on every visit
 * while enabling native Android WebAPK / Chrome / Samsung Internet / Desktop PWA installation.
 */

const CACHE_NAME = 'kidsfit-pwa-v20261026v37';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/samples/app-icon-192.png',
  '/samples/app-icon-512.png',
  '/samples/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/download/')) return;

  const isCodeOrDoc = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json');

  // Network-first with cache: 'no-store' for code/HTML so updates to kisfitglobal.com are reflected immediately
  event.respondWith(
    fetch(req, isCodeOrDoc ? { cache: 'no-store' } : undefined)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && (url.pathname.startsWith('/samples/app-icon') || url.pathname === '/manifest.json')) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(req).then((cached) => cached || caches.match('/'));
      })
  );
});
