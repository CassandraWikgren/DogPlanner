-- Fix RLS policies for extra_service table
-- Add end_date column and foreign key to extra_services
-- Replace overly permissive "Allow all" policy with granular policies

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_service' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE extra_service ADD COLUMN end_date date;
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_service' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE extra_service ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add service_id column for foreign key to extra_services
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_service' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE extra_service ADD COLUMN service_id uuid REFERENCES extra_services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on service_id for performance
CREATE INDEX IF NOT EXISTS idx_extra_service_service_id ON extra_service(service_id);

-- Drop old policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON extra_service;

-- Create granular RLS policies
CREATE POLICY "extra_service_select" 
  ON extra_service 
  FOR SELECT 
  TO authenticated 
  USING (
    org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "extra_service_insert" 
  ON extra_service 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "extra_service_update" 
  ON extra_service 
  FOR UPDATE 
  TO authenticated 
  USING (
    org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "extra_service_delete" 
  ON extra_service 
  FOR DELETE 
  TO authenticated 
  USING (
    org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
  );
