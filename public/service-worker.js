/* eslint-disable no-restricted-globals */

// v3: v2 hat sich NIE installiert. urlsToCache enthielt '/static/css/main.css'
// und '/static/js/main.js' — CRA erzeugt aber gehashte Namen, beide waren 404.
// cache.addAll() ist atomar: eine fehlende URL lehnt das ganze Promise ab, in
// waitUntil() scheitert damit die Installation, und ein nicht installierter
// Worker wird nie aktiv. Folge: navigator.serviceWorker.ready loeste nie auf.
const CACHE_NAME = 'coffee-tracker-v3';
// Wird beim Aktivieren gemeldet, damit von aussen sichtbar ist, WELCHE Fassung
// auf einem Geraet laeuft. Ohne das ist "der Nutzer hat noch den alten Worker"
// eine Vermutung statt einer Feststellung -- und genau daran haben sich hier
// schon zwei Fehlersuchen aufgehalten. Bei jeder Aenderung hochzaehlen.
const SW_VERSION = 'v3.1-warenkorb-link';

// Nur Adressen, die es sicher gibt. Gehashte Bundles bewusst nicht: ihre Namen
// aendern sich mit jedem Build und muessten hier nachgepflegt werden.
const urlsToCache = ['/', '/manifest.json', '/index.html'];

self.addEventListener('install', event => {
  self.skipWaiting();   // nicht auf das Schliessen aller Tabs warten
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Einzeln statt addAll: ein Fehlschlag darf die Installation nicht
      // mehr verhindern -- genau daran ist v2 gestorben.
      Promise.allSettled(urlsToCache.map(u => cache.add(u)))
    )
  );
});

self.addEventListener('fetch', event => {
  // Seitenaufrufe IMMER zuerst aus dem Netz. index.html verweist auf gehashte
  // Bundle-Namen; aus dem Cache serviert wuerde das Geraet dauerhaft auf einem
  // alten Stand festhaengen (die Stale-Bundle-Falle aus dem Playbook). Cache
  // nur als Rueckfall, wenn kein Netz da ist.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('/')))
    );
    return;
  }
  // Alles andere (gehashte Assets, Bilder) darf cache-first sein: die Namen
  // sind versioniert, ein Treffer ist per Definition der richtige Inhalt.
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  // Fire-and-forget: die Meldung darf die Aktivierung nie aufhalten.
  fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'diag', step: 'sw-activate', message: SW_VERSION }),
  }).catch(() => {});
  event.waitUntil(
    self.clients.claim().then(() => caches.keys()).then(cacheNames => {
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
      actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  // Normaler Tipp und "Zum Warenkorb" fuehren zum Shop -- das ist die Handlung,
  // um die es geht. "App oeffnen" ist die zweite Schaltflaeche.
  const target = event.action === 'app' ? '/' : (data.url || '/');

  let sameOrigin = true;
  try {
    sameOrigin = new URL(target, self.location.origin).origin === self.location.origin;
  } catch (e) {
    sameOrigin = true;
  }

  event.waitUntil((async () => {
    // Externes Ziel: NIE ein vorhandenes App-Fenster fokussieren. Genau das
    // hat den Link vorher verschluckt -- der alte Handler fokussierte immer
    // zuerst und kam an openWindow gar nicht mehr vorbei.
    if (!sameOrigin) return self.clients.openWindow(target);

    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      // startsWith statt includes: die Origin darf nicht bloss irgendwo in der
      // Adresse vorkommen (z.B. als Weiterleitungsparameter).
      if (w.url.startsWith(self.location.origin)) {
        await w.focus();
        return;
      }
    }
    return self.clients.openWindow(target);
  })());
});
