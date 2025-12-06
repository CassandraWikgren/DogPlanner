-- ============================================================================
-- MIGRATION: Add booking status tracking FOR HUNDPENSIONAT (BOARDING)
-- Date: 2025-12-05
-- Purpose: Separate active pensionat bookings from completed ones
-- ============================================================================

-- ============================================================================
-- ADD STATUS COLUMN
-- ============================================================================
-- First, drop the old constraint if it exists
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add or update status column with new values
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- Add new constraint with updated values
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed', 'no-show'));

-- ============================================================================
-- UPDATE EXISTING BOOKINGS
-- ============================================================================
-- Mark bookings that already passed as 'completed' (using end_date, not checkout_date)
UPDATE bookings 
  SET status = 'completed' 
  WHERE end_date < NOW() 
    AND status IN ('confirmed', 'checked_in', 'checked_out')
    OR (end_date < NOW() AND status IS NULL);

-- ============================================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================================
-- When end_date passes, automatically mark as completed
CREATE OR REPLACE FUNCTION update_booking_status_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is in the past and status is still active, mark as completed
  IF NEW.end_date <= NOW() AND NEW.status IN ('confirmed', 'checked_in', 'checked_out') THEN
    NEW.status := 'completed';
  -- Handle NULL status (legacy bookings)
  ELSIF NEW.end_date <= NOW() AND NEW.status IS NULL THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS booking_auto_complete_trigger ON bookings;

-- Create new trigger
CREATE TRIGGER booking_auto_complete_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status_on_checkout();

-- ============================================================================
-- PERIODIC COMPLETION FUNCTION
-- ============================================================================
-- Function to complete bookings that passed their end_date without being updated
-- Can be called manually or scheduled via pg_cron
CREATE OR REPLACE FUNCTION complete_past_bookings()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'completed', updated_at = NOW()
  WHERE end_date < NOW()
    AND status IN ('confirmed', 'checked_in', 'checked_out');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_past_bookings() IS 
'Marks all bookings with past end_date as completed. Run periodically (e.g., daily via cron).';

-- ============================================================================
-- PERFORMANCE INDEX
-- ============================================================================
-- Index for faster queries on status + end_date (used in BookingsView and reports)
CREATE INDEX IF NOT EXISTS idx_bookings_status_end_date 
  ON bookings(status, end_date);

COMMENT ON INDEX idx_bookings_status_end_date IS 
'Speeds up queries filtering by status and date range';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the migration worked:
/*
SELECT 
  id,
  start_date,
  end_date,
  status,
  CASE 
    WHEN end_date < NOW() THEN 'Should be completed'
    ELSE 'Should be confirmed'
  END as expected_status
FROM bookings
ORDER BY end_date DESC
LIMIT 10;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ bookings.status column added (default: 'confirmed')
-- ✅ Existing bookings with past end_date marked as 'completed'
-- ✅ Automatic trigger updates status when end_date passes
-- ✅ Supports: 'confirmed', 'completed', 'cancelled', 'no-show'
-- ✅ FOR HUNDPENSIONAT (BOARDING) ONLY
