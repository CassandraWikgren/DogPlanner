-- ========================================
-- CLEANUP BOARDING PRICES - Ta bort överflödiga kolumner
-- Skapad: 2025-11-13
-- Syfte: Städa bort holiday_surcharge och season_multiplier som ersätts av special_dates
-- ========================================

-- Ta bort holiday_surcharge (ersätts av special_dates)
ALTER TABLE boarding_prices
DROP COLUMN IF EXISTS holiday_surcharge;

-- Ta bort season_multiplier (använd boarding_seasons.price_multiplier istället)
ALTER TABLE boarding_prices
DROP COLUMN IF EXISTS season_multiplier;

-- Uppdatera kommentarer
COMMENT ON TABLE boarding_prices IS '
GRUNDPRISER för pensionat per hundstorlek.

KOLUMNER:
- base_price: Grundpris per natt (vardag mån-tors)
- weekend_surcharge: Fast påslag för helg (fredag-söndag)

PRISBERÄKNING:
1. Kolla special_dates (högsta prioritet)
2. Om inte specialdatum, kolla helg → weekend_surcharge
3. Applicera säsong från boarding_seasons (multiplikator)

EXEMPEL:
Liten hund, vanlig måndag: 400 kr
Liten hund, lördag: 400 + 100 = 500 kr
Liten hund, midsommarafton: 400 + 400 (special_dates) = 800 kr
';

COMMENT ON COLUMN boarding_prices.base_price IS 'Grundpris per natt för vardag (måndag-torsdag)';
COMMENT ON COLUMN boarding_prices.weekend_surcharge IS 'Fast påslag för helg (fredag-söndag)';
