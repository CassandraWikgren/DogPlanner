-- =====================================================
-- HUNDDAGIS SCHEMA UPPDATERINGAR
-- =====================================================
-- Kör detta i Supabase SQL Editor för att lägga till
-- alla hunddagis-relaterade förbättringar
-- =====================================================

-- =======================================
-- 1. OWNERS: Lägg till personnummer
-- =======================================
ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS personnummer text;

COMMENT ON COLUMN owners.personnummer IS 'Personnummer - endast admin kan se/redigera';

-- =======================================
-- 2. DOGS: Lägg till försäkringsfält
-- =======================================
ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS insurance_company text,
ADD COLUMN IF NOT EXISTS insurance_number text;

COMMENT ON COLUMN dogs.insurance_company IS 'Försäkringsbolag';
COMMENT ON COLUMN dogs.insurance_number IS 'Försäkringsnummer';

-- =======================================
-- 3. SUBSCRIPTION_TYPES: Prissättning
-- =======================================
-- Tabell för att definiera priser baserat på mankhöjd och abonnemangstyp
CREATE TABLE IF NOT EXISTS subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Abonnemangstyp
  subscription_type text NOT NULL CHECK (subscription_type IN ('Heltid', 'Deltid 2', 'Deltid 3', 'Dagshund')),
  
  -- Mankhöjd-intervall (cm)
  height_min integer NOT NULL,
  height_max integer NOT NULL,
  
  -- Pris per månad (för heltid/deltid) eller per dag (för dagshund)
  price numeric NOT NULL,
  
  -- Beskrivning
  description text,
  
  -- Aktiv
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Säkerställ att intervallen inte överlappar för samma org och typ
  UNIQUE(org_id, subscription_type, height_min, height_max)
);

COMMENT ON TABLE subscription_types IS 'Prissättning för hunddagis baserat på mankhöjd och abonnemangstyp';

CREATE INDEX IF NOT EXISTS idx_subscription_types_org ON subscription_types(org_id);

-- =======================================
-- 4. DAYCARE_SERVICE_COMPLETIONS: Tjänster utförda
-- =======================================
-- Tabell för att markera när kloklipp/tassklipp/bad är utfört
CREATE TABLE IF NOT EXISTS daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  
  -- Tjänstetyp
  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad', 'annat')),
  
  -- När det var planerat (månad)
  scheduled_month text NOT NULL, -- Format: 'YYYY-MM'
  
  -- När det utfördes
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_name text, -- Spara namn för historik
  
  -- Status
  is_completed boolean DEFAULT false,
  
  -- Anteckningar
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE daycare_service_completions IS 'Spåra utförda tillvalstjänster (kloklipp, bad, etc) per hund och månad';

CREATE INDEX IF NOT EXISTS idx_daycare_completions_dog ON daycare_service_completions(dog_id);
CREATE INDEX IF NOT EXISTS idx_daycare_completions_month ON daycare_service_completions(scheduled_month);
CREATE INDEX IF NOT EXISTS idx_daycare_completions_org ON daycare_service_completions(org_id);

-- =======================================
-- 5. INTEREST_APPLICATIONS: Förbättrad intresseanmälan
-- =======================================
-- Uppdatera interest_applications om den saknar fält
ALTER TABLE interest_applications 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS dog_height_cm integer,
ADD COLUMN IF NOT EXISTS subscription_type text,
ADD COLUMN IF NOT EXISTS owner_city text,
ADD COLUMN IF NOT EXISTS owner_address text,
ADD COLUMN IF NOT EXISTS special_care_needs text,
ADD COLUMN IF NOT EXISTS is_neutered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_escape_artist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS destroys_things boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS not_house_trained boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false;

-- =======================================
-- 6. TRIGGERS: Updated_at automatik
-- =======================================
-- subscription_types trigger
DROP TRIGGER IF EXISTS update_subscription_types_updated_at ON subscription_types;
CREATE TRIGGER update_subscription_types_updated_at 
    BEFORE UPDATE ON subscription_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- daycare_service_completions trigger
DROP TRIGGER IF EXISTS update_daycare_completions_updated_at ON daycare_service_completions;
CREATE TRIGGER update_daycare_completions_updated_at 
    BEFORE UPDATE ON daycare_service_completions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================
-- 7. TESTDATA: Exempel prissättning
-- =======================================
-- Lägg till exempel-priser för att komma igång (kan ändras via admin-gränssnitt)
-- OBS: Detta kräver att du har en org_id, ersätt med din faktiska org_id

-- Exempel: INSERT INTO subscription_types (org_id, subscription_type, height_min, height_max, price, description) 
-- VALUES 
-- ('din-org-id-här', 'Heltid', 0, 45, 3500, 'Heltid (5 dagar/vecka) - Liten hund (0-45cm)'),
-- ('din-org-id-här', 'Heltid', 46, 55, 4000, 'Heltid (5 dagar/vecka) - Medelstor hund (46-55cm)'),
-- ('din-org-id-här', 'Heltid', 56, 65, 4500, 'Heltid (5 dagar/vecka) - Stor hund (56-65cm)'),
-- ('din-org-id-här', 'Heltid', 66, 999, 5000, 'Heltid (5 dagar/vecka) - Mycket stor hund (65+cm)');

-- =======================================
-- VERIFIERING
-- =======================================
-- Kör dessa queries för att verifiera att allt är korrekt:

-- 1. Kontrollera owners kolumner
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'owners' AND column_name IN ('personnummer', 'customer_number', 'contact_person_2', 'contact_phone_2')
ORDER BY ordinal_position;

-- 2. Kontrollera dogs kolumner
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dogs' AND column_name IN ('insurance_company', 'insurance_number')
ORDER BY ordinal_position;

-- 3. Kontrollera nya tabeller
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscription_types', 'daycare_service_completions')
ORDER BY table_name;

-- 4. Lista alla triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
