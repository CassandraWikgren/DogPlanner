-- ========================================
-- SPECIAL DATES - Flexibla specialdatum med individuella påslag
-- Skapad: 2025-11-13
-- Syfte: Hantera röda dagar, lokala event, och andra dagar med extrapåslag
-- ========================================

-- Skapa special_dates tabell
CREATE TABLE IF NOT EXISTS special_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  name text NOT NULL,
  category text CHECK (category IN ('red_day', 'holiday', 'event', 'custom')) DEFAULT 'custom',
  price_surcharge numeric NOT NULL DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, date)
);

-- Index för snabbare queries
CREATE INDEX idx_special_dates_org_date ON special_dates(org_id, date);
CREATE INDEX idx_special_dates_org_active ON special_dates(org_id) WHERE is_active = true;

-- Kommentarer
COMMENT ON TABLE special_dates IS 'Specialdatum med individuella påslag - röda dagar, lokala event, högtider';
COMMENT ON COLUMN special_dates.category IS 'red_day=svenska röda dagar, holiday=lov/semester, event=lokala event, custom=anpassat';
COMMENT ON COLUMN special_dates.price_surcharge IS 'Fast påslag i kronor för detta datum (t.ex. 400 kr för midsommar, 75 kr för mindre röd dag)';

-- RLS Policies
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on special_dates" ON special_dates
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger för att sätta org_id automatiskt
CREATE OR REPLACE FUNCTION set_special_date_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_insert_set_org_id_for_special_dates
  BEFORE INSERT ON special_dates
  FOR EACH ROW
  EXECUTE FUNCTION set_special_date_org_id();

-- Pre-populera med svenska röda dagar 2025-2026 (exempel för första organisationen)
-- Detta kan köras manuellt eller via "Importera röda dagar"-knappen i UI

COMMENT ON TABLE special_dates IS '
ANVÄNDNING:
1. Röda dagar: Importera automatiskt via UI eller manuellt INSERT
2. Lokala event: Lägg till manuellt när behov uppstår
3. Högtider: Kan ha olika påslag beroende på betydelse
4. Prioritet: Specialdatum har HÖGSTA prioritet i prisberäkning (före helg, före säsong)

PRISBERÄKNING:
- Om datum finns i special_dates → använd price_surcharge
- Annars om helg (fre-sön) → använd weekend_surcharge från boarding_prices
- Alltid applicera säsong från boarding_seasons (multiplikator)
';
