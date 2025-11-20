-- Lägg till fält för utomstående kunder i grooming_bookings och grooming_journal
-- Detta gör att man kan boka frisörtider för kunder som inte är registrerade i systemet
-- Inga GDPR-känsliga uppgifter samlas in för dessa kunder

-- Grooming Bookings - Utomstående kunder
ALTER TABLE grooming_bookings 
  ADD COLUMN IF NOT EXISTS external_customer_name text,
  ADD COLUMN IF NOT EXISTS external_customer_phone text,
  ADD COLUMN IF NOT EXISTS external_dog_name text,
  ADD COLUMN IF NOT EXISTS external_dog_breed text;

-- Grooming Journal - Utomstående kunder  
ALTER TABLE grooming_journal
  ADD COLUMN IF NOT EXISTS external_customer_name text,
  ADD COLUMN IF NOT EXISTS external_dog_name text,
  ADD COLUMN IF NOT EXISTS external_dog_breed text;

-- Kommentarer
COMMENT ON COLUMN grooming_bookings.external_customer_name IS 'Kundnamn för utomstående kunder (ej i systemet)';
COMMENT ON COLUMN grooming_bookings.external_customer_phone IS 'Telefon för utomstående kunder';
COMMENT ON COLUMN grooming_bookings.external_dog_name IS 'Hundnamn för utomstående kunder';
COMMENT ON COLUMN grooming_bookings.external_dog_breed IS 'Hundras för utomstående kunder';

COMMENT ON COLUMN grooming_journal.external_customer_name IS 'Kundnamn för utomstående kunder (från journal)';
COMMENT ON COLUMN grooming_journal.external_dog_name IS 'Hundnamn för utomstående kunder (från journal)';
COMMENT ON COLUMN grooming_journal.external_dog_breed IS 'Hundras för utomstående kunder (från journal)';

-- Verifiering
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('grooming_bookings', 'grooming_journal')
  AND column_name LIKE 'external%'
ORDER BY table_name, ordinal_position;
