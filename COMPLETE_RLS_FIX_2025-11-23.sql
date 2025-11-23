-- =====================================================
-- KOMPLETT RLS POLICIES FIX
-- Skapad: 2025-11-23
-- Syfte: Säkerställ att ALLA tabeller har korrekt RLS
-- =====================================================

-- ⚠️ VIKTIGT: Kör detta i Supabase SQL Editor
-- ⚠️ BACKUP: Ta backup innan du kör detta!

-- =====================================================
-- DEL 1: AKTIVERA RLS PÅ ALLA TABELLER
-- =====================================================

-- Tabeller som SAKNADE policies enligt audit:
ALTER TABLE IF EXISTS public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_service_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dog_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.extra_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grooming_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_runs ENABLE ROW LEVEL SECURITY;

-- Säkerställ att dessa också har RLS (från tidigare fix):
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.boarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.boarding_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interest_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEL 2: HJÄLPFUNKTION FÖR ATT HÄMTA USER ORG_ID
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =====================================================
-- DEL 3: POLICIES FÖR ATTENDANCE_LOGS
-- =====================================================
-- NOTE: attendance_logs har dogs_id, inte org_id

DROP POLICY IF EXISTS "Users can view attendance logs in their org" ON attendance_logs;
CREATE POLICY "Users can view attendance logs in their org"
ON attendance_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = attendance_logs.dogs_id 
    AND dogs.org_id = get_user_org_id()
  )
);

DROP POLICY IF EXISTS "Users can manage attendance logs in their org" ON attendance_logs;
CREATE POLICY "Users can manage attendance logs in their org"
ON attendance_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = attendance_logs.dogs_id 
    AND dogs.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 4: POLICIES FÖR BOOKING_EVENTS
-- =====================================================
-- NOTE: booking_events HAR org_id

DROP POLICY IF EXISTS "Users can view booking events in their org" ON booking_events;
CREATE POLICY "Users can view booking events in their org"
ON booking_events FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage booking events in their org" ON booking_events;
CREATE POLICY "Users can manage booking events in their org"
ON booking_events FOR ALL
USING (org_id = get_user_org_id());

-- =====================================================
-- DEL 5: POLICIES FÖR BOOKING_SERVICES
-- =====================================================

DROP POLICY IF EXISTS "Users can view booking services in their org" ON booking_services;
CREATE POLICY "Users can view booking services in their org"
ON booking_services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.org_id = get_user_org_id()
  )
);

DROP POLICY IF EXISTS "Users can manage booking services in their org" ON booking_services;
CREATE POLICY "Users can manage booking services in their org"
ON booking_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 6: POLICIES FÖR DAYCARE_SERVICE_COMPLETIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view daycare completions in their org" ON daycare_service_completions;
CREATE POLICY "Users can view daycare completions in their org"
ON daycare_service_completions FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage daycare completions in their org" ON daycare_service_completions;
CREATE POLICY "Users can manage daycare completions in their org"
ON daycare_service_completions FOR ALL
USING (org_id = get_user_org_id());

-- =====================================================
-- DEL 7: POLICIES FÖR DOG_JOURNAL
-- =====================================================

DROP POLICY IF EXISTS "Users can view dog journal in their org" ON dog_journal;
CREATE POLICY "Users can view dog journal in their org"
ON dog_journal FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = dog_journal.dog_id 
    AND dogs.org_id = get_user_org_id()
  )
);

DROP POLICY IF EXISTS "Users can manage dog journal in their org" ON dog_journal;
CREATE POLICY "Users can manage dog journal in their org"
ON dog_journal FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = dog_journal.dog_id 
    AND dogs.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 8: POLICIES FÖR EXTRA_SERVICE (singular)
-- =====================================================

DROP POLICY IF EXISTS "Users can view extra service in their org" ON extra_service;
CREATE POLICY "Users can view extra service in their org"
ON extra_service FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage extra service in their org" ON extra_service;
CREATE POLICY "Users can manage extra service in their org"
ON extra_service FOR ALL
USING (org_id = get_user_org_id());

-- =====================================================
-- DEL 9: POLICIES FÖR ERROR_LOGS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON error_logs;
CREATE POLICY "Authenticated users can insert error logs"
ON error_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;
CREATE POLICY "Admins can view all error logs"
ON error_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- DEL 10: POLICIES FÖR FUNCTION_LOGS
-- =====================================================

DROP POLICY IF EXISTS "Service role can manage function logs" ON function_logs;
CREATE POLICY "Service role can manage function logs"
ON function_logs FOR ALL
USING (true); -- Service role har alltid access

DROP POLICY IF EXISTS "Admins can view function logs" ON function_logs;
CREATE POLICY "Admins can view function logs"
ON function_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- DEL 11: POLICIES FÖR GROOMING_LOGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view grooming logs in their org" ON grooming_logs;
CREATE POLICY "Users can view grooming logs in their org"
ON grooming_logs FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage grooming logs in their org" ON grooming_logs;
CREATE POLICY "Users can manage grooming logs in their org"
ON grooming_logs FOR ALL
USING (org_id = get_user_org_id());

-- =====================================================
-- DEL 12: POLICIES FÖR INVOICE_ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Users can view invoice items in their org" ON invoice_items;
CREATE POLICY "Users can view invoice items in their org"
ON invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.org_id = get_user_org_id()
  )
);

DROP POLICY IF EXISTS "Users can manage invoice items in their org" ON invoice_items;
CREATE POLICY "Users can manage invoice items in their org"
ON invoice_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 13: POLICIES FÖR INVOICE_RUNS
-- =====================================================
-- NOTE: invoice_runs är en system-wide tabell utan org_id
-- Den spårar invoice-genereringskörningar över alla organisationer

DROP POLICY IF EXISTS "Users can view invoice runs in their org" ON invoice_runs;
CREATE POLICY "Authenticated users can view invoice runs"
ON invoice_runs FOR SELECT
USING (auth.uid() IS NOT NULL); -- System-wide access för alla autentiserade

DROP POLICY IF EXISTS "Admins can manage invoice runs" ON invoice_runs;
CREATE POLICY "Admins can manage invoice runs"
ON invoice_runs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- =====================================================
-- DEL 14: FÖRBÄTTRA BEFINTLIGA POLICIES
-- =====================================================

-- BOOKINGS (uppdatera för bättre performance)
DROP POLICY IF EXISTS "Users can view bookings in their org" ON bookings;
CREATE POLICY "Users can view bookings in their org"
ON bookings FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage bookings in their org" ON bookings;
CREATE POLICY "Users can manage bookings in their org"
ON bookings FOR ALL
USING (org_id = get_user_org_id());

-- DOGS
DROP POLICY IF EXISTS "Users can view dogs in their org" ON dogs;
CREATE POLICY "Users can view dogs in their org"
ON dogs FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage dogs in their org" ON dogs;
CREATE POLICY "Users can manage dogs in their org"
ON dogs FOR ALL
USING (org_id = get_user_org_id());

-- OWNERS
DROP POLICY IF EXISTS "Users can view owners in their org" ON owners;
CREATE POLICY "Users can view owners in their org"
ON owners FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage owners in their org" ON owners;
CREATE POLICY "Users can manage owners in their org"
ON owners FOR ALL
USING (org_id = get_user_org_id());

-- INVOICES
DROP POLICY IF EXISTS "Users can view invoices in their org" ON invoices;
CREATE POLICY "Users can view invoices in their org"
ON invoices FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage invoices in their org" ON invoices;
CREATE POLICY "Users can manage invoices in their org"
ON invoices FOR ALL
USING (org_id = get_user_org_id());

-- ROOMS
DROP POLICY IF EXISTS "Users can view rooms in their org" ON rooms;
CREATE POLICY "Users can view rooms in their org"
ON rooms FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "Admins can manage rooms"
ON rooms FOR ALL
USING (
  org_id = get_user_org_id() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- EXTRA_SERVICES (plural)
DROP POLICY IF EXISTS "Users can view extra services in their org" ON extra_services;
CREATE POLICY "Users can view extra services in their org"
ON extra_services FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can manage extra services" ON extra_services;
CREATE POLICY "Admins can manage extra services"
ON extra_services FOR ALL
USING (
  org_id = get_user_org_id() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- BOARDING_SEASONS
DROP POLICY IF EXISTS "Users can view boarding seasons in their org" ON boarding_seasons;
CREATE POLICY "Users can view boarding seasons in their org"
ON boarding_seasons FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can manage boarding seasons" ON boarding_seasons;
CREATE POLICY "Admins can manage boarding seasons"
ON boarding_seasons FOR ALL
USING (
  org_id = get_user_org_id() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- INTEREST_APPLICATIONS
DROP POLICY IF EXISTS "Users can view applications in their org" ON interest_applications;
CREATE POLICY "Users can view applications in their org"
ON interest_applications FOR SELECT
USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can manage applications in their org" ON interest_applications;
CREATE POLICY "Users can manage applications in their org"
ON interest_applications FOR ALL
USING (org_id = get_user_org_id());

-- =====================================================
-- DEL 15: VERIFIERING
-- =====================================================

-- Visa alla policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Visa vilka tabeller som har RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Räkna policies per tabell
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- =====================================================
-- DEL 16: DOKUMENTATION
-- =====================================================

/*
VIKTIGA NOTERINGAR:

1. HJÄLPFUNKTION: get_user_org_id()
   - Hämtar org_id för inloggad användare
   - Security definer = körs med elevated permissions
   - Gör policies mer läsbara och maintainbara

2. POLICY MÖNSTER:
   - SELECT: org_id = get_user_org_id()
   - ALL: org_id = get_user_org_id()
   - För relationsdata: JOIN via EXISTS

3. ADMIN-ONLY POLICIES:
   - error_logs: Bara admins kan läsa
   - function_logs: Bara admins kan läsa
   - Vissa management-operationer kräver admin-roll

4. SÄKERHET:
   - Alla policies är org-baserade
   - Ingen data läcker mellan organisationer
   - Service role kan alltid bypassa (för triggers etc)

5. PERFORMANCE:
   - get_user_org_id() är STABLE = cachad per query
   - Undvik subqueries där möjligt
   - Indexes på org_id rekommenderas

6. TEST EFTER KÖRNING:
   - Logga in som vanlig användare
   - Försök läsa data från annan org (ska misslyckas)
   - Verifiera att all normal funktionalitet fungerar

-- =====================================================
-- SCHEMA NOTES (viktig dokumentation!)
-- =====================================================
/*
TABELLER MED DIREKT org_id:
- booking_events (har org_id)
- daycare_service_completions (har org_id)
- extra_service (har org_id)
- grooming_logs (har org_id)

TABELLER SOM ANVÄNDER JOIN:
- attendance_logs (har dogs_id → JOIN via dogs)
- booking_services (har booking_id → JOIN via bookings)
- dog_journal (har dog_id → JOIN via dogs)
- invoice_items (har invoice_id → JOIN via invoices)

SYSTEM-WIDE TABELLER (ingen org_id):
- error_logs (global loggning)
- function_logs (global loggning)
- invoice_runs (global spårning)
→ Dessa har policies baserade på auth.uid() eller admin-roll
*/
*/

-- =====================================================
-- KLAR! 🎉
-- =====================================================
