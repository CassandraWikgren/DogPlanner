-- ========================================
-- DATABASE IMPROVEMENTS - DOGPLANNER
-- Implementering av förbättringar från analys
-- ========================================

-- 1. BRANCHES - Verksamhetstyper inom organisationer
CREATE TABLE IF NOT EXISTS branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  service_type text CHECK (service_type IN ('dagis', 'pensionat', 'frisör', 'annat')) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. CUSTOMER DISCOUNTS - Rabatter för kunder
CREATE TABLE IF NOT EXISTS customer_discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
  discount_value numeric NOT NULL,
  description text,
  is_permanent boolean DEFAULT false,
  valid_from date,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TEMPORARY BOOKING DISCOUNTS - Tillfälliga rabatter per bokning
CREATE TABLE IF NOT EXISTS booking_discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
  discount_value numeric NOT NULL,
  description text,
  applied_by_user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 4. USER-ORG MEMBERSHIP för framtida multi-org support
CREATE TABLE IF NOT EXISTS user_org_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('admin', 'staff', 'viewer')) DEFAULT 'staff',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- 5. BOOKING ENHANCEMENTS - Lägg till branch_id och service kopplings förbättringar
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price numeric DEFAULT 0;

-- 6. INVOICES BRANCH CONNECTION
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;

-- 7. EXTRA SERVICE FOREIGN KEY FIX
-- Byt från dogs_id till dog_id för konsistens
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_service' AND column_name = 'dogs_id') THEN
        ALTER TABLE extra_service RENAME COLUMN dogs_id TO dog_id;
    END IF;
END $$;

-- 8. DOG JOURNAL ORG_ID via trigger
ALTER TABLE dog_journal 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id) ON DELETE CASCADE;

-- 9. PRICE LISTS BRANCH CONNECTION
ALTER TABLE price_lists 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

-- ========================================
-- TRIGGERS & FUNCTIONS
-- ========================================

-- Trigger för att sätta org_id i dog_journal automatiskt
CREATE OR REPLACE FUNCTION set_dog_journal_org_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.org_id := (SELECT org_id FROM dogs WHERE id = NEW.dog_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_dog_journal_org_id ON dog_journal;
CREATE TRIGGER trigger_set_dog_journal_org_id
    BEFORE INSERT ON dog_journal
    FOR EACH ROW
    EXECUTE FUNCTION set_dog_journal_org_id();

-- Trigger för att uppdatera org_id i booking_discounts
CREATE OR REPLACE FUNCTION set_booking_discount_org_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.org_id := (SELECT org_id FROM bookings WHERE id = NEW.booking_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_booking_discount_org_id ON booking_discounts;
CREATE TRIGGER trigger_set_booking_discount_org_id
    BEFORE INSERT ON booking_discounts
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_discount_org_id();

-- Trigger för att beräkna final_price i bookings när rabatter läggs till
CREATE OR REPLACE FUNCTION calculate_booking_final_price()
RETURNS TRIGGER AS $$
DECLARE
    customer_discount_amount numeric := 0;
    booking_discount_amount numeric := 0;
    base_price numeric;
BEGIN
    -- Hämta grundpris
    base_price := COALESCE(NEW.base_price, NEW.total_price, 0);
    
    -- Hämta permanent kundrabatt
    SELECT COALESCE(SUM(
        CASE 
            WHEN cd.discount_type = 'percentage' THEN base_price * (cd.discount_value / 100)
            ELSE cd.discount_value
        END
    ), 0) INTO customer_discount_amount
    FROM customer_discounts cd
    WHERE cd.owner_id = (SELECT owner_id FROM dogs WHERE id = (SELECT dog_id FROM bookings WHERE id = NEW.id))
    AND cd.is_active = true
    AND (cd.valid_from IS NULL OR cd.valid_from <= CURRENT_DATE)
    AND (cd.valid_until IS NULL OR cd.valid_until >= CURRENT_DATE);
    
    -- Hämta tillfällig bokningsrabatt
    SELECT COALESCE(SUM(
        CASE 
            WHEN bd.discount_type = 'percentage' THEN base_price * (bd.discount_value / 100)
            ELSE bd.discount_value
        END
    ), 0) INTO booking_discount_amount
    FROM booking_discounts bd
    WHERE bd.booking_id = NEW.id;
    
    -- Beräkna slutpris
    NEW.discount_amount := customer_discount_amount + booking_discount_amount;
    NEW.final_price := GREATEST(0, base_price - NEW.discount_amount);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_booking_final_price ON bookings;
CREATE TRIGGER trigger_calculate_booking_final_price
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_booking_final_price();

-- ========================================
-- RLS POLICIES
-- ========================================

-- Branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users with same org" ON branches
FOR ALL USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Customer Discounts
ALTER TABLE customer_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users with same org" ON customer_discounts
FOR ALL USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Booking Discounts
ALTER TABLE booking_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users with same org" ON booking_discounts
FOR ALL USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- User Org Roles
ALTER TABLE user_org_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own roles" ON user_org_roles
FOR ALL USING (user_id = auth.uid());

-- ========================================
-- DEFAULT BRANCHES för befintliga orgs
-- ========================================

-- Skapa standard branches för alla befintliga organisationer
INSERT INTO branches (org_id, name, service_type, description)
SELECT 
    o.id,
    o.name || ' - Hunddagis',
    'dagis',
    'Dagisverksamhet'
FROM orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM branches b WHERE b.org_id = o.id AND b.service_type = 'dagis'
);

INSERT INTO branches (org_id, name, service_type, description)
SELECT 
    o.id,
    o.name || ' - Hundpensionat',
    'pensionat',
    'Pensionatsverksamhet'
FROM orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM branches b WHERE b.org_id = o.id AND b.service_type = 'pensionat'
);

INSERT INTO branches (org_id, name, service_type, description)
SELECT 
    o.id,
    o.name || ' - Hundfrisör',
    'frisör',
    'Frisörverksamhet'
FROM orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM branches b WHERE b.org_id = o.id AND b.service_type = 'frisör'
);

-- ========================================
-- VIEWS för enklare queries
-- ========================================

-- Vy för hundar med aktiva rabatter
CREATE OR REPLACE VIEW dogs_with_discounts AS
SELECT 
    d.*,
    cd.discount_type,
    cd.discount_value,
    cd.description as discount_description,
    cd.is_permanent
FROM dogs d
LEFT JOIN customer_discounts cd ON cd.owner_id = d.owner_id 
    AND cd.is_active = true
    AND (cd.valid_from IS NULL OR cd.valid_from <= CURRENT_DATE)
    AND (cd.valid_until IS NULL OR cd.valid_until >= CURRENT_DATE);

-- Vy för bokningar med alla rabatter
CREATE OR REPLACE VIEW bookings_with_full_pricing AS
SELECT 
    b.*,
    COALESCE(b.final_price, b.total_price) as calculated_total,
    cd.discount_value as customer_discount,
    bd.discount_value as booking_discount
FROM bookings b
LEFT JOIN dogs d ON b.dog_id = d.id
LEFT JOIN customer_discounts cd ON cd.owner_id = d.owner_id 
    AND cd.is_active = true
    AND (cd.valid_from IS NULL OR cd.valid_from <= CURRENT_DATE)
    AND (cd.valid_until IS NULL OR cd.valid_until >= CURRENT_DATE)
LEFT JOIN booking_discounts bd ON bd.booking_id = b.id;

COMMENT ON TABLE branches IS 'Verksamhetsgrenar inom organisationer - löser problemet med namnbaserad filtrering';
COMMENT ON TABLE customer_discounts IS 'Permanenta kundrabatter som automatiskt appliceras';
COMMENT ON TABLE booking_discounts IS 'Tillfälliga rabatter per specifik bokning';
COMMENT ON TABLE user_org_roles IS 'Framtidssäker lösning för multi-org användarroller';