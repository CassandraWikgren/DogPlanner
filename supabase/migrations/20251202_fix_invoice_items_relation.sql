-- ============================================================
-- Migration: Fix invoice_items relation and RLS policies
-- ============================================================
-- Date: 2025-12-02 14:00:00
-- Issue: Supabase query failing with "Could not find relationship between invoices and invoice_items"
-- Fix: Ensure foreign key exists, add proper RLS policies, create proper indexes
-- ============================================================

-- ============================================================
-- 1. Ensure invoice_items table exists with correct structure
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC GENERATED ALWAYS AS (qty * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
  ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_booking_id 
  ON invoice_items(booking_id) WHERE booking_id IS NOT NULL;

-- ============================================================
-- 3. Add updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_invoice_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_invoice_items_updated_at ON invoice_items;

CREATE TRIGGER trg_update_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_items_updated_at();

-- ============================================================
-- 4. RLS Policies for invoice_items
-- ============================================================

-- Enable RLS
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their org" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their org" ON invoice_items;

-- Create comprehensive RLS policies

-- SELECT: Users can view invoice_items for invoices in their org
CREATE POLICY "Users can view invoice items for their org"
ON invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    INNER JOIN profiles p ON i.org_id = p.org_id
    WHERE i.id = invoice_items.invoice_id
    AND p.id = auth.uid()
  )
);

-- INSERT: Users can create invoice_items for invoices in their org
CREATE POLICY "Users can insert invoice items for their org"
ON invoice_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    INNER JOIN profiles p ON i.org_id = p.org_id
    WHERE i.id = invoice_items.invoice_id
    AND p.id = auth.uid()
  )
);

-- UPDATE: Users can update invoice_items for invoices in their org
CREATE POLICY "Users can update invoice items for their org"
ON invoice_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    INNER JOIN profiles p ON i.org_id = p.org_id
    WHERE i.id = invoice_items.invoice_id
    AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    INNER JOIN profiles p ON i.org_id = p.org_id
    WHERE i.id = invoice_items.invoice_id
    AND p.id = auth.uid()
  )
);

-- DELETE: Users can delete invoice_items for invoices in their org
CREATE POLICY "Users can delete invoice items for their org"
ON invoice_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    INNER JOIN profiles p ON i.org_id = p.org_id
    WHERE i.id = invoice_items.invoice_id
    AND p.id = auth.uid()
  )
);

-- ============================================================
-- 5. Grant necessary permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- 6. Comments for documentation
-- ============================================================

COMMENT ON TABLE invoice_items IS 'Invoice line items with automatic amount calculation (qty * unit_price)';
COMMENT ON COLUMN invoice_items.amount IS 'GENERATED COLUMN - automatically calculated as qty * unit_price. NEVER insert/update this column directly!';
COMMENT ON COLUMN invoice_items.invoice_id IS 'Foreign key to invoices table with CASCADE delete';
COMMENT ON COLUMN invoice_items.booking_id IS 'Optional reference to booking (for traceability)';

-- ============================================================
-- Migration complete
-- ============================================================
