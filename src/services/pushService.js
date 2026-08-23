// Web-Push-Anmeldung für den Nachschub-Alarm.
//
// Muss mit VAPID_PUBLIC in api/push/check-reorder.js übereinstimmen — der
// Browser abonniert mit diesem Schlüssel, und der Push-Dienst verwirft eine
// Signatur aus einem anderen Schlüsselpaar genauso wie gar keine.
export const VAPID_PUBLIC_KEY =
  'BEEXWLxBG2R-rcaeXzKajw8hJn2y0kgBZA8rO2C1B7HHz1lgGGjkh-2FjOavp_F0LvfrUCwowGTFOnxOW7YngdQ';

const API = '/api/push/subscribe';
const STEP_TIMEOUT_MS = 12000;

async function api(path, opts) {
  const r = await withTimeout(fetch(path, opts), STEP_TIMEOUT_MS, 'Server');
  let body = {};
  try { body = await r.json(); } catch (e) { /* leere Antwort ist ok */ }
  if (!r.ok) throw new Error(body.error || `Server antwortete ${r.status}`);
  return body;
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/* navigator.serviceWorker.ready wird NIE abgelehnt — ohne aktiven Worker hängt
 * es unbegrenzt. Ohne Zeitgrenze passiert dann sichtbar gar nichts: kein
 * Fehler, keine Meldung, der Schalter bleibt einfach stehen. Genau dieser
 * stille Hänger war der erste Fehlversuch am 2026-08-23. */
export function withTimeout(promise, ms, label) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      t = setTimeout(() => reject(new Error(`${label} antwortet nicht (${ms / 1000}s)`)), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

// Der Service Worker der App liegt auf /service-worker.js (index.js registriert
// ihn). Wir hängen uns an DIESE Registrierung, statt einen zweiten Worker im
// selben Scope anzulegen — der würde den ersten samt Offline-Cache verdrängen.
async function registration() {
  const reg = await withTimeout(navigator.serviceWorker.ready, STEP_TIMEOUT_MS, 'Service Worker');
  if (!reg) throw new Error('Kein Service Worker aktiv');
  return reg;
}

export async function browserSubscription() {
  if (!pushSupported()) return null;
  const reg = await registration();
  return reg.pushManager.getSubscription();
}

/* Wahrheit ist die DB-Zeile, nicht das Browser-Abo: der Cron verschickt nur an
 * das, was in der Tabelle steht. Ein Browser-Abo ohne Zeile bedeutet, dass
 * keine Meldung kommt — der Schalter muss dann AUS zeigen. */
export async function pushStatus() {
  const status = { supported: pushSupported(), permission: null, browser: false, db: false, error: null };
  if (!status.supported) return status;
  status.permission = Notification.permission;
  try {
    const sub = await browserSubscription();
    status.browser = Boolean(sub);
    if (sub) {
      const r = await api(`${API}?endpoint=${encodeURIComponent(sub.toJSON().endpoint)}`);
      status.db = Boolean(r.subscribed);
    }
  } catch (e) {
    status.error = e.message;
  }
  return status;
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('Dieser Browser kann kein Web Push');

  const permission = await withTimeout(Notification.requestPermission(), STEP_TIMEOUT_MS, 'Berechtigungsdialog');
  if (permission !== 'granted') throw new Error(`Benachrichtigungen sind "${permission}"`);

  const reg = await registration();
  let sub = await withTimeout(reg.pushManager.getSubscription(), STEP_TIMEOUT_MS, 'Abo-Abfrage');
  if (!sub) {
    sub = await withTimeout(
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }),
      STEP_TIMEOUT_MS,
      'Push-Anmeldung'
    );
  }

  const json = sub.toJSON();
  await api(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  // Rueckprobe am Zielobjekt: erst wenn der Server die Zeile wiederfindet,
  // gilt die Anmeldung als erfolgt.
  const check = await api(`${API}?endpoint=${encodeURIComponent(json.endpoint)}`);
  if (!check.subscribed) throw new Error('Server meldet die Zeile nicht zurueck');

  return json.endpoint;
}

export async function disablePush() {
  const sub = await browserSubscription();
  if (!sub) return false;
  const { endpoint } = sub.toJSON();
  await sub.unsubscribe();
  await api(`${API}?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
  return true;
}
