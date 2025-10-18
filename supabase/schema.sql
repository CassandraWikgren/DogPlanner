-- ========================================
-- DOGPLANNER - KOMPLETT SUPABASE SCHEMA
-- Uppdaterad 2025-10-16 baserat på faktisk databas
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- HUVUDTABELLER
-- =======================================

-- === ORGANISATIONER ===
CREATE TABLE IF NOT EXISTS orgs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  org_number text,
  email text,
  phone text,
  address text,
  vat_included boolean DEFAULT true,
  vat_rate numeric DEFAULT 25,
  modules_enabled text[] DEFAULT ARRAY['daycare'],
  pricing_currency text DEFAULT 'SEK',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ANVÄNDARPROFILER ===
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  full_name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ÄGARE ===
CREATE TABLE IF NOT EXISTS owners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  address text,
  postal_code text,
  city text,
  customer_number serial,
  contact_person_2 text,
  contact_phone_2 text,
  notes text,
  gdpr_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  photo_consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === RUM ===
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity_m2 numeric NOT NULL,
  room_type text CHECK (room_type IN ('daycare', 'boarding', 'both')) DEFAULT 'both',
  max_dogs integer,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDAR ===
CREATE TABLE IF NOT EXISTS dogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  name text NOT NULL,
  breed text,
  birth date,
  gender text CHECK (gender IN ('hane', 'tik')),
  heightcm integer,
  subscription text,
  days text,
  startdate date,
  enddate date,
  vaccdhp date,
  vaccpi date,
  allergies text,
  medications text,
  special_needs text,
  behavior_notes text,
  food_info text,
  is_castrated boolean DEFAULT false,
  is_house_trained boolean DEFAULT true,
  is_escape_artist boolean DEFAULT false,
  destroys_things boolean DEFAULT false,
  can_be_with_other_dogs boolean DEFAULT true,
  photo_url text,
  in_heat boolean DEFAULT false,
  heat_start_date date,
  checked_in boolean DEFAULT false,
  checkin_date date,
  checkout_date date,
  notes text,
  events jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === BOKNINGAR ===
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  checkin_time time,
  checkout_time time,
  status text CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'pending',
  base_price numeric,
  total_price numeric,
  discount_amount numeric DEFAULT 0,
  deposit_amount numeric DEFAULT 0,
  deposit_paid boolean DEFAULT false,
  notes text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === EXTRA TJÄNSTER ===
CREATE TABLE IF NOT EXISTS extra_service (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL,
  service_type text CHECK (service_type IN ('boarding', 'daycare', 'grooming', 'all')) DEFAULT 'all',
  category text,
  price_small numeric,
  price_medium numeric,
  price_large numeric,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === BOKNINGSTJÄNSTER ===
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  extra_service_id uuid REFERENCES extra_service(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  price numeric,
  total_amount numeric,
  performed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDJOURNAL ===
CREATE TABLE IF NOT EXISTS dog_journal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entry_type text CHECK (entry_type IN ('note', 'medical', 'behavior', 'feeding', 'exercise', 'grooming')) DEFAULT 'note',
  content text NOT NULL,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FRISÖRLOGGAR ===
CREATE TABLE IF NOT EXISTS grooming_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type text,
  duration_minutes integer,
  price numeric,
  notes text,
  before_photo_url text,
  after_photo_url text,
  performed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === PRISLISTOR ===
CREATE TABLE IF NOT EXISTS price_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  effective_from date,
  effective_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === PENSIONATPRISER ===
CREATE TABLE IF NOT EXISTS boarding_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  price_list_id uuid REFERENCES price_lists(id) ON DELETE CASCADE,
  dog_size text CHECK (dog_size IN ('small', 'medium', 'large')),
  base_price numeric NOT NULL,
  weekend_surcharge numeric DEFAULT 0,
  holiday_surcharge numeric DEFAULT 0,
  season_multiplier numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === SÄSONGER ===
CREATE TABLE IF NOT EXISTS boarding_seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_multiplier numeric DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ÄGARRABATTER ===
CREATE TABLE IF NOT EXISTS position_share (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FAKTUROR ===
CREATE TABLE IF NOT EXISTS invoice_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  subtotal numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FAKTURARADER ===
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoice_logs(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === TJÄNSTER ===
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  duration_minutes integer,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ABONNEMANG ===
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  price_per_month numeric,
  days_included text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === NÄRVAROLOGGAR ===
CREATE TABLE IF NOT EXISTS attendence_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text CHECK (action IN ('checkin', 'checkout')) NOT NULL,
  timestamp timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- === PERSONALANTECKNINGAR ===
CREATE TABLE IF NOT EXISTS staff_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text CHECK (target_type IN ('dog', 'owner', 'booking', 'general')),
  target_id uuid,
  content text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ANSVARSOMRÅDEN ===
CREATE TABLE IF NOT EXISTS responsibilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_date date DEFAULT current_date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FELLOGGAR ===
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type text,
  error_message text,
  stack_trace text,
  context jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =======================================
-- TRIGGERS OCH FUNKTIONER
-- =======================================

-- === AUTOMATISK UPDATED_AT ===
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ORGANISATIONSHANTERING ===

-- Funktion för att sätta org_id automatiskt
CREATE OR REPLACE FUNCTION set_org_id_for_owners()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_org_id_for_dogs()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_org_id_for_rooms()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_org_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL OR NEW.user_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ANVÄNDARHANTERING ===

-- Hantera nya användare
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_name text;
BEGIN
  -- Skapa organisationsnamn från e-post
  org_name := split_part(NEW.email, '@', 1) || 's Hunddagis';
  
  -- Skapa ny organisation
  INSERT INTO orgs (name, email) 
  VALUES (org_name, NEW.email);
  
  -- Skapa profil som admin
  INSERT INTO profiles (id, org_id, role, email, full_name)
  SELECT NEW.id, orgs.id, 'admin', NEW.email, NEW.raw_user_meta_data->>'full_name'
  FROM orgs WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tilldela organisation till nya användare
CREATE OR REPLACE FUNCTION assign_org_to_new_user()
RETURNS trigger AS $$
DECLARE
  user_domain text;
  org_id_found uuid;
BEGIN
  user_domain := split_part(NEW.email, '@', 2);
  
  SELECT id INTO org_id_found 
  FROM orgs 
  WHERE email LIKE '%@' || user_domain;
  
  IF org_id_found IS NOT NULL THEN
    INSERT INTO profiles (id, org_id, role, email, full_name)
    VALUES (NEW.id, org_id_found, 'staff', NEW.email, NEW.raw_user_meta_data->>'full_name');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sätt standardroll
CREATE OR REPLACE FUNCTION set_default_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS NULL THEN
    NEW.role := 'staff';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === FAKTURAHANTERING ===

-- Skapa faktura vid utcheckning
CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    -- Skapa faktura här
    INSERT INTO invoice_logs (org_id, owner_id, invoice_number, invoice_date, total_amount)
    VALUES (NEW.org_id, NEW.owner_id, 'INV-' || NEW.id, CURRENT_DATE, NEW.total_price);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === JOURNALHANTERING ===

-- Skapa journalpost för ny hund
CREATE OR REPLACE FUNCTION create_dog_journal_on_new_dog()
RETURNS trigger AS $$
BEGIN
  INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)
  VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================
-- TRIGGERS
-- =======================================

-- Updated_at triggers
CREATE TRIGGER trg_update_orgs_updated_at BEFORE UPDATE ON orgs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_owners_updated_at BEFORE UPDATE ON owners 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_rooms_updated_at BEFORE UPDATE ON rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON dogs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_bookings_updated_at BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Org ID triggers
CREATE TRIGGER trg_set_org_id_owners BEFORE INSERT ON owners
  FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners();

CREATE TRIGGER trg_set_org_id_dogs BEFORE INSERT ON dogs
  FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs();

CREATE TRIGGER trg_set_org_id_rooms BEFORE INSERT ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms();

CREATE TRIGGER trg_set_org_user_bookings BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_org_user();

CREATE TRIGGER trg_set_org_user_dog_journal BEFORE INSERT ON dog_journal
  FOR EACH ROW EXECUTE FUNCTION set_org_user();

-- User management triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trg_assign_org_to_new_user AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_org_to_new_user();

CREATE TRIGGER on_profile_insert BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_default_role();

-- Business logic triggers
CREATE TRIGGER trg_create_invoice_on_checkout AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_invoice_on_checkout();

CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON dogs
  FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog();

-- =======================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- =======================================
-- COMPREHENSIVE RLS POLICIES
-- =======================================

-- För utveckling: Tillåt allt för autentiserade användare
-- I produktion: Begränsa till org_id

-- Orgs policies
CREATE POLICY "Allow all for authenticated users" ON orgs
  FOR ALL USING (auth.role() = 'authenticated');

-- Profiles policies  
CREATE POLICY "Allow all for authenticated users" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Owners policies
CREATE POLICY "Allow all for authenticated users" ON owners
  FOR ALL USING (auth.role() = 'authenticated');

-- Rooms policies
CREATE POLICY "Allow all for authenticated users" ON rooms
  FOR ALL USING (auth.role() = 'authenticated');

-- Dogs policies
CREATE POLICY "Allow all for authenticated users" ON dogs
  FOR ALL USING (auth.role() = 'authenticated');

-- Bookings policies
CREATE POLICY "Allow all for authenticated users" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Extra service policies
CREATE POLICY "Allow all for authenticated users" ON extra_service
  FOR ALL USING (auth.role() = 'authenticated');

-- Booking services policies
CREATE POLICY "Allow all for authenticated users" ON booking_services
  FOR ALL USING (auth.role() = 'authenticated');

-- Dog journal policies
CREATE POLICY "Allow all for authenticated users" ON dog_journal
  FOR ALL USING (auth.role() = 'authenticated');

-- Grooming logs policies
CREATE POLICY "Allow all for authenticated users" ON grooming_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Price lists policies
CREATE POLICY "Allow all for authenticated users" ON price_lists
  FOR ALL USING (auth.role() = 'authenticated');

-- Boarding prices policies
CREATE POLICY "Allow all for authenticated users" ON boarding_prices
  FOR ALL USING (auth.role() = 'authenticated');

-- Boarding seasons policies
CREATE POLICY "Allow all for authenticated users" ON boarding_seasons
  FOR ALL USING (auth.role() = 'authenticated');

-- Position share policies
CREATE POLICY "Allow all for authenticated users" ON position_share
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoice logs policies
CREATE POLICY "Allow all for authenticated users" ON invoice_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoice items policies
CREATE POLICY "Allow all for authenticated users" ON invoice_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Services policies
CREATE POLICY "Allow all for authenticated users" ON services
  FOR ALL USING (auth.role() = 'authenticated');

-- Subscriptions policies
CREATE POLICY "Allow all for authenticated users" ON subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Attendence logs policies
CREATE POLICY "Allow all for authenticated users" ON attendence_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Staff notes policies
CREATE POLICY "Allow all for authenticated users" ON staff_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- Responsibilities policies
CREATE POLICY "Allow all for authenticated users" ON responsibilities
  FOR ALL USING (auth.role() = 'authenticated');

-- Error logs policies
CREATE POLICY "Allow all for authenticated users" ON error_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- =======================================
-- TESTDATA (Valfritt)
-- =======================================

-- Skapa testorganisation
INSERT INTO orgs (id, name, email, vat_included, vat_rate) 
VALUES (
  'test-org-uuid', 
  'Test Hundcenter', 
  'test@dogplanner.se', 
  true, 
  0.25
) ON CONFLICT (id) DO NOTHING;

-- Skapa testrum
INSERT INTO rooms (org_id, name, capacity_m2, room_type, is_active)
VALUES 
  ('test-org-uuid', 'Stora rummet', 15.0, 'boarding', true),
  ('test-org-uuid', 'Lilla rummet', 8.0, 'boarding', true),
  ('test-org-uuid', 'Dagisrummet', 25.0, 'daycare', true)
ON CONFLICT DO NOTHING;

-- =======================================
-- KOMMENTARER
-- =======================================

COMMENT ON TABLE orgs IS 'Organisationer/företag som använder systemet';
COMMENT ON TABLE profiles IS 'Användarprofiler kopplade till auth.users';
COMMENT ON TABLE owners IS 'Hundägare/kunder';
COMMENT ON TABLE rooms IS 'Rum för dagis och pensionat - SKAPAD OCH FUNKTIONELL';
COMMENT ON TABLE dogs IS 'Hundar med all info och status';
COMMENT ON TABLE bookings IS 'Pensionatbokningar';
COMMENT ON TABLE extra_service IS 'Extra tjänster (frisör, medicin, etc)';
COMMENT ON TABLE dog_journal IS 'Journal/anteckningar för hundar';

-- Schema version
COMMENT ON SCHEMA public IS 'DogPlanner Schema v2.1 - Uppdaterad 2024-12-19 - ROOMS TABELL SKAPAD OCH FUNKTIONELL';