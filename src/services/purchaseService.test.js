import { summarizePurchases } from './purchaseService';

// Die echten Backfill-Zeilen vom 04.09.2026 — vier vettore-Bestellungen,
// sieben Positionen, acht Beutel. Wenn die Rechnung stimmt, stimmt sie hier.
const BACKFILL = [
  { coffee_id: 1777206427926, ordered_on: '2026-04-13', order_no: '70262', bags: 1, unit_price: '19.29', shop: 'vettore.at' },
  { coffee_id: 1777206427927, ordered_on: '2026-05-12', order_no: '71397', bags: 1, unit_price: '15.99', shop: 'vettore.at' },
  { coffee_id: 1782475395251, ordered_on: '2026-06-08', order_no: '72357', bags: 1, unit_price: '21.99', shop: 'vettore.at' },
  { coffee_id: 1777206427927, ordered_on: '2026-06-08', order_no: '72357', bags: 1, unit_price: '17.99', shop: 'vettore.at' },
  { coffee_id: 1777206427927, ordered_on: '2026-08-23', order_no: '74353', bags: 2, unit_price: '17.99', shop: 'vettore.at' },
  { coffee_id: 1788523577402, ordered_on: '2026-08-23', order_no: '74353', bags: 1, unit_price: '25.99', shop: 'vettore.at' },
  { coffee_id: 1788523577403, ordered_on: '2026-08-23', order_no: '74353', bags: 1, unit_price: '27.99', shop: 'vettore.at' },
];

describe('summarizePurchases', () => {
  test('zaehlt Beutel statt Bestellpositionen', () => {
    // Borbone Blu: drei Positionen, aber vier Beutel — die 23.08. brachte zwei.
    const { byCoffee } = summarizePurchases(BACKFILL);
    expect(byCoffee[1777206427927].orders).toHaveLength(3);
    expect(byCoffee[1777206427927].bags).toBe(4);
  });

  test('multipliziert Menge mal Einzelpreis', () => {
    const { byCoffee } = summarizePurchases(BACKFILL);
    // 15,99 + 17,99 + 2x17,99 = 69,96 — nicht 51,97 (Summe der Einzelpreise)
    expect(byCoffee[1777206427927].amount).toBeCloseTo(69.96, 2);
  });

  test('rechnet die Gesamtsumme ueber alle Sorten', () => {
    const { totals } = summarizePurchases(BACKFILL);
    expect(totals.bags).toBe(8);
    expect(totals.amount).toBeCloseTo(165.22, 2);
  });

  test('zaehlt Bestellungen, nicht Positionen — 74353 enthaelt drei Sorten', () => {
    expect(summarizePurchases(BACKFILL).totals.orders).toBe(4);
  });

  test('merkt sich den juengsten Kauf je Sorte', () => {
    const { byCoffee } = summarizePurchases(BACKFILL);
    expect(byCoffee[1777206427927].last).toBe('2026-08-23');
    expect(byCoffee[1782475395251].last).toBe('2026-06-08');
  });

  test('sortiert die Kaeufe einer Sorte neueste zuerst', () => {
    const { byCoffee } = summarizePurchases(BACKFILL);
    expect(byCoffee[1777206427927].orders.map(o => o.orderedOn))
      .toEqual(['2026-08-23', '2026-06-08', '2026-05-12']);
  });

  test('unit_price null zaehlt als 0 und wirft nicht', () => {
    const { byCoffee, totals } = summarizePurchases([
      { coffee_id: 1, ordered_on: '2026-01-01', order_no: null, bags: 2, unit_price: null },
    ]);
    expect(byCoffee[1].bags).toBe(2);
    expect(totals.amount).toBe(0);
    expect(totals.orders).toBe(0); // ohne Bestellnummer nichts zu zaehlen
  });

  test('leere und fehlende Eingabe ergeben eine leere Zusammenfassung', () => {
    for (const input of [[], null, undefined]) {
      const s = summarizePurchases(input);
      expect(s.byCoffee).toEqual({});
      expect(s.totals).toEqual({ bags: 0, amount: 0, orders: 0 });
    }
  });
});
