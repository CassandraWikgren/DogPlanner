-- ============================================================================
-- MIGRATION: Add accepting_applications flag to orgs
-- Date: 2025-12-06
-- Purpose: Control which organizations appear in customer application lists
-- ============================================================================
-- Business Logic:
-- - When org subscription is active AND accepting_applications = true → visible
-- - When org stops paying → accepting_applications = false → hidden from lists
-- - When org resumes payment → accepting_applications = true → visible again
-- ============================================================================

-- ============================================================================
-- ADD COLUMN
-- ============================================================================
-- Add flag to control if org accepts new applications/bookings
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS accepting_applications BOOLEAN DEFAULT true;

-- Create index for faster queries (used in customer-facing lists)
CREATE INDEX IF NOT EXISTS idx_orgs_accepting_applications 
  ON orgs(accepting_applications) 
  WHERE accepting_applications = true;

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_orgs_active_accepting 
  ON orgs(subscription_status, accepting_applications)
  WHERE subscription_status = 'active' AND accepting_applications = true;

COMMENT ON COLUMN orgs.accepting_applications IS 
  'Controls if organization appears in customer application lists. Set to false when subscription inactive/payment fails. Set to true when subscription becomes active.';

-- ============================================================================
-- INITIAL DATA UPDATE
-- ============================================================================
-- Set accepting_applications based on current subscription_status
UPDATE orgs 
  SET accepting_applications = CASE 
    WHEN subscription_status IN ('active', 'trialing') THEN true
    ELSE false
  END
  WHERE accepting_applications IS NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the migration worked:
/*
SELECT 
  id,
  org_name,
  subscription_status,
  accepting_applications,
  CASE 
    WHEN subscription_status IN ('active', 'trialing') AND accepting_applications THEN '✅ Visible to customers'
    WHEN subscription_status IN ('active', 'trialing') AND NOT accepting_applications THEN '⚠️ Active but not accepting'
    WHEN subscription_status NOT IN ('active', 'trialing') AND accepting_applications THEN '⚠️ Inactive but accepting'
    ELSE '❌ Hidden from customers'
  END as visibility_status
FROM orgs
ORDER BY org_name;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ orgs.accepting_applications column added (default: true)
-- ✅ Indexes created for performance
-- ✅ Existing orgs updated based on subscription_status
-- ✅ Inactive/canceled subscriptions → accepting_applications = false
-- ✅ Active/trialing subscriptions → accepting_applications = true
--
-- NEXT STEPS:
-- 1. Update webhook to handle subscription changes
-- 2. Update customer-facing queries to filter by accepting_applications
-- 3. Handle Stripe events: payment_failed, subscription.deleted, payment_succeeded
