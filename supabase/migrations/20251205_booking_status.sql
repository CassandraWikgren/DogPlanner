-- ============================================================================
-- MIGRATION: Add booking status tracking FOR HUNDPENSIONAT (BOARDING)
-- Date: 2025-12-05
-- Purpose: Separate active pensionat bookings from completed ones
-- ============================================================================

-- ============================================================================
-- ADD STATUS COLUMN
-- ============================================================================
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no-show'));

-- ============================================================================
-- UPDATE EXISTING BOOKINGS
-- ============================================================================
-- Mark bookings that already passed as 'completed' (using end_date, not checkout_date)
UPDATE bookings 
  SET status = 'completed' 
  WHERE end_date < NOW() 
    AND (status = 'confirmed' OR status IS NULL);

-- ============================================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================================
-- When end_date passes, automatically mark as completed
CREATE OR REPLACE FUNCTION update_booking_status_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is in the past and status is still confirmed, mark as completed
  IF NEW.end_date <= NOW() AND (NEW.status = 'confirmed' OR NEW.status IS NULL) THEN
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
