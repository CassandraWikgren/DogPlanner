# Pattern 3 Implementation Status

**Datum:** 5 december 2025  
**Status:** Phase 1 (Database) ✅ Klar | Phase 2 (Frontend) ⚠️ Delvis klar | Phase 3 (Testing) ⏳ Väntar

---

## 📋 Översikt

Pattern 3 implementerar en global registreringsmodell inspirerad av Airbnb/Booking.com där:

1. Hundsägare registrerar sig **utan** att välja organisation
2. Hundsägare bläddrar bland tillgängliga hunddagisar
3. Hundsägare ansöker om plats hos specifik organisation
4. Organisation godkänner/avslår ansökan
5. Vid godkännande: `owners.org_id` och `dogs.org_id` fylls i automatiskt

---

## ✅ Genomfört (Phase 1 & 2)

### Database Migrations (Phase 1)

**Filer skapade:**

- ✅ `/supabase/migrations/20251204_pattern3_global_registration.sql`
  - ALTER TABLE owners: Lägger till `registered_at` TIMESTAMP, `preferred_orgs` UUID[]
  - ALTER TABLE dogs: Lägger till `registered_at` TIMESTAMP
  - CREATE TABLE applications: Ny tabell för ansökningar
    - Kolumner: id, org_id, owner_id, dog_id, status, applied_at, responded_at, response_notes
    - Indexes på org_id, owner_id, dog_id, status, applied_at
    - CHECK constraint för status (pending, approved, rejected, withdrawn)
    - UNIQUE constraint (org_id, owner_id, dog_id) för att förhindra dubbletter
  - ENABLE RLS på applications
  - Verifieringsfrågor för att bekräfta att migrations fungerade

- ✅ `/supabase/migrations/20251204_pattern3_rls_policies.sql`
  - **OWNERS policies:**
    - INSERT: Permissive (`WITH CHECK (TRUE)`) - tillåter registrering utan org_id
    - SELECT: Self OR org members OR applicants to org
    - UPDATE: Self OR org can update org members
    - DELETE: Self only
  - **DOGS policies:** (samma mönster som owners)
  - **APPLICATIONS policies:**
    - INSERT: Owner only (owner_id = auth.uid())
    - SELECT: Owner sees own, org sees incoming
    - UPDATE: Org only (approve/reject)
    - DELETE: Owner (withdraw) OR org (remove)

**⚠️ KRITISKT:** Dessa SQL-filer är **INTE** körda i Supabase än! De måste köras manuellt.

### Frontend Changes (Phase 2)

**Uppdaterad:**

- ✅ `app/kundportal/registrera/page.tsx`
  - Ändrat success-meddelande: "Du omdirigeras till att söka hunddagisar..."
  - Redirect efter registrering: `/kundportal/soka-hunddagis` (istället för login)
  - Behåller org_id = NULL (default) vid registrering

**Skapad:**

- ✅ `app/kundportal/soka-hunddagis/page.tsx` (NY SID)
  - Visar alla hunddagisar med `enabled_services` som innehåller "hunddagis"
  - Sökfunktion (namn, adress)
  - Ansök om plats-knapp per organisation
  - Skapar rad i applications-tabellen vid ansökan
  - Felhantering om applications-tabellen inte finns än
  - ⚠️ **NOTE:** Använder endast kolumner som finns i deployed database (enabled_services). När schema uppdateras med lan/kommun/service_types kan filtrering förbättras.

**Build Status:** ✅ TypeScript build passes (`npm run build`)

---

## ⏳ Återstår (Phase 3)

### Database

**Priority 1:** Kör migrations i Supabase

```bash
# Kör dessa i Supabase SQL Editor (i ordning):
1. supabase/migrations/20251204_pattern3_global_registration.sql
2. supabase/migrations/20251204_pattern3_rls_policies.sql
```

**Verifiera:**

```sql
-- Check att applications finns
SELECT * FROM applications LIMIT 1;

-- Check att owners.org_id är nullable
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'owners' AND column_name = 'org_id';

-- Check att RLS policies är uppdaterade
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename IN ('owners', 'dogs', 'applications');
```

### Frontend

**Priority 2:** Skapa organisations-dashboard för ansökningar

- ⏳ `app/hundpensionat/ansokningar/page.tsx` (NYcreate)
  - Lista alla pending applications för organisation
  - Visa ägare + hund-detaljer
  - Godkänn-knapp: UPDATE applications status, UPDATE owners org_id, UPDATE dogs org_id, CREATE booking
  - Avslå-knapp: UPDATE applications status, visa response_notes-form
  - Tabs för filter: Pending | Approved | Rejected

**Priority 3:** Förbättra soka-hunddagis
När schema uppdateras med `lan`, `kommun`, `service_types` på orgs-tabellen:

- Lägg till län/kommun-filter
- Uppdatera TypeScript types (database.ts)
- Uppdatera Organisation interface
- Visa kommun/län i kort

---

## 🧪 Testing Checklist

När allt är klart, testa denna flow:

1. **Registrering:**
   - [ ] Ny hundsägare går till `/kundportal/registrera`
   - [ ] Fyller i formulär (UTAN org selection)
   - [ ] Registrering lyckas
   - [ ] Omdirigeras till `/kundportal/soka-hunddagis`

2. **Bläddra och ansök:**
   - [ ] Ser lista över hunddagisar
   - [ ] Kan söka efter namn/adress
   - [ ] Klickar "Ansök om plats"
   - [ ] Success-meddelande visas
   - [ ] Rad skapas i applications-tabellen (status = pending)

3. **Organisation godkänner:**
   - [ ] Organisation ser ansökan i `/hundpensionat/ansokningar`
   - [ ] Ser ägarens och hundens detaljer
   - [ ] Klickar "Godkänn"
   - [ ] owners.org_id uppdateras
   - [ ] dogs.org_id uppdateras
   - [ ] Bokning skapas automatiskt
   - [ ] Application status = approved

4. **Hundsägare kan nu boka:**
   - [ ] Hundsägare har org_id
   - [ ] Kan boka normalt i kundportalen
   - [ ] Organisation ser bokningen

---

## 🔧 Tekniska detaljer

### Database Schema Changes

```sql
-- owners
ALTER TABLE owners
  ADD COLUMN registered_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN preferred_orgs UUID[];

-- dogs
ALTER TABLE dogs
  ADD COLUMN registered_at TIMESTAMP DEFAULT NOW();

-- applications (NEW TABLE)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  owner_id UUID REFERENCES owners(id) NOT NULL,
  dog_id UUID REFERENCES dogs(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_notes TEXT,
  UNIQUE(org_id, owner_id, dog_id),
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'))
);
```

### RLS Policy Pattern

**Permissive Registration:**

```sql
-- Tillåter alla att skapa ägarprofil (org_id = NULL)
CREATE POLICY "owners_insert_permissive" ON owners
  FOR INSERT WITH CHECK (TRUE);
```

**Org-Scoped Operations:**

```sql
-- Organisation ser egna medlemmar + inkommande ansökningar
CREATE POLICY "owners_select_org" ON owners
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT owner_id FROM applications
              WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );
```

### TypeScript Workaround

Eftersom applications-tabellen inte finns i deployed database än, används:

```typescript
// @ts-ignore - applications table will exist after migrations are run
const { data, error } = await supabase
  .from("applications")
  // @ts-ignore - applications table schema
  .insert({...});
```

Detta kan tas bort när:

1. Migrations är körda
2. TypeScript types regenereras från Supabase

---

## 📝 Commits denna session

1. ✅ Registration flow: Redirect to soka-hunddagis
2. ✅ Created browse organisations page (soka-hunddagis)
3. ✅ Build verification: npm run build passes

---

## ❓ FAQ

**Q: Varför måste migrations köras manuellt?**  
A: De skapade SQL-filerna ligger i `/supabase/migrations/` men körs inte automatiskt. De måste kopieras och köras i Supabase SQL Editor för att uppdatera deployed database.

**Q: Vad händer om jag försöker ansöka innan migrations är körda?**  
A: Användaren får ett felmeddelande: "Ansökningssystemet är inte aktiverat än. Databas-migrationer behöver köras först."

**Q: Varför använder soka-hunddagis inte lan/kommun-filter?**  
A: Deployed database saknar dessa kolumner på orgs-tabellen. De finns i SQL-filer men inte i deployed schema. Efter schema-uppdatering kan filtrering läggas till.

**Q: Hur fungerar org_id-assignment?**  
A: När organisation godkänner ansökan:

```typescript
// 1. Update application
UPDATE applications SET status = 'approved', responded_at = NOW();

// 2. Assign org_id
UPDATE owners SET org_id = :org_id WHERE id = :owner_id;
UPDATE dogs SET org_id = :org_id WHERE id = :dog_id;

// 3. Create booking (optional)
INSERT INTO bookings (...);
```

---

## 🚀 Next Steps

**Steg 1 (User):** Kör båda migrations-filerna i Supabase SQL Editor  
**Steg 2 (Dev):** Skapa app/hundpensionat/ansokningar/page.tsx  
**Steg 3 (Test):** End-to-end test av hela flödet  
**Steg 4 (Deploy):** Regenerera TypeScript types, ta bort @ts-ignore, deploy

---

**Status:** Ready for user to run database migrations ✅
