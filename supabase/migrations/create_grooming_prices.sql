-- =====================================================
-- GROOMING PRICES TABLE
-- Hanterar priser för hundfrisörtjänster med stöd för
-- olika hundstorlekar och pälstyper
-- =====================================================

CREATE TABLE IF NOT EXISTS public.grooming_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    
    -- Tjänsteinfo
    service_name TEXT NOT NULL, -- t.ex. "Badning", "Klippning", "Trimning"
    service_type TEXT NOT NULL, -- bath, bath_trim, full_groom, nail_trim, ear_cleaning, teeth_cleaning, custom
    description TEXT,
    
    -- Hundstorlek (NULL = gäller alla storlekar)
    dog_size TEXT CHECK (dog_size IN ('mini', 'small', 'medium', 'large', 'xlarge') OR dog_size IS NULL),
    
    -- Pälstyp (NULL = gäller alla typer)
    coat_type TEXT CHECK (coat_type IN ('short', 'medium', 'long', 'wire', 'curly') OR coat_type IS NULL),
    
    -- Pris & tid
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unika kombinationer per org
    UNIQUE(org_id, service_type, dog_size, coat_type)
);

-- Index för performance
CREATE INDEX IF NOT EXISTS idx_grooming_prices_org_id ON public.grooming_prices(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_prices_active ON public.grooming_prices(org_id, active) WHERE active = true;

-- RLS Policies
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
CREATE POLICY "Users can view grooming prices in their org"
ON public.grooming_prices FOR SELECT
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;
CREATE POLICY "Users can manage grooming prices in their org"
ON public.grooming_prices FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1))
WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_grooming_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grooming_prices_updated_at ON public.grooming_prices;
CREATE TRIGGER grooming_prices_updated_at
    BEFORE UPDATE ON public.grooming_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_grooming_prices_updated_at();

-- =====================================================
-- STANDARD-PRISER (Kan anpassas per org senare)
-- =====================================================

COMMENT ON TABLE public.grooming_prices IS 'Prislista för hundfrisörtjänster med stöd för olika hundstorlekar och pälstyper';
COMMENT ON COLUMN public.grooming_prices.dog_size IS 'mini (0-5kg), small (5-10kg), medium (10-20kg), large (20-40kg), xlarge (40+kg)';
COMMENT ON COLUMN public.grooming_prices.coat_type IS 'short (kort), medium (medel), long (lång), wire (strävhårig), curly (lockig)';

-- Exempel på hur man kan sätta default-priser för en ny organisation:
-- INSERT INTO grooming_prices (org_id, service_name, service_type, dog_size, coat_type, price, duration_minutes)
-- VALUES 
--   ('ORG_UUID', 'Badning', 'bath', 'small', 'short', 250, 45),
--   ('ORG_UUID', 'Badning', 'bath', 'medium', 'short', 300, 60),
--   ('ORG_UUID', 'Badning', 'bath', 'large', 'short', 400, 75);
