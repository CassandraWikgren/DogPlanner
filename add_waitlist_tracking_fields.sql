-- ============================================================
-- FÖRBÄTTRAD VÄNTELISTA - LÄGG TILL TRACKINGFÄLT
-- ============================================================
-- Inspiration från Pluto/Changdobels väntelista
-- 
-- Nya fält för att spåra:
-- 1. Första kontakt (datum + anteckning)
-- 2. Bokad visning (datum + status)
-- 3. Genomförd visning (datum + resultat)
-- 4. Ytterligare kontakter (JSONB array)
--
-- KÖR I: Supabase SQL Editor
-- ============================================================

BEGIN;

-- Lägg till fält i interest_applications för bättre spårning
ALTER TABLE interest_applications
ADD COLUMN IF NOT EXISTS first_contact_date date,
ADD COLUMN IF NOT EXISTS first_contact_notes text,
ADD COLUMN IF NOT EXISTS visit_booked_date date,
ADD COLUMN IF NOT EXISTS visit_status text CHECK (visit_status IN ('booked', 'completed', 'cancelled', 'no_show')),
ADD COLUMN IF NOT EXISTS visit_completed_date date,
ADD COLUMN IF NOT EXISTS visit_result text CHECK (visit_result IN ('approved', 'declined', 'waiting', 'not_suitable')),
ADD COLUMN IF NOT EXISTS contact_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0, -- 0=normal, 1=hög, -1=låg
ADD COLUMN IF NOT EXISTS expected_start_month text; -- "2025-12", "2026-01" etc

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS idx_interest_visit_booked ON interest_applications(visit_booked_date) WHERE visit_booked_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interest_status ON interest_applications(status);
CREATE INDEX IF NOT EXISTS idx_interest_priority ON interest_applications(priority);

COMMIT;

-- ============================================================
-- EXEMPEL PÅ ANVÄNDNING:
-- ============================================================

-- Uppdatera när man kontaktar någon första gången:
UPDATE interest_applications
SET 
  first_contact_date = '2025-11-19',
  first_contact_notes = 'Ringde upp, lämnade meddelande',
  status = 'contacted'
WHERE id = 'xxx-uuid-here';

-- Boka in visning:
UPDATE interest_applications
SET 
  visit_booked_date = '2025-11-25',
  visit_status = 'booked'
WHERE id = 'xxx-uuid-here';

-- Efter visning:
UPDATE interest_applications
SET 
  visit_completed_date = '2025-11-25',
  visit_status = 'completed',
  visit_result = 'approved'
WHERE id = 'xxx-uuid-here';

-- Lägg till fler kontakter i historiken:
UPDATE interest_applications
SET contact_history = contact_history || jsonb_build_array(
  jsonb_build_object(
    'date', '2025-11-20',
    'type', 'phone',
    'note', 'Ringde igen, ska fundera'
  )
)
WHERE id = 'xxx-uuid-here';

-- ============================================================
