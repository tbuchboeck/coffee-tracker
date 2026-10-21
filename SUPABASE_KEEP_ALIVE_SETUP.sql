-- One-time setup: create a tiny table the keep-alive cron writes to.
-- A write operation is unambiguous activity; Supabase free-tier no longer
-- counts read-only REST pings, which is why the project paused in April 2026
-- despite the cron running successfully every Mon+Thu.

CREATE TABLE IF NOT EXISTS keep_alive (
  id INT PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT keep_alive_singleton CHECK (id = 1)
);

-- Explizite Data-API-Grants: ab 30.10.2026 vergibt Supabase sie für neue
-- Tabellen in public nicht mehr automatisch. Der Cron (keep-supabase-alive.yml)
-- nutzt den anon key: POST mit merge-duplicates = INSERT ... ON CONFLICT DO
-- UPDATE, danach GET zum Gegenlesen.
GRANT SELECT, INSERT, UPDATE ON keep_alive TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON keep_alive TO service_role;

INSERT INTO keep_alive (id, last_ping)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "keep_alive_anon_upsert" ON keep_alive;
CREATE POLICY "keep_alive_anon_upsert"
  ON keep_alive
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
