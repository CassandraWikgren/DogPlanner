-- DEBUG: Kontrollera pensionat-priser i databasen
-- Kör detta i Supabase SQL Editor

-- 1. Visa alla boarding_prices
SELECT 
  bp.id,
  bp.org_id,
  o.name as org_name,
  bp.dog_size,
  bp.base_price,
  bp.weekend_surcharge,
  bp.is_active,
  bp.created_at
FROM boarding_prices bp
LEFT JOIN orgs o ON bp.org_id = o.id
ORDER BY bp.org_id, bp.dog_size;

-- 2. Kontrollera om det finns priser för varje org
SELECT 
  o.id,
  o.name,
  COUNT(bp.id) as antal_priser
FROM orgs o
LEFT JOIN boarding_prices bp ON o.id = bp.org_id AND bp.is_active = true
GROUP BY o.id, o.name;

-- 3. Visa säsonger
SELECT 
  bs.id,
  bs.org_id,
  o.name as org_name,
  bs.name,
  bs.start_date,
  bs.end_date,
  bs.price_multiplier,
  bs.is_active
FROM boarding_seasons bs
LEFT JOIN orgs o ON bs.org_id = o.id
WHERE bs.is_active = true
ORDER BY bs.start_date;

-- 4. Visa specialdatum
SELECT 
  sd.id,
  sd.org_id,
  o.name as org_name,
  sd.date,
  sd.name,
  sd.category,
  sd.price_surcharge,
  sd.is_active
FROM special_dates sd
LEFT JOIN orgs o ON sd.org_id = o.id
WHERE sd.is_active = true AND sd.date >= CURRENT_DATE
ORDER BY sd.date
LIMIT 20;
