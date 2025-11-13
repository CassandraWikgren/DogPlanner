-- ========================================
-- FIX BOARDING_PRICES - Återskapa tabell med rätt struktur
-- Skapad: 2025-11-13
-- Syfte: Tabellen verkar ha fel struktur. Droppa och återskapa med korrekt schema.
-- ========================================

-- Steg 1: Ta bort befintlig tabell (VARNING: Detta raderar all data!)
DROP TABLE IF EXISTS boarding_prices CASCADE;

-- Steg 2: Återskapa tabellen med KORREKT struktur
CREATE TABLE boarding_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dog_size text NOT NULL CHECK (dog_size IN ('small', 'medium', 'large')),
  base_price numeric NOT NULL,
  weekend_surcharge numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, dog_size)
);

-- Steg 3: Lägg till kommentarer
COMMENT ON TABLE boarding_prices IS 'Grundpriser per hundstorlek. Small (<35cm), Medium (35-54cm), Large (>54cm). Pris per påbörjad kalenderdag inkl 25% moms.';
COMMENT ON COLUMN boarding_prices.dog_size IS 'Hundstorlek: small (<35cm), medium (35-54cm), large (>54cm)';
COMMENT ON COLUMN boarding_prices.base_price IS 'Grundpris per natt för vardag (måndag-torsdag), inkl 25% moms';
COMMENT ON COLUMN boarding_prices.weekend_surcharge IS 'Fast påslag för helg (fredag-söndag), inkl 25% moms. Ersätts av special_dates om datum finns där.';

-- Steg 4: Inaktivera RLS för development
ALTER TABLE boarding_prices DISABLE ROW LEVEL SECURITY;

-- Steg 5: Lägg till index för snabbare queries
CREATE INDEX idx_boarding_prices_org_id ON boarding_prices(org_id);
CREATE INDEX idx_boarding_prices_dog_size ON boarding_prices(dog_size);
CREATE INDEX idx_boarding_prices_active ON boarding_prices(is_active) WHERE is_active = true;

-- Steg 6: Infoga grundpriser för ALLA organisationer
INSERT INTO boarding_prices (org_id, dog_size, base_price, weekend_surcharge, is_active)
SELECT 
  o.id,
  size_data.dog_size,
  size_data.base_price,
  size_data.weekend_surcharge,
  true
FROM orgs o
CROSS JOIN (
  VALUES 
    ('small', 400, 100),
    ('medium', 450, 100),
    ('large', 500, 100)
) AS size_data(dog_size, base_price, weekend_surcharge);

-- Steg 7: Verifiera resultatet
SELECT 
  o.org_number,
  o.name as org_name,
  COUNT(bp.id) as antal_priser,
  ARRAY_AGG(bp.dog_size ORDER BY bp.dog_size) as storlekar
FROM orgs o
LEFT JOIN boarding_prices bp ON bp.org_id = o.id
GROUP BY o.id, o.org_number, o.name
ORDER BY o.org_number;
