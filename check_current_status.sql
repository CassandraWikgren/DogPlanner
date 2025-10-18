-- Kolla vad som faktiskt finns i databasen just nu
SELECT 'DOGS' as table_name, COUNT(*) as count FROM public.dogs
UNION ALL
SELECT 'OWNERS' as table_name, COUNT(*) as count FROM public.owners  
UNION ALL
SELECT 'ORGS' as table_name, COUNT(*) as count FROM public.orgs;

-- Kolla specifikt våra testdata
SELECT 'TEST DATA:' as info, name, breed, subscription FROM public.dogs WHERE name = 'Bella';
SELECT 'OWNER:' as info, full_name, email FROM public.owners WHERE full_name = 'Anna Andersson';
SELECT 'ORG:' as info, name, org_number FROM public.orgs WHERE name = 'Test Hunddagis';