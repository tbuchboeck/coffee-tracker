# Lavazza Espresso Barista Gran Crema - Detaillierte Informationen

## 📋 Produktübersicht

**Voller Name:** Lavazza Espresso Barista Gran Crema
**Hersteller:** Lavazza
**Produktlinie:** Barista Serie

---

## ☕ Zusammensetzung

- **Arabica:** 40%
- **Robusta:** 60%
- **Details:** Langsam geröstete Arabica-Bohnen aus Südamerika (Brasilien, Honduras) gemischt mit Robusta-Bohnen aus Südostasien

---

## 🌍 Herkunft

**Origin Code für Datenbank:** `BR,HN,AS`

- **BR** - Brasilien (Südamerika)
- **HN** - Honduras (Südamerika)
- **AS** - Südostasien (verschiedene Regionen)

---

## 🔥 Röstung

- **Röstgrad:** Medium (Mittel)
- **Intensität:** 7/10
- **Charakteristik:** Glatte, ausgewogene Röstung

---

## 👅 Geschmacksprofil

**Taste Notes für Datenbank:** `dark chocolate, spices, honey, roasted coffee, velvety`

### Geschmacksnoten:
- 🍫 **Dunkle Schokolade** - Dominante Note
- 🌶️ **Gewürze** - Würzige Akzente
- 🍯 **Honig** - Süße, aromatische Noten
- ☕ **Gerösteter Kaffee** - Intensive Röstnoten
- 🥛 **Samtig** - Weiche, cremige Textur

---

## ☕ Zubereitung

- **Brewing Method:** `espresso`
- **Recommended Method:** `espresso`
- **Alternative Methoden:**
  - Moka Pot (Espressokocher)
  - Drip Coffee Maker (Filterkaffee)
  - French Press

**Beste Verwendung:** Espressomaschine oder Moka Pot für optimale Crema und Geschmack

---

## 📦 Verpackung

- **Standard Größe:** 1000g (1 kg)
- **US-Markt:** 2.2 lb Beutel (35.2 oz)
- **Package Size für DB:** `1000`

---

## 💰 Preis

- **Typischer Preis:** €15-25 / $15-25 USD
- **Hinweis:** Preise variieren je nach Händler und Region

---

## 🔗 Links & Referenzen

- **Offizielle Website:** https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema
- **US Website:** https://www.lavazzausa.com/en/whole-bean-coffee/espresso-barista-gran-crema

---

## 📝 Kommentar für Datenbank

```
Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.
```

---

## 🎯 Felder für deine Coffee Tracker Datenbank

Hier sind die Werte, die du in deine Datenbank eintragen kannst:

```javascript
{
  "roaster": "Lavazza",
  "description": "Gran Crema Barista",
  "percentArabica": 40,
  "percentRobusta": 60,
  "origin": "BR,HN,AS",
  "roastLevel": "medium",
  "brewingMethod": "espresso",
  "recommendedMethod": "espresso",
  "tasteNotes": "dark chocolate, spices, honey, roasted coffee, velvety",
  "url": "https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema",
  "comment": "Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.",
  "packageSize": 1000,
  "currency": "EUR"
}
```

---

## 📱 So aktualisierst du deine Datenbank

### Option 1: Über die Web-App (Empfohlen)

1. Öffne deine Coffee Tracker App
2. Finde den Lavazza Gran Crema Barista Eintrag
3. Klicke auf "Bearbeiten" / "Edit"
4. Fülle die fehlenden Felder mit den oben genannten Werten aus
5. Speichere die Änderungen

### Option 2: Über Supabase Direkt

1. Gehe zu https://app.supabase.com
2. Öffne dein Projekt
3. Gehe zu "Table Editor" > "coffees"
4. Finde den Eintrag für Lavazza Gran Crema
5. Bearbeite die Felder manuell

### Option 3: SQL Update (Fortgeschritten)

Wenn du direkten SQL-Zugriff hast:

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
  packagesize = 1000
WHERE roaster ILIKE '%lavazza%'
  AND description ILIKE '%gran crema%';
```

---

## 📚 Quellen

Die Informationen wurden aus folgenden Quellen recherchiert:

- [Lavazza Official Website](https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema)
- [Lavazza USA](https://www.lavazzausa.com/en/whole-bean-coffee/espresso-barista-gran-crema)
- [Amazon Product Page](https://www.amazon.com/Lavazza-Coffee-Medium-Espresso-2-2-Pound/dp/B005OJ4X32)
- [Walmart Product Information](https://www.walmart.com/ip/Lavazza-Espresso-Barista-Gran-Crema-Whole-Bean-Coffee-Blend-Medium-Espresso-Roast-2-2LB-Bag/139749947)

---

**Erstellt am:** 2025-12-27
**Recherchiert für:** Coffee Tracker App
