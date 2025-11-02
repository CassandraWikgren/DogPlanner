# 🎯 SKAPA RIKTIGT KONTO - Steg för steg

## Scenario: Du vill testa systemet med ett riktigt konto

### ✅ REKOMMENDERAD METOD (Produktionsflöde)

#### Steg 1: Gå till registreringssidan

- Lokal: http://localhost:3000/register
- Produktion: https://dog-planner.vercel.app/register

#### Steg 2: Fyll i formuläret

```
Förnamn: Anna
Efternamn: Andersson
E-post: anna@hundkompaniet.se
Telefon: 070-123 45 67
Företagsnamn: Hundkompaniet AB
Organisationsnummer: 556123-4567
Lösenord: minst6tecken
☑️ Jag godkänner användarvillkoren
```

#### Steg 3: Klicka "Skapa konto"

Vad händer nu automatiskt:

1. ✅ Supabase skapar användarkonto (`auth.users`)
2. ✅ Du får ett bekräftelsemejl (om aktiverat)
3. ✅ Omdirigeras till "/register/success"

#### Steg 4: Logga in

- Gå till http://localhost:3000/login
- Logga in med din e-post och lösenord

#### Steg 5: Auto-onboarding triggas

När du loggar in första gången anropas `/api/onboarding/auto` som:

1. ✅ Skapar organisation i `orgs` tabellen
2. ✅ Skapar profil i `profiles` tabellen (med `org_id`)
3. ✅ Ger dig `admin`-rollen
4. ✅ Skapar 3 månaders gratis trial

#### Steg 6: Du är klar! 🎉

Nu kan du:

- Lägga till hundar via "Ny hund"
- Skapa bokningar
- Generera fakturor
- Allt med triggers och RLS aktivt

---

## ❌ UNDVIK DETTA: complete_testdata.sql

### Varför inte köra den?

**complete_testdata.sql** är avsedd för **lokal development/debugging** och gör följande FARLIGA saker:

1. **Raderar alla triggers** (rad 10-24)

   ```sql
   DROP TRIGGER IF EXISTS set_org_user_dogs ON public.dogs;
   DROP TRIGGER IF EXISTS set_org_user_owners ON public.owners;
   -- ... (alla viktiga triggers)
   ```

2. **Stänger av RLS** (rad 35-42)

   ```sql
   ALTER TABLE IF EXISTS public.dogs DISABLE ROW LEVEL SECURITY;
   ALTER TABLE IF EXISTS public.owners DISABLE ROW LEVEL SECURITY;
   -- Nu kan alla användare se ALLA hundar! 😱
   ```

3. **Raderar befintlig data**

   ```sql
   DELETE FROM public.dogs;
   DELETE FROM public.owners;
   -- Din riktiga data försvinner!
   ```

4. **Skapar fake testdata**
   ```sql
   INSERT INTO dogs (name, breed, ...) VALUES
   ('Testdog1', 'Golden Retriever', ...),
   ('Testdog2', 'Labrador', ...);
   ```

### Vad händer om du kör den ändå?

- ✅ Triggers borta → org_id sätts INTE automatiskt → Hundar kan inte skapas
- ✅ RLS avstängd → Alla användare ser ALLA organisationers data
- ✅ Din riktiga data borta → Du måste börja om från scratch
- ✅ Du får testdata som inte är din organisation

---

## 🆘 JAG HAR REDAN KÖRT complete_testdata.sql!

### Lösning: Återställ triggers och RLS

1. Öppna Supabase Dashboard → SQL Editor
2. Kör denna fil: `BACKUP_DOCS/RESTORE_TRIGGERS_AND_RLS.sql`
3. Vänta på "Triggers och RLS återställda! ✅"
4. Skapa nytt konto via /register
5. Logga in och börja använda systemet

---

## 🔍 Vanliga frågor

### F: "Jag vill testa med fake hundar lokalt, vad gör jag?"

**Svar:**

1. Skapa konto via /register (riktigt konto)
2. Logga in
3. Lägg till hundar via UI (klicka "Ny hund")
4. Nu har du testdata som är kopplad till din riktiga organisation

### F: "Varför finns complete_testdata.sql om den är farlig?"

**Svar:** Den är användbar för utvecklare som vill:

- Snabbt återskapa DB-strukturen i lokal dev
- Testa utan att registrera konton manuellt
- Debugga triggers genom att stänga av dem tillfälligt

Men den ska **ALDRIG** köras i produktion eller på din riktiga databas!

### F: "Vad är skillnaden mellan schema.sql och complete_testdata.sql?"

| schema.sql         | complete_testdata.sql |
| ------------------ | --------------------- |
| ✅ Skapar tabeller | ✅ Skapar tabeller    |
| ✅ Triggers aktiva | ❌ Raderar triggers   |
| ✅ RLS aktiverad   | ❌ Stänger av RLS     |
| ❌ Ingen data      | ✅ Skapar testdata    |
| ✅ Produktionsklar | ❌ Endast för dev     |

### F: "Hur vet jag om triggers är aktiva?"

**Kör i Supabase SQL Editor:**

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

Om du ser triggers som `trg_set_org_id_dogs`, `on_auth_user_created` etc. → ✅ Aktiva!

Om listan är tom → ❌ Någon har kört complete_testdata.sql

---

## 📋 Sammanfattning

### ✅ GÖR:

- Använd /register för att skapa konton
- Låt auto-onboarding hantera org-skapandet
- Lägg till hundar via UI när du är inloggad
- Behåll triggers och RLS aktiva

### ❌ UNDVIK:

- Kör INTE complete_testdata.sql i produktion
- Stäng INTE av triggers manuellt
- Inaktivera INTE RLS i produktion
- Skapa INTE testdata direkt i SQL om du kan använda UI

---

**Lycka till! 🐾**

Om något inte fungerar, kolla:

1. Är du inloggad?
2. Har du en organisation kopplad till din profil?
3. Är triggers aktiva? (Kör SQL-frågan ovan)
4. Är RLS aktiverad på relevanta tabeller?
