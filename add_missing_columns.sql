-- =====================================================
-- LÄGG TILL SAKNADE KOLUMNER I BOOKINGS-TABELLEN
-- =====================================================
-- Kör detta FÖRST i Supabase SQL Editor för att lägga
-- till kolumner som saknas i din databas
-- =====================================================

-- Lägg till discount_amount om den inte finns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Lägg till extra_service_ids om den inte finns (för tillvalstjänster)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS extra_service_ids jsonb;

-- Lägg till base_price om den inte finns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS base_price numeric;

-- Uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Lägg till trigger om den inte finns
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verifiera att kolumnerna finns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
