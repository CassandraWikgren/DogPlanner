-- =====================================================
-- MULTI-TENANT ARKITEKTUR FÖR HUNDAR OCH BOKNINGAR
-- 2025-12-11
-- =====================================================
-- 
-- GRUNDPRINCIP: Hundägaren äger hunden, inte pensionatet
-- 
-- Tidigare problem:
--   dogs.org_id = pensionat_id → Hunden "tillhör" ett pensionat
--   Om samma hund bokar på annat pensionat → konflikter
--
-- NY MODELL:
--   - dogs.org_id kan vara NULL (hunden är global)
--   - bookings.org_id anger VILKET pensionat bokningen gäller
--   - Vid "Ny bokning" hämtas hundar via bokningar, inte dogs.org_id
--
-- FÖRDELAR:
--   ✅ Samma hund kan boka på flera pensionat
--   ✅ Kunddata delas inte mellan pensionat (via RLS på bookings)
--   ✅ Skalbart för framtiden
-- =====================================================

-- =====================================================
-- VALFRITT: Städa upp dogs.org_id (gör NULL)
-- =====================================================
-- OBS: Kör BARA om du vill göra dogs helt oberoende av org_id
-- Detta kan påverka andra delar av systemet - testa först!

-- UPDATE dogs SET org_id = NULL;

-- =====================================================
-- ALTERNATIV: Synka dogs.org_id från första bokning
-- =====================================================
-- Om du vill behålla dogs.org_id för bakåtkompatibilitet
-- men ändå få nya hundar att synas:

UPDATE dogs d
SET org_id = (
  SELECT b.org_id 
  FROM bookings b 
  WHERE b.dog_id = d.id 
  ORDER BY b.created_at ASC 
  LIMIT 1
)
WHERE d.org_id IS NULL
AND EXISTS (SELECT 1 FROM bookings WHERE dog_id = d.id);

-- =====================================================
-- VERIFIERA RESULTATET
-- =====================================================

-- Kolla alla hundar med deras org och bokningar
SELECT 
  d.name as hund,
  d.breed as ras,
  o.full_name as ägare,
  d.org_id as hund_org_id,
  COUNT(b.id) as antal_bokningar,
  COUNT(DISTINCT b.org_id) as antal_olika_pensionat
FROM dogs d
LEFT JOIN owners o ON d.owner_id = o.id
LEFT JOIN bookings b ON b.dog_id = d.id
GROUP BY d.id, d.name, d.breed, o.full_name, d.org_id
ORDER BY d.name;

-- =====================================================
-- NY QUERY FÖR ATT HÄMTA "BEFINTLIGA KUNDER"
-- =====================================================
-- Denna query används nu i nybokning/page.tsx:
--
-- SELECT DISTINCT d.*, o.*
-- FROM bookings b
-- JOIN dogs d ON b.dog_id = d.id
-- LEFT JOIN owners o ON d.owner_id = o.id
-- WHERE b.org_id = 'ditt_pensionat_id';
--
-- Detta visar alla hundar som HAR/HAFT bokning hos pensionatet,
-- oavsett vad dogs.org_id är satt till.
-- =====================================================
