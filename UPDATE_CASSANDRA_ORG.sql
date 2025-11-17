-- Uppdatera Cassandras organisation med län, kommun och tjänster
-- Kör denna SQL i Supabase SQL Editor

-- Hitta din organisation först
SELECT 
  id,
  name,
  org_number,
  lan,
  kommun,
  service_types,
  is_visible_to_customers
FROM orgs 
WHERE id IN (
  SELECT org_id FROM profiles WHERE email = 'cassandrawikgren@icloud.com'
)
LIMIT 1;

-- Uppdatera med dina uppgifter (ändra län/kommun efter behov)
UPDATE orgs
SET 
  lan = 'Stockholm',  -- Ändra till ditt län
  kommun = 'Stockholm',  -- Ändra till din kommun
  service_types = ARRAY['hunddagis', 'hundpensionat'],  -- Välj dina tjänster
  is_visible_to_customers = true
WHERE id IN (
  SELECT org_id FROM profiles WHERE email = 'cassandrawikgren@icloud.com'
);

-- Verifiera att det funkat
SELECT 
  id,
  name,
  org_number,
  lan,
  kommun,
  service_types,
  is_visible_to_customers
FROM orgs 
WHERE id IN (
  SELECT org_id FROM profiles WHERE email = 'cassandrawikgren@icloud.com'
);
