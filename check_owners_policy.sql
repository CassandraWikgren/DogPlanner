-- Verifiera owners_public_insert policy

SELECT 
  policyname,
  permissive,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'owners'
  AND policyname = 'owners_public_insert';

-- Verifiera att owners tabellen har RLS ON
SELECT 
  tablename,
  rowsecurity as "RLS enabled"
FROM pg_tables
WHERE tablename = 'owners';

-- Kontrollera om policy är för restriktiv
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check IS NULL THEN 'NO WITH CHECK (problem!)'
    WHEN with_check = 'true' THEN 'Allows all (OK)'
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'owners';
