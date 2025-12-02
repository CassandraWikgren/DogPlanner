-- ============================================================
-- 🔧 FIX: Hantera 406-fel från tomma queries
-- ============================================================
-- Datum: 2025-12-02
-- Problem: Kod questar special_dates/boarding_seasons som saknar data
-- Lösning: Lägg till default data ELLER fixa koden
-- ============================================================

-- ALTERNATIV 1: Lägg till default data för din org
-- ============================================================

-- Hitta din org_id först:
SELECT id, org_name FROM orgs LIMIT 5;

-- Lägg till exempel boarding_seasons (sommar & jul)
INSERT INTO boarding_seasons (org_id, name, start_date, end_date, type, price_multiplier, is_active)
VALUES 
  -- Byt ut 'YOUR_ORG_ID_HERE' med din faktiska org_id från queryn ovan
  ('YOUR_ORG_ID_HERE', 'Sommar', '2026-06-01', '2026-08-30', 'high', 1.2, true),
  ('YOUR_ORG_ID_HERE', 'Jul & Nyår', '2025-12-15', '2026-01-05', 'holiday', 1.5, true)
ON CONFLICT DO NOTHING;

-- Lägg till exempel special_dates (röda dagar 2026)
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, is_active)
VALUES
  ('YOUR_ORG_ID_HERE', '2026-01-01', 'Nyårsdagen', 'holiday', 200, true),
  ('YOUR_ORG_ID_HERE', '2026-01-06', 'Trettondedag jul', 'holiday', 150, true),
  ('YOUR_ORG_ID_HERE', '2026-04-10', 'Långfredagen', 'holiday', 150, true),
  ('YOUR_ORG_ID_HERE', '2026-04-13', 'Påskdagen', 'holiday', 150, true),
  ('YOUR_ORG_ID_HERE', '2026-05-01', 'Första maj', 'holiday', 150, true),
  ('YOUR_ORG_ID_HERE', '2026-06-06', 'Nationaldagen', 'holiday', 150, true),
  ('YOUR_ORG_ID_HERE', '2026-12-24', 'Julafton', 'holiday', 300, true),
  ('YOUR_ORG_ID_HERE', '2026-12-25', 'Juldagen', 'holiday', 300, true),
  ('YOUR_ORG_ID_HERE', '2026-12-26', 'Annandag jul', 'holiday', 200, true),
  ('YOUR_ORG_ID_HERE', '2026-12-31', 'Nyårsafton', 'holiday', 250, true)
ON CONFLICT (org_id, date) DO NOTHING;

-- Verifiera att data finns:
SELECT 
  'boarding_seasons' as table_name,
  COUNT(*) as row_count
FROM boarding_seasons
WHERE org_id = 'YOUR_ORG_ID_HERE'
UNION ALL
SELECT 
  'special_dates' as table_name,
  COUNT(*) as row_count
FROM special_dates
WHERE org_id = 'YOUR_ORG_ID_HERE';

-- ============================================================
-- ALTERNATIV 2: Fixa koden att hantera tomma results
-- ============================================================
-- Detta görs i TypeScript-koden, inte SQL.
-- Se FIX_406_ERRORS_CODE.md för instruktioner.
-- ============================================================
