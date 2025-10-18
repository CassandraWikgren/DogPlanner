-- ================================
-- DOGPLANNER - KOMPLETT TESTDATA
-- Kör detta i Supabase SQL Editor för fullständig testmiljö
-- ================================

-- 1. SÄTT STANDARD ORG_ID (ändra till din faktiska org_id)
DO $$
DECLARE
    default_org_id uuid := 'ef9d0ebc-5a41-45d7-9e43-bfb95561b729'; -- ÄNDRA DETTA!
    owner1_id uuid;
    owner2_id uuid;
    owner3_id uuid;
    owner4_id uuid;
    room1_id uuid;
    room2_id uuid;
    room3_id uuid;
    dog1_id uuid;
    dog2_id uuid;
    dog3_id uuid;
    dog4_id uuid;
    dog5_id uuid;
BEGIN

-- 2. SKAPA RUM FÖR PENSIONAT OCH DAGIS
INSERT INTO rooms (id, org_id, name, capacity_m2, room_type, max_dogs, is_active, notes)
VALUES 
  (gen_random_uuid(), default_org_id, 'Stora rummet', 15.0, 'boarding', 3, true, 'Perfekt för större hundar'),
  (gen_random_uuid(), default_org_id, 'Lilla rummet', 8.0, 'boarding', 2, true, 'Mysigt för mindre hundar'),
  (gen_random_uuid(), default_org_id, 'Dagisrummet', 25.0, 'daycare', 8, true, 'Stort öppet utrymme'),
  (gen_random_uuid(), default_org_id, 'VIP-sviten', 12.0, 'both', 1, true, 'Lyxig svit för speciella gäster'),
  (gen_random_uuid(), default_org_id, 'Familjerummet', 18.0, 'boarding', 4, true, 'För hundar som ska bo tillsammans')
ON CONFLICT (id) DO NOTHING;

-- Hämta rum-IDs för bokningar
SELECT id INTO room1_id FROM rooms WHERE org_id = default_org_id AND name = 'Stora rummet' LIMIT 1;
SELECT id INTO room2_id FROM rooms WHERE org_id = default_org_id AND name = 'Lilla rummet' LIMIT 1;
SELECT id INTO room3_id FROM rooms WHERE org_id = default_org_id AND name = 'Dagisrummet' LIMIT 1;

-- 3. SKAPA ÄGARE MED FULLSTÄNDIG INFO
INSERT INTO owners (id, org_id, full_name, email, phone, address, postal_code, city, gdpr_consent, marketing_consent, photo_consent, notes)
VALUES 
  (gen_random_uuid(), default_org_id, 'Anna Andersson', 'anna.andersson@example.com', '070-123 45 67', 'Storgatan 15', '123 45', 'Stockholm', true, true, true, 'Stammis sedan 2020, mycket noggrann med rutiner'),
  (gen_random_uuid(), default_org_id, 'Bert Berglund', 'bert.berglund@example.com', '070-234 56 78', 'Lillgatan 22', '234 56', 'Göteborg', true, false, true, 'Jobbar mycket, hämtar ofta sent'),
  (gen_random_uuid(), default_org_id, 'Cecilia Carlsson', 'cecilia.carlsson@example.com', '070-345 67 89', 'Mellangatan 8', '345 67', 'Malmö', true, true, false, 'Allergisk mot vissa hundraser'),
  (gen_random_uuid(), default_org_id, 'David Davidsson', 'david.davidsson@example.com', '070-456 78 90', 'Nygatan 33', '456 78', 'Uppsala', true, true, true, 'Ny kund, första besöket nästa vecka'),
  (gen_random_uuid(), default_org_id, 'Eva Eriksson', 'eva.eriksson@example.com', '070-567 89 01', 'Gamla vägen 5', '567 89', 'Linköping', true, false, true, 'Har flera hundar, behöver grupprabatt')
ON CONFLICT (id) DO NOTHING;

-- Hämta ägare-IDs
SELECT id INTO owner1_id FROM owners WHERE org_id = default_org_id AND full_name = 'Anna Andersson' LIMIT 1;
SELECT id INTO owner2_id FROM owners WHERE org_id = default_org_id AND full_name = 'Bert Berglund' LIMIT 1;
SELECT id INTO owner3_id FROM owners WHERE org_id = default_org_id AND full_name = 'Cecilia Carlsson' LIMIT 1;
SELECT id INTO owner4_id FROM owners WHERE org_id = default_org_id AND full_name = 'David Davidsson' LIMIT 1;

-- 4. SKAPA HUNDAR MED VARIERAD DATA
INSERT INTO dogs (id, org_id, owner_id, room_id, name, breed, birth, gender, heightcm, subscription, days, startdate, enddate, vaccdhp, vaccpi, allergies, special_needs, behavior_notes, checked_in, notes)
VALUES 
  (gen_random_uuid(), default_org_id, owner1_id, room3_id, 'Bella', 'Golden Retriever', '2020-05-15', 'tik', 58, 'Hela veckan', 'måndag,tisdag,onsdag,torsdag,fredag', '2024-01-15', '2024-12-31', '2023-04-01', '2023-04-01', null, null, 'Mycket social, älskar andra hundar', true, 'Favoritleksak: tennisboll'),
  (gen_random_uuid(), default_org_id, owner1_id, room3_id, 'Charlie', 'Labrador', '2019-08-22', 'hane', 62, 'Halvdagar', 'måndag,onsdag,fredag', '2024-02-01', '2024-11-30', '2022-07-15', '2023-07-15', 'Kyckling', 'Behöver medicin kl 14:00', 'Lite blyg i början men blir snabbt vän', false, 'Äter Royal Canin Large Breed'),
  (gen_random_uuid(), default_org_id, owner2_id, null, 'Daisy', 'Fransk Bulldogg', '2021-11-10', 'tik', 35, 'Tillfälligt', null, '2024-10-20', '2024-10-25', '2023-11-01', '2023-11-01', null, 'Andningsproblem', 'Snäll men kan vara envis', false, 'Får inte springa för mycket pga andning'),
  (gen_random_uuid(), default_org_id, owner3_id, room1_id, 'Max', 'Tysk Schäfer', '2018-03-05', 'hane', 65, 'Pensionat', null, '2024-10-18', '2024-10-22', '2021-03-01', '2023-03-01', null, null, 'Vaktinstinkt, behöver erfaren hantering', false, 'Tidigare väktare, mycket intelligent'),
  (gen_random_uuid(), default_org_id, owner4_id, room2_id, 'Luna', 'Border Collie', '2022-01-20', 'tik', 52, 'Helger', 'lördag,söndag', '2024-10-01', '2024-12-31', '2023-01-15', '2023-01-15', null, 'Mycket energisk', 'Behöver mental stimulans', true, 'Älskar agility och tricks')
ON CONFLICT (id) DO NOTHING;

-- Hämta hund-IDs för bokningar
SELECT id INTO dog1_id FROM dogs WHERE org_id = default_org_id AND name = 'Bella' LIMIT 1;
SELECT id INTO dog2_id FROM dogs WHERE org_id = default_org_id AND name = 'Charlie' LIMIT 1;
SELECT id INTO dog3_id FROM dogs WHERE org_id = default_org_id AND name = 'Daisy' LIMIT 1;
SELECT id INTO dog4_id FROM dogs WHERE org_id = default_org_id AND name = 'Max' LIMIT 1;
SELECT id INTO dog5_id FROM dogs WHERE org_id = default_org_id AND name = 'Luna' LIMIT 1;

-- 5. SKAPA BOKNINGAR FÖR PENSIONAT
INSERT INTO bookings (org_id, dog_id, owner_id, room_id, start_date, end_date, status, base_price, total_price, deposit_amount, deposit_paid, notes)
VALUES 
  (default_org_id, dog4_id, owner3_id, room1_id, '2024-10-18', '2024-10-22', 'confirmed', 350.00, 1400.00, 500.00, true, 'Medelstort rum, 4 nätter'),
  (default_org_id, dog3_id, owner2_id, room2_id, '2024-10-20', '2024-10-25', 'pending', 300.00, 1500.00, 0.00, false, 'Litet rum, 5 nätter, väntar på bekräftelse'),
  (default_org_id, dog5_id, owner4_id, room1_id, '2024-11-15', '2024-11-17', 'confirmed', 350.00, 700.00, 350.00, true, 'Helgbokning, stort rum'),
  (default_org_id, dog1_id, owner1_id, room2_id, '2024-12-20', '2024-12-27', 'pending', 300.00, 2100.00, 1000.00, false, 'Julbokning, 7 nätter')
ON CONFLICT DO NOTHING;

-- 6. SKAPA INTRESSEANMÄLNINGAR
INSERT INTO interest_applications (org_id, parent_name, parent_email, parent_phone, dog_name, dog_breed, dog_age, dog_size, preferred_start_date, preferred_days, special_needs, previous_daycare_experience, status, notes)
VALUES 
  (default_org_id, 'Fredrik Fredriksson', 'fredrik@example.com', '070-111 22 33', 'Rufus', 'Beagle', 3, 'medium', '2024-11-01', ARRAY['måndag','tisdag','onsdag'], 'Lite rädd för större hundar', true, 'pending', null),
  (default_org_id, 'Gunilla Gustafsson', 'gunilla@example.com', '070-222 33 44', 'Stella', 'Cavalier King Charles Spaniel', 1, 'small', '2024-10-25', ARRAY['tisdag','torsdag'], null, false, 'contacted', 'Ringde 2024-10-15, ska komma på besök'),
  (default_org_id, 'Hans Hansson', 'hans@example.com', '070-333 44 55', 'Rocky', 'Rottweiler', 5, 'large', '2024-12-01', ARRAY['måndag','onsdag','fredag'], 'Behöver erfaren hantering', true, 'accepted', 'Godkänd efter besök, startar i december'),
  (default_org_id, 'Ingrid Isaksson', 'ingrid@example.com', '070-444 55 66', 'Molly', 'Pudel', 2, 'medium', '2024-11-15', ARRAY['vardagar'], 'Allergivänlig', false, 'declined', 'Passar inte vår miljö pga andra hundar')
ON CONFLICT DO NOTHING;

-- 7. SKAPA JOURNAL-POSTER
INSERT INTO journal (org_id, dog_id, entry_type, description, created_by, is_important)
VALUES 
  (default_org_id, dog1_id, 'note', 'Bella hade en fantastisk dag idag! Lekte mycket med Charlie och åt all mat.', 'staff', false),
  (default_org_id, dog1_id, 'health', 'Kontrollerade tänder - ser bra ut. Nästa kontroll om 6 månader.', 'staff', true),
  (default_org_id, dog2_id, 'behavior', 'Charlie var lite nervös idag, förmodligen pga det regniga vädret.', 'staff', false),
  (default_org_id, dog4_id, 'note', 'Max visade imponerande lydnad under promenaden. Mycket vältränad hund.', 'staff', false),
  (default_org_id, dog5_id, 'health', 'Luna fick sin dagliga medicin kl 14:00. Inga biverkningar observerade.', 'staff', true)
ON CONFLICT DO NOTHING;

-- 8. SKAPA PRISER
INSERT INTO pricing (org_id, service_name, price_small, price_medium, price_large, unit, description, service_type)
VALUES 
  (default_org_id, 'Hunddagis Heldag', 250.00, 280.00, 320.00, 'per dag', 'Fulldagsplats på hunddagis', 'daycare'),
  (default_org_id, 'Hunddagis Halvdag', 150.00, 170.00, 190.00, 'per dag', 'Halvdagsplats på hunddagis', 'daycare'),
  (default_org_id, 'Hundpensionat', 300.00, 350.00, 400.00, 'per natt', 'Övernattning med full service', 'boarding'),
  (default_org_id, 'Klippning Basic', 400.00, 500.00, 600.00, 'per tillfälle', 'Grundläggande klippning och trim', 'grooming'),
  (default_org_id, 'Klippning Premium', 600.00, 750.00, 900.00, 'per tillfälle', 'Komplett grooming med bad och naglar', 'grooming')
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ TESTDATA SKAPAT! Kontrollera med verify-database.sql';

END $$;