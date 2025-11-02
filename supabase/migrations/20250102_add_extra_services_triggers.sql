-- Migration: Lägg till triggers för extra_services och extra_service
-- Datum: 2025-01-02
-- Säkerställer att org_id sätts automatiskt vid INSERT

-- =======================================
-- TRIGGERS FÖR extra_services (katalog)
-- =======================================

-- Kontrollera om trigger redan finns innan vi skapar den
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_set_org_id_extra_services'
  ) THEN
    CREATE TRIGGER trg_set_org_id_extra_services 
    BEFORE INSERT ON extra_services
    FOR EACH ROW 
    EXECUTE FUNCTION set_org_id_for_owners();
    
    RAISE NOTICE 'Trigger trg_set_org_id_extra_services skapad för extra_services';
  ELSE
    RAISE NOTICE 'Trigger trg_set_org_id_extra_services finns redan';
  END IF;
END $$;

-- =======================================
-- TRIGGERS FÖR extra_service (hundkoppling)
-- =======================================

-- Kontrollera om trigger redan finns innan vi skapar den
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_set_org_id_extra_service'
  ) THEN
    CREATE TRIGGER trg_set_org_id_extra_service 
    BEFORE INSERT ON extra_service
    FOR EACH ROW 
    EXECUTE FUNCTION set_org_id_for_owners();
    
    RAISE NOTICE 'Trigger trg_set_org_id_extra_service skapad för extra_service';
  ELSE
    RAISE NOTICE 'Trigger trg_set_org_id_extra_service finns redan';
  END IF;
END $$;

-- Kommentar
COMMENT ON TRIGGER trg_set_org_id_extra_services ON extra_services IS 
'Sätt org_id automatiskt från användarens profil vid INSERT';

COMMENT ON TRIGGER trg_set_org_id_extra_service ON extra_service IS 
'Sätt org_id automatiskt från användarens profil vid INSERT';
