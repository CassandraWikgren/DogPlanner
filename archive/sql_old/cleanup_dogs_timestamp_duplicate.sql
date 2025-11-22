-- ========================================
-- TA BORT DUPLICERAD TIMESTAMP TRIGGER PÅ DOGS
-- ========================================
-- Dogs har 2 triggers som gör exakt samma sak:
-- 1. set_last_updated (använder update_last_updated())
-- 2. trg_update_dogs_updated_at (använder update_last_updated())
--
-- Båda sätter "last_updated = now()" vid UPDATE.
-- Vi behöver bara EN.

-- Ta bort den äldre versionen
DROP TRIGGER IF EXISTS set_last_updated ON dogs;

-- Behåll: trg_update_dogs_updated_at (den nya, bättre namngivna)

-- Verifiera
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE NOT tgisinternal 
  AND tgrelid::regclass = 'dogs'::regclass
ORDER BY tgname;

-- FÖRVÄNTAT RESULTAT:
-- trg_auto_match_owner
-- trg_create_journal_on_new_dog
-- trg_set_dog_org_id
-- trg_update_dogs_updated_at (BARA EN timestamp trigger!)
