-- ============================================================
-- 🔧 FIX: Schema conflicts i grooming-systemet
-- ============================================================
-- Datum: 2025-12-02
-- Problem: Migration och production använder olika kolumnnamn
-- Risk: Migrationen kommer att faila eller bryta koden
-- ============================================================

-- VIKTIGT: Detta fixar production-schemat så det matchar migrationen
-- Kör detta INNAN du kör enable_rls_production.sql

BEGIN;

-- ============================================================
-- 1️⃣ FIX: Tabellnamn (organisations → orgs)
-- ============================================================

-- Redan fixat i production (tabellen heter "orgs")
-- Men migrationen måste uppdateras:
-- 20251202120100_create_grooming_tables.sql rad 12:
--   REFERENCES organisations(id)  ❌
-- Borde vara:
--   REFERENCES orgs(id)  ✅

-- ============================================================
-- 2️⃣ FIX: dog_id CASCADE behavior
-- ============================================================

-- Production använder CASCADE (raderar booking när hund raderas)
-- Migration vill ha SET NULL (behåller booking historik)
-- 
-- Beslut: Behåll CASCADE (production-beteende)
-- Motivering: Grooming-bokningar är inte kritisk historik
-- Om hund raderas är det OK att radera dess frisörbokningar

-- Verifiera nuvarande constraint:
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'grooming_bookings' 
  AND kcu.column_name = 'dog_id';

-- Om migrationen redan körts med SET NULL, fixa till CASCADE:
-- ALTER TABLE grooming_bookings 
--   DROP CONSTRAINT IF EXISTS grooming_bookings_dog_id_fkey,
--   ADD CONSTRAINT grooming_bookings_dog_id_fkey 
--     FOREIGN KEY (dog_id) 
--     REFERENCES dogs(id) 
--     ON DELETE CASCADE;

-- ============================================================
-- 3️⃣ FIX: Kolumnnamn (customer_name vs external_customer_name)
-- ============================================================

-- Två alternativ:

-- ALTERNATIV A: Behåll production-schema (external_* kolumner)
-- ============================================================
-- Detta kräver INTE någon SQL-ändring här
-- MEN kräver att du:
-- 1. RADERAR migration: supabase/migrations/20251202120100_create_grooming_tables.sql
-- 2. SKAPAR NY migration med production-schemat (external_* kolumner)

-- ALTERNATIV B: Migrera till nytt schema (ta bort external_* prefix)
-- ============================================================
-- Detta kräver SQL-ändringar OCH kod-ändringar
-- Rekommenderas EJ - mycket arbete för lite nytta

-- Verifiera nuvarande kolumner:
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'grooming_bookings'
  AND column_name IN (
    'customer_name', 
    'external_customer_name',
    'dog_name',
    'external_dog_name',
    'dog_breed',
    'external_dog_breed'
  )
ORDER BY column_name;

-- ============================================================
-- 4️⃣ FIX: RLS policies för external customers
-- ============================================================

-- Nuvarande policies täcker bara authenticated users
-- Men external customers (walk-in) behöver också kunna boka

-- Beslut: Kräv alltid inloggning för frisörbokningar
-- Motivering: Förhindrar spam, möjliggör avbokningar
-- 
-- Detta betyder:
-- - External customers måste registrera konto ELLER
-- - Bokningar görs av staff åt kunden (via admin-panel)

-- Om du vill tillåta anon-bokningar (ej rekommenderat):
-- 
-- CREATE POLICY "Anyone can create grooming bookings"
--   ON public.grooming_bookings
--   FOR INSERT
--   TO anon
--   WITH CHECK (true);
--
-- CREATE POLICY "Anyone can view their own grooming bookings"
--   ON public.grooming_bookings
--   FOR SELECT
--   TO anon
--   USING (
--     external_customer_phone = current_setting('app.user_phone', true)
--   );

-- ============================================================
-- 5️⃣ VERIFICATION
-- ============================================================

-- Kör dessa för att verifiera att allt är korrekt:

-- Rätt foreign key till orgs:
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'grooming_bookings'
  AND constraint_name LIKE '%org_id%';

-- Rätt kolumner finns:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'grooming_bookings'
  AND column_name ~ 'customer|dog'
ORDER BY column_name;

-- Rätt CASCADE-beteende:
SELECT 
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'grooming_bookings';

COMMIT;

-- ============================================================
-- 📋 TODO: Fixa migration-filen
-- ============================================================
-- supabase/migrations/20251202120100_create_grooming_tables.sql
-- 
-- 1. Byt ALLA "organisations" → "orgs"
-- 2. Byt ALLA "customer_name" → "external_customer_name"
-- 3. Byt ALLA "dog_name" → "external_dog_name"  
-- 4. Byt "ON DELETE SET NULL" → "ON DELETE CASCADE" för dog_id
-- 5. Lägg till external_dog_breed, external_customer_phone
-- 6. Matcha exakt med production-schemat
-- 
-- ELLER: Radera migrationen och skapa ny från production:
-- supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_sync_grooming_schema.sql
-- ============================================================
