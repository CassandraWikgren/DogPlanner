-- SKAPA SAKNADE TABELLER
-- Kör detta i Supabase SQL Editor innan testdata laddas

-- 1. Skapa interest_applications tabell
CREATE TABLE IF NOT EXISTS interest_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dog_name TEXT NOT NULL,
  dog_breed TEXT,
  dog_age INTEGER,
  preferred_start_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Skapa pricing tabell
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  price_per_day DECIMAL(10,2),
  price_per_hour DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lägg till RLS policies för interest_applications
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interest_applications for their org" 
ON interest_applications FOR SELECT 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can insert interest_applications for their org" 
ON interest_applications FOR INSERT 
WITH CHECK (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can update interest_applications for their org" 
ON interest_applications FOR UPDATE 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can delete interest_applications for their org" 
ON interest_applications FOR DELETE 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

-- 4. Lägg till RLS policies för pricing
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pricing for their org" 
ON pricing FOR SELECT 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can insert pricing for their org" 
ON pricing FOR INSERT 
WITH CHECK (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can update pricing for their org" 
ON pricing FOR UPDATE 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

CREATE POLICY "Users can delete pricing for their org" 
ON pricing FOR DELETE 
USING (org_id IN (
  SELECT id FROM orgs 
  WHERE id = (auth.jwt() ->> 'org_id')::uuid
));

-- 5. Skapa indexer för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_interest_applications_org_id ON interest_applications(org_id);
CREATE INDEX IF NOT EXISTS idx_interest_applications_status ON interest_applications(status);
CREATE INDEX IF NOT EXISTS idx_pricing_org_id ON pricing(org_id);
CREATE INDEX IF NOT EXISTS idx_pricing_service_type ON pricing(service_type);

-- Bekräfta att tabellerna skapades
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE tablename IN ('interest_applications', 'pricing')
  AND schemaname = 'public';