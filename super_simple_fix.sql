-- ABSOLUT ENKLASTE LÖSNING - Bara ta bort triggers och RLS

-- Steg 1: Ta bort alla triggers som kan orsaka problem
DROP TRIGGER IF EXISTS set_org_user_trigger ON public.orgs;
DROP TRIGGER IF EXISTS set_owner_user_trigger ON public.owners;  
DROP TRIGGER IF EXISTS set_dog_user_trigger ON public.dogs;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.orgs;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.owners;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.dogs;

-- Steg 2: Inaktivera RLS helt
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- Steg 3: Rensa gamla data
DELETE FROM public.dogs;
DELETE FROM public.owners;  
DELETE FROM public.orgs;

-- Steg 4: Lägg till testdata (väldigt enkelt)
INSERT INTO public.orgs (name, org_number) VALUES ('Test Hunddagis', '556123456');
INSERT INTO public.owners (full_name, email, phone, org_id) 
  SELECT 'Anna Andersson', 'anna@test.se', '070-111111', id FROM public.orgs LIMIT 1;
INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
  SELECT 'Bella', 'Golden Retriever', 'Heltid', o.id, g.id 
  FROM public.owners o, public.orgs g LIMIT 1;