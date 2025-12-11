-- =====================================================
-- ADD staff_notes COLUMN TO booking_services
-- 2025-12-11
-- =====================================================
-- Felet: "Could not find the 'staff_notes' column of 'booking_services' in the schema cache"
-- Lösning: Lägg till kolumnen

-- Lägg till staff_notes kolumn om den inte finns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_services' 
        AND column_name = 'staff_notes'
    ) THEN
        ALTER TABLE booking_services ADD COLUMN staff_notes TEXT;
        COMMENT ON COLUMN booking_services.staff_notes IS 'Personalanteckningar för tjänsten, t.ex. "Husse ringde och ville ha bad"';
        RAISE NOTICE 'Added staff_notes column to booking_services';
    ELSE
        RAISE NOTICE 'staff_notes column already exists in booking_services';
    END IF;
END $$;

-- Verifiera att kolumnen finns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'booking_services'
ORDER BY ordinal_position;
