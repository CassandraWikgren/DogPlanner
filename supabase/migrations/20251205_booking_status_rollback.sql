-- ============================================================================
-- ROLLBACK: Remove booking status tracking
-- Date: 2025-12-05
-- Purpose: Revert booking status system if issues occur
-- ============================================================================
-- WARNING: This will permanently delete the status column and all status data
-- Make sure to backup data before running if you need to preserve status history
-- ============================================================================

-- Drop the performance index
DROP INDEX IF EXISTS idx_bookings_status_end_date;

-- Drop the periodic completion function
DROP FUNCTION IF EXISTS complete_past_bookings();

-- Drop the trigger
DROP TRIGGER IF EXISTS booking_auto_complete_trigger ON bookings;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_booking_status_on_checkout();

-- Remove the status column (this will delete all status data!)
ALTER TABLE bookings DROP COLUMN IF EXISTS status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify rollback completed successfully:
/*
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'status';
-- Should return no rows if rollback was successful
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Dropped index idx_bookings_status_end_date
-- ✅ Dropped function complete_past_bookings()
-- ✅ Dropped trigger booking_auto_complete_trigger
-- ✅ Dropped function update_booking_status_on_checkout()
-- ✅ Removed bookings.status column
-- ⚠️  All status data has been permanently deleted
