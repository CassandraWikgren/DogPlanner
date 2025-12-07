-- ============================================================
-- DATABAS FUNKTION: Uppdatera waitlist baserat på datum
-- ============================================================
-- Kan anropas manuellt eller via cron för att hålla waitlist synkad
-- ============================================================

CREATE OR REPLACE FUNCTION update_waitlist_status()
RETURNS TABLE (
  updated_to_active integer,
  updated_to_waitlist integer,
  updated_to_ended integer
) AS $$
DECLARE
  v_active integer;
  v_waitlist integer;
  v_ended integer;
BEGIN
  -- 1. Sätt till aktiva (antagna): startdatum passerat, ej avslutat
  UPDATE dogs
  SET waitlist = false, updated_at = NOW()
  WHERE startdate IS NOT NULL
    AND startdate <= CURRENT_DATE
    AND (enddate IS NULL OR enddate >= CURRENT_DATE)
    AND waitlist = true;
  
  GET DIAGNOSTICS v_active = ROW_COUNT;

  -- 2. Sätt till väntelista: framtida startdatum
  UPDATE dogs
  SET waitlist = true, updated_at = NOW()
  WHERE startdate > CURRENT_DATE
    AND waitlist = false;
  
  GET DIAGNOSTICS v_waitlist = ROW_COUNT;

  -- 3. Sätt till avslutade (väntelista): slutdatum passerat
  UPDATE dogs
  SET waitlist = true, updated_at = NOW()
  WHERE enddate IS NOT NULL
    AND enddate < CURRENT_DATE
    AND waitlist = false;
  
  GET DIAGNOSTICS v_ended = ROW_COUNT;

  -- Returnera statistik
  RETURN QUERY SELECT v_active, v_waitlist, v_ended;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EXEMPEL PÅ ANVÄNDNING
-- ============================================================

-- Kör funktionen manuellt:
-- SELECT * FROM update_waitlist_status();

-- Resultat visar:
-- updated_to_active   | Antal hundar som blev aktiva
-- updated_to_waitlist | Antal hundar som gick tillbaka till väntelista
-- updated_to_ended    | Antal hundar som avslutades

-- ============================================================
-- CRON JOB (Supabase Dashboard → Database → Cron Jobs)
-- ============================================================

/*
Skapa ett cron job som kör varje dag kl 00:00:

cron.schedule(
  'update-dog-waitlist-status',
  '0 0 * * *', -- Varje dag kl 00:00
  $$
  SELECT update_waitlist_status();
  $$
);
*/
