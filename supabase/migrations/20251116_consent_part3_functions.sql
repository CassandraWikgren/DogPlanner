-- GDPR consent logging system - PART 3: Functions
-- Run this after PART 2

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

CREATE OR REPLACE FUNCTION withdraw_consent(p_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE consent_logs
  SET withdrawn_at = now(), updated_at = now()
  WHERE owner_id = p_owner_id AND consent_given = true AND withdrawn_at IS NULL;
  
  UPDATE owners
  SET consent_status = 'withdrawn', updated_at = now()
  WHERE id = p_owner_id;
  
  INSERT INTO consent_logs (owner_id, org_id, consent_type, consent_given, consent_text, given_at)
  SELECT id, org_id, 'digital_email', false, 'Customer withdrew consent (GDPR Art. 7.3)', now()
  FROM owners WHERE id = p_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_owner_consent_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consent_given = true AND NEW.withdrawn_at IS NULL THEN
    UPDATE owners SET consent_status = 'verified', consent_verified_at = NEW.given_at, updated_at = now() WHERE id = NEW.owner_id;
  ELSIF NEW.consent_given = false THEN
    UPDATE owners SET consent_status = 'declined', updated_at = now() WHERE id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_owner_consent_status
  AFTER INSERT ON consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_consent_status();

GRANT SELECT, INSERT ON consent_logs TO authenticated;
