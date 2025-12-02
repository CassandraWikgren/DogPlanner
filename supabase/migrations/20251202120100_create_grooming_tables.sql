-- ============================================================
-- Migration: Create grooming (hundfrisör) tables
-- ============================================================
-- Date: 2025-12-02
-- Purpose: Create infrastructure for grooming bookings system
-- Tables: grooming_bookings, grooming_journal, grooming_prices
-- ============================================================

-- Create grooming_bookings table
CREATE TABLE IF NOT EXISTS public.grooming_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  service_type TEXT NOT NULL,
  estimated_price NUMERIC(10,2),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- External customer fields (for walk-in customers)
  external_customer_name TEXT,
  external_customer_phone TEXT,
  external_dog_name TEXT,
  external_dog_breed TEXT,
  clip_length TEXT,
  shampoo_type TEXT
);

-- Create grooming_journal table (historik)
CREATE TABLE IF NOT EXISTS public.grooming_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  dog_id UUID REFERENCES dogs(id),
  appointment_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  clip_length TEXT,
  shampoo_type TEXT,
  special_treatments TEXT,
  final_price NUMERIC(10,2) DEFAULT 0 NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  next_appointment_recommended TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- External customer fields
  external_customer_name TEXT,
  external_dog_name TEXT,
  external_dog_breed TEXT,
  booking_id UUID REFERENCES grooming_bookings(id)
);

-- Create grooming_prices table
CREATE TABLE IF NOT EXISTS public.grooming_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
-- Create grooming_prices table
CREATE TABLE IF NOT EXISTS public.grooming_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  price_small NUMERIC(10,2),
  price_medium NUMERIC(10,2),
  price_large NUMERIC(10,2),
  price_xlarge NUMERIC(10,2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);EATE INDEX IF NOT EXISTS idx_grooming_bookings_status ON public.grooming_bookings(status);

CREATE INDEX IF NOT EXISTS idx_grooming_journal_org_id ON public.grooming_journal(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_booking_id ON public.grooming_journal(booking_id);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_dog_id ON public.grooming_journal(dog_id);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_date ON public.grooming_bookings(org_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_dog_id ON public.grooming_bookings(dog_id);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_status ON public.grooming_bookings(status);

-- Create updated_at trigger for grooming_prices
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_grooming_price_updated_at
  BEFORE UPDATE ON public.grooming_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grooming_price_updated_at();

-- Disable RLS for development (IMPORTANT: Enable for production!)
ALTER TABLE public.grooming_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_journal DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_prices DISABLE ROW LEVEL SECURITY;

-- Note: For production, enable RLS and create policies like:
-- ALTER TABLE public.grooming_bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their org grooming bookings" ON public.grooming_bookings
--   FOR ALL TO authenticated
--   USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
