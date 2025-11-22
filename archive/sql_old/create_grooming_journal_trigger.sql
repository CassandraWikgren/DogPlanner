-- =====================================================
-- AUTO-CREATE GROOMING JOURNAL WHEN BOOKING COMPLETED
-- =====================================================
-- This trigger automatically creates a grooming_journal entry
-- when a grooming_booking status changes to 'completed'
-- 
-- Created: 2025-11-21
-- Purpose: Eliminate manual journal creation after appointments
-- =====================================================

-- Function to auto-create journal entry
CREATE OR REPLACE FUNCTION auto_create_grooming_journal()
RETURNS TRIGGER AS $$
DECLARE
  v_dog_id UUID;
  v_owner_id UUID;
BEGIN
  -- Only proceed if status changed TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if journal entry already exists for this booking
    IF EXISTS (
      SELECT 1 FROM grooming_journal 
      WHERE booking_id = NEW.id
    ) THEN
      -- Journal already exists, skip
      RETURN NEW;
    END IF;

    -- For existing dogs: Get owner_id from dogs table
    IF NEW.dog_id IS NOT NULL THEN
      SELECT owner_id INTO v_owner_id
      FROM dogs
      WHERE id = NEW.dog_id;
      
      -- Create journal entry with dog_id and owner_id
      INSERT INTO grooming_journal (
        org_id,
        dog_id,
        owner_id,
        booking_id,
        appointment_date,
        clip_length,
        shampoo_type,
        special_treatments,
        notes,
        duration_minutes,
        total_price,
        groomer_notes,
        created_at
      ) VALUES (
        NEW.org_id,
        NEW.dog_id,
        v_owner_id,
        NEW.id,
        NEW.appointment_date,
        COALESCE(NEW.clip_length, ''),
        COALESCE(NEW.shampoo_type, ''),
        NEW.service_type,
        NEW.notes,
        NULL, -- duration calculated from actual time
        NEW.estimated_price,
        'Auto-skapad från bokning',
        NOW()
      );
      
    -- For walk-in customers: Use external_* fields
    ELSE
      INSERT INTO grooming_journal (
        org_id,
        booking_id,
        appointment_date,
        external_customer_name,
        external_customer_phone,
        external_dog_name,
        external_dog_breed,
        clip_length,
        shampoo_type,
        special_treatments,
        notes,
        duration_minutes,
        total_price,
        groomer_notes,
        created_at
      ) VALUES (
        NEW.org_id,
        NEW.id,
        NEW.appointment_date,
        NEW.external_customer_name,
        NEW.external_customer_phone,
        NEW.external_dog_name,
        NEW.external_dog_breed,
        COALESCE(NEW.clip_length, ''),
        COALESCE(NEW.shampoo_type, ''),
        NEW.service_type,
        NEW.notes,
        NULL,
        NEW.estimated_price,
        'Auto-skapad från walk-in bokning',
        NOW()
      );
    END IF;
    
    RAISE NOTICE 'Auto-created grooming journal entry for booking %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_grooming_journal ON grooming_bookings;

-- Create trigger on grooming_bookings
CREATE TRIGGER trigger_auto_create_grooming_journal
  AFTER UPDATE OF status ON grooming_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_grooming_journal();

-- Add booking_id column to grooming_journal if not exists
ALTER TABLE grooming_journal 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES grooming_bookings(id) ON DELETE SET NULL;

-- Add clip_length and shampoo_type to grooming_bookings if not exists
ALTER TABLE grooming_bookings 
ADD COLUMN IF NOT EXISTS clip_length TEXT,
ADD COLUMN IF NOT EXISTS shampoo_type TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grooming_journal_booking_id ON grooming_journal(booking_id);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_status ON grooming_bookings(status);

COMMENT ON FUNCTION auto_create_grooming_journal() IS 
'Automatically creates grooming_journal entry when booking status changes to completed. Handles both existing dogs (with dog_id) and walk-in customers (with external_* fields).';

COMMENT ON COLUMN grooming_journal.booking_id IS 
'Reference to the grooming_booking that created this journal entry. NULL if manually created.';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify trigger is installed:
-- 
-- SELECT 
--   trigger_name, 
--   event_manipulation, 
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_auto_create_grooming_journal';
-- =====================================================
