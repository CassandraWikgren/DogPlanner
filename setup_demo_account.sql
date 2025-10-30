-- =====================================================
-- DEMO-KONTO FÖR KUNDPORTAL
-- =====================================================
-- Detta script skapar ett demo-konto som kan användas
-- för att testa kundportalen på deployed versionen.
--
-- INLOGGNING:
-- E-post: demo@kundportal.se
-- Lösenord: demo123
--
-- OBS: Kör detta i Supabase SQL Editor
-- =====================================================

-- 1. Skapa demo-ägare i owners-tabellen
-- OBS: Du måste först skapa auth-användaren manuellt i Supabase Dashboard > Authentication
-- Eller använd detta API-anrop (kräver service_role_key):

-- Efter att auth-användaren är skapad, lägg till i owners:
INSERT INTO owners (
  id,
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
  name,
  breed,
  birth,
  heightcm,
  gender,
  owner_id,
  is_castrated,
  vaccdhp,
  vaccpi,
  notes,
  created_at
)
VALUES (
  'Bella',
  'Golden Retriever',
  '2020-05-15',
  55,
  'female',
  '00000000-0000-0000-0000-000000000001', -- Samma som owner_id ovan
  true,
  '2024-03-20',
  '2024-03-20',
  'Snäll och lekfull hund, älskar barn',
  NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Skapa en demo-bokning (pending för att testa godkännande-flödet)
INSERT INTO bookings (
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
  d.id,
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  'pending',
  1500.00,
  0,
  'Demo-bokning för testning',
  NOW()
FROM dogs d
WHERE d.owner_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Skapa en bekräftad bokning (för att visa i historik)
INSERT INTO bookings (
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
  d.id,
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '27 days',
  'confirmed',
  900.00,
  100.00,
  'Tidigare demo-bokning',
  NOW() - INTERVAL '35 days'
FROM dogs d
WHERE d.owner_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- MANUELL SETUP I SUPABASE DASHBOARD
-- =====================================================
-- Gå till: Supabase Dashboard > Authentication > Users > Add User
-- 
-- Fyll i:
-- - Email: demo@kundportal.se
-- - Password: demo123
-- - Auto Confirm User: JA (markera denna!)
-- 
-- Efter att användaren är skapad:
-- 1. Kopiera user ID från Authentication-tabellen
-- 2. Ersätt '00000000-0000-0000-0000-000000000001' i ovanstående SQL med rätt ID
-- 3. Kör SQL-scriptet i SQL Editor
-- =====================================================

-- Alternativ: Använd detta för att hitta rätt ID efter att auth-användaren är skapad:
-- SELECT id FROM auth.users WHERE email = 'demo@kundportal.se';
