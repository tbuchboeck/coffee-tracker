-- coffee_purchases — ein Kauf ist eine eigene Zeile
--
-- Warum die Tabelle existiert: der Katalog `coffees` dedupliziert auf
-- roaster+description, ein Wiederkauf erzeugt also KEINE neue Zeile. Damit war
-- "wie oft habe ich den schon gekauft" bis 04.09.2026 nirgends beantwortbar
-- (siehe 20260823-coffee/FINDINGS.md §2 — derselbe Blocker, der das
-- Verbrauchsmodell am Oeffnungsdatum haengen liess).
--
-- Rechte spiegeln `coffees` exakt: RLS an, eine Policy fuer `authenticated`,
-- anon bekommt nichts. Die App liest mit dem Passkey-JWT aus auth-buchboeck.

create table if not exists public.coffee_purchases (
  id          bigserial primary key,
  coffee_id   bigint      not null references public.coffees(id) on delete cascade,
  ordered_on  date        not null,
  order_no    text,
  shop        text        not null default 'vettore.at',
  bags        int         not null default 1 check (bags > 0),
  unit_price  numeric(10,2),
  currency    text        not null default 'EUR',
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists coffee_purchases_coffee_idx
  on public.coffee_purchases (coffee_id, ordered_on desc);

-- Eine Bestellposition kommt pro Bestellung und Sorte genau einmal vor.
create unique index if not exists coffee_purchases_order_uniq
  on public.coffee_purchases (coffee_id, ordered_on, coalesce(order_no, ''));

alter table public.coffee_purchases enable row level security;

drop policy if exists coffee_purchases_auth_all on public.coffee_purchases;
create policy coffee_purchases_auth_all on public.coffee_purchases
  for all to authenticated using (true) with check (true);

revoke all on public.coffee_purchases from anon;
grant select, insert, update, delete on public.coffee_purchases to authenticated, service_role;
grant usage, select on sequence public.coffee_purchases_id_seq to authenticated, service_role;
revoke all on sequence public.coffee_purchases_id_seq from anon;
