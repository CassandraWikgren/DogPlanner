-- ============================================================
-- CUSTOMER_NUMBER VALIDATION QUERY
-- ============================================================
-- Purpose: Check if customer_number has conflicts (duplicates)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Check for duplicate customer_numbers
SELECT 
  customer_number,
  COUNT(*) as antal_kunder,
  STRING_AGG(full_name, ', ') as kunder
FROM owners 
WHERE customer_number IS NOT NULL
GROUP BY customer_number 
HAVING COUNT(*) > 1
ORDER BY customer_number;

-- 2. Check if sequence exists
SELECT 
  schemaname,
  sequencename,
  last_value,
  max_value,
  increment_by,
  is_called
FROM pg_sequences
WHERE sequencename LIKE '%owner%' OR sequencename LIKE '%customer%';

-- 3. Check current MAX customer_number
SELECT 
  MAX(customer_number) as highest_customer_number,
  COUNT(*) as total_customers,
  COUNT(DISTINCT customer_number) as unique_customer_numbers
FROM owners;

-- 4. Find gaps in customer_number sequence (if any)
WITH numbered AS (
  SELECT 
    customer_number,
    ROW_NUMBER() OVER (ORDER BY customer_number) as expected_number
  FROM owners
  WHERE customer_number IS NOT NULL
)
SELECT 
  customer_number,
  expected_number,
  customer_number - expected_number as gap
FROM numbered
WHERE customer_number != expected_number
LIMIT 20;

-- 5. Check if any owners have NULL customer_number (shouldn't happen)
SELECT COUNT(*) as owners_without_customer_number
FROM owners
WHERE customer_number IS NULL;
