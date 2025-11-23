-- =====================================================
-- FIX 1: Lägg till price_multiplier till boarding_seasons
-- =====================================================
ALTER TABLE boarding_seasons 
ADD COLUMN IF NOT EXISTS price_multiplier DECIMAL(3,2) DEFAULT 1.0;

COMMENT ON COLUMN boarding_seasons.price_multiplier IS 
'Prismultiplikator för säsongen. 1.0 = normalpris, 1.5 = 50% påslag, etc.';

-- =====================================================
-- FIX 2: Kontrollera RLS på owners-tabellen
-- =====================================================

-- Visa nuvarande policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'owners';

-- =====================================================
-- FIX 3: Lägg till owner_discounts tabell om den inte finns
-- =====================================================
CREATE TABLE IF NOT EXISTS owner_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    reason TEXT,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Index för snabb lookup
CREATE INDEX IF NOT EXISTS idx_owner_discounts_owner_id ON owner_discounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_discounts_org_id ON owner_discounts(org_id);
CREATE INDEX IF NOT EXISTS idx_owner_discounts_active ON owner_discounts(is_active, valid_from, valid_until);

-- RLS för owner_discounts
ALTER TABLE owner_discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan se rabatter för sin organisation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'owner_discounts' 
        AND policyname = 'Users can view discounts in their org'
    ) THEN
        CREATE POLICY "Users can view discounts in their org"
            ON owner_discounts FOR SELECT
            USING (
                org_id IN (
                    SELECT org_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- Policy: Admins kan hantera rabatter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'owner_discounts' 
        AND policyname = 'Admins can manage discounts'
    ) THEN
        CREATE POLICY "Admins can manage discounts"
            ON owner_discounts FOR ALL
            USING (
                org_id IN (
                    SELECT org_id FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

COMMENT ON TABLE owner_discounts IS 
'Kundspecifika rabatter som kan appliceras på fakturor och bokningar.';

-- =====================================================
-- FIX 4: Säkerställ att owners-tabellen har korrekta RLS policies
-- =====================================================

-- Lägg till policy för att se ägare i sin organisation om den inte finns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'owners' 
        AND policyname = 'Users can view owners in their org'
    ) THEN
        CREATE POLICY "Users can view owners in their org"
            ON owners FOR SELECT
            USING (
                org_id IN (
                    SELECT org_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- VERIFIERING
-- =====================================================

-- Kolla att price_multiplier finns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'boarding_seasons' AND column_name = 'price_multiplier';

-- Kolla att owner_discounts finns
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'owner_discounts';

-- Kolla RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('owners', 'owner_discounts')
ORDER BY tablename, policyname;
