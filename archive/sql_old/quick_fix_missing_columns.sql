-- ============================================================================
-- QUICK FIX - Lägg till saknade kolumner
-- ============================================================================
-- Kör detta om test_invoice_system.sql visar MISSING

-- Fix 1: Lägg till sent_at i invoices
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN sent_at timestamptz;
    RAISE NOTICE '✅ sent_at kolumn tillagd';
  ELSE
    RAISE NOTICE 'ℹ️  sent_at kolumn finns redan';
  END IF;
END $$;

-- Fix 2: Lägg till län i orgs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'lan'
  ) THEN
    ALTER TABLE orgs ADD COLUMN lan text;
    RAISE NOTICE '✅ lan kolumn tillagd';
  ELSE
    RAISE NOTICE 'ℹ️  lan kolumn finns redan';
  END IF;
END $$;

-- Fix 3: Lägg till kommun i orgs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'kommun'
  ) THEN
    ALTER TABLE orgs ADD COLUMN kommun text;
    RAISE NOTICE '✅ kommun kolumn tillagd';
  ELSE
    RAISE NOTICE 'ℹ️  kommun kolumn finns redan';
  END IF;
END $$;

-- Fix 4: Lägg till service_types i orgs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'service_types'
  ) THEN
    ALTER TABLE orgs ADD COLUMN service_types text[];
    RAISE NOTICE '✅ service_types kolumn tillagd';
  ELSE
    RAISE NOTICE 'ℹ️  service_types kolumn finns redan';
  END IF;
END $$;

-- Verifiera att allt är OK nu
SELECT 
  'sent_at' as kolumn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sent_at')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'lan' as kolumn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'lan')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'kommun' as kolumn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'kommun')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'service_types' as kolumn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'service_types')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;
