/**
 * sw.js — 키즈핏 성장 연구소 PWA Service Worker
 * Strictly Network-First for HTML/JS/CSS with automatic purge of all legacy caches.
 */

const CACHE_NAME = 'kidsfit-kr-human-v20261118-v4';
const APP_SHELL = [
  '/manifest.json',
  '/samples/app-icon-192.png',
  '/samples/app-icon-512.png',
  '/samples/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
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

  const isCodeOrDoc =
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json');

  event.respondWith(
    fetch(req, isCodeOrDoc ? { cache: 'no-store' } : undefined)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && (url.pathname.startsWith('/samples/app-icon') || url.pathname === '/manifest.json')) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});
