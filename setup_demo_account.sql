-- =====================================================
-- DEMO-KONTO FÖR KUNDPORTAL
-- =====================================================
-- Detta script skapar demo-data för befintlig test-användare
--
-- INLOGGNING:
-- E-post: test@dogplanner.se
-- Lösenord: (ditt befintliga lösenord)
--
-- OBS: Kör detta i Supabase SQL Editor
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
  '00000000-0000-0000-0000-000000000001', -- Temporärt ID, ersätt med rätt auth.users.id
  (SELECT id FROM orgs LIMIT 1), -- Använder första org i databasen
  'Demo Kund',
  'demo@kundportal.se',
  '070-123 45 67',
  'Demogatan 1',
  '123 45',
  'Stockholm',
  true,
  false,
  true,
  'Demo-konto för testning av kundportal',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  gdpr_consent = EXCLUDED.gdpr_consent;

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
  0,
  'Demo-bokning för testning',
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
  900.00,
  100.00,
  'Tidigare demo-bokning',
  NOW() - INTERVAL '35 days'
FROM dogs d
WHERE d.owner_id = '0416569d-d226-4c9d-ad57-431293680f0d'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- ANVÄNDNING
-- =====================================================
-- Kör hela detta script i Supabase SQL Editor
-- 
-- Sedan kan du logga in på kundportalen med:
-- E-post: test@dogplanner.se
-- Lösenord: (ditt befintliga lösenord)
-- =====================================================
