-- =====================================================
-- DIAGNOSTIK: Kolla vilka kolumner som finns i tabellerna
-- Kör detta FÖRST för att se exakt vilka kolumner som finns
-- =====================================================

-- Kolla alla tabeller och deras kolumner
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'attendance_logs',
    'booking_events',
    'booking_services',
    'daycare_service_completions',
    'dog_journal',
    'extra_service',
    'error_logs',
    'function_logs',
    'grooming_logs',
    'invoice_items',
    'invoice_runs'
)
ORDER BY table_name, ordinal_position;

-- Kolla vilka tabeller som HAR org_id
SELECT DISTINCT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'org_id'
AND table_name IN (
    'attendance_logs',
    'booking_events',
    'booking_services',
    'daycare_service_completions',
    'dog_journal',
    'extra_service',
    'error_logs',
    'function_logs',
    'grooming_logs',
    'invoice_items',
    'invoice_runs'
)
ORDER BY table_name;

-- Kolla vilka tabeller som INTE har org_id
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'attendance_logs',
    'booking_events',
    'booking_services',
    'daycare_service_completions',
    'dog_journal',
    'extra_service',
    'error_logs',
    'function_logs',
    'grooming_logs',
    'invoice_items',
    'invoice_runs'
)
AND table_name NOT IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'org_id'
)
ORDER BY table_name;
