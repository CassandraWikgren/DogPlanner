-- =====================================================
-- VERIFIERA GROOMING_JOURNAL TABELL
-- =====================================================

-- 1. Kolla att tabellen finns
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'grooming_journal';

-- 2. Kolla alla kolumner
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'grooming_journal'
ORDER BY ordinal_position;

-- 3. Kolla RLS policies
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
WHERE tablename = 'grooming_journal';

-- 4. Kolla hur många rader som finns
SELECT COUNT(*) as total_entries FROM grooming_journal;

-- 5. Kolla om det finns data för din organisation
-- (Ersätt med din org_id om du vill testa)
SELECT 
    id,
    org_id,
    dog_id,
    appointment_date,
    service_type,
    final_price,
    created_at
FROM grooming_journal
ORDER BY created_at DESC
LIMIT 5;
