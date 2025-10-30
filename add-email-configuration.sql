-- ========================================
-- EMAIL-KONFIGURATION FÖR DOGPLANNER
-- ========================================
-- Lägger till stöd för både system-email och organisations-email

-- 1. Lägg till fler email-fält i orgs-tabellen
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS invoice_email text,
  ADD COLUMN IF NOT EXISTS reply_to_email text,
  ADD COLUMN IF NOT EXISTS email_sender_name text;

-- 2. Uppdatera befintliga organisations email om de saknas
UPDATE orgs 
SET contact_email = email 
WHERE contact_email IS NULL AND email IS NOT NULL;

-- 3. Skapa system_config tabell för DogPlanner-nivå inställningar
CREATE TABLE IF NOT EXISTS system_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Lägg in system-email konfiguration
INSERT INTO system_config (config_key, config_value, description)
VALUES 
  ('system_email', 'info@dogplanner.se', 'System-email för plattforms-meddelanden'),
  ('system_email_name', 'DogPlanner', 'Avsändarnamn för system-email'),
  ('support_email', 'support@dogplanner.se', 'Support-email för teknisk hjälp'),
  ('noreply_email', 'noreply@dogplanner.se', 'No-reply email för automatiska meddelanden')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value,
    updated_at = now();

-- 5. Kommentarer för dokumentation
COMMENT ON COLUMN orgs.email IS 'Primär email för organisationen (generell kontakt)';
COMMENT ON COLUMN orgs.contact_email IS 'Kontakt-email som visas för kunder';
COMMENT ON COLUMN orgs.invoice_email IS 'Email som används som avsändare på fakturor';
COMMENT ON COLUMN orgs.reply_to_email IS 'Reply-to email för kundkommunikation';
COMMENT ON COLUMN orgs.email_sender_name IS 'Avsändarnamn i emails till kunder (t.ex. "Bella Hunddagis")';

COMMENT ON TABLE system_config IS 'System-nivå konfiguration för DogPlanner-plattformen';

-- 6. Exempel: Uppdatera demo-organisation
UPDATE orgs 
SET 
  contact_email = email,
  invoice_email = email,
  reply_to_email = email,
  email_sender_name = name
WHERE email IS NOT NULL;
