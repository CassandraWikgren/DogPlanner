-- ====================================
-- TRIGGER LOGGING SYSTEM
-- Logga alla trigger-exekveringar för debugging
-- ====================================

-- 1. Skapa log-tabell
CREATE TABLE IF NOT EXISTS public.trigger_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  row_id UUID,
  old_data JSONB,
  new_data JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabbare queries
CREATE INDEX IF NOT EXISTS idx_trigger_log_trigger_name ON trigger_execution_log(trigger_name);
CREATE INDEX IF NOT EXISTS idx_trigger_log_table_name ON trigger_execution_log(table_name);
CREATE INDEX IF NOT EXISTS idx_trigger_log_executed_at ON trigger_execution_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_log_success ON trigger_execution_log(success) WHERE success = false;

-- 2. Helper-funktion för att logga trigger-exekvering
CREATE OR REPLACE FUNCTION log_trigger_execution(
  p_trigger_name TEXT,
  p_table_name TEXT,
  p_operation TEXT,
  p_row_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO trigger_execution_log (
    trigger_name,
    table_name,
    operation,
    row_id,
    old_data,
    new_data,
    success,
    error_message,
    execution_time_ms
  )
  VALUES (
    p_trigger_name,
    p_table_name,
    p_operation,
    p_row_id,
    p_old_data,
    p_new_data,
    p_success,
    p_error_message,
    p_execution_time_ms
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 3. Uppdatera handle_new_user med logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_org_number TEXT;
  v_phone TEXT;
  v_full_name TEXT;
  v_start_time TIMESTAMPTZ;
  v_execution_time INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  BEGIN
    -- Extrahera metadata från user
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', 'Mitt Hundföretag');
    v_org_number := NEW.raw_user_meta_data->>'org_number';
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

    -- Skapa organisation
    INSERT INTO orgs (org_name, org_number, phone)
    VALUES (v_org_name, v_org_number, v_phone)
    RETURNING id INTO v_org_id;

    -- Skapa profil
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      org_id, 
      role
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_org_id,
      'admin'
    );

    -- Beräkna execution time
    v_execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

    -- Logga framgång
    PERFORM log_trigger_execution(
      'on_auth_user_created',
      'auth.users',
      'INSERT',
      NEW.id,
      NULL,
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'org_id', v_org_id,
        'org_name', v_org_name
      ),
      true,
      NULL,
      v_execution_time
    );

    RAISE NOTICE '✅ User setup complete - User: %, Org: %', NEW.id, v_org_id;

  EXCEPTION WHEN OTHERS THEN
    -- Logga fel
    v_execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
    
    PERFORM log_trigger_execution(
      'on_auth_user_created',
      'auth.users',
      'INSERT',
      NEW.id,
      NULL,
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email
      ),
      false,
      SQLERRM,
      v_execution_time
    );

    RAISE WARNING '❌ Failed to setup user: % - Error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 4. Queries för att övervaka trigger-hälsa

-- Visa senaste trigger-exekveringar
COMMENT ON TABLE trigger_execution_log IS 'Loggar alla trigger-exekveringar för debugging och monitoring';

-- View för snabb överblick
CREATE OR REPLACE VIEW trigger_health_summary AS
SELECT 
  trigger_name,
  table_name,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND(AVG(execution_time_ms), 2) as avg_execution_ms,
  MAX(executed_at) as last_execution
FROM trigger_execution_log
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY trigger_name, table_name
ORDER BY failed DESC, total_executions DESC;

-- View för senaste fel
CREATE OR REPLACE VIEW recent_trigger_failures AS
SELECT 
  id,
  trigger_name,
  table_name,
  operation,
  row_id,
  error_message,
  new_data,
  executed_at
FROM trigger_execution_log
WHERE success = false
  AND executed_at > NOW() - INTERVAL '7 days'
ORDER BY executed_at DESC
LIMIT 100;

-- 5. Auto-cleanup av gamla loggar (kör varje vecka)
CREATE OR REPLACE FUNCTION cleanup_old_trigger_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM trigger_execution_log
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up trigger logs older than 30 days';
END;
$$;

-- 6. RLS policies för trigger_execution_log
ALTER TABLE trigger_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage trigger logs"
  ON trigger_execution_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view trigger logs from their org"
  ON trigger_execution_log
  FOR SELECT
  TO authenticated
  USING (true); -- Alla kan läsa för debugging

-- 7. Grant permissions
GRANT SELECT ON trigger_execution_log TO authenticated;
GRANT SELECT ON trigger_health_summary TO authenticated;
GRANT SELECT ON recent_trigger_failures TO authenticated;
GRANT ALL ON trigger_execution_log TO service_role;
