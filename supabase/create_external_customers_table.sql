-- =====================================================
-- EXTERNAL CUSTOMERS TABLE FOR WALK-IN GROOMING CLIENTS
-- =====================================================
-- This table stores walk-in customers who don't need full
-- GDPR registration but should be reusable for future bookings
-- =====================================================

-- Create external_customers table
CREATE TABLE IF NOT EXISTS external_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dog_name TEXT NOT NULL,
  dog_breed TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_date DATE,
  total_visits INTEGER DEFAULT 0,
  UNIQUE(org_id, customer_phone, dog_name)
);

-- Enable RLS
ALTER TABLE external_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view external customers in their org"
  ON external_customers
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert external customers in their org"
  ON external_customers
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update external customers in their org"
  ON external_customers
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_customers_org_id ON external_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_external_customers_phone ON external_customers(customer_phone);
CREATE INDEX IF NOT EXISTS idx_external_customers_name ON external_customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_external_customers_dog_name ON external_customers(dog_name);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_external_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_external_customers_updated_at
  BEFORE UPDATE ON external_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_external_customers_updated_at();

-- Function to auto-update external customer stats when booking completed
CREATE OR REPLACE FUNCTION update_external_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Only proceed if this is a walk-in booking that was just completed
  IF NEW.status = 'completed' AND NEW.external_customer_name IS NOT NULL THEN
    
    -- Find or create external customer record
    INSERT INTO external_customers (
      org_id,
      customer_name,
      customer_phone,
      dog_name,
      dog_breed,
      last_visit_date,
      total_visits
    ) VALUES (
      NEW.org_id,
      NEW.external_customer_name,
      NEW.external_customer_phone,
      NEW.external_dog_name,
      NEW.external_dog_breed,
      NEW.appointment_date,
      1
    )
    ON CONFLICT (org_id, customer_phone, dog_name)
    DO UPDATE SET
      last_visit_date = NEW.appointment_date,
      total_visits = external_customers.total_visits + 1,
      updated_at = NOW()
    RETURNING id INTO v_customer_id;
    
    RAISE NOTICE 'Updated external customer stats for customer %', v_customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_external_customer_stats ON grooming_bookings;

-- Create trigger
CREATE TRIGGER trigger_update_external_customer_stats
  AFTER UPDATE OF status ON grooming_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_external_customer_stats();

COMMENT ON TABLE external_customers IS 
'Stores walk-in grooming customers who can be quickly selected for future bookings without full GDPR registration';

COMMENT ON COLUMN external_customers.total_visits IS 
'Auto-incremented when a booking with this customer is marked as completed';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT * FROM external_customers ORDER BY last_visit_date DESC;
-- =====================================================
