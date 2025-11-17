-- Uppdatera befintliga organisationer med län, kommun och service_types
-- KÖR DETTA I SUPABASE SQL EDITOR EFTER ATT DU KÖRT MIGRATIONEN

-- =======================
-- EXEMPEL 1: Hunddagis i Stockholm
-- =======================
UPDATE orgs 
SET 
  lan = 'Stockholm',
  kommun = 'Stockholm',
  service_types = ARRAY['hunddagis'],
  is_visible_to_customers = true
WHERE name = 'Testdagis Stockholm'; -- Byt ut mot ditt företagsnamn

-- =======================
-- EXEMPEL 2: Pensionat i Göteborg
-- =======================
UPDATE orgs 
SET 
  lan = 'Västra Götaland',
  kommun = 'Göteborg',
  service_types = ARRAY['hundpensionat'],
  is_visible_to_customers = true
WHERE name = 'Testpensionat Göteborg'; -- Byt ut mot ditt företagsnamn

-- =======================
-- EXEMPEL 3: Företag som har både dagis och pensionat
-- =======================
UPDATE orgs 
SET 
  lan = 'Skåne',
  kommun = 'Malmö',
  service_types = ARRAY['hunddagis', 'hundpensionat'],
  is_visible_to_customers = true
WHERE name = 'Hundhuset Malmö'; -- Byt ut mot ditt företagsnamn

-- =======================
-- EXEMPEL 4: Företag med alla tre tjänster
-- =======================
UPDATE orgs 
SET 
  lan = 'Uppsala',
  kommun = 'Uppsala',
  service_types = ARRAY['hunddagis', 'hundpensionat', 'hundfrisor'],
  is_visible_to_customers = true
WHERE name = 'Hundcenter Uppsala'; -- Byt ut mot ditt företagsnamn

-- =======================
-- VERIFIERA DINA ÄNDRINGAR
-- =======================
SELECT 
  name,
  lan,
  kommun,
  service_types,
  is_visible_to_customers,
  address,
  phone,
  email
FROM orgs
WHERE is_visible_to_customers = true
ORDER BY lan, kommun, name;

-- =======================
-- UPPDATERA ALLA BEFINTLIGA ORGS SAMTIDIGT (VAL)
-- =======================
-- OBS: Detta sätter alla till Stockholm och hunddagis - anpassa efter behov!
UPDATE orgs 
SET 
  lan = 'Stockholm',
  kommun = 'Stockholm', 
  service_types = ARRAY['hunddagis'],
  is_visible_to_customers = true
WHERE lan IS NULL; -- Uppdatera endast de som inte har län ännu

-- =======================
-- SVENSKA LÄN (för referens)
-- =======================
-- Använd dessa exakta namn för konsekvent filtrering:
/*
Stockholm
Uppsala
Södermanland
Östergötland
Jönköping
Kronoberg
Kalmar
Gotland
Blekinge
Skåne
Halland
Västra Götaland
Värmland
Örebro
Västmanland
Dalarna
Gävleborg
Västernorrland
Jämtland
Västerbotten
Norrbotten
*/

-- =======================
-- GÖRA EN ORG OSYNLIG FÖR KUNDER (test-org etc)
-- =======================
UPDATE orgs 
SET is_visible_to_customers = false
WHERE name LIKE '%test%' OR name LIKE '%demo%';

-- =======================
-- EXEMPEL MED FULLSTÄNDIG DATA
-- =======================
UPDATE orgs 
SET 
  lan = 'Stockholm',
  kommun = 'Täby',
  service_types = ARRAY['hunddagis', 'hundpensionat'],
  is_visible_to_customers = true,
  address = 'Hundvägen 1',
  phone = '08-123 45 67',
  email = 'info@hunddagis-exempel.se'
WHERE id = 'DIN_ORG_UUID_HÄR'; -- Hitta UUID med: SELECT id, name FROM orgs;
