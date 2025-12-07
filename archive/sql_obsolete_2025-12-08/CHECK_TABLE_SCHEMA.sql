-- ============================================================
-- DEBUG: Kolla vilket schema tabellerna faktiskt finns i
-- ============================================================

-- Visa ALLA tabeller som matchar namnet (alla scheman)
SELECT 
  table_schema,
  table_name,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = table_schema AND tablename = table_name) as rls_on
FROM information_schema.tables
WHERE table_name IN ('special_dates', 'boarding_seasons')
ORDER BY table_schema, table_name;

-- Kolla om de finns i 'public' schema specifikt
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'special_dates'
) as special_dates_in_public;

SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'boarding_seasons'
) as boarding_seasons_in_public;

-- Visa permissions på rätt schema
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  acl.privilege_type,
  acl.grantee
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL (
  SELECT 
    CASE 
      WHEN position('r' in split_part(split_part(array_to_string(c.relacl, '|'), '=', 2), '/', 1)) > 0 THEN 'SELECT'
      ELSE NULL
    END as privilege_type,
    split_part(split_part(array_to_string(c.relacl, '|'), '=', 1), '|', -1) as grantee
) acl
WHERE c.relname IN ('special_dates', 'boarding_seasons')
  AND c.relkind = 'r'
  AND acl.privilege_type IS NOT NULL;
