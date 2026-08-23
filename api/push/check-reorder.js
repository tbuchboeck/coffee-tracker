/* Nachschub-Alarm: taeglich per Vercel-Cron.
 *
 * Liest den Vorrat aus coffee_stock, rechnet das Leerdatum und schickt bei
 * Faelligkeit Web Push an alle angemeldeten Geraete.
 *
 * CommonJS mit Absicht: package.json hat kein "type":"module", ein
 * `export default` in einer .js waere hier ein Laufzeitfehler.
 */
const { Client } = require('pg');
const webpush = require('web-push');

// Muss mit VAPID_PUBLIC_KEY in src/services/pushService.js uebereinstimmen.
// Der Browser abonniert mit jenem Schluessel; eine Signatur aus einem anderen
// Paar wird vom Push-Dienst genauso verworfen wie gar keine.
const VAPID_PUBLIC =
  'BEEXWLxBG2R-rcaeXzKajw8hJn2y0kgBZA8rO2C1B7HHz1lgGGjkh-2FjOavp_F0LvfrUCwowGTFOnxOW7YngdQ';

// Ziel der Meldung: der vorbereitete Warenkorb, nicht die App. Die Handlung
// ist "bestellen", und die passiert im Shop.
const CART_URL = 'https://www.vettore.at/Warenkorb';

const LEAD_DAYS = 3; // vettore.at: Lieferzeit 1-3 Werktage
const BUFFER_DAYS = 2;
const WARN_AHEAD = 7;

/* Wirft, statt unsigniert zu senden. Ein Stacktrace im Cron-Report schlaegt
 * Stille -- genau diese Stille hat beim dog-food-tracker zwei Monate lang eine
 * tote Zustellstrecke verdeckt. `env` ist Parameter, damit ein Test
 * configureVapid({}) pruefen kann, ohne die echte Umgebung zu beruehren. */
function configureVapid(env = process.env) {
  if (!env.VAPID_PRIVATE_KEY) {
    throw new Error('VAPID_PRIVATE_KEY ist nicht gesetzt — Push kann nicht signiert werden, Zustellung wuerde still fehlschlagen');
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || 'mailto:thomas@buchboeck.at',
    VAPID_PUBLIC,
    env.VAPID_PRIVATE_KEY
  );
  return true;
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
const iso = d => d.toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((a - b) / 86400000);

/* Reine Rechnung, damit sie ohne DB testbar bleibt. */
function evaluate(stock, today) {
  // Bestellung unterwegs: schweigen bis zum erwarteten Liefertag. Ein Melder,
  // der mahnt, was man schon erledigt hat, wird ignoriert -- und dann auch der
  // echte Alarm. Laeuft die Frist ab, ohne dass der Bestand nachgetragen wurde,
  // meldet er wieder: das ist dann der richtige Hinweis ("wo bleibt sie?").
  if (stock.suppress_until) {
    const bis = new Date(`${stock.suppress_until}T00:00:00Z`);
    if (!Number.isNaN(bis.getTime()) && today <= bis) {
      return { tier: 'ordered', suppressedUntil: iso(bis), days: 0, empty: null,
               reorder: null, daysLeft: null, perDay: stock.cups_per_day * stock.grams_per_cup };
    }
  }
  const perDay = stock.cups_per_day * stock.grams_per_cup;
  if (!perDay || perDay <= 0) throw new Error(`Unbrauchbare Verbrauchsrate: ${perDay} g/Tag`);
  const days = Math.floor((stock.bags * stock.bag_grams) / perDay);
  const opened = new Date(`${stock.opened_at}T00:00:00Z`);
  if (Number.isNaN(opened.getTime())) throw new Error(`opened_at unlesbar: ${stock.opened_at}`);
  const empty = addDays(opened, days);
  const reorder = addDays(empty, -(LEAD_DAYS + BUFFER_DAYS));
  const left = dayDiff(empty, today);
  let tier = 'ok';
  if (today >= empty) tier = 'critical';
  else if (today >= reorder) tier = 'urgent';
  else if (today >= addDays(reorder, -WARN_AHEAD)) tier = 'warn';
  return { tier, days, empty: iso(empty), reorder: iso(reorder), daysLeft: left, perDay };
}

function buildPayload(c) {
  // 'ordered' zuerst: dort sind empty/reorder/daysLeft null, und der
  // Standardtext haette daraus "Leer am null (noch null Tage)" gemacht.
  if (c.tier === 'ordered') {
    return {
      title: '☕ Kaffee ist unterwegs',
      body: `Bestellung laeuft, Lieferung erwartet bis ${c.suppressedUntil}. Bis dahin keine Erinnerung.`,
      tag: 'coffee-reorder', requireInteraction: false, url: CART_URL,
      actions: [{ action: 'app', title: 'App oeffnen' }],
    };
  }
  const title = {
    warn: '☕ Kaffee geht zur Neige',
    urgent: '☕ Kaffee bestellen — jetzt',
    critical: '☕ Kaffee ist aus',
  }[c.tier] || '☕ Kaffee';
  const body = c.tier === 'critical'
    ? `Seit ${c.empty} rechnerisch leer. Der Warenkorb bei vettore.at liegt bereit.`
    : `Leer am ${c.empty} (noch ${c.daysLeft} Tage). Bestellen bis ${c.reorder} — Warenkorb liegt bereit.`;
  return {
    title, body, tag: 'coffee-reorder',
    requireInteraction: c.tier !== 'warn',
    url: CART_URL,
    actions: [
      { action: 'cart', title: 'Zum Warenkorb' },
      { action: 'app', title: 'App oeffnen' },
    ],
  };
}

function connectionString(env = process.env) {
  const url = env.COFFEE_PG_URL;
  if (!url) throw new Error('COFFEE_PG_URL ist nicht gesetzt — ohne DB keine Bestandspruefung');
  return url;
}

module.exports = async function handler(req, res) {
  const isTest = req.query && req.query.test === '1';
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  const isCron = Boolean(expected) && req.headers.authorization === expected;
  if (!isCron && !isTest) return res.status(401).json({ error: 'unauthorized' });

  let client;
  try {
    configureVapid();
    // Supabase-Pooler liefert ein selbstsigniertes Zertifikat.
    client = new Client({ connectionString: connectionString(), ssl: { rejectUnauthorized: false } });
    await client.connect();

    const { rows } = await client.query(
      'select opened_at, bags, bag_grams, cups_per_day, grams_per_cup, notified_on, suppress_until from coffee_stock where id = 1'
    );
    // Unbekannter Zustand ist ein Fehler, keine Meldung: lieber ein roter Lauf
    // als ein stiller, der aussieht wie "nichts zu tun".
    if (!rows.length) throw new Error('coffee_stock hat keine Zeile id=1 — Bestand unbekannt');

    const stock = rows[0];
    // Lebenszeichen bei JEDEM Lauf, vor allen frueheren Ausstiegen. notified_on
    // entsteht nur, wenn auch gesendet wurde -- im Normalfall ("noch genug da")
    // gaebe es also gar keine Schreibspur, und ein toter Cron saehe aus wie ein
    // ruhiger. Fuer einen Melder ist das AUSBLEIBEN des erwarteten Schreibens
    // das eigentliche Gesundheitssignal.
    //
    // Bewusst in coffee_push_diag statt in einer neuen Spalte: die Tabelle gibt
    // es schon, die Cron-Rolle darf hineinschreiben (keine Rechteaenderung), und
    // eine Zeile pro Lauf ergibt eine HISTORIE statt nur des letzten Zeitpunkts
    // -- man sieht, was der Cron an jedem Tag entschieden hat.
    if (stock.opened_at instanceof Date) stock.opened_at = iso(stock.opened_at);
    if (stock.suppress_until instanceof Date) stock.suppress_until = iso(stock.suppress_until);
    const today = new Date(`${iso(new Date())}T00:00:00Z`);
    const cond = evaluate(stock, today);
    await client.query(
      "insert into coffee_push_diag (step, message, user_agent) values ('cron-run', $1, $2)",
      [`tier=${cond.tier}${cond.empty ? ` leer=${cond.empty}` : ''}`,
       isTest ? 'test=1' : 'cron']
    );

    if ((cond.tier === 'ok' || cond.tier === 'ordered') && !isTest) {
      return res.json({ ok: true, sent: 0, ...cond });
    }
    // Stummschalter, der sich selbst zuruecksetzt: nur der heutige Tag wird
    // unterdrueckt. Ein haengender Zustand kann den Melder nicht dauerhaft
    // taub stellen.
    const notified = stock.notified_on instanceof Date ? iso(stock.notified_on) : stock.notified_on;
    if (!isTest && notified === iso(today)) {
      return res.json({ ok: true, tier: cond.tier, sent: 0, skipped: 'heute schon gemeldet' });
    }

    const payload = JSON.stringify(buildPayload(isTest && cond.tier === 'ok' ? { ...cond, tier: 'warn' } : cond));
    const subs = (await client.query('select id, endpoint, p256dh, auth from coffee_push_subscriptions')).rows;

    let sent = 0, failed = 0, removed = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent += 1;
        await client.query('update coffee_push_subscriptions set last_sent_at = now() where id = $1', [s.id]);
      } catch (err) {
        // Nur 404/410 heisst "Geraet weg". Ein VAPID-Fehler (401/403) darf das
        // Abo NICHT loeschen, sonst meldet sich der Nutzer stumm ab.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await client.query('delete from coffee_push_subscriptions where id = $1', [s.id]);
          removed += 1;
        } else {
          failed += 1;
        }
      }
    }
    if (sent > 0 && !isTest) {
      await client.query('update coffee_stock set notified_on = current_date, updated_at = now() where id = 1');
    }
    return res.json({ ok: true, ...cond, subscriptions: subs.length, sent, failed, removed, test: Boolean(isTest) });
  } catch (err) {
    console.error('check-reorder:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.end().catch(() => {});
  }
};

module.exports.configureVapid = configureVapid;
module.exports.evaluate = evaluate;
module.exports.buildPayload = buildPayload;
module.exports.VAPID_PUBLIC = VAPID_PUBLIC;
