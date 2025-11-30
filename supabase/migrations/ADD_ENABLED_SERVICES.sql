-- =====================================================
-- MODULÄRT TJÄNSTEUTBUD FÖR DOGPLANNER
-- =====================================================
-- Datum: 2025-11-30
-- Beskrivning: Lägg till kolumn för att styra vilka tjänster varje organisation erbjuder
-- Detta möjliggör att företag kan välja endast de moduler de behöver (t.ex. endast frisör)

-- Lägg till kolumn för enabled_services
ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS enabled_services TEXT[] 
DEFAULT ARRAY['daycare', 'boarding', 'grooming'];

-- Lägg till kommentar för dokumentation
COMMENT ON COLUMN organisations.enabled_services IS 
'Array med aktiverade tjänster: daycare (hunddagis), boarding (hundpensionat), grooming (hundfrisör). Default: alla aktiverade för bakåtkompatibilitet.';

-- Index för snabbare queries (GIN-index för array-operationer)
CREATE INDEX IF NOT EXISTS idx_organisations_enabled_services 
ON organisations USING GIN (enabled_services);

-- Sätt alla befintliga organisationer till "alla tjänster" (säkerhet för bakåtkompatibilitet)
UPDATE organisations 
SET enabled_services = ARRAY['daycare', 'boarding', 'grooming']
WHERE enabled_services IS NULL;

-- =====================================================
-- PRISSÄTTNINGSMODELL (för framtida referens)
-- =====================================================
-- Strategi: Aggressiv prissättning för snabb adoption
-- 
-- Frisör:           299 kr/mån
-- Dagis:            399 kr/mån
-- Pensionat:        399 kr/mån
-- 2 tjänster:       599 kr/mån
-- Alla tre:         799 kr/mån
-- =====================================================

-- Verifiera att migrationen fungerade
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organisations' 
        AND column_name = 'enabled_services'
    ) THEN
        RAISE NOTICE '✅ Kolumnen enabled_services har lagts till i organisations-tabellen';
    ELSE
        RAISE EXCEPTION '❌ Kolumnen enabled_services kunde inte skapas';
    END IF;
END $$;
