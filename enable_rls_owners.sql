-- Aktivera RLS på owners-tabellen och verifiera policies

-- 1. Aktivera RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- 2. Verifiera att policyn finns
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'owners'
ORDER BY policyname;

-- 3. Testa att INSERT fungerar (för authenticated users)
-- OBS: Du måste köra detta som authenticated user för att testa ordentligt
