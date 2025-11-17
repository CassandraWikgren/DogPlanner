-- Migration: Lägg till län, kommun och tjänstetyper till organisationer
-- Skapad: 2025-11-17
-- Syfte: Möjliggöra filtrering av organisationer baserat på geografisk plats och tjänster

-- Lägg till län, kommun och service_types till orgs-tabellen
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS lan text,
  ADD COLUMN IF NOT EXISTS kommun text,
  ADD COLUMN IF NOT EXISTS service_types text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_visible_to_customers boolean DEFAULT true;

-- Index för snabbare filtrering
CREATE INDEX IF NOT EXISTS idx_orgs_lan ON orgs(lan);
CREATE INDEX IF NOT EXISTS idx_orgs_kommun ON orgs(kommun);
CREATE INDEX IF NOT EXISTS idx_orgs_service_types ON orgs USING gin(service_types);
CREATE INDEX IF NOT EXISTS idx_orgs_visible ON orgs(is_visible_to_customers) WHERE is_visible_to_customers = true;

-- Kommentarer
COMMENT ON COLUMN orgs.lan IS 'Län där organisationen är verksam (t.ex. "Stockholm", "Västra Götaland")';
COMMENT ON COLUMN orgs.kommun IS 'Kommun där organisationen är verksam (t.ex. "Stockholm", "Göteborg")';
COMMENT ON COLUMN orgs.service_types IS 'Array av tjänster: ["hunddagis", "hundpensionat", "hundfrisor"]';
COMMENT ON COLUMN orgs.is_visible_to_customers IS 'Om organisationen ska synas i public organisation selector (false = privat/test-organisation)';

-- Logga migration
INSERT INTO migrations (version, description, execution_time_ms)
VALUES ('20251117_add_org_location_and_services', 'Lägg till län, kommun och service_types till orgs för organisation selection system', 0);
