/* eslint-disable no-restricted-globals */
// TEMP: kill-switch SW — unregisters itself and clears all caches so
// stale cached HTML/JS bundles can't lock users out of fresh deploys.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(n => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
