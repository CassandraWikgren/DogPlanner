-- ========================================
-- DOGPLANNER - KOMPLETT SUPABASE SCHEMA
-- Uppdaterad 2025-11-02 (inkl. org_subscriptions + grooming + RLS policies)
-- ========================================
--
-- === RELATERADE SQL-FILER I PROJEKTET ===
--
-- 🔧 SETUP & TRIGGERS:
--   • fix_registration_triggers.sql         → AUTO-SKAPAR org/profil vid registrering (VIKTIGT!)
--   • enable_triggers_for_production.sql    → Sätter org_id automatiskt för owners/dogs/rooms (FRIVILLIGT)
--   • complete_testdata.sql                 → Testdata för development (DISABLAR triggers!)
--   • add_prepayment_system.sql             → Förskotts-/efterskottssystem (2025-11-01)
--   • add_due_date_to_invoices.sql          → Lägger till due_date i invoices (2025-11-01)
--
-- 🆕 NYA TABELLER OCH POLICIES (2025-11-02):
--   • migrations/2025-11-02_org_subscriptions_grooming.sql → org_subscriptions, grooming_bookings, grooming_journal
--   • migrations/2025-11-02_rls_profiles_policy.sql        → RLS policies för profiles (SELECT, INSERT, UPDATE)
--   • VIKTIGT: org_subscriptions = organisationens plan (trialing/active/past_due/canceled)
--   • VIKTIGT: subscriptions = hundabonnemang (dagis-paket per hund)
--   • API: /api/subscription/status använder org_subscriptions
--   • API: /api/onboarding/auto skapar org + profil + org_subscriptions automatiskt
--
-- 🛠️ MANUELLA FIXES (används vid behov):
--   • fix_cassandra_profile_20251101.sql    → Fixade Cassandras profil (körts 2025-11-01)
--   • create_org_and_profile.sql            → Skapa org + profil manuellt
--   • check_user_profile.sql                → Kolla användarens profil/org status
--
-- 💡 ONBOARDING:
--   • Kod: app/api/onboarding/auto/route.ts → Backup om trigger misslyckas
--   • Kod: app/context/AuthContext.tsx      → Anropar auto-onboarding vid login
--
-- 🔐 SÄKERHET:
--   • Koden sätter org_id MANUELLT i EditDogModal (fungerar utan triggers)
--   • Triggers är BACKUP-lösning för extra säkerhet
--   • RLS är DISABLED i development för enklare debugging
--
-- 💰 FÖRSKOTTS-/EFTERSKOTTSSYSTEM (2025-11-01):
--   • Migration: supabase/migrations/add_prepayment_system.sql
--   • bookings.prepayment_status          → Status för förskottsbetalning
--   • bookings.prepayment_invoice_id      → Länk till förskottsfaktura (skapas vid godkännande)
--   • bookings.afterpayment_invoice_id    → Länk till efterskottsfaktura (skapas vid utcheckning)
--   • invoices.invoice_type               → prepayment/afterpayment/full
--   • extra_service.payment_type          → prepayment (betalas i förskott) / afterpayment (betalas vid utcheckning)
--   • Triggers: trg_create_prepayment_invoice, trg_create_invoice_on_checkout
--   • UI: app/hundpensionat/ansokningar/page.tsx visar prepayment_invoice_id efter godkännande
--
-- 📅 MÅNADSFAKTURERING (2025-11-01):
--   • Migration: supabase/migrations/add_due_date_to_invoices.sql (lägger till due_date kolumn)
--   • Edge Function: supabase/functions/generate_invoices/index.ts
--   • GitHub Actions: .github/workflows/auto_generate_invoices.yml
--     - Körs automatiskt: 1:a varje månad kl 08:00 UTC
--     - Anropar Edge Function med SUPABASE_SERVICE_ROLE_KEY
--     - Loggar till function_logs och invoice_runs tabeller
--     - Skickar e-postnotifiering vid success/failure
--   • Deployment: Edge Functions måste deployas manuellt via Supabase Dashboard (Code tab)
--   • Fakturering:
--     - Skapar 'full'-fakturor (invoice_type='full') i invoices-tabellen
--     - Grupperar hundar per ägare för konsoliderade fakturor
--     - Inkluderar: abonnemang (dogs.subscription), extra_service, pension_stays
--     - Skapar invoice_items för varje rad (separat insert efter invoice)
--     - Sätter due_date till 30 dagar från invoice_date
--   • Kolumner som används:
--     - invoices: org_id, owner_id, billed_name, billed_email, invoice_date, due_date, 
--                 total_amount, status, invoice_type
--     - invoice_items: invoice_id, description, quantity, unit_price, total_amount
--   • Felsökning:
--     - 401 Unauthorized: Verifiera SUPABASE_SERVICE_ROLE_KEY i GitHub Secrets
--     - Schema fel: Kontrollera att alla kolumner finns i faktisk databas (not just schema.sql)
--     - Deploy fel: Edge Function måste deployas via Supabase Dashboard efter kodändringar
--     - Använd function_logs tabellen för detaljerad loggning
--
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
  personnummer text, -- Personnummer (admin-låst)
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
  insurance_company text, -- Försäkringsbolag
  insurance_number text, -- Försäkringsnummer
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
  extra_service_ids jsonb,
  notes text,
  special_requests text,
  -- FÖRSKOTTS-/EFTERSKOTTSFAKTURERING (tillagt 2025-11-01)
  prepayment_status text CHECK (prepayment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded')) DEFAULT 'unpaid',
  prepayment_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  afterpayment_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
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
  -- BETALNINGSTYP FÖR FÖRSKOTT/EFTERSKOTT (tillagt 2025-11-01)
  payment_type text CHECK (payment_type IN ('prepayment', 'afterpayment')) DEFAULT 'afterpayment',
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

-- === HUNDDAGIS: ABONNEMANGSTYPER & PRISSÄTTNING ===
CREATE TABLE IF NOT EXISTS subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('Heltid', 'Deltid 2', 'Deltid 3', 'Dagshund')),
  height_min integer NOT NULL,
  height_max integer NOT NULL,
  price numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, subscription_type, height_min, height_max)
);

-- === HUNDDAGIS: TJÄNSTEUTFÖRANDEN ===
CREATE TABLE IF NOT EXISTS daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad', 'annat')),
  scheduled_month text NOT NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_name text,
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDDAGIS: INTRESSEANMÄLNINGAR ===
CREATE TABLE IF NOT EXISTS interest_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  owner_city text,
  owner_address text,
  dog_name text NOT NULL,
  dog_breed text,
  dog_birth date,
  dog_age integer,
  dog_gender text CHECK (dog_gender IN ('hane', 'tik')),
  dog_size text CHECK (dog_size IN ('small', 'medium', 'large')),
  dog_height_cm integer,
  subscription_type text,
  preferred_start_date date,
  preferred_days text[],
  special_needs text,
  special_care_needs text,
  is_neutered boolean DEFAULT false,
  is_escape_artist boolean DEFAULT false,
  destroys_things boolean DEFAULT false,
  not_house_trained boolean DEFAULT false,
  previous_daycare_experience boolean,
  gdpr_consent boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined')),
  notes text,
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

-- === FAKTUROR (NY STRUKTUR - används av pensionat & månadsvis generering) ===
-- OBS: Denna tabell används av:
--   1. Pensionatsbokningar (via triggers för förskott/efterskott)
--   2. Månatlig fakturagenerering (Edge Function generate_invoices)
--   3. Manuell fakturering
--
-- MÅNADSFAKTURERING (Edge Function: generate_invoices):
--   • Körs automatiskt via GitHub Actions: 1:a varje månad kl 08:00 UTC
--   • Workflow: .github/workflows/auto_generate_invoices.yml
--   • Använder SUPABASE_SERVICE_ROLE_KEY för autentisering
--   • Deployment: Manuell deployment via Supabase Dashboard (Edge Functions → Code → Deploy)
--   
--   DATAFLÖDE:
--   1. Hämtar alla hundar med owners (dogs + owners tabeller)
--   2. Grupperar per ägare (billed_name) för konsoliderade fakturor
--   3. För varje hund:
--      - Lägg till abonnemang (dogs.subscription mot price_lists)
--      - Lägg till extra_service records inom månaden
--      - Lägg till pension_stays inom månaden
--   4. Skapar invoice med totalsumma (invoice_type='full')
--   5. Skapar invoice_items för varje rad (separat insert)
--   6. Loggar till function_logs tabellen
--   7. Skickar e-postnotifiering
--
--   VIKTIGA KOLUMNER:
--   • owner_id: Länk till owners (används för gruppering)
--   • billed_name: Kopierat från owner.full_name (för fakturans skull)
--   • billed_email: Kopierat från owner.email
--   • invoice_date: Startdatum för månaden (YYYY-MM-DD)
--   • due_date: Förfallodatum, sätts till 30 dagar från invoice_date
--   • invoice_type: 'full' för månadsfakturor (vs 'prepayment'/'afterpayment')
--   • status: Alltid 'draft' vid skapande
--
--   TROUBLESHOOTING:
--   • 401 Unauthorized: Kolla SUPABASE_SERVICE_ROLE_KEY i GitHub Secrets
--   • Schema fel: Verifiera att alla kolumner finns i faktisk databas (kör migrations)
--   • Deploy fel: Edge Function måste deployas manuellt efter kodändringar
--   • Loggning: Kolla function_logs tabellen för detaljerad felinfo
--
--   MIGRATION HISTORY:
--   • 2025-11-01: add_due_date_to_invoices.sql - Lade till due_date kolumn
--   • 2025-11-01: add_prepayment_system.sql - Lade till invoice_type, prepayment system
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  invoice_date date NOT NULL,
  due_date date, -- Tillagt 2025-11-01 (migration: add_due_date_to_invoices.sql)
  total_amount numeric NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  -- FÖRSKOTTS-/EFTERSKOTTSFAKTURERING (tillagt 2025-11-01)
  invoice_type text CHECK (invoice_type IN ('prepayment', 'afterpayment', 'full')) DEFAULT 'full',
  paid_at timestamptz,
  billed_name text, -- Namn på fakturamottagare (kopieras från owner.full_name)
  billed_email text, -- E-post till fakturamottagare (kopieras från owner.email)
  billed_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Fakturor för pensionat och månadsfakturering. Används av Edge Function generate_invoices (månadsvis) och triggers för pensionatsbokningar.';
COMMENT ON COLUMN invoices.invoice_type IS 'prepayment=förskott (vid godkännande), afterpayment=efterskott (vid utcheckning), full=komplett månadsfaktura (från generate_invoices Edge Function)';
COMMENT ON COLUMN invoices.billed_name IS 'Fakturamottagarens namn (kopierat från owner.full_name vid generering)';
COMMENT ON COLUMN invoices.billed_email IS 'Fakturamottagarens e-post (kopierat från owner.email vid generering)';
COMMENT ON COLUMN invoices.due_date IS 'Förfallodatum (sätts till invoice_date + 30 dagar av generate_invoices). Tillagt 2025-11-01.';
COMMENT ON COLUMN invoices.owner_id IS 'Länk till owners-tabellen. Används för att gruppera fakturor per ägare i månadsfakturering.';

-- === FAKTURARADER ===
-- Kopplas till både invoice_logs OCH invoices
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  invoice_id uuid, -- Kan referera till antingen invoices ELLER invoice_logs
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE invoice_items IS 'Fakturarader för både invoice_logs och invoices tabellerna';
COMMENT ON COLUMN invoice_items.invoice_id IS 'Foreign key till antingen invoices.id eller invoice_logs.id';

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

-- === ABONNEMANG (HUNDABONNEMANG - dagispaket per hund) ===
-- OBS: Detta är INTE organisationens plan! Se org_subscriptions nedan.
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

-- === ORGANISATIONENS PRENUMERATION (plan/billing) ===
-- Detta är organisationens plan (trialing/active/past_due/canceled), INTE hundabonnemang!
-- Skapas automatiskt vid registrering via /api/onboarding/auto
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'basic',
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','canceled')) DEFAULT 'trialing',
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_active ON org_subscriptions(org_id) WHERE is_active = true;

-- === GROOMING BOOKINGS (Frisörbokningar) ===
CREATE TABLE IF NOT EXISTS grooming_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time,
  service_type text NOT NULL,
  estimated_price numeric,
  status text NOT NULL CHECK (status IN ('confirmed','completed','cancelled','no_show')) DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_date ON grooming_bookings(org_id, appointment_date);

-- === GROOMING JOURNAL (Frisörjournal) ===
CREATE TABLE IF NOT EXISTS grooming_journal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  service_type text NOT NULL,
  clip_length text,
  shampoo_type text,
  special_treatments text,
  final_price numeric NOT NULL DEFAULT 0,
  duration_minutes integer,
  notes text,
  before_photos text[],
  after_photos text[],
  next_appointment_recommended text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_org_date ON grooming_journal(org_id, appointment_date);

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

-- ⚠️ TRIGGER-STATUS OCH SETUP-FILER:
--
-- 🟢 PRODUCTION (Vercel/Supabase):
--    • fix_registration_triggers.sql         → Kör denna för att aktivera auto-registrering
--    • enable_triggers_for_production.sql    → Kör denna för org_id auto-setting (valfritt)
--    • Triggers MÅSTE vara aktiva för nya användare ska få org/profil automatiskt
--
-- 🔴 DEVELOPMENT (localhost):
--    • complete_testdata.sql                 → DISABLAR alla triggers för enklare debugging
--    • Koden sätter org_id MANUELLT i EditDogModal/AuthContext
--    • Fungerar perfekt utan triggers!
--
-- 💡 DUBBEL SÄKERHET:
--    Koden fungerar BÅDE med och utan triggers:
--    - MED triggers: Om NEW.org_id redan är satt, ändras inget (IF NEW.org_id IS NULL)
--    - UTAN triggers: Sätts direkt i TypeScript-koden (se EditDogModal.tsx)
--
-- 🔍 VERIFIERA TRIGGER-STATUS:
--    SELECT trigger_name, event_object_table 
--    FROM information_schema.triggers 
--    WHERE trigger_schema = 'public' 
--    ORDER BY event_object_table;

-- === AUTOMATISK UPDATED_AT ===
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ORGANISATIONSHANTERING ===

-- Funktion för att sätta org_id automatiskt från användarens profil
-- Aktiveras med: enable_triggers_for_production.sql
-- Används i produktion för automatisk org_id-tilldelning
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Hantera nya användare vid registrering
-- ⚠️ VIKTIG TRIGGER - Aktiveras med: fix_registration_triggers.sql
-- Skapar automatiskt: organisation + profil + 3 månaders gratis prenumeration
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

-- ⚠️ VIKTIGT: I PRODUCTION (Vercel) är dessa triggers AKTIVA
-- I DEVELOPMENT (localhost) är de DISABLED av complete_testdata.sql
--
-- TRIGGERS SOM ÄR AKTIVA I PRODUCTION:
-- - trg_set_org_id_owners (BEFORE INSERT ON owners)
-- - trg_set_org_id_dogs (BEFORE INSERT ON dogs)  
-- - trg_set_org_id_rooms (BEFORE INSERT ON rooms)
-- - trg_set_org_user_dog_journal (BEFORE INSERT ON dog_journal)
-- - trg_update_*_updated_at (BEFORE UPDATE för auto-timestamp)
--
-- Koden i EditDogModal.tsx sätter org_id manuellt, vilket fungerar perfekt
-- både med och utan triggers (triggers kollar IF NEW.org_id IS NULL först)

-- Org ID triggers - sätt org_id från användarens profil
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
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;

-- =======================================
-- COMPREHENSIVE RLS POLICIES
-- =======================================

-- För utveckling: Tillåt allt för autentiserade användare
-- I produktion: Begränsa till org_id

-- Orgs policies
CREATE POLICY "Allow all for authenticated users" ON orgs
  FOR ALL USING (auth.role() = 'authenticated');

-- Profiles policies (KRITISKA för AuthContext!)
-- Dessa är PRODUKTIONSKLARA och ska ALLTID vara aktiva
DROP POLICY IF EXISTS "Allow all for authenticated users" ON profiles;
DROP POLICY IF EXISTS profiles_self_access ON profiles;
DROP POLICY IF EXISTS profiles_self_insert ON profiles;
DROP POLICY IF EXISTS profiles_self_update ON profiles;

CREATE POLICY profiles_self_access ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_self_insert ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- Org subscriptions policies (organisationens plan)
CREATE POLICY "Allow all for authenticated users" ON org_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Grooming bookings policies
CREATE POLICY "Allow all for authenticated users" ON grooming_bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Grooming journal policies
CREATE POLICY "Allow all for authenticated users" ON grooming_journal
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
COMMENT ON SCHEMA public IS 'DogPlanner Schema v2.1 - Uppdaterad 2024-12-19 - ROOMS TABELL SKAPAD OCH FUNKTIONELL';[
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_prices",
    "table_name": "boarding_prices",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_prices BEFORE INSERT ON public.boarding_prices FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_seasons",
    "table_name": "boarding_seasons",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons BEFORE INSERT ON public.boarding_seasons FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "trg_create_invoice_on_checkout",
    "table_name": "bookings",
    "function_name": "create_invoice_on_checkout",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_invoice_on_checkout()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_invoice_id uuid;\nbegin\n  -- Skapa faktura endast när status ändras till 'checked_out'\n  if new.status = 'checked_out' then\n    insert into public.invoices (org_id, owner_id, invoice_date, total_amount, billed_name, billed_email, billed_address)\n    values (\n      new.org_id,\n      (select owner_id from public.dogs where id = new.dog_id),\n      now()::date,\n      coalesce(new.base_price, 0),\n      (select full_name from public.owners where id = (select owner_id from public.dogs where id = new.dog_id)),\n      (select email from public.owners where id = (select owner_id from public.dogs where id = new.dog_id)),\n      (select city from public.owners where id = (select owner_id from public.dogs where id = new.dog_id))\n    )\n    returning id into v_invoice_id;\n\n    -- Lägg till huvudrad (bokningsrad)\n    insert into public.invoice_items (invoice_id, booking_id, description, qty, unit_price)\n    values (\n      v_invoice_id,\n      new.id,\n      concat('Pensionatvistelse ', new.start_date, '–', new.end_date),\n      1,\n      coalesce(new.base_price, 0)\n    );\n\n    -- Lägg till tilläggstjänster (om de finns)\n    if new.addons is not null then\n      insert into public.invoice_items (invoice_id, booking_id, description, qty, unit_price)\n      select\n        v_invoice_id,\n        new.id,\n        jsonb_extract_path_text(a.value, 'name'),\n        coalesce((jsonb_extract_path_text(a.value, 'qty'))::numeric, 1),\n        coalesce((jsonb_extract_path_text(a.value, 'price'))::numeric, 0)\n      from jsonb_array_elements(new.addons) as a;\n    end if;\n  end if;\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_invoice_on_checkout AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'checked_out'::text) AND (old.status IS DISTINCT FROM 'checked_out'::text))) EXECUTE FUNCTION create_invoice_on_checkout()"
  },
  {
    "trigger_name": "trg_set_org_id_on_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
  },
  {
    "trigger_name": "trg_touch_bookings",
    "table_name": "bookings",
    "function_name": "touch_bookings_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.touch_bookings_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.updated_at := now();\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_touch_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION touch_bookings_updated_at()"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "table_name": "buckets",
    "function_name": "enforce_bucket_name_length",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n    if length(new.name) > 100 then\n        raise exception 'bucket name \"%\" is too long (% characters). Max is 100.', new.name, length(new.name);\n    end if;\n    return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()"
  },
  {
    "trigger_name": "trg_set_org_id_for_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "on_insert_set_user_id",
    "table_name": "dogs",
    "function_name": "set_user_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_user_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  new.user_id := auth.uid();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_user_id BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_user_id()"
  },
  {
    "trigger_name": "set_last_updated",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_last_updated BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from profiles where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "dogs",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_auto_match_owner",
    "table_name": "dogs",
    "function_name": "auto_match_owner_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_match_owner_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  perform public.match_owners_to_dogs();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_auto_match_owner AFTER INSERT ON public.dogs FOR EACH ROW WHEN ((new.owner_id IS NULL)) EXECUTE FUNCTION auto_match_owner_trigger()"
  },
  {
    "trigger_name": "trg_create_journal_on_new_dog",
    "table_name": "dogs",
    "function_name": "create_dog_journal_on_new_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_dog_journal_on_new_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    INSERT INTO public.dog_journal (dog_id, text, org_id)\n    VALUES (\n        NEW.id,\n        'Ny hund registrerad i systemet.',\n        NEW.org_id\n    );\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog()"
  },
  {
    "trigger_name": "trg_set_org_id_on_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "trg_set_org_user_dogs",
    "table_name": "dogs",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "trg_update_dogs_updated_at",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "extra_service",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_extra_service",
    "table_name": "extra_service",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_grooming",
    "table_name": "grooming_logs",
    "function_name": "set_org_id_for_grooming",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_grooming()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Hämtar organisationens ID från hunden automatiskt\n  if new.org_id is null then\n    select org_id into new.org_id\n    from dogs\n    where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_grooming BEFORE INSERT ON public.grooming_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_grooming()"
  },
  {
    "trigger_name": "cron_job_cache_invalidate",
    "table_name": "job",
    "function_name": "job_cache_invalidate",
    "function_definition": "CREATE OR REPLACE FUNCTION cron.job_cache_invalidate()\n RETURNS trigger\n LANGUAGE c\nAS '$libdir/pg_cron', $function$cron_job_cache_invalidate$function$\n",
    "trigger_definition": "CREATE TRIGGER cron_job_cache_invalidate AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION cron.job_cache_invalidate()"
  },
  {
    "trigger_name": "objects_delete_delete_prefix",
    "table_name": "objects",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "objects_insert_create_prefix",
    "table_name": "objects",
    "function_name": "objects_insert_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    NEW.level := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger()"
  },
  {
    "trigger_name": "objects_update_create_prefix",
    "table_name": "objects",
    "function_name": "objects_update_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    old_prefixes TEXT[];\nBEGIN\n    -- Ensure this is an update operation and the name has changed\n    IF TG_OP = 'UPDATE' AND (NEW.\"name\" <> OLD.\"name\" OR NEW.\"bucket_id\" <> OLD.\"bucket_id\") THEN\n        -- Retrieve old prefixes\n        old_prefixes := \"storage\".\"get_prefixes\"(OLD.\"name\");\n\n        -- Remove old prefixes that are only used by this object\n        WITH all_prefixes as (\n            SELECT unnest(old_prefixes) as prefix\n        ),\n        can_delete_prefixes as (\n             SELECT prefix\n             FROM all_prefixes\n             WHERE NOT EXISTS (\n                 SELECT 1 FROM \"storage\".\"objects\"\n                 WHERE \"bucket_id\" = OLD.\"bucket_id\"\n                   AND \"name\" <> OLD.\"name\"\n                   AND \"name\" LIKE (prefix || '%')\n             )\n         )\n        DELETE FROM \"storage\".\"prefixes\" WHERE name IN (SELECT prefix FROM can_delete_prefixes);\n\n        -- Add new prefixes\n        PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    END IF;\n    -- Set the new level\n    NEW.\"level\" := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger()"
  },
  {
    "trigger_name": "update_objects_updated_at",
    "table_name": "objects",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = now();\n    RETURN NEW; \nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()"
  },
  {
    "trigger_name": "on_insert_set_trial_end_for_org",
    "table_name": "orgs",
    "function_name": "set_trial_end_for_org",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_trial_end_for_org()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Sätt gratisperiod till 3 månader från registrering\n  NEW.trial_ends_at := (now() + interval '3 months');\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_trial_end_for_org BEFORE INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION set_trial_end_for_org()"
  },
  {
    "trigger_name": "on_org_locked_email",
    "table_name": "orgs",
    "function_name": "notify_admin_on_lock",
    "function_definition": "CREATE OR REPLACE FUNCTION public.notify_admin_on_lock()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  org_name text;\nbegin\n  select name into org_name from public.orgs where id = new.id;\n\n  perform\n    net.http_post(\n      url := 'https://api.resend.com/emails',\n      headers := jsonb_build_object(\n        'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),\n        'Content-Type', 'application/json'\n      ),\n      body := jsonb_build_object(\n        'from', 'DogPlanner <support@dogplanner.se>',\n        'to', 'support@dogplanner.se',\n        'subject', 'Konto låst: ' || org_name,\n        'html', '<p>Organisationen <b>' || org_name || '</b> har passerat sin testperiod och låsts.</p>'\n      )\n    );\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_org_locked_email AFTER UPDATE ON public.orgs FOR EACH ROW WHEN (((new.status = 'locked'::text) AND (old.status IS DISTINCT FROM 'locked'::text))) EXECUTE FUNCTION notify_admin_on_lock()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_owners",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "owners_set_org_id",
    "table_name": "owners",
    "function_name": "set_owner_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_owner_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := (select org_id from profiles where id = auth.uid());\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER owners_set_org_id BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_owner_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_owners",
    "table_name": "owners",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "set_timestamp_pension_stays",
    "table_name": "pension_stays",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_timestamp_pension_stays BEFORE UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "trg_calc_total_amount",
    "table_name": "pension_stays",
    "function_name": "calc_total_amount",
    "function_definition": "CREATE OR REPLACE FUNCTION public.calc_total_amount()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  addon_sum numeric(10,2) := 0;\nbegin\n  if NEW.addons is not null then\n    select sum((x->>'price')::numeric)\n    into addon_sum\n    from jsonb_array_elements(NEW.addons) as x;\n  end if;\n\n  NEW.total_amount := coalesce(NEW.base_price,0) + coalesce(addon_sum,0);\n  return NEW;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_calc_total_amount BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION calc_total_amount()"
  },
  {
    "trigger_name": "trg_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_pension_stays",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_pension_stays()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from dogs where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_pension_stays()"
  },
  {
    "trigger_name": "trg_set_org_id_on_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_pension_stays BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
  },
  {
    "trigger_name": "prefixes_create_hierarchy",
    "table_name": "prefixes",
    "function_name": "prefixes_insert_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger()"
  },
  {
    "trigger_name": "prefixes_delete_hierarchy",
    "table_name": "prefixes",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "on_profile_insert",
    "table_name": "profiles",
    "function_name": "set_default_role",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_default_role()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.role is null then\n    new.role := 'staff';\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_profile_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_default_role()"
  },
  {
    "trigger_name": "trg_delete_org_if_no_admins",
    "table_name": "profiles",
    "function_name": "delete_org_if_no_admins",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_org_if_no_admins()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\nbegin\n  v_org_id := old.org_id;\n\n  -- Räkna kvarvarande admins i organisationen\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → radera hela företaget\n  if v_admin_count = 0 then\n    raise notice '⚠️ Varning: Ingen admin kvar i organisationen %, företaget kommer att tas bort!', v_org_id;\n\n    -- Radera i rätt ordning (för att undvika FK-fel)\n    delete from public.bookings where org_id = v_org_id;\n    delete from public.owners where org_id = v_org_id;\n    delete from public.dogs where org_id = v_org_id;\n    delete from public.invoices where org_id = v_org_id;\n    delete from public.orgs where id = v_org_id;\n\n    raise notice '✅ Organisation % och all tillhörande data har raderats enligt GDPR.', v_org_id;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_delete_org_if_no_admins AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_org_if_no_admins()"
  },
  {
    "trigger_name": "trg_ensure_org_has_admin",
    "table_name": "profiles",
    "function_name": "ensure_org_has_admin",
    "function_definition": "CREATE OR REPLACE FUNCTION public.ensure_org_has_admin()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\n  v_new_admin uuid;\nbegin\n  -- Identifiera organisationen baserat på den gamla raden\n  v_org_id := old.org_id;\n\n  -- Räkna antalet kvarvarande admins\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → uppgradera en slumpmässig staff till admin\n  if v_admin_count = 0 then\n    select id into v_new_admin\n    from public.profiles\n    where org_id = v_org_id\n    order by created_at asc\n    limit 1;\n\n    if v_new_admin is not null then\n      update public.profiles\n      set role = 'admin'\n      where id = v_new_admin;\n\n      raise notice 'Ingen admin kvar i org %, uppgraderade användare % till admin', v_org_id, v_new_admin;\n    else\n      raise notice 'Ingen kvar att uppgradera i org %, organisationen står utan användare', v_org_id;\n    end if;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_ensure_org_has_admin AFTER DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_org_has_admin()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_rooms",
    "table_name": "rooms",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_services",
    "table_name": "services",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "tr_check_filters",
    "table_name": "subscription",
    "function_name": "subscription_check_filters",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n    /*\n    Validates that the user defined filters for a subscription:\n    - refer to valid columns that the claimed role may access\n    - values are coercable to the correct column type\n    */\n    declare\n        col_names text[] = coalesce(\n                array_agg(c.column_name order by c.ordinal_position),\n                '{}'::text[]\n            )\n            from\n                information_schema.columns c\n            where\n                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity\n                and pg_catalog.has_column_privilege(\n                    (new.claims ->> 'role'),\n                    format('%I.%I', c.table_schema, c.table_name)::regclass,\n                    c.column_name,\n                    'SELECT'\n                );\n        filter realtime.user_defined_filter;\n        col_type regtype;\n\n        in_val jsonb;\n    begin\n        for filter in select * from unnest(new.filters) loop\n            -- Filtered column is valid\n            if not filter.column_name = any(col_names) then\n                raise exception 'invalid column for filter %', filter.column_name;\n            end if;\n\n            -- Type is sanitized and safe for string interpolation\n            col_type = (\n                select atttypid::regtype\n                from pg_catalog.pg_attribute\n                where attrelid = new.entity\n                      and attname = filter.column_name\n            );\n            if col_type is null then\n                raise exception 'failed to lookup type for column %', filter.column_name;\n            end if;\n\n            -- Set maximum number of entries for in filter\n            if filter.op = 'in'::realtime.equality_op then\n                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);\n                if coalesce(jsonb_array_length(in_val), 0) > 100 then\n                    raise exception 'too many values for `in` filter. Maximum 100';\n                end if;\n            else\n                -- raises an exception if value is not coercable to type\n                perform realtime.cast(filter.value, col_type);\n            end if;\n\n        end loop;\n\n        -- Apply consistent order to filters so the unique constraint on\n        -- (subscription_id, entity, filters) can't be tricked by a different filter order\n        new.filters = coalesce(\n            array_agg(f order by f.column_name, f.op, f.value),\n            '{}'\n        ) from unnest(new.filters) f;\n\n        return new;\n    end;\n    $function$\n",
    "trigger_definition": "CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_subscriptions",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_subscription",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_subscription()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta organisationen kopplad till den användare som skapar abonnemanget\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_subscriptions BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_subscription()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "on_auth_user_created",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Skapa ny organisation om användaren inte redan är kopplad till en\n  insert into public.orgs (name)\n  values (split_part(new.email, '@', 1) || 's Hunddagis')\n  returning id into v_org_id;\n\n  -- Koppla användaren som admin till sin nya org\n  insert into public.profiles (id, email, org_id, role)\n  values (new.id, new.email, v_org_id, 'admin');\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  },
  {
    "trigger_name": "trg_assign_org_to_new_user",
    "table_name": "users",
    "function_name": "assign_org_to_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.assign_org_to_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Försök hitta en org baserat på e-postdomän (ex: @hunddagis.se)\n  select id into v_org_id\n  from public.orgs\n  where lower(name) = lower(split_part(new.email, '@', 1) || 's Hunddagis')\n  or lower(name) like '%' || split_part(new.email, '@', 2);\n\n  -- Om organisation hittas → koppla användaren till den\n  if v_org_id is not null then\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'staff');\n  else\n    -- Annars skapa ny organisation (första användare blir admin)\n    insert into public.orgs (name)\n    values (split_part(new.email, '@', 1) || 's Hunddagis')\n    returning id into v_org_id;\n\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'admin');\n  end if;\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_assign_org_to_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION assign_org_to_new_user()"
  },
  {
    "trigger_name": "trg_handle_new_user",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Skapa ny organisation om användaren inte redan är kopplad till en\n  insert into public.orgs (name)\n  values (split_part(new.email, '@', 1) || 's Hunddagis')\n  returning id into v_org_id;\n\n  -- Koppla användaren som admin till sin nya org\n  insert into public.profiles (id, email, org_id, role)\n  values (new.id, new.email, v_org_id, 'admin');\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_handle_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  }
]