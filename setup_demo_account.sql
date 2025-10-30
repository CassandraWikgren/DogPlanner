-- =====================================================
-- DEMO-KONTO FÖR KUNDPORTAL
-- =====================================================
-- Detta script skapar demo-data för befintlig test-användare
--
-- INLOGGNING:
-- E-post: test@dogplanner.se
-- Lösenord: (ditt befintliga lösenord)
--
-- OBS: Kör FÖRST add_missing_columns.sql, sedan detta script
-- =====================================================

-- STEG 0: Hitta test-användarens ID
-- SELECT id FROM auth.users WHERE email = 'test@dogplanner.se';

-- 1. Uppdatera/skapa ägare för test-användaren:
INSERT INTO owners (
  id,
  org_id,
  full_name,
  email,
  phone,
  address,
  postal_code,
  city,
  gdpr_consent,
  marketing_consent,
  photo_consent,
  notes,
  created_at
)
VALUES (
  '0416569d-d226-4c9d-ad57-431293680f0d', -- test@dogplanner.se user ID
  (SELECT id FROM orgs LIMIT 1), -- Använder första org i databasen
  'Test Användare',
  'test@dogplanner.se',
  '070-123 45 67',
  'Testgatan 1',
  '123 45',
  'Stockholm',
  true,
  false,
  true,
  'Test-konto för kundportal',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  gdpr_consent = EXCLUDED.gdpr_consent,
  org_id = EXCLUDED.org_id;

-- 2. Skapa demo-hund för detta konto
INSERT INTO dogs (
  org_id,
  name,
  breed,
  birth,
  heightcm,
  gender,
  owner_id,
  vaccdhp,
  vaccpi,
  notes,
  created_at
)
VALUES (
  (SELECT id FROM orgs LIMIT 1), -- Använder första org i databasen
  'Bella',
  'Golden Retriever',
  '2020-05-15',
  55,
  'tik',
  '0416569d-d226-4c9d-ad57-431293680f0d', -- test@dogplanner.se owner_id
  '2024-03-20',
  '2024-03-20',
  'Snäll och lekfull hund, älskar barn',
  NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Skapa en demo-bokning (pending för att testa godkännande-flödet)
INSERT INTO bookings (
  org_id,
  dog_id,
  owner_id,
  start_date,
  end_date,
  status,
  base_price,
  total_price,
  discount_amount,
  notes,
  created_at
)
SELECT
  (SELECT id FROM orgs LIMIT 1),
  d.id,
  '0416569d-d226-4c9d-ad57-431293680f0d',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  'pending',
  1500.00,
  1500.00,
  0,
  'Demo-bokning för testning - väntar på godkännande',
  NOW()
FROM dogs d
WHERE d.owner_id = '0416569d-d226-4c9d-ad57-431293680f0d'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Skapa en bekräftad bokning (för att visa i historik)
INSERT INTO bookings (
  org_id,
  dog_id,
  owner_id,
  start_date,
  end_date,
  status,
  base_price,
  total_price,
  discount_amount,
  notes,
  created_at
)
SELECT
  (SELECT id FROM orgs LIMIT 1),
  d.id,
  '0416569d-d226-4c9d-ad57-431293680f0d',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '27 days',
  'confirmed',
  1000.00,
  900.00,
  100.00,
  'Tidigare demo-bokning (bekräftad med rabatt)',
  NOW() - INTERVAL '35 days'
FROM dogs d
WHERE d.owner_id = '0416569d-d226-4c9d-ad57-431293680f0d'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- ANVÄNDNING
-- =====================================================
-- 1. Kör FÖRST add_missing_columns.sql i Supabase SQL Editor
-- 2. Kör sedan detta script (setup_demo_account.sql)
-- 
-- Sedan kan du logga in på kundportalen med:
-- E-post: test@dogplanner.se
-- Lösenord: (ditt befintliga lösenord)
--
-- Du kommer då att se:
-- - Hunden Bella i "Mina hundar"
-- - 1 pending bokning (för att testa godkännande)
-- - 1 bekräftad bokning i historiken
-- =====================================================
