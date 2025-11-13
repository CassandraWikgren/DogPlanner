-- Kolla nuvarande struktur på boarding_prices
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'boarding_prices'
ORDER BY ordinal_position;
