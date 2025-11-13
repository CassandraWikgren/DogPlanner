-- ========================================
-- CLEANUP DUPLICERADE TRIGGERS - 2025-11-13
-- ========================================
-- Baserat på faktisk trigger-status från Supabase
-- Tar bort duplicerade triggers och behåller bara de som behövs
--
-- KÖRORDNING:
-- 1. Öppna Supabase Dashboard → SQL Editor
-- 2. Kopiera in hela denna fil
-- 3. Klicka Run
-- 4. Verifiera med: SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgrelid, tgname;

-- ============================================
-- STEG 1: DOGS - Rensa 9 triggers → behåll 2
-- ============================================

-- Ta bort alla gamla dogs org_id triggers
DROP TRIGGER IF EXISTS on_insert_set_org_id_for_dogs ON dogs;
DROP TRIGGER IF EXISTS on_insert_set_user_id ON dogs;
DROP TRIGGER IF EXISTS set_org_for_dogs ON dogs;
DROP TRIGGER IF EXISTS set_org_id_trigger ON dogs;
DROP TRIGGER IF EXISTS trg_set_org_id_dogs ON dogs;
DROP TRIGGER IF EXISTS trg_set_org_id_on_dogs ON dogs;
DROP TRIGGER IF EXISTS trg_set_org_user_dogs ON dogs;

-- Ta bort duplicerad timestamp trigger
DROP TRIGGER IF EXISTS set_last_updated ON dogs;

-- Behåll dessa 3:
-- ✅ trg_auto_match_owner (kopplar ägarskn automatiskt)
-- ✅ trg_create_journal_on_new_dog (skapar första journalposten)
-- ✅ trg_update_dogs_updated_at (uppdaterar timestamp)

-- Skapa EN enkel org_id trigger för dogs
CREATE OR REPLACE FUNCTION set_dog_org_id() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_dog_org_id
BEFORE INSERT ON dogs
FOR EACH ROW
EXECUTE FUNCTION set_dog_org_id();

-- ============================================
-- STEG 2: OWNERS - Rensa 5 triggers → behåll 2
-- ============================================

-- Ta bort alla duplicerade
DROP TRIGGER IF EXISTS on_insert_set_org_id_for_owners ON owners;
DROP TRIGGER IF EXISTS owners_set_org_id ON owners;
DROP TRIGGER IF EXISTS set_org_id_trigger ON owners;
DROP TRIGGER IF EXISTS trg_set_org_id_owners ON owners;
DROP TRIGGER IF EXISTS trg_set_org_user_owners ON owners;

-- Behåll:
-- ✅ trigger_auto_customer_number (genererar kundnummer)

-- Skapa EN enkel org_id trigger
CREATE OR REPLACE FUNCTION set_owner_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_owner_org_id
BEFORE INSERT ON owners
FOR EACH ROW
EXECUTE FUNCTION set_owner_org_id();

-- ============================================
-- STEG 3: BOOKINGS - Rensa 7 triggers → behåll 3
-- ============================================

-- Ta bort duplicerade org_id triggers
DROP TRIGGER IF EXISTS on_insert_set_org_id_for_bookings ON bookings;
DROP TRIGGER IF EXISTS trg_set_org_id_on_bookings ON bookings;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS trg_touch_bookings ON bookings;

-- Behåll dessa 3:
-- ✅ trg_create_prepayment_invoice (skapar förskottsfaktura vid confirmed)
-- ✅ trg_create_invoice_on_checkout (skapar efterskottsfaktura vid checked_out)
-- ✅ trg_touch_bookings ELLER update_bookings_updated_at (de gör samma sak)

-- Skapa EN enkel org_id trigger
CREATE OR REPLACE FUNCTION set_booking_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM dogs 
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_booking_org_id
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_org_id();

-- ============================================
-- STEG 4: EXTRA_SERVICE - Rensa 3 triggers → behåll 1
-- ============================================

DROP TRIGGER IF EXISTS set_org_id_trigger ON extra_service;
DROP TRIGGER IF EXISTS trg_set_org_id_extra_service ON extra_service;
DROP TRIGGER IF EXISTS trg_set_org_user_extra_service ON extra_service;

CREATE OR REPLACE FUNCTION set_extra_service_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_extra_service_org_id
BEFORE INSERT ON extra_service
FOR EACH ROW
EXECUTE FUNCTION set_extra_service_org_id();

-- ============================================
-- STEG 5: EXTRA_SERVICES (plural) - Rensa 1 trigger
-- ============================================

-- Behåll bara en
-- ✅ trg_set_org_id_extra_services

-- ============================================
-- STEG 6: DOG_JOURNAL - Rensa 2 triggers → behåll 1
-- ============================================

DROP TRIGGER IF EXISTS trg_set_org_id_for_dog_journal ON dog_journal;
DROP TRIGGER IF EXISTS trg_set_org_user_dog_journal ON dog_journal;

CREATE OR REPLACE FUNCTION set_dog_journal_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_dog_journal_org_id
BEFORE INSERT ON dog_journal
FOR EACH ROW
EXECUTE FUNCTION set_dog_journal_org_id();

-- ============================================
-- STEG 7: PENSION_STAYS - Rensa duplicerade
-- ============================================

DROP TRIGGER IF EXISTS on_insert_set_org_id_for_pension_stays ON pension_stays;
DROP TRIGGER IF EXISTS trg_set_org_id_for_pension_stays ON pension_stays;
DROP TRIGGER IF EXISTS trg_set_org_id_on_pension_stays ON pension_stays;

-- Behåll:
-- ✅ set_timestamp_pension_stays (uppdaterar timestamp)
-- ✅ trg_calc_total_amount (beräknar totalsumma)

-- Skapa EN enkel org_id trigger
CREATE OR REPLACE FUNCTION set_pension_stay_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM dogs 
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_pension_stay_org_id
BEFORE INSERT OR UPDATE ON pension_stays
FOR EACH ROW
EXECUTE FUNCTION set_pension_stay_org_id();

-- ============================================
-- STEG 8: SUBSCRIPTIONS - Rensa duplicerade
-- ============================================

DROP TRIGGER IF EXISTS set_org_id_trigger ON subscriptions;

-- Behåll:
-- ✅ on_insert_set_org_id_for_subscriptions

-- ============================================
-- STEG 9: AUTH USERS - TA BORT DEN GAMLA!
-- ============================================

-- Ta bort den gamla, enklare versionen
DROP TRIGGER IF EXISTS trg_assign_org_to_new_user ON auth.users;

-- Behåll:
-- ✅ on_auth_user_created (den kompletta versionen)

-- ============================================
-- STEG 10: BOARDING_PRICES & BOARDING_SEASONS
-- ============================================

-- Dessa är OK, behåll:
-- ✅ on_insert_set_org_id_for_boarding_prices
-- ✅ on_insert_set_org_id_for_boarding_seasons

-- ============================================
-- STEG 11: ROOMS
-- ============================================

DROP TRIGGER IF EXISTS on_insert_set_org_id_for_rooms ON rooms;

-- Behåll:
-- ✅ trg_set_org_id_rooms (den vi redan har)

-- ============================================
-- STEG 12: RENSA GAMLA FUNKTIONER SOM INTE ANVÄNDS
-- ============================================

-- Dessa funktioner används inte längre efter cleanup
DROP FUNCTION IF EXISTS set_org_id() CASCADE;
DROP FUNCTION IF EXISTS set_org_and_user() CASCADE;
DROP FUNCTION IF EXISTS set_user_id() CASCADE;
DROP FUNCTION IF EXISTS set_owner_org_id() CASCADE; -- Skapas ovan på nytt
DROP FUNCTION IF EXISTS assign_org_to_new_user() CASCADE;

-- ============================================
-- VERIFIERA RESULTAT
-- ============================================

-- Kör denna query för att se kvarvarande triggers per tabell:
SELECT 
  t.tgrelid::regclass AS table_name,
  COUNT(*) AS trigger_count,
  array_agg(t.tgname ORDER BY t.tgname) AS trigger_names
FROM pg_trigger t
WHERE NOT t.tgisinternal
  AND t.tgrelid::regclass::text LIKE 'dogs%'
     OR t.tgrelid::regclass::text LIKE 'owners%'
     OR t.tgrelid::regclass::text LIKE 'bookings%'
     OR t.tgrelid::regclass::text LIKE 'extra_%'
     OR t.tgrelid::regclass::text LIKE 'pension_stays%'
     OR t.tgrelid::regclass::text LIKE 'rooms%'
     OR t.tgrelid::regclass::text LIKE 'boarding_%'
GROUP BY t.tgrelid
ORDER BY table_name;

-- ============================================
-- FÖRVÄNTAT RESULTAT
-- ============================================
-- dogs             → 4 triggers (org_id, auto_match_owner, journal, updated_at)
-- owners           → 2 triggers (org_id, customer_number)
-- bookings         → 3 triggers (org_id, prepayment_invoice, checkout_invoice)
-- extra_service    → 1 trigger  (org_id)
-- extra_services   → 1 trigger  (org_id)
-- dog_journal      → 1 trigger  (org_id)
-- pension_stays    → 3 triggers (org_id, timestamp, calc_total)
-- rooms            → 1 trigger  (org_id)
-- boarding_prices  → 1 trigger  (org_id)
-- boarding_seasons → 1 trigger  (org_id)
-- subscriptions    → 1 trigger  (org_id)
-- auth.users       → 1 trigger  (handle_new_user)
