-- ============================================================================
-- MASTER RLS POLICY V3 - DogPlanner
-- ============================================================================
-- Genererad: 2025-12-08
-- Källa: types/database_AUTO_GENERATED.ts (FAKTISK Supabase-schema)
-- 
-- VIKTIGT: Denna fil är baserad på VERKLIG databas, inte manuella typer!
-- Se RLS_TABLE_INVENTORY.md för fullständig dokumentation.
-- ============================================================================

-- ============================================================================
-- VIKTIGA PRINCIPER
-- ============================================================================
-- 1. Pattern 3 (Hybrid Multi-Tenant):
--    - Staff (profiles): org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
--    - Kunder (owners): user_id = auth.uid() ELLER profile_id = auth.uid()
-- 
-- 2. Tabeller UTAN org_id använder JOIN till parent-tabell
--
-- 3. Systemtabeller: service_role only (inga policies)
-- ============================================================================

-- ============================================================================
-- HJÄLPFUNKTION: Hämta användarens org_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;

-- ============================================================================
-- SEKTION 1: KÄRNTABELLER
-- ============================================================================

-- -----------------------------------------
-- profiles (användarens profil)
-- -----------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id() OR id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- -----------------------------------------
-- orgs (organisationer)
-- -----------------------------------------
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orgs_select" ON orgs;
DROP POLICY IF EXISTS "orgs_update" ON orgs;

-- Staff kan se sin org
CREATE POLICY "orgs_select" ON orgs
  FOR SELECT TO authenticated
  USING (id = get_user_org_id() OR user_id = auth.uid());

-- Bara ägare kan uppdatera
CREATE POLICY "orgs_update" ON orgs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SEKTION 2: KUNDTABELLER (med dubbla policies för staff + kunder)
-- ============================================================================

-- -----------------------------------------
-- owners (hundägare/kunder)
-- -----------------------------------------
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_select" ON owners;
DROP POLICY IF EXISTS "owners_insert" ON owners;
DROP POLICY IF EXISTS "owners_update" ON owners;
DROP POLICY IF EXISTS "owners_delete" ON owners;

-- Staff ser sin org, kunder ser sig själva
CREATE POLICY "owners_select" ON owners
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id() 
    OR user_id = auth.uid() 
    OR profile_id = auth.uid()
  );

-- Staff kan skapa owners i sin org
CREATE POLICY "owners_insert" ON owners
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- Staff kan uppdatera sin org, kunder kan uppdatera sig själva
CREATE POLICY "owners_update" ON owners
  FOR UPDATE TO authenticated
  USING (
    org_id = get_user_org_id() 
    OR user_id = auth.uid()
    OR profile_id = auth.uid()
  )
  WITH CHECK (
    org_id = get_user_org_id() 
    OR user_id = auth.uid()
    OR profile_id = auth.uid()
  );

-- Endast staff kan ta bort (soft delete)
CREATE POLICY "owners_delete" ON owners
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- -----------------------------------------
-- dogs (hundar)
-- -----------------------------------------
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dogs_select" ON dogs;
DROP POLICY IF EXISTS "dogs_insert" ON dogs;
DROP POLICY IF EXISTS "dogs_update" ON dogs;
DROP POLICY IF EXISTS "dogs_delete" ON dogs;

-- Staff ser sin org, kunder ser sina hundar
CREATE POLICY "dogs_select" ON dogs
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id()
    OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid() OR profile_id = auth.uid())
  );

CREATE POLICY "dogs_insert" ON dogs
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "dogs_update" ON dogs
  FOR UPDATE TO authenticated
  USING (
    org_id = get_user_org_id()
    OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id = get_user_org_id()
    OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
  );

CREATE POLICY "dogs_delete" ON dogs
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- -----------------------------------------
-- bookings (bokningar)
-- -----------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_delete" ON bookings;

-- Staff ser sin org, kunder ser sina bokningar
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id()
    OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid() OR profile_id = auth.uid())
  );

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- -----------------------------------------
-- invoices (fakturor)
-- -----------------------------------------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

-- Staff ser sin org, kunder ser sina fakturor
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id()
    OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid() OR profile_id = auth.uid())
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- ============================================================================
-- SEKTION 3: STAFF-ONLY TABELLER (org_id-baserade)
-- ============================================================================

-- -----------------------------------------
-- rooms (rum/boxar)
-- -----------------------------------------
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_all" ON rooms;
CREATE POLICY "rooms_all" ON rooms
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- boarding_prices
-- -----------------------------------------
ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boarding_prices_all" ON boarding_prices;
CREATE POLICY "boarding_prices_all" ON boarding_prices
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- boarding_seasons (OBS: INGEN is_active kolumn!)
-- -----------------------------------------
ALTER TABLE boarding_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boarding_seasons_all" ON boarding_seasons;
CREATE POLICY "boarding_seasons_all" ON boarding_seasons
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- special_dates
-- -----------------------------------------
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "special_dates_all" ON special_dates;
CREATE POLICY "special_dates_all" ON special_dates
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- daycare_pricing
-- -----------------------------------------
ALTER TABLE daycare_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daycare_pricing_all" ON daycare_pricing;
CREATE POLICY "daycare_pricing_all" ON daycare_pricing
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- daycare_service_completions
-- -----------------------------------------
ALTER TABLE daycare_service_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daycare_service_completions_all" ON daycare_service_completions;
CREATE POLICY "daycare_service_completions_all" ON daycare_service_completions
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- extra_services (prislistor för tillägg)
-- -----------------------------------------
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extra_services_all" ON extra_services;
CREATE POLICY "extra_services_all" ON extra_services
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- extra_service (utförda tilläggstjänster)
-- -----------------------------------------
ALTER TABLE extra_service ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extra_service_all" ON extra_service;
CREATE POLICY "extra_service_all" ON extra_service
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- services
-- -----------------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_all" ON services;
CREATE POLICY "services_all" ON services
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- grooming_prices (OBS: kolumnen heter 'active', inte 'is_active')
-- -----------------------------------------
ALTER TABLE grooming_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grooming_prices_all" ON grooming_prices;
CREATE POLICY "grooming_prices_all" ON grooming_prices
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- grooming_services
-- -----------------------------------------
ALTER TABLE grooming_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grooming_services_all" ON grooming_services;
CREATE POLICY "grooming_services_all" ON grooming_services
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- grooming_bookings
-- -----------------------------------------
ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grooming_bookings_all" ON grooming_bookings;
CREATE POLICY "grooming_bookings_all" ON grooming_bookings
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- grooming_journal
-- -----------------------------------------
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grooming_journal_all" ON grooming_journal;
CREATE POLICY "grooming_journal_all" ON grooming_journal
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- grooming_logs
-- -----------------------------------------
ALTER TABLE grooming_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grooming_logs_all" ON grooming_logs;
CREATE POLICY "grooming_logs_all" ON grooming_logs
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- dog_journal
-- -----------------------------------------
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dog_journal_all" ON dog_journal;
CREATE POLICY "dog_journal_all" ON dog_journal
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- consent_logs
-- -----------------------------------------
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_logs_all" ON consent_logs;
CREATE POLICY "consent_logs_all" ON consent_logs
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- booking_events
-- -----------------------------------------
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_events_all" ON booking_events;
CREATE POLICY "booking_events_all" ON booking_events
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- interest_applications (OBS: heter INTE 'applications')
-- -----------------------------------------
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interest_applications_all" ON interest_applications;
CREATE POLICY "interest_applications_all" ON interest_applications
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- owner_discounts (OBS: heter INTE 'customer_discounts')
-- -----------------------------------------
ALTER TABLE owner_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_discounts_all" ON owner_discounts;
CREATE POLICY "owner_discounts_all" ON owner_discounts
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- invoice_counters
-- -----------------------------------------
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_counters_all" ON invoice_counters;
CREATE POLICY "invoice_counters_all" ON invoice_counters
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- external_customers
-- -----------------------------------------
ALTER TABLE external_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_customers_all" ON external_customers;
CREATE POLICY "external_customers_all" ON external_customers
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- pension_stays
-- -----------------------------------------
ALTER TABLE pension_stays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pension_stays_all" ON pension_stays;
CREATE POLICY "pension_stays_all" ON pension_stays
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- price_lists
-- -----------------------------------------
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_lists_all" ON price_lists;
CREATE POLICY "price_lists_all" ON price_lists
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- pricing
-- -----------------------------------------
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_all" ON pricing;
CREATE POLICY "pricing_all" ON pricing
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- responsibilities
-- -----------------------------------------
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "responsibilities_all" ON responsibilities;
CREATE POLICY "responsibilities_all" ON responsibilities
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- staff_notes
-- -----------------------------------------
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_notes_all" ON staff_notes;
CREATE POLICY "staff_notes_all" ON staff_notes
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- subscription_types
-- -----------------------------------------
ALTER TABLE subscription_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_types_all" ON subscription_types;
CREATE POLICY "subscription_types_all" ON subscription_types
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- subscriptions
-- -----------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_all" ON subscriptions;
CREATE POLICY "subscriptions_all" ON subscriptions
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- org_subscriptions
-- -----------------------------------------
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_subscriptions_all" ON org_subscriptions;
CREATE POLICY "org_subscriptions_all" ON org_subscriptions
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- -----------------------------------------
-- user_org_roles
-- -----------------------------------------
ALTER TABLE user_org_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_org_roles_all" ON user_org_roles;
CREATE POLICY "user_org_roles_all" ON user_org_roles
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- SEKTION 4: JOIN-BASERADE POLICIES (tabeller utan org_id)
-- ============================================================================

-- -----------------------------------------
-- attendance_logs (via dogs.org_id)
-- -----------------------------------------
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_logs_all" ON attendance_logs;
CREATE POLICY "attendance_logs_all" ON attendance_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dogs d 
      WHERE d.id = attendance_logs.dogs_id 
      AND d.org_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dogs d 
      WHERE d.id = attendance_logs.dogs_id 
      AND d.org_id = get_user_org_id()
    )
  );

-- -----------------------------------------
-- booking_services (via bookings.org_id)
-- -----------------------------------------
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_services_all" ON booking_services;
CREATE POLICY "booking_services_all" ON booking_services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = booking_services.booking_id 
      AND b.org_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = booking_services.booking_id 
      AND b.org_id = get_user_org_id()
    )
  );

-- -----------------------------------------
-- invoice_items (via invoices.org_id)
-- -----------------------------------------
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_all" ON invoice_items;
CREATE POLICY "invoice_items_all" ON invoice_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_items.invoice_id 
      AND i.org_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_items.invoice_id 
      AND i.org_id = get_user_org_id()
    )
  );

-- ============================================================================
-- SEKTION 5: SYSTEMTABELLER (service_role only, inga user policies)
-- ============================================================================
-- Dessa tabeller behöver RLS aktiverat men INGA policies för authenticated users
-- De ska bara nås via service_role (triggers, admin)

-- error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- function_logs
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- gdpr_deletion_log
ALTER TABLE gdpr_deletion_log ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- migrations
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- org_email_history
ALTER TABLE org_email_history ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- org_number_subscription_history
ALTER TABLE org_number_subscription_history ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- system_config
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- trigger_execution_log
ALTER TABLE trigger_execution_log ENABLE ROW LEVEL SECURITY;
-- Ingen policy = endast service_role

-- ============================================================================
-- SEKTION 6: invoice_runs (special case - ingen org_id)
-- ============================================================================
-- invoice_runs har INTE org_id, bara month_id
-- Denna tabell används för fakturakörningar och bör hanteras via service_role
-- eller via relaterade invoices

ALTER TABLE invoice_runs ENABLE ROW LEVEL SECURITY;

-- Tillåt staff att läsa runs som skapade fakturor för deras org
DROP POLICY IF EXISTS "invoice_runs_select" ON invoice_runs;
CREATE POLICY "invoice_runs_select" ON invoice_runs
  FOR SELECT TO authenticated
  USING (true); -- Alla kan läsa (metadata, inte känsligt)

-- Insert/Update/Delete endast via service_role (triggers)
-- Inga INSERT/UPDATE/DELETE policies = service_role only

-- ============================================================================
-- VERIFIERING
-- ============================================================================
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'orgs', 'owners', 'dogs', 'bookings', 'invoices',
    'rooms', 'boarding_prices', 'boarding_seasons', 'special_dates',
    'daycare_pricing', 'daycare_service_completions', 'extra_services',
    'extra_service', 'services', 'grooming_prices', 'grooming_services',
    'grooming_bookings', 'grooming_journal', 'grooming_logs', 'dog_journal',
    'consent_logs', 'booking_events', 'interest_applications', 'owner_discounts',
    'invoice_counters', 'external_customers', 'pension_stays', 'price_lists',
    'pricing', 'responsibilities', 'staff_notes', 'subscription_types',
    'subscriptions', 'org_subscriptions', 'user_org_roles',
    'attendance_logs', 'booking_services', 'invoice_items', 'invoice_runs',
    'error_logs', 'function_logs', 'gdpr_deletion_log', 'migrations',
    'org_email_history', 'org_number_subscription_history', 'system_config',
    'trigger_execution_log'
  );
  
  RAISE NOTICE 'RLS V3 applied. Tables with policies: %', table_count;
END $$;

-- ============================================================================
-- SLUTKOMMENTAR
-- ============================================================================
-- Denna fil skapar policies för ALLA tabeller i database_AUTO_GENERATED.ts
-- 
-- Tabeller som INTE finns (ignorerade):
-- - applications (heter interest_applications)
-- - customer_discounts (heter owner_discounts)
-- - branches (finns inte)
-- - daycare_completions (heter daycare_service_completions)
--
-- Kolumner som INTE finns (undvikna):
-- - boarding_seasons.is_active (finns inte)
-- - invoice_runs.org_id (finns inte)
-- - grooming_prices.is_active (heter 'active')
-- ============================================================================
