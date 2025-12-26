# Implementierungsplan: Vollständige Offline-Funktionalität

## Übersicht

Dieser Plan beschreibt wie die Coffee Tracker App vollständige Offline-Funktionalität erhalten kann.

## Phase 1: Service Worker Verbesserung (Priorität 1)

### 1.1 Workbox Integration

**Warum:** Workbox ist die empfohlene Lösung von Google für Service Worker mit vielen eingebauten Features.

**Schritte:**
```bash
npm install --save-dev workbox-webpack-plugin
```

**Änderungen:**
- Create React App nutzt bereits webpack, wir können Workbox in `src/service-worker.js` nutzen
- Oder `react-app-rewired` nutzen um die webpack Config zu erweitern

### 1.2 Caching Strategie

**Empfohlene Strategien:**

1. **Cache First (für statische Assets):**
   - JS, CSS, Bilder, Fonts
   - Schnell laden, selten ändern

2. **Network First (für Daten):**
   - Supabase API calls
   - Fallback zu Cache wenn offline

3. **Stale While Revalidate (für semi-statische Daten):**
   - Manifest, Icons

**Beispiel Service Worker mit Workbox:**
```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all build artifacts
precacheAndRoute(self.__WB_MANIFEST);

// Cache API requests with Network First strategy
registerRoute(
  ({ url }) => url.origin === 'https://your-project.supabase.co',
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);
```

## Phase 2: Offline Write Queue (Priorität 1)

### 2.1 Queue System implementieren

**Neue Datei: `src/services/offlineQueue.js`**

```javascript
const QUEUE_KEY = 'coffeeTrackerOfflineQueue';

export class OfflineQueue {
  constructor() {
    this.queue = this._loadQueue();
  }

  _loadQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _saveQueue() {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }

  add(operation) {
    this.queue.push({
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...operation
    });
    this._saveQueue();
  }

  getAll() {
    return [...this.queue];
  }

  remove(id) {
    this.queue = this.queue.filter(op => op.id !== id);
    this._saveQueue();
  }

  clear() {
    this.queue = [];
    this._saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();
```

### 2.2 CoffeeService erweitern

**Änderungen in `src/services/coffeeService.js`:**

```javascript
import { offlineQueue } from './offlineQueue';

// In addCoffee, updateCoffee, deleteCoffee:
async addCoffee(coffee) {
  if (this.useCloud) {
    try {
      // Try cloud first
      const result = await this._addToCloud(coffee);
      return result;
    } catch (error) {
      console.error('Error adding coffee to Supabase:', error);

      // Queue for later sync
      offlineQueue.add({
        type: 'ADD',
        data: coffee
      });

      // Save to localStorage immediately
      return this._addToLocalStorage(coffee);
    }
  } else {
    return this._addToLocalStorage(coffee);
  }
}
```

## Phase 3: Background Sync (Priorität 2)

### 3.1 Background Sync API nutzen

**Im Service Worker:**
```javascript
// Register for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-coffees') {
    event.waitUntil(syncPendingOperations());
  }
});

async function syncPendingOperations() {
  // Get operations from queue
  // Try to sync each one
  // Remove successful operations
  // Keep failed ones for next sync
}
```

### 3.2 Online/Offline Detection

**Neue Datei: `src/hooks/useOnlineStatus.js`**

```javascript
import { useState, useEffect } from 'react';
import { offlineQueue } from '../services/offlineQueue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState(0);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Trigger sync when coming online
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-coffees');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending operations count
    const updatePending = () => {
      setPendingOps(offlineQueue.getAll().length);
    };

    updatePending();
    const interval = setInterval(updatePending, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingOps };
}
```

## Phase 4: UI Improvements (Priorität 2)

### 4.1 Offline-Status Anzeige

**In App.js hinzufügen:**

```javascript
import { useOnlineStatus } from './hooks/useOnlineStatus';

function App() {
  const { isOnline, pendingOps } = useOnlineStatus();

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Offline-Modus</p>
          <p>Ihre Änderungen werden synchronisiert wenn die Verbindung wiederhergestellt ist.</p>
          {pendingOps > 0 && (
            <p className="text-sm mt-1">{pendingOps} ausstehende Änderungen</p>
          )}
        </div>
      )}

      {/* Rest of the app */}
    </div>
  );
}
```

### 4.2 Sync Status Indicator

**Komponente für Sync-Status:**
```javascript
function SyncIndicator({ isOnline, pendingOps, isSyncing }) {
  if (isOnline && pendingOps === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4">
      {isSyncing ? (
        <div className="flex items-center">
          <Loader className="animate-spin mr-2" />
          <span>Synchronisiere...</span>
        </div>
      ) : pendingOps > 0 ? (
        <div className="flex items-center text-yellow-600">
          <Cloud className="mr-2" />
          <span>{pendingOps} ausstehende Änderungen</span>
        </div>
      ) : null}
    </div>
  );
}
```

## Phase 5: Testing (Priorität 3)

### 5.1 Manuelle Tests

**Test-Szenarien:**
1. App offline laden (mit Service Worker Cache)
2. App online laden, dann offline gehen
3. Daten hinzufügen während offline
4. Daten bearbeiten während offline
5. Daten löschen während offline
6. Wieder online gehen und Sync beobachten
7. Konflikte testen (gleiche Daten auf zwei Geräten ändern)

### 5.2 Chrome DevTools

**Tools nutzen:**
- Application > Service Workers
- Application > Cache Storage
- Application > Local Storage
- Network > Offline Modus simulieren

### 5.3 Automatisierte Tests

**Mit Cypress:**
```javascript
describe('Offline functionality', () => {
  it('should cache app and work offline', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for service worker

    // Go offline
    cy.window().then(win => {
      win.dispatchEvent(new Event('offline'));
    });

    // Reload should still work
    cy.reload();
    cy.contains('Coffee Tracker').should('be.visible');
  });
});
```

## Geschätzter Aufwand

| Phase | Aufwand | Komplexität |
|-------|---------|-------------|
| Phase 1: Service Worker | 4-6 Stunden | Mittel |
| Phase 2: Offline Queue | 6-8 Stunden | Hoch |
| Phase 3: Background Sync | 4-6 Stunden | Hoch |
| Phase 4: UI Improvements | 2-4 Stunden | Niedrig |
| Phase 5: Testing | 4-6 Stunden | Mittel |
| **Gesamt** | **20-30 Stunden** | **Hoch** |

## Technologie-Alternativen

### Option A: Workbox (Empfohlen)
- ✅ Bewährt, gut dokumentiert
- ✅ Von Google unterstützt
- ✅ Viele eingebaute Strategien
- ❌ Zusätzliche Abhängigkeit

### Option B: Custom Service Worker
- ✅ Keine Abhängigkeiten
- ✅ Volle Kontrolle
- ❌ Mehr Arbeit
- ❌ Fehleranfälliger

### Option C: PouchDB + CouchDB
- ✅ Eingebaute Sync
- ✅ Conflict Resolution
- ❌ Große Umstellung (weg von Supabase)
- ❌ Komplexer

## Empfehlung

**Für diese App: Option A (Workbox)**

Workbox bietet den besten Balance zwischen Funktionalität und Aufwand. Es integriert sich gut mit Create React App und bietet alle benötigten Features out-of-the-box.

## Nächste Schritte

1. ✅ Analyse abgeschlossen
2. ⏳ Entscheidung: Sollen wir die Implementierung starten?
3. ⏳ Falls ja: Mit Phase 1 (Service Worker) beginnen
4. ⏳ Iterativ ausrollen und testen
