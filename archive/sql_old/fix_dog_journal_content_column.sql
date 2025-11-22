-- Fix dog_journal missing content column
-- Detta script lägger till 'content' kolumnen om den saknas

-- Kontrollera om kolumnen redan finns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dog_journal' 
        AND column_name = 'content'
    ) THEN
        -- Lägg till content-kolumnen
        ALTER TABLE dog_journal ADD COLUMN content text NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Kolumn "content" tillagd i dog_journal';
    ELSE
        RAISE NOTICE 'ℹ️ Kolumn "content" finns redan i dog_journal';
    END IF;
END $$;

-- Verifiera att kolumnen finns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'dog_journal'
ORDER BY ordinal_position;
