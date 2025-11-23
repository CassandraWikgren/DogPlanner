-- Kolla om customer_number kolumnen finns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'owners' AND column_name = 'customer_number';

-- Kolla sekvensen
SELECT 
    sequence_name,
    last_value,
    increment_by,
    max_value
FROM information_schema.sequences
WHERE sequence_name LIKE '%customer_number%';

-- Kolla alla ägare och deras kundnummer
SELECT 
    id,
    full_name,
    email,
    customer_number,
    created_at
FROM owners
ORDER BY created_at DESC
LIMIT 20;

-- Räkna hur många som saknar kundnummer
SELECT 
    COUNT(*) FILTER (WHERE customer_number IS NULL) as without_customer_number,
    COUNT(*) FILTER (WHERE customer_number IS NOT NULL) as with_customer_number,
    COUNT(*) as total
FROM owners;
