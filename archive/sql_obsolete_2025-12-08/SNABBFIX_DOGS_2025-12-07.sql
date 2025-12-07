-- =============================================================================
-- ROBUST FIX: Fullständig dogs & dog_journal struktur
-- Kör HELA detta skript i Supabase SQL Editor
-- Datum: 2025-12-07
-- 
-- Detta skript är IDEMPOTENT - säkert att köra flera gånger
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEG 1: DOGS-TABELLEN - Gör org_id nullable (Pattern 3 pensionatkunder)
-- =============================================================================

-- Säkerställ att org_id tillåter NULL
ALTER TABLE dogs ALTER COLUMN org_id DROP NOT NULL;

-- =============================================================================
-- STEG 2: DOGS-TABELLEN - Lägg till alla kolumner som kundportalen behöver
-- =============================================================================

-- Grundläggande profilinfo
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- Försäkring
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS insurance_company TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS insurance_number TEXT;

-- Hälsa & medicin
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_castrated BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS special_needs TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS behavior_notes TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Beteende-checkboxar
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS destroys_things BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_house_trained BOOLEAN DEFAULT true;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_escape_artist BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_be_with_other_dogs BOOLEAN DEFAULT true;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_share_room BOOLEAN DEFAULT false;

-- Matinformation
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_type TEXT; -- 'own' eller 'pensionat'
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_brand TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_amount TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_times TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_info TEXT; -- Fri text för dagis

-- =============================================================================
-- STEG 3: DOG_JOURNAL - Lägg till entry_type om den saknas
-- =============================================================================

ALTER TABLE dog_journal ADD COLUMN IF NOT EXISTS entry_type TEXT;

-- =============================================================================
-- STEG 4: KOMMENTARER FÖR DOKUMENTATION
-- =============================================================================

COMMENT ON COLUMN dogs.org_id IS 'NULL för pensionatkunder (Pattern 3), sätts för dagis/frisörkunder';
COMMENT ON COLUMN dogs.gender IS 'hane eller tik';
COMMENT ON COLUMN dogs.food_type IS 'own = eget foder, pensionat = pensionatets foder';
COMMENT ON COLUMN dogs.can_share_room IS 'Kan hunden dela rum med annan hund på pensionat';
COMMENT ON COLUMN dog_journal.entry_type IS 'note, checkin, checkout, health, etc';

-- =============================================================================
-- STEG 5: VERIFIERA RESULTATET
-- =============================================================================

COMMIT;

-- Visa dogs-struktur efter ändringar
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dogs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Visa dog_journal-struktur
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'dog_journal' 
AND table_schema = 'public'
ORDER BY ordinal_position;
