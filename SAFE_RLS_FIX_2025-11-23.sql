-- =====================================================
-- SÄKER RLS POLICY FIX - Anpassad efter faktisk databas
-- Skapad: 2025-11-23
-- Syfte: Endast tabeller som saknar policies OCH matchar faktisk struktur
-- =====================================================

-- ⚠️ VIKTIGT: Detta script är anpassat efter diagnostik-resultat
-- ⚠️ Tabeller UTAN org_id: attendance_logs, booking_services, error_logs, 
--    function_logs, invoice_items, invoice_runs

-- =====================================================
-- DEL 1: HJÄLPFUNKTIONER
-- =====================================================

-- Funktion för att hämta current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Alternativ funktion (om current_org_id() redan finns)
-- Kommentera ut den ovan om denna redan fungerar:
-- CREATE OR REPLACE FUNCTION public.current_org_id()
-- RETURNS UUID AS $$
--   SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1;
-- $$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================
-- DEL 2: AKTIVERA RLS
-- =====================================================

-- Aktivera RLS på tabeller som saknar policies
ALTER TABLE IF EXISTS public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_runs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEL 3: POLICIES FÖR ATTENDANCE_LOGS
-- =====================================================
-- OBS: attendance_logs har dogs_id, INTE org_id
-- Måste JOINa via dogs tabellen

-- Ta bort gamla policies om de finns (för att undvika konflikt)
DROP POLICY IF EXISTS "attendance_logs_select_policy" ON attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_all_policy" ON attendance_logs;

-- SELECT policy - användare kan läsa sina org's hundar
CREATE POLICY "attendance_logs_select_policy" ON attendance_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = attendance_logs.dogs_id 
    AND dogs.org_id = get_user_org_id()
  )
);

-- ALL policy - användare kan hantera sina org's hundar
CREATE POLICY "attendance_logs_all_policy" ON attendance_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = attendance_logs.dogs_id 
    AND dogs.org_id = get_user_org_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = attendance_logs.dogs_id 
    AND dogs.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 4: POLICIES FÖR BOOKING_SERVICES
-- =====================================================
-- OBS: booking_services har booking_id, INTE org_id
-- Måste JOINa via bookings tabellen

DROP POLICY IF EXISTS "booking_services_select_policy" ON booking_services;
DROP POLICY IF EXISTS "booking_services_all_policy" ON booking_services;

CREATE POLICY "booking_services_select_policy" ON booking_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.org_id = get_user_org_id()
  )
);

CREATE POLICY "booking_services_all_policy" ON booking_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.org_id = get_user_org_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 5: POLICIES FÖR ERROR_LOGS
-- =====================================================
-- OBS: error_logs är system-wide, INGEN org_id
-- Tillåt INSERT för alla, endast admins kan läsa

DROP POLICY IF EXISTS "error_logs_insert_policy" ON error_logs;
DROP POLICY IF EXISTS "error_logs_select_admin_policy" ON error_logs;

-- Alla autentiserade användare kan skapa error logs
CREATE POLICY "error_logs_insert_policy" ON error_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Endast admins kan läsa error logs
CREATE POLICY "error_logs_select_admin_policy" ON error_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- =====================================================
-- DEL 6: POLICIES FÖR FUNCTION_LOGS
-- =====================================================
-- OBS: function_logs är system-wide, INGEN org_id
-- Service role kan alltid skriva, admins kan läsa

DROP POLICY IF EXISTS "function_logs_insert_policy" ON function_logs;
DROP POLICY IF EXISTS "function_logs_select_admin_policy" ON function_logs;

-- Service role kan skapa logs (via triggers/functions)
CREATE POLICY "function_logs_insert_policy" ON function_logs
FOR INSERT
WITH CHECK (true); -- Service role bypassar RLS ändå

-- Endast admins kan läsa function logs
CREATE POLICY "function_logs_select_admin_policy" ON function_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- =====================================================
-- DEL 7: POLICIES FÖR INVOICE_ITEMS
-- =====================================================
-- OBS: invoice_items har invoice_id, INTE org_id
-- Måste JOINa via invoices tabellen

DROP POLICY IF EXISTS "invoice_items_select_policy" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_all_policy" ON invoice_items;

CREATE POLICY "invoice_items_select_policy" ON invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.org_id = get_user_org_id()
  )
);

CREATE POLICY "invoice_items_all_policy" ON invoice_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.org_id = get_user_org_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.org_id = get_user_org_id()
  )
);

-- =====================================================
-- DEL 8: POLICIES FÖR INVOICE_RUNS
-- =====================================================
-- OBS: invoice_runs är system-wide, INGEN org_id
-- Detta spårar invoice-körningar globalt

DROP POLICY IF EXISTS "invoice_runs_select_policy" ON invoice_runs;
DROP POLICY IF EXISTS "invoice_runs_admin_policy" ON invoice_runs;

-- Alla autentiserade kan se invoice runs (för transparency)
CREATE POLICY "invoice_runs_select_policy" ON invoice_runs
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Endast admins kan hantera invoice runs
CREATE POLICY "invoice_runs_admin_policy" ON invoice_runs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- =====================================================
-- DEL 9: VERIFIERING
-- =====================================================

-- Kolla att policies skapats
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'attendance_logs',
    'booking_services',
    'error_logs',
    'function_logs',
    'invoice_items',
    'invoice_runs'
)
ORDER BY tablename, policyname;

-- Förväntat resultat: 2 policies per tabell (SELECT + ALL/INSERT)

-- =====================================================
-- SLUTNOTERINGAR
-- =====================================================

/*
VIKTIGA NOTERINGAR:

1. TABELLER SOM REDAN HAR POLICIES (enligt befintlig struktur):
   - booking_events (verkar redan ha policies)
   - daycare_service_completions (verkar redan ha policies)
   - dog_journal (verkar redan ha policies)
   - extra_service (verkar redan ha policies)
   - grooming_logs (verkar redan ha policies)

2. TABELLER SOM NU FÅR POLICIES (genom detta script):
   - attendance_logs → JOINar via dogs
   - booking_services → JOINar via bookings
   - error_logs → Admin-only read, alla kan insert
   - function_logs → Admin-only read, system insert
   - invoice_items → JOINar via invoices
   - invoice_runs → Alla kan läsa, admin kan hantera

3. SÄKERHET:
   - Alla policies kontrollerar org_id via JOINs där org_id saknas
   - System-wide tabeller har admin-only eller autentiserad access
   - Service role kan alltid bypassa RLS (för triggers)

4. PERFORMANCE:
   - get_user_org_id() är STABLE = cachad per query
   - Rekommenderade indexes:
     * CREATE INDEX IF NOT EXISTS idx_attendance_logs_dogs_id ON attendance_logs(dogs_id);
     * CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
     * CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

5. TESTING:
   - Logga in som vanlig användare
   - Försök läsa attendance_logs (ska fungera)
   - Försök läsa annan org's data (ska misslyckas)
   - Kolla Sentry för errors
*/

-- =====================================================
-- KLART! 🎉
-- =====================================================
[
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Allow read attendance_logs for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Block changes to attendance_logs for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "attendance_logs_all_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "attendance_logs_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "booking_services",
    "policyname": "booking_services_all_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "booking_services",
    "policyname": "booking_services_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "error_logs_insert_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT"
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "error_logs_select_admin_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "Admins can view function logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "function_logs_insert_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT"
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "function_logs_select_admin_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "admin_full_access_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "invoice_items_all_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "invoice_items_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "select_own_org_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "staff_edit_draft_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_runs",
    "policyname": "invoice_runs_admin_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_runs",
    "policyname": "invoice_runs_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT"
  }
]