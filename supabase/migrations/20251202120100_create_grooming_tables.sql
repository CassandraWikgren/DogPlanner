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
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Customer info (support external customers, not just dog owners)
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  
  -- Dog info (even for external customers)
  dog_name TEXT NOT NULL,
  dog_breed TEXT,
  dog_size TEXT CHECK (dog_size IN ('XS', 'S', 'M', 'L', 'XL')),
  dog_weight NUMERIC(5,2),
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Service info
  services TEXT[], -- Array of service types
  special_requests TEXT,
  
  -- Pricing
  estimated_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  
  -- Internal notes
  staff_notes TEXT
);

-- Create grooming_journal table (historik)
CREATE TABLE IF NOT EXISTS public.grooming_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Link to booking or dog
  booking_id UUID REFERENCES grooming_bookings(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  
  -- Service details
  service_date DATE NOT NULL,
  services_performed TEXT[],
  
  -- Dog condition
  coat_condition TEXT,
  skin_condition TEXT,
  behavior_notes TEXT,
  
  -- Photos/documentation
  before_photos TEXT[], -- URLs to storage
  after_photos TEXT[],
  
  -- Staff info
  performed_by UUID REFERENCES profiles(id),
  duration_minutes INTEGER,
  
  -- Notes
  notes TEXT
);

-- Create grooming_prices table
CREATE TABLE IF NOT EXISTS public.grooming_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Service definition
  service_name TEXT NOT NULL,
  service_description TEXT,
  
  -- Pricing by dog size
  price_xs NUMERIC(10,2),
  price_s NUMERIC(10,2),
  price_m NUMERIC(10,2),
  price_l NUMERIC(10,2),
  price_xl NUMERIC(10,2),
  
  -- Pricing by time
  price_per_hour NUMERIC(10,2),
  estimated_duration_minutes INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_id ON public.grooming_bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_dog_id ON public.grooming_bookings(dog_id);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_date ON public.grooming_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_status ON public.grooming_bookings(status);

CREATE INDEX IF NOT EXISTS idx_grooming_journal_org_id ON public.grooming_journal(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_booking_id ON public.grooming_journal(booking_id);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_dog_id ON public.grooming_journal(dog_id);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_date ON public.grooming_journal(service_date);

CREATE INDEX IF NOT EXISTS idx_grooming_prices_org_id ON public.grooming_prices(org_id);
CREATE INDEX IF NOT EXISTS idx_grooming_prices_active ON public.grooming_prices(is_active) WHERE is_active = true;

-- Create updated_at trigger for grooming_bookings
CREATE OR REPLACE FUNCTION public.update_grooming_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_grooming_booking_updated_at
  BEFORE UPDATE ON public.grooming_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grooming_booking_updated_at();

-- Create updated_at trigger for grooming_prices
CREATE OR REPLACE FUNCTION public.update_grooming_price_updated_at()
RETURNS TRIGGER AS $$
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
