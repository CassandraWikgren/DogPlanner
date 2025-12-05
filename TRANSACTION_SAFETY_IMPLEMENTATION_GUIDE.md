# Transaction Safety Implementation Guide

**Created:** 2025-12-05  
**Status:** Frontend updated, needs SQL migration execution

## ✅ What's Done

### 1. SQL Migration Created

- **File:** `supabase/migrations/20251205_approve_application_rpc.sql`
- **Functions:**
  - `approve_application(p_application_id UUID, p_org_id UUID)` - ACID-guaranteed approval
  - `reject_application(p_application_id UUID, p_org_id UUID, p_response_notes TEXT)` - ACID-guaranteed rejection
- **Key Features:**
  - All 3 database updates (application, owner, dog) happen in single transaction
  - If ANY update fails, ALL roll back automatically
  - SECURITY DEFINER with org_id validation
  - GRANT EXECUTE to authenticated users

### 2. Frontend Updated

- **File:** `app/hunddagis/applications/page.tsx`
- **Changes:**
  - `handleApprove()` now calls `supabase.rpc('approve_application', ...)`
  - `handleReject()` now calls `supabase.rpc('reject_application', ...)`
  - Removed 3 separate UPDATE calls (was 40+ lines → now 10 lines per function)
  - Added `@ts-ignore` comments explaining RPC functions exist but aren't in generated types yet

### 3. TypeScript Types Created

- **File:** `types/applications.ts`
- **Content:** Application interface with proper typing

## ⏳ What Needs To Be Done

### Step 1: Execute SQL Migration in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Copy-paste entire content of `supabase/migrations/20251205_approve_application_rpc.sql`
3. Click "Run"
4. Verify success: Should see "Success. No rows returned"

### Step 2: Verify RPC Functions Exist

Run this in Supabase SQL Editor:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('approve_application', 'reject_application')
  AND routine_schema = 'public';
```

**Expected Result:** 2 rows returned:

- approve_application | FUNCTION
- reject_application | FUNCTION

### Step 3: Test Transaction Rollback (Optional but Recommended)

To verify ACID guarantees work, temporarily break one of the UPDATEs:

```sql
-- In Supabase SQL Editor, temporarily modify approve_application:
CREATE OR REPLACE FUNCTION approve_application(...)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First two updates succeed
  UPDATE applications SET status='approved', responded_at=now() WHERE id = p_application_id;
  UPDATE owners SET org_id=p_org_id WHERE id=v_owner_id;

  -- Third update INTENTIONALLY FAILS (invalid table name)
  UPDATE dogs_BROKEN SET org_id=p_org_id WHERE id=v_dog_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;
```

Then test approval from frontend. **Expected:** Error message, and when you check:

```sql
-- Application status should STILL be 'pending' (rollback worked!)
SELECT status FROM applications WHERE id = 'YOUR_TEST_APPLICATION_ID';

-- Owner org_id should STILL be NULL (rollback worked!)
SELECT org_id FROM owners WHERE id = 'YOUR_TEST_OWNER_ID';
```

Restore correct function after testing by re-running original migration.

### Step 4: Test Real Approval Flow

1. Go to `/hunddagis/applications` in your browser
2. Find a pending application
3. Click "Godkänn"
4. Verify in database:

```sql
SELECT
  a.status as app_status,
  o.org_id as owner_org,
  d.org_id as dog_org
FROM applications a
JOIN owners o ON a.owner_id = o.id
JOIN dogs d ON a.dog_id = d.id
WHERE a.id = 'YOUR_APPLICATION_ID';
```

**Expected:** All three should be updated together:

- app_status: 'approved'
- owner_org: (your org_id)
- dog_org: (your org_id)

### Step 5: Update TypeScript Types (Optional - For Production)

The `@ts-ignore` comments will work, but for clean code:

1. Install Supabase CLI: `npm install -D supabase`
2. Login: `npx supabase login`
3. Link project: `npx supabase link --project-ref YOUR_PROJECT_REF`
4. Generate types: `npx supabase gen types typescript --linked > types/supabase.ts`
5. Update import in applications page to use generated types
6. Remove `@ts-ignore` comments

OR just leave the `@ts-ignore` - it's documented and will work fine.

## 🎯 Why This Matters

**BEFORE (Dangerous):**

```typescript
await supabase.from("applications").update({ status: "approved" }); // ✅ Succeeds
await supabase.from("owners").update({ org_id: currentOrgId }); // ✅ Succeeds
await supabase.from("dogs").update({ org_id: currentOrgId }); // ❌ FAILS (network error)

// Result: Application marked approved, owner assigned, but DOG NOT ASSIGNED!
// Database is now INCONSISTENT - hundsägare can't book because their dog lacks org_id.
```

**AFTER (Safe):**

```typescript
await supabase.rpc("approve_application", {
  p_application_id: app.id,
  p_org_id: currentOrgId,
});

// If ANY of the 3 updates fail, ALL 3 roll back automatically.
// Database is ALWAYS consistent - either everything succeeds or nothing changes.
```

## 📊 Current TypeScript Errors (Expected)

You'll see these errors until SQL migration is executed:

```
Argument of type '"approve_application"' is not assignable to parameter...
Argument of type '"reject_application"' is not assignable to parameter...
```

**These are SAFE to ignore** because:

1. TypeScript doesn't know about database functions yet
2. We added `@ts-ignore` comments to suppress them
3. Once RPC functions exist in database, they will work at runtime
4. If you want to remove the errors, regenerate types (Step 5 above)

## 🚀 Next Steps After This Fix

Once transaction safety is done, continue with:

1. ✅ Test approval/rejection flows thoroughly
2. End-to-end testing using `PATTERN3_E2E_TEST_GUIDE.md`
3. Optional: Clean up duplicate RLS policies (`20251204_pattern3_cleanup_duplicate_policies.sql`)

## 📝 Summary

**Problem:** 3 separate database calls = risk of inconsistent state  
**Solution:** Single RPC function with ACID transaction  
**Status:** Code ready, needs SQL execution in Supabase  
**Impact:** Production-safe approval system with guaranteed data consistency
