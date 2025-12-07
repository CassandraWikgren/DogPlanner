-- =============================================================================
-- ROBUST PERMANENT FIX: dogs-tabellen med fullständig struktur
-- Version: 2.0 - Produktionsklar
-- Datum: 2025-12-07
-- =============================================================================
-- 
-- DENNA FIL ÄR DEN AUKTORITATIVA KÄLLAN FÖR dogs-TABELLENS STRUKTUR
-- 
-- Efter körning:
-- 1. Uppdatera types/database.ts med samma fält
-- 2. Uppdatera SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md
-- 3. Commita denna fil som referens
-- =============================================================================

-- ============================================
-- STEG 1: SÄKERHETSKOPIERA BEFINTLIG DATA
-- ============================================
-- Kör detta FÖRST för att se vad som finns:
-- SELECT * FROM dogs LIMIT 5;

-- ============================================
-- STEG 2: LÄGG TILL ALLA KOLUMNER (IDEMPOTENT)
-- ============================================
-- Dessa statements är säkra att köra flera gånger

-- Grundläggande info
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS gender TEXT;
COMMENT ON COLUMN dogs.gender IS 'Kön: hane/tik';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
COMMENT ON COLUMN dogs.weight_kg IS 'Vikt i kg';

-- Försäkring
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS insurance_company TEXT;
COMMENT ON COLUMN dogs.insurance_company IS 'Försäkringsbolag, t.ex. Agria';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS insurance_number TEXT;
COMMENT ON COLUMN dogs.insurance_number IS 'Försäkringsnummer';

-- Beteende-checkboxar
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS destroys_things BOOLEAN DEFAULT false;
COMMENT ON COLUMN dogs.destroys_things IS 'Biter/förstör saker';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_house_trained BOOLEAN DEFAULT true;
COMMENT ON COLUMN dogs.is_house_trained IS 'Rumsren (kissar inte inne)';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_escape_artist BOOLEAN DEFAULT false;
COMMENT ON COLUMN dogs.is_escape_artist IS 'Rymningsbenägen';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_be_with_other_dogs BOOLEAN DEFAULT true;
COMMENT ON COLUMN dogs.can_be_with_other_dogs IS 'Kan vara med andra hundar';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_share_room BOOLEAN DEFAULT false;
COMMENT ON COLUMN dogs.can_share_room IS 'Kan dela rum på pensionat';

-- Matinformation
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_type TEXT;
COMMENT ON COLUMN dogs.food_type IS 'Fodertyp: own/pensionat';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_brand TEXT;
COMMENT ON COLUMN dogs.food_brand IS 'Fodermärke, t.ex. Royal Canin';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_amount TEXT;
COMMENT ON COLUMN dogs.food_amount IS 'Mängd per mål, t.ex. 2 dl';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_times TEXT;
COMMENT ON COLUMN dogs.food_times IS 'Antal mål per dag, t.ex. 2 ggr/dag';

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_info TEXT;
COMMENT ON COLUMN dogs.food_info IS 'Övrig matinformation (fritext)';

-- Hälsa
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS medical_notes TEXT;
COMMENT ON COLUMN dogs.medical_notes IS 'Medicinska anteckningar';

-- ============================================
-- STEG 3: GÖR org_id NULLBAR (Pattern 3)
-- ============================================
-- Pensionatkunder har org_id = NULL
-- Deras hundar kopplas via owner_id istället

DO $$
BEGIN
  -- Kontrollera om org_id har NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dogs' 
    AND column_name = 'org_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE dogs ALTER COLUMN org_id DROP NOT NULL;
    RAISE NOTICE '✅ org_id är nu nullable för pensionatkunder';
  ELSE
    RAISE NOTICE 'ℹ️ org_id var redan nullable';
  END IF;
END $$;

-- ============================================
-- STEG 4: FIXA dog_journal
-- ============================================

ALTER TABLE dog_journal ADD COLUMN IF NOT EXISTS entry_type TEXT;
COMMENT ON COLUMN dog_journal.entry_type IS 'Typ av journalpost: note/checkin/checkout/health';

-- ============================================
-- STEG 5: RLS POLICY FÖR PENSIONATKUNDER
-- ============================================
-- Tillåt pensionatkunder att hantera sina egna hundar

-- Ta bort gammal policy om den finns
DROP POLICY IF EXISTS "Pensionatkunder kan hantera sina hundar" ON dogs;

-- Skapa ny policy
CREATE POLICY "Pensionatkunder kan hantera sina hundar"
ON dogs
FOR ALL
USING (
  -- Antingen: användaren tillhör samma org
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  -- Eller: pensionatkund som äger hunden direkt (org_id är NULL)
  (org_id IS NULL AND owner_id = auth.uid())
)
WITH CHECK (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  (org_id IS NULL AND owner_id = auth.uid())
);

-- ============================================
-- STEG 6: VERIFIERA STRUKTUREN
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  COALESCE(
    (SELECT pg_catalog.col_description(c.oid, cols.ordinal_position::int)
     FROM pg_catalog.pg_class c
     WHERE c.relname = 'dogs'),
    ''
  ) as description
FROM information_schema.columns cols
WHERE table_name = 'dogs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- RESULTAT: FÖRVÄNTAD KOLUMNLISTA
-- ============================================
/*
Grundläggande:
- id (UUID, PK)
- org_id (UUID, FK, NULLABLE för pensionatkunder)
- owner_id (UUID, FK)
- room_id (UUID, FK, nullable)
- name (TEXT, NOT NULL)
- breed (TEXT)
- birth (DATE)
- heightcm (INTEGER)
- gender (TEXT) - NY

Abonnemang (dagis):
- subscription (TEXT)
- days (TEXT)
- startdate (DATE)
- enddate (DATE)

Hälsa:
- vaccdhp (DATE)
- vaccpi (DATE)
- is_castrated (BOOLEAN)
- allergies (TEXT)
- medications (TEXT)
- special_needs (TEXT)
- behavior_notes (TEXT)
- medical_notes (TEXT) - NY

Försäkring:
- insurance_company (TEXT) - NY
- insurance_number (TEXT) - NY

Beteende-checkboxar:
- destroys_things (BOOLEAN) - NY
- is_house_trained (BOOLEAN) - NY
- is_escape_artist (BOOLEAN) - NY
- can_be_with_other_dogs (BOOLEAN) - NY
- can_share_room (BOOLEAN) - NY

Mat:
- food_type (TEXT) - NY
- food_brand (TEXT) - NY
- food_amount (TEXT) - NY
- food_times (TEXT) - NY
- food_info (TEXT) - NY

Övrigt:
- photo_url (TEXT)
- notes (TEXT)
- events (JSONB)
- checked_in (BOOLEAN)
- checkin_date (TIMESTAMP)
- checkout_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
*/
