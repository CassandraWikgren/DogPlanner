-- ========================================
-- DOGPLANNER - KOMPLETT SQL FÖR HUNDDAGIS & EMAIL
-- Kör denna fil i Supabase SQL Editor
-- Datum: 2025-10-30
-- ========================================

-- ========================================
-- DEL 1: EMAIL-KONFIGURATION
-- ========================================

-- Lägg till email-fält i orgs-tabellen
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS invoice_email text,
  ADD COLUMN IF NOT EXISTS reply_to_email text,
  ADD COLUMN IF NOT EXISTS email_sender_name text;

-- Skapa system_config tabell för DogPlanner-nivå inställningar
CREATE TABLE IF NOT EXISTS system_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lägg in system-email konfiguration
INSERT INTO system_config (config_key, config_value, description)
VALUES 
  ('system_email', 'info@dogplanner.se', 'System-email för plattforms-meddelanden'),
  ('system_email_name', 'DogPlanner', 'Avsändarnamn för system-email'),
  ('support_email', 'support@dogplanner.se', 'Support-email för teknisk hjälp'),
  ('noreply_email', 'noreply@dogplanner.se', 'No-reply email för automatiska meddelanden')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value,
    updated_at = now();

-- Uppdatera befintliga organisationers email
UPDATE orgs 
SET 
  contact_email = COALESCE(contact_email, email),
  invoice_email = COALESCE(invoice_email, email),
  reply_to_email = COALESCE(reply_to_email, email),
  email_sender_name = COALESCE(email_sender_name, name)
WHERE email IS NOT NULL;

-- Kommentarer för dokumentation
COMMENT ON COLUMN orgs.email IS 'Primär email för organisationen (generell kontakt)';
COMMENT ON COLUMN orgs.contact_email IS 'Kontakt-email som visas för kunder';
COMMENT ON COLUMN orgs.invoice_email IS 'Email som används som avsändare på fakturor';
COMMENT ON COLUMN orgs.reply_to_email IS 'Reply-to email för kundkommunikation';
COMMENT ON COLUMN orgs.email_sender_name IS 'Avsändarnamn i emails till kunder (t.ex. "Bella Hunddagis")';
COMMENT ON TABLE system_config IS 'System-nivå konfiguration för DogPlanner-plattformen';

-- ========================================
-- DEL 2: HUNDDAGIS SCHEMA-UPPDATERINGAR
-- ========================================

-- Lägg till personnummer i owners (admin-låst)
ALTER TABLE owners 
  ADD COLUMN IF NOT EXISTS personnummer text;

-- Lägg till försäkring i dogs
ALTER TABLE dogs 
  ADD COLUMN IF NOT EXISTS insurance_company text,
  ADD COLUMN IF NOT EXISTS insurance_number text;

-- Skapa subscription_types tabell
CREATE TABLE IF NOT EXISTS subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('heltid', 'deltid_3', 'deltid_2', 'drop_in')),
  height_min integer,
  height_max integer,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, subscription_type, height_min, height_max)
);

-- Skapa daycare_service_completions tabell
CREATE TABLE IF NOT EXISTS daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad')),
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kommentarer
COMMENT ON TABLE subscription_types IS 'Prissättning per abonnemangstyp och mankh öjd';
COMMENT ON TABLE daycare_service_completions IS 'Tjänster som kloklipp, tassklipp, bad';

-- ========================================
-- DEL 3: INTEREST_APPLICATIONS TABELL
-- ========================================

-- Skapa interest_applications tabell
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

COMMENT ON TABLE interest_applications IS 'Ansökningar från hundägare som vill ha dagisplats';
COMMENT ON COLUMN interest_applications.status IS 'pending = ny ansökan, contacted = kontaktad, accepted = godkänd (redo att överföra), declined = avböjd';

-- ========================================
-- DEL 4: TESTDATA
-- ========================================

-- Lägg till testdata för intresseanmälningar
INSERT INTO interest_applications (
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
  is_escape_artist,
  destroys_things,
  not_house_trained,
  gdpr_consent,
  status,
  notes
) 
SELECT 
  o.id as org_id,
  'Maria Svensson' as parent_name,
  'maria.svensson@example.com' as parent_email,
  '0701234567' as parent_phone,
  'Stockholm' as owner_city,
  'Storgatan 12' as owner_address,
  'Bella' as dog_name,
  'Golden Retriever' as dog_breed,
  '2023-03-15'::date as dog_birth,
  'tik' as dog_gender,
  55 as dog_height_cm,
  'heltid' as subscription_type,
  '2025-11-15'::date as preferred_start_date,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as preferred_days,
  'Bella är jättesnäll men blir lite nervös i stora grupper.' as special_care_needs,
  true as is_neutered,
  false as is_escape_artist,
  false as destroys_things,
  false as not_house_trained,
  true as gdpr_consent,
  'pending' as status,
  'Ny ansökan inkom via webbformulär' as notes
FROM orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM interest_applications 
  WHERE parent_email = 'maria.svensson@example.com'
)
LIMIT 1;

INSERT INTO interest_applications (
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
  is_escape_artist,
  destroys_things,
  not_house_trained,
  gdpr_consent,
  status,
  notes
) 
SELECT 
  o.id as org_id,
  'Erik Andersson' as parent_name,
  'erik.andersson@example.com' as parent_email,
  '0709876543' as parent_phone,
  'Göteborg' as owner_city,
  'Hamngatan 5' as owner_address,
  'Max' as dog_name,
  'Border Collie' as dog_breed,
  '2022-08-20'::date as dog_birth,
  'hane' as dog_gender,
  48 as dog_height_cm,
  'deltid_3' as subscription_type,
  '2025-12-01'::date as preferred_start_date,
  ARRAY['monday', 'wednesday', 'friday'] as preferred_days,
  'Max har mycket energi och behöver stimulans.' as special_care_needs,
  false as is_neutered,
  false as is_escape_artist,
  false as destroys_things,
  false as not_house_trained,
  true as gdpr_consent,
  'contacted' as status,
  'Ringde och pratade med Erik 2025-10-28. Vill börja i december.' as notes
FROM orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM interest_applications 
  WHERE parent_email = 'erik.andersson@example.com'
)
LIMIT 1;

INSERT INTO interest_applications (
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
  is_escape_artist,
  destroys_things,
  not_house_trained,
  gdpr_consent,
  status,
  notes
) 
SELECT 
  o.id as org_id,
  'Lisa Johansson' as parent_name,
  'lisa.johansson@example.com' as parent_email,
  '0703456789' as parent_phone,
  'Malmö' as owner_city,
  'Södergatan 20' as owner_address,
  'Charlie' as dog_name,
  'Labrador' as dog_breed,
  '2023-06-10'::date as dog_birth,
  'hane' as dog_gender,
  58 as dog_height_cm,
  'heltid' as subscription_type,
  '2025-11-10'::date as preferred_start_date,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as preferred_days,
  'Charlie är en lugn och snäll hund som älskar vatten.' as special_care_needs,
  true as is_neutered,
  false as is_escape_artist,
  false as destroys_things,
  false as not_house_trained,
  true as gdpr_consent,
  'accepted' as status,
  'Ansökan godkänd! Lisa har bekräftat startdatum och betalat insättning.' as notes
FROM orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM interest_applications 
  WHERE parent_email = 'lisa.johansson@example.com'
)
LIMIT 1;

INSERT INTO interest_applications (
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
  is_escape_artist,
  destroys_things,
  not_house_trained,
  gdpr_consent,
  status,
  notes
) 
SELECT 
  o.id as org_id,
  'Anders Karlsson' as parent_name,
  'anders.karlsson@example.com' as parent_email,
  '0705678901' as parent_phone,
  'Uppsala' as owner_city,
  'Kungsgatan 8' as owner_address,
  'Rocky' as dog_name,
  'Rottweiler' as dog_breed,
  '2021-02-14'::date as dog_birth,
  'hane' as dog_gender,
  65 as dog_height_cm,
  'heltid' as subscription_type,
  '2025-11-01'::date as preferred_start_date,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as preferred_days,
  'Rocky har haft beteendeproblem tidigare men jobbar med det.' as special_care_needs,
  false as is_neutered,
  true as is_escape_artist,
  true as destroys_things,
  true as not_house_trained,
  true as gdpr_consent,
  'declined' as status,
  'Tyvärr passade inte Rocky för vår dagisgrupp just nu. Rekommenderade enskilda promenader istället.' as notes
FROM orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM interest_applications 
  WHERE parent_email = 'anders.karlsson@example.com'
)
LIMIT 1;

-- ========================================
-- SLUTKONTROLL
-- ========================================

-- Kontrollera att allt skapades korrekt
SELECT 'Email-fält i orgs' as check_name, 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'contact_email'
  ) THEN '✅ OK' ELSE '❌ SAKNAS' END as status
UNION ALL
SELECT 'system_config tabell', 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_config'
  ) THEN '✅ OK' ELSE '❌ SAKNAS' END
UNION ALL
SELECT 'subscription_types tabell', 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscription_types'
  ) THEN '✅ OK' ELSE '❌ SAKNAS' END
UNION ALL
SELECT 'daycare_service_completions tabell', 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'daycare_service_completions'
  ) THEN '✅ OK' ELSE '❌ SAKNAS' END
UNION ALL
SELECT 'interest_applications tabell', 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'interest_applications'
  ) THEN '✅ OK' ELSE '❌ SAKNAS' END
UNION ALL
SELECT 'Testdata i interest_applications', 
  CASE WHEN (SELECT COUNT(*) FROM interest_applications) >= 4 
  THEN '✅ OK (' || (SELECT COUNT(*) FROM interest_applications) || ' rader)' 
  ELSE '⚠️ Endast ' || (SELECT COUNT(*) FROM interest_applications) || ' rader' END;

-- Visa skapad testdata
SELECT 
  parent_name,
  dog_name,
  status,
  created_at
FROM interest_applications
ORDER BY created_at DESC
LIMIT 10;
