-- ============================================================
-- 🔐 PRODUCTION RLS POLICIES - Enable säker multi-tenant access
-- ============================================================
-- Datum: 2025-12-02
-- Syfte: Enable RLS med policies för production deployment
-- VIKTIGT: Kör detta EFTER att du testat att allt funkar med RLS avstängt
-- ============================================================

-- ============================================================
-- 1️⃣ GROOMING TABLES
-- ============================================================

-- grooming_bookings
ALTER TABLE public.grooming_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org grooming bookings"
  ON public.grooming_bookings
  FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their org grooming bookings"
  ON public.grooming_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org grooming bookings"
  ON public.grooming_bookings
  FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org grooming bookings"
  ON public.grooming_bookings
  FOR DELETE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

-- grooming_journal
ALTER TABLE public.grooming_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org grooming journal"
  ON public.grooming_journal
  FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their org grooming journal"
  ON public.grooming_journal
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org grooming journal"
  ON public.grooming_journal
  FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

-- grooming_prices
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org grooming prices"
  ON public.grooming_prices
  FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their org grooming prices"
  ON public.grooming_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org grooming prices"
  ON public.grooming_prices
  FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org grooming prices"
  ON public.grooming_prices
  FOR DELETE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

-- ============================================================
-- 2️⃣ PENSIONAT TABLES
-- ============================================================

-- boarding_seasons
ALTER TABLE public.boarding_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org boarding seasons"
  ON public.boarding_seasons
  FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their org boarding seasons"
  ON public.boarding_seasons
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org boarding seasons"
  ON public.boarding_seasons
  FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org boarding seasons"
  ON public.boarding_seasons
  FOR DELETE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

-- special_dates
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org special dates"
  ON public.special_dates
  FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their org special dates"
  ON public.special_dates
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org special dates"
  ON public.special_dates
  FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org special dates"
  ON public.special_dates
  FOR DELETE
  TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

-- ============================================================
-- 3️⃣ VERIFIERA RLS-STATUS
-- ============================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '🔒 RLS AKTIVT' ELSE '⚠️ RLS AVSTÄNGT' END as status
FROM pg_tables 
WHERE tablename IN (
  'grooming_bookings', 
  'grooming_journal', 
  'grooming_prices',
  'boarding_seasons',
  'special_dates'
)
ORDER BY tablename;

-- ============================================================
-- 4️⃣ VERIFIERA POLICIES
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE tablename IN (
  'grooming_bookings', 
  'grooming_journal', 
  'grooming_prices',
  'boarding_seasons',
  'special_dates'
)
ORDER BY tablename, policyname;

-- ============================================================
-- FÖRVÄNTAT RESULTAT:
-- 
-- Alla 5 tabeller: rls_enabled = true, status = '🔒 RLS AKTIVT'
-- 
-- Varje tabell ska ha 4 policies (eller 3 för journal/prices):
-- - SELECT policy (view their org data)
-- - INSERT policy (create for their org)
-- - UPDATE policy (modify their org data)
-- - DELETE policy (remove their org data)
-- 
-- SÄKERHET: Användare kan ENDAST se/ändra data för sin egen org!
-- ============================================================

-- ============================================================
-- 5️⃣ TEST QUERY (Kör som inloggad user)
-- ============================================================

-- Detta borde returnera ENDAST din orgs data:
-- SELECT * FROM grooming_bookings LIMIT 5;
-- SELECT * FROM special_dates LIMIT 5;

-- ⚠️ OM DET FAILAR: Kolla att du har org_id i din profile:
-- SELECT id, email, org_id FROM profiles WHERE id = auth.uid();
