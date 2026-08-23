// Web-Push-Anmeldung für den Nachschub-Alarm.
//
// Muss mit VAPID_PUBLIC in api/push/check-reorder.js übereinstimmen — der
// Browser abonniert mit diesem Schlüssel, und der Push-Dienst verwirft eine
// Signatur aus einem anderen Schlüsselpaar genauso wie gar keine.
export const VAPID_PUBLIC_KEY =
  'BEEXWLxBG2R-rcaeXzKajw8hJn2y0kgBZA8rO2C1B7HHz1lgGGjkh-2FjOavp_F0LvfrUCwowGTFOnxOW7YngdQ';

const TABLE = 'coffee_push_subscriptions';

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// base64url -> Uint8Array; pushManager.subscribe() akzeptiert nichts anderes.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

// Der Service Worker der App liegt auf /service-worker.js (CRA registriert ihn
// in index.js). Wir hängen uns an DIESE Registrierung, statt einen zweiten
// Worker im selben Scope anzulegen — der würde den ersten verdrängen.
async function registration() {
  const reg = await navigator.serviceWorker.ready;
  if (!reg) throw new Error('Kein Service Worker aktiv');
  return reg;
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await registration();
  return reg.pushManager.getSubscription();
}

export async function enablePush(supabase) {
  if (!pushSupported()) throw new Error('Dieser Browser kann kein Web Push');
  if (!supabase) throw new Error('Keine Cloud-Verbindung — Nachschub-Alarm braucht Supabase');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(`Benachrichtigungen ${permission}`);

  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const { error } = await supabase.from(TABLE).upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: (navigator.userAgent || '').slice(0, 200),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
  return json.endpoint;
}

export async function disablePush(supabase) {
  const sub = await currentSubscription();
  if (!sub) return false;
  const { endpoint } = sub.toJSON();
  await sub.unsubscribe();
  if (supabase) await supabase.from(TABLE).delete().eq('endpoint', endpoint);
  return true;
}
