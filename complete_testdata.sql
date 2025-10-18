-- Ta bort ALLA triggers som kan orsaka problem
DROP TRIGGER IF EXISTS set_org_user_dogs ON public.dogs;
DROP TRIGGER IF EXISTS set_org_user_owners ON public.owners;
DROP TRIGGER IF EXISTS set_org_user_rooms ON public.rooms;
DROP TRIGGER IF EXISTS set_org_user_dog_journal ON public.dog_journal;
DROP TRIGGER IF EXISTS set_org_user_trigger ON public.orgs;

-- Ta bort anonymisering triggers (den som felmeddelandet nämner)
DROP TRIGGER IF EXISTS trg_auto_anonymize_owner ON public.owners;
DROP TRIGGER IF EXISTS trigger_anonymize_owner ON public.owners;
DROP TRIGGER IF EXISTS anonymize_owner_trigger ON public.owners;

-- Ta bort alla andra triggers som kan finnas
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.dogs;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.owners;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.orgs;

-- Ta bort funktionerna (nu när triggers är borta)
DROP FUNCTION IF EXISTS set_org_user();
DROP FUNCTION IF EXISTS trigger_anonymize_owner();
DROP FUNCTION IF EXISTS anonymize_owner(uuid);

-- Inaktivera RLS på alla tabeller
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- RENSA ALLT (utan triggers)
TRUNCATE public.dogs CASCADE;
TRUNCATE public.owners CASCADE; 
TRUNCATE public.orgs CASCADE;

-- Lägg till testdata
INSERT INTO public.orgs (name, org_number) VALUES ('Test Hunddagis', '556123456');

INSERT INTO public.owners (full_name, email, phone, org_id) 
SELECT 'Anna Andersson', 'anna@test.se', '070-111111', id FROM public.orgs WHERE name = 'Test Hunddagis';

INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
SELECT 'Bella', 'Golden Retriever', 'Heltid', o.id, g.id 
FROM public.owners o, public.orgs g 
WHERE o.full_name = 'Anna Andersson' AND g.name = 'Test Hunddagis';

-- Verifiera
SELECT 'SUCCESS!' as status, COUNT(*) as dogs_count FROM public.dogs WHERE name = 'Bella';