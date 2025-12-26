# Supabase Keep-Alive Automatisierung

## Problem

Supabase Free Tier pausiert Projekte automatisch nach ca. 7 Tagen Inaktivität.
Wenn das Projekt pausiert ist, funktioniert die Coffee Tracker App nicht mehr.

## Lösung

Wir haben einen automatischen GitHub Actions Workflow eingerichtet, der alle 6 Tage
Ihre Supabase-Datenbank "anpingt" um sie aktiv zu halten.

## Wie funktioniert es?

Der Workflow (`.github/workflows/keep-supabase-alive.yml`):

1. **Läuft automatisch** alle 6 Tage (Cron: `0 10 */6 * *`)
2. **Macht eine einfache Abfrage** an Ihre Supabase-Datenbank
3. **Hält das Projekt aktiv** ohne dass Sie etwas tun müssen

## Manueller Trigger

Sie können den Workflow auch manuell auslösen:

1. Gehen Sie zu: https://github.com/tbuchboeck/coffee-tracker/actions
2. Wählen Sie "Keep Supabase Active"
3. Klicken Sie auf "Run workflow"

## Voraussetzungen

Die folgenden GitHub Secrets müssen gesetzt sein (bereits vorhanden):
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Überwachung

Sie können den Status der Workflows hier überprüfen:
https://github.com/tbuchboeck/coffee-tracker/actions/workflows/keep-supabase-alive.yml

## Hinweise

- Der Workflow läuft kostenlos auf GitHub Actions
- Er verursacht minimale Datenbank-Abfragen (1 SELECT pro 6 Tage)
- Falls der Workflow fehlschlägt (z.B. wenn das Projekt bereits pausiert ist), ist das okay
- Nach dem Reaktivieren des Projekts wird der nächste Workflow es wieder aktiv halten

## Alternative: Pro Upgrade

Wenn Sie nicht möchten, dass Ihr Projekt pausiert wird, können Sie auf
**Supabase Pro** upgraden ($25/Monat). Dann pausiert das Projekt nie automatisch.
