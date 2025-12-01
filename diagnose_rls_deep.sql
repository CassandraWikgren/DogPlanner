-- =====================================================
-- DJUP DIAGNOSTIK AV GROOMING_PRICES RLS
-- =====================================================

-- 1. Kolla aktuell användare och session
SELECT 
  'Current User' as check_type,
  current_user as value,
  session_user as session,
  current_database() as database;

-- 2. Kolla auth.uid() function finns
SELECT 
  'auth.uid() exists' as check_type,
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'uid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
  ) as value;

-- 3. Kolla profiles tabell struktur
SELECT 
  'profiles columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Kolla grooming_prices tabell struktur
SELECT 
  'grooming_prices columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'grooming_prices'
ORDER BY ordinal_position;

-- 5. Lista ALLA policies med FULL definition
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'grooming_prices'
ORDER BY cmd, policyname;

-- 6. Testa subquery som används i policy
-- Detta visar om subqueryn faktiskt returnerar något
DO $$
DECLARE
  test_org_id uuid;
  test_user_id uuid;
BEGIN
  -- Simulera en användare
  SELECT id, org_id INTO test_user_id, test_org_id
  FROM profiles 
  LIMIT 1;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TEST AV POLICY SUBQUERY:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Test user_id: %', test_user_id;
  RAISE NOTICE 'Test org_id: %', test_org_id;
  RAISE NOTICE '';
  
  -- Testa subquery som används i INSERT policy
  RAISE NOTICE 'Subquery result (should return org_id):';
  RAISE NOTICE '  org_id IN (SELECT org_id FROM profiles WHERE id = user_id)';
  RAISE NOTICE '  Result: %', (
    SELECT org_id FROM profiles WHERE id = test_user_id
  );
  RAISE NOTICE '';
  
  -- Testa om org_id finns i subquery (boolean test)
  RAISE NOTICE 'Boolean test (should be TRUE):';
  RAISE NOTICE '  %', test_org_id IN (
    SELECT org_id FROM profiles WHERE id = test_user_id
  );
  RAISE NOTICE '===========================================';
END $$;

-- 7. Kolla om RLS är enabled och forced
SELECT 
  'RLS Status' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname IN ('grooming_prices', 'profiles');

-- 8. Kolla om det finns några befintliga priser
SELECT 
  'Existing prices count' as check_type,
  COUNT(*) as value
FROM grooming_prices;

-- 9. Test INSERT med hårdkodad org_id (bypass RLS test)
-- OBS: Detta kommer att MISSLYCKAS om RLS blockerar, vilket är vad vi vill se
DO $$
DECLARE
  test_org_id uuid;
BEGIN
  SELECT org_id INTO test_org_id FROM profiles LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TEST INSERT (kommer troligen misslyckas):';
  RAISE NOTICE '===========================================';
  
  BEGIN
    INSERT INTO grooming_prices (
      org_id, 
      service_name, 
      service_type, 
      price, 
      duration_minutes
    ) VALUES (
      test_org_id,
      'TEST - TA BORT',
      'bath',
      999,
      60
    );
    
    RAISE NOTICE '✅ INSERT LYCKADES! (oväntat)';
    
    -- Rensa testdata
    DELETE FROM grooming_prices WHERE service_name = 'TEST - TA BORT';
    RAISE NOTICE '🗑️  Testdata borttagen';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT MISSLYCKADES (förväntat):';
    RAISE NOTICE '   Error: %', SQLERRM;
    RAISE NOTICE '   Detail: %', SQLSTATE;
  END;
  
  RAISE NOTICE '===========================================';
END $$;
