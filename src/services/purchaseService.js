import { supabase, isSupabaseConfigured } from '../supabaseClient';

const TABLE_NAME = 'coffee_purchases';

/**
 * Fasst Kaufzeilen je Kaffee zusammen.
 *
 * Eigene Funktion und nicht Teil der Klasse, damit sie ohne Datenbank testbar
 * ist - die Rechnung ist der Teil, der schiefgehen kann, nicht der SELECT.
 *
 * @param {Array} rows Zeilen aus coffee_purchases (snake_case wie in der DB)
 * @returns {{byCoffee: Object, totals: {bags: number, amount: number, orders: number}}}
 */
export const summarizePurchases = (rows) => {
  const byCoffee = {};
  const orderNumbers = new Set();
  let bags = 0;
  let amount = 0;

  for (const row of rows || []) {
    const rowBags = Number(row.bags) || 0;
    // unit_price kommt von PostgREST als String ("17.99"), numeric bleibt exakt
    const unitPrice = row.unit_price == null ? 0 : Number(row.unit_price);
    const cost = rowBags * unitPrice;

    if (!byCoffee[row.coffee_id]) {
      byCoffee[row.coffee_id] = { bags: 0, amount: 0, last: null, orders: [] };
    }
    const entry = byCoffee[row.coffee_id];
    entry.bags += rowBags;
    entry.amount += cost;
    entry.orders.push({
      orderedOn: row.ordered_on,
      orderNo: row.order_no || null,
      bags: rowBags,
      unitPrice,
      shop: row.shop || null,
    });
    // ISO-Datum, deshalb ist der String-Vergleich auch der Datumsvergleich
    if (!entry.last || row.ordered_on > entry.last) entry.last = row.ordered_on;

    bags += rowBags;
    amount += cost;
    if (row.order_no) orderNumbers.add(row.order_no);
  }

  for (const entry of Object.values(byCoffee)) {
    entry.orders.sort((a, b) => (a.orderedOn < b.orderedOn ? 1 : -1));
  }

  return { byCoffee, totals: { bags, amount, orders: orderNumbers.size } };
};

export const EMPTY_PURCHASE_SUMMARY = summarizePurchases([]);

class PurchaseService {
  async getSummary() {
    if (!isSupabaseConfigured()) return summarizePurchases([]);

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('ordered_on', { ascending: false });

      if (error) throw error;
      return summarizePurchases(data);
    } catch (error) {
      // ponytail: leere Historie statt kaputter Seite. Die Kaufhistorie ist
      //           Beiwerk - faellt sie aus, soll die Sammlung trotzdem laden.
      console.error('Error fetching purchases from Supabase:', error);
      return summarizePurchases([]);
    }
  }
}

export const purchaseService = new PurchaseService();
