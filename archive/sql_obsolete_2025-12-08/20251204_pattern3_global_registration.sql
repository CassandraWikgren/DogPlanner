-- ============================================================================
-- MIGRATION: Pattern 3 - Global Registration + Applications System
-- Date: 4 December 2025
-- ============================================================================
-- PART 1: SCHEMA CHANGES FOR OWNERS & DOGS
-- ============================================================================
-- Problem: Current system forces org_id choice at registration
-- Solution: Allow NULL org_id, add applications table for booking flow
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Modify OWNERS table - Make org_id nullable and add fields
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE public.owners
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS preferred_orgs UUID[] DEFAULT ARRAY[]::UUID[];

-- Verify org_id column allows NULL (it should based on schema, but let's be explicit)
-- org_id is already nullable in the schema, so no ALTER needed

-- Add comment for clarity
COMMENT ON COLUMN public.owners.org_id IS 
  'Organisation ID - NULL until owner books with a specific organisation (fills in via application approval)';
COMMENT ON COLUMN public.owners.registered_at IS 
  'When the owner first registered (customer portal registration date)';
COMMENT ON COLUMN public.owners.preferred_orgs IS 
  'Array of organisation IDs owner has favorited (for quick re-booking)';

-- ============================================================================
-- STEP 2: Modify DOGS table - Make org_id nullable
-- ============================================================================

ALTER TABLE public.dogs
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Verify org_id allows NULL (should be true from schema)
COMMENT ON COLUMN public.dogs.org_id IS 
  'Organisation ID - NULL until dog is booked with a specific organisation (fills in via application approval)';
COMMENT ON COLUMN public.dogs.registered_at IS 
  'When the dog was first registered by owner';

-- ============================================================================
-- STEP 3: CREATE APPLICATIONS TABLE
-- ============================================================================
-- This is the core of the new booking flow:
-- owner_id + dog_id → hunddagis (org_id) = application
-- Status progresses: pending → approved/rejected → (if approved) booking created

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  
  -- Metadata
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(org_id, owner_id, dog_id), -- One active application per org/owner/dog combo
  CONSTRAINT applications_responded_requires_response_date 
    CHECK (
      (status = 'pending') OR 
      (status IN ('approved', 'rejected', 'withdrawn') AND responded_at IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS applications_org_id_idx ON public.applications(org_id);
CREATE INDEX IF NOT EXISTS applications_owner_id_idx ON public.applications(owner_id);
CREATE INDEX IF NOT EXISTS applications_dog_id_idx ON public.applications(dog_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications(status);
CREATE INDEX IF NOT EXISTS applications_applied_at_idx ON public.applications(applied_at DESC);

-- Comments
COMMENT ON TABLE public.applications IS 
  'Booking applications: owner applies for their dog to be booked at a specific hunddagis';
COMMENT ON COLUMN public.applications.status IS 
  'pending = awaiting hunddagis response, approved = accepted (booking created), rejected = denied, withdrawn = owner cancelled';
COMMENT ON COLUMN public.applications.response_notes IS 
  'Why hunddagis accepted/rejected (visible to owner for rejected cases)';

-- ============================================================================
-- STEP 4: ENABLE RLS ON APPLICATIONS
-- ============================================================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Verify all tables have RLS enabled
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('owners', 'dogs', 'applications')
  AND schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================================================

-- Check owners table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'owners'
ORDER BY ordinal_position;

-- Check dogs table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'dogs'
ORDER BY ordinal_position;

-- Check applications table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'applications'
) as "Applications table exists";

COMMIT;

-- ============================================================================
-- RESULT
-- ============================================================================
-- ✅ owners.org_id: NOW NULLABLE (for global registration)
-- ✅ owners: Added registered_at, preferred_orgs
-- ✅ dogs.org_id: NOW NULLABLE (for unassociated dogs)
-- ✅ dogs: Added registered_at
-- ✅ applications: NEW TABLE (core of booking flow)
-- ✅ RLS: ENABLED on applications
-- ============================================================================
