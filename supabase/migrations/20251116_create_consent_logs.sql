-- Migration: GDPR-compliant consent logging system
-- Date: 2025-11-16
-- Purpose: Track customer consents according to GDPR Art. 7

-- Create consent_logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('digital_email', 'physical_form', 'phone_verbal', 'in_person')),
  consent_given boolean NOT NULL,
  consent_text text NOT NULL,
  consent_version text DEFAULT '1.0',
  ip_address inet,
  user_agent text,
  signed_document_url text,
  witness_staff_id uuid REFERENCES auth.users(id),
  witness_notes text,
  given_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_owner ON consent_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_org ON consent_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_active ON consent_logs(owner_id) WHERE consent_given = true AND withdrawn_at IS NULL;

-- Kommentarer
COMMENT ON TABLE consent_logs IS 'GDPR Art. 7: Dokumentation av kundsamtycken. Varje samtycke loggas med typ, tid, och ursprung.';
COMMENT ON COLUMN consent_logs.consent_type IS 'Hur samtycke gavs: digital_email, physical_form, phone_verbal, in_person';
COMMENT ON COLUMN consent_logs.consent_text IS 'Exakt text som kunden såg/läste när samtycke gavs. Versioneras för juridisk dokumentation.';
COMMENT ON COLUMN consent_logs.signed_document_url IS 'Supabase Storage URL till uppladdad signerad blankett eller foto av samtycke.';
COMMENT ON COLUMN consent_logs.withdrawn_at IS 'När kund återkallade samtycke (GDPR Art. 7.3 - rätt att återkalla).';

-- =============================================
-- OWNERS: Lägg till samtycke-status
-- =============================================
ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS consent_status text 
  CHECK (consent_status IN ('pending', 'verified', 'declined', 'expired', 'withdrawn'))
  DEFAULT 'pending';

ALTER TABLE owners
ADD COLUMN IF NOT EXISTS consent_verified_at timestamptz;

ALTER TABLE owners
ADD COLUMN IF NOT EXISTS gdpr_marketing_consent boolean DEFAULT false;

COMMENT ON COLUMN owners.consent_status IS 'Status för kundens samtycke: pending=väntar på bekräftelse, verified=bekräftat, declined=nekade, withdrawn=återkallat';
COMMENT ON COLUMN owners.gdpr_marketing_consent IS 'Separat samtycke för marknadsföring (GDPR Art. 6.1.a + 21). Måste vara frivilligt och separat från tjänstsamtycke.';

-- =============================================
-- BOOKINGS: Lägg till samtycke-referens
-- =============================================
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS consent_required boolean DEFAULT false;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS consent_pending_until timestamptz;

COMMENT ON COLUMN bookings.consent_required IS 'Om denna bokning skapades innan kund bekräftat samtycke (assisterad registrering).';
COMMENT ON COLUMN bookings.consent_pending_until IS 'Deadline för när kund måste bekräfta. Om utgånget → bokning avbryts automatiskt.';

-- =============================================
-- RLS POLICIES
-- =============================================

-- Endast personal och kunden själv kan se consent logs
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view consent logs for their org"
  ON consent_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can view their own consent logs"
  ON consent_logs FOR SELECT
  USING (owner_id IN (
    SELECT id FROM owners 
    WHERE user_id = auth.uid()
  ));

-- =============================================
-- FUNCTIONS: Helper för samtycke
-- =============================================

-- Funktion: Kolla om kund har giltigt samtycke
CREATE OR REPLACE FUNCTION has_valid_consent(p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consent_logs
    WHERE owner_id = p_owner_id
      AND consent_given = true
      AND withdrawn_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY given_at DESC
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION has_valid_consent IS 'Kontrollera om ägare har giltigt, icke-återkallat samtycke.';

-- Funktion: Återkalla samtycke (GDPR Art. 7.3)
CREATE OR REPLACE FUNCTION withdraw_consent(p_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Markera alla aktiva samtycken som återkallade
  UPDATE consent_logs
  SET withdrawn_at = now(),
      updated_at = now()
  WHERE owner_id = p_owner_id
    AND consent_given = true
    AND withdrawn_at IS NULL;
  
  -- Uppdatera owner status
  UPDATE owners
  SET consent_status = 'withdrawn',
      updated_at = now()
  WHERE id = p_owner_id;
  
  -- Logga händelsen
  INSERT INTO consent_logs (
    owner_id,
    org_id,
    consent_type,
    consent_given,
    consent_text,
    given_at
  )
  SELECT 
    id,
    org_id,
    'digital_email',
    false,
    'Kund återkallade samtycke enligt GDPR Art. 7.3',
    now()
  FROM owners WHERE id = p_owner_id;
END;
$$;

COMMENT ON FUNCTION withdraw_consent IS 'GDPR Art. 7.3: Kund återkallar samtycke. Markerar alla aktiva samtycken som återkallade.';

-- =============================================
-- TRIGGERS: Automatisk uppdatering
-- =============================================

-- Trigger: Uppdatera owner.consent_status när consent_log skapas
CREATE OR REPLACE FUNCTION update_owner_consent_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consent_given = true AND NEW.withdrawn_at IS NULL THEN
    UPDATE owners
    SET consent_status = 'verified',
        consent_verified_at = NEW.given_at,
        updated_at = now()
    WHERE id = NEW.owner_id;
  ELSIF NEW.consent_given = false THEN
    UPDATE owners
    SET consent_status = 'declined',
        updated_at = now()
    WHERE id = NEW.owner_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_owner_consent_status
  AFTER INSERT ON consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_consent_status();

COMMENT ON FUNCTION update_owner_consent_status IS 'Automatisk synkning av consent_status i owners när ny consent_log skapas.';

-- =============================================
-- GRANTS
-- =============================================

GRANT SELECT, INSERT ON consent_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
