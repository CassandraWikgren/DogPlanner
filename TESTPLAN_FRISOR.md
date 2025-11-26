# 🧪 TESTPLAN - Frisörsystem

## Förberedelser

✅ Dev-server körs (npm run dev)
✅ Databas: grooming_prices tabell skapad
✅ RLS policies: Alla 11/11 tabeller säkrade

---

## Test 1: Admin-sida för Priser (5 min)

### Gå till: `/admin/hundfrisor/priser`

**Vad du ska testa:**

1. **Sidan laddas utan errors**
   - [ ] Ingen infinite loading spinner
   - [ ] Ingen röd error-ruta
   - [ ] Tabellen syns (kan vara tom)

2. **Lägg till ett pris:**
   - [ ] Fyll i "Tjänstens namn": `Badning`
   - [ ] Välj "Tjänstetyp": `bath`
   - [ ] Välj "Hundstorlek": `medium`
   - [ ] Fyll i "Pris": `300`
   - [ ] Fyll i "Beräknad tid": `60`
   - [ ] Klicka "Lägg till"
   - [ ] Priset dyker upp i tabellen

3. **Lägg till fler varianter:**
   - [ ] Badning - Liten hund - 250 kr - 45 min
   - [ ] Badning - Stor hund - 400 kr - 75 min
   - [ ] Klippning - Liten hund - 500 kr - 90 min

4. **Testa redigering:**
   - [ ] Klicka "Redigera" på ett pris
   - [ ] Ändra priset
   - [ ] Klicka "Spara"
   - [ ] Ändringen sparas

5. **Testa borttagning:**
   - [ ] Klicka "Ta bort" på ett pris
   - [ ] Confirm-dialogen visas
   - [ ] Priset försvinner efter bekräftelse

**Förväntat resultat:**
✅ Alla funktioner fungerar
✅ Data sparas i databasen
✅ Ingen lag eller errors

---

## Test 2: Bokningsflöde med DB-priser (5 min)

### Gå till: `/frisor/ny-bokning`

**Vad du ska testa:**

1. **Sidan laddas:**
   - [ ] Ingen infinite loading
   - [ ] "Välj behandling" sektion syns

2. **Priser från databasen visas:**
   - [ ] Badning - Medium (300 kr) syns
   - [ ] Badning - Liten (250 kr) syns
   - [ ] Badning - Stor (400 kr) syns
   - [ ] Klippning - Liten (500 kr) syns
   - [ ] Alla priser du lagt in i admin syns här

3. **Om inga priser finns:**
   - [ ] Meddelande visas: "Inga priser inlagda än"
   - [ ] Länk till admin-sidan visas

4. **Välj en behandling:**
   - [ ] Klicka på en behandling
   - [ ] Behandlingen markeras
   - [ ] Priset visas i sammanställningen

5. **Fyll i formulär:**
   - [ ] Välj datum & tid
   - [ ] Välj hund (eller fyll i walk-in kund)
   - [ ] Klicka "Boka"
   - [ ] Bokningen skapas

**Förväntat resultat:**
✅ Priser från admin dyker upp automatiskt
✅ Olika hundstorlekar visas som separata alternativ
✅ Bokningsflödet fungerar hela vägen

---

## Test 3: Journal-sidan (5 min)

### Hitta en hund-ID och gå till: `/frisor/[dogId]`

**Hur du hittar ett dog-ID:**

1. Gå till `/frisor` (frisör-dashboard)
2. Om det finns hundar i listan, klicka på en
3. ELLER: Öppna DevTools → Console → kör:
   ```javascript
   // I frisör-dashboard
   console.log("Första hunden:", dogs[0]?.id);
   ```

**Vad du ska testa:**

1. **Sidan laddas:**
   - [ ] Hundens namn visas
   - [ ] Ägarens info visas
   - [ ] "Klipphistorik" sektion visas

2. **Om journal finns:**
   - [ ] Tidigare besök visas i kronologisk ordning
   - [ ] Datum, tjänst, pris visas
   - [ ] Anteckningar visas

3. **Om journal är tom:**
   - [ ] Meddelande: "Ingen klipphistorik ännu"
   - [ ] Knapp "Ny bokning" fungerar

4. **Navigation:**
   - [ ] "Tillbaka till frisör"-knapp fungerar
   - [ ] "Ny bokning"-knapp går till bokningsflödet

**Förväntat resultat:**
✅ Journal-sidan laddar korrekt
✅ Historik visas om det finns
✅ Graceful empty-state om det inte finns data

---

## Test 4: Kalender-integration (5 min)

### Gå till: `/frisor/kalender`

**Vad du ska testa:**

1. **Om det finns bokningar:**
   - [ ] Bokningar syns i kalendern
   - [ ] Klicka på en bokning
   - [ ] Bokningsdetaljer visas i popup

2. **"Visa Journal"-knapp:**
   - [ ] Knappen är aktiv om bokningen har en dog_id
   - [ ] Klicka "Visa Journal"
   - [ ] Journal-sidan öppnas för rätt hund

3. **För walk-in kunder:**
   - [ ] "Visa Journal"-knapp är disabled
   - [ ] Tydligt meddelande varför

**Förväntat resultat:**
✅ Navigation från kalender till journal fungerar
✅ Endast bokningar med dog_id kan öppna journal
✅ Smooth UX

---

## Test 5: End-to-End Full Flow (10 min)

**Komplett användarresa:**

1. **Admin lägger till priser** (2 min)
   - Gå till `/admin/hundfrisor/priser`
   - Lägg till 3-4 olika priser

2. **Kund bokar tid** (3 min)
   - Gå till `/frisor/ny-bokning`
   - Välj behandling från DB-priser
   - Fyll i kundinfo
   - Boka

3. **Frisör ser bokningen** (2 min)
   - Gå till `/frisor/kalender`
   - Bokningen syns i kalendern
   - Öppna bokningsdetaljer

4. **Markera som klar** (1 min)
   - Ändra status till "completed"
   - Journal-entry skapas automatiskt (trigger)

5. **Kolla journal** (2 min)
   - Klicka "Visa Journal"
   - Behandlingen syns i journal-historiken
   - Pris och datum är korrekta

**Förväntat resultat:**
✅ Hela flödet fungerar utan errors
✅ Data synkas korrekt mellan alla delar
✅ Journal skapas automatiskt
✅ Priser från admin används överallt

---

## 🐛 Om något går fel:

### Problem: Priser syns inte i bokningsflödet

**Fix:**

1. Öppna DevTools Console
2. Kolla efter errors
3. Verifiera att `grooming_prices` har data:
   ```sql
   SELECT * FROM grooming_prices LIMIT 5;
   ```

### Problem: Journal-sidan visar ingen data

**Fix:**

1. Kolla om `grooming_journal` har data
2. Verifiera dog_id är korrekt
3. Kolla RLS policies fungerar

### Problem: Infinite loading spinner

**Fix:**

1. Kontrollera att currentOrgId finns
2. Kolla Console för errors
3. Verifiera Supabase-anslutningen

---

## ✅ Success Criteria

**PASS om:**

- ✅ Admin kan lägga till/redigera/ta bort priser
- ✅ Priser syns automatiskt i bokningsflödet
- ✅ Bokningar kan skapas med DB-priser
- ✅ Journal-sidan laddar korrekt
- ✅ Navigation från kalender fungerar
- ✅ Inga errors i Console

**REDO FÖR PRODUKTION om alla ovanstående PASS!** 🚀

---

## 📊 Rapportera Resultat

När du testat, rapportera:

1. ✅ Vad som fungerade
2. ❌ Vad som inte fungerade (om något)
3. 🐛 Errors från Console (screenshot)
4. 💡 Förbättringsförslag

**Lycka till med testningen! 🎉**
