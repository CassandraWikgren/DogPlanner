-- Lägg till tid för besöksbokning i interest_applications
-- Detta gör att man kan boka både dag OCH tid för besök

ALTER TABLE interest_applications 
ADD COLUMN IF NOT EXISTS visit_booked_time time;

-- Kommentar
COMMENT ON COLUMN interest_applications.visit_booked_time IS 'Tid för bokat besök (kompletterar visit_booked_date)';

-- Verifiera
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'interest_applications'
  AND column_name IN ('visit_booked_date', 'visit_booked_time')
ORDER BY ordinal_position;
