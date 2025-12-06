-- ============================================================
-- 💰 AUTO-DETECT: Uppdatera pensionatspriser med automatisk org_id
-- ============================================================
-- Skapad: 6 December 2025
-- Detta script hittar automatiskt din organisation och uppdaterar prisdata
-- ============================================================

-- STEG 1: Hitta första aktiva organisationen (eller ändra till din specifika)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Hämta första organisationen (ändra WHERE-villkoret om du har flera orgs)
    SELECT id INTO v_org_id FROM orgs ORDER BY created_at LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Ingen organisation hittades!';
    END IF;
    
    RAISE NOTICE 'Använder org_id: %', v_org_id;

    -- ============================================================
    -- BOARDING_PRICES - Grundpriser per hundstorlek
    -- ============================================================
    
    -- Ta bort gamla priser för denna org
    DELETE FROM boarding_prices WHERE org_id = v_org_id;
    
    -- Lägg till nya priser
    INSERT INTO boarding_prices (org_id, dog_size, base_price, weekend_surcharge, is_active)
    VALUES 
        (v_org_id, 'small', 350, 50, true),   -- Små hundar: 350 kr/natt, +50 kr helg
        (v_org_id, 'medium', 450, 75, true),  -- Mellan hundar: 450 kr/natt, +75 kr helg
        (v_org_id, 'large', 550, 100, true);  -- Stora hundar: 550 kr/natt, +100 kr helg
    
    RAISE NOTICE 'Lagt till 3 grundpriser (small/medium/large)';

    -- ============================================================
    -- BOARDING_SEASONS - Säsonger med prismultiplikator
    -- ============================================================
    
    -- Ta bort gamla säsonger för denna org
    DELETE FROM boarding_seasons WHERE org_id = v_org_id;
    
    -- Lägg till säsonger för 2025-2026
    INSERT INTO boarding_seasons (org_id, name, start_date, end_date, type, price_multiplier, is_active)
    VALUES
        (v_org_id, 'Sommar högsäsong', '2025-06-15', '2025-08-15', 'high', 1.30, true),
        (v_org_id, 'Jul och Nyår', '2025-12-20', '2026-01-06', 'holiday', 1.50, true),
        (v_org_id, 'Lågsäsong höst', '2025-11-01', '2025-11-30', 'low', 0.90, true),
        (v_org_id, 'Sportlov 2026', '2026-02-14', '2026-03-01', 'high', 1.20, true),
        (v_org_id, 'Påsk 2026', '2026-03-28', '2026-04-06', 'high', 1.25, true),
        (v_org_id, 'Sommar högsäsong 2026', '2026-06-15', '2026-08-15', 'high', 1.30, true),
        (v_org_id, 'Lågsäsong höst 2026', '2026-11-01', '2026-11-30', 'low', 0.90, true),
        (v_org_id, 'Jul och Nyår 2026', '2026-12-20', '2027-01-06', 'holiday', 1.50, true);
    
    RAISE NOTICE 'Lagt till 8 säsonger';

    -- ============================================================
    -- SPECIAL_DATES - Helgdagar och specialdatum
    -- ============================================================
    
    -- Ta bort gamla specialdatum för denna org (endast framtida datum)
    DELETE FROM special_dates WHERE org_id = v_org_id AND date >= CURRENT_DATE;
    
    -- Lägg till helgdagar 2025-2026
    INSERT INTO special_dates (org_id, date, name, category, price_surcharge, is_active)
    VALUES
        -- 2025 december
        (v_org_id, '2025-12-24', 'Julafton', 'holiday', 200, true),
        (v_org_id, '2025-12-25', 'Juldagen', 'holiday', 200, true),
        (v_org_id, '2025-12-26', 'Annandag jul', 'holiday', 150, true),
        (v_org_id, '2025-12-31', 'Nyårsafton', 'holiday', 200, true),
        
        -- 2026
        (v_org_id, '2026-01-01', 'Nyårsdagen', 'red_day', 150, true),
        (v_org_id, '2026-01-06', 'Trettondedag jul', 'red_day', 100, true),
        (v_org_id, '2026-04-03', 'Långfredagen', 'red_day', 150, true),
        (v_org_id, '2026-04-05', 'Påskdagen', 'holiday', 150, true),
        (v_org_id, '2026-04-06', 'Annandag påsk', 'red_day', 100, true),
        (v_org_id, '2026-05-01', 'Första maj', 'red_day', 100, true),
        (v_org_id, '2026-05-14', 'Kristi himmelsfärdsdag', 'red_day', 100, true),
        (v_org_id, '2026-05-24', 'Pingstdagen', 'red_day', 100, true),
        (v_org_id, '2026-06-06', 'Nationaldagen', 'red_day', 100, true),
        (v_org_id, '2026-06-19', 'Midsommarafton', 'holiday', 200, true),
        (v_org_id, '2026-06-20', 'Midsommardagen', 'holiday', 150, true),
        (v_org_id, '2026-10-31', 'Alla helgons dag', 'red_day', 75, true),
        (v_org_id, '2026-12-24', 'Julafton', 'holiday', 200, true),
        (v_org_id, '2026-12-25', 'Juldagen', 'holiday', 200, true),
        (v_org_id, '2026-12-26', 'Annandag jul', 'holiday', 150, true),
        (v_org_id, '2026-12-31', 'Nyårsafton', 'holiday', 200, true);
    
    RAISE NOTICE 'Lagt till 20 specialdatum/helgdagar';

    -- ============================================================
    -- EXTRA_SERVICES - Tillval för pensionat
    -- ============================================================
    
    -- Ta bort gamla extra tjänster för pensionat
    DELETE FROM extra_services WHERE org_id = v_org_id AND service_type = 'boarding';
    
    -- Lägg till nya
    INSERT INTO extra_services (org_id, label, price, unit, service_type, is_active)
    VALUES
        (v_org_id, 'Extra promenad', 100, 'per tillfälle', 'boarding', true),
        (v_org_id, 'Medicin-administrering', 50, 'per dag', 'boarding', true),
        (v_org_id, 'Specialkost', 75, 'per dag', 'boarding', true),
        (v_org_id, 'Bad och föning', 350, 'per gång', 'boarding', true),
        (v_org_id, 'Hämtning/lämning', 200, 'per resa', 'boarding', true),
        (v_org_id, 'Extra lektid', 150, 'per tillfälle', 'boarding', true),
        (v_org_id, 'Foto-/videouppdatering', 50, 'per dag', 'boarding', true);
    
    RAISE NOTICE 'Lagt till 7 extra tjänster';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ KLART! All prisdata har uppdaterats för org_id: %', v_org_id;

END $$;

-- ============================================================
-- VERIFIERING - Visa resultatet
-- ============================================================

-- Visa grundpriser
SELECT '📊 BOARDING_PRICES' as info;
SELECT dog_size, base_price, weekend_surcharge, is_active 
FROM boarding_prices 
WHERE is_active = true
ORDER BY dog_size;

-- Visa säsonger
SELECT '📅 BOARDING_SEASONS' as info;
SELECT name, start_date, end_date, type, price_multiplier
FROM boarding_seasons 
WHERE is_active = true
ORDER BY start_date;

-- Visa nästa 10 specialdatum
SELECT '🎄 SPECIAL_DATES (nästa 10)' as info;
SELECT date, name, category, price_surcharge
FROM special_dates 
WHERE is_active = true AND date >= CURRENT_DATE
ORDER BY date
LIMIT 10;

-- Visa extra tjänster
SELECT '➕ EXTRA_SERVICES (boarding)' as info;
SELECT label, price, unit
FROM extra_services 
WHERE service_type = 'boarding' AND is_active = true
ORDER BY label;

-- Sammanfattning
SELECT '📈 SAMMANFATTNING' as info;
SELECT 
    (SELECT COUNT(*) FROM boarding_prices WHERE is_active = true) as grundpriser,
    (SELECT COUNT(*) FROM boarding_seasons WHERE is_active = true) as säsonger,
    (SELECT COUNT(*) FROM special_dates WHERE is_active = true AND date >= CURRENT_DATE) as specialdatum,
    (SELECT COUNT(*) FROM extra_services WHERE service_type = 'boarding' AND is_active = true) as extra_tjänster;
