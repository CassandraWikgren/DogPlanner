-- Migration: Aktivera Realtime för viktiga tabeller (säker version)
-- Datum: 2025-01-02
-- Kontrollerar först om tabellen redan finns i publikationen

-- =======================================
-- ENABLE REALTIME (SAFE)
-- =======================================

-- Helper function för säker ADD TABLE till publication
DO $$
DECLARE
  tables_to_add text[] := ARRAY['dogs', 'attendence_logs', 'attendance_logs', 'staff_notes', 'responsibilities', 'dog_journal'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    -- Kontrollera om tabellen existerar
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) THEN
      RAISE NOTICE 'Table % does not exist, skipping', tbl;
      CONTINUE;
    END IF;
    
    -- Kontrollera om tabellen redan finns i publikationen
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public'
      AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already in supabase_realtime', tbl;
    END IF;
  END LOOP;
END $$;

-- Kommentar om vilka tabeller som har realtime (endast för tabeller som finns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dogs') THEN
    COMMENT ON TABLE dogs IS 'Hundregister. Realtime aktiverad för live-uppdateringar i UI.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_notes') THEN
    COMMENT ON TABLE staff_notes IS 'Personalanteckningar. Realtime aktiverad för samarbete.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'responsibilities') THEN
    COMMENT ON TABLE responsibilities IS 'Ansvarsfördelning. Realtime aktiverad för schemaändringar.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dog_journal') THEN
    COMMENT ON TABLE dog_journal IS 'Hundjournal. Realtime aktiverad för live-uppdateringar.';
  END IF;
END $$;
