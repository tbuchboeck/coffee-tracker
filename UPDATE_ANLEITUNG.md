# Lavazza Gran Crema Barista - Update Anleitung

## ⚠️ Problem mit automatischem Update

Der automatische Update-Versuch wurde durch Proxy-Einschränkungen blockiert. Die Verbindung zu Supabase (`hrgdmjzouzntloyngcrh.supabase.co`) ist in dieser Umgebung nicht erlaubt.

**Fehler:** `403 Forbidden - host_not_allowed`

---

## ✅ Alternative Update-Methoden

### Option 1: Direktes SQL Update in Supabase (Empfohlen)

1. Gehe zu **https://app.supabase.com**
2. Öffne dein Projekt
3. Gehe zu **SQL Editor**
4. Kopiere und führe folgendes SQL aus:

```sql
UPDATE coffees
SET
  percentarabica = 40,
  percentrobusta = 60,
  origin = 'BR,HN,AS',
  roastlevel = 'medium',
  tastenotes = 'dark chocolate, spices, honey, roasted coffee, velvety',
  url = 'https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema',
  brewingmethod = 'espresso',
  recommendedmethod = 'espresso',
  comment = 'Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.',
  packagesize = 1000,
  coffeeamount = '18',
  price = '31.99',
  currency = 'EUR'
WHERE roaster ILIKE '%lavazza%'
  AND (description ILIKE '%gran crema%' OR description ILIKE '%grand crema%' OR description ILIKE '%barista gran%');
```

5. Klicke auf **Run** (oder Ctrl/Cmd + Enter)
6. Du solltest eine Bestätigung sehen: "Success. 1 row(s) updated"

---

### Option 2: Update über deine Web-App

1. Öffne deine Coffee Tracker App im Browser
2. Finde den **Lavazza Gran Crema Barista** Eintrag in der Liste
3. Klicke auf **Bearbeiten** / **Edit**
4. Fülle folgende Felder aus:

**Blend:**
- **Arabica:** `40` %
- **Robusta:** `60` %

**Origin:**
- **Origin Code:** `BR,HN,AS`
  - BR = Brasilien
  - HN = Honduras
  - AS = Südostasien

**Röstung:**
- **Roast Level:** `medium`

**Geschmack:**
- **Taste Notes:** `dark chocolate, spices, honey, roasted coffee, velvety`

**Links & Info:**
- **URL:** `https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema`
- **Comment:** `Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.`

**Zubereitung:**
- **Brewing Method:** `espresso`
- **Recommended Method:** `espresso`
- **Coffee Amount:** `18` (Gramm pro Tasse)

**Verpackung & Preis:**
- **Package Size:** `1000` (Gramm)
- **Price:** `31.99`
- **Currency:** `EUR`
- **Kosten pro Tasse:** ~0,58 EUR (bei 18g Dosierung)

5. Speichere die Änderungen

---

### Option 3: Bash-Skript lokal ausführen

Wenn du das Skript auf deinem **lokalen Computer** (nicht in dieser Container-Umgebung) ausführst, sollte es funktionieren:

```bash
# Auf deinem lokalen Computer:
cd /pfad/zu/coffee-tracker
./update-lavazza-db.sh
```

Das Skript wird dich nach den Supabase-Credentials fragen oder sie aus den Umgebungsvariablen lesen.

---

### Option 4: cURL-Befehl lokal ausführen

Du kannst auch direkt einen cURL-Befehl auf deinem lokalen Computer ausführen:

```bash
# 1. Finde zuerst die ID des Kaffees:
curl -X GET \
  "https://hrgdmjzouzntloyngcrh.supabase.co/rest/v1/coffees?select=id,roaster,description&roaster=ilike.*lavazza*&description=ilike.*gran*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ2RtanpvdXpudGxveW5nY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDcxNDAsImV4cCI6MjA3NjcyMzE0MH0.ukfYzH7bYyaPhK_gmi-erj5c3lSbGWFv5WbX8fnaJsY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ2RtanpvdXpudGxveW5nY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDcxNDAsImV4cCI6MjA3NjcyMzE0MH0.ukfYzH7bYyaPhK_gmi-erj5c3lSbGWFv5WbX8fnaJsY"

# 2. Dann update mit der gefundenen ID (z.B. ID=123):
curl -X PATCH \
  "https://hrgdmjzouzntloyngcrh.supabase.co/rest/v1/coffees?id=eq.COFFEE_ID_HIER" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ2RtanpvdXpudGxveW5nY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDcxNDAsImV4cCI6MjA3NjcyMzE0MH0.ukfYzH7bYyaPhK_gmi-erj5c3lSbGWFv5WbX8fnaJsY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ2RtanpvdXpudGxveW5nY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDcxNDAsImV4cCI6MjA3NjcyMzE0MH0.ukfYzH7bYyaPhK_gmi-erj5c3lSbGWFv5WbX8fnaJsY" \
  -H "Content-Type: application/json" \
  -d '{
    "percentarabica": 40,
    "percentrobusta": 60,
    "origin": "BR,HN,AS",
    "roastlevel": "medium",
    "tastenotes": "dark chocolate, spices, honey, roasted coffee, velvety",
    "url": "https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema",
    "brewingmethod": "espresso",
    "recommendedmethod": "espresso",
    "comment": "Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot."
  }'
```

---

## 📋 Update-Daten Zusammenfassung

Für manuelles Copy-Paste in die Web-App:

| Feld | Wert |
|------|------|
| **percentArabica** | 40 |
| **percentRobusta** | 60 |
| **origin** | BR,HN,AS |
| **roastLevel** | medium |
| **tasteNotes** | dark chocolate, spices, honey, roasted coffee, velvety |
| **url** | https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema |
| **brewingMethod** | espresso |
| **recommendedMethod** | espresso |
| **comment** | Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot. |
| **packageSize** | 1000 |
| **coffeeAmount** | 18 |
| **price** | 31.99 |
| **currency** | EUR |

**Kosten pro Tasse:** ~0,58 EUR (1000g ÷ 18g = 55 Tassen; 31,99 EUR ÷ 55 = 0,58 EUR)

---

## 🎯 Empfohlener Weg

Ich empfehle **Option 1** (SQL Editor in Supabase), da es am schnellsten und zuverlässigsten ist:

1. Öffne https://app.supabase.com
2. SQL Editor öffnen
3. SQL-Befehl von oben kopieren und ausführen
4. Fertig! ✨

---

**Erstellt:** 2025-12-27
**Grund:** Proxy-Beschränkungen in Container-Umgebung verhindern direkten API-Zugriff
