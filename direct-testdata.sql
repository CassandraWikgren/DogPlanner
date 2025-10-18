-- ENKEL TESTDATA MED RLS-BYPASS
-- Kör detta i Supabase SQL Editor för att ladda testdata direkt

-- Tillfälligt inaktivera RLS för att ladda testdata
ALTER TABLE orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE interest_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing DISABLE ROW LEVEL SECURITY;

-- Rensa befintlig testdata (om någon finns)
DELETE FROM bookings WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM dogs WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM owners WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM rooms WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM interest_applications WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM pricing WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM orgs WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 1. Skapa organisation
INSERT INTO orgs (id, name, org_number) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Malmö Hunddagis AB', '556123-4567');

-- 2. Skapa ägare
INSERT INTO owners (id, org_id, full_name, email, phone, address, postal_code, city) VALUES 
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Anna Andersson', 'anna.andersson@email.se', '070-1234567', 'Möllevångsgatan 12', '214 20', 'Malmö'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Erik Eriksson', 'erik.eriksson@email.se', '070-2345678', 'Södergatan 25', '211 40', 'Malmö'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Maria Johansson', 'maria.johansson@email.se', '070-3456789', 'Västergatan 8', '211 21', 'Malmö');

-- 3. Skapa hundar
INSERT INTO dogs (id, org_id, owner_id, name, breed, age, weight, color, gender, insurance_company, insurance_number, microchip_number, vaccination_date, veterinarian, emergency_contact, notes, allergies, medications, feeding_instructions, status) VALUES 
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Bella', 'Golden Retriever', 3, 28.5, 'Guldfärgad', 'female', 'Agria', 'AGR123456789', '752098765432100', '2024-01-15', 'Malmö Djurklinik', 'Erik Andersson - 070-9876543', 'Mycket social och lekfull. Älskar vatten.', 'Inga kända allergier', 'Inga mediciner', '2 gånger dagligen, 200g torrfoder', 'active'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Charlie', 'Labrador', 5, 32.0, 'Svart', 'male', 'Folksam', 'FOL987654321', '752098765432101', '2024-02-10', 'Citydjur Malmö', 'Lisa Eriksson - 070-1111222', 'Lugn och snäll, bra med barn', 'Kyckling', 'Inga mediciner', '2 gånger dagligen, specialfoder utan kyckling', 'active'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', 'Luna', 'Border Collie', 2, 18.0, 'Svart och vit', 'female', 'Agria', 'AGR111222333', '752098765432102', '2024-03-05', 'Malmö Djurklinik', 'Per Johansson - 070-5555666', 'Mycket intelligent och energisk', 'Inga kända allergier', 'Inga mediciner', '2 gånger dagligen, 150g högkvalitativt foder', 'active');

-- 4. Skapa rum
INSERT INTO rooms (id, org_id, name, room_type, size, max_capacity, amenities, daily_rate, description, is_available) VALUES 
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Deluxe Svit A1', 'deluxe', 12.5, 1, '["Uppvärmd golv", "Egen utegård", "Komfortbädd"]', 450, 'Vår mest lyxiga svit med egen utegård', true),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Standard Rum B2', 'standard', 8.0, 1, '["Komfortbädd", "Leksaker"]', 280, 'Bekvämt standardrum för medelstora hundar', true),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Familjerum C1', 'family', 15.0, 2, '["Dubbel utrymme", "Gemensam utegård", "Extra leksaker"]', 380, 'Perfekt för två hundar från samma familj', true);

-- 5. Skapa bokningar
INSERT INTO bookings (id, org_id, dog_id, owner_id, room_id, check_in_date, check_out_date, total_price, status, special_requests, emergency_contact) VALUES 
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '2024-12-20', '2024-12-23', 1350, 'confirmed', 'Extra promenader, Bella älskar att springa', 'Erik Andersson - 070-9876543'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '2024-12-25', '2024-12-30', 1400, 'confirmed', 'Specialfoder utan kyckling medföljer', 'Lisa Eriksson - 070-1111222');

-- 6. Skapa intresseanmälningar
INSERT INTO interest_applications (id, org_id, owner_name, email, phone, dog_name, dog_breed, dog_age, preferred_start_date, status, notes, created_at) VALUES 
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Karin Svensson', 'karin.svensson@email.se', '070-4567890', 'Max', 'Tysk Schäfer', 4, '2025-01-15', 'pending', 'Karin vill starta i januari. Max är väluppfostrad och social.', '2024-12-01T10:00:00Z'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'David Lindqvist', 'david.lindqvist@email.se', '070-6789012', 'Stella', 'Cocker Spaniel', 1, '2025-02-01', 'approved', 'Ung valp som behöver socialisering. Familjen har erfarenhet.', '2024-11-28T14:30:00Z');

-- 7. Skapa priser
INSERT INTO pricing (id, org_id, service_type, price_per_day, price_per_hour, description) VALUES 
('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'hunddagis', 320, 45, 'Hunddagis heldag'),
('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'hundpensionat', 280, NULL, 'Hundpensionat per natt (standardrum)'),
('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'trim', NULL, 650, 'Hundfrisering och trimning');

-- Återaktivera RLS
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Bekräfta att data laddades
SELECT 
  'orgs' as table_name, 
  COUNT(*) as count 
FROM orgs WHERE id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'owners' as table_name, 
  COUNT(*) as count 
FROM owners WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'dogs' as table_name, 
  COUNT(*) as count 
FROM dogs WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'rooms' as table_name, 
  COUNT(*) as count 
FROM rooms WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'bookings' as table_name, 
  COUNT(*) as count 
FROM bookings WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'interest_applications' as table_name, 
  COUNT(*) as count 
FROM interest_applications WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
  'pricing' as table_name, 
  COUNT(*) as count 
FROM pricing WHERE org_id = '550e8400-e29b-41d4-a716-446655440000';

-- Resultatet ska visa:
-- orgs: 1
-- owners: 3  
-- dogs: 3
-- rooms: 3
-- bookings: 2
-- interest_applications: 2
-- pricing: 3