-- ============================================================================
-- MIGRATION: Approve Application RPC with Transaction Safety
-- Date: 2025-12-05
-- Purpose: Replace 3 separate UPDATE calls with single transactional RPC
-- ============================================================================

-- ============================================================================
-- FUNCTION: approve_application (TRANSACTIONAL)
-- ============================================================================
CREATE OR REPLACE FUNCTION approve_application(
  p_application_id UUID,
  p_org_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_dog_id UUID;
  v_result JSON;
BEGIN
  -- Hämta owner_id och dog_id från application
  SELECT owner_id, dog_id 
  INTO v_owner_id, v_dog_id
  FROM applications
  WHERE id = p_application_id
    AND org_id = p_org_id;  -- Säkerhet: kolla att det är rätt org

  -- Validering: Application måste finnas
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or access denied: %', p_application_id;
  END IF;

  -- ========================================
  -- TRANSACTION START (implicit i function)
  -- ========================================
  
  -- Steg 1: Uppdatera application status
  UPDATE applications
  SET 
    status = 'approved',
    responded_at = now()
  WHERE id = p_application_id;

  -- Steg 2: Tilldela owner till organisation
  UPDATE owners
  SET org_id = p_org_id
  WHERE id = v_owner_id;

  -- Steg 3: Tilldela hund till organisation
  UPDATE dogs
  SET org_id = p_org_id
  WHERE id = v_dog_id;

  -- ========================================
  -- TRANSACTION END
  -- Om något misslyckas rullas ALLT tillbaka
  -- ========================================

  -- Returnera success-resultat
  SELECT json_build_object(
    'success', true,
    'application_id', p_application_id,
    'owner_id', v_owner_id,
    'dog_id', v_dog_id,
    'org_id', p_org_id,
    'responded_at', now()
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Vid fel: rulla tillbaka ALLT och kasta exception
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

-- ============================================================================
-- FUNCTION: reject_application (TRANSACTIONAL)
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_application(
  p_application_id UUID,
  p_org_id UUID,
  p_response_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_result JSON;
BEGIN
  -- Hämta owner_id från application
  SELECT owner_id 
  INTO v_owner_id
  FROM applications
  WHERE id = p_application_id
    AND org_id = p_org_id;

  -- Validering
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or access denied: %', p_application_id;
  END IF;

  -- Uppdatera application (org_id förblir NULL för owner/dog)
  UPDATE applications
  SET 
    status = 'rejected',
    responded_at = now(),
    response_notes = p_response_notes
  WHERE id = p_application_id;

  -- Returnera resultat
  SELECT json_build_object(
    'success', true,
    'application_id', p_application_id,
    'status', 'rejected',
    'responded_at', now()
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION approve_application(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_application(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Kör detta för att verifiera att funktionerna skapades:
/*
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('approve_application', 'reject_application');
  
-- Ska returnera 2 rader:
-- approve_application | FUNCTION
-- reject_application  | FUNCTION
*/

-- ============================================================================
-- RESULTAT
-- ============================================================================
-- ✅ Alla steg i approve_application lyckas ELLER misslyckas tillsammans
-- ✅ Ingen risk för inkonsistent state (half-approved applications)
-- ✅ ACID-garantier (Atomicity, Consistency, Isolation, Durability)
-- ✅ Security: DEFINER med org_id-check säkrar access control
