-- ========================================
-- DOGPLANNER - KOMPLETT TESTDATA SETUP
-- Uppdaterad 2025-10-30
-- ========================================

-- === STEG 1: TA BORT TRIGGERS OCH INAKTIVERA RLS ===

-- Ta bort ALLA triggers som kan orsaka problem
DROP TRIGGER IF EXISTS set_org_user_dogs ON public.dogs;
DROP TRIGGER IF EXISTS set_org_user_owners ON public.owners;
DROP TRIGGER IF EXISTS set_org_user_rooms ON public.rooms;
DROP TRIGGER IF EXISTS set_org_user_dog_journal ON public.dog_journal;
DROP TRIGGER IF EXISTS set_org_user_trigger ON public.orgs;

-- Ta bort anonymisering triggers
DROP TRIGGER IF EXISTS trg_auto_anonymize_owner ON public.owners;
DROP TRIGGER IF EXISTS trigger_anonymize_owner ON public.owners;
DROP TRIGGER IF EXISTS anonymize_owner_trigger ON public.owners;

-- Ta bort timestamp triggers
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.dogs;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.owners;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.orgs;

-- Ta bort funktionerna
DROP FUNCTION IF EXISTS set_org_user();
DROP FUNCTION IF EXISTS trigger_anonymize_owner();
DROP FUNCTION IF EXISTS anonymize_owner(uuid);

-- Inaktivera RLS på alla tabeller
ALTER TABLE IF EXISTS public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interest_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_service_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_config DISABLE ROW LEVEL SECURITY;

-- === STEG 2: LÄGG TILL SAKNADE KOLUMNER ===

-- Owners: personnummer (om den inte finns)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='owners' AND column_name='personnummer') THEN
    ALTER TABLE public.owners ADD COLUMN personnummer text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='owners' AND column_name='city') THEN
    ALTER TABLE public.owners ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='owners' AND column_name='address') THEN
    ALTER TABLE public.owners ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='owners' AND column_name='gdpr_consent') THEN
    ALTER TABLE public.owners ADD COLUMN gdpr_consent boolean DEFAULT false;
  END IF;
END $$;

-- Dogs: försäkring och andra fält
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='insurance_company') THEN
    ALTER TABLE public.dogs ADD COLUMN insurance_company text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='insurance_number') THEN
    ALTER TABLE public.dogs ADD COLUMN insurance_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='heightcm') THEN
    ALTER TABLE public.dogs ADD COLUMN heightcm integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='startdate') THEN
    ALTER TABLE public.dogs ADD COLUMN startdate date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='days') THEN
    ALTER TABLE public.dogs ADD COLUMN days text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='is_castrated') THEN
    ALTER TABLE public.dogs ADD COLUMN is_castrated boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='is_escape_artist') THEN
    ALTER TABLE public.dogs ADD COLUMN is_escape_artist boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='destroys_things') THEN
    ALTER TABLE public.dogs ADD COLUMN destroys_things boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='is_house_trained') THEN
    ALTER TABLE public.dogs ADD COLUMN is_house_trained boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='dogs' AND column_name='special_needs') THEN
    ALTER TABLE public.dogs ADD COLUMN special_needs text;
  END IF;
END $$;

-- Orgs: email-konfiguration och grundläggande fält
DO $$ 
BEGIN
  -- Först, lägg till grundläggande email-kolumn om den saknas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='email') THEN
    ALTER TABLE public.orgs ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='phone') THEN
    ALTER TABLE public.orgs ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='address') THEN
    ALTER TABLE public.orgs ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='vat_included') THEN
    ALTER TABLE public.orgs ADD COLUMN vat_included boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='vat_rate') THEN
    ALTER TABLE public.orgs ADD COLUMN vat_rate numeric DEFAULT 25;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='pricing_currency') THEN
    ALTER TABLE public.orgs ADD COLUMN pricing_currency text DEFAULT 'SEK';
  END IF;
  
  -- Email-konfiguration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='contact_email') THEN
    ALTER TABLE public.orgs ADD COLUMN contact_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='invoice_email') THEN
    ALTER TABLE public.orgs ADD COLUMN invoice_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='reply_to_email') THEN
    ALTER TABLE public.orgs ADD COLUMN reply_to_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='email_sender_name') THEN
    ALTER TABLE public.orgs ADD COLUMN email_sender_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orgs' AND column_name='slug') THEN
    ALTER TABLE public.orgs ADD COLUMN slug text UNIQUE;
  END IF;
END $$;

-- === STEG 3: SKAPA NYA TABELLER ===

-- System config för DogPlanner-nivå inställningar
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription types för prissättning
CREATE TABLE IF NOT EXISTS public.subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('heltid', 'deltid_3', 'deltid_2', 'timdagis')),
  height_min integer NOT NULL DEFAULT 0,
  height_max integer NOT NULL DEFAULT 999,
  price numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, subscription_type, height_min, height_max)
);

-- Daycare service completions
CREATE TABLE IF NOT EXISTS public.daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad')),
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interest applications (ansökningar från kundportal)
CREATE TABLE IF NOT EXISTS public.interest_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
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

-- Lägg till saknade kolumner i interest_applications om de inte finns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='parent_name') THEN
    ALTER TABLE public.interest_applications ADD COLUMN parent_name text NOT NULL DEFAULT 'Unknown';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='parent_email') THEN
    ALTER TABLE public.interest_applications ADD COLUMN parent_email text NOT NULL DEFAULT 'unknown@example.com';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='parent_phone') THEN
    ALTER TABLE public.interest_applications ADD COLUMN parent_phone text NOT NULL DEFAULT '000-0000000';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='owner_city') THEN
    ALTER TABLE public.interest_applications ADD COLUMN owner_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='owner_address') THEN
    ALTER TABLE public.interest_applications ADD COLUMN owner_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='dog_name') THEN
    ALTER TABLE public.interest_applications ADD COLUMN dog_name text NOT NULL DEFAULT 'Unknown';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='dog_breed') THEN
    ALTER TABLE public.interest_applications ADD COLUMN dog_breed text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='dog_birth') THEN
    ALTER TABLE public.interest_applications ADD COLUMN dog_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='dog_gender') THEN
    ALTER TABLE public.interest_applications ADD COLUMN dog_gender text CHECK (dog_gender IN ('hane', 'tik'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='dog_height_cm') THEN
    ALTER TABLE public.interest_applications ADD COLUMN dog_height_cm integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='subscription_type') THEN
    ALTER TABLE public.interest_applications ADD COLUMN subscription_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='preferred_start_date') THEN
    ALTER TABLE public.interest_applications ADD COLUMN preferred_start_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='preferred_days') THEN
    ALTER TABLE public.interest_applications ADD COLUMN preferred_days text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='special_care_needs') THEN
    ALTER TABLE public.interest_applications ADD COLUMN special_care_needs text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='is_neutered') THEN
    ALTER TABLE public.interest_applications ADD COLUMN is_neutered boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='is_escape_artist') THEN
    ALTER TABLE public.interest_applications ADD COLUMN is_escape_artist boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='destroys_things') THEN
    ALTER TABLE public.interest_applications ADD COLUMN destroys_things boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='not_house_trained') THEN
    ALTER TABLE public.interest_applications ADD COLUMN not_house_trained boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='gdpr_consent') THEN
    ALTER TABLE public.interest_applications ADD COLUMN gdpr_consent boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='status') THEN
    ALTER TABLE public.interest_applications ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='interest_applications' AND column_name='notes') THEN
    ALTER TABLE public.interest_applications ADD COLUMN notes text;
  END IF;
END $$;

-- === STEG 4: RENSA BEFINTLIG TESTDATA ===

TRUNCATE public.daycare_service_completions CASCADE;
TRUNCATE public.interest_applications CASCADE;
TRUNCATE public.subscription_types CASCADE;
TRUNCATE public.dogs CASCADE;
TRUNCATE public.owners CASCADE; 
TRUNCATE public.orgs CASCADE;
TRUNCATE public.system_config CASCADE;

-- === STEG 5: LÄGG TILL SYSTEM-KONFIGURATION ===

INSERT INTO public.system_config (config_key, config_value, description)
VALUES 
  ('system_email', 'info@dogplanner.se', 'System-email för plattforms-meddelanden'),
  ('system_email_name', 'DogPlanner', 'Avsändarnamn för system-email'),
  ('support_email', 'support@dogplanner.se', 'Support-email för teknisk hjälp'),
  ('noreply_email', 'noreply@dogplanner.se', 'No-reply email för automatiska meddelanden');

-- === STEG 6: LÄGG TILL TEST-ORGANISATION ===

INSERT INTO public.orgs (
  name, 
  org_number, 
  email, 
  phone, 
  address,
  contact_email,
  invoice_email,
  reply_to_email,
  email_sender_name,
  slug,
  vat_included,
  vat_rate,
  pricing_currency
) VALUES (
  'Bella Hunddagis', 
  '556789-1234',
  'info@belladagis.se',
  '08-123 456 78',
  'Hundgatan 123, 123 45 Stockholm',
  'kontakt@belladagis.se',
  'faktura@belladagis.se',
  'info@belladagis.se',
  'Bella Hunddagis',
  'demo',
  true,
  25,
  'SEK'
);

-- === STEG 7: LÄGG TILL PRISSÄTTNING ===

INSERT INTO public.subscription_types (org_id, subscription_type, height_min, height_max, price)
SELECT id, 'heltid', 0, 35, 4500 FROM public.orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'heltid', 36, 50, 5200 FROM public.orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'heltid', 51, 999, 5900 FROM public.orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'deltid_3', 0, 35, 3200 FROM public.orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'deltid_3', 36, 50, 3700 FROM public.orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'deltid_3', 51, 999, 4200 FROM public.orgs WHERE slug = 'demo';

-- === STEG 8: LÄGG TILL TEST-ÄGARE ===

INSERT INTO public.owners (org_id, full_name, email, phone, city, address, personnummer, gdpr_consent) 
SELECT 
  id,
  'Anna Andersson',
  'anna@example.com',
  '070-111 11 11',
  'Stockholm',
  'Testgatan 1, 123 45 Stockholm',
  '198001011234',
  true
FROM public.orgs WHERE slug = 'demo';

INSERT INTO public.owners (org_id, full_name, email, phone, city, address, gdpr_consent) 
SELECT 
  id,
  'Bengt Bengtsson',
  'bengt@example.com',
  '070-222 22 22',
  'Göteborg',
  'Provvägen 2, 456 78 Göteborg',
  true
FROM public.orgs WHERE slug = 'demo';

-- === STEG 9: LÄGG TILL TEST-HUNDAR ===

INSERT INTO public.dogs (
  org_id, 
  owner_id, 
  name, 
  breed, 
  birth,
  gender,
  heightcm,
  subscription, 
  days,
  startdate,
  insurance_company,
  insurance_number,
  is_castrated,
  is_house_trained,
  special_needs
)
SELECT 
  o.org_id,
  o.id,
  'Bella',
  'Golden Retriever',
  '2020-05-15',
  'tik',
  55,
  'heltid',
  'måndag,tisdag,onsdag,torsdag,fredag',
  '2024-01-10',
  'Agria',
  'AGR123456',
  true,
  true,
  'Allergisk mot kyckling'
FROM public.owners o
WHERE o.full_name = 'Anna Andersson';

INSERT INTO public.dogs (
  org_id, 
  owner_id, 
  name, 
  breed, 
  birth,
  gender,
  heightcm,
  subscription, 
  days,
  startdate,
  is_castrated,
  is_house_trained
)
SELECT 
  o.org_id,
  o.id,
  'Max',
  'Border Collie',
  '2019-08-20',
  'hane',
  48,
  'deltid_3',
  'måndag,onsdag,fredag',
  '2023-09-01',
  false,
  true
FROM public.owners o
WHERE o.full_name = 'Bengt Bengtsson';

-- === STEG 10: LÄGG TILL INTRESSEANMÄLNINGAR ===

INSERT INTO public.interest_applications (
  org_id,
  parent_name,
  parent_email,
  parent_phone,
  owner_city,
  owner_address,
  dog_name,
  dog_breed,
  dog_birth,
  dog_gender,
  dog_height_cm,
  subscription_type,
  preferred_start_date,
  preferred_days,
  special_care_needs,
  is_neutered,
  gdpr_consent,
  status,
  notes
) 
SELECT
  id,
  'Maria Svensson',
  'maria.svensson@example.com',
  '0701234567',
  'Stockholm',
  'Storgatan 12',
  'Luna',
  'Golden Retriever',
  '2023-03-15',
  'tik',
  55,
  'heltid',
  '2025-11-15',
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'Luna är jättesnäll men blir lite nervös i stora grupper.',
  true,
  true,
  'pending',
  'Ny ansökan inkom via webbformulär 2025-10-28'
FROM public.orgs WHERE slug = 'demo';

INSERT INTO public.interest_applications (
  org_id,
  parent_name,
  parent_email,
  parent_phone,
  owner_city,
  owner_address,
  dog_name,
  dog_breed,
  dog_birth,
  dog_gender,
  dog_height_cm,
  subscription_type,
  preferred_start_date,
  preferred_days,
  special_care_needs,
  gdpr_consent,
  status,
  notes
) 
SELECT
  id,
  'Erik Andersson',
  'erik.andersson@example.com',
  '0709876543',
  'Göteborg',
  'Hamngatan 5',
  'Rex',
  'Border Collie',
  '2022-08-20',
  'hane',
  48,
  'deltid_3',
  '2025-12-01',
  ARRAY['monday', 'wednesday', 'friday'],
  'Rex har mycket energi och behöver stimulans.',
  true,
  'contacted',
  'Ringde och pratade med Erik 2025-10-29. Vill börja i december.'
FROM public.orgs WHERE slug = 'demo';

INSERT INTO public.interest_applications (
  org_id,
  parent_name,
  parent_email,
  parent_phone,
  owner_city,
  owner_address,
  dog_name,
  dog_breed,
  dog_birth,
  dog_gender,
  dog_height_cm,
  subscription_type,
  preferred_start_date,
  preferred_days,
  special_care_needs,
  is_neutered,
  gdpr_consent,
  status,
  notes
) 
SELECT
  id,
  'Lisa Johansson',
  'lisa.johansson@example.com',
  '0703456789',
  'Malmö',
  'Södergatan 20',
  'Charlie',
  'Labrador',
  '2023-06-10',
  'hane',
  58,
  'heltid',
  '2025-11-10',
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'Charlie är en lugn och snäll hund som älskar vatten.',
  true,
  true,
  'accepted',
  'Ansökan godkänd! Lisa har bekräftat startdatum och betalat insättning. REDO ATT ÖVERFÖRA.'
FROM public.orgs WHERE slug = 'demo';

-- === STEG 11: LÄGG TILL TJÄNSTER FÖR NOVEMBER ===

INSERT INTO public.daycare_service_completions (
  org_id,
  dog_id,
  service_type,
  scheduled_date,
  completed_at,
  completed_by
)
SELECT
  d.org_id,
  d.id,
  'kloklipp',
  '2025-11-15',
  '2025-11-15 10:30:00',
  'Anna'
FROM public.dogs d
WHERE d.name = 'Bella';

INSERT INTO public.daycare_service_completions (
  org_id,
  dog_id,
  service_type,
  scheduled_date
)
SELECT
  d.org_id,
  d.id,
  'tassklipp',
  '2025-11-20'
FROM public.dogs d
WHERE d.name = 'Max';

-- === STEG 12: VERIFIERA INSTALLATION ===

SELECT 'SUCCESS!' as status, 
       (SELECT COUNT(*) FROM public.orgs) as orgs_count,
       (SELECT COUNT(*) FROM public.owners) as owners_count,
       (SELECT COUNT(*) FROM public.dogs) as dogs_count,
       (SELECT COUNT(*) FROM public.interest_applications) as applications_count,
       (SELECT COUNT(*) FROM public.subscription_types) as prices_count,
       (SELECT COUNT(*) FROM public.daycare_service_completions) as services_count,
       (SELECT COUNT(*) FROM public.system_config) as system_config_count;

-- Visa vad som skapades
SELECT '=== ORGANISATION ===' as info;
SELECT name, email, contact_email, slug FROM public.orgs;

SELECT '=== ÄGARE ===' as info;
SELECT full_name, email, city FROM public.owners;

SELECT '=== HUNDAR ===' as info;
SELECT d.name, d.breed, d.subscription, o.full_name as owner 
FROM public.dogs d 
JOIN public.owners o ON d.owner_id = o.id;

SELECT '=== INTRESSEANMÄLNINGAR ===' as info;
SELECT parent_name, dog_name, status, created_at::date 
FROM public.interest_applications 
ORDER BY created_at DESC;

SELECT '=== PRISER ===' as info;
SELECT subscription_type, height_min, height_max, price 
FROM public.subscription_types 
ORDER BY subscription_type, height_min;

-- === KOMMENTARER ===
COMMENT ON TABLE public.system_config IS 'System-nivå konfiguration för DogPlanner-plattformen';
COMMENT ON TABLE public.subscription_types IS 'Prissättning per abonnemangstyp och mankhöjd';
COMMENT ON TABLE public.daycare_service_completions IS 'Tjänster som utförs på dagishundar (kloklipp, tassklipp, bad)';
COMMENT ON TABLE public.interest_applications IS 'Ansökningar från hundägare som vill ha dagisplats';
COMMENT ON COLUMN public.interest_applications.status IS 'pending = ny ansökan, contacted = kontaktad, accepted = godkänd (redo att överföra), declined = avböjd';