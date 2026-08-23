/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'coffee-tracker-v2';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/* ---- Web Push: Nachschub-Alarm -------------------------------------------
   Bewusst HIER und nicht in einer eigenen /sw.js: die App registriert diesen
   Worker in index.js im Root-Scope. Ein zweiter Worker mit demselben Scope
   würde diesen ersetzen und das Offline-Caching mitnehmen. */

self.addEventListener('push', event => {
  let data = { title: 'Coffee Tracker', body: 'Nachschub prüfen' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // Nicht-JSON-Payload: Standardtext behalten statt die Meldung zu verlieren
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'coffee-reorder',
      renotify: true,
      requireInteraction: !!data.requireInteraction,
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(wins => {
        for (const w of wins) {
          if (w.url.includes(self.location.origin)) return w.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
