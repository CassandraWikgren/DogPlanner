-- =====================================================
-- VERIFIERA RLS STATUS FÖR RESTERANDE TABELLER
-- =====================================================

-- Kolla RLS policies för resterande tabeller från auditen
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'booking_events',
    'daycare_service_completions',
    'dog_journal',
    'extra_service',
    'grooming_logs'
)
ORDER BY tablename, policyname;

-- Kolla om RLS är enabled på dessa tabeller
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'booking_events',
    'daycare_service_completions',
    'dog_journal',
    'extra_service',
    'grooming_logs'
);
