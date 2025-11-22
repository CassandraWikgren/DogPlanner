# 🚀 Installera Kundnummer‑migration (kundnummer per organisation)

> Viktigt: Klistra inte in hela denna Markdown‑fil i Supabase SQL Editor. Kopiera endast SQL‑blocket nedan eller öppna filen `supabase/migrations/20250103_unique_customer_numbers_CLEAN.sql` och klistra in dess innehåll.

## Snabbguide – Kör migration i Supabase

### Steg 1: Öppna Supabase SQL Editor

1. Gå till: https://fhdkkkujnhteetllxypg.supabase.co/project/_/sql
2. Logga in om du inte redan är det

### Steg 2: Kopiera SQL‑koden

Alternativ A (rekommenderas): Öppna filen `supabase/migrations/20250103_unique_customer_numbers_CLEAN.sql` och kopiera allt.

Alternativ B: Kopiera SQL‑blocket här nedanför (identiskt innehåll):

```sql
-- Migration: Garantera unika kundnummer per organisation
-- Skapad: 2025-01-03
-- Syfte: Förhindra dubbletter och race conditions vid tilldelning av kundnummer

-- 1. Lägg till unique constraint på (org_id, customer_number)
-- Detta garanterar att samma kundnummer inte kan användas två gånger i samma org
ALTER TABLE owners
	DROP CONSTRAINT IF EXISTS owners_org_customer_unique;

ALTER TABLE owners
	ADD CONSTRAINT owners_org_customer_unique
	UNIQUE (org_id, customer_number);

-- 2. Skapa trigger-funktion som auto-genererar kundnummer om det saknas
CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
	max_customer_number INTEGER;
BEGIN
	-- Kör bara om customer_number är NULL eller 0
	IF NEW.customer_number IS NULL OR NEW.customer_number = 0 THEN
		-- Hämta högsta befintliga kundnummer i organisationen
		SELECT COALESCE(MAX(customer_number), 0) INTO max_customer_number
		FROM owners
		WHERE org_id = NEW.org_id;

		-- Sätt nästa nummer i sekvensen
		NEW.customer_number := max_customer_number + 1;

		RAISE NOTICE 'Auto-genererat kundnummer % för org_id %', NEW.customer_number, NEW.org_id;
	ELSE
		-- Om admin har satt ett nummer manuellt, verifiera att det inte redan finns
		-- (unique constraint kommer kasta fel om det är duplicat, men vi ger bättre felmeddelande)
		IF EXISTS (
			SELECT 1 FROM owners
			WHERE org_id = NEW.org_id
				AND customer_number = NEW.customer_number
				AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
		) THEN
			RAISE EXCEPTION 'Kundnummer % används redan i denna organisation', NEW.customer_number;
		END IF;

		RAISE NOTICE 'Använder manuellt satt kundnummer % för org_id %', NEW.customer_number, NEW.org_id;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Skapa trigger som körs innan INSERT eller UPDATE
DROP TRIGGER IF EXISTS trigger_auto_customer_number ON owners;

CREATE TRIGGER trigger_auto_customer_number
	BEFORE INSERT OR UPDATE ON owners
	FOR EACH ROW
	EXECUTE FUNCTION auto_generate_customer_number();

-- 4. Fixa eventuella befintliga dubbletter (om några finns)
-- Detta identifierar och omtilldelar kundnummer för dubbletter

DO $$
DECLARE
	duplicate_record RECORD;
	new_number INTEGER;
	max_in_org INTEGER;
BEGIN
	-- Hitta alla organisationer med dubbletter
	FOR duplicate_record IN
		SELECT org_id, customer_number, array_agg(id) as owner_ids
		FROM owners
		WHERE customer_number IS NOT NULL
		GROUP BY org_id, customer_number
		HAVING COUNT(*) > 1
	LOOP
		RAISE NOTICE 'Hittat dubbletter i org %: kundnummer %',
			duplicate_record.org_id, duplicate_record.customer_number;

		-- Hämta högsta nummer i org
		SELECT COALESCE(MAX(customer_number), 0) INTO max_in_org
		FROM owners
		WHERE org_id = duplicate_record.org_id;

		-- Omtilldela alla utom den första ägaren (behåll äldsta)
		FOR i IN 2..array_length(duplicate_record.owner_ids, 1) LOOP
			max_in_org := max_in_org + 1;

			UPDATE owners
			SET customer_number = max_in_org,
					updated_at = now()
			WHERE id = duplicate_record.owner_ids[i];

			RAISE NOTICE 'Omtilldelat ägare % till nytt kundnummer %',
				duplicate_record.owner_ids[i], max_in_org;
		END LOOP;
	END LOOP;

	-- Logga resultat
	IF NOT FOUND THEN
		RAISE NOTICE 'Inga dubbletter hittades - databasen är ren!';
	END IF;
END $$;

-- 5. Skapa index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_owners_org_customer
	ON owners(org_id, customer_number);
```

Du kan också köra detta kommando för att kopiera filens innehåll till clipboard (macOS):

```bash
cat supabase/migrations/20250103_unique_customer_numbers_CLEAN.sql | pbcopy
```

### Steg 3: Klistra in och kör

1. I SQL Editor: Klicka på "New query"
2. Klistra in hela SQL-koden från migrationen
3. Klicka på "Run" (eller tryck Cmd+Enter)

### Steg 4: Verifiera resultatet

Du kommer se output som visar:

- ✅ Constraint skapad
- ✅ Trigger-funktion skapad
- ✅ Trigger kopplad till owners-tabellen
- ✅ Om dubbletter hittades: `NOTICE: Hittat dubbletter i org X: kundnummer Y`
- ✅ Om inga dubbletter: `NOTICE: Inga dubbletter hittades - databasen är ren!`
- ✅ Index skapat

### Steg 5: Testa att det fungerar

Kör detta test-query för att verifiera:

```sql
-- Test 1: Kontrollera att constraint finns
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'owners_org_customer_unique';
-- Förväntat: 1 rad med contype = 'u' (unique)

-- Test 2: Kontrollera att trigger finns
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_customer_number';
-- Förväntat: 2 rader (INSERT och UPDATE)

-- Test 3: Kontrollera att inga dubbletter finns
SELECT org_id, customer_number, COUNT(*) as antal
FROM owners
WHERE customer_number IS NOT NULL
GROUP BY org_id, customer_number
HAVING COUNT(*) > 1;
-- Förväntat: 0 rader
```

### Steg 6: Testa auto-generering (valfritt)

```sql
-- Skapa en test-ägare (byt ut org_id mot din organisations ID)
INSERT INTO owners (full_name, email, phone, org_id, customer_number)
VALUES ('Test Testsson', 'test@test.se', '0701234567', 'DIN_ORG_ID_HÄR', NULL);

-- Verifiera att customer_number auto-genererades
SELECT full_name, customer_number FROM owners WHERE email = 'test@test.se';

-- Rensa test-data
DELETE FROM owners WHERE email = 'test@test.se';
```

---

## Felsökning

### Problem: "constraint already exists"

**Lösning**: Ignorera - betyder att constraint redan fanns

### Problem: "trigger already exists"

**Lösning**: Ignorera - `CREATE OR REPLACE` hanterar detta

### Problem: "permission denied"

**Lösning**: Kontrollera att du är inloggad med rätt konto i Supabase Dashboard

---

## Efter migrationen

Systemet fungerar nu automatiskt:

- ✅ Nya ägare får automatiskt nästa lediga kundnummer
- ✅ Admin kan sätta manuella nummer (valideras automatiskt)
- ✅ Dubbletter förhindras på databas-nivå
- ✅ Race conditions kan inte längre inträffa

**Ingen mer kod behöver ändras** - EditDogModal är redan uppdaterad! 🎉

---

## Rollback (om det skulle behövas)

Kör endast om du behöver backa migrationen:

```sql
-- Ta bort triggern
DROP TRIGGER IF EXISTS trigger_auto_customer_number ON owners;
DROP FUNCTION IF EXISTS auto_generate_customer_number();

-- Ta bort unique constraint
ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_org_customer_unique;

-- Ta bort index
DROP INDEX IF EXISTS idx_owners_org_customer;
```
