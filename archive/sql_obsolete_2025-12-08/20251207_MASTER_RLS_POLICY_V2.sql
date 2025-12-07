-- =====================================================
-- 🔒 KOMPLETT RLS-POLICY FÖR DOGPLANNER - VERSION 2
-- =====================================================
-- Datum: 2025-12-07 (v2 - med ALLA tabeller)
-- Version: Pattern 3 Arkitektur (Hybrid Multi-Tenant)
-- 
-- ANVÄNDARTYPER:
-- 1. PERSONAL (finns i profiles med org_id) - Ser sin orgs data
-- 2. KUNDER/Pensionat (finns i owners, org_id = NULL) - Ser endast sin egen data
-- 3. KUNDER/Dagis (finns i owners med org_id) - Ser endast sin egen data
--
-- KRITISKT:
-- - Personal har ALLTID en rad i profiles med org_id
-- - Kunder har ALLTID en rad i owners (id = auth.uid())
-- - Kunder har ALDRIG en rad i profiles
-- - Personal har ALDRIG en rad i owners
-- =====================================================

-- =====================================================
-- STEG 1: HELPER FUNCTIONS
-- =====================================================

-- Funktion för att hämta användarens org_id (från profiles)
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Funktion för att kolla om användaren är personal (har profil)
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Funktion för att kolla om användaren är kund (har owner-rad)
CREATE OR REPLACE FUNCTION is_customer_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM owners WHERE id = auth.uid())
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- STEG 2: RENSA ALLA GAMLA POLICIES - ALLA TABELLER
-- =====================================================

-- Hjälpfunktion för att rensa alla policies på en tabell
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =====================================================
-- STEG 3: AKTIVERA RLS PÅ ALLA TABELLER
-- =====================================================

-- Core tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orgs ENABLE ROW LEVEL SECURITY;

-- Booking & Services
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_events ENABLE ROW LEVEL SECURITY;

-- Invoicing
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_runs ENABLE ROW LEVEL SECURITY;

-- Rooms & Facilities
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;

-- Pricing tables
ALTER TABLE IF EXISTS boarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boarding_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daycare_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_service ENABLE ROW LEVEL SECURITY;

-- Grooming
ALTER TABLE IF EXISTS grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grooming_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grooming_journal ENABLE ROW LEVEL SECURITY;

-- Journals & Logs
ALTER TABLE IF EXISTS dog_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consent_logs ENABLE ROW LEVEL SECURITY;

-- Applications
ALTER TABLE IF EXISTS interest_applications ENABLE ROW LEVEL SECURITY;
-- OBS: applications, customer_discounts, branches, daycare_completions FINNS INTE i databasen!

-- Daycare specific
ALTER TABLE IF EXISTS daycare_service_completions ENABLE ROW LEVEL SECURITY;

-- Subscriptions
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_types ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEG 4: PROFILES (Personal-tabell)
-- =====================================================
CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (
  org_id = get_user_org_id()
);

CREATE POLICY profiles_insert_policy ON profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);

CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (
  id = auth.uid()
);

-- =====================================================
-- STEG 5: OWNERS (Kund-tabell)
-- =====================================================
CREATE POLICY owners_select_policy ON owners FOR SELECT USING (
  id = auth.uid()
  OR (
    is_staff_user()
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

CREATE POLICY owners_insert_policy ON owners FOR INSERT WITH CHECK (
  id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY owners_update_policy ON owners FOR UPDATE USING (
  id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY owners_delete_policy ON owners FOR DELETE USING (
  is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL)
);

-- =====================================================
-- STEG 6: DOGS (Hund-tabell)
-- =====================================================
CREATE POLICY dogs_select_policy ON dogs FOR SELECT USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY dogs_insert_policy ON dogs FOR INSERT WITH CHECK (
  owner_id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY dogs_update_policy ON dogs FOR UPDATE USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY dogs_delete_policy ON dogs FOR DELETE USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

-- =====================================================
-- STEG 7: BOOKINGS (Pensionatsbokningar)
-- =====================================================
CREATE POLICY bookings_select_policy ON bookings FOR SELECT USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY bookings_insert_policy ON bookings FOR INSERT WITH CHECK (
  owner_id = auth.uid()
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY bookings_update_policy ON bookings FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY bookings_delete_policy ON bookings FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 8: BOOKING_SERVICES (Tilläggstjänster på bokning)
-- =====================================================
CREATE POLICY booking_services_select_policy ON booking_services FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id
    AND (bookings.owner_id = auth.uid() OR (is_staff_user() AND bookings.org_id = get_user_org_id()))
  )
);

CREATE POLICY booking_services_insert_policy ON booking_services FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id
    AND is_staff_user() AND bookings.org_id = get_user_org_id()
  )
);

CREATE POLICY booking_services_update_policy ON booking_services FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id
    AND is_staff_user() AND bookings.org_id = get_user_org_id()
  )
);

CREATE POLICY booking_services_delete_policy ON booking_services FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id
    AND is_staff_user() AND bookings.org_id = get_user_org_id()
  )
);

-- =====================================================
-- STEG 9: BOOKING_EVENTS (Audit trail för bokningar)
-- =====================================================
CREATE POLICY booking_events_select_policy ON booking_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_events.booking_id
    AND (bookings.owner_id = auth.uid() OR (is_staff_user() AND bookings.org_id = get_user_org_id()))
  )
);

CREATE POLICY booking_events_insert_policy ON booking_events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_events.booking_id
    AND is_staff_user() AND bookings.org_id = get_user_org_id()
  )
);

-- =====================================================
-- STEG 10: INVOICES (Fakturor)
-- =====================================================
CREATE POLICY invoices_select_policy ON invoices FOR SELECT USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY invoices_insert_policy ON invoices FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY invoices_update_policy ON invoices FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY invoices_delete_policy ON invoices FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 11: INVOICE_ITEMS (Fakturarader)
-- =====================================================
CREATE POLICY invoice_items_select_policy ON invoice_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND (invoices.owner_id = auth.uid() OR (is_staff_user() AND invoices.org_id = get_user_org_id()))
  )
);

CREATE POLICY invoice_items_insert_policy ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() AND invoices.org_id = get_user_org_id()
  )
);

CREATE POLICY invoice_items_update_policy ON invoice_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() AND invoices.org_id = get_user_org_id()
  )
);

CREATE POLICY invoice_items_delete_policy ON invoice_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() AND invoices.org_id = get_user_org_id()
  )
);

-- =====================================================
-- STEG 12: INVOICE_RUNS (Faktureringskörningar)
-- OBS: invoice_runs har INTE org_id! Bara staff kan se alla körningar.
-- =====================================================
CREATE POLICY invoice_runs_select_policy ON invoice_runs FOR SELECT USING (
  is_staff_user()  -- Alla personal kan se faktureringskörningar
);

CREATE POLICY invoice_runs_insert_policy ON invoice_runs FOR INSERT WITH CHECK (
  is_staff_user()
);

CREATE POLICY invoice_runs_update_policy ON invoice_runs FOR UPDATE USING (
  is_staff_user()
);

-- =====================================================
-- STEG 13: ORGS (Organisationer)
-- =====================================================
-- OBS! Organisationer måste vara läsbara för ALLA (inkl anon) 
-- för att publika ansökningsformulär ska fungera!
CREATE POLICY orgs_select_policy ON orgs FOR SELECT USING (
  id = get_user_org_id()  -- Personal ser alltid sin org
  OR is_visible_to_customers = true  -- Publika orgs synliga för alla (inkl anon)
);

CREATE POLICY orgs_update_policy ON orgs FOR UPDATE USING (
  id = get_user_org_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- =====================================================
-- STEG 14: ROOMS (Rum)
-- =====================================================
CREATE POLICY rooms_select_policy ON rooms FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY rooms_insert_policy ON rooms FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY rooms_update_policy ON rooms FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY rooms_delete_policy ON rooms FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 15: BOARDING_PRICES (Pensionatspriser)
-- =====================================================
CREATE POLICY boarding_prices_select_policy ON boarding_prices FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY boarding_prices_insert_policy ON boarding_prices FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY boarding_prices_update_policy ON boarding_prices FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY boarding_prices_delete_policy ON boarding_prices FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 16: BOARDING_SEASONS (Säsonger)
-- OBS: boarding_seasons har INTE is_active kolumn!
-- =====================================================
CREATE POLICY boarding_seasons_select_policy ON boarding_seasons FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL)  -- Alla inloggade kan se säsonger
);

CREATE POLICY boarding_seasons_insert_policy ON boarding_seasons FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY boarding_seasons_update_policy ON boarding_seasons FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY boarding_seasons_delete_policy ON boarding_seasons FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 17: SPECIAL_DATES (Helgdagar/specialdatum)
-- =====================================================
CREATE POLICY special_dates_select_policy ON special_dates FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL)
);

CREATE POLICY special_dates_insert_policy ON special_dates FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY special_dates_update_policy ON special_dates FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY special_dates_delete_policy ON special_dates FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 18: DAYCARE_PRICING (Dagispriser)
-- =====================================================
CREATE POLICY daycare_pricing_select_policy ON daycare_pricing FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY daycare_pricing_insert_policy ON daycare_pricing FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_pricing_update_policy ON daycare_pricing FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_pricing_delete_policy ON daycare_pricing FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 19: EXTRA_SERVICES (Priskatalog - plural)
-- =====================================================
CREATE POLICY extra_services_select_policy ON extra_services FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY extra_services_insert_policy ON extra_services FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY extra_services_update_policy ON extra_services FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY extra_services_delete_policy ON extra_services FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 20: EXTRA_SERVICE (Faktisk tjänst på hund - singular)
-- OBS: Kolumnen heter dogs_id, inte dog_id!
-- =====================================================
CREATE POLICY extra_service_select_policy ON extra_service FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = extra_service.dogs_id
    AND (dogs.owner_id = auth.uid() OR (is_staff_user() AND (dogs.org_id = get_user_org_id() OR dogs.org_id IS NULL)))
  )
);

CREATE POLICY extra_service_insert_policy ON extra_service FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY extra_service_update_policy ON extra_service FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY extra_service_delete_policy ON extra_service FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 21: GROOMING_BOOKINGS (Frisörbokningar)
-- =====================================================
CREATE POLICY grooming_bookings_select_policy ON grooming_bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = grooming_bookings.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY grooming_bookings_insert_policy ON grooming_bookings FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY grooming_bookings_update_policy ON grooming_bookings FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY grooming_bookings_delete_policy ON grooming_bookings FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 22: GROOMING_PRICES (Frisörpriser)
-- =====================================================
CREATE POLICY grooming_prices_select_policy ON grooming_prices FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY grooming_prices_insert_policy ON grooming_prices FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY grooming_prices_update_policy ON grooming_prices FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY grooming_prices_delete_policy ON grooming_prices FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 23: GROOMING_JOURNAL (Frisörjournal)
-- =====================================================
CREATE POLICY grooming_journal_select_policy ON grooming_journal FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = grooming_journal.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY grooming_journal_insert_policy ON grooming_journal FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY grooming_journal_update_policy ON grooming_journal FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 24: DOG_JOURNAL (Hundjournal)
-- =====================================================
CREATE POLICY dog_journal_select_policy ON dog_journal FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = dog_journal.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL))
);

CREATE POLICY dog_journal_insert_policy ON dog_journal FOR INSERT WITH CHECK (
  is_staff_user() AND (org_id = get_user_org_id() OR org_id IS NULL)
);

-- =====================================================
-- STEG 24B: OWNER_DISCOUNTS (Kundrabatter)
-- KRITISKT: Används av pricing.ts för prisberäkning!
-- =====================================================
ALTER TABLE IF EXISTS owner_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_discounts_select_policy ON owner_discounts FOR SELECT USING (
  owner_id = auth.uid()  -- Kund ser sina egna rabatter
  OR (is_staff_user() AND org_id = get_user_org_id())  -- Personal ser sin orgs rabatter
);

CREATE POLICY owner_discounts_insert_policy ON owner_discounts FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY owner_discounts_update_policy ON owner_discounts FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY owner_discounts_delete_policy ON owner_discounts FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 25: CONSENT_LOGS (GDPR-samtycken)
-- =====================================================
CREATE POLICY consent_logs_select_policy ON consent_logs FOR SELECT USING (
  owner_id = auth.uid()
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY consent_logs_insert_policy ON consent_logs FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 26: INTEREST_APPLICATIONS (Intresseanmälningar)
-- =====================================================
-- OBS! Dagisansökningar är ANONYMA - skickas utan inloggning!
-- Personal ser endast sin organisations ansökningar.

CREATE POLICY interest_applications_select_policy ON interest_applications FOR SELECT USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- VIKTIGT: Anonym INSERT för publika ansökningsformulär
-- Kräver att org_id, parent_name, parent_email och dog_name är ifyllda
CREATE POLICY interest_applications_insert_authenticated ON interest_applications FOR INSERT 
TO authenticated
WITH CHECK (
  org_id IS NOT NULL AND 
  parent_name IS NOT NULL AND 
  parent_email IS NOT NULL AND
  dog_name IS NOT NULL
);

-- Anonym INSERT (anon key från publika sidor)
CREATE POLICY interest_applications_insert_anon ON interest_applications FOR INSERT 
TO anon
WITH CHECK (
  org_id IS NOT NULL AND 
  parent_name IS NOT NULL AND 
  parent_email IS NOT NULL AND
  dog_name IS NOT NULL
);

CREATE POLICY interest_applications_update_policy ON interest_applications FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 27: DAYCARE_SERVICE_COMPLETIONS (Dagis närvaroregistrering)
-- =====================================================
CREATE POLICY daycare_service_completions_select_policy ON daycare_service_completions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = daycare_service_completions.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY daycare_service_completions_insert_policy ON daycare_service_completions FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_service_completions_update_policy ON daycare_service_completions FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_service_completions_delete_policy ON daycare_service_completions FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 28: SUBSCRIPTIONS (Prenumerationer för dagis-hundar)
-- =====================================================
-- OBS: subscriptions HAR dog_id för att koppla till hund!

-- Kunder ser sina prenumerationer, personal ser sin orgs
CREATE POLICY subscriptions_select_policy ON subscriptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = subscriptions.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND org_id = get_user_org_id())
);

-- Endast personal kan skapa prenumerationer
CREATE POLICY subscriptions_insert_policy ON subscriptions FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

-- Endast personal kan uppdatera
CREATE POLICY subscriptions_update_policy ON subscriptions FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- Endast personal kan radera
CREATE POLICY subscriptions_delete_policy ON subscriptions FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 29: SUBSCRIPTION_TYPES (Prenumerationstyper/paket)
-- =====================================================

-- Alla inloggade kan se prenumerationstyper (prislista)
CREATE POLICY subscription_types_select_policy ON subscription_types FOR SELECT USING (
  (is_staff_user() AND org_id = get_user_org_id())
  OR (auth.uid() IS NOT NULL AND is_active = true)
);

-- Endast personal kan hantera
CREATE POLICY subscription_types_insert_policy ON subscription_types FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY subscription_types_update_policy ON subscription_types FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY subscription_types_delete_policy ON subscription_types FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 30: VERIFIERING
-- =====================================================
    AND (owners.org_id = get_user_org_id() OR owners.org_id IS NULL)
  )
);

-- =====================================================
-- STEG 32: BRANCHES (Filialer - framtida användning)
-- OBS: Tabell finns i schema men används inte aktivt än
-- =====================================================
ALTER TABLE IF EXISTS branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY branches_select_policy ON branches FOR SELECT USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY branches_insert_policy ON branches FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY branches_update_policy ON branches FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY branches_delete_policy ON branches FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 33: DAYCARE_COMPLETIONS (Äldre dagis-närvaroregistrering)
-- OBS: Möjligen deprecated, daycare_service_completions är nyare versionen
-- =====================================================
ALTER TABLE IF EXISTS daycare_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY daycare_completions_select_policy ON daycare_completions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = daycare_completions.dog_id
    AND dogs.owner_id = auth.uid()
  )
  OR (is_staff_user() AND org_id = get_user_org_id())
);

CREATE POLICY daycare_completions_insert_policy ON daycare_completions FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_completions_update_policy ON daycare_completions FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY daycare_completions_delete_policy ON daycare_completions FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 34: VERIFIERING
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ KOMPLETT RLS-POLICY v2 INSTALLERAD';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TABELLER MED RLS (31 TOTALT):';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 CORE:';
  RAISE NOTICE '   profiles, owners, dogs, orgs, branches';
  RAISE NOTICE '';
  RAISE NOTICE '📅 BOKNINGAR:';
  RAISE NOTICE '   bookings, booking_services, booking_events';
  RAISE NOTICE '   grooming_bookings';
  RAISE NOTICE '';
  RAISE NOTICE '💰 FAKTURERING:';
  RAISE NOTICE '   invoices, invoice_items, invoice_runs';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 LOKALER:';
  RAISE NOTICE '   rooms';
  RAISE NOTICE '';
  RAISE NOTICE '💵 PRISSÄTTNING:';
  RAISE NOTICE '   boarding_prices, boarding_seasons, special_dates';
  RAISE NOTICE '   daycare_pricing, grooming_prices';
  RAISE NOTICE '   extra_services (katalog), extra_service (på hund)';
  RAISE NOTICE '   owner_discounts, customer_discounts';
  RAISE NOTICE '';
  RAISE NOTICE '📝 JOURNALER:';
  RAISE NOTICE '   dog_journal, grooming_journal';
  RAISE NOTICE '';
  RAISE NOTICE '📋 ANSÖKNINGAR:';
  RAISE NOTICE '   interest_applications, applications';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRENUMERATIONER:';
  RAISE NOTICE '   subscriptions, subscription_types';
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÖVRIGT:';
  RAISE NOTICE '   consent_logs, daycare_service_completions, daycare_completions';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 REGLER:';
  RAISE NOTICE '   • Personal (har profiles.org_id) ser sin orgs data';
  RAISE NOTICE '   • Kunder (har owners.id=auth.uid()) ser endast sin egen data';
  RAISE NOTICE '   • Pensionatkunder (org_id IS NULL) kan boka överallt';
  RAISE NOTICE '   • Priser är läsbara för alla inloggade (is_active=true)';
  RAISE NOTICE '';
END $$;

-- Visa sammanfattning
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
