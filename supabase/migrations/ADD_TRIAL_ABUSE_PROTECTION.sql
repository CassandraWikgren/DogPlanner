-- =====================================================
-- MISSBRUKSSKYDD FÖR 2 MÅNADERS GRATISPERIOD
-- =====================================================
-- Skapad: 2025-11-30
-- Syfte: Förhindra att användare får flera gratisperioder genom:
--   1. Skapa nya konton med andra email-adresser
--   2. Registrera nya organisationer med samma org-nummer
--   3. Återskapa raderade organisationer

-- =====================================================
-- 1. LÄGG TILL FLAGGA I ORGS-TABELLEN
-- =====================================================
-- Spåra om organisation någonsin haft en prenumeration
ALTER TABLE orgs 
ADD COLUMN IF NOT EXISTS has_had_subscription BOOLEAN DEFAULT false;

COMMENT ON COLUMN orgs.has_had_subscription IS 
  'Permanent flagga som sätts till true första gången en org får trial/betald prenumeration. Används för att blockera nya gratisperioder.';

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_orgs_has_had_subscription 
ON orgs(has_had_subscription) 
WHERE has_had_subscription = true;

-- =====================================================
-- 2. EMAIL-HISTORIK TABELL
-- =====================================================
-- Spåra alla email-adresser som använts med ett org-nummer
CREATE TABLE IF NOT EXISTS org_email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_number, email)
);

COMMENT ON TABLE org_email_history IS 
  'Historik över alla email-adresser som använts för att registrera en organisation. Används för att förhindra att samma person skapar nya konton.';

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_org_email_history_org_number 
ON org_email_history(org_number);

CREATE INDEX IF NOT EXISTS idx_org_email_history_email 
ON org_email_history(email);

-- RLS: Endast service role får läsa
ALTER TABLE org_email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only read" ON org_email_history
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role only insert" ON org_email_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 3. ORG-NUMMER HISTORIK TABELL
-- =====================================================
-- Spåra alla org-nummer som någonsin haft prenumeration
CREATE TABLE IF NOT EXISTS org_number_subscription_history (
  org_number TEXT PRIMARY KEY,
  has_had_subscription BOOLEAN DEFAULT true,
  first_subscription_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE org_number_subscription_history IS 
  'Permanent historik över alla organisationsnummer som haft prenumeration. Används för att förhindra att raderade organisationer återregistreras för ny gratisperiod.';

-- RLS: Endast service role får läsa
ALTER TABLE org_number_subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only read" ON org_number_subscription_history
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role only write" ON org_number_subscription_history
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 4. FUNKTION: KONTROLLERA TRIAL-BERÄTTIGANDE
-- =====================================================
CREATE OR REPLACE FUNCTION check_trial_eligibility(
  p_org_number TEXT,
  p_email TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_org_has_subscription BOOLEAN;
  v_email_used BOOLEAN;
  v_result JSONB;
BEGIN
  -- Kontrollera om org-nummer tidigare haft prenumeration
  SELECT EXISTS (
    SELECT 1 FROM org_number_subscription_history 
    WHERE org_number = p_org_number
  ) INTO v_org_has_subscription;

  -- Kontrollera om email använts med detta org-nummer tidigare
  SELECT EXISTS (
    SELECT 1 FROM org_email_history 
    WHERE org_number = p_org_number AND email = p_email
  ) INTO v_email_used;

  -- Bygg resultat
  v_result := jsonb_build_object(
    'is_eligible', NOT (v_org_has_subscription OR v_email_used),
    'reason', CASE 
      WHEN v_org_has_subscription THEN 'org_number_used'
      WHEN v_email_used THEN 'email_used'
      ELSE 'eligible'
    END,
    'org_number', p_org_number,
    'email', p_email,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_trial_eligibility IS 
  'Kontrollera om en användare/organisation är berättigad till gratisperiod. Returnerar JSON med is_eligible och reason.';

-- =====================================================
-- 5. FUNKTION: REGISTRERA NY PRENUMERATION
-- =====================================================
CREATE OR REPLACE FUNCTION register_subscription_start(
  p_org_id UUID,
  p_org_number TEXT,
  p_email TEXT
)
RETURNS void AS $$
BEGIN
  -- Markera org som att den haft prenumeration
  UPDATE orgs 
  SET has_had_subscription = true 
  WHERE id = p_org_id;

  -- Spara email-historik
  INSERT INTO org_email_history (org_number, email)
  VALUES (p_org_number, p_email)
  ON CONFLICT (org_number, email) DO NOTHING;

  -- Spara org-nummer historik
  INSERT INTO org_number_subscription_history (org_number)
  VALUES (p_org_number)
  ON CONFLICT (org_number) DO UPDATE 
  SET last_checked_at = now();

  RAISE NOTICE 'Subscription registered for org_id=%, org_number=%, email=%', 
    p_org_id, p_org_number, p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION register_subscription_start IS 
  'Registrera att en prenumeration startat. Sätter has_had_subscription = true och sparar historik.';

-- =====================================================
-- 6. UPPDATERA BEFINTLIGA ORGS
-- =====================================================
-- Markera alla orgs som har aktiv eller avslutad prenumeration
UPDATE orgs o
SET has_had_subscription = true
WHERE EXISTS (
  SELECT 1 FROM org_subscriptions os 
  WHERE os.org_id = o.id
);

-- Fyll på historiktabeller med befintliga orgs
INSERT INTO org_number_subscription_history (org_number)
SELECT DISTINCT o.org_number
FROM orgs o
WHERE o.has_had_subscription = true
  AND o.org_number IS NOT NULL
ON CONFLICT (org_number) DO NOTHING;

-- =====================================================
-- 7. UPPDATERA HANDLE_NEW_USER TRIGGER (2 MÅNADER)
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_org_number TEXT;
  v_phone TEXT;
  v_full_name TEXT;
  v_enabled_services TEXT[];
  v_service_types TEXT[];
  v_trial_eligibility JSONB;
BEGIN
  -- Hämta metadata från registrering
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', 'Min Organisation');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Bygg tjänstearrayar från metadata
  v_enabled_services := ARRAY['daycare']::TEXT[];
  v_service_types := ARRAY['hunddagis']::TEXT[];

  -- 🔒 KONTROLLERA TRIAL-BERÄTTIGANDE
  IF v_org_number IS NOT NULL THEN
    v_trial_eligibility := check_trial_eligibility(v_org_number, NEW.email);
    
    IF NOT (v_trial_eligibility->>'is_eligible')::boolean THEN
      RAISE EXCEPTION 'Gratisperiod ej tillgänglig. Orsak: %', 
        v_trial_eligibility->>'reason'
        USING HINT = 'Denna organisation eller email har redan använt gratisperioden';
    END IF;
  END IF;

  -- Skapa organisation (med båda kolumnerna synkade)
  INSERT INTO orgs (
    name, 
    org_number, 
    phone,
    enabled_services, 
    service_types,
    has_had_subscription
  )
  VALUES (
    v_org_name, 
    v_org_number, 
    v_phone,
    v_enabled_services,
    v_service_types,
    true  -- 🔒 VIKTIGT: Sätt direkt till true
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Organisation skapad: id=%, name=%, enabled_services=%, service_types=%', 
    v_org_id, v_org_name, v_enabled_services, v_service_types;

  -- Skapa profil kopplad till org
  INSERT INTO profiles (id, org_id, full_name)
  VALUES (NEW.id, v_org_id, v_full_name)
  ON CONFLICT (id) DO UPDATE 
  SET org_id = v_org_id, full_name = v_full_name;

  -- Skapa 2 månaders (60 dagar) gratis trial prenumeration
  INSERT INTO org_subscriptions (
    org_id,
    plan,
    status,
    trial_starts_at,
    trial_ends_at,
    is_active
  )
  VALUES (
    v_org_id,
    'basic',
    'trialing',
    now(),
    now() + interval '60 days',  -- 🎁 2 MÅNADER (ändrat från 3)
    true
  );

  -- 🔒 REGISTRERA PRENUMERATIONSSTART (för missbruksskydd)
  IF v_org_number IS NOT NULL THEN
    PERFORM register_subscription_start(v_org_id, v_org_number, NEW.email);
  END IF;

  RAISE NOTICE '✅ Trigger klar: org_id=%, user_id=%, trial=60 days', v_org_id, NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- LOGGNING
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ MISSBRUKSSKYDD INSTALLERAT';
  RAISE NOTICE '   - has_had_subscription kolumn tillagd';
  RAISE NOTICE '   - Email-historik tabell skapad';
  RAISE NOTICE '   - Org-nummer historik tabell skapad';
  RAISE NOTICE '   - check_trial_eligibility() funktion skapad';
  RAISE NOTICE '   - register_subscription_start() funktion skapad';
  RAISE NOTICE '   - handle_new_user() trigger uppdaterad (2 månader)';
  RAISE NOTICE '   - Befintliga orgs markerade';
END $$;
