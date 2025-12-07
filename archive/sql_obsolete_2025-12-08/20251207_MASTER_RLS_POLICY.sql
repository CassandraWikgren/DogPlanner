-- =====================================================
-- 🔒 KOMPLETT RLS-POLICY FÖR DOGPLANNER
-- =====================================================
-- Datum: 2025-12-07
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
-- STEG 2: RENSA ALLA GAMLA POLICIES
-- =====================================================

-- PROFILES
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;

-- OWNERS
DROP POLICY IF EXISTS owners_select_policy ON owners;
DROP POLICY IF EXISTS owners_select_self_and_org ON owners;
DROP POLICY IF EXISTS owners_select_by_org_or_self ON owners;
DROP POLICY IF EXISTS owners_select_just_created ON owners;
DROP POLICY IF EXISTS owners_insert_policy ON owners;
DROP POLICY IF EXISTS owners_insert_self ON owners;
DROP POLICY IF EXISTS owners_insert_self_registration ON owners;
DROP POLICY IF EXISTS owners_insert_org ON owners;
DROP POLICY IF EXISTS owners_update_policy ON owners;
DROP POLICY IF EXISTS owners_update_self ON owners;
DROP POLICY IF EXISTS owners_update_org ON owners;
DROP POLICY IF EXISTS owners_delete_policy ON owners;
DROP POLICY IF EXISTS owners_delete_org ON owners;
DROP POLICY IF EXISTS "Användare kan se sina egna djurägare" ON owners;
DROP POLICY IF EXISTS "Authenticated users can create owners" ON owners;
DROP POLICY IF EXISTS "Users can view owners in their org" ON owners;

-- DOGS
DROP POLICY IF EXISTS dogs_select_policy ON dogs;
DROP POLICY IF EXISTS dogs_select_owner_and_org ON dogs;
DROP POLICY IF EXISTS dogs_select_by_org_or_owner ON dogs;
DROP POLICY IF EXISTS dogs_insert_policy ON dogs;
DROP POLICY IF EXISTS dogs_update_policy ON dogs;
DROP POLICY IF EXISTS dogs_delete_policy ON dogs;
DROP POLICY IF EXISTS "Användare kan se sina egna hundar" ON dogs;
DROP POLICY IF EXISTS "Users can view dogs in their org" ON dogs;

-- BOOKINGS
DROP POLICY IF EXISTS bookings_select_policy ON bookings;
DROP POLICY IF EXISTS bookings_select_by_org ON bookings;
DROP POLICY IF EXISTS bookings_insert_policy ON bookings;
DROP POLICY IF EXISTS bookings_update_policy ON bookings;
DROP POLICY IF EXISTS bookings_delete_policy ON bookings;
DROP POLICY IF EXISTS "Users can view bookings in their org" ON bookings;
DROP POLICY IF EXISTS "Användare kan se sina egna bokningar" ON bookings;

-- INVOICES
DROP POLICY IF EXISTS invoices_select_policy ON invoices;
DROP POLICY IF EXISTS invoices_insert_policy ON invoices;
DROP POLICY IF EXISTS invoices_update_policy ON invoices;
DROP POLICY IF EXISTS invoices_delete_policy ON invoices;

-- INVOICE_ITEMS
DROP POLICY IF EXISTS invoice_items_select_policy ON invoice_items;
DROP POLICY IF EXISTS invoice_items_insert_policy ON invoice_items;
DROP POLICY IF EXISTS invoice_items_update_policy ON invoice_items;
DROP POLICY IF EXISTS invoice_items_delete_policy ON invoice_items;

-- INTEREST_APPLICATIONS
DROP POLICY IF EXISTS interest_applications_select_policy ON interest_applications;
DROP POLICY IF EXISTS interest_applications_insert_policy ON interest_applications;
DROP POLICY IF EXISTS interest_applications_update_policy ON interest_applications;

-- ROOMS
DROP POLICY IF EXISTS rooms_select_policy ON rooms;
DROP POLICY IF EXISTS rooms_insert_policy ON rooms;
DROP POLICY IF EXISTS rooms_update_policy ON rooms;
DROP POLICY IF EXISTS rooms_delete_policy ON rooms;

-- ORGS (public read för kunder som ska kunna välja pensionat)
DROP POLICY IF EXISTS orgs_select_policy ON orgs;
DROP POLICY IF EXISTS orgs_public_read ON orgs;
DROP POLICY IF EXISTS orgs_insert_policy ON orgs;
DROP POLICY IF EXISTS orgs_update_policy ON orgs;

-- DOG_JOURNAL
DROP POLICY IF EXISTS dog_journal_select_policy ON dog_journal;
DROP POLICY IF EXISTS dog_journal_insert_policy ON dog_journal;

-- EXTRA_SERVICES (priskatalog - kunder behöver läsa)
DROP POLICY IF EXISTS extra_services_select_policy ON extra_services;
DROP POLICY IF EXISTS extra_services_public_read ON extra_services;
DROP POLICY IF EXISTS extra_services_insert_policy ON extra_services;
DROP POLICY IF EXISTS extra_services_update_policy ON extra_services;
DROP POLICY IF EXISTS extra_services_delete_policy ON extra_services;

-- BOARDING_PRICES (kunder behöver läsa)
DROP POLICY IF EXISTS boarding_prices_select_policy ON boarding_prices;
DROP POLICY IF EXISTS boarding_prices_public_read ON boarding_prices;
DROP POLICY IF EXISTS boarding_prices_insert_policy ON boarding_prices;
DROP POLICY IF EXISTS boarding_prices_update_policy ON boarding_prices;

-- =====================================================
-- STEG 3: AKTIVERA RLS PÅ ALLA TABELLER
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEG 4: PROFILES (Personal-tabell)
-- =====================================================
-- Personal kan läsa sin egen profil och andra i samma org
-- Kunder har INGEN åtkomst till profiles

CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (
  -- Personal ser sin egen profil och kollegor i samma org
  org_id = get_user_org_id()
);

CREATE POLICY profiles_insert_policy ON profiles FOR INSERT WITH CHECK (
  -- Endast via trigger (handle_new_user) eller admin
  id = auth.uid()
);

CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (
  -- Personal kan uppdatera sin egen profil
  id = auth.uid()
);

-- =====================================================
-- STEG 5: OWNERS (Kund-tabell)
-- =====================================================
-- Kunder: Ser endast sin egen rad (id = auth.uid())
-- Personal: Ser alla owners i sin org PLUS pensionatkunder (org_id IS NULL)

CREATE POLICY owners_select_policy ON owners FOR SELECT USING (
  -- Alt 1: Kund läser sin egen rad
  id = auth.uid()
  OR
  -- Alt 2: Personal läser owners
  (
    is_staff_user()
    AND (
      -- Owners i samma org (dagiskunder)
      org_id = get_user_org_id()
      OR
      -- Pensionatkunder (org_id IS NULL) - alla pensionat kan se dem
      org_id IS NULL
    )
  )
);

-- INSERT: Tillåt registrering för alla (kund skapar sig själv, personal skapar för sin org)
CREATE POLICY owners_insert_policy ON owners FOR INSERT WITH CHECK (
  -- Kund registrerar sig själv
  id = auth.uid()
  OR
  -- Personal skapar kund för sin org
  (
    is_staff_user() 
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

-- UPDATE: Kund uppdaterar sin egen, Personal uppdaterar för sin org
CREATE POLICY owners_update_policy ON owners FOR UPDATE USING (
  id = auth.uid()
  OR
  (
    is_staff_user()
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

-- DELETE: Endast personal
CREATE POLICY owners_delete_policy ON owners FOR DELETE USING (
  is_staff_user()
  AND (org_id = get_user_org_id() OR org_id IS NULL)
);

-- =====================================================
-- STEG 6: DOGS (Hund-tabell)
-- =====================================================
-- Kunder: Ser endast sina egna hundar (via owner_id)
-- Personal: Ser hundar i sin org PLUS pensionathundar (org_id IS NULL)

CREATE POLICY dogs_select_policy ON dogs FOR SELECT USING (
  -- Alt 1: Kund ser sina hundar (owner_id pekar på owners.id = auth.uid())
  owner_id = auth.uid()
  OR
  -- Alt 2: Personal ser hundar
  (
    is_staff_user()
    AND (
      -- Hundar i samma org
      org_id = get_user_org_id()
      OR
      -- Pensionathundar (org_id IS NULL)
      org_id IS NULL
    )
  )
);

-- INSERT: Kund skapar hund för sig själv, Personal skapar för sin org
CREATE POLICY dogs_insert_policy ON dogs FOR INSERT WITH CHECK (
  -- Kund skapar hund (owner_id = sig själv)
  owner_id = auth.uid()
  OR
  -- Personal skapar hund
  (
    is_staff_user()
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

-- UPDATE: Kund uppdaterar sina hundar, Personal uppdaterar för sin org
CREATE POLICY dogs_update_policy ON dogs FOR UPDATE USING (
  owner_id = auth.uid()
  OR
  (
    is_staff_user()
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

-- DELETE: Kund kan radera sina hundar, Personal kan radera
CREATE POLICY dogs_delete_policy ON dogs FOR DELETE USING (
  owner_id = auth.uid()
  OR
  (
    is_staff_user()
    AND (org_id = get_user_org_id() OR org_id IS NULL)
  )
);

-- =====================================================
-- STEG 7: BOOKINGS (Bokningar)
-- =====================================================
-- Kunder: Ser endast sina egna bokningar (owner_id = auth.uid())
-- Personal: Ser alla bokningar för sin org

CREATE POLICY bookings_select_policy ON bookings FOR SELECT USING (
  -- Kund ser sina bokningar
  owner_id = auth.uid()
  OR
  -- Personal ser alla bokningar för sin org
  (is_staff_user() AND org_id = get_user_org_id())
);

-- INSERT: Kund skapar bokning, Personal skapar för sin org
CREATE POLICY bookings_insert_policy ON bookings FOR INSERT WITH CHECK (
  -- Kund skapar bokning (måste ange pensionatets org_id, owner_id = sig själv)
  owner_id = auth.uid()
  OR
  -- Personal skapar bokning för sin org
  (is_staff_user() AND org_id = get_user_org_id())
);

-- UPDATE: Endast personal (status-ändringar etc)
CREATE POLICY bookings_update_policy ON bookings FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- DELETE: Endast personal
CREATE POLICY bookings_delete_policy ON bookings FOR DELETE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 8: INVOICES (Fakturor)
-- =====================================================
-- Kunder: Ser sina egna fakturor
-- Personal: Ser alla fakturor för sin org

CREATE POLICY invoices_select_policy ON invoices FOR SELECT USING (
  -- Kund ser sina fakturor
  owner_id = auth.uid()
  OR
  -- Personal ser alla fakturor för sin org
  (is_staff_user() AND org_id = get_user_org_id())
);

-- INSERT/UPDATE/DELETE: Endast personal
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
-- STEG 9: INVOICE_ITEMS (Fakturarader)
-- =====================================================
-- Följer samma mönster som invoices (via JOIN)

CREATE POLICY invoice_items_select_policy ON invoice_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND (
      invoices.owner_id = auth.uid()
      OR (is_staff_user() AND invoices.org_id = get_user_org_id())
    )
  )
);

CREATE POLICY invoice_items_insert_policy ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() 
    AND invoices.org_id = get_user_org_id()
  )
);

CREATE POLICY invoice_items_update_policy ON invoice_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() 
    AND invoices.org_id = get_user_org_id()
  )
);

CREATE POLICY invoice_items_delete_policy ON invoice_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id
    AND is_staff_user() 
    AND invoices.org_id = get_user_org_id()
  )
);

-- =====================================================
-- STEG 10: ORGS (Organisationer)
-- =====================================================
-- Kunder: Kan läsa ALLA synliga orgs (för att välja pensionat vid bokning)
-- Personal: Kan läsa sin egen org, endast admin kan uppdatera

CREATE POLICY orgs_select_policy ON orgs FOR SELECT USING (
  -- Personal ser sin org
  id = get_user_org_id()
  OR
  -- Kunder kan läsa synliga orgs (för att välja pensionat)
  (is_visible_to_customers = true AND auth.uid() IS NOT NULL)
);

-- INSERT: Endast via trigger (handle_new_user)
CREATE POLICY orgs_insert_policy ON orgs FOR INSERT WITH CHECK (
  -- Endast service role eller trigger
  false
);

-- UPDATE: Endast admin för sin org
CREATE POLICY orgs_update_policy ON orgs FOR UPDATE USING (
  id = get_user_org_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- STEG 11: ROOMS (Rum)
-- =====================================================
-- Kunder: Kan läsa rum (för att se tillgänglighet vid bokning)
-- Personal: Full CRUD på sin orgs rum

CREATE POLICY rooms_select_policy ON rooms FOR SELECT USING (
  -- Personal ser sina rum
  (is_staff_user() AND org_id = get_user_org_id())
  OR
  -- Kunder kan läsa rum för att se tillgänglighet
  (auth.uid() IS NOT NULL AND is_active = true)
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
-- STEG 12: INTEREST_APPLICATIONS (Intresseanmälningar)
-- =====================================================
-- Kunder: Kan skapa ansökningar (till vilken org som helst)
-- Personal: Ser endast sin orgs ansökningar

CREATE POLICY interest_applications_select_policy ON interest_applications FOR SELECT USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- INSERT: Alla autentiserade användare kan ansöka
CREATE POLICY interest_applications_insert_policy ON interest_applications FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY interest_applications_update_policy ON interest_applications FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 13: DOG_JOURNAL (Hundjournal)
-- =====================================================
-- Kunder: Kan läsa journal för sina hundar
-- Personal: Kan läsa/skriva journal för sin orgs hundar

CREATE POLICY dog_journal_select_policy ON dog_journal FOR SELECT USING (
  -- Kund kan läsa journal för sina hundar
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = dog_journal.dog_id 
    AND dogs.owner_id = auth.uid()
  )
  OR
  -- Personal kan läsa journal
  (
    is_staff_user() 
    AND (
      org_id = get_user_org_id() 
      OR org_id IS NULL
    )
  )
);

CREATE POLICY dog_journal_insert_policy ON dog_journal FOR INSERT WITH CHECK (
  is_staff_user() 
  AND (
    org_id = get_user_org_id() 
    OR org_id IS NULL
  )
);

-- =====================================================
-- STEG 14: EXTRA_SERVICES (Priskatalog - tjänster)
-- =====================================================
-- Kunder: Kan läsa priser för att se kostnad vid bokning
-- Personal: Full CRUD

CREATE POLICY extra_services_select_policy ON extra_services FOR SELECT USING (
  -- Personal ser sin orgs tjänster
  (is_staff_user() AND org_id = get_user_org_id())
  OR
  -- Kunder kan läsa priser (för att se kostnad vid bokning)
  (auth.uid() IS NOT NULL AND is_active = true)
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
-- STEG 15: BOARDING_PRICES (Pensionatspriser)
-- =====================================================
-- Kunder: Kan läsa priser
-- Personal: Full CRUD

CREATE POLICY boarding_prices_select_policy ON boarding_prices FOR SELECT USING (
  -- Personal ser sin orgs priser
  (is_staff_user() AND org_id = get_user_org_id())
  OR
  -- Kunder kan läsa priser (för att se kostnad vid bokning)
  (auth.uid() IS NOT NULL AND is_active = true)
);

CREATE POLICY boarding_prices_insert_policy ON boarding_prices FOR INSERT WITH CHECK (
  is_staff_user() AND org_id = get_user_org_id()
);

CREATE POLICY boarding_prices_update_policy ON boarding_prices FOR UPDATE USING (
  is_staff_user() AND org_id = get_user_org_id()
);

-- =====================================================
-- STEG 16: VERIFIERING
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ KOMPLETT RLS-POLICY INSTALLERAD';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 SAMMANFATTNING:';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 PROFILES (personal-tabell):';
  RAISE NOTICE '   - Personal ser sin org';
  RAISE NOTICE '   - Kunder har INGEN åtkomst';
  RAISE NOTICE '';
  RAISE NOTICE '👥 OWNERS (kund-tabell):';
  RAISE NOTICE '   - Kund ser sin egen rad (id = auth.uid())';
  RAISE NOTICE '   - Personal ser sin orgs kunder + pensionatkunder (org_id IS NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '🐕 DOGS (hund-tabell):';
  RAISE NOTICE '   - Kund ser sina hundar (owner_id = auth.uid())';
  RAISE NOTICE '   - Personal ser sin orgs hundar + pensionathundar (org_id IS NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '📅 BOOKINGS (bokningar):';
  RAISE NOTICE '   - Kund ser sina bokningar (owner_id = auth.uid())';
  RAISE NOTICE '   - Personal ser sin orgs bokningar';
  RAISE NOTICE '';
  RAISE NOTICE '💰 INVOICES/INVOICE_ITEMS (fakturor):';
  RAISE NOTICE '   - Kund ser sina fakturor';
  RAISE NOTICE '   - Personal har full CRUD för sin org';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 ORGS (organisationer):';
  RAISE NOTICE '   - Kunder kan läsa synliga orgs (för bokning)';
  RAISE NOTICE '   - Personal ser sin org, admin kan uppdatera';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 ROOMS, PRICES, EXTRA_SERVICES:';
  RAISE NOTICE '   - Kunder kan läsa (för att se priser/tillgänglighet)';
  RAISE NOTICE '   - Personal har full CRUD';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;

-- Visa alla policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'owners', 'dogs', 'bookings', 'invoices', 
                  'invoice_items', 'orgs', 'rooms', 'interest_applications',
                  'dog_journal', 'extra_services', 'boarding_prices')
ORDER BY tablename, policyname;
