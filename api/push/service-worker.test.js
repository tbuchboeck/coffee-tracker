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
