/* Regressionstest fuer den Ausfall vom 2026-08-23.
 *
 * v2 des Service Workers hat sich NIE installiert: urlsToCache enthielt
 * '/static/css/main.css' und '/static/js/main.js', die es in einem CRA-Build
 * nicht gibt (dort stehen gehashte Namen). cache.addAll() ist atomar, in
 * waitUntil() scheitert damit die Installation, und ein nicht installierter
 * Worker wird nie aktiv -> navigator.serviceWorker.ready loeste nie auf.
 *
 * Der Test prueft das Prinzip, nicht die Symptome: jede vorab gecachte Adresse
 * muss im Build wirklich existieren.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SW = fs.readFileSync(path.join(ROOT, 'public', 'service-worker.js'), 'utf8');

function precachedUrls(src) {
  const m = src.match(/const urlsToCache\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, 'urlsToCache nicht gefunden');
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}

test('jede vorab gecachte Adresse existiert im Build', () => {
  const build = path.join(ROOT, 'build');
  if (!fs.existsSync(build)) {
    // Ohne Build nicht pruefbar — lieber uebergehen als falsch gruen melden.
    return;
  }
  for (const url of precachedUrls(SW)) {
    // '/' wird von index.html bedient
    const rel = url === '/' ? 'index.html' : url.replace(/^\//, '');
    assert.ok(fs.existsSync(path.join(build, rel)), `${url} fehlt im Build (${rel})`);
  }
});

test('keine unversionierten Bundle-Pfade in der Precache-Liste', () => {
  // Genau die Form, die den Ausfall verursacht hat.
  for (const url of precachedUrls(SW)) {
    assert.ok(!/^\/static\/(js|css)\/[^.]+\.(js|css)$/.test(url),
      `${url} ist ein unversionierter Bundle-Pfad — im CRA-Build heisst er anders`);
  }
});

test('eine fehlende Adresse darf die Installation nicht verhindern', () => {
  const install = SW.slice(SW.indexOf("addEventListener('install'"), SW.indexOf("addEventListener('fetch'"));
  assert.ok(!/addAll\(/.test(install), 'addAll ist atomar — ein 404 killt die Installation');
  assert.ok(/allSettled/.test(install), 'einzelne Fehlschlaege muessen toleriert werden');
});

test('Seitenaufrufe gehen zuerst ans Netz', () => {
  // Sonst friert das Geraet auf einem alten index.html ein und sieht neue
  // Deployments nie (Stale-Bundle-Falle).
  const fetchHandler = SW.slice(SW.indexOf("addEventListener('fetch'"));
  assert.match(fetchHandler, /mode === 'navigate'/);
  const nav = fetchHandler.slice(fetchHandler.indexOf("mode === 'navigate'"));
  assert.ok(nav.indexOf('fetch(event.request)') < nav.indexOf('caches.match'),
    'bei Navigation muss fetch vor dem Cache stehen');
});

test('der neue Worker uebernimmt sofort', () => {
  assert.match(SW, /skipWaiting\(\)/);
  assert.match(SW, /clients\.claim\(\)/);
});

test('Push- und Klick-Handler sind vorhanden', () => {
  assert.match(SW, /addEventListener\('push'/);
  assert.match(SW, /addEventListener\('notificationclick'/);
});

test('der Worker meldet seine Version beim Aktivieren', () => {
  // Ohne das ist "auf dem Geraet laeuft noch der alte Worker" eine Vermutung.
  assert.match(SW, /const SW_VERSION = '[^']+'/);
  const act = SW.slice(SW.indexOf("addEventListener('activate'"));
  assert.match(act, /step: 'sw-activate'/);
  assert.match(act, /SW_VERSION/);
  // Darf die Aktivierung nicht aufhalten
  assert.ok(act.indexOf('.catch(() => {})') < act.indexOf('event.waitUntil'),
    'die Meldung muss fire-and-forget vor waitUntil stehen');
});

test('externe Ziele laufen ueber die eigene Bruecke, nicht direkt', () => {
  // clients.openWindow() mit fremder Adresse oeffnete auf Android die App
  // statt des Shops. /go.html leitet per location.replace weiter -- eine
  // normale Navigation und damit verlaesslich.
  const h = SW.slice(SW.indexOf("addEventListener('notificationclick'"));
  const extern = h.slice(h.indexOf('if (!sameOrigin)'), h.indexOf('melde(\'click\''));
  assert.match(extern, /go\.html\?to=cart/);
  assert.ok(!/openWindow\(target\)/.test(extern),
    'die fremde Adresse darf nicht mehr direkt an openWindow gehen');
});

test('die Bruecke leitet nur auf erlaubte Ziele weiter', () => {
  // Ohne feste Liste waere das eine offene Weiterleitung.
  const go = fs.readFileSync(path.join(ROOT, 'public', 'go.html'), 'utf8');
  assert.match(go, /ERLAUBT/);
  assert.match(go, /vettore\.at\/Warenkorb/);
  assert.match(go, /location\.replace/);
  // Kein Durchreichen beliebiger Adressen aus dem Parameter
  assert.ok(!/location\.replace\(\s*(new URLSearchParams|params|ziel\s*=\s*.*get)/.test(go));
  assert.match(go, /ERLAUBT\[schluessel\]/);
});
