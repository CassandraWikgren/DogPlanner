-- Kör detta i Supabase SQL Editor för att diagnostisera rooms-problemet

-- 1. Kolla om rooms-tabellen finns
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'rooms'
);

-- 2. Kolla vilka kolumner rooms har
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'rooms'
ORDER BY ordinal_position;

-- 3. Kolla RLS policies på rooms
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rooms';

-- 4. Testa att läsa rooms för din org
SELECT id, name, org_id, is_active, capacity_m2
FROM public.rooms
WHERE org_id = '76c18292-19d7-41b5-9e69-482eb0d89907'
AND is_active = true
ORDER BY name;

-- 5. Om inga rum finns, kolla om din org finns
SELECT id, name, email 
FROM public.orgs 
WHERE id = '76c18292-19d7-41b5-9e69-482eb0d89907';
