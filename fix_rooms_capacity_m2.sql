-- FIX: Lägg till capacity_m2 kolumn i rooms-tabellen om den saknas
-- Kör denna i Supabase SQL Editor

-- Lägg till capacity_m2 om den inte finns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' 
    AND column_name = 'capacity_m2'
  ) THEN
    ALTER TABLE rooms ADD COLUMN capacity_m2 numeric NOT NULL DEFAULT 15;
    RAISE NOTICE 'Kolumn capacity_m2 tillagd i rooms-tabellen';
  ELSE
    RAISE NOTICE 'Kolumn capacity_m2 finns redan i rooms-tabellen';
  END IF;
END $$;

-- Uppdatera befintliga rum som har NULL capacity_m2 till ett standard-värde
UPDATE rooms 
SET capacity_m2 = 15 
WHERE capacity_m2 IS NULL;

-- Visa alla rum för att verifiera
SELECT id, name, capacity_m2, room_type, is_active 
FROM rooms 
ORDER BY created_at DESC
LIMIT 10;
