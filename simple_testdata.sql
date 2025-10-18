-- Tillfälligt inaktivera RLS för utveckling
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- Enkel testdata som matchar tabellstrukturen
-- Lägg till organisation (endast grundläggande kolumner)
INSERT INTO public.orgs (name, org_number) 
VALUES ('Test Hunddagis AB', '556123456');

-- Lägg till ägare 
INSERT INTO public.owners (full_name, email, phone, org_id) 
VALUES 
    ('Anna Andersson', 'anna@example.com', '070-1234567', 
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1)),
    ('Bert Berglund', 'bert@example.com', '070-2345678', 
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1));

-- Lägg till hundar med de kolumner som finns
INSERT INTO public.dogs (name, breed, subscription, owner_id, org_id, heightcm)
VALUES 
    ('Bella', 'Golden Retriever', 'Heltid',
     (SELECT id FROM public.owners WHERE full_name = 'Anna Andersson' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1),
     55),
    ('Max', 'Border Collie', 'Deltid 3',
     (SELECT id FROM public.owners WHERE full_name = 'Bert Berglund' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1),
     50),
    ('Charlie', 'Labrador', 'Dagshund',
     (SELECT id FROM public.owners WHERE full_name = 'Anna Andersson' LIMIT 1),
     (SELECT id FROM public.orgs WHERE name = 'Test Hunddagis AB' LIMIT 1),
     60);

-- Kolla att allt ser bra ut
SELECT 'ORGS:' as table_name, name, org_number FROM public.orgs;
SELECT 'OWNERS:' as table_name, full_name, email FROM public.owners;
SELECT 'DOGS:' as table_name, name, breed, subscription FROM public.dogs;

-- Aktivera RLS igen efter testning (viktigt!)
-- ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;