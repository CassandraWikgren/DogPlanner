# 🧪 Testplan för Hunddagis - Intresseanmälningar

## ✅ Vad är klart

### 1. Databas

- ✅ `interest_applications` tabell i schema.sql
- ✅ SQL-migration med testdata: `create-interest-applications.sql`
- ✅ Alla nödvändiga kolumner finns i `owners` och `dogs` tabeller

### 2. Frontend

- ✅ Publikt ansökningsformulär: `/ansokan/hunddagis`
- ✅ Admin-gränssnitt: `/hunddagis/intresseanmalningar`
- ✅ Överföringsfunktion med validering och preview
- ✅ Statushantering (pending, contacted, accepted, declined)

### 3. Funktionalitet

- ✅ Skapa ansökan via publikt formulär
- ✅ Visa alla ansökningar för organisation
- ✅ Filtrera efter status
- ✅ Uppdatera status och anteckningar
- ✅ Överföra godkänd ansökan → skapa ägare + hund

---

## 🚀 Steg för att testa systemet

### Steg 1: Lägg in testdata i Supabase

1. Öppna Supabase Dashboard
2. Gå till SQL Editor
3. Kör SQL-filen: `create-interest-applications.sql`
4. Verifiera att 4 testansökningar skapades:
   - Maria Svensson / Bella (pending)
   - Erik Andersson / Max (contacted)
   - Lisa Johansson / Charlie (accepted) ← **Denna ska överföras**
   - Anders Karlsson / Rocky (declined)

### Steg 2: Testa Admin-gränssnittet

1. Logga in som admin
2. Gå till `/hunddagis`
3. Klicka på "Intresseanmälningar"-kortet
4. **Verifiera:**
   - ✅ Ser du alla 4 ansökningar?
   - ✅ Kan du filtrera efter status?
   - ✅ Kan du klicka och se detaljer för varje ansökan?
   - ✅ Kan du uppdatera status?
   - ✅ Kan du lägga till anteckningar?

### Steg 3: Testa överföringsfunktionen

1. Välj Lisa Johansson / Charlie (status = accepted)
2. **Verifiera UI:**
   - ✅ Ser du "Överföring till Hunddagis"-sektion?
   - ✅ Ser du preview med ägare, hund, abonnemang, startdatum?
   - ✅ Är knappen aktiv (ej disabled)?
3. Klicka "Överför till Hunddagis"
4. **Verifiera bekräftelsedialog:**
   - ✅ Visas confirm-dialog med korrekt info?
5. Bekräfta överföringen
6. **Verifiera resultat:**
   - ✅ Visas success-meddelande?
   - ✅ Uppdateras anteckningsfältet med "ÖVERFÖRD TILL HUNDDAGIS"?
   - ✅ Blir knappen disabled med "Redan överförd"?

### Steg 4: Verifiera i databasen

1. Gå till Supabase → Table Editor
2. Kolla `owners` tabellen:
   - ✅ Finns Lisa Johansson?
   - ✅ Rätt email, telefon, stad?
3. Kolla `dogs` tabellen:
   - ✅ Finns Charlie?
   - ✅ Rätt owner_id (kopplad till Lisa)?
   - ✅ Rätt breed, birth, gender, heightcm?
   - ✅ Rätt subscription, days, startdate?
   - ✅ Rätt special_needs?
   - ✅ is_castrated = true (från is_neutered)?
   - ✅ is_house_trained = true (inverterat från not_house_trained)?
4. Gå till `/hunddagis` huvudsidan:
   - ✅ Syns Charlie i listan över dagishundar?

### Steg 5: Testa dublettskydd

1. Gå tillbaka till intresseanmälningar
2. Ändra status på Maria Svensson / Bella till "accepted"
3. **Viktigt:** Ändra Marias e-post till **samma som Lisa** (lisa.johansson@example.com)
4. Försök överföra Bella
5. **Verifiera:**
   - ✅ Skapas ingen ny ägare?
   - ✅ Kopplas Bella till befintlig ägare (Lisa)?
   - ✅ Finns nu båda hundarna under samma ägare?

### Steg 6: Testa valideringar

1. Skapa ny testansökan via `/ansokan/hunddagis` (eller manuellt i Supabase)
2. Lämna något obligatoriskt fält tomt (t.ex. dog_name)
3. Sätt status till "accepted"
4. **Verifiera:**
   - ✅ Visas gul varning om saknade fält?
   - ✅ Är överföringsknappen disabled?
5. Fyll i alla obligatoriska fält
6. **Verifiera:**
   - ✅ Försvinner varningen?
   - ✅ Blir knappen aktiv?

---

## 🐛 Kända begränsningar (TODO)

- ❌ **Email-bekräftelser**: Ingen email skickas automatiskt efter överföring (kommenterad i kod)
- ❌ **org_id i publikt formulär**: Hårdkodat just nu, behöver hämtas från subdomain/URL
- ❌ **Kalendervy**: Finns ej ännu
- ❌ **Automatisk fakturering**: Finns ej ännu

---

## 📊 Dataflöde (översikt)

```
1. Kund →  /ansokan/hunddagis
           ↓
2.         interest_applications (tabell)
           ↓
3. Admin → /hunddagis/intresseanmalningar
           ↓
4.         Ändra status → accepted
           ↓
5.         Klicka "Överför"
           ↓
6.         Sök/skapa owner (dublettskydd via email)
           ↓
7.         Skapa dog (mappa alla fält)
           ↓
8.         Uppdatera application.notes
           ↓
9. ✅      Hund finns i /hunddagis lista
```

---

## 🔍 Felsökning

### Problem: "interest_applications finns inte"

**Lösning:** Kör `create-interest-applications.sql` i Supabase SQL Editor

### Problem: "Ingen testdata visas"

**Lösning:**

1. Kontrollera att org_id matchar din organisation
2. Ändra SQL: `(SELECT id FROM orgs WHERE slug = 'DIN-SLUG' LIMIT 1)`

### Problem: "Överföringen misslyckas"

**Lösning:**

1. Öppna browser console (F12)
2. Leta efter fel i console
3. Kontrollera att alla FK-constraints är OK:
   - owners.org_id → orgs.id
   - dogs.owner_id → owners.id
   - dogs.org_id → orgs.id

### Problem: "is_house_trained är fel"

**Lösning:** Detta är korrekt! Formuläret frågar "Är INTE rumstränerad?" (not_house_trained)

- not_house_trained = true → is_house_trained = false
- not_house_trained = false → is_house_trained = true

---

## ✨ Nästa steg efter lyckad testning

1. Implementera email-bekräftelser
2. Fixa org_id-detection i publikt formulär
3. Skapa kalendervy
4. Implementera automatisk fakturering
5. Lägg till mer avancerad sökning/filtrering
6. Export-funktion för rapporter

---

**Lycka till med testningen! 🐕🎉**
