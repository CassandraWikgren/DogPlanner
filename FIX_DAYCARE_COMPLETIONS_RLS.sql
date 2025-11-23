-- =====================================================
-- FIX: Enable RLS for daycare_service_completions
-- =====================================================

-- 1. Enable RLS
ALTER TABLE public.daycare_service_completions ENABLE ROW LEVEL SECURITY;

-- 2. Check table structure to determine correct policy
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'daycare_service_completions'
ORDER BY ordinal_position;

-- 3. Create policies
-- Table has org_id column, så vi kan använda enkel policy

DROP POLICY IF EXISTS "daycare_service_completions_select_policy" ON daycare_service_completions;
CREATE POLICY "daycare_service_completions_select_policy" ON daycare_service_completions
FOR SELECT
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "daycare_service_completions_all_policy" ON daycare_service_completions;
CREATE POLICY "daycare_service_completions_all_policy" ON daycare_service_completions
FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1))
WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- 4. Verify
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'daycare_service_completions';
