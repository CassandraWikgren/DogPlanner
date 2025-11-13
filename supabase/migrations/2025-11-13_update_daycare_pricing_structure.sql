-- Migration: Uppdatera daycare_pricing tabellstruktur
-- Ändrar från 5 abonnemangsnivåer till 3 (Deltid 2, Deltid 3, Heltid)
-- Lägger till tilläggsdagar för dagishund
-- Skapad: 2025-11-13

-- 1. Lägg till nya kolumner
ALTER TABLE daycare_pricing 
ADD COLUMN IF NOT EXISTS subscription_parttime_2days INTEGER DEFAULT 2500,
ADD COLUMN IF NOT EXISTS subscription_parttime_3days INTEGER DEFAULT 3300,
ADD COLUMN IF NOT EXISTS subscription_fulltime INTEGER DEFAULT 4500,
ADD COLUMN IF NOT EXISTS additional_day_price INTEGER DEFAULT 300;

-- 2. Migrera befintlig data till nya kolumner (om det finns data)
UPDATE daycare_pricing
SET 
  subscription_parttime_2days = COALESCE(subscription_2days, 2500),
  subscription_parttime_3days = COALESCE(subscription_3days, 3300),
  subscription_fulltime = COALESCE(subscription_5days, 4500),
  additional_day_price = 300
WHERE subscription_parttime_2days IS NULL;

-- 3. Ta bort gamla kolumner
ALTER TABLE daycare_pricing 
DROP COLUMN IF EXISTS subscription_1day,
DROP COLUMN IF EXISTS subscription_2days,
DROP COLUMN IF EXISTS subscription_3days,
DROP COLUMN IF EXISTS subscription_4days,
DROP COLUMN IF EXISTS subscription_5days;

-- 4. Lägg till NOT NULL constraints på nya kolumner
ALTER TABLE daycare_pricing 
ALTER COLUMN subscription_parttime_2days SET NOT NULL,
ALTER COLUMN subscription_parttime_3days SET NOT NULL,
ALTER COLUMN subscription_fulltime SET NOT NULL,
ALTER COLUMN additional_day_price SET NOT NULL;

-- 5. Lägg till kommentarer för dokumentation
COMMENT ON COLUMN daycare_pricing.subscription_parttime_2days IS 'Deltid 2: Pris per månad för 2 fasta veckodagar';
COMMENT ON COLUMN daycare_pricing.subscription_parttime_3days IS 'Deltid 3: Pris per månad för 3 fasta veckodagar';
COMMENT ON COLUMN daycare_pricing.subscription_fulltime IS 'Heltid: Pris per månad för 5 dagar/vecka (måndag-fredag)';
COMMENT ON COLUMN daycare_pricing.single_day_price IS 'Dagshund: Pris för enstaka dag utan abonnemang (drop-in)';
COMMENT ON COLUMN daycare_pricing.additional_day_price IS 'Tilläggsdagar: Pris för extra dagar utöver abonnemang';
COMMENT ON COLUMN daycare_pricing.trial_day_price IS 'Provdag: Rabatterat pris första gången hunden testar dagiset';
COMMENT ON COLUMN daycare_pricing.sibling_discount_percent IS 'Syskonrabatt: Procent rabatt på andra hunden från samma ägare';

-- 6. Visa resultat
SELECT 
  'Migration klar!' as status,
  'Nya kolumner: subscription_parttime_2days, subscription_parttime_3days, subscription_fulltime, additional_day_price' as info;
