-- Harden profiles: ensure org_id is not null after backfilling
-- Run AFTER running backfill_orphaned_users.sql

-- Verify no NULLs remain
SELECT count(*) AS profiles_with_null_org
FROM profiles
WHERE org_id IS NULL;

-- If zero, enforce constraint
ALTER TABLE profiles
  ALTER COLUMN org_id SET NOT NULL;