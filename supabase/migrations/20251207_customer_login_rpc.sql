-- ============================================================================
-- CUSTOMER LOGIN VERIFICATION FUNCTION
-- Datum: 7 December 2025
-- ============================================================================
-- Skapar en SECURITY DEFINER funktion för att verifiera kundkonton vid login.
-- Detta bypasser RLS och garanterar att vi kan kolla owners-tabellen.
-- ============================================================================

-- Skapa funktionen för att verifiera kundkonto
CREATE OR REPLACE FUNCTION verify_customer_account(p_user_id UUID)
RETURNS TABLE (
  owner_id UUID,
  full_name TEXT,
  email TEXT,
  customer_number TEXT,
  org_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Körs med skaparens rättigheter (bypasser RLS)
SET search_path = public
AS $$
BEGIN
  -- Returnera owner-data om det finns en matchande rad
  RETURN QUERY
  SELECT 
    o.id as owner_id,
    o.full_name,
    o.email,
    o.customer_number,
    o.org_id
  FROM owners o
  WHERE o.id = p_user_id;
END;
$$;

-- Ge authenticated användare rätt att köra funktionen
GRANT EXECUTE ON FUNCTION verify_customer_account(UUID) TO authenticated;

-- Kommentar för dokumentation
COMMENT ON FUNCTION verify_customer_account IS 
'Verifierar att en auth-användare har ett kundkonto i owners-tabellen.
Används vid kundinloggning (/kundportal/login).
SECURITY DEFINER bypasser RLS för att garantera tillgång.';

-- ============================================================================
-- TEST: Verifiera att funktionen fungerar
-- ============================================================================
-- SELECT * FROM verify_customer_account('212a9151-c464-49d6-8c1c-e8bfd53926a3');
-- Bör returnera testkund@dogplanner.se data
