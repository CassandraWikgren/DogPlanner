-- =============================================================================
-- VERIFIERING & FIX: dogs-tabellen och dog_journal
-- Kör detta i Supabase SQL Editor för att fixa strukturen
-- Datum: 2025-12-07
-- =============================================================================

-- STEG 1: Visa aktuell dogs-struktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dogs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEG 2: Visa aktuell dog_journal-struktur  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dog_journal' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- STEG 3: LÄGG TILL SAKNADE KOLUMNER I dogs-tabellen
-- (Kör dessa endast om kolumnerna saknas)
-- =============================================================================

-- Gender
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'gender') THEN
    ALTER TABLE dogs ADD COLUMN gender TEXT;
    RAISE NOTICE 'Added column: gender';
  END IF;
END $$;

-- Insurance company
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'insurance_company') THEN
    ALTER TABLE dogs ADD COLUMN insurance_company TEXT;
    RAISE NOTICE 'Added column: insurance_company';
  END IF;
END $$;

-- Insurance number
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'insurance_number') THEN
    ALTER TABLE dogs ADD COLUMN insurance_number TEXT;
    RAISE NOTICE 'Added column: insurance_number';
  END IF;
END $$;

-- destroys_things
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'destroys_things') THEN
    ALTER TABLE dogs ADD COLUMN destroys_things BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: destroys_things';
  END IF;
END $$;

-- is_house_trained
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'is_house_trained') THEN
    ALTER TABLE dogs ADD COLUMN is_house_trained BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: is_house_trained';
  END IF;
END $$;

-- is_escape_artist (rymningsbenägen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'is_escape_artist') THEN
    ALTER TABLE dogs ADD COLUMN is_escape_artist BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: is_escape_artist';
  END IF;
END $$;

-- can_be_with_other_dogs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'can_be_with_other_dogs') THEN
    ALTER TABLE dogs ADD COLUMN can_be_with_other_dogs BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: can_be_with_other_dogs';
  END IF;
END $$;

-- food_info
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'food_info') THEN
    ALTER TABLE dogs ADD COLUMN food_info TEXT;
    RAISE NOTICE 'Added column: food_info';
  END IF;
END $$;

-- medical_notes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'medical_notes') THEN
    ALTER TABLE dogs ADD COLUMN medical_notes TEXT;
    RAISE NOTICE 'Added column: medical_notes';
  END IF;
END $$;

-- food_type (pensionat-specifikt)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'food_type') THEN
    ALTER TABLE dogs ADD COLUMN food_type TEXT; -- 'own', 'pensionat'
    RAISE NOTICE 'Added column: food_type';
  END IF;
END $$;

-- food_amount
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'food_amount') THEN
    ALTER TABLE dogs ADD COLUMN food_amount TEXT;
    RAISE NOTICE 'Added column: food_amount';
  END IF;
END $$;

-- food_times
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'food_times') THEN
    ALTER TABLE dogs ADD COLUMN food_times TEXT;
    RAISE NOTICE 'Added column: food_times';
  END IF;
END $$;

-- food_brand
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'food_brand') THEN
    ALTER TABLE dogs ADD COLUMN food_brand TEXT;
    RAISE NOTICE 'Added column: food_brand';
  END IF;
END $$;

-- can_share_room
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dogs' AND column_name = 'can_share_room') THEN
    ALTER TABLE dogs ADD COLUMN can_share_room BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: can_share_room';
  END IF;
END $$;

-- =============================================================================
-- STEG 4: GÖR org_id NULLBAR FÖR PENSIONATKUNDER (Pattern 3)
-- =============================================================================

-- Tillåt NULL i org_id för dogs
ALTER TABLE dogs ALTER COLUMN org_id DROP NOT NULL;

-- =============================================================================
-- STEG 5: FIX dog_journal - ta bort referens till entry_type
-- Kolla först vilka triggers som finns
-- =============================================================================

-- Lista alla triggers på dog_journal
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'dog_journal';

-- Lista alla triggers på dogs
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'dogs';

-- HITTA OCH VISA ALLA FUNKTIONER SOM REFERERAR TILL entry_type
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%entry_type%';

-- =============================================================================
-- STEG 5B: OM entry_type KOLUMNEN BEHÖVS - LÄGG TILL DEN
-- =============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dog_journal' AND column_name = 'entry_type') THEN
    ALTER TABLE dog_journal ADD COLUMN entry_type TEXT;
    RAISE NOTICE 'Added column: entry_type to dog_journal';
  END IF;
END $$;

-- ALTERNATIVT: Om du vill ta bort felaktiga triggers istället:
-- Lista först funktioner som kan orsaka problemet:
SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%dog_journal%' 
  AND p.prosrc LIKE '%entry_type%'
  AND n.nspname = 'public';

-- =============================================================================
-- STEG 6: VISA UPPDATERAD STRUKTUR
-- =============================================================================

-- Visa dogs-struktur efter ändringar
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dogs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- STEG 7: TESTA INSERT (kör separat för att verifiera)
-- =============================================================================

-- Testa att skapa en hund utan org_id (pensionatkund)
-- INSERT INTO dogs (owner_id, name, breed)
-- VALUES ('TEST-USER-ID', 'TestHund', 'Blandrass')
-- RETURNING id;

-- Om ovanstående fungerar, ta bort testhunden:
-- DELETE FROM dogs WHERE name = 'TestHund';
