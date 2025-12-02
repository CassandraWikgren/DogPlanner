-- ============================================================
-- Migration: Fix pensionat missing columns
-- ============================================================
-- Date: 2025-12-02
-- Purpose: Add missing is_active column to boarding_seasons
--          Ensure special_dates table exists
-- Issues fixed:
--   - boarding_seasons.is_active column was missing
--   - special_dates table causing 406 RLS errors
-- ============================================================

-- Add is_active column to boarding_seasons if missing
ALTER TABLE public.boarding_seasons 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create special_dates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  date DATE NOT NULL,
  date_type TEXT CHECK (date_type IN ('peak', 'off_peak', 'holiday', 'closed')),
  multiplier NUMERIC(4,2) DEFAULT 1.0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(org_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_special_dates_org_id ON public.special_dates(org_id);
CREATE INDEX IF NOT EXISTS idx_special_dates_date ON public.special_dates(date);
CREATE INDEX IF NOT EXISTS idx_special_dates_active ON public.special_dates(is_active) WHERE is_active = true;

-- Create updated_at trigger for special_dates
CREATE OR REPLACE FUNCTION public.update_special_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_special_dates_updated_at ON public.special_dates;
CREATE TRIGGER trg_update_special_dates_updated_at
  BEFORE UPDATE ON public.special_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_special_dates_updated_at();

-- Disable RLS for development (IMPORTANT: Enable for production!)
ALTER TABLE public.boarding_seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates DISABLE ROW LEVEL SECURITY;

-- Note: For production, enable RLS and create policies like:
-- ALTER TABLE public.boarding_seasons ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their org boarding seasons" ON public.boarding_seasons
--   FOR ALL TO authenticated
--   USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
-- 
-- ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their org special dates" ON public.special_dates
--   FOR ALL TO authenticated
--   USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
