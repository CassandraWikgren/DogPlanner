-- ============================================================================
-- MIGRATION: Add booking status tracking
-- Date: 2025-12-05
-- Purpose: Separate active bookings from completed ones
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
-- Mark bookings that already passed as 'completed'
UPDATE bookings 
  SET status = 'completed' 
  WHERE checkout_date < NOW() 
    AND status = 'confirmed';

-- ============================================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================================
-- When checkout_date passes, automatically mark as completed
CREATE OR REPLACE FUNCTION update_booking_status_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- If checkout is in the past and status is still confirmed, mark as completed
  IF NEW.checkout_date <= NOW() AND NEW.status = 'confirmed' THEN
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
  checkout_date,
  status,
  CASE 
    WHEN checkout_date < NOW() THEN 'Should be completed'
    ELSE 'Should be confirmed'
  END as expected_status
FROM bookings
ORDER BY checkout_date DESC
LIMIT 10;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ bookings.status column added (default: 'confirmed')
-- ✅ Existing bookings with past checkout_date marked as 'completed'
-- ✅ Automatic trigger updates status when checkout_date passes
-- ✅ Supports: 'confirmed', 'completed', 'cancelled', 'no-show'
