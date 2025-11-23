# KÖRT DETTA NU! - Frisörpriser Implementation

## Steg 1: Kör detta SQL i Supabase (2 min)

1. Öppna Supabase Dashboard → SQL Editor
2. Kopiera och kör detta:

```sql
-- =====================================================
-- GROOMING PRICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.grooming_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,

    dog_size TEXT CHECK (dog_size IN ('mini', 'small', 'medium', 'large', 'xlarge') OR dog_size IS NULL),
    coat_type TEXT CHECK (coat_type IN ('short', 'medium', 'long', 'wire', 'curly') OR coat_type IS NULL),

    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 60,

    active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(org_id, service_type, dog_size, coat_type)
);

CREATE INDEX IF NOT EXISTS idx_grooming_prices_org_id ON public.grooming_prices(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_prices_active ON public.grooming_prices(org_id, active) WHERE active = true;

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

COMMENT ON TABLE public.grooming_prices IS 'Prislista för hundfrisörtjänster med stöd för olika hundstorlekar och pälstyper';
```

## Steg 2: Verifiera att det fungerade

Kör detta i SQL Editor:

```sql
SELECT * FROM grooming_prices LIMIT 1;
```

Om du inte får error är det klart! ✅

## Steg 3: Testa admin-sidan

1. Gå till `/admin/hundfrisor/priser`
2. Lägg till några testpriser
3. Verifiera att de sparas

## Steg 4: Nästa implementation

Nu när tabellen finns kan vi uppdatera bokningsflödet att hämta från databasen istället för hårdkodade priser.

---

**Skapad:** 2025-11-23
**Status:** REDO ATT KÖRA
