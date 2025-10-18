-- Tillfälligt inaktivera RLS för utveckling
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- Lägg till testdata (enklare version)
-- Först, lägg till organisation (endast namn och org_number)
INSERT INTO public.orgs (name, org_number) 
VALUES ('Test Hunddagis AB', '556123-4567');

-- Sedan, lägg till ägare
INSERT INTO public.owners (full_name, email, phone, org_id) 
VALUES ('Anna Andersson', 'anna@example.com', '070-1234567', 
        (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1));

-- Lägg till fler ägare
INSERT INTO public.owners (full_name, email, phone, org_id) 
VALUES ('Bert Berglund', 'bert@example.com', '070-2345678', 
        (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1));

-- Slutligen, lägg till hundar
INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id)
VALUES 
    ('Bella', 'Golden Retriever', 'Heltid',
     (SELECT id FROM public.owners WHERE full_name = 'Anna Andersson' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1)),
    ('Max', 'Border Collie', 'Deltid 3',
     (SELECT id FROM public.owners WHERE full_name = 'Bert Berglund' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1)),
    ('Charlie', 'Labrador', 'Dagshund',
     (SELECT id FROM public.owners WHERE full_name = 'Anna Andersson' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1));

-- Aktivera RLS igen efter testning (viktigt!)
-- ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;