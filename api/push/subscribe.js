/* An-/Abmeldung fuers Web Push — serverseitig.
 *
 * Bewusst NICHT ueber den Browser-Supabase-Client: der schreibt mit dem
 * passkey-abgeleiteten JWT gegen RLS, und dieser JWT ist kurzlebig und liegt im
 * sessionStorage. Faellt er aus, scheitert die Anmeldung fuer den Nutzer
 * ununterscheidbar von "nichts passiert". Hier schreibt die eingeschraenkte
 * Rolle coffee_push, die ohnehin schon fuer den Cron existiert.
 *
 * GET    ?endpoint=…  -> { subscribed: bool }
 * POST   { endpoint, keys:{p256dh, auth} }
 * DELETE ?endpoint=…
 */
const { Client } = require('pg');

// Nur echte Push-Dienste. Ohne diese Pruefung koennte jeder beliebige Zeilen
// in die Tabelle schreiben — der Endpunkt ist absichtlich unauthentifiziert,
// weil der Browser hier keinen brauchbaren Ausweis hat.
const ALLOWED_HOSTS = [
  /(^|\.)fcm\.googleapis\.com$/,
  /(^|\.)android\.googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
  /(^|\.)push\.apple\.com$/,
];

function validEndpoint(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return false;
  }
  return u.protocol === 'https:' && ALLOWED_HOSTS.some(re => re.test(u.hostname));
}

async function connect() {
  if (!process.env.COFFEE_PG_URL) throw new Error('COFFEE_PG_URL ist nicht gesetzt');
  const c = new Client({
    connectionString: process.env.COFFEE_PG_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  return c;
}

module.exports = async function handler(req, res) {
  let client;
  try {
    const qEndpoint = req.query && req.query.endpoint;

    if (req.method === 'GET') {
      if (!qEndpoint) return res.status(400).json({ error: 'endpoint fehlt' });
      client = await connect();
      const { rows } = await client.query(
        'select 1 from coffee_push_subscriptions where endpoint = $1', [qEndpoint]);
      return res.status(200).json({ subscribed: rows.length > 0 });
    }

    if (req.method === 'DELETE') {
      if (!qEndpoint) return res.status(400).json({ error: 'endpoint fehlt' });
      client = await connect();
      const r = await client.query(
        'delete from coffee_push_subscriptions where endpoint = $1', [qEndpoint]);
      return res.status(200).json({ ok: true, removed: r.rowCount });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Diagnose-Meldung: der Client schickt hier, WORAN er gescheitert ist.
    // Ohne das haengt die Fehlersuche daran, dass der Nutzer eine Meldung vom
    // Handy abtippt — was beim ersten Anlauf schon nicht geklappt hat.
    if (body && body.kind === 'diag') {
      client = await connect();
      await client.query(
        `insert into coffee_push_diag (step, message, permission, browser_sub, db_row, user_agent)
         values ($1,$2,$3,$4,$5,$6)`,
        [String(body.step || '').slice(0, 80), String(body.message || '').slice(0, 500),
         String(body.permission || '').slice(0, 20), Boolean(body.browser), Boolean(body.db),
         String(req.headers['user-agent'] || '').slice(0, 200)]);
      return res.status(200).json({ ok: true, logged: true });
    }
    const endpoint = body && body.endpoint;
    const keys = (body && body.keys) || {};
    if (!endpoint || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'endpoint, keys.p256dh und keys.auth noetig' });
    }
    if (!validEndpoint(endpoint)) {
      return res.status(400).json({ error: 'endpoint gehoert zu keinem bekannten Push-Dienst' });
    }

    client = await connect();
    await client.query(
      `insert into coffee_push_subscriptions (endpoint, p256dh, auth, user_agent)
       values ($1, $2, $3, $4)
       on conflict (endpoint) do update
         set p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
      [endpoint, keys.p256dh, keys.auth, String(req.headers['user-agent'] || '').slice(0, 200)]
    );
    // Rueckprobe am Zielobjekt, nicht am Statuscode.
    const { rows } = await client.query(
      'select 1 from coffee_push_subscriptions where endpoint = $1', [endpoint]);
    if (!rows.length) throw new Error('Zeile nach dem Schreiben nicht auffindbar');
    return res.status(200).json({ ok: true, subscribed: true });
  } catch (err) {
    console.error('push/subscribe:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.end().catch(() => {});
  }
};

module.exports.validEndpoint = validEndpoint;
