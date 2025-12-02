-- ============================================================
-- FORCE REFRESH: Notify PostgREST att schema har ändrats
-- ============================================================
-- Detta tvingar Supabase att ladda om sitt API-schema
-- ============================================================

-- Skicka reload-signal till PostgREST
NOTIFY pgrst, 'reload schema';

-- Alternativ: Kör ANALYZE för att uppdatera statistik
ANALYZE special_dates;
ANALYZE boarding_seasons;

-- Verifiera att tabellerna är synliga
SELECT 
  tablename,
  schemaname,
  rowsecurity as rls_on
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons');
