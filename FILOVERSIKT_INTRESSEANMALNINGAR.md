# 📁 Filöversikt - Hunddagis Intresseanmälningar

## Nya filer skapade

### Frontend

1. **`app/ansokan/hunddagis/page.tsx`** (680 rader)

   - Publikt 3-stegs ansökningsformulär
   - Steg 1: Ägarinfo (namn, email, telefon, stad)
   - Steg 2: Hundinfo (namn, ras, födelsedatum, kön, mankhöjd, checkboxes)
   - Steg 3: Abonnemang (typ, veckodagar, startdatum, GDPR)
   - Sparar till `interest_applications` tabell

2. **`app/hunddagis/intresseanmalningar/page.tsx`** (795 rader)

   - Admin-gränssnitt för att hantera ansökningar
   - Lista med filter per status
   - Detaljvy med all information
   - Statushantering och anteckningar
   - **Överföringsfunktion** → skapar owner + dog

3. **`app/hunddagis/priser/page.tsx`** (~460 rader)
   - Admin-prissättning per mankhöjd och abonnemangstyp
   - CRUD för `subscription_types` tabell

### Database

4. **`hunddagis_schema_update.sql`** (~180 rader)

   - `owners.personnummer`
   - `dogs.insurance_company`, `dogs.insurance_number`
   - `subscription_types` tabell
   - `daycare_service_completions` tabell

5. **`create-interest-applications.sql`** (150 rader)
   - Skapar `interest_applications` tabell
   - 4 testansökningar (pending, contacted, accepted, declined)

### Dokumentation

6. **`TESTPLAN_INTRESSEANMALNINGAR.md`** (denna fil)
   - Komplett testplan med steg-för-steg instruktioner

---

## Modifierade filer

### Frontend

1. **`app/hunddagis/page.tsx`** (e4933c4, ace6971)

   - Klickbara hero-kort med live-statistik
   - Tjänster-vy med checkboxes
   - Hundrum-vy förbättrad

2. **`components/EditDogModal.tsx`** (de94484)
   - Använder riktiga databas-kolumner för försäkring
   - `dogs.insurance_company` och `dogs.insurance_number`
   - `owners.personnummer` (admin-only)

### Database

3. **`supabase/schema.sql`** (de94484)
   - Synkroniserad med alla nya tabeller och kolumner

---

## Databas-tabeller involverade

### Befintliga tabeller (uppdaterade)

- **`owners`**
  - NY kolumn: `personnummer` (admin-låst)
  - Används för: ägare från ansökningar
- **`dogs`**
  - NYA kolumner: `insurance_company`, `insurance_number`
  - Används för: hundar från ansökningar

### Nya tabeller

- **`interest_applications`** ⭐ HUVUDTABELL

  - parent_name, parent_email, parent_phone
  - owner_city, owner_address
  - dog_name, dog_breed, dog_birth, dog_gender, dog_height_cm
  - subscription_type, preferred_days[], preferred_start_date
  - special_care_needs
  - is_neutered, is_escape_artist, destroys_things, not_house_trained
  - gdpr_consent, status, notes

- **`subscription_types`**

  - org_id, subscription_type, height_min, height_max, price
  - Används för: prissättning baserat på mankhöjd

- **`daycare_service_completions`**
  - dog_id, service_type, scheduled_date, completed_at, completed_by
  - Används för: kloklipp, tassklipp, bad

---

## Routes / URLs

### Publika (ingen auth)

- `/ansokan/hunddagis` - Ansökningsformulär för hundägare

### Admin (kräver auth)

- `/hunddagis` - Huvudsida med hero-kort
- `/hunddagis/intresseanmalningar` - Hantera ansökningar ⭐
- `/hunddagis/priser` - Prissättning
- `/hunddagis/kalender` - TODO: Kalendervy
- `/hunddagis/rooms` - Hundrum (befintlig)

---

## API / Supabase-operationer

### `/ansokan/hunddagis/page.tsx`

```typescript
// INSERT ny ansökan
supabase.from("interest_applications").insert({...})
```

### `/hunddagis/intresseanmalningar/page.tsx`

```typescript
// LÄSA ansökningar
supabase.from("interest_applications")
  .select("*")
  .eq("org_id", currentOrgId)
  .order("created_at", { ascending: false })

// UPPDATERA status
supabase.from("interest_applications")
  .update({ status, notes, updated_at })
  .eq("id", applicationId)

// ÖVERFÖRA till hunddagis
// 1. Sök/skapa ägare
supabase.from("owners")
  .select("id")
  .eq("org_id", currentOrgId)
  .ilike("email", application.parent_email)

supabase.from("owners").insert({...})

// 2. Skapa hund
supabase.from("dogs").insert({
  owner_id,
  name: application.dog_name,
  breed: application.dog_breed,
  // ... 20+ fält mappade
})
```

---

## Fältmappningar (application → dog)

| interest_applications | dogs             | Transformation        |
| --------------------- | ---------------- | --------------------- |
| dog_name              | name             | Direkt                |
| dog_breed             | breed            | Direkt                |
| dog_birth             | birth            | Direkt                |
| dog_gender            | gender           | Direkt ('hane'/'tik') |
| dog_height_cm         | heightcm         | Direkt                |
| subscription_type     | subscription     | Direkt                |
| preferred_days[]      | days             | Array → "ma,ti,on..." |
| preferred_start_date  | startdate        | Direkt                |
| special_care_needs    | special_needs    | Direkt                |
| is_neutered           | is_castrated     | Boolean direkt        |
| is_escape_artist      | is_escape_artist | Boolean direkt        |
| destroys_things       | destroys_things  | Boolean direkt        |
| not_house_trained     | is_house_trained | **INVERTERAD!**       |

⚠️ **OBS:** `not_house_trained` → `is_house_trained` är inverterad!

- Formulär: "Är INTE rumstränerad?" (not_house_trained)
- Databas: "Är rumstränerad" (is_house_trained)

---

## Dependencies & Paket

### Frontend

- `@supabase/auth-helpers-nextjs` - Supabase client
- `lucide-react` - Ikoner
- `@/components/ui/*` - Radix UI komponenter (shadcn/ui)
- `next/link` - Navigation

### TypeScript Types

```typescript
interface InterestApplication {
  id: string;
  org_id?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  // ... 25+ fält
  status: "pending" | "contacted" | "accepted" | "declined";
}
```

---

## Environment Variables (krävs)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-side)
```

---

## Git Commits (kronologisk ordning)

1. **de94484** - "Hunddagis Fas 1: Databas-schema"

   - owners.personnummer
   - dogs.insurance_company/insurance_number
   - subscription_types, daycare_service_completions
   - EditDogModal uppdaterad

2. **e4933c4** - "Hunddagis Fas 1b: Hero + Prissättning"

   - Klickbara hero-kort
   - Live-statistik
   - app/hunddagis/priser/page.tsx

3. **ace6971** - "Hunddagis Fas 1c: Tjänster-vy"

   - Förbättrad services-vy
   - Checkboxes sparar till daycare_service_completions

4. **7b97434** - "Hunddagis Fas 2: Publikt formulär"

   - app/ansokan/hunddagis/page.tsx
   - 3-stegs formulär
   - Validering och success-meddelande

5. **9a47fc3** - "Hunddagis Fas 3: Överföringsfunktion"
   - Komplett transferToHunddagis-funktion
   - UI med preview och validering
   - create-interest-applications.sql med testdata

---

## Nästa TODO (prioriterat)

1. ⏰ **Kalendervy** - `app/hunddagis/kalender/page.tsx`
2. 💰 **Automatisk fakturering** - Logik för abonnemang + tillägg
3. 📧 **Email-bekräftelser** - Implementera sendConfirmationEmail()
4. 🔍 **org_id från subdomain** - Fixa i publikt formulär
5. 📊 **Rapporter** - Export-funktioner
6. 🔔 **Notifikationer** - Påminnelser för vaccination etc.

---

**Alla filer är committade och redo för testning! 🚀**
