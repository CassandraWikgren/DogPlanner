-- ENKEL LÖSNING: Ta bort problematiska triggers temporärt

-- Ta bort triggers som orsakar problem
DROP TRIGGER IF EXISTS set_org_user_trigger ON public.orgs;
DROP TRIGGER IF EXISTS set_owner_user_trigger ON public.owners;
DROP TRIGGER IF EXISTS set_dog_user_trigger ON public.dogs;

-- Inaktivera RLS tillfälligt
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- Nu lägg till testdata utan triggers
INSERT INTO public.orgs (name, org_number) 
VALUES ('Test Hunddagis AB', '556123456') 
ON CONFLICT DO NOTHING;

-- Hämta org_id för att använda i nästa INSERT
DO $$ 
DECLARE
    org_uuid uuid;
BEGIN
    SELECT id INTO org_uuid FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1;
    
    -- Lägg till ägare
    INSERT INTO public.owners (full_name, email, phone, org_id) 
    VALUES 
        ('Anna Andersson', 'anna@example.com', '070-1234567', org_uuid),
        ('Bert Berglund', 'bert@example.com', '070-2345678', org_uuid)
    ON CONFLICT DO NOTHING;
    
    -- Lägg till hundar
    INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
    SELECT 'Bella', 'Golden Retriever', 'Heltid', o.id, org_uuid
    FROM public.owners o WHERE o.full_name = 'Anna Andersson' LIMIT 1
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
    SELECT 'Max', 'Border Collie', 'Deltid 3', o.id, org_uuid
    FROM public.owners o WHERE o.full_name = 'Bert Berglund' LIMIT 1
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
    SELECT 'Charlie', 'Labrador', 'Dagshund', o.id, org_uuid
    FROM public.owners o WHERE o.full_name = 'Anna Andersson' LIMIT 1
    ON CONFLICT DO NOTHING;
END $$;

-- Verifiera data
SELECT 'ORGS' as type, COUNT(*) as count FROM public.orgs;
SELECT 'OWNERS' as type, COUNT(*) as count FROM public.owners;
SELECT 'DOGS' as type, COUNT(*) as count FROM public.dogs;

SELECT 'DOGS WITH DETAILS' as type, d.name, d.breed, o.full_name as owner_name
FROM public.dogs d
JOIN public.owners o ON d.owner_id = o.id;