# 🔧 GROOMING PRICES - SNABBFIX

**Problem:** "Kunde inte lägga till: new row violates row-level security policy"  
**Status:** 🟡 FIXAT I KOD - BEHÖVER KÖRAS I SUPABASE

---

## 🎯 SNABBSTART (5 minuter)

### Steg 1: Kör SQL-fix i Supabase

1. Öppna [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt: `fhdkkkujnhteetllxypg`
3. Gå till **SQL Editor**
4. Kör filen: `FIX_GROOMING_PRICES_FINAL.sql`
5. Vänta på bekräftelse: "🎉 GROOMING_PRICES RLS FIX KOMPLETT!"

### Steg 2: Testa i UI

1. Logga in på DogPlanner
2. Gå till **Admin → Hundfrisör → Priser**
3. Öppna Console (tryck `F12`)
4. Klicka **"Lägg till pris"**
5. Fyll i:
   - Tjänstetyp: Badning
   - Tjänstnamn: Badning med bad och fön - tjänsteman
   - Hundstorlek: Liten (5-10 kg)
   - Pälstyp: Mellanlång
   - Pris: 500 kr
   - Tid: 60 minuter
6. Klicka **"Spara"**
7. Kolla Console för debug-logs:
   - ✅ "🐛 DEBUG - Försöker lägga till pris:"
   - ✅ "✅ Pris tillagt framgångsrikt:"

---

## 🔍 VAD HAR FIXATS

### Kod-förbättringar (`app/admin/hundfrisor/priser/page.tsx`):

1. ✅ **Förbättrad felhantering** - Specifika felmeddelanden för RLS-problem
2. ✅ **Debug-logging** - Alla INSERT/SELECT operationer loggas till Console
3. ✅ **Validering** - Kontrollerar att currentOrgId finns innan INSERT
4. ✅ **Typkonvertering** - Säkerställer att price/duration är nummer

### SQL-förbättringar (`FIX_GROOMING_PRICES_FINAL.sql`):

1. ✅ **Separata RLS policies** - En för varje operation (SELECT, INSERT, UPDATE, DELETE)
2. ✅ **Enklare WITH CHECK** - Använder IN-subquery istället för komplex logik
3. ✅ **Diagnostik** - Visar status före och efter fix
4. ✅ **Verifiering** - Räknar policies och bekräftar korrekt setup

---

## 📋 FILER SOM ÄR RELEVANTA

### Fixa problemet:

- ✅ **FIX_GROOMING_PRICES_FINAL.sql** - KÖR DENNA I SUPABASE!
- ✅ **app/admin/hundfrisor/priser/page.tsx** - Redan fixad med debug-logging

### Djupdykning (om problem kvarstår):

- 📚 **GROOMING_PRICES_FIX_GUIDE.md** - Komplett felsökningsguide
- 📚 **supabase/migrations/FIX_GROOMING_PRICES_RLS.sql** - Original RLS-fix
- 📚 **supabase/migrations/20251125_create_grooming_prices.sql** - Tabell-schema

---

## 🚨 VANLIGA PROBLEM EFTER FIX

### Problem 1: "Ingen organisation tilldelad"

**Symptom:** Meddelande visas istället för formulär  
**Orsak:** currentOrgId är NULL  
**Lösning:**

```sql
-- Kör i Supabase SQL Editor:
SELECT id, email, org_id FROM profiles WHERE id = auth.uid();
-- Om org_id är NULL, kör healing:
SELECT heal_user_missing_org(auth.uid());
```

### Problem 2: Priset läggs till men visas inte

**Symptom:** "Nytt pris tillagt!" men listan är tom  
**Orsak:** SELECT RLS policy blockerar läsning  
**Lösning:** Kör `FIX_GROOMING_PRICES_FINAL.sql` igen

### Problem 3: "duplicate key violation"

**Symptom:** Fel om samma kombination av tjänst+storlek+pälstyp  
**Orsak:** UNIQUE constraint på (org_id, service_type, dog_size, coat_type)  
**Lösning:** Ändra någon av parametrarna eller redigera befintligt pris

---

## 🎯 DEBUG CHECKLIST

Om problemet kvarstår efter SQL-fix:

### I Supabase SQL Editor:

```sql
-- 1. Verifiera att policies finns
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'grooming_prices';
-- Förväntat: 4 rader (SELECT, INSERT, UPDATE, DELETE)

-- 2. Verifiera att RLS är aktivt
SELECT relrowsecurity FROM pg_class WHERE relname = 'grooming_prices';
-- Förväntat: true

-- 3. Testa manuell INSERT
INSERT INTO grooming_prices (org_id, service_name, service_type, price, duration_minutes)
SELECT org_id, 'Test', 'bath', 300, 60 FROM profiles WHERE id = auth.uid();
-- Förväntat: 1 rad inserted

-- 4. Rensa test
DELETE FROM grooming_prices WHERE service_name = 'Test';
```

### I Browser Console (F12):

```javascript
// Kolla att currentOrgId finns
// Leta efter: "🐛 DEBUG - Grooming Prices Page mounted:"
// Verifiera att currentOrgId är ett UUID (inte null/undefined)

// Kolla INSERT-försök
// Leta efter: "🐛 DEBUG - Försöker lägga till pris:"
// Verifiera att insertData innehåller org_id

// Kolla resultat
// Leta efter antingen:
// ✅ "✅ Pris tillagt framgångsrikt:"
// eller
// ❌ "❌ Supabase INSERT error:"
```

---

## 📞 OM INGET FUNGERAR

1. **Kör FIX_GROOMING_PRICES_FINAL.sql** - Om inte redan gjort
2. **Logga ut och in igen** - Uppdatera session
3. **Hårduppdatera sidan** - Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
4. **Kolla Console logs** - Öppna F12 och se vad som loggas
5. **Läs GROOMING_PRICES_FIX_GUIDE.md** - Djupare diagnostik

---

## ✅ FRAMGÅNGSKRITERIER

Du vet att det fungerar när:

1. ✅ SQL-scriptet kördes utan fel i Supabase
2. ✅ Console visar: "🐛 DEBUG - Grooming Prices Page mounted: { currentOrgId: '...' }"
3. ✅ Du kan fylla i formuläret "Lägg till nytt pris"
4. ✅ När du klickar "Spara" visas: "Nytt pris tillagt!"
5. ✅ Priset dyker upp i tabellen under formuläret
6. ✅ Console visar: "✅ Pris tillagt framgångsrikt:"

---

## 🎉 EFTER FRAMGÅNGSRIK FIX

När allt fungerar:

1. **Ta bort test-priser** - Rensa eventuella test-poster
2. **Lägg till riktiga priser** - Skapa din prislista
3. **Testa alla operationer:**
   - ✅ Lägg till nytt pris
   - ✅ Redigera pris
   - ✅ Ta bort pris
   - ✅ Priser visas i frisör-bokningsflödet

---

## 🔗 RELATERADE SYSTEM

### Efter grooming_prices fix, verifiera också:

- **/frisor/ny-bokning** - Att priser visas i dropdown
- **grooming_bookings** - Att bokningar kan skapas
- **fakturaunderlag** - Att frisörbehandlingar räknas

---

**Senast uppdaterad:** 30 november 2025  
**Version:** 2.0  
**Status:** ✅ Klar för produktion efter SQL-fix
