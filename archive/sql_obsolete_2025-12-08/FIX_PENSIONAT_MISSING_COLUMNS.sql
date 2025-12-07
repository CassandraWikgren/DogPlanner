-- ============================================================
-- FIX: Pensionat-tabeller saknade kolumner
-- ============================================================
-- Lägger till saknade kolumner och stänger av RLS för dev
-- ============================================================

-- 1️⃣ Lägg till is_active i boarding_seasons (om den saknas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'boarding_seasons' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE boarding_seasons ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Kolumn is_active tillagd i boarding_seasons';
  ELSE
    RAISE NOTICE '✅ Kolumn is_active finns redan i boarding_seasons';
  END IF;
END $$;


-- 2️⃣ Skapa special_dates tabell (om den saknas)
CREATE TABLE IF NOT EXISTS special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  date DATE NOT NULL,
  date_type TEXT NOT NULL,  -- 'peak', 'off_peak', 'closed'
  label TEXT,
  price_multiplier DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_special_dates_org_id ON special_dates(org_id);
CREATE INDEX IF NOT EXISTS idx_special_dates_date ON special_dates(org_id, date);


-- 3️⃣ Stäng av RLS för dev (båda tabellerna)
ALTER TABLE boarding_seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE special_dates DISABLE ROW LEVEL SECURITY;


-- 4️⃣ Verifiera att allt fungerar
SELECT 
  'boarding_seasons' as tabell,
  (SELECT COUNT(*) FROM boarding_seasons) as antal_rader,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'boarding_seasons' AND column_name = 'is_active') as has_is_active,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'boarding_seasons') as rls_aktiv
UNION ALL
SELECT 
  'special_dates' as tabell,
  (SELECT COUNT(*) FROM special_dates) as antal_rader,
  1 as has_is_active,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'special_dates') as rls_aktiv;

-- Förväntat resultat:
-- boarding_seasons | X rader | 1 (has_is_active) | false (RLS av)
-- special_dates    | Y rader | 1                 | false (RLS av)
