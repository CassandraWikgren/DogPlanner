-- ============================================================
-- ENDAST SPECIAL_DATES KOLUMNER
-- ============================================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'special_dates'
ORDER BY ordinal_position;
