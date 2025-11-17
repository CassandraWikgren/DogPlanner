-- =====================================================
-- MIGRATION: Lägg till cancellation och GDPR-fält
-- Datum: 2025-11-16
-- Syfte: Stöd för avbokningar och GDPR-compliance
-- =====================================================

-- =====================================================
-- 1. BOOKINGS: Lägg till cancellation-fält
-- =====================================================

-- Cancellation tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Lägg till index för queries
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_start_date ON bookings(status, start_date);

COMMENT ON COLUMN bookings.cancellation_reason IS 'Anledning till avbokning (text från kund eller personal)';
COMMENT ON COLUMN bookings.cancelled_at IS 'Tidpunkt för avbokning';
COMMENT ON COLUMN bookings.cancelled_by_user_id IS 'Användare som avbokade (kund eller personal)';

-- =====================================================
-- 2. DOGS: Lägg till soft delete
-- =====================================================

ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS deleted_reason text;

CREATE INDEX IF NOT EXISTS idx_dogs_is_deleted ON dogs(is_deleted);

COMMENT ON COLUMN dogs.is_deleted IS 'Mjuk radering - hund visas inte i UI men finns kvar i DB';
COMMENT ON COLUMN dogs.deleted_at IS 'Tidpunkt för mjuk radering';
COMMENT ON COLUMN dogs.deleted_reason IS 'Anledning till radering (GDPR-begäran, inaktiv, etc)';

-- =====================================================
-- 3. OWNERS: Lägg till GDPR anonymisering
-- =====================================================

ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS is_anonymized boolean DEFAULT false;

ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS anonymization_reason text;

ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS data_retention_until date;

CREATE INDEX IF NOT EXISTS idx_owners_is_anonymized ON owners(is_anonymized);
CREATE INDEX IF NOT EXISTS idx_owners_data_retention ON owners(data_retention_until);

COMMENT ON COLUMN owners.is_anonymized IS 'GDPR - ägare har anonymiserats (personuppgifter raderade)';
COMMENT ON COLUMN owners.anonymized_at IS 'Tidpunkt för anonymisering';
COMMENT ON COLUMN owners.anonymization_reason IS 'Anledning till anonymisering';
COMMENT ON COLUMN owners.data_retention_until IS 'Datum då data kan raderas (7 år efter sista faktura)';

-- =====================================================
-- 4. ORGS: Lägg till avbokningspolicy
-- =====================================================

ALTER TABLE orgs 
ADD COLUMN IF NOT EXISTS cancellation_policy jsonb DEFAULT '{
  "days_7_plus": 0,
  "days_3_to_7": 0.5,
  "days_under_3": 1.0,
  "description": "7+ dagar: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: 100% avgift"
}'::jsonb;

COMMENT ON COLUMN orgs.cancellation_policy IS 'Avbokningspolicy i JSON-format med olika avgifter baserat på dagar kvar';

-- =====================================================
-- 5. BOOKING EVENTS: Audit log för bokningsändringar
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created', 
    'approved', 
    'cancelled', 
    'checked_in', 
    'checked_out',
    'modified',
    'payment_received',
    'refund_issued'
  )),
  notes text,
  metadata jsonb, -- Extra data som prisjusteringar, rabatter, etc
  performed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_event_type ON booking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_events_org_id ON booking_events(org_id);

COMMENT ON TABLE booking_events IS 'Audit log för alla bokningsändringar (GDPR Article 30)';

-- =====================================================
-- 6. TRIGGER: Auto-log booking events
-- =====================================================

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log när status ändras
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO booking_events (
      org_id,
      booking_id,
      event_type,
      notes,
      metadata
    ) VALUES (
      NEW.org_id,
      NEW.id,
      CASE NEW.status
        WHEN 'confirmed' THEN 'approved'
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'checked_in' THEN 'checked_in'
        WHEN 'checked_out' THEN 'checked_out'
        ELSE 'modified'
      END,
      'Status ändrad från ' || COALESCE(OLD.status, 'NULL') || ' till ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_total_price', OLD.total_price,
        'new_total_price', NEW.total_price
      )
    );
  END IF;

  -- Log när bokning skapas
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO booking_events (
      org_id,
      booking_id,
      event_type,
      notes,
      metadata
    ) VALUES (
      NEW.org_id,
      NEW.id,
      'created',
      'Bokning skapad',
      jsonb_build_object(
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'total_price', NEW.total_price
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_booking_changes ON bookings;
CREATE TRIGGER trigger_log_booking_changes
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- =====================================================
-- 7. RLS POLICIES för booking_events
-- =====================================================

ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

-- Personal kan se alla events för sin organisation
CREATE POLICY "Staff can view booking events" ON booking_events
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Kunder kan se events för sina egna bokningar
CREATE POLICY "Customers can view own booking events" ON booking_events
  FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN dogs d ON b.dog_id = d.id
      WHERE d.owner_id IN (
        SELECT id FROM owners WHERE user_id = auth.uid()
      )
    )
  );

-- Endast system kan skapa events (via trigger)
CREATE POLICY "Only system can create events" ON booking_events
  FOR INSERT
  WITH CHECK (false); -- Blockera manuell INSERT (endast trigger)

-- =====================================================
-- 8. HELPER FUNCTION: Calculate cancellation fee
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_cancellation_fee(
  p_booking_id uuid,
  p_cancellation_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  cancellation_fee numeric,
  refund_amount numeric,
  days_until_start integer,
  policy_applied text
) AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_policy jsonb;
  v_fee_percentage numeric;
  v_days_until integer;
BEGIN
  -- Hämta bokningen
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bokning med ID % hittades inte', p_booking_id;
  END IF;

  -- Hämta organisationens avbokningspolicy
  SELECT cancellation_policy INTO v_policy
  FROM orgs
  WHERE id = v_booking.org_id;

  -- Beräkna dagar kvar till start
  v_days_until := v_booking.start_date - p_cancellation_date::date;

  -- Bestäm avgiftsprocent baserat på policy
  IF v_days_until >= 7 THEN
    v_fee_percentage := (v_policy->>'days_7_plus')::numeric;
    policy_applied := '7+ dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  ELSIF v_days_until >= 3 THEN
    v_fee_percentage := (v_policy->>'days_3_to_7')::numeric;
    policy_applied := '3-7 dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  ELSE
    v_fee_percentage := (v_policy->>'days_under_3')::numeric;
    policy_applied := 'Under 3 dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  END IF;

  -- Beräkna avgift och återbetalning
  cancellation_fee := v_booking.total_price * v_fee_percentage;
  refund_amount := v_booking.total_price - cancellation_fee;
  days_until_start := v_days_until;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_cancellation_fee IS 'Beräknar avbokningsavgift baserat på organisationens policy';

-- =====================================================
-- 9. HELPER FUNCTION: GDPR - Calculate retention date
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_data_retention_date(
  p_owner_id uuid
)
RETURNS date AS $$
DECLARE
  v_last_invoice_date date;
  v_retention_date date;
BEGIN
  -- Hitta senaste fakturan för ägaren
  SELECT MAX(due_date) INTO v_last_invoice_date
  FROM invoices
  WHERE customer_id = p_owner_id;

  -- Om inga fakturor finns, använd senaste bokningen
  IF v_last_invoice_date IS NULL THEN
    SELECT MAX(end_date) INTO v_last_invoice_date
    FROM bookings b
    WHERE b.owner_id = p_owner_id;
  END IF;

  -- Lägg till 7 år (bokföringskrav)
  v_retention_date := v_last_invoice_date + INTERVAL '7 years';

  RETURN v_retention_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_data_retention_date IS 'Beräknar datum då kunddata kan raderas (7 år efter sista faktura)';

-- =====================================================
-- 10. HELPER FUNCTION: GDPR - Anonymize owner
-- =====================================================

CREATE OR REPLACE FUNCTION anonymize_owner(
  p_owner_id uuid,
  p_reason text DEFAULT 'GDPR-begäran'
)
RETURNS boolean AS $$
BEGIN
  -- Uppdatera owner-tabellen
  UPDATE owners SET
    full_name = 'Raderad kund',
    email = NULL,
    phone = NULL,
    address = NULL,
    personal_number = NULL,
    gdpr_marketing_consent = false,
    is_anonymized = true,
    anonymized_at = now(),
    anonymization_reason = p_reason
  WHERE id = p_owner_id;

  -- Uppdatera alla bokningar (ta bort personlig info)
  UPDATE bookings SET
    notes = CASE 
      WHEN notes IS NOT NULL THEN '[ANONYMISERAD]'
      ELSE NULL
    END,
    special_requests = CASE 
      WHEN special_requests IS NOT NULL THEN '[ANONYMISERAD]'
      ELSE NULL
    END
  WHERE owner_id = p_owner_id;

  -- Uppdatera belongings om kolumnen finns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'belongings'
  ) THEN
    UPDATE bookings SET
      belongings = CASE 
        WHEN belongings IS NOT NULL THEN '[ANONYMISERAD]'
        ELSE NULL
      END
    WHERE owner_id = p_owner_id;
  END IF;

  -- Mjuk radering av hundar
  UPDATE dogs SET
    is_deleted = TRUE,
    deleted_at = now(),
    deleted_reason = 'Ägare anonymiserad: ' || p_reason,
    medical_conditions = NULL,
    allergies = NULL,
    special_diet = NULL,
    notes = NULL
  WHERE owner_id = p_owner_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_owner IS 'GDPR Article 17 - Anonymiserar ägare och relaterad data';

-- =====================================================
-- 11. MIGRATIONS-TABELL: Spåra alla migrationer
-- =====================================================

-- Skapa migrations-tabell om den inte finns
CREATE TABLE IF NOT EXISTS migrations (
  id serial PRIMARY KEY,
  version text UNIQUE NOT NULL,
  description text,
  executed_at timestamptz DEFAULT now(),
  execution_time_ms integer,
  created_by text DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);

COMMENT ON TABLE migrations IS 'Spårar alla körda databas-migrationer för långsiktig hållbarhet';
COMMENT ON COLUMN migrations.version IS 'Unikt versions-ID för migrationen (t.ex. 20251116_add_cancellation)';
COMMENT ON COLUMN migrations.description IS 'Beskrivning av vad migrationen gör';
COMMENT ON COLUMN migrations.executed_at IS 'Tidpunkt när migrationen kördes';
COMMENT ON COLUMN migrations.execution_time_ms IS 'Körtid i millisekunder (frivillig)';

-- =====================================================
-- MIGRATION SLUTFÖRD
-- =====================================================

-- Registrera denna migration
INSERT INTO migrations (version, description, executed_at)
VALUES (
  '20251116_add_cancellation_and_gdpr_fields',
  'Lade till stöd för avbokningar, GDPR-compliance och audit logging. Inkluderar: cancellation-fält (bookings), soft delete (dogs), anonymisering (owners), avbokningspolicy (orgs), booking_events audit log, triggers, RLS policies, och helper functions.',
  now()
)
ON CONFLICT (version) DO UPDATE SET
  executed_at = now(),
  description = EXCLUDED.description;

-- Verifiera att allt är skapat
DO $$
DECLARE
  missing_items text[] := ARRAY[]::text[];
BEGIN
  -- Kolla kolumner
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancellation_reason') THEN
    missing_items := array_append(missing_items, 'bookings.cancellation_reason');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dogs' AND column_name = 'is_deleted') THEN
    missing_items := array_append(missing_items, 'dogs.is_deleted');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'owners' AND column_name = 'is_anonymized') THEN
    missing_items := array_append(missing_items, 'owners.is_anonymized');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'cancellation_policy') THEN
    missing_items := array_append(missing_items, 'orgs.cancellation_policy');
  END IF;
  
  -- Kolla tabell
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_events') THEN
    missing_items := array_append(missing_items, 'booking_events table');
  END IF;
  
  -- Kolla functions
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_cancellation_fee') THEN
    missing_items := array_append(missing_items, 'calculate_cancellation_fee function');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'anonymize_owner') THEN
    missing_items := array_append(missing_items, 'anonymize_owner function');
  END IF;
  
  -- Rapportera resultat
  IF array_length(missing_items, 1) > 0 THEN
    RAISE WARNING 'Migration 20251116: Följande objekt kunde inte skapas: %', array_to_string(missing_items, ', ');
  ELSE
    RAISE NOTICE 'Migration 20251116: Alla objekt skapade framgångsrikt! ✅';
    RAISE NOTICE 'Nya kolumner: cancellation_reason, cancelled_at, cancelled_by_user_id, is_deleted, is_anonymized, cancellation_policy';
    RAISE NOTICE 'Nya tabeller: booking_events, migrations';
    RAISE NOTICE 'Nya functions: calculate_cancellation_fee, anonymize_owner, calculate_data_retention_date';
    RAISE NOTICE 'Nya triggers: log_booking_status_change';
  END IF;
END $$;
