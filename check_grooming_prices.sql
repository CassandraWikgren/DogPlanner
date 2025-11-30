-- Kolla om grooming_prices finns och vilka policies som är aktiva
SELECT 
  'Tabell exists' as check_type,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'grooming_prices'
  ) as result;

-- Kolla RLS policies
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
WHERE tablename = 'grooming_prices'
ORDER BY policyname;

-- Kolla om RLS är aktivt
SELECT 
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'grooming_prices';

-- Testa om användaren kan lägga till en rad (dry run)
-- Detta visar vilket fel som uppstår
