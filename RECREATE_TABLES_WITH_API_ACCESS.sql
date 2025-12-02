-- ============================================================
-- NUCLEAR OPTION: Återskapa tabellerna med FULL API access
-- ============================================================
-- Ibland måste man droppa och återskapa för att PostgREST ska se dem
-- ============================================================

-- 1️⃣ BACKUP: Spara all data först
CREATE TABLE special_dates_backup AS SELECT * FROM special_dates;
CREATE TABLE boarding_seasons_backup AS SELECT * FROM boarding_seasons;

-- 2️⃣ DROP och återskapa special_dates
DROP TABLE IF EXISTS special_dates CASCADE;

CREATE TABLE special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT,
  category TEXT,
  price_surcharge NUMERIC(10,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, date)
);

-- Grant permissions INNAN vi laddar data
GRANT ALL ON special_dates TO anon;
GRANT ALL ON special_dates TO authenticated;
GRANT ALL ON special_dates TO service_role;

-- Disable RLS
ALTER TABLE special_dates DISABLE ROW LEVEL SECURITY;

-- Återställ data
INSERT INTO special_dates SELECT * FROM special_dates_backup;

-- 3️⃣ DROP och återskapa boarding_seasons
DROP TABLE IF EXISTS boarding_seasons CASCADE;

CREATE TABLE boarding_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT,
  price_multiplier NUMERIC(10,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);

-- Grant permissions
GRANT ALL ON boarding_seasons TO anon;
GRANT ALL ON boarding_seasons TO authenticated;
GRANT ALL ON boarding_seasons TO service_role;

-- Disable RLS
ALTER TABLE boarding_seasons DISABLE ROW LEVEL SECURITY;

-- Återställ data
INSERT INTO boarding_seasons SELECT * FROM boarding_seasons_backup;

-- 4️⃣ Cleanup backups
DROP TABLE special_dates_backup;
DROP TABLE boarding_seasons_backup;

-- 5️⃣ Force PostgREST reload
NOTIFY pgrst, 'reload schema';

-- 6️⃣ Verifiera
SELECT 
  'special_dates' as table_name,
  COUNT(*) as rows,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'special_dates') as rls_on
UNION ALL
SELECT 
  'boarding_seasons' as table_name,
  COUNT(*) as rows,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'boarding_seasons') as rls_on;

-- ============================================================
-- FÖRVÄNTAT: 7030 rows, false | 2 rows, false
-- ============================================================
