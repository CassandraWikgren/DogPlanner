-- 2025-11-02
-- Add missing domain tables to align code and schema
-- - org_subscriptions: organisation-level plan/billing state
-- - grooming_bookings: bookings for grooming
-- - grooming_journal: performed grooming records

BEGIN;

-- === ORG-SUBSCRIPTIONS (organisationens plan, inte hundabonnemang) ===
CREATE TABLE IF NOT EXISTS public.org_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'basic',
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','canceled')) DEFAULT 'trialing',
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- En organisation bör bara ha EN aktiv rad åt gången
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_active
  ON public.org_subscriptions(org_id)
  WHERE is_active = true;

-- === GROOMING BOOKINGS ===
CREATE TABLE IF NOT EXISTS public.grooming_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time,
  service_type text NOT NULL,
  estimated_price numeric,
  status text NOT NULL CHECK (status IN ('confirmed','completed','cancelled','no_show')) DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_date ON public.grooming_bookings(org_id, appointment_date);

-- === GROOMING JOURNAL ===
CREATE TABLE IF NOT EXISTS public.grooming_journal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  service_type text NOT NULL,
  clip_length text,
  shampoo_type text,
  special_treatments text,
  final_price numeric NOT NULL DEFAULT 0,
  duration_minutes integer,
  notes text,
  before_photos text[],
  after_photos text[],
  next_appointment_recommended text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_org_date ON public.grooming_journal(org_id, appointment_date);

COMMIT;
