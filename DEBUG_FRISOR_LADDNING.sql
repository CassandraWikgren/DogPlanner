-- ============================================================
-- DEBUG: Frisörsidan laddar inte
-- ============================================================
-- Fel: "Kunde inte ladda bokningar: TypeError: Load failed"
-- 
-- Detta script kontrollerar:
-- 1. Om grooming-tabellerna finns
-- 2. Om det finns RLS-policies som blockerar
-- 3. Om det finns data i tabellerna
-- ============================================================

-- 1️⃣ Kontrollera att grooming-tabellerna finns
-- ============================================================
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename;

-- Förväntat: 3 rader ska returneras
-- Om inga rader: Tabellerna finns inte → Kör grooming-migrations


-- 2️⃣ Kontrollera RLS-status
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename;

-- Om rls_enabled = true → Kolla policies nedan


-- 3️⃣ Kontrollera RLS-policies för grooming-tabellerna
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename, policyname;

-- Förväntat: Policies som tillåter SELECT för authenticated users med rätt org_id
-- Om inga policies och RLS är på → Data blockeras helt!


-- 4️⃣ Räkna data i tabellerna (kräver att RLS är av eller att du har rätt org_id)
-- ============================================================
SELECT 
  'grooming_bookings' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT org_id) as org_count,
  MIN(appointment_date) as earliest_date,
  MAX(appointment_date) as latest_date
FROM grooming_bookings

UNION ALL

SELECT 
  'grooming_journal' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT org_id) as org_count,
  MIN(appointment_date) as earliest_date,
  MAX(appointment_date) as latest_date
FROM grooming_journal

UNION ALL

SELECT 
  'grooming_prices' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT org_id) as org_count,
  NULL as earliest_date,
  NULL as latest_date
FROM grooming_prices;


-- 5️⃣ Testa att läsa från grooming_bookings med dagens datum
-- ============================================================
SELECT 
  gb.id,
  gb.appointment_date,
  gb.appointment_time,
  gb.service_type,
  gb.status,
  gb.dog_id,
  gb.external_customer_name,
  gb.external_dog_name,
  gb.org_id
FROM grooming_bookings gb
WHERE gb.appointment_date = CURRENT_DATE
ORDER BY gb.appointment_time
LIMIT 5;

-- Om detta returnerar "permission denied" → RLS blockerar
-- Om detta returnerar 0 rader → Inga bokningar idag (OK)
-- Om detta returnerar data → Tabellen fungerar!


-- 6️⃣ LÖSNING: Om RLS blockerar (lägg till policies)
-- ============================================================
-- OBS: Kör bara detta om RLS är PÅ och blockerar access

-- För grooming_bookings:
CREATE POLICY "Users can view their org grooming bookings"
ON grooming_bookings FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- För grooming_journal:
CREATE POLICY "Users can view their org grooming journal"
ON grooming_journal FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- För grooming_prices:
CREATE POLICY "Users can view their org grooming prices"
ON grooming_prices FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);


-- 7️⃣ ALTERNATIV LÖSNING: Stäng av RLS helt (DEV ONLY!)
-- ============================================================
-- OBS: Använd bara i dev-miljö, INTE i produktion!

-- ALTER TABLE grooming_bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grooming_journal DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grooming_prices DISABLE ROW LEVEL SECURITY;


-- 8️⃣ SAMMANFATTNING (kör detta sist)
-- ============================================================
SELECT 
  'GROOMING SYSTEM STATUS' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'grooming_bookings') 
    THEN '✅ Tabeller finns'
    ELSE '❌ Tabeller saknas - kör migrations!'
  END as tables_exist,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'grooming_bookings' AND rowsecurity = true
    ) 
    THEN '⚠️ RLS är PÅ - kolla policies'
    ELSE '✅ RLS är AV eller policies finns'
  END as rls_status,
  (SELECT COUNT(*) FROM grooming_bookings)::text || ' bokningar' as data_count;
