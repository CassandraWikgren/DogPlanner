-- =====================================================
-- TEST SCRIPT FOR GROOMING JOURNAL AUTO-CREATION TRIGGER
-- =====================================================
-- Run this AFTER running create_grooming_journal_trigger.sql
-- =====================================================

-- STEP 1: Find a real booking to test with
SELECT 
  id,
  dog_id,
  appointment_date,
  appointment_time,
  service_type,
  status,
  CASE 
    WHEN dog_id IS NOT NULL THEN 'Befintlig hund'
    ELSE 'Walk-in kund'
  END as customer_type
FROM grooming_bookings
WHERE status = 'confirmed'
ORDER BY appointment_date DESC
LIMIT 5;

-- =====================================================
-- STEP 2: Copy one of the IDs above and paste it below
-- =====================================================

-- Example: UPDATE grooming_bookings 
-- SET status = 'completed' 
-- WHERE id = 'PASTE_REAL_UUID_HERE';

-- =====================================================
-- STEP 3: Verify journal was auto-created
-- =====================================================

-- Check if journal entry was created:
SELECT 
  gj.id,
  gj.dog_id,
  gj.booking_id,
  gj.appointment_date,
  gj.clip_length,
  gj.shampoo_type,
  gj.external_customer_name,
  gj.external_dog_name,
  gj.groomer_notes,
  gj.created_at
FROM grooming_journal gj
WHERE gj.booking_id IS NOT NULL
ORDER BY gj.created_at DESC
LIMIT 10;

-- =====================================================
-- ALTERNATIVE: Test with a specific dog
-- =====================================================

-- Find bookings for a specific dog:
SELECT 
  gb.id,
  gb.status,
  gb.appointment_date,
  gb.service_type,
  d.name as dog_name,
  o.full_name as owner_name
FROM grooming_bookings gb
LEFT JOIN dogs d ON gb.dog_id = d.id
LEFT JOIN owners o ON d.owner_id = o.id
WHERE gb.status = 'confirmed'
  AND gb.dog_id IS NOT NULL
ORDER BY gb.appointment_date DESC
LIMIT 5;

-- =====================================================
-- ROLLBACK TEST (if needed)
-- =====================================================

-- If you want to test again, you can:
-- 1. Delete the auto-created journal entry:
-- DELETE FROM grooming_journal WHERE booking_id = 'YOUR_BOOKING_ID';

-- 2. Reset the booking status:
-- UPDATE grooming_bookings SET status = 'confirmed' WHERE id = 'YOUR_BOOKING_ID';

-- 3. Then test again by setting status = 'completed'

-- =====================================================
-- FULL TEST WORKFLOW EXAMPLE
-- =====================================================

/*
-- 1. Find a booking
SELECT id, dog_id, status FROM grooming_bookings WHERE status = 'confirmed' LIMIT 1;

-- 2. Let's say the ID is: 'abc123-def456-...'
-- Mark it as completed
UPDATE grooming_bookings SET status = 'completed' WHERE id = 'abc123-def456-...';

-- 3. Check if journal was created
SELECT * FROM grooming_journal WHERE booking_id = 'abc123-def456-...';

-- 4. If it worked, you should see a new journal entry!
*/
