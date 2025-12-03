-- ============================================================
-- FÖRBÄTTRINGAR - Spårbarhet och Optimering
-- Skapad: 3 December 2025
-- ============================================================

-- ============================================================
-- 1. INTRESSEANMÄLNINGAR - SPÅRBARHET
-- ============================================================
-- Lägg till kolumner för att spåra vilka hundar/ägare som skapades från intresseanmälan

ALTER TABLE interest_applications 
ADD COLUMN IF NOT EXISTS created_dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;

COMMENT ON COLUMN interest_applications.created_dog_id IS 
'Hund som skapades från denna intresseanmälan (för spårbarhet av konverteringsgrad)';

COMMENT ON COLUMN interest_applications.created_owner_id IS 
'Ägare som skapades från denna intresseanmälan (för spårbarhet av konverteringsgrad)';

-- Index för snabbare queries
CREATE INDEX IF NOT EXISTS idx_interest_apps_created_dog 
ON interest_applications(created_dog_id) WHERE created_dog_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interest_apps_created_owner 
ON interest_applications(created_owner_id) WHERE created_owner_id IS NOT NULL;

-- ============================================================
-- 2. HUNDJOURNAL - TA BORT REDUNDANT KOLUMN
-- ============================================================
-- Tabellen dog_journal har både 'text' och 'content' kolumner
-- Koden använder bara 'content', så vi tar bort 'text'

-- VIKTIGT: Först kopiera över data om det finns något i 'text' som inte finns i 'content'
UPDATE dog_journal 
SET content = COALESCE(NULLIF(content, ''), text)
WHERE content IS NULL OR content = '';

-- Ta bort redundant kolumn
ALTER TABLE dog_journal 
DROP COLUMN IF EXISTS text;

COMMENT ON COLUMN dog_journal.content IS 
'Journaltext (ENDAST denna kolumn används - redundant "text"-kolumn borttagen 2025-12-03)';

-- ============================================================
-- 3. JOURNAL - SPECIFIK 2-ÅRS RETENTION (GDPR)
-- ============================================================
-- Automatisk rensning av gamla journalanteckningar enligt GDPR

CREATE OR REPLACE FUNCTION enforce_journal_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Radera journalanteckningar äldre än 2 år
  DELETE FROM dog_journal 
  WHERE created_at < NOW() - INTERVAL '2 years';

  -- Radera frisörjournaler äldre än 2 år
  DELETE FROM grooming_journal
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$;

COMMENT ON FUNCTION enforce_journal_retention() IS 
'GDPR-compliant: Raderar journalanteckningar äldre än 2 år. Körs automatiskt via cron.';

-- ============================================================
-- 4. ANALYTICS - BELÄGGNINGSGRAD OCH STATISTIK VIEWS
-- ============================================================

-- View för beläggningsgrad per månad (Hunddagis)
-- Baserad på faktiskt schema: daycare_service_completions har scheduled_date och completed_at
CREATE OR REPLACE VIEW analytics_daycare_occupancy AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  DATE_TRUNC('month', dsc.scheduled_date) as month,
  COUNT(DISTINCT dsc.dog_id) as unique_dogs,
  COUNT(*) as total_services,
  COUNT(CASE WHEN dsc.completed_at IS NOT NULL THEN 1 END) as completed_services,
  ROUND(
    100.0 * COUNT(CASE WHEN dsc.completed_at IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0), 
    1
  ) as completion_rate_percent
FROM daycare_service_completions dsc
JOIN orgs o ON o.id = dsc.org_id
GROUP BY o.id, o.name, DATE_TRUNC('month', dsc.scheduled_date)
ORDER BY month DESC, org_name;

COMMENT ON VIEW analytics_daycare_occupancy IS 
'Analytics: Beläggningsgrad för hunddagis per månad. Baserad på scheduled_date och completed_at från daycare_service_completions.';

-- View för beläggningsgrad per månad (Hundpensionat)
CREATE OR REPLACE VIEW analytics_boarding_occupancy AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  DATE_TRUNC('month', b.start_date) as month,
  COUNT(DISTINCT b.dog_id) as unique_dogs,
  COUNT(*) as total_bookings,
  SUM(b.end_date - b.start_date) as total_nights,
  ROUND(AVG(b.total_price), 2) as avg_booking_value
FROM bookings b
JOIN orgs o ON o.id = b.org_id
WHERE b.status IN ('confirmed', 'checked_in', 'checked_out')
GROUP BY o.id, o.name, DATE_TRUNC('month', b.start_date)
ORDER BY month DESC, org_name;

COMMENT ON VIEW analytics_boarding_occupancy IS 
'Analytics: Beläggningsgrad för hundpensionat per månad';

-- View för intäktsanalys per tjänst
CREATE OR REPLACE VIEW analytics_revenue_by_service AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  DATE_TRUNC('month', i.invoice_date) as month,
  i.invoice_type,
  COUNT(*) as invoice_count,
  SUM(i.total_amount) as total_revenue,
  ROUND(AVG(i.total_amount), 2) as avg_invoice_amount
FROM invoices i
JOIN orgs o ON o.id = i.org_id
WHERE i.status IN ('sent', 'paid')
  AND i.deleted_at IS NULL
GROUP BY o.id, o.name, DATE_TRUNC('month', i.invoice_date), i.invoice_type
ORDER BY month DESC, org_name, invoice_type;

COMMENT ON VIEW analytics_revenue_by_service IS 
'Analytics: Intäkter per tjänst (prepayment/afterpayment/full) per månad';

-- View för populäraste hundraser
CREATE OR REPLACE VIEW analytics_popular_breeds AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  d.breed,
  COUNT(*) as dog_count,
  ROUND(AVG(d.heightcm), 1) as avg_height_cm
FROM dogs d
JOIN orgs o ON o.id = d.org_id
WHERE d.is_active = true
  AND d.is_deleted = false
  AND d.breed IS NOT NULL
GROUP BY o.id, o.name, d.breed
HAVING COUNT(*) >= 2
ORDER BY org_name, dog_count DESC;

COMMENT ON VIEW analytics_popular_breeds IS 
'Analytics: Populäraste hundraser per organisation';

-- View för konverteringsgrad från intresseanmälan
CREATE OR REPLACE VIEW analytics_conversion_rate AS
SELECT 
  o.id AS org_id,
  o.name AS org_name,
  COALESCE(ia.subscription_type, 'unknown') AS subscription_type,
  COUNT(*) AS total_applications,
  COUNT(*) FILTER (WHERE ia.status = 'accepted' OR ia.visit_result = 'approved') AS converted_applications,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ia.status = 'accepted' OR ia.visit_result = 'approved')
    / NULLIF(COUNT(*), 0),
    1
  ) AS conversion_rate_percent
FROM interest_applications ia
JOIN orgs o ON o.id = ia.org_id
GROUP BY o.id, o.name, COALESCE(ia.subscription_type, 'unknown')
ORDER BY org_name, subscription_type;

COMMENT ON VIEW analytics_conversion_rate IS 
'Analytics: Konverteringsgrad från intresseanmälan (accepted/approved) per subscription_type. Robust utan beroende på created_dog_id/created_owner_id.';

-- ============================================================
-- 5. BACKUP VERIFICATION - FUNKTIONER
-- ============================================================

-- Function för att verifiera att kritiska data finns
CREATE OR REPLACE FUNCTION verify_database_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check 1: Alla profiler har org_id
  RETURN QUERY
  SELECT 
    'profiles_org_id'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    CONCAT(COUNT(*), ' profiler saknar org_id')::TEXT
  FROM profiles WHERE org_id IS NULL;

  -- Check 2: Alla owners har customer_number
  RETURN QUERY
  SELECT 
    'owners_customer_number'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    CONCAT(COUNT(*), ' ägare saknar customer_number')::TEXT
  FROM owners WHERE customer_number IS NULL;

  -- Check 3: Alla invoices har invoice_number
  RETURN QUERY
  SELECT 
    'invoices_invoice_number'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    CONCAT(COUNT(*), ' fakturor saknar invoice_number')::TEXT
  FROM invoices WHERE invoice_number IS NULL;

  -- Check 4: Alla dogs har owner_id
  RETURN QUERY
  SELECT 
    'dogs_owner_id'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    CONCAT(COUNT(*), ' hundar saknar owner_id')::TEXT
  FROM dogs WHERE owner_id IS NULL;

  -- Check 5: Alla bookings har dog_id och owner_id
  RETURN QUERY
  SELECT 
    'bookings_required_ids'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    CONCAT(COUNT(*), ' bokningar saknar dog_id eller owner_id')::TEXT
  FROM bookings WHERE dog_id IS NULL OR owner_id IS NULL;

  -- Check 6: Invoice items har faktiskt amount
  RETURN QUERY
  SELECT 
    'invoice_items_amount'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
    CONCAT(COUNT(*), ' fakturarader med 0 kr amount')::TEXT
  FROM invoice_items WHERE amount = 0;

  -- Check 7: Triggers finns
  RETURN QUERY
  SELECT 
    'critical_triggers'::TEXT,
    CASE WHEN COUNT(*) >= 30 THEN 'OK' ELSE 'WARNING' END,
    CONCAT('Antal triggers: ', COUNT(*))::TEXT
  FROM pg_trigger 
  WHERE tgisinternal = false;

  -- Check 8: RLS är aktiverat
  RETURN QUERY
  SELECT 
    'rls_enabled'::TEXT,
    CASE WHEN COUNT(*) > 50 THEN 'OK' ELSE 'ERROR' END,
    CONCAT('Antal tabeller med RLS: ', COUNT(*))::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
END;
$$;

COMMENT ON FUNCTION verify_database_integrity() IS 
'Verifierar att kritiska databasfält och säkerhetsinställningar är korrekta. Kör manuellt eller via backup-script.';

-- Function för att räkna records per tabell
CREATE OR REPLACE FUNCTION get_table_counts()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    RETURN QUERY EXECUTE format('SELECT %L::TEXT, COUNT(*)::BIGINT FROM %I', r.tablename, r.tablename);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION get_table_counts() IS 
'Returnerar antal rader per tabell. Användbart för backup-verifiering.';

-- ============================================================
-- 6. CRON JOB FÖR JOURNAL RETENTION (körs månadsvis)
-- ============================================================

-- Schemalägg automatisk journal-rensning (1:a varje månad kl 02:00 UTC)
-- OBS: pg_cron har flera överlagrade schedule()-funktioner.
-- Specificera argumenttyper tydligt för att undvika "function name is not unique"-fel.
SELECT cron.schedule(
  'monthly-journal-retention'::text,
  '0 2 1 * *'::text,
  'SELECT enforce_journal_retention();'::text
);

COMMENT ON FUNCTION cron.schedule IS 
'Kör enforce_journal_retention() automatiskt den 1:a varje månad kl 02:00 UTC (GDPR-compliant 2-års retention)';

-- ============================================================
-- PERMISSIONS (RLS)
-- ============================================================

-- Ge authenticated users åtkomst till analytics views
GRANT SELECT ON analytics_daycare_occupancy TO authenticated;
GRANT SELECT ON analytics_boarding_occupancy TO authenticated;
GRANT SELECT ON analytics_revenue_by_service TO authenticated;
GRANT SELECT ON analytics_popular_breeds TO authenticated;
GRANT SELECT ON analytics_conversion_rate TO authenticated;

-- Endast admins kan köra backup-verifieringsfunktioner
-- (dessa är SECURITY DEFINER så de körs med förhöjda rättigheter)

-- ============================================================
-- ✅ FÖRBÄTTRINGAR INSTALLERADE
-- ============================================================
-- 1. Intresseanmälningar - Spårbarhet (created_dog_id, created_owner_id)
-- 2. Hundjournal - Redundant kolumn "text" borttagen
-- 3. Journal - 2-års retention (GDPR-compliant, körs automatiskt)
-- 4. Analytics - 5 nya views för statistik och rapportering
-- 5. Backup verification - 2 funktioner för integritetskontroll
--
-- 🔍 Testa analytics views:
--   SELECT * FROM analytics_daycare_occupancy;
--   SELECT * FROM analytics_conversion_rate;
--
-- 🔧 Verifiera backup:
--   SELECT * FROM verify_database_integrity();
--   SELECT * FROM get_table_counts();
