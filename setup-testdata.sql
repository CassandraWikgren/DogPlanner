-- ================================
-- DOGPLANNER - TESTDATA SETUP
-- ================================
-- Kör dessa SQL-kommandon i din Supabase SQL Editor för att sätta upp testdata

-- Skapa en testorganisation
INSERT INTO orgs (id, name, org_number, email, vat_included, vat_rate, modules_enabled)
VALUES (
  'default-org-uuid',
  'Test Hundcenter',
  '123456-7890',
  'test@dogplanner.se',
  true,
  0.25,
  ARRAY['daycare', 'boarding', 'grooming']
) ON CONFLICT (id) DO NOTHING;

-- Skapa en testfilial
INSERT INTO branches (id, org_id, name, services)
VALUES (
  'default-branch-uuid',
  'default-org-uuid',
  'Huvudfilial',
  ARRAY['daycare', 'boarding', 'grooming']
) ON CONFLICT (id) DO NOTHING;

-- Skapa testrum för pensionat
INSERT INTO rooms (org_id, branch_id, name, capacity_m2, room_type, is_active)
VALUES 
  ('default-org-uuid', 'default-branch-uuid', 'Stora rummet', 15.0, 'boarding', true),
  ('default-org-uuid', 'default-branch-uuid', 'Lilla rummet', 8.0, 'boarding', true),
  ('default-org-uuid', 'default-branch-uuid', 'Dagisrummet', 25.0, 'daycare', true),
  ('default-org-uuid', 'default-branch-uuid', 'Kombinationsrummet', 12.0, 'both', true)
ON CONFLICT DO NOTHING;

-- Skapa testägare
INSERT INTO owners (org_id, full_name, email, phone, gdpr_consent)
VALUES 
  ('default-org-uuid', 'Anna Andersson', 'anna@example.com', '070-123456', true),
  ('default-org-uuid', 'Bert Berglund', 'bert@example.com', '070-234567', true),
  ('default-org-uuid', 'Cecilia Carlsson', 'cecilia@example.com', '070-345678', true)
ON CONFLICT DO NOTHING;

-- Skapa testhundar
INSERT INTO dogs (org_id, owner_id, name, breed, heightcm, subscription, startdate, enddate, days, room_id, checked_in)
SELECT 
  'default-org-uuid',
  o.id,
  CASE 
    WHEN o.full_name = 'Anna Andersson' THEN 'Bella'
    WHEN o.full_name = 'Bert Berglund' THEN 'Charlie'
    WHEN o.full_name = 'Cecilia Carlsson' THEN 'Daisy'
  END,
  CASE 
    WHEN o.full_name = 'Anna Andersson' THEN 'Golden Retriever'
    WHEN o.full_name = 'Bert Berglund' THEN 'Labrador'
    WHEN o.full_name = 'Cecilia Carlsson' THEN 'Chihuahua'
  END,
  CASE 
    WHEN o.full_name = 'Anna Andersson' THEN 55
    WHEN o.full_name = 'Bert Berglund' THEN 60
    WHEN o.full_name = 'Cecilia Carlsson' THEN 20
  END,
  CASE 
    WHEN o.full_name = 'Anna Andersson' THEN 'Heltid'
    WHEN o.full_name = 'Bert Berglund' THEN 'Deltid 3'
    WHEN o.full_name = 'Cecilia Carlsson' THEN 'Dagshund'
  END,
  '2025-10-01',  -- Startdatum i oktober 2025
  '2025-12-31',  -- Slutdatum i december 2025
  CASE 
    WHEN o.full_name = 'Anna Andersson' THEN 'Måndag,Tisdag,Onsdag,Torsdag,Fredag'
    WHEN o.full_name = 'Bert Berglund' THEN 'Måndag,Onsdag,Fredag'
    WHEN o.full_name = 'Cecilia Carlsson' THEN 'Tisdag'
  END,
  (SELECT id FROM rooms WHERE name = 'Lilla rummet' LIMIT 1),  -- Tilldela första rummet
  false
FROM owners o
WHERE o.org_id = 'default-org-uuid'
ON CONFLICT DO NOTHING;

-- Skapa extra tjänster för pensionat
INSERT INTO extra_services (org_id, label, price, unit, service_type, category, is_active)
VALUES 
  ('default-org-uuid', 'Extra promenad', 50.00, 'per dag', 'boarding', 'care', true),
  ('default-org-uuid', 'Medicin administrering', 25.00, 'per dag', 'boarding', 'medical', true),
  ('default-org-uuid', 'Specialfoder', 30.00, 'per dag', 'boarding', 'feeding', true),
  ('default-org-uuid', 'Tvätt av hund', 150.00, 'per gång', 'boarding', 'grooming', true)
ON CONFLICT DO NOTHING;

-- Bekräfta att allt skapades
SELECT 'Testdata har skapats!' as status;

-- Kontrollera data
SELECT 'Organisationer:' as tabell, count(*) as antal FROM orgs WHERE id = 'default-org-uuid'
UNION ALL
SELECT 'Filialer:', count(*) FROM branches WHERE org_id = 'default-org-uuid'
UNION ALL
SELECT 'Rum:', count(*) FROM rooms WHERE org_id = 'default-org-uuid'
UNION ALL
SELECT 'Ägare:', count(*) FROM owners WHERE org_id = 'default-org-uuid'
UNION ALL
SELECT 'Hundar:', count(*) FROM dogs WHERE org_id = 'default-org-uuid'
UNION ALL
SELECT 'Extra tjänster:', count(*) FROM extra_services WHERE org_id = 'default-org-uuid';