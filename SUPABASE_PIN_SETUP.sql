-- ========================================
-- Coffee Tracker - PIN-Schutz Setup
-- ========================================
-- Führe diese Befehle im Supabase SQL Editor aus: https://app.supabase.com

-- ========================================
-- SCHRITT 1: Config-Tabelle erstellen
-- ========================================
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ========================================
-- SCHRITT 2: PIN setzen
-- ========================================
-- Der PIN wird als SHA-256 Hash gespeichert.
-- Ersetze 'DEIN_PIN_HIER' mit deinem gewünschten PIN.
--
-- Variante A: PIN direkt als Hash speichern (empfohlen)
-- Generiere den Hash z.B. unter https://emn178.github.io/online-tools/sha256.html
-- oder in der Browser-Konsole:
--   crypto.subtle.digest('SHA-256', new TextEncoder().encode('1234')).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
--
-- Dann hier einfügen:
INSERT INTO app_config (key, value)
VALUES ('pin_hash', 'HIER_DEINEN_SHA256_HASH_EINFÜGEN')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Variante B: Direkt mit pgcrypto hashen (falls Extension aktiviert)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- INSERT INTO app_config (key, value)
-- VALUES ('pin_hash', encode(digest('1234', 'sha256'), 'hex'))
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================
-- SCHRITT 3: RLS für app_config
-- ========================================
-- Nur Lesen erlauben (anon key), kein Schreiben über die API
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read of app_config" ON app_config;
CREATE POLICY "Allow anonymous read of app_config"
ON app_config FOR SELECT
USING (true);

-- Kein INSERT/UPDATE/DELETE Policy = kein Schreibzugriff über die API
-- PIN kann nur über SQL Editor / Dashboard geändert werden

-- ========================================
-- SCHRITT 4: Coffees-Tabelle aufräumen (optional)
-- ========================================
-- Falls RLS auf coffees aktiv ist, deaktivieren (single-user, kein Auth mehr):
-- ALTER TABLE coffees DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Verifizierung
-- ========================================
SELECT * FROM app_config WHERE key = 'pin_hash';
-- Sollte deinen Hash anzeigen
