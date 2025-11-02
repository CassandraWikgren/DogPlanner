-- Kör denna SQL i Supabase SQL Editor för att kontrollera RLS policies

-- 1. Kolla om RLS är aktiverat på profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Lista alla policies på profiles-tabellen
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Om inga policies finns, kör detta för att lägga till dem:
/*
BEGIN;

-- Säkerställ att RLS är aktiverat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ta bort gamla policies om de finns
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS profiles_self_access ON public.profiles;
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;

-- Lägg till korrekta policies
CREATE POLICY profiles_self_access
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_self_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
*/

-- 4. Verifiera att din profil finns
SELECT id, org_id, role, full_name, email 
FROM public.profiles 
WHERE id = 'af700a88-7c67-46d6-9acd-1e96e797759c';
