/* Läuft mit: node --test api/push/
 * Kein Jest — react-scripts test sucht nur unter src/. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const webpush = require('web-push');

const mod = require('./check-reorder.js');
const { configureVapid, evaluate, buildPayload, VAPID_PUBLIC } = mod;

test('Server- und Browser-VAPID-Schlüssel sind identisch', () => {
  // Der tragende Test: mit einem gültigen ABER falschen Schlüsselpaar zu
  // signieren wird vom Push-Dienst genauso verworfen wie gar nicht zu
  // signieren — und sieht im Code völlig gesund aus.
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'services', 'pushService.js'), 'utf8');
  const m = src.match(/VAPID_PUBLIC_KEY\s*=\s*\n?\s*'([A-Za-z0-9_-]+)'/);
  assert.ok(m, 'VAPID_PUBLIC_KEY im Frontend nicht gefunden');
  assert.equal(VAPID_PUBLIC, m[1]);
});

test('configureVapid wirft ohne privaten Schlüssel', () => {
  assert.throws(() => configureVapid({}), /VAPID_PRIVATE_KEY/);
  assert.throws(() => configureVapid({ VAPID_SUBJECT: 'mailto:a@b.c' }), /VAPID_PRIVATE_KEY/);
});

test('configureVapid setzt die Details, wenn der Schlüssel da ist', () => {
  const k = webpush.generateVAPIDKeys(); // Wegwerfpaar, nie im Repo
  assert.equal(configureVapid({ VAPID_PRIVATE_KEY: k.privateKey, VAPID_SUBJECT: 'mailto:a@b.c' }), true);
});

const base = { opened_at: '2026-08-05', bags: 1, bag_grams: 1000, cups_per_day: 2, grams_per_cup: 18 };
const day = s => new Date(`${s}T00:00:00Z`);

test('Leer- und Bestelldatum stimmen mit dem Rechner überein', () => {
  const c = evaluate(base, day('2026-08-23'));
  assert.equal(c.days, 27);          // 1000 g / 36 g je Tag
  assert.equal(c.empty, '2026-09-01');
  assert.equal(c.reorder, '2026-08-27'); // 5 Tage Vorlauf
  assert.equal(c.daysLeft, 9);
});

test('Stufen greifen an den richtigen Tagen', () => {
  assert.equal(evaluate(base, day('2026-08-15')).tier, 'ok');
  assert.equal(evaluate(base, day('2026-08-20')).tier, 'warn');     // 7 Tage vor Bestellfrist
  assert.equal(evaluate(base, day('2026-08-27')).tier, 'urgent');   // Bestellfrist
  assert.equal(evaluate(base, day('2026-09-01')).tier, 'critical'); // leer
  assert.equal(evaluate(base, day('2026-09-10')).tier, 'critical');
});

test('mehr Packungen verschieben alles nach hinten', () => {
  const c = evaluate({ ...base, bags: 4 }, day('2026-08-23'));
  assert.equal(c.days, 111);   // 4000 g / 36, nicht 4x27
  assert.equal(c.empty, '2026-11-24');
  assert.equal(c.tier, 'ok');
});

test('unbrauchbare Eingaben werfen, statt still zu rechnen', () => {
  assert.throws(() => evaluate({ ...base, cups_per_day: 0 }, day('2026-08-23')), /Verbrauchsrate/);
  assert.throws(() => evaluate({ ...base, opened_at: 'Unsinn' }, day('2026-08-23')), /opened_at/);
});

test('Meldungstext nennt Datum und Reststand', () => {
  const p = buildPayload(evaluate(base, day('2026-08-27')));
  assert.match(p.title, /bestellen/i);
  assert.match(p.body, /2026-09-01/);
  assert.equal(p.tag, 'coffee-reorder');
  const crit = buildPayload(evaluate(base, day('2026-09-05')));
  assert.match(crit.body, /leer/i);
  assert.equal(crit.requireInteraction, true);
});

/* --- Eingabepruefung des Anmelde-Endpunkts ------------------------------- */
const { validEndpoint } = require('./subscribe.js');

test('nur echte Push-Dienste werden angenommen', () => {
  // Der Endpunkt ist absichtlich unauthentifiziert (der Browser hat hier
  // keinen brauchbaren Ausweis) — die Host-Liste IST die Vertrauensgrenze.
  assert.ok(validEndpoint('https://fcm.googleapis.com/fcm/send/abc123'));
  assert.ok(validEndpoint('https://updates.push.services.mozilla.com/wpush/v2/xyz'));
  assert.ok(validEndpoint('https://web.push.apple.com/QAB'));
  assert.ok(!validEndpoint('https://evil.example.com/x'), 'fremder Host');
  assert.ok(!validEndpoint('http://fcm.googleapis.com/x'), 'kein TLS');
  assert.ok(!validEndpoint('kein-url'), 'unparsbar');
  assert.ok(!validEndpoint(''), 'leer');
  // Kein Teilstring-Treffer: der Host muss wirklich enden wie erlaubt
  assert.ok(!validEndpoint('https://fcm.googleapis.com.evil.tld/x'), 'Suffix-Trick');
});

/* --- Weg von der Meldung zum Warenkorb ----------------------------------- */
test('die Meldung zeigt auf den Warenkorb, nicht auf die App', () => {
  const p = buildPayload(evaluate(base, day('2026-08-27')));
  assert.equal(p.url, 'https://www.vettore.at/Warenkorb');
  assert.deepEqual(p.actions.map(a => a.action), ['cart', 'app']);
  assert.match(p.body, /Warenkorb/);
  // Web Push zeigt auf Android hoechstens zwei Schaltflaechen
  assert.ok(p.actions.length <= 2);
});

test('notificationclick verschluckt externe Ziele nicht mehr', () => {
  // Der alte Handler fokussierte IMMER zuerst ein offenes App-Fenster und kam
  // an openWindow gar nicht vorbei -- ein Link nach aussen war wirkungslos.
  const swSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'service-worker.js'), 'utf8');
  const h = swSrc.slice(swSrc.indexOf("addEventListener('notificationclick'"));
  assert.match(h, /sameOrigin/);
  // Der Auswurf fuer fremde Ziele muss VOR der Fensterschleife stehen
  assert.ok(h.indexOf('if (!sameOrigin) return self.clients.openWindow') < h.indexOf('matchAll'),
    'externes Ziel muss vor dem Fokussieren abgehandelt werden');
  assert.match(h, /event\.action === 'app'/);
  // startsWith statt includes: Origin darf nicht bloss irgendwo vorkommen
  assert.ok(!/w\.url\.includes\(self\.location\.origin\)/.test(h));
  assert.match(h, /w\.url\.startsWith\(self\.location\.origin\)/);
});

test('showNotification reicht die Schaltflaechen durch', () => {
  const swSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'service-worker.js'), 'utf8');
  assert.match(swSrc, /actions: Array\.isArray\(data\.actions\)/);
});

/* --- Bestellung unterwegs ------------------------------------------------- */
test('waehrend eine Bestellung laeuft, schweigt der Melder', () => {
  const s = { ...base, suppress_until: '2026-08-28' };
  assert.equal(evaluate(s, day('2026-08-24')).tier, 'ordered');
  assert.equal(evaluate(s, day('2026-08-28')).tier, 'ordered');   // Grenztag inklusive
  assert.equal(evaluate(s, day('2026-08-28')).suppressedUntil, '2026-08-28');
});

test('nach Fristablauf meldet er wieder — das ist der Punkt', () => {
  // Ist die Lieferung da und der Bestand nachgetragen, aendert sich opened_at.
  // Passiert das nicht, ist die Meldung der richtige Hinweis.
  const s = { ...base, suppress_until: '2026-08-28' };
  assert.equal(evaluate(s, day('2026-08-29')).tier, 'urgent');   // leer erst 01.09., also dringend statt leer
});

test('unbrauchbares suppress_until wird ignoriert, nicht geglaubt', () => {
  assert.equal(evaluate({ ...base, suppress_until: 'Unsinn' }, day('2026-08-24')).tier, 'warn');
  assert.equal(evaluate({ ...base, suppress_until: null }, day('2026-08-24')).tier, 'warn');
});

test('kein Meldungstext enthaelt jemals "null" oder "undefined"', () => {
  // Der 'ordered'-Zustand hat kein Leerdatum; der Standardtext machte daraus
  // "Leer am null (noch null Tage)" und ging so an ein echtes Geraet raus.
  for (const t of ['warn', 'urgent', 'critical']) {
    const p = buildPayload(evaluate(base, day('2026-09-05')).tier === t
      ? evaluate(base, day('2026-09-05')) : { ...evaluate(base, day('2026-08-27')), tier: t });
    assert.ok(!/null|undefined/.test(p.title + p.body), `${t}: ${p.body}`);
  }
  const o = buildPayload({ tier: 'ordered', suppressedUntil: '2026-08-28',
                           empty: null, reorder: null, daysLeft: null });
  assert.ok(!/null|undefined/.test(o.title + o.body), o.body);
  assert.match(o.body, /2026-08-28/);
  assert.match(o.title, /unterwegs/);
});
