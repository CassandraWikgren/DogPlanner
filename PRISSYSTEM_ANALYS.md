# 🎯 PRISSYSTEM ANALYS & REKOMMENDATION

## 📊 NUVARANDE SITUATION

### **Befintliga Tabeller (Kan användas direkt):**

#### ✅ **1. `boarding_prices`** - ANVÄNDS

```sql
- dog_size (small/medium/large)
- base_price (grundpris per natt)
- weekend_surcharge (helgtillägg i kr)
- holiday_surcharge (högtidstillägg i kr)  ⚠️ OKLART hur detta används
- season_multiplier (multiplikator) ⚠️ KONFLIKT med boarding_seasons
```

#### ✅ **2. `boarding_seasons`** - ANVÄNDS

```sql
- name (t.ex. "Sommar", "Jul")
- start_date / end_date
- price_multiplier (t.ex. 1.3 = +30%)
```

#### ❌ **3. `subscription_types`** - DAGIS (ej pensionat)

```sql
- För hunddagis abonnemang (Heltid, Deltid 2/3)
- subscription_type, height_min/max, price
- Använd EJ för pensionat
```

### **Problem med nuvarande system:**

1. **`boarding_prices.holiday_surcharge`** - Oklart hur den används
   - Är det för alla högtider?
   - Hur skiljer man midsommar (+400 kr) från kristi himmelsfärd (+75 kr)?
   - **Svar: Det går inte! Det är en fast kolumn för "alla högtider"**

2. **`boarding_prices.season_multiplier`** - Dubblering med `boarding_seasons`
   - Både boarding_prices OCH boarding_seasons har multiplikatorer
   - Vilken ska användas? Konflikt!

3. **Ingen flexibilitet för specifika datum**
   - Midsommar, julafton, lokala event - allt måste vara säsonger
   - Omständligt att skapa säsong för 1 dag

## 💡 REKOMMENDATION: Hybrid-lösning

### **Behåll & Förbättra:**

#### ✅ **1. `boarding_prices` (FÖRENKLAD)**

```sql
-- TA BORT holiday_surcharge (ersätts av special_dates)
-- TA BORT season_multiplier (använd boarding_seasons istället)

ALTER TABLE boarding_prices
DROP COLUMN holiday_surcharge,
DROP COLUMN season_multiplier;

-- Behåll bara:
CREATE TABLE boarding_prices (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id),
  dog_size text CHECK (dog_size IN ('small', 'medium', 'large')),
  base_price numeric NOT NULL,           -- Grundpris vardag (300 kr)
  weekend_surcharge numeric DEFAULT 0,   -- Helgtillägg fre-sön (+100 kr)
  is_active boolean DEFAULT true
);
```

#### ✅ **2. `boarding_seasons` (BEHÅLL)**

```sql
-- Perfekt som den är!
CREATE TABLE boarding_seasons (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id),
  name text NOT NULL,                -- "Sommar", "Sportlov", "Julperiod"
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_multiplier numeric DEFAULT 1.0, -- 1.3 = +30%
  is_active boolean DEFAULT true
);
```

#### ⭐ **3. `special_dates` (NY TABELL)**

```sql
-- För specifika datum med individuella påslag
CREATE TABLE IF NOT EXISTS special_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text NOT NULL,                    -- "Midsommarafton", "Hundutställning"
  category text CHECK (category IN ('red_day', 'holiday', 'event', 'custom')),
  price_surcharge numeric NOT NULL,      -- Fast påslag i kr (400, 200, 75)
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, date)
);

CREATE INDEX idx_special_dates_org_date ON special_dates(org_id, date);
```

## 🧮 PRISBERÄKNINGSLOGIK

### **Prioritetsordning:**

```typescript
1. SPECIALDATUM (prio 100) - Högst!
   Om datum finns i special_dates → använd det påslaget

2. HELG (prio 50)
   Om fredag-söndag OCH inget specialdatum → weekend_surcharge

3. SÄSONG (prio 10) - Lägst!
   Om datum finns i boarding_seasons → multiplicera med price_multiplier
```

### **Exempel på prisberäkning:**

```typescript
// Midsommarafton 2025-06-20 (fredag)
base_price:         300 kr
special_date:      +400 kr (midsommar)
säsong (sommar):   x1.3
= (300 + 400) × 1.3 = 910 kr

// Vanlig lördag i sommar
base_price:         300 kr
weekend_surcharge: +100 kr (lördag)
säsong (sommar):   x1.3
= (300 + 100) × 1.3 = 520 kr

// Vanlig måndag i sommar
base_price:         300 kr
säsong (sommar):   x1.3
= 300 × 1.3 = 390 kr

// Kristi himmelsfärdsdag (torsdag)
base_price:         300 kr
special_date:       +75 kr (mindre röd dag)
= 300 + 75 = 375 kr
```

## 📋 DATABAS-MIGRATION PLAN

### **Steg 1: Skapa ny tabell**

```sql
-- Fil: supabase/migrations/2025-11-13_add_special_dates.sql
CREATE TABLE IF NOT EXISTS special_dates (...);
```

### **Steg 2: Städa boarding_prices**

```sql
-- Fil: supabase/migrations/2025-11-13_cleanup_boarding_prices.sql
ALTER TABLE boarding_prices
DROP COLUMN IF EXISTS holiday_surcharge,
DROP COLUMN IF EXISTS season_multiplier;
```

### **Steg 3: Pre-populera special_dates**

```sql
-- Importera svenska röda dagar 2025-2030
INSERT INTO special_dates (org_id, date, name, category, price_surcharge) VALUES
  -- Används i admin-UI som "Importera röda dagar"
```

## 🎨 ADMIN-UI STRUKTUR

### **Priser-sidan: `/hundpensionat/priser`**

```
┌─────────────────────────────────────────────────────┐
│ [Grundpriser] [Säsonger] [Specialdatum]            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ TAB 1: GRUNDPRISER                                  │
│ ┌─────────────────────────────────────────────┐    │
│ │ Liten hund (0-34 cm):  [400] kr/natt       │    │
│ │ Mellan hund (35-54 cm): [450] kr/natt      │    │
│ │ Stor hund (55+ cm):    [500] kr/natt       │    │
│ │ Helgtillägg (fre-sön): [100] kr/natt       │    │
│ │                            [Spara priser]   │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ TAB 2: SÄSONGER                                     │
│ ┌─────────────────────────────────────────────┐    │
│ │ [+ Lägg till säsong]                        │    │
│ │                                             │    │
│ │ Namn      Start      Slut      Påslag      │    │
│ │ Sommar    2025-06-15 2025-08-15 +30%  [✏️]  │    │
│ │ Sportlov  2025-02-24 2025-03-02 +20%  [✏️]  │    │
│ │ Julhelg   2025-12-20 2026-01-06 +40%  [✏️]  │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ TAB 3: SPECIALDATUM                                 │
│ ┌─────────────────────────────────────────────┐    │
│ │ [+ Lägg till] [📥 Importera röda dagar]    │    │
│ │                                             │    │
│ │ Datum      Namn           Kategori  Påslag │    │
│ │ 2025-06-20 Midsommar      🇸🇪       +400 kr │    │
│ │ 2025-12-24 Julafton       🇸🇪       +400 kr │    │
│ │ 2025-08-15 Hundutställning 🎪       +150 kr │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 🔄 FLÖDE: Hund → Bokning → Faktura

### **1. Hund skapas**

```sql
INSERT INTO dogs (org_id, owner_id, name, heightcm, ...)
→ heightcm avgör dog_size: small (<35), medium (35-54), large (55+)
```

### **2. Bokning skapas**

```sql
INSERT INTO bookings (org_id, dog_id, owner_id, start_date, end_date, ...)
→ Prisberäkning körs för varje natt
→ total_price = summa av alla nätter
```

### **3. Prisberäkning (per natt)**

```typescript
for (date = start_date; date < end_date; date++) {
  let nightPrice = boarding_prices.base_price; // 300 kr

  // STEG 1: Kolla specialdatum (HÖGSTA PRIO)
  const special = special_dates.find(date, org_id);
  if (special && special.is_active) {
    nightPrice += special.price_surcharge; // +400 kr midsommar
  }
  // STEG 2: Annars kolla helg
  else if (isWeekend(date)) {
    nightPrice += boarding_prices.weekend_surcharge; // +100 kr
  }

  // STEG 3: Applicera säsong (ALLTID)
  const season = boarding_seasons.find(date, org_id);
  if (season && season.is_active) {
    nightPrice *= season.price_multiplier; // x1.3
  }

  totalPrice += nightPrice;
}
```

### **4. Utcheckning**

```sql
UPDATE bookings SET status = 'checked_out', checkout_time = now()
→ Trigger: create_invoice_after_checkout()
→ INSERT INTO invoices (owner_id, total_amount, invoice_type='afterpayment')
```

### **5. Faktura skapas**

```sql
INSERT INTO invoices (
  org_id,
  owner_id,
  invoice_date,
  due_date,
  total_amount,
  invoice_type = 'afterpayment',
  status = 'draft'
)
→ INSERT INTO invoice_items (invoice_id, description, total_amount)
```

## ✅ FÖRDELAR MED DENNA LÖSNING

1. **Enkel att förstå** - 3 nivåer (Bas, Säsong, Specialdatum)
2. **Flexibel** - Kan hantera alla scenarion
3. **Användarvänlig** - Tydliga flikar i admin
4. **Långsiktigt hållbar** - Lätt att utöka
5. **Konfliktfri** - Tydlig prioritetsordning
6. **Minimal databas-ändring** - Bara städa + lägg till 1 tabell

## 🚀 NÄSTA STEG

1. ✅ Skapa `special_dates` tabell
2. ✅ Ta bort `holiday_surcharge` och `season_multiplier` från `boarding_prices`
3. ✅ Skapa UI för att hantera specialdatum
4. ✅ Implementera prisberäkningslogik
5. ✅ Skapa "Importera röda dagar"-funktion
6. ✅ Uppdatera dokumentation

---

**Dokumenterat: 2025-11-13**
**Status: Klar för implementation**
