-- ========================================
-- ÅTERSTÄLL TRIGGERS OCH RLS
-- Kör denna om du råkat köra complete_testdata.sql
-- ========================================

-- === STEG 1: ÅTERAKTIVERA RLS ===
ALTER TABLE IF EXISTS public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interest_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_service_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- === STEG 2: ÅTERSKAPA VIKTIGA TRIGGERS ===

-- Funktion för att sätta org_id från användarprofil
CREATE OR REPLACE FUNCTION set_org_and_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Hämta org_id från användarens profil
  SELECT org_id INTO NEW.org_id
  FROM profiles
  WHERE id = auth.uid();
  
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att sätta org_id från hund (för bokningar)
CREATE OR REPLACE FUNCTION set_org_id_from_dog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dog_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM dogs
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Återskapa triggers för org_id
DROP TRIGGER IF EXISTS trg_set_org_id_owners ON owners;
CREATE TRIGGER trg_set_org_id_owners 
  BEFORE INSERT ON owners
  FOR EACH ROW EXECUTE FUNCTION set_org_and_user();

DROP TRIGGER IF EXISTS trg_set_org_id_dogs ON dogs;
CREATE TRIGGER trg_set_org_id_dogs 
  BEFORE INSERT ON dogs
  FOR EACH ROW EXECUTE FUNCTION set_org_and_user();

DROP TRIGGER IF EXISTS trg_set_org_id_rooms ON rooms;
CREATE TRIGGER trg_set_org_id_rooms 
  BEFORE INSERT ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_org_and_user();

DROP TRIGGER IF EXISTS trg_set_org_id_on_bookings ON bookings;
CREATE TRIGGER trg_set_org_id_on_bookings 
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog();

-- Återskapa trigger för auto-onboarding vid registrering
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
  org_name_val text;
  org_number_val text;
  full_name_val text;
  phone_val text;
BEGIN
  -- Hämta metadata från signUp
  org_name_val := NEW.raw_user_meta_data->>'org_name';
  org_number_val := NEW.raw_user_meta_data->>'org_number';
  full_name_val := NEW.raw_user_meta_data->>'full_name';
  phone_val := NEW.raw_user_meta_data->>'phone';
  
  -- Skapa organisation
  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
  VALUES (
    COALESCE(org_name_val, 'Mitt Hunddagis'),
    org_number_val,
    NEW.email,
    true,
    25
  )
  RETURNING id INTO new_org_id;
  
  -- Skapa profil
  INSERT INTO profiles (id, org_id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    new_org_id,
    'admin',
    full_name_val,
    NEW.email,
    phone_val
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- === STEG 3: SKAPA GRUNDLÄGGANDE RLS POLICIES ===

-- Policies för orgs
DROP POLICY IF EXISTS "Users can view their own org" ON orgs;
CREATE POLICY "Users can view their own org" ON orgs
  FOR SELECT USING (
    id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own org" ON orgs;
CREATE POLICY "Users can update their own org" ON orgs
  FOR UPDATE USING (
    id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Policies för profiles
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
CREATE POLICY "Users can view profiles in their org" ON profiles
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Policies för dogs
DROP POLICY IF EXISTS "Users can view dogs in their org" ON dogs;
CREATE POLICY "Users can view dogs in their org" ON dogs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert dogs in their org" ON dogs;
CREATE POLICY "Users can insert dogs in their org" ON dogs
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update dogs in their org" ON dogs;
CREATE POLICY "Users can update dogs in their org" ON dogs
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Policies för owners
DROP POLICY IF EXISTS "Users can view owners in their org" ON owners;
CREATE POLICY "Users can view owners in their org" ON owners
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert owners in their org" ON owners;
CREATE POLICY "Users can insert owners in their org" ON owners
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update owners in their org" ON owners;
CREATE POLICY "Users can update owners in their org" ON owners
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Policies för bookings
DROP POLICY IF EXISTS "Users can view bookings in their org" ON bookings;
CREATE POLICY "Users can view bookings in their org" ON bookings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert bookings in their org" ON bookings;
CREATE POLICY "Users can insert bookings in their org" ON bookings
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update bookings in their org" ON bookings;
CREATE POLICY "Users can update bookings in their org" ON bookings
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- === KLART! ===
-- Dina triggers och RLS är nu återställda.
-- Testa genom att:
-- 1. Gå till /register och skapa ett nytt konto
-- 2. Logga in
-- 3. Försök lägga till en hund via UI

SELECT 'Triggers och RLS återställda! ✅' AS status;
