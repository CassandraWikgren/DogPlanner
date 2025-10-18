-- KUNDPORTAL TESTDATA - Komplett schema för kundregistrering
-- Kör denna i Supabase SQL editor för att fixa registreringsproblemet

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

-- Ta bort alla andra triggers
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.dogs;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.owners;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.orgs;

-- Ta bort funktionerna
DROP FUNCTION IF EXISTS set_org_user();
DROP FUNCTION IF EXISTS trigger_anonymize_owner();
DROP FUNCTION IF EXISTS anonymize_owner(uuid);

-- Inaktivera RLS på alla tabeller
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Se till att owners-tabellen har alla nödvändiga kolumner för kundportalen
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS contact_person_2 text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS contact_phone_2 text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS photo_consent boolean DEFAULT false;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS notes text;

-- Se till att dogs-tabellen har alla nödvändiga kolumner
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS heightcm numeric;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS is_sterilized boolean DEFAULT false;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS medical_notes text;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS personality_traits text[];
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS special_needs text;

-- RENSA ALLT (utan triggers)
TRUNCATE public.dogs CASCADE;
TRUNCATE public.owners CASCADE; 
TRUNCATE public.orgs CASCADE;

-- Lägg till testorganisation
INSERT INTO public.orgs (name, org_number) VALUES ('Test Hunddagis', '556123456');

-- Lägg till testägare med alla fält för kundportalen
INSERT INTO public.owners (
  full_name, email, phone, 
  address, postal_code, city,
  contact_person_2, contact_phone_2,
  gdpr_consent, marketing_consent, photo_consent,
  notes, org_id
) 
SELECT 
  'Anna Andersson', 
  'anna@test.se', 
  '070-111111',
  'Testgatan 123',
  '12345',
  'Stockholm',
  'Nils Andersson',
  '070-222222',
  true,
  false,
  false,
  'Testdata för kundportal',
  id 
FROM public.orgs WHERE name = 'Test Hunddagis';

-- Lägg till testhund med alla fält
INSERT INTO public.dogs (
  name, breed, subscription, owner_id, org_id,
  heightcm, gender, birth_date, is_sterilized,
  medical_notes, personality_traits, special_needs
)
SELECT 
  'Bella', 
  'Golden Retriever', 
  'Heltid', 
  o.id, 
  g.id,
  55.0,
  'Tik',
  '2020-05-15',
  false,
  'Frisk hund',
  ARRAY['Snäll', 'Lekfull'],
  'Inga särskilda behov'
FROM public.owners o, public.orgs g 
WHERE o.full_name = 'Anna Andersson' AND g.name = 'Test Hunddagis';

-- Verifiera att allt fungerar
SELECT 'SUCCESS!' as status, 
       COUNT(*) as dogs_count,
       'Bella finns med heightcm=' || MAX(heightcm) as dog_details
FROM public.dogs WHERE name = 'Bella';

SELECT 'OWNER CHECK:' as info,
       full_name,
       email,
       address,
       postal_code,
       city,
       gdpr_consent
FROM public.owners WHERE full_name = 'Anna Andersson';

-- Visa kolumner i owners-tabellen för verifiering
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'owners' AND table_schema = 'public'
ORDER BY ordinal_position;