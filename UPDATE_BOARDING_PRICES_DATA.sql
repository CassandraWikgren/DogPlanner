-- ============================================================
-- 💰 UPPDATERA PENSIONATSPRISER - Korrekt data för boardingPriceCalculator.ts
-- ============================================================
-- Skapad: 6 December 2025
-- Syfte: Säkerställ att boarding_prices, special_dates och boarding_seasons
--        har korrekt data för dynamisk prisberäkning
-- ============================================================

-- STEG 0: Hitta din organisations-ID
-- Kör detta först för att se vilken org_id du ska använda:
SELECT id, name, email 
FROM orgs 
ORDER BY created_at DESC 
LIMIT 5;

-- NOTERA: Kopiera din org_id och ersätt 'DIN_ORG_ID' nedan!

-- ============================================================
-- STEG 1: BOARDING_PRICES - Grundpriser per hundstorlek
-- ============================================================
-- Struktur enligt boardingPriceCalculator.ts:
-- - dog_size: 'small' (<35cm), 'medium' (35-54cm), 'large' (>54cm)
-- - base_price: Grundpris per natt (vardag)
-- - weekend_surcharge: Extra kostnad för helg (fre-sön)

-- Ta bort gamla priser för att undvika dubbletter (valfritt)
-- DELETE FROM boarding_prices WHERE org_id = 'DIN_ORG_ID';

-- Lägg till/uppdatera priser för ALLA tre storlekar
INSERT INTO boarding_prices (org_id, dog_size, base_price, weekend_surcharge, is_active)
VALUES 
  -- Ersätt 'DIN_ORG_ID' med din faktiska org_id!
  ('DIN_ORG_ID', 'small', 350, 50, true),   -- Små hundar: 350 kr/natt, +50 kr helg
  ('DIN_ORG_ID', 'medium', 450, 75, true),  -- Mellan hundar: 450 kr/natt, +75 kr helg
  ('DIN_ORG_ID', 'large', 550, 100, true)   -- Stora hundar: 550 kr/natt, +100 kr helg
ON CONFLICT (org_id, dog_size) 
DO UPDATE SET 
  base_price = EXCLUDED.base_price,
  weekend_surcharge = EXCLUDED.weekend_surcharge,
  is_active = true,
  updated_at = NOW();

-- Verifiera:
SELECT dog_size, base_price, weekend_surcharge, is_active 
FROM boarding_prices 
WHERE org_id = 'DIN_ORG_ID' 
ORDER BY dog_size;

-- ============================================================
-- STEG 2: BOARDING_SEASONS - Säsonger med prismultiplikator
-- ============================================================
-- Multiplikator: 1.0 = normalpris, 1.2 = +20%, 0.9 = -10%

-- Lägg till säsonger för 2025-2026
INSERT INTO boarding_seasons (org_id, name, start_date, end_date, type, price_multiplier, is_active)
VALUES
  -- Högsäsong sommar
  ('DIN_ORG_ID', 'Sommar högsäsong', '2025-06-15', '2025-08-15', 'high', 1.30, true),
  ('DIN_ORG_ID', 'Sommar högsäsong 2026', '2026-06-15', '2026-08-15', 'high', 1.30, true),
  
  -- Jul/Nyår
  ('DIN_ORG_ID', 'Jul och Nyår', '2025-12-20', '2026-01-06', 'holiday', 1.50, true),
  ('DIN_ORG_ID', 'Jul och Nyår 2026', '2026-12-20', '2027-01-06', 'holiday', 1.50, true),
  
  -- Sportlov (vecka 8-9 ca)
  ('DIN_ORG_ID', 'Sportlov 2026', '2026-02-14', '2026-03-01', 'high', 1.20, true),
  
  -- Påsk
  ('DIN_ORG_ID', 'Påsk 2026', '2026-03-28', '2026-04-06', 'high', 1.25, true),
  
  -- Lågsäsong (november)
  ('DIN_ORG_ID', 'Lågsäsong höst', '2025-11-01', '2025-11-30', 'low', 0.90, true),
  ('DIN_ORG_ID', 'Lågsäsong höst 2026', '2026-11-01', '2026-11-30', 'low', 0.90, true)
ON CONFLICT (id) DO NOTHING;

-- Verifiera:
SELECT name, start_date, end_date, type, price_multiplier, is_active
FROM boarding_seasons 
WHERE org_id = 'DIN_ORG_ID'
ORDER BY start_date;

-- ============================================================
-- STEG 3: SPECIAL_DATES - Helgdagar och specialdatum
-- ============================================================
-- Kategorier: 'red_day', 'holiday', 'event', 'custom'
-- price_surcharge: Extra kostnad den dagen

INSERT INTO special_dates (org_id, date, name, category, price_surcharge, is_active)
VALUES
  -- 2025 helgdagar (december)
  ('DIN_ORG_ID', '2025-12-24', 'Julafton', 'holiday', 200, true),
  ('DIN_ORG_ID', '2025-12-25', 'Juldagen', 'holiday', 200, true),
  ('DIN_ORG_ID', '2025-12-26', 'Annandag jul', 'holiday', 150, true),
  ('DIN_ORG_ID', '2025-12-31', 'Nyårsafton', 'holiday', 200, true),
  
  -- 2026 helgdagar
  ('DIN_ORG_ID', '2026-01-01', 'Nyårsdagen', 'red_day', 150, true),
  ('DIN_ORG_ID', '2026-01-06', 'Trettondedag jul', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-04-03', 'Långfredagen', 'red_day', 150, true),
  ('DIN_ORG_ID', '2026-04-05', 'Påskdagen', 'holiday', 150, true),
  ('DIN_ORG_ID', '2026-04-06', 'Annandag påsk', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-05-01', 'Första maj', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-05-14', 'Kristi himmelsfärdsdag', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-05-24', 'Pingstdagen', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-06-06', 'Nationaldagen', 'red_day', 100, true),
  ('DIN_ORG_ID', '2026-06-19', 'Midsommarafton', 'holiday', 200, true),
  ('DIN_ORG_ID', '2026-06-20', 'Midsommardagen', 'holiday', 150, true),
  ('DIN_ORG_ID', '2026-10-31', 'Alla helgons dag', 'red_day', 75, true),
  ('DIN_ORG_ID', '2026-12-24', 'Julafton', 'holiday', 200, true),
  ('DIN_ORG_ID', '2026-12-25', 'Juldagen', 'holiday', 200, true),
  ('DIN_ORG_ID', '2026-12-26', 'Annandag jul', 'holiday', 150, true),
  ('DIN_ORG_ID', '2026-12-31', 'Nyårsafton', 'holiday', 200, true)
ON CONFLICT (org_id, date) 
DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_surcharge = EXCLUDED.price_surcharge,
  is_active = true;

-- Verifiera:
SELECT date, name, category, price_surcharge, is_active
FROM special_dates 
WHERE org_id = 'DIN_ORG_ID'
ORDER BY date;

-- ============================================================
-- STEG 4: EXTRA_SERVICES - Tillval för pensionat
-- ============================================================
-- Tilläggstjänster som kan bokas extra

INSERT INTO extra_services (org_id, label, price, unit, service_type, is_active)
VALUES
  ('DIN_ORG_ID', 'Extra promenad', 100, 'per tillfälle', 'boarding', true),
  ('DIN_ORG_ID', 'Medicin-administrering', 50, 'per dag', 'boarding', true),
  ('DIN_ORG_ID', 'Specialkost', 75, 'per dag', 'boarding', true),
  ('DIN_ORG_ID', 'Bad och föning', 350, 'per gång', 'boarding', true),
  ('DIN_ORG_ID', 'Hämtning/lämning', 200, 'per resa', 'boarding', true),
  ('DIN_ORG_ID', 'Extra lektid', 150, 'per tillfälle', 'boarding', true),
  ('DIN_ORG_ID', 'Foto-/videouppdatering', 50, 'per dag', 'boarding', true)
ON CONFLICT DO NOTHING;

-- Verifiera:
SELECT label, price, unit, is_active
FROM extra_services 
WHERE org_id = 'DIN_ORG_ID' 
  AND service_type = 'boarding'
ORDER BY label;

-- ============================================================
-- STEG 5: FINAL VERIFIERING
-- ============================================================

-- Sammanfattning av all prisdata:
SELECT 'boarding_prices' as tabell, COUNT(*) as antal 
FROM boarding_prices WHERE org_id = 'DIN_ORG_ID' AND is_active = true
UNION ALL
SELECT 'boarding_seasons', COUNT(*) 
FROM boarding_seasons WHERE org_id = 'DIN_ORG_ID' AND is_active = true
UNION ALL
SELECT 'special_dates', COUNT(*) 
FROM special_dates WHERE org_id = 'DIN_ORG_ID' AND is_active = true
UNION ALL
SELECT 'extra_services', COUNT(*) 
FROM extra_services WHERE org_id = 'DIN_ORG_ID' AND service_type = 'boarding' AND is_active = true;

-- ============================================================
-- 🎉 KLART! 
-- Nu kommer prisberäkningen i nybokning/page.tsx att använda dessa priser!
--
-- Prisberäkningslogik (boardingPriceCalculator.ts):
-- 1. Hämtar base_price baserat på hundstorlek
-- 2. Lägger till weekend_surcharge för fre-sön
-- 3. Kollar om datum är special_date → lägger till price_surcharge
-- 4. Applicerar säsongs-multiplikator från boarding_seasons
-- ============================================================
