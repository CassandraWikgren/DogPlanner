-- =====================================================
-- Migration: Add description column to subscription_types
-- Datum: 2025-12-10
-- Beskrivning: Lägger till description-kolumn för konsistens 
--              med andra prissättnings-tabeller (grooming_prices har det)
-- =====================================================

-- Lägg till description kolumn
ALTER TABLE subscription_types 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Kommentar
COMMENT ON COLUMN subscription_types.description IS 'Beskrivning av abonnemangstypen, t.ex. "Liten hund" eller "Passar hundar under 35cm"';

-- Verifiera
DO $$
BEGIN
    RAISE NOTICE '✅ description kolumn tillagd i subscription_types';
END $$;
