-- ========================================
-- PRE-POPULERA SVENSKA RÖDA DAGAR 2025-2030
-- Skapad: 2025-11-13
-- Syfte: Lägg till alla svenska röda dagar med kategoriserade påslag
-- ========================================
-- 
-- KATEGORIER:
-- Minor (75-100 kr): Mindre röda dagar
-- Major (150-200 kr): Stora högtider  
-- Peak (300-400 kr): Toppdagar med högsta efterfrågan
--
-- OBS: Detta är en TEMPLATE. Kör detta för varje organisation genom att ersätta {ORG_ID}
-- eller använd "Importera röda dagar"-funktionen i UI.

-- ===== 2025 =====

-- MINOR - Mindre röda dagar (+75-100 kr)
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2025-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),
('{ORG_ID}', '2025-04-18', 'Långfredagen', 'red_day', 100, 'Påsken startar'),
('{ORG_ID}', '2025-04-21', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),
('{ORG_ID}', '2025-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),
('{ORG_ID}', '2025-05-29', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag vanlig'),
('{ORG_ID}', '2025-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),
('{ORG_ID}', '2025-11-01', 'Alla helgons dag', 'red_day', 75, 'Höstlov')

ON CONFLICT (org_id, date) DO NOTHING;

-- MAJOR - Stora högtider (+150-200 kr)
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2025-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),
('{ORG_ID}', '2025-04-20', 'Påskdagen', 'red_day', 200, 'Påskhelg'),
('{ORG_ID}', '2025-06-08', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),
('{ORG_ID}', '2025-12-25', 'Juldagen', 'red_day', 200, 'Jul'),
('{ORG_ID}', '2025-12-26', 'Annandag jul', 'red_day', 150, 'Jul')

ON CONFLICT (org_id, date) DO NOTHING;

-- PEAK - Toppdagar med högsta efterfrågan (+300-400 kr)
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2025-06-20', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),
('{ORG_ID}', '2025-06-21', 'Midsommardagen', 'red_day', 350, 'Midsommar'),
('{ORG_ID}', '2025-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen börjar'),
('{ORG_ID}', '2025-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),
('{ORG_ID}', '2025-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),
('{ORG_ID}', '2025-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),
('{ORG_ID}', '2025-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')

ON CONFLICT (org_id, date) DO NOTHING;

-- ===== 2026 =====

-- MINOR
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2026-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),
('{ORG_ID}', '2026-04-03', 'Långfredagen', 'red_day', 100, 'Påsken startar'),
('{ORG_ID}', '2026-04-06', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),
('{ORG_ID}', '2026-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),
('{ORG_ID}', '2026-05-14', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag'),
('{ORG_ID}', '2026-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),
('{ORG_ID}', '2026-10-31', 'Alla helgons dag', 'red_day', 75, 'Höstlov')

ON CONFLICT (org_id, date) DO NOTHING;

-- MAJOR
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2026-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),
('{ORG_ID}', '2026-04-05', 'Påskdagen', 'red_day', 200, 'Påskhelg'),
('{ORG_ID}', '2026-05-24', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),
('{ORG_ID}', '2026-12-25', 'Juldagen', 'red_day', 200, 'Jul'),
('{ORG_ID}', '2026-12-26', 'Annandag jul', 'red_day', 150, 'Jul')

ON CONFLICT (org_id, date) DO NOTHING;

-- PEAK
INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
('{ORG_ID}', '2026-06-19', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),
('{ORG_ID}', '2026-06-20', 'Midsommardagen', 'red_day', 350, 'Midsommar'),
('{ORG_ID}', '2026-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen'),
('{ORG_ID}', '2026-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),
('{ORG_ID}', '2026-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),
('{ORG_ID}', '2026-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),
('{ORG_ID}', '2026-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')

ON CONFLICT (org_id, date) DO NOTHING;

-- Kommentar om användning
COMMENT ON TABLE special_dates IS 'För att importera röda dagar för en organisation, ersätt {ORG_ID} med faktiskt org_id';
