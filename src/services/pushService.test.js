import { withTimeout, urlBase64ToUint8Array, VAPID_PUBLIC_KEY } from './pushService';

describe('withTimeout', () => {
  test('reicht den Wert durch, wenn rechtzeitig geliefert wird', async () => {
    await expect(withTimeout(Promise.resolve('da'), 50, 'X')).resolves.toBe('da');
  });

  test('macht aus einem haengenden Promise einen benannten Fehler', async () => {
    // navigator.serviceWorker.ready wird nie abgelehnt — ohne Zeitgrenze
    // passiert sichtbar gar nichts. Genau das soll hier unmoeglich werden.
    const haengt = new Promise(() => {});
    await expect(withTimeout(haengt, 20, 'Service Worker')).rejects.toThrow(/Service Worker antwortet nicht/);
  });

  test('reicht eine echte Ablehnung unveraendert weiter', async () => {
    await expect(withTimeout(Promise.reject(new Error('kaputt')), 50, 'X')).rejects.toThrow('kaputt');
  });
});

describe('urlBase64ToUint8Array', () => {
  test('dekodiert den VAPID-Schluessel zu 65 Bytes (unkomprimierter P-256-Punkt)', () => {
    const b = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    expect(b).toBeInstanceOf(Uint8Array);
    expect(b.length).toBe(65);
    expect(b[0]).toBe(4); // 0x04 = unkomprimiert; alles andere lehnt der Browser ab
  });

  test('behandelt fehlendes Padding und die URL-Sonderzeichen', () => {
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255]);
  });
});
