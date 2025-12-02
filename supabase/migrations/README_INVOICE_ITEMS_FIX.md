# Database Migration: Fix Invoice Items Relation

**Date:** 2 December 2025  
**Priority:** HIGH - Critical for invoice functionality

## Problem

Ekonomi-sidan kunde inte hämta fakturor från databasen. Felet var:

```
PGRS208: Could not find a relationship between 'invoices' and 'invoice_items'
400 Bad Request - No API key found
```

## Root Cause

1. **Missing Foreign Key Constraint**: Relationen mellan `invoices` och `invoice_items` var inte korrekt definierad
2. **Missing RLS Policies**: `invoice_items` saknade Row Level Security policies
3. **Missing Indexes**: Ingen index på `invoice_id` kolumnen

## Solution

Created migration: `20251202_fix_invoice_items_relation.sql`

### Changes Made:

1. **Ensured table structure**:
   - Foreign key: `invoice_id` → `invoices(id)` ON DELETE CASCADE
   - Optional booking reference: `booking_id` → `bookings(id)`
   - Generated column: `amount = qty * unit_price` (NEVER write to this!)

2. **Created indexes**:
   - `idx_invoice_items_invoice_id` - Fast lookups by invoice
   - `idx_invoice_items_booking_id` - Fast lookups by booking

3. **Added RLS Policies**:
   - SELECT: Users can view items for invoices in their org
   - INSERT: Users can create items for invoices in their org
   - UPDATE: Users can update items for invoices in their org
   - DELETE: Users can delete items for invoices in their org

4. **Restored ekonomi query**:
   - Re-added `invoice_items` to the query after database fix
   - Removed nested `booking` and `dog` to simplify (can add later if needed)

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `20251202_fix_invoice_items_relation.sql`
3. Click "Run"

### Option 2: Supabase CLI

```bash
supabase db push
```

## Verification

After applying migration, verify:

```sql
-- Check foreign key exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'invoice_items'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Check RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'invoice_items';

-- Check indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'invoice_items';
```

## Testing

1. Login to app
2. Navigate to `/ekonomi`
3. Verify fakturor visas
4. Check browser console for errors (should be none)

## Rollback (if needed)

If something goes wrong:

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Users can view invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their org" ON invoice_items;

-- Disable RLS
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
```

## Long-term Stability

This fix ensures:

- ✅ **Robust relations**: Foreign keys properly defined
- ✅ **Security**: RLS policies protect data
- ✅ **Performance**: Indexes for fast queries
- ✅ **Maintainability**: Well-documented structure

## Related Files

- `/supabase/migrations/20251202_fix_invoice_items_relation.sql` - Database migration
- `/app/ekonomi/page.tsx` - Updated query to include invoice_items
- `/supabase/migrations/20251202120000_fix_invoice_triggers.sql` - Trigger fixes (already applied)

## Notes

- `amount` column is GENERATED - never insert/update it directly
- Always use `qty` and `unit_price` when inserting rows
- Foreign key has CASCADE delete - deleting invoice deletes all items

---

**Status:** ✅ Ready to apply  
**Impact:** Critical - fixes invoice display  
**Risk:** Low - only adds missing constraints and policies
