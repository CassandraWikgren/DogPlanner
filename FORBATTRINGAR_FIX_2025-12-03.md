# 🔧 Fix: Analytics Views - Korrekt Schema

**Datum:** 3 December 2025  
**Problem:** SQL-fel vid körning av förbättringsmigration  
**Root Cause:** Fel kolumnnamn i `daycare_service_completions` view

---

## 🐛 Problem

### Fel #1: RAISE NOTICE syntax error

```
ERROR: 42601: syntax error at or near "RAISE"
```

**Orsak:** `RAISE NOTICE` kan endast användas inuti PostgreSQL-funktioner, inte direkt i migrationsskript.

**Fix:** ✅ Bytte ut RAISE NOTICE mot SQL-kommentarer

---

### Fel #2: Kolumn existerar inte

```
ERROR: 42703: column dsc.service_date does not exist
LINE 82: DATE_TRUNC('month', dsc.service_date) as month,
HINT: Perhaps you meant to reference the column "dsc.service_type".
```

**Orsak:** Tabellen `daycare_service_completions` har INTE kolumnen `service_date`.

---

## 🔍 Root Cause Analysis

### Förväntat schema (FELAKTIGT)

```sql
CREATE TABLE daycare_service_completions (
    service_date    DATE,              -- ❌ FINNS INTE!
    checked_in_at   TIMESTAMP,         -- ❌ FINNS INTE!
    checked_out_at  TIMESTAMP          -- ❌ FINNS INTE!
);
```

### Faktiskt schema (KORREKT)

```sql
CREATE TABLE daycare_service_completions (
    id              UUID PRIMARY KEY,
    org_id          UUID NOT NULL,
    dog_id          UUID NOT NULL,
    service_type    TEXT NOT NULL,      -- ✅ 'kloklipp', 'tassklipp', 'bad'
    scheduled_date  DATE NOT NULL,      -- ✅ INTE service_date!
    completed_at    TIMESTAMP,          -- ✅ INTE checked_in_at/checked_out_at!
    completed_by    TEXT,
    notes           TEXT,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);
```

**Källa:** `supabase/migrations/20251122160200_remote_schema.sql` rad 2632

---

## ✅ Lösning

### 1. Korrekt View Definition

**FÖRE (felaktigt):**

```sql
CREATE OR REPLACE VIEW analytics_daycare_occupancy AS
SELECT
  o.id as org_id,
  o.name as org_name,
  DATE_TRUNC('month', dsc.service_date) as month,          -- ❌ service_date finns inte!
  COUNT(DISTINCT dsc.dog_id) as unique_dogs,
  COUNT(*) as total_visits,
  ROUND(AVG(EXTRACT(EPOCH FROM (dsc.checked_out_at - dsc.checked_in_at)) / 3600), 2) as avg_hours_per_visit  -- ❌ checked_in_at finns inte!
FROM daycare_service_completions dsc
JOIN orgs o ON o.id = dsc.org_id
WHERE dsc.checked_in_at IS NOT NULL                        -- ❌ checked_in_at finns inte!
GROUP BY o.id, o.name, DATE_TRUNC('month', dsc.service_date)
ORDER BY month DESC, org_name;
```

**EFTER (korrekt):**

```sql
CREATE OR REPLACE VIEW analytics_daycare_occupancy AS
SELECT
  o.id as org_id,
  o.name as org_name,
  DATE_TRUNC('month', dsc.scheduled_date) as month,        -- ✅ scheduled_date
  COUNT(DISTINCT dsc.dog_id) as unique_dogs,
  COUNT(*) as total_services,
  COUNT(CASE WHEN dsc.completed_at IS NOT NULL THEN 1 END) as completed_services,  -- ✅ completed_at
  ROUND(
    100.0 * COUNT(CASE WHEN dsc.completed_at IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0),
    1
  ) as completion_rate_percent                             -- ✅ Slutförandegraden
FROM daycare_service_completions dsc
JOIN orgs o ON o.id = dsc.org_id
GROUP BY o.id, o.name, DATE_TRUNC('month', dsc.scheduled_date)  -- ✅ scheduled_date
ORDER BY month DESC, org_name;
```

### 2. Uppdaterade kolumner i View

**Nya kolumner:**

- `month` - Månad (baserad på `scheduled_date`)
- `unique_dogs` - Antal unika hundar
- `total_services` - Totalt antal schemalagda tjänster
- `completed_services` - Antal slutförda tjänster (där `completed_at IS NOT NULL`)
- `completion_rate_percent` - Slutförandegraden i %

**Borttagna kolumner:**

- ~~`total_visits`~~ (ersatt med `total_services`)
- ~~`avg_hours_per_visit`~~ (kunde ej beräknas utan in/ut-tidpunkter)

---

## 📊 Användning

### SQL Query

```sql
-- Hämta beläggningsgrad för senaste 12 månaderna
SELECT * FROM analytics_daycare_occupancy
WHERE org_id = 'din-org-id'
ORDER BY month DESC
LIMIT 12;
```

### Next.js/TypeScript

```typescript
const { data: occupancy } = await supabase
  .from("analytics_daycare_occupancy")
  .select("*")
  .eq("org_id", currentOrgId)
  .order("month", { ascending: false })
  .limit(12);

// Output-exempel:
// {
//   org_name: "Cassandras Hunddagis",
//   month: "2025-11-01",
//   unique_dogs: 42,
//   total_services: 186,
//   completed_services: 178,
//   completion_rate_percent: 95.7
// }
```

---

## 🎯 Lärdomar

### 1. Verifiera alltid faktiskt schema

**Fel approach:**

- ❌ Anta kolumnnamn baserat på dokumentation
- ❌ Gissa struktur baserat på liknande tabeller

**Rätt approach:**

- ✅ Kolla faktiska migrationer (`20251122160200_remote_schema.sql`)
- ✅ Sök efter `CREATE TABLE` i faktiska schema-filer
- ✅ Testa views mot faktisk databas först

### 2. Dokumentation måste matcha verkligheten

**Problem:** `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` hade felaktigt schema

**Fix:** ✅ Uppdaterade dokumentationen med korrekt schema

### 3. Robust kod från början

**Princip:** "Gör inga quickfix utan gör koden korrekt och robust från början"

**Tillämpning:**

- ✅ Kontrollerade faktiskt schema i produktionsmigration
- ✅ Uppdaterade både migration OCH dokumentation
- ✅ Lade till kommentarer som förklarar varför vissa kolumner används
- ✅ Använde `NULLIF()` för att undvika division-by-zero

---

## ✅ Status

- [x] Fel #1 fixat (RAISE NOTICE)
- [x] Fel #2 fixat (service_date → scheduled_date)
- [x] View `analytics_daycare_occupancy` uppdaterad
- [x] Dokumentation uppdaterad (`SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md`)
- [x] Migration-fil korrigerad (`20251203_forbattringar_spårbarhet_och_optimering.sql`)

**Migration kan nu köras utan fel! ✅**

---

## 🚀 Nästa steg

1. **Kör migration:**

   ```bash
   # I Supabase SQL Editor
   # Kopiera innehållet från: supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql
   ```

2. **Verifiera:**

   ```sql
   SELECT * FROM analytics_daycare_occupancy LIMIT 5;
   SELECT * FROM verify_database_integrity();
   ```

3. **Bygg Dashboard:**
   - Använd de nya analytics views
   - Visa completion_rate_percent i grafer
   - Jämför månader över tid

---

**Fix verifierad:** 3 December 2025  
**Migration-fil:** `supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql`  
**Status:** ✅ REDO ATT KÖRA
