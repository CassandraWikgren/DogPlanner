-- ============================================================================
-- AKTIVERA TRIGGERS FÖR PRODUCTION-LIKNANDE MILJÖ
-- Kör denna fil i Supabase SQL Editor för att aktivera triggers
-- OBS: Detta är FRIVILLIGT - koden fungerar redan utan triggers!
-- ============================================================================

-- === STEG 1: SKAPA FUNKTIONER ===

-- Funktion för att sätta org_id från inloggad användare
CREATE OR REPLACE FUNCTION set_org_id_for_owners()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_org_id_for_dogs()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_org_id_for_rooms()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === STEG 2: SKAPA TRIGGERS ===

-- Trigger för owners
DROP TRIGGER IF EXISTS trg_set_org_id_owners ON owners;
CREATE TRIGGER trg_set_org_id_owners 
  BEFORE INSERT ON owners
  FOR EACH ROW 
  EXECUTE FUNCTION set_org_id_for_owners();

-- Trigger för dogs
DROP TRIGGER IF EXISTS trg_set_org_id_dogs ON dogs;
CREATE TRIGGER trg_set_org_id_dogs 
  BEFORE INSERT ON dogs
  FOR EACH ROW 
  EXECUTE FUNCTION set_org_id_for_dogs();

-- Trigger för rooms
DROP TRIGGER IF EXISTS trg_set_org_id_rooms ON rooms;
CREATE TRIGGER trg_set_org_id_rooms 
  BEFORE INSERT ON rooms
  FOR EACH ROW 
  EXECUTE FUNCTION set_org_id_for_rooms();

-- Trigger för dog_journal
DROP TRIGGER IF EXISTS trg_set_org_user_dog_journal ON dog_journal;
CREATE TRIGGER trg_set_org_user_dog_journal 
  BEFORE INSERT ON dog_journal
  FOR EACH ROW 
  EXECUTE FUNCTION set_org_id_for_dogs();

-- === STEG 3: AKTIVERA RLS (FRIVILLIGT) ===

-- OBS: RLS kan orsaka problem i development!
-- Aktivera bara om du vill testa production-liknande säkerhet

-- ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only see their org's owners"
--   ON owners FOR ALL
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- CREATE POLICY "Users can only see their org's dogs"
--   ON dogs FOR ALL
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- CREATE POLICY "Users can only see their org's rooms"
--   ON rooms FOR ALL
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === KLART! ===

SELECT 'Triggers aktiverade!' as status;

-- Verifiera att triggers finns:
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_set_org%'
ORDER BY event_object_table;

-- ============================================================================
-- VIKTIGT: Koden i EditDogModal sätter redan org_id manuellt
-- Så även OM triggers är aktiverade kommer båda att fungera tillsammans
-- (NEW.org_id kollas först - om den redan är satt, ändras inget)
-- ============================================================================
