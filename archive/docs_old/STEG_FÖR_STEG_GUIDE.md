# Steg-för-steg: Aktivera organisationsval-systemet

## ⚠️ VIKTIGT: Kör dessa i RÄTT ORDNING!

## Steg 1: Kör migrationen FÖRST

Gå till Supabase Dashboard → SQL Editor → New Query

Kopiera och kör innehållet från:
`supabase/migrations/20251117_add_org_location_and_services.sql`

```sql
-- Migration: Lägg till län, kommun och tjänstetyper till organisationer
-- Skapad: 2025-11-17
-- Syfte: Möjliggöra filtrering av organisationer baserat på geografisk plats och tjänster

-- Lägg till län, kommun och service_types till orgs-tabellen
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS lan text,
  ADD COLUMN IF NOT EXISTS kommun text,
  ADD COLUMN IF NOT EXISTS service_types text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_visible_to_customers boolean DEFAULT true;

-- Index för snabbare filtrering
CREATE INDEX IF NOT EXISTS idx_orgs_lan ON orgs(lan);
CREATE INDEX IF NOT EXISTS idx_orgs_kommun ON orgs(kommun);
CREATE INDEX IF NOT EXISTS idx_orgs_service_types ON orgs USING gin(service_types);
CREATE INDEX IF NOT EXISTS idx_orgs_visible ON orgs(is_visible_to_customers) WHERE is_visible_to_customers = true;

-- Kommentarer
COMMENT ON COLUMN orgs.lan IS 'Län där organisationen är verksam (t.ex. "Stockholm", "Västra Götaland")';
COMMENT ON COLUMN orgs.kommun IS 'Kommun där organisationen är verksam (t.ex. "Stockholm", "Göteborg")';
COMMENT ON COLUMN orgs.service_types IS 'Array av tjänster: ["hunddagis", "hundpensionat", "hundfrisor"]';
COMMENT ON COLUMN orgs.is_visible_to_customers IS 'Om organisationen ska synas i public organisation selector (false = privat/test-organisation)';

-- Logga migration
INSERT INTO migrations (version, description, execution_time_ms)
VALUES ('20251117_add_org_location_and_services', 'Lägg till län, kommun och service_types till orgs för organisation selection system', 0);
```

**Förväntat resultat:** "Success. No rows returned"

---

## Steg 2: Verifiera att kolumnerna finns

Kör denna query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orgs'
  AND column_name IN ('lan', 'kommun', 'service_types', 'is_visible_to_customers')
ORDER BY column_name;
```

**Förväntat resultat:** Du ska se 4 rader:

- is_visible_to_customers | boolean
- kommun | text
- lan | text
- service_types | ARRAY

---

## Steg 3: Uppdatera dina organisationer

Nu kan du använda `UPDATE_ORGS_EXAMPLES.sql`!

### Snabbstart - Uppdatera en organisation:

```sql
-- 1. Hitta din organisation först
SELECT id, name FROM orgs;

-- 2. Uppdatera med rätt info
UPDATE orgs
SET
  lan = 'Stockholm',              -- Byt till rätt län
  kommun = 'Stockholm',           -- Byt till rätt kommun
  service_types = ARRAY['hunddagis', 'hundpensionat'], -- Välj tjänster
  is_visible_to_customers = true
WHERE id = 'DIN_ORG_UUID_HÄR';    -- Använd ID från steg 1
```

### Alternativ: Uppdatera via namn

```sql
UPDATE orgs
SET
  lan = 'Stockholm',
  kommun = 'Stockholm',
  service_types = ARRAY['hunddagis', 'hundpensionat'],
  is_visible_to_customers = true
WHERE name = 'DITT_FÖRETAGSNAMN';  -- Byt ut mot exakt företagsnamn
```

---

## Steg 4: Verifiera att det fungerar

```sql
SELECT
  name,
  lan,
  kommun,
  service_types,
  is_visible_to_customers,
  phone,
  email
FROM orgs
WHERE is_visible_to_customers = true;
```

**Du ska nu se dina organisationer med län, kommun och service_types!**

---

## Steg 5: Testa i appen

1. Starta din dev-server: `npm run dev`
2. Gå till: http://localhost:3000/ansokan/hunddagis
3. Du ska nu se:
   - Steg 1: "Välj hunddagis"
   - Dropdown för att välja län
   - Dropdown för att välja kommun (efter att län valts)
   - Lista med tillgängliga hunddagis i vald kommun

---

## Felsökning

### Problem: "column 'lan' does not exist"

**Lösning:** Du har inte kört migrationen. Gå tillbaka till Steg 1.

### Problem: "Inga organisationer syns i listan"

**Lösningar:**

1. Kontrollera att `is_visible_to_customers = true`:

   ```sql
   SELECT name, is_visible_to_customers FROM orgs;
   ```

2. Kontrollera att `service_types` är korrekt satt:

   ```sql
   SELECT name, service_types FROM orgs;
   ```

3. Kontrollera att `lan` och `kommun` är ifyllda:
   ```sql
   SELECT name, lan, kommun FROM orgs WHERE lan IS NULL OR kommun IS NULL;
   ```

### Problem: "Det finns för närvarande inga anslutna hunddagis"

**Orsak:** Ingen organisation har `'hunddagis'` i sin `service_types` array.

**Lösning:**

```sql
UPDATE orgs
SET service_types = ARRAY['hunddagis']
WHERE name = 'DITT_FÖRETAG';
```

---

## Komplett exempel för testning

```sql
-- Skapa en test-organisation om du inte har någon
INSERT INTO orgs (name, lan, kommun, service_types, is_visible_to_customers, phone, email, address)
VALUES (
  'Testdagis Stockholm',
  'Stockholm',
  'Stockholm',
  ARRAY['hunddagis', 'hundpensionat'],
  true,
  '08-123 45 67',
  'test@exempel.se',
  'Testvägen 1'
);

-- Verifiera
SELECT name, lan, kommun, service_types, is_visible_to_customers FROM orgs;
```

---

## Framgång! 🎉

När allt fungerar ska du kunna:

1. ✅ Gå till ansökningsformulär
2. ✅ Se län-dropdown
3. ✅ Välja län → se kommuner
4. ✅ Välja kommun → se företag
5. ✅ Välja företag och skicka ansökan
6. ✅ Ansökan skapas med rätt `org_id` i databasen
