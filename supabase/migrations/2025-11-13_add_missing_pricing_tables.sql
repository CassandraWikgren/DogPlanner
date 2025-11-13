-- ========================================
-- LÄGG TILL SAKNADE PRICING-TABELLER
-- Datum: 2025-11-13
-- ========================================
-- 
-- Detta fixar felmeddelanden i prissidor:
-- • "Could not find table 'public.daycare_pricing'" 
-- • "Could not find table 'public.grooming_services'"
-- • "column profiles.last_sign_in_at does not exist"

-- ========================================
-- 1. DAGIS-PRISER (daycare_pricing)
-- ========================================

CREATE TABLE IF NOT EXISTS public.daycare_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Abonnemangspriser (per månad)
  subscription_1day INTEGER NOT NULL DEFAULT 1500,
  subscription_2days INTEGER NOT NULL DEFAULT 2500,
  subscription_3days INTEGER NOT NULL DEFAULT 3300,
  subscription_4days INTEGER NOT NULL DEFAULT 4000,
  subscription_5days INTEGER NOT NULL DEFAULT 4500,
  
  -- Enstaka dagar
  single_day_price INTEGER NOT NULL DEFAULT 350,
  
  -- Rabatter
  sibling_discount_percent INTEGER NOT NULL DEFAULT 10,
  trial_day_price INTEGER NOT NULL DEFAULT 200,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- En org kan bara ha en pristabell
  UNIQUE(org_id)
);

COMMENT ON TABLE public.daycare_pricing IS 'Priser för hunddagis per organisation';

-- ========================================
-- 2. FRISÖR-TJÄNSTER (grooming_services)
-- ========================================

CREATE TABLE IF NOT EXISTS public.grooming_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  service_name TEXT NOT NULL,
  base_price INTEGER NOT NULL DEFAULT 0,
  size_multiplier_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.grooming_services IS 'Frisörtjänster och priser per organisation';

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_grooming_services_org ON public.grooming_services(org_id);

-- ========================================
-- 3. FIX PROFILES.LAST_SIGN_IN_AT
-- ========================================

-- Lägg till kolumnen om den saknas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_sign_in_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN last_sign_in_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.profiles.last_sign_in_at IS 'Senaste inloggning för användaren';
    END IF;
END $$;

-- ========================================
-- 4. RLS POLICIES
-- ========================================

-- Aktivera RLS
ALTER TABLE public.daycare_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_services ENABLE ROW LEVEL SECURITY;

-- Daycare pricing policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daycare_pricing' 
        AND policyname = 'authenticated_full_access_daycare_pricing'
    ) THEN
        CREATE POLICY authenticated_full_access_daycare_pricing
        ON public.daycare_pricing
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Grooming services policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'grooming_services' 
        AND policyname = 'authenticated_full_access_grooming_services'
    ) THEN
        CREATE POLICY authenticated_full_access_grooming_services
        ON public.grooming_services
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- ========================================
-- 5. TESTDATA (OPTIONAL - bara för dev)
-- ========================================
-- Kommentera bort i produktion!

-- Exempel-priser för dagis (för första org)
INSERT INTO public.daycare_pricing (
    org_id,
    subscription_1day,
    subscription_2days,
    subscription_3days,
    subscription_4days,
    subscription_5days,
    single_day_price,
    sibling_discount_percent,
    trial_day_price
)
SELECT 
    id,
    1500,
    2500,
    3300,
    4000,
    4500,
    350,
    10,
    200
FROM public.orgs
LIMIT 1
ON CONFLICT (org_id) DO NOTHING;

-- Exempel-frisörtjänster (för första org)
INSERT INTO public.grooming_services (org_id, service_name, base_price, size_multiplier_enabled, description)
SELECT 
    o.id,
    unnest(ARRAY['Helklippning', 'Trimning', 'Bad & borst', 'Klotrimning', 'Anpassad behandling']),
    unnest(ARRAY[500, 450, 300, 150, 0]),
    unnest(ARRAY[true, true, true, false, true]),
    unnest(ARRAY[
        'Komplett klippning med bad',
        'Trimning av päls',
        'Endast bad och borstning',
        'Trimning av hundens klor',
        'Skräddarsydd behandling efter behov'
    ])
FROM public.orgs o
LIMIT 1
ON CONFLICT DO NOTHING;

-- ========================================
-- KLART! 
-- ========================================
-- Kör denna SQL i Supabase SQL Editor
-- Tryck sedan F5 på prissidorna
