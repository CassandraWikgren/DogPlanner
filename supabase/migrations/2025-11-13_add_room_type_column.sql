-- ========================================
-- FIX: Lägg till room_type kolumn i rooms
-- Datum: 2025-11-13
-- ========================================
--
-- Fel: "Could not find the 'room_type' column of 'rooms' in the schema cache"
-- Lösning: Lägg till kolumnen om den saknas

-- Lägg till room_type kolumn om den saknas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'room_type'
    ) THEN
        ALTER TABLE public.rooms 
        ADD COLUMN room_type TEXT CHECK (room_type IN ('daycare', 'boarding', 'both')) DEFAULT 'both';
        
        COMMENT ON COLUMN public.rooms.room_type IS 'Typ av rum: daycare (dagis), boarding (pensionat), both (båda)';
        
        RAISE NOTICE 'Kolumnen room_type har lagts till i rooms-tabellen';
    ELSE
        RAISE NOTICE 'Kolumnen room_type finns redan i rooms-tabellen';
    END IF;
END $$;

-- Verifiera att kolumnen finns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rooms' 
AND column_name = 'room_type';

-- ========================================
-- KLART!
-- ========================================
-- Kör denna SQL i Supabase SQL Editor
-- Uppdatera sedan sidan (F5)
