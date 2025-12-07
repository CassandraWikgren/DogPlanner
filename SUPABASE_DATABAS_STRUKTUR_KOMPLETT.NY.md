# 🗄️ Supabase Databasstruktur - DogPlanner (KOMPLETT)

**Uppdaterad:** 7 December 2025  
**Version:** Next.js 15.5.7 + React 19.2.0 + Supabase (@supabase/ssr 0.8.0)  
**Schema verifierat:** ✅ Alla funktioner och triggers verifierade i produktion  
**RLS Status:** 🔒 Aktiverat på alla kritiska tabeller - Multi-tenant säkert  
**Förbättringar:** ✅ Pattern 3 arkitektur, Komplett kundportal (profil, hundar, bokning), Dualt kundnummer-system (2025-12-07)

---

## 📌 Kritiska punkter som ALDRIG får missas

- **Autentisering:** Supabase Auth (INTE Firebase) med `@supabase/ssr`
- **Multi-tenancy:** De flesta tabeller har `org_id` - **MEN** `owners` och `dogs` kan ha `org_id = NULL` (se Pattern 3 nedan)
- **RLS (Row Level Security):** Aktiverat på ALLA tabeller - användare ser ENDAST sin orgs data
- **Primary Keys:** ALLA tabeller använder UUID (INTE integer)
- **Automatik:** Triggers hanterar kundnummer, fakturasummor, org-tilldelning AUTOMATISKT
- **Verifierad produktion:** Alla triggers och functions körda och verifierade i live-databas ✅
- **Pattern 3 arkitektur:** Globala kunder för pensionat, per-org kunder för dagis (se nedan) ✅
- **Dualt kundnummer:** 101+ per-org (dagis), 10001+ global (pensionat) ✅
- **Kundportal:** owners.id = auth.users.id vid kundregistrering ✅
- **⚠️ dogs.org_id:** Utelämna helt vid insert för pensionatkunder (skicka INTE user.id som org_id!) ✅

---

## 🆕 PATTERN 3 ARKITEKTUR (7 December 2025)

### Översikt

DogPlanner använder **Pattern 3** - en hybrid multi-tenant modell inspirerad av Airbnb/Booking.com:

| Kundtyp           | org_id       | Kundnummer      | Registrering                       |
| ----------------- | ------------ | --------------- | ---------------------------------- |
| **Pensionatkund** | `NULL`       | 10001+ (global) | Kundportal, väljer "Pensionat"     |
| **Dagiskund**     | Organisation | 101+ (per-org)  | Skapas av personal vid godkännande |

### Hur det fungerar

**Pensionatkunder (globala):**

1. Registrerar sig via `/kundportal/registrera` (väljer "Pensionat")
2. `owners.org_id = NULL`, `dogs.org_id = NULL`
3. Får globalt kundnummer (10001, 10002, ...)
4. Kan boka hos VILKEN ORGANISATION SOM HELST
5. Loggar in via `/kundportal/login`

**Dagiskunder (per-org):**

1. Skickar intresseanmälan via `/kundportal/registrera` (väljer "Hunddagis")
2. Omdirigeras till att söka dagis
3. Personal godkänner ansökan
4. `owners.org_id` och `dogs.org_id` sätts till organisationen
5. Får per-org kundnummer (101, 102, ... inom den organisationen)

---

## 🆕 KUNDPORTAL - KOMPLETT IMPLEMENTERING (7 December 2025)

### Översikt

Kundportalen (`/kundportal/*`) är helt separat från personalvyn och har egen layout utan "Personal"-navbar.

| Sida               | URL                          | Beskrivning                             |
| ------------------ | ---------------------------- | --------------------------------------- |
| **Dashboard**      | `/kundportal/dashboard`      | Statistik, hundar, kommande bokningar   |
| **Min profil**     | `/kundportal/min-profil`     | Kontaktinfo, kontaktperson 2, samtycken |
| **Mina hundar**    | `/kundportal/mina-hundar`    | CRUD hundar med alla fält               |
| **Mina bokningar** | `/kundportal/mina-bokningar` | Lista på alla bokningar                 |
| **Ny bokning**     | `/kundportal/ny-bokning`     | 4-stegs bokningsflöde                   |
| **Login**          | `/kundportal/login`          | Kundinloggning                          |
| **Registrera**     | `/kundportal/registrera`     | Kundregistrering (pensionat/dagis)      |

### Mina hundar - Fält

Komplett hundprofil med alla fält:

```typescript
interface DogFormData {
  name: string; // Obligatoriskt
  breed: string; // Dropdown med 438 raser
  birth: string; // Födelsedatum
  heightcm: number | null; // Mankhöjd (cm) - kritiskt för prissättning!
  gender: string; // 'hane' | 'tik'
  vaccdhp: string; // DHP-vaccination datum
  vaccpi: string; // Pi-vaccination datum
  insurance_company: string; // Försäkringsbolag
  insurance_number: string; // Försäkringsnummer
  is_castrated: boolean; // Kastrerad
  destroys_things: boolean; // Förstör saker
  is_house_trained: boolean; // Rumsren (default: true)
  is_escape_artist: boolean; // Rymningsbenägen
  can_be_with_other_dogs: boolean; // Kan vara med andra hundar (default: true)
  allergies: string; // Allergier
  medications: string; // Mediciner
  food_info: string; // Foder/mat
  behavior_notes: string; // Beteendeanteckningar
  medical_notes: string; // Övriga anteckningar
  notes: string; // Allmänna noteringar
  photo_url: string; // Bild-URL (Supabase Storage)
}
```

### Bilduppladdning

API-route: `/api/upload-dog-photo`

```typescript
// POST request med FormData
const formData = new FormData();
formData.append("file", file);
formData.append("dogId", dogId || "new");

const response = await fetch("/api/upload-dog-photo", {
  method: "POST",
  body: formData,
});

// Response: { url: "https://...supabase.co/storage/v1/object/public/dog-photos/..." }
```

**Supabase Storage bucket:** `dog-photos` (måste skapas manuellt i Supabase Console)

### Ny bokning - 4 steg

| Steg | Beskrivning                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | **Välj pensionat** - Lista på alla orgs med `enabled_services` som innehåller "boarding" |
| 2    | **Välj hund** - Kundens registrerade hundar                                              |
| 3    | **Datum & tillval** - In/utcheckning + tillvalstjänster från valt pensionat              |
| 4    | **Bekräfta** - Sammanfattning + prisberäkning                                            |

**Viktigt:** Tillvalstjänster hämtas från **valt pensionat**, inte kundens org_id:

```typescript
// Hämta pensionat (steg 1)
const { data: pensionat } = await supabase
  .from("orgs")
  .select("id, name, address, phone, email")
  .contains("enabled_services", ["boarding"])
  .order("name");

// Hämta tillvalstjänster från valt pensionat (steg 3)
const { data: services } = await supabase
  .from("extra_services")
  .select("*")
  .eq("org_id", selectedPensionatId)  // 👈 Pensionatets org_id!
  .in("service_type", ["boarding", "both"])
  .order("label");

// Skapa bokning med rätt org_id
await supabase.from("bookings").insert({
  org_id: selectedPensionatId,  // 👈 Pensionatets org_id, inte kundens!
  dog_id: selectedDogId,
  owner_id: user.id,
  ...
});
```

---

## 🆕 NYA FÖRBÄTTRINGAR (3 December 2025)

### ✅ 1. Spårbarhet för Intresseanmälningar

**Problem:** När en intresseanmälan konverterades till kund/hund fanns ingen koppling tillbaka.

**Lösning:** Nya kolumner i `interest_applications`:

- `created_dog_id` - FK till dogs.id (vilken hund som skapades)
- `created_owner_id` - FK till owners.id (vilken ägare som skapades)

**Användning:**

```typescript
// När du skapar hund från intresseanmälan
const { data: newDog } = await supabase.from('dogs').insert({...}).select().single();
const { data: newOwner } = await supabase.from('owners').insert({...}).select().single();

// Länka tillbaka till intresseanmälan
await supabase.from('interest_applications')
  .update({
    created_dog_id: newDog.id,
    created_owner_id: newOwner.id,
    status: 'approved'
  })
  .eq('id', applicationId);
```

**Nytta:** Konverteringsanalys - se vilka ansökningar som blev kunder!

### ✅ 2. Städad Hundjournal (Redundant kolumn borttagen)

**Problem:** Tabellen `dog_journal` hade både `text` och `content` kolumner. Koden använder bara `content`.

**Lösning:** Kolumnen `text` är borttagen. All data migrerades först till `content`.

**Viktigt:** Använd ALLTID `content` (NOT NULL):

```typescript
// ✅ RÄTT
await supabase.from("dog_journal").insert({
  dog_id: dogId,
  org_id: currentOrgId,
  content: "Bella hade lite ont i tassen idag", // 👈 content
  user_id: currentUserId,
});

// ❌ FEL (kolumnen finns inte längre)
await supabase.from("dog_journal").insert({
  text: "...", // ❌ Finns inte!
});
```

### ✅ 3. GDPR-compliant Journal Retention (2 år)

**Problem:** Journaler raderades via CASCADE men ingen explicit 2-års policy.

**Lösning:** Ny function `enforce_journal_retention()` + cron job som körs automatiskt.

**Schema:**

- **Cron:** Körs kl 02:00 UTC den 1:a varje månad
- **Raderar:** dog_journal och grooming_journal äldre än 2 år
- **Automatiskt:** Ingen manuell handling krävs

**Verifiera:**

```sql
-- Kolla att cron-jobbet finns
SELECT * FROM cron.job WHERE jobname = 'monthly-journal-retention';

-- Manuellt köra (om du vill testa)
SELECT enforce_journal_retention();
```

### ✅ 4. Analytics Dashboard (5 Views)

**Nya views för rapportering och statistik:**

#### 4.1 Beläggningsgrad Hunddagis

```sql
SELECT * FROM analytics_daycare_occupancy;
-- Kolumner: org_name, month, unique_dogs, total_visits, avg_hours_per_visit
```

#### 4.2 Beläggningsgrad Hundpensionat

```sql
SELECT * FROM analytics_boarding_occupancy;
-- Kolumner: org_name, month, unique_dogs, total_bookings, total_nights, avg_booking_value
```

#### 4.3 Intäkter per Tjänst

```sql
SELECT * FROM analytics_revenue_by_service;
-- Kolumner: org_name, month, invoice_type, invoice_count, total_revenue, avg_invoice_amount
```

#### 4.4 Populäraste Hundraser

```sql
SELECT * FROM analytics_popular_breeds;
-- Kolumner: org_name, breed, dog_count, avg_height_cm
```

#### 4.5 Konverteringsgrad

```sql
SELECT * FROM analytics_conversion_rate;
-- Kolumner: org_name, service_type, total_applications, converted_dogs, converted_owners, conversion_rate_percent
```

**Användning i Next.js:**

```typescript
// Hämta beläggningsgrad för aktuell org
const { data: occupancy } = await supabase
  .from("analytics_daycare_occupancy")
  .select("*")
  .eq("org_id", currentOrgId)
  .order("month", { ascending: false })
  .limit(12); // Senaste 12 månaderna
```

**RLS:** Alla views respekterar org_id-isolering automatiskt! ✅

### ✅ 5. Automatisk Backup-verifiering

**Två nya functions för integritetskontroll:**

#### 5.1 Databasintegritet

```sql
SELECT * FROM verify_database_integrity();
-- Kontrollerar:
-- ✅ Alla profiler har org_id
-- ✅ Alla owners har customer_number
-- ✅ Alla invoices har invoice_number
-- ✅ Alla dogs har owner_id
-- ✅ Alla bookings har dog_id och owner_id
-- ✅ Invoice items har amount
-- ✅ Triggers finns (minst 30)
-- ✅ RLS är aktiverat (minst 50 tabeller)
```

**Output-exempel:**

```
check_name              | status  | details
-----------------------|---------|---------------------------
profiles_org_id        | OK      | 0 profiler saknar org_id
owners_customer_number | OK      | 0 ägare saknar customer_number
invoices_invoice_number| OK      | 0 fakturor saknar invoice_number
critical_triggers      | OK      | Antal triggers: 38
rls_enabled            | OK      | Antal tabeller med RLS: 67
```

#### 5.2 Tabellräknare

```sql
SELECT * FROM get_table_counts() ORDER BY row_count DESC;
-- Visar antal rader per tabell
```

**Användning i backup-script:**

```bash
#!/bin/bash
# backup-verify.sh

# Kör backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Verifiera integritet
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT * FROM verify_database_integrity();"

# Om alla checks = OK: Backup är valid ✅
```

---

## 🔐 AUTENTISERING OCH PROFILER

### **auth.users** (Supabase-hanterad i auth-schema)

Supabase sköter autentiseringen automatiskt. Denna tabell finns i `auth` schema (INTE `public`).

**Du ska ALDRIG:**

- Skriva direkt till auth.users
- Uppdatera auth.users manuellt
- Radera från auth.users direkt

**Supabase hanterar:**

- Registrering
- Inloggning
- Password reset
- Email-verifiering

### **Två typer av användare i DogPlanner**

| Typ                    | Tabell     | auth.users koppling           | Inloggning          |
| ---------------------- | ---------- | ----------------------------- | ------------------- |
| **Företagsanvändare**  | `profiles` | `profiles.id = auth.users.id` | `/login`            |
| **Kunder (hundägare)** | `owners`   | `owners.id = auth.users.id`   | `/kundportal/login` |

**⚠️ VIKTIGT:** `profiles` och `owners` är SEPARATA tabeller!

- En person kan vara BÅDE företagsanvändare OCH kund (med olika e-postadresser)
- `profiles.role` = 'admin' eller 'staff' (EJ 'owner'!)
- Kunder finns ALDRIG i `profiles`, de finns i `owners`

### **Kundportal-login (7 Dec 2025)**

Kundinloggningen på `/kundportal/login` fungerar så här:

```typescript
// 1. Autentisera mot Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});

// 2. Verifiera att användaren har en owners-rad
const { data: ownerData, error: ownerError } = await supabase
  .from("owners")
  .select("id, full_name, email")
  .eq("id", data.user.id) // 👈 KRITISKT: Frågar med id, INTE email!
  .maybeSingle();

// 3. Om ingen owner-rad finns → logga ut och visa fel
if (!ownerData) {
  await supabase.auth.signOut();
  throw new Error("Inget kundkonto hittades");
}

// 4. Redirect till kundportal dashboard
router.push("/kundportal/dashboard");
```

**⚠️ KRITISKT: RLS-compatibility**

Frågan `.eq("id", data.user.id)` fungerar eftersom:

- RLS-policyn `owners_select_self_and_org` tillåter `id = auth.uid()`
- Om vi frågade med `.eq("email", email)` skulle RLS blockera!

### **profiles** - Användarprofiler (public schema)

Kopplas AUTOMATISKT via trigger när ny användare skapas.

```sql
CREATE TABLE profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    full_name         TEXT,
    email             TEXT,
    phone             TEXT,
    role              TEXT DEFAULT 'staff',
    last_sign_in_at   TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner förklarat:**

| Kolumn            | Typ       | Beskrivning                            | Viktigt                                      |
| ----------------- | --------- | -------------------------------------- | -------------------------------------------- |
| `id`              | UUID      | Samma som auth.users.id                | PRIMARY KEY, auto-sätts                      |
| `org_id`          | UUID      | Vilken organisation användaren tillhör | **KAN ALDRIG VARA NULL**                     |
| `full_name`       | TEXT      | Användarens fullständiga namn          | Används i UI                                 |
| `email`           | TEXT      | Email (kopieras från auth.users)       | Kan skilja sig från auth                     |
| `phone`           | TEXT      | Telefonnummer                          | Frivilligt                                   |
| `role`            | TEXT      | 'admin' eller 'staff'                  | **EJ 'owner'** - hundägare finns i `owners`! |
| `last_sign_in_at` | TIMESTAMP | Senaste inloggning                     | Auto-uppdateras                              |
| `created_at`      | TIMESTAMP | När profilen skapades                  | Auto-sätts                                   |

**⚠️ KRITISKT om role:**

- `'admin'` = Full åtkomst till ALLT i organisationen (ekonomi, personal, inställningar)
- `'staff'` = Kan hantera hundar, bokningar, journaler (EJ ekonomi eller inställningar)
- Det finns **INGEN** roll `'owner'` i profiles - hundägare är i `owners` tabellen!

**Viktiga triggers och functions:**

1. **`on_auth_user_created`** → **`handle_new_user()`**
   - Körs AUTOMATISKT när ny användare registreras
   - Skapar profil + org från user_metadata
   - Detta är **Layer 1** i 3-lagers org_id-systemet

2. **`heal_user_missing_org()`** (RPC function)
   - Körs från AuthContext om org_id är NULL
   - Reparerar trasiga profiler
   - Detta är **Layer 3** i 3-lagers systemet

**Kopplingar:**

- ← `auth.users.id` (ONE-TO-ONE: en auth user = en profil)
- → `orgs.id` (MANY-TO-ONE: många profiler → en organisation)
- → `dog_journal.user_id` (ONE-TO-MANY: en användare → många journalanteckningar)
- → `grooming_journal.created_by` (ONE-TO-MANY)

**Exempel query:**

```typescript
// Hämta aktuell användares profil med organisation
const { data: profile } = await supabase
  .from("profiles")
  .select("*, orgs(*)")
  .eq("id", user.id)
  .single();
```

---

## 🏢 ORGANISATIONER

### **orgs** - Hunddagis/pensionat/frisörer

Huvudtabellen för multi-tenancy. **VARJE företag får sitt eget org_id**. Detta är centralt för HELA systemet!

```sql
CREATE TABLE orgs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT NOT NULL,
    org_number                  TEXT,
    email                       TEXT,
    phone                       TEXT,
    address                     TEXT,
    postal_code                 TEXT,
    city                        TEXT,
    vat_included                BOOLEAN DEFAULT true,
    vat_rate                    NUMERIC(5,2) DEFAULT 25.00,
    pricing_currency            TEXT DEFAULT 'SEK',
    contact_email               TEXT,
    invoice_email               TEXT,
    reply_to_email              TEXT,
    email_sender_name           TEXT,
    bank_account                TEXT,
    slug                        TEXT UNIQUE,
    status                      TEXT DEFAULT 'trialing',
    trial_ends_at               TIMESTAMP WITH TIME ZONE,
    subscription_plan           TEXT DEFAULT 'basic',
    subscription_status         TEXT DEFAULT 'trial',
    lan                         TEXT,
    kommun                      TEXT,
    service_types               TEXT[],
    is_visible_to_customers     BOOLEAN DEFAULT true,
    cancellation_policy         JSONB,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner förklarat:**

| Kolumn                    | Typ       | Default    | Beskrivning                                  |
| ------------------------- | --------- | ---------- | -------------------------------------------- |
| `id`                      | UUID      | auto       | PRIMARY KEY - används som org_id överallt    |
| `name`                    | TEXT      | -          | **REQUIRED** - "Stockholms Hunddagis"        |
| `org_number`              | TEXT      | null       | Organisationsnummer (ex: "5512345678")       |
| `email`                   | TEXT      | null       | Organisations huvudmail                      |
| `phone`                   | TEXT      | null       | Organisations huvudtelefon                   |
| `address`                 | TEXT      | null       | Gatuadress                                   |
| `postal_code`             | TEXT      | null       | Postnummer                                   |
| `city`                    | TEXT      | null       | Stad                                         |
| `vat_included`            | BOOLEAN   | true       | Om priser inkluderar moms                    |
| `vat_rate`                | NUMERIC   | 25.00      | Momssats i procent                           |
| `pricing_currency`        | TEXT      | 'SEK'      | Valuta                                       |
| `contact_email`           | TEXT      | null       | Kontakt-email för kunder                     |
| `invoice_email`           | TEXT      | null       | Email för fakturor                           |
| `reply_to_email`          | TEXT      | null       | Reply-to för utskickade mail                 |
| `email_sender_name`       | TEXT      | null       | Avsändarnamn i mail                          |
| `bank_account`            | TEXT      | null       | Bankgiro/plusgiro                            |
| `slug`                    | TEXT      | null       | URL-vänligt namn (UNIQUE)                    |
| `status`                  | TEXT      | 'trialing' | 'trialing', 'active', 'locked'               |
| `trial_ends_at`           | TIMESTAMP | null       | När trial-perioden slutar                    |
| `subscription_plan`       | TEXT      | 'basic'    | Vilket abonnemang                            |
| `subscription_status`     | TEXT      | 'trial'    | 'trial', 'active', 'cancelled'               |
| `lan`                     | TEXT      | null       | Län (ex: "Stockholm")                        |
| `kommun`                  | TEXT      | null       | Kommun (ex: "Solna")                         |
| `service_types`           | TEXT[]    | []         | ["hunddagis", "hundpensionat", "hundfrisor"] |
| `is_visible_to_customers` | BOOLEAN   | true       | Om org visas i public selector               |
| `cancellation_policy`     | JSONB     | null       | Avbokningspolicy (se struktur nedan)         |
| `created_at`              | TIMESTAMP | NOW()      | När organisationen skapades                  |

**Exempel på cancellation_policy JSONB:**

```json
{
  "description": "7+ dagar i förväg: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: Full avgift",
  "days_under_3": 1.0,
  "days_3_to_7": 0.5,
  "days_7_plus": 0.0
}
```

**Används av:**

ALLA andra tabeller via `org_id` foreign key:

- profiles
- owners
- dogs
- invoices
- bookings
- rooms
- grooming_bookings
- daycare_pricing
- boarding_prices
- grooming_services
- interest_applications
- extra_service
- dog_journal
- ... och ALLA andra tabeller!

**⚠️ VIKTIGT:**

Om `org_id` är NULL i någon tabell = SYSTEMFEL! Alla triggers säkerställer att org_id sätts.

**Exempel query:**

```typescript
// Hämta aktuell organisation med alla hundar
const { data: org } = await supabase
  .from("orgs")
  .select("*, dogs(*, owners(*))")
  .eq("id", currentOrgId)
  .single();
```

---

## 👥 HUNDÄGARE (KUNDER)

### **owners** - Kunder/hundägare

En ägare kan ha FLERA hundar. Kundnummer är unikt per typ (per-org för dagis, globalt för pensionat).

**⚠️ UPPDATERAT 7 Dec 2025:** Pattern 3 arkitektur - `org_id` kan vara NULL för pensionatkunder!

```sql
CREATE TABLE owners (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES orgs(id) ON DELETE CASCADE,  -- ⚠️ NULLABLE för pensionat!
    customer_number         TEXT,  -- ⚠️ TEXT inte INTEGER! Auto-genereras av trigger
    full_name               TEXT,
    email                   TEXT,
    phone                   TEXT,
    address                 TEXT,
    personnummer            TEXT,
    postal_code             TEXT,
    city                    TEXT,
    contact_person_2        TEXT,
    contact_phone_2         TEXT,
    gdpr_consent            BOOLEAN DEFAULT false,
    marketing_consent       BOOLEAN DEFAULT false,
    photo_consent           BOOLEAN DEFAULT false,
    consent_status          TEXT DEFAULT 'pending',
    consent_verified_at     TIMESTAMP WITH TIME ZONE,
    is_anonymized           BOOLEAN DEFAULT false,
    anonymized_at           TIMESTAMP WITH TIME ZONE,
    anonymization_reason    TEXT,
    data_retention_until    DATE,
    is_active               BOOLEAN DEFAULT true,
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT owners_org_personnummer_key UNIQUE (org_id, personnummer)
);
```

**Kolumner förklarat:**

| Kolumn                 | Typ       | Beskrivning                                               | Viktigt                                         |
| ---------------------- | --------- | --------------------------------------------------------- | ----------------------------------------------- |
| `id`                   | UUID      | PRIMARY KEY                                               | **= auth.users.id vid kundportal-registrering** |
| `org_id`               | UUID      | Vilken organisation kunden tillhör                        | **NULL för pensionatkunder (Pattern 3)**        |
| `customer_number`      | TEXT      | Kundnummer                                                | **Auto-genereras av trigger (se nedan)**        |
| `full_name`            | TEXT      | Kundens namn                                              | "Anna Andersson"                                |
| `email`                | TEXT      | Kundens email                                             | För fakturor och inloggning                     |
| `phone`                | TEXT      | Telefonnummer                                             | "070-123 45 67"                                 |
| `address`              | TEXT      | Gatuadress                                                | "Storgatan 1"                                   |
| `personnummer`         | TEXT      | Personnummer eller samordningsnummer                      | **UNIQUE per org** (GDPR!)                      |
| `postal_code`          | TEXT      | Postnummer                                                | "123 45"                                        |
| `city`                 | TEXT      | Stad                                                      | "Stockholm"                                     |
| `contact_person_2`     | TEXT      | Extra kontaktperson                                       | Vid nödsituationer                              |
| `contact_phone_2`      | TEXT      | Extra telefon                                             | Backup-kontakt                                  |
| `gdpr_consent`         | BOOLEAN   | Samtycke för databehandling                               | Default: false                                  |
| `marketing_consent`    | BOOLEAN   | Samtycke för marknadsföring                               | Default: false                                  |
| `photo_consent`        | BOOLEAN   | Samtycke för foton på sociala medier                      | Default: false                                  |
| `consent_status`       | TEXT      | 'pending', 'verified', 'declined', 'expired', 'withdrawn' | Spårar samtyckesstatus                          |
| `consent_verified_at`  | TIMESTAMP | När samtycke verifierades                                 | Viktigt för GDPR                                |
| `is_anonymized`        | BOOLEAN   | Om ägare anonymiserats enligt GDPR                        | Default: false                                  |
| `anonymized_at`        | TIMESTAMP | När anonymisering skedde                                  | Audit trail                                     |
| `anonymization_reason` | TEXT      | Varför anonymisering skedde                               | Dokumentation                                   |
| `data_retention_until` | DATE      | När data kan raderas                                      | 7 år efter sista faktura                        |
| `is_active`            | BOOLEAN   | Om ägare är aktiv                                         | false = inaktiv kund                            |
| `notes`                | TEXT      | Interna anteckningar                                      | Synligt endast för personal                     |
| `created_at`           | TIMESTAMP | När ägaren skapades                                       | Auto-sätts                                      |

**⚠️ KRITISKT: owners.id och auth.users.id**

Vid kundportal-registrering (`/kundportal/registrera`):

- `owners.id` sätts till `auth.users.id` (samma UUID!)
- Detta krävs för att RLS-policyn `id = auth.uid()` ska fungera
- Kunden kan sedan logga in och se sina egna data

```typescript
// Vid registrering (app/kundportal/registrera/page.tsx):
const ownerData_insert = {
  id: authData.user.id, // 👈 KRITISKT: Samma som auth.users.id!
  full_name: `${ownerData.firstName} ${ownerData.lastName}`.trim(),
  email: ownerData.email,
  // ...
};
```

**⚠️ KRITISKT: Dualt kundnummer-system**

Trigger `auto_generate_customer_number` hanterar två typer:

| org_id   | Nummerserie            | Typ                | Genereras hur                                 |
| -------- | ---------------------- | ------------------ | --------------------------------------------- |
| NOT NULL | 101, 102, 103...       | Per-org (dagis)    | MAX(customer_number WHERE org_id = X) + 1     |
| NULL     | 10001, 10002, 10003... | Global (pensionat) | MAX(customer_number WHERE org_id IS NULL) + 1 |

```sql
-- Trigger-logik (förenklad)
IF NEW.org_id IS NOT NULL THEN
  -- Per-org nummer för dagis (101+)
  SELECT COALESCE(MAX(customer_number::int), 100) + 1
  FROM owners WHERE org_id = NEW.org_id;
ELSE
  -- Globalt nummer för pensionat (10001+)
  SELECT COALESCE(MAX(customer_number::int), 10000) + 1
  FROM owners WHERE org_id IS NULL;
END IF;
```

**RLS Policies för owners:**

```sql
-- INSERT: Tillåt registrering (anon + authenticated)
CREATE POLICY "owners_insert_self_registration" ON owners FOR INSERT
  TO authenticated, anon WITH CHECK (TRUE);

-- SELECT: Ägare ser sig själv, personal ser org-medlemmar
CREATE POLICY "owners_select_self_and_org" ON owners FOR SELECT
  USING (
    id = auth.uid()  -- Kund ser sig själv
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())  -- Personal ser org
  );

-- UPDATE: Samma logik som SELECT
-- DELETE: Endast ägaren själv
```

**Kopplingar:**

- ← `orgs.id` (MANY-TO-ONE: många ägare → en organisation)
- → `dogs.owner_id` (ONE-TO-MANY: en ägare → många hundar)
- → `invoices.owner_id` (ONE-TO-MANY: en ägare → många fakturor)

**Exempel query:**

```typescript
// Hämta ägare med alla hundar och fakturor
const { data: owner } = await supabase
  .from("owners")
  .select(
    `
    *,
    dogs(*),
    invoices(*)
  `
  )
  .eq("id", ownerId)
  .single();
```

---

## 🐕 HUNDAR

### **dogs** - Hundprofiler

**KÄRNTABELLEN** för all hunddata (dagis, pensionat, frisör).

**⚠️ UPPDATERAT 7 Dec 2025:** `org_id` kan vara NULL för pensionathundar (Pattern 3)!

```sql
CREATE TABLE dogs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES orgs(id) ON DELETE CASCADE,  -- ⚠️ NULLABLE för pensionat!
    owner_id                UUID REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
    name                    TEXT NOT NULL,
    breed                   TEXT,
    birth                   DATE,
    birth_date              DATE,
    gender                  TEXT,
    heightcm                INTEGER,
    subscription            TEXT,
    startdate               DATE,
    enddate                 DATE,
    days                    TEXT,
    room_id                 UUID REFERENCES rooms(id) ON DELETE SET NULL,
    vaccdhp                 TEXT,
    vaccpi                  TEXT,
    insurance_company       TEXT,
    insurance_number        TEXT,
    photo_url               TEXT,
    checked_in              BOOLEAN DEFAULT false,
    waitlist                BOOLEAN DEFAULT false,
    is_active               BOOLEAN DEFAULT true,
    is_deleted              BOOLEAN DEFAULT false,
    deleted_at              TIMESTAMP WITH TIME ZONE,
    deleted_reason          TEXT,
    is_castrated            BOOLEAN DEFAULT false,
    is_sterilized           BOOLEAN DEFAULT false,
    is_escape_artist        BOOLEAN DEFAULT false,
    destroys_things         BOOLEAN DEFAULT false,
    is_house_trained        BOOLEAN DEFAULT true,
    can_be_with_other_dogs  BOOLEAN DEFAULT true,
    in_heat                 BOOLEAN DEFAULT false,
    heat_start_date         DATE,
    allergies               TEXT,
    medications             TEXT,
    food_info               TEXT,
    behavior_notes          TEXT,
    medical_notes           TEXT,
    special_needs           TEXT,
    personality_traits      TEXT[],
    events                  JSONB,
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner förklarat (viktigaste först):**

| Kolumn                   | Typ       | Beskrivning                   | Viktigt för                                  |
| ------------------------ | --------- | ----------------------------- | -------------------------------------------- |
| `id`                     | UUID      | PRIMARY KEY                   | -                                            |
| `org_id`                 | UUID      | Organisation                  | **NULL för pensionathundar (Pattern 3)**     |
| `owner_id`               | UUID      | Ägare                         | **REQUIRED, koppling till owners**           |
| `name`                   | TEXT      | Hundens namn                  | **REQUIRED** - "Bella"                       |
| `breed`                  | TEXT      | Ras                           | "Golden Retriever"                           |
| `birth`                  | DATE      | Födelsedatum                  | Används för åldersberäkning                  |
| `birth_date`             | DATE      | Alias för birth               | Vissa formulär använder denna                |
| `gender`                 | TEXT      | Kön                           | 'hane' eller 'tik'                           |
| `heightcm`               | INTEGER   | Mankhöjd i cm                 | **KRITISKT för priser & rumsberäkning!**     |
| `subscription`           | TEXT      | Abonnemangstyp                | 'heltid', 'deltid_2', 'deltid_3', 'dagshund' |
| `startdate`              | DATE      | När abonnemanget börjar       | -                                            |
| `enddate`                | DATE      | När det slutar                | NULL = tills vidare                          |
| `days`                   | TEXT      | Vilka dagar                   | 'Måndag,Onsdag,Fredag' (kommaseparerat)      |
| `room_id`                | UUID      | Vilket rum                    | FK till rooms.id                             |
| `vaccdhp`                | TEXT      | Vaccination DHP               | Datum som sträng                             |
| `vaccpi`                 | TEXT      | Vaccination Pi                | Datum som sträng                             |
| `insurance_company`      | TEXT      | Försäkringsbolag              | "Agria"                                      |
| `insurance_number`       | TEXT      | Försäkringsnummer             | "123456789"                                  |
| `photo_url`              | TEXT      | URL till hundbild             | Supabase Storage URL                         |
| `checked_in`             | BOOLEAN   | Om hunden är på dagis NU      | Default: false                               |
| `waitlist`               | BOOLEAN   | Om hunden är på väntelista    | Default: false                               |
| `is_active`              | BOOLEAN   | Om hunden är aktiv            | Default: true                                |
| `is_deleted`             | BOOLEAN   | Mjuk radering                 | Default: false                               |
| `deleted_at`             | TIMESTAMP | När hunden raderades          | -                                            |
| `deleted_reason`         | TEXT      | Varför radering               | Dokumentation                                |
| `is_castrated`           | BOOLEAN   | Om kastrerad/steriliserad     | Default: false                               |
| `is_sterilized`          | BOOLEAN   | Alias för is_castrated        | Default: false                               |
| `is_escape_artist`       | BOOLEAN   | Om hunden rymmer              | Default: false                               |
| `destroys_things`        | BOOLEAN   | Om hunden förstör saker       | Default: false                               |
| `is_house_trained`       | BOOLEAN   | Om rumsren                    | Default: true                                |
| `can_be_with_other_dogs` | BOOLEAN   | Om hunden klarar andra hundar | Default: true                                |
| `in_heat`                | BOOLEAN   | Om tiken är i löp             | Default: false                               |
| `heat_start_date`        | DATE      | När löpet började             | Viktigt för planering                        |
| `allergies`              | TEXT      | Allergier                     | "Kyckling, nötkött"                          |
| `medications`            | TEXT      | Mediciner                     | "Apoquel 5.4mg dagligen"                     |
| `food_info`              | TEXT      | Matinformation                | "Royal Canin 2dl kl 16:00"                   |
| `behavior_notes`         | TEXT      | Beteendeanteckningar          | "Skraj för barn"                             |
| `medical_notes`          | TEXT      | Medicinska anteckningar       | -                                            |
| `special_needs`          | TEXT      | Specialbehov                  | "Extra motion 2x/dag"                        |
| `personality_traits`     | TEXT[]    | Personlighetsdrag             | ["lekfull", "energisk"]                      |
| `events`                 | JSONB     | Flexibel data                 | Se struktur nedan                            |
| `notes`                  | TEXT      | Allmänna anteckningar         | -                                            |
| `created_at`             | TIMESTAMP | Skapad                        | Auto                                         |
| `last_updated`           | TIMESTAMP | Senast uppdaterad             | Auto via trigger                             |

**⚠️ KRITISKT: heightcm (mankhöjd)**

Detta fält är **AVGÖRANDE** för:

1. **Prisberäkning** - Pensionat har olika priser beroende på storlek
2. **Rumsberäkning** - Jordbruksverket kräver olika yta per storlek
3. **Automatisk kategorisering** - small/medium/large

**Jordbruksverkets regler (från lib/roomCalculator.ts):**

- < 25 cm: 2 m²
- 25-35 cm: 2 m²
- 36-45 cm: 2,5 m²
- 46-55 cm: 3,5 m²
- 56-65 cm: 4,5 m²
- \> 65 cm: 5,5 m²

**events JSONB-struktur (flexibelt fält för äldre data):**

```json
{
  "owner_address": "Storgatan 1, 123 45 Stockholm",
  "gender": "hane",
  "care_notes": "Allergisk mot kyckling",
  "owner_comment": "Ring alltid innan hämtning",
  "food": "Royal Canin Medium Adult 2dl/dag, kl 16:00",
  "allergies": "Kyckling, nötkött",
  "medications": "Apoquel 5.4mg 1 tablett dagligen",
  "special_needs": "Behöver extra motion, minst 2 promenader/dag",
  "behavior_notes": "Lite skraj för barn under 5 år",
  "flags": {
    "kastrerad": true,
    "biter_saker": false,
    "kissar_inne": false,
    "hund_skallig": false,
    "personalhund": false,
    "pensionatshund": true,
    "is_escape_artist": false,
    "can_be_with_other_dogs": true
  }
}
```

**Viktiga triggers:**

1. **`set_dog_org_from_owner()`**
   - Sätter org_id AUTOMATISKT från owner
   - Körs FÖRE INSERT

2. **`update_last_updated()`**
   - Uppdaterar last_updated vid ALLA ändringar
   - Spårning av när hund senast modifierades

**Kopplingar:**

- ← `orgs.id` (MANY-TO-ONE: många hundar → en organisation)
- ← `owners.id` (MANY-TO-ONE: många hundar → en ägare)
- ← `rooms.id` (MANY-TO-ONE: många hundar → ett rum)
- → `dog_journal` (ONE-TO-MANY: en hund → många journalanteckningar)
- → `extra_service` (ONE-TO-MANY: en hund → många tilläggstjänster)
- → `bookings` (ONE-TO-MANY: en hund → många pensionatsbokningar)
- → `grooming_bookings` (ONE-TO-MANY: en hund → många frisörbokningar)

**Exempel queries:**

```typescript
// Hämta hund med ägare och rum
const { data: dog } = await supabase
  .from("dogs")
  .select(
    `
    *,
    owners(id, full_name, customer_number, phone, email),
    rooms(id, name, room_type)
  `
  )
  .eq("id", dogId)
  .single();

// Hämta alla aktiva dagishundar med ägare
const { data: dogs } = await supabase
  .from("dogs")
  .select("*, owners(*)")
  .eq("org_id", currentOrgId)
  .eq("is_active", true)
  .eq("waitlist", false)
  .order("name");
```

---

## 📝 JOURNALER OCH ANTECKNINGAR

### **dog_journal** - Hundjournal

**Append-only** journal för varje hund. Alla anteckningar sparas i 2 år (rensas automatiskt via GDPR-process).

**⚠️ UPPDATERAD 3 Dec 2025:** Redundant kolumn `text` borttagen - använd ENDAST `content`!

```sql
CREATE TABLE dog_journal (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id            UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    content           TEXT NOT NULL,  -- 👈 ANVÄND DENNA (text-kolumnen är borttagen!)
    user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn       | Typ       | Beskrivning             | Viktigt                     |
| ------------ | --------- | ----------------------- | --------------------------- |
| `id`         | UUID      | PRIMARY KEY             |                             |
| `dog_id`     | UUID      | Vilken hund             | **REQUIRED**                |
| `org_id`     | UUID      | Organisation            | **REQUIRED**                |
| `content`    | TEXT      | Journaltext             | **REQUIRED, använd denna!** |
| `user_id`    | UUID      | Vem skrev               | FK till profiles.id         |
| `created_at` | TIMESTAMP | När anteckningen skrevs | Auto                        |

**⚠️ GDPR-Compliance:**

- Journaler **raderas automatiskt** efter 2 år via `enforce_journal_retention()`
- Cron job körs kl 02:00 UTC den 1:a varje månad
- Kan också köras manuellt: `SELECT enforce_journal_retention();`

**Användning:**

- Visas i EditDogModal under journalsektionen
- Sorteras nyast först (DESC på created_at)
- **Kan INTE redigeras** efter de skapats (append-only design)
- Realtime-aktiverad för live-uppdateringar

**Exempel query:**

```typescript
// Hämta alla journalanteckningar för en hund
const { data: journal } = await supabase
  .from("dog_journal")
  .select("*, profiles(full_name)")
  .eq("dog_id", dogId)
  .order("created_at", { ascending: false });

// Skapa ny journalanteckning
await supabase.from("dog_journal").insert({
  dog_id: dogId,
  org_id: currentOrgId,
  content:
    "Bella hade lite ont i tassen idag, haltade lite på vänster framtass.", // 👈 content
  user_id: currentUserId,
});
```

---

### **grooming_journal** - Frisörjournal

Specifik journal för frisörtjänster med extra metadata.

```sql
CREATE TABLE grooming_journal (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    dog_id                          UUID REFERENCES dogs(id) ON DELETE CASCADE,
    booking_id                      UUID REFERENCES grooming_bookings(id) ON DELETE SET NULL,
    appointment_date                DATE NOT NULL,
    service_type                    TEXT NOT NULL,
    clip_length                     TEXT,
    shampoo_type                    TEXT,
    special_treatments              TEXT,
    final_price                     NUMERIC(10,2) DEFAULT 0,
    duration_minutes                INTEGER,
    notes                           TEXT,
    before_photos                   TEXT[],
    after_photos                    TEXT[],
    next_appointment_recommended    TEXT,
    external_customer_name          TEXT,
    external_dog_name               TEXT,
    external_dog_breed              TEXT,
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn                         | Beskrivning                                           |
| ------------------------------ | ----------------------------------------------------- |
| `appointment_date`             | **REQUIRED** - Vilket datum tjänsten utfördes         |
| `service_type`                 | **REQUIRED** - 'trimning', 'bad', 'kloklippning' etc. |
| `clip_length`                  | "kort", "medium", "lång"                              |
| `shampoo_type`                 | "allergivänligt", "vanligt", "specialschampo"         |
| `special_treatments`           | Extra behandlingar som utfördes                       |
| `final_price`                  | Slutpris (kan skilja sig från listpris)               |
| `duration_minutes`             | Hur lång tid det tog                                  |
| `notes`                        | Anteckningar från frisören                            |
| `before_photos`                | Array av foto-URLs innan klippning                    |
| `after_photos`                 | Array av foto-URLs efter klippning                    |
| `next_appointment_recommended` | "Om 6-8 veckor", "Vid behov"                          |
| `external_customer_name`       | För walk-in kunder (ej i systemet)                    |
| `external_dog_name`            | För hundar som inte är registrerade                   |
| `external_dog_breed`           | Ras för externa hundar                                |

**Kopplingar:**

- ← `dogs.id` (många journalanteckningar → en hund)
- ← `grooming_bookings.id` (en journalanteckning → en bokning)

---

## 🏠 RUM OCH FACILITETER

### **rooms** - Rum för dagis och pensionat

Rummen följer **Jordbruksverkets regler** för ytor.

```sql
CREATE TABLE rooms (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    name              TEXT,
    capacity          INTEGER,
    capacity_m2       NUMERIC DEFAULT 15 NOT NULL,
    room_type         TEXT DEFAULT 'both',
    notes             TEXT,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT rooms_room_type_check CHECK (room_type IN ('daycare', 'boarding', 'both'))
);
```

**Kolumner:**

| Kolumn        | Typ     | Beskrivning                 | Viktigt                                |
| ------------- | ------- | --------------------------- | -------------------------------------- |
| `id`          | UUID    | PRIMARY KEY                 | -                                      |
| `org_id`      | UUID    | Organisation                | **REQUIRED**                           |
| `name`        | TEXT    | Rummets namn                | "Stora rummet", "Valprum", "Rum 1"     |
| `capacity`    | INTEGER | Max antal hundar            | Beräknas utifrån capacity_m2 + storlek |
| `capacity_m2` | NUMERIC | Rummets area i kvadratmeter | **KRITISKT för Jordbruksverket**       |
| `room_type`   | TEXT    | Typ av rum                  | 'daycare', 'boarding', 'both'          |
| `notes`       | TEXT    | Anteckningar                | Intern info                            |
| `is_active`   | BOOLEAN | Om rummet är aktivt         | Default: true                          |
| `created_at`  | TS      | Skapat                      | Auto                                   |
| `updated_at`  | TS      | Senast uppdaterat           | Auto via trigger                       |

**⚠️ KRITISKT: Jordbruksverkets regler**

Rumkapacitet beräknas dynamiskt i `lib/roomCalculator.ts` baserat på:

1. **capacity_m2** (fast värde i databasen)
2. **Hundars storlekar** (dogs.heightcm)

**Yta per hund (Jordbruksverket):**

- < 25 cm: 2 m²
- 25-35 cm: 2 m²
- 36-45 cm: 2,5 m²
- 46-55 cm: 3,5 m²
- 56-65 cm: 4,5 m²
- \> 65 cm: 5,5 m²

**Exempel:**

Ett rum med 20 m² kan rymma:

- 10 små hundar (< 35 cm) = 10 × 2 m² = 20 m²
- 5 stora hundar (56-65 cm) = 5 × 4,5 m² = 22,5 m² ❌ **För många!**
- 4 stora hundar = 4 × 4,5 m² = 18 m² ✅

**Kopplingar:**

- ← `orgs.id` (MANY-TO-ONE: många rum → en organisation)
- → `dogs.room_id` (ONE-TO-MANY: ett rum → många hundar)
- → `bookings.room_id` (ONE-TO-MANY: ett rum → många bokningar)

**Exempel query:**

```typescript
// Hämta rum med antal hundar
const { data: rooms } = await supabase
  .from("rooms")
  .select(
    `
    *,
    dogs:dogs!room_id(count)
  `
  )
  .eq("org_id", currentOrgId)
  .eq("is_active", true);
```

---

## 🛒 TILLÄGGSTJÄNSTER

### **extra_services** (PLURAL) - Priskatalog

Katalog över VILKA tilläggstjänster som FINNS och deras priser. Används i admin.

```sql
CREATE TABLE extra_services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID REFERENCES orgs(id) ON DELETE CASCADE,
    branch_id     UUID,
    label         TEXT NOT NULL,
    price         NUMERIC NOT NULL,
    unit          TEXT NOT NULL,
    service_type  TEXT DEFAULT 'all',
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT extra_services_service_type_check
    CHECK (service_type IN ('boarding', 'daycare', 'grooming', 'both', 'all'))
);
```

**Kolumner:**

| Kolumn         | Beskrivning                      | Exempel                            |
| -------------- | -------------------------------- | ---------------------------------- |
| `label`        | **REQUIRED** - Namn på tjänsten  | "Kloklippning", "Medicin tillsyn"  |
| `price`        | **REQUIRED** - Pris              | 150.00                             |
| `unit`         | **REQUIRED** - Enhet             | "per gång", "per dag", "fast pris" |
| `service_type` | Var tjänsten gäller              | 'all', 'boarding', 'daycare' etc.  |
| `is_active`    | Om tjänsten ska visas i formulär | true = visas, false = dold         |

**Användning:**

- Visas i dropdowns när personal bokar tilläggstjänster
- Admin kan lägga till/redigera/ta bort tjänster
- Priser kan uppdateras centralt

---

### **extra_service** (SINGULAR) - Faktisk tjänst

Kopplar en SPECIFIK hund till en SPECIFIK tjänst. "Bella har kloklipp varje månad".

```sql
CREATE TABLE extra_service (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE,
    dogs_id         UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
    service_type    TEXT,
    quantity        INTEGER DEFAULT 1,
    price           NUMERIC(10,2),
    notes           TEXT,
    performed_at    DATE DEFAULT CURRENT_DATE NOT NULL,
    payment_type    TEXT DEFAULT 'afterpayment',
    end_date        DATE,
    is_active       BOOLEAN DEFAULT true,
    user_id         UUID REFERENCES profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT extra_service_payment_type_check
    CHECK (payment_type IN ('prepayment', 'afterpayment'))
);
```

**⚠️ VIKTIGT om kolumnnamn:**

Notera att foreign key till dogs heter `dogs_id` (INTE dog_id) - detta är inkonsekvent men så är schemat!

**Kolumner:**

| Kolumn         | Beskrivning                               | Viktigt                           |
| -------------- | ----------------------------------------- | --------------------------------- |
| `dogs_id`      | **REQUIRED** - Vilken hund (OBS! PLURAL!) | FK till dogs.id                   |
| `service_type` | Typ av tjänst                             | "kloklipp", "medicin", etc.       |
| `quantity`     | Antal                                     | Default: 1                        |
| `price`        | Pris för denna tjänst                     | Kan skilja sig från katalogpris   |
| `notes`        | Anteckningar                              | "Extra lång klippning"            |
| `performed_at` | **REQUIRED** - När tjänsten utfördes      | Default: idag                     |
| `payment_type` | Hur betalning sker                        | 'prepayment' eller 'afterpayment' |
| `end_date`     | Om tjänsten har slutdatum                 | För abonnemangstjänster           |
| `is_active`    | Om tjänsten fortfarande är aktiv          | Default: true                     |
| `user_id`      | Vem som registrerade tjänsten             | FK till profiles.id               |

**payment_type förklarat:**

- **'prepayment'** = Ingår i förskottsfaktura (t.ex. daglig medicin vid pensionat)
- **'afterpayment'** = Betalas vid utcheckning (t.ex. akut kloklippning)

**Kopplingar:**

- ← `dogs.id` (MANY-TO-ONE: många tjänster → en hund)
- → Visas på fakturor via invoice_items

**Exempel query:**

```typescript
// Hämta alla tilläggstjänster för en hund
const { data: services } = await supabase
  .from("extra_service")
  .select("*")
  .eq("dogs_id", dogId) // OBS! dogs_id, inte dog_id!
  .eq("is_active", true)
  .order("performed_at", { ascending: false });
```

---

## 📅 BOKNINGAR (PENSIONAT)

### **bookings** - Pensionatsbokningar

Huvudtabellen för hundpensionat. Innehåller ALLA bokningar från pending → checked_out.

```sql
CREATE TABLE bookings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      UUID REFERENCES orgs(id) ON DELETE CASCADE,
    dog_id                      UUID REFERENCES dogs(id) ON DELETE CASCADE,
    owner_id                    UUID REFERENCES owners(id) ON DELETE CASCADE,
    room_id                     UUID REFERENCES rooms(id) ON DELETE SET NULL,
    start_date                  DATE NOT NULL,
    end_date                    DATE NOT NULL,
    checkin_time                TIMESTAMP WITH TIME ZONE,
    checkout_time               TIMESTAMP WITH TIME ZONE,
    status                      TEXT DEFAULT 'pending',
    base_price                  NUMERIC(10,2) DEFAULT 0,
    total_price                 NUMERIC,
    discount_amount             NUMERIC DEFAULT 0,
    addons                      JSONB DEFAULT '[]',
    extra_service_ids           JSONB,
    deposit_amount              NUMERIC,
    deposit_paid                BOOLEAN DEFAULT false,
    prepayment_status           TEXT DEFAULT 'unpaid',
    prepayment_invoice_id       UUID REFERENCES invoices(id),
    afterpayment_invoice_id     UUID REFERENCES invoices(id),
    notes                       TEXT,
    belongings                  TEXT,
    bed_location                TEXT,
    consent_required            BOOLEAN DEFAULT false,
    consent_pending_until       TIMESTAMP WITH TIME ZONE,
    cancellation_reason         TEXT,
    cancelled_at                TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id        UUID REFERENCES profiles(id),
    is_active                   BOOLEAN DEFAULT true,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),

    CONSTRAINT bookings_prepayment_status_check
    CHECK (prepayment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded'))
);
```

**Viktiga kolumner:**

| Kolumn                    | Beskrivning                      | Viktigt                          |
| ------------------------- | -------------------------------- | -------------------------------- |
| `start_date`              | **REQUIRED** - Incheckning       | Datum (inte timestamp)           |
| `end_date`                | **REQUIRED** - Utcheckning       | Datum (inte timestamp)           |
| `checkin_time`            | Exakt tid för incheckning        | Timestamp, sätts vid incheckning |
| `checkout_time`           | Exakt tid för utcheckning        | Timestamp, sätts vid utcheckning |
| `status`                  | Bokningsstatus                   | Se nedan                         |
| `base_price`              | Grundpris för rummet (frozen)    | **Frysts vid bokning**           |
| `total_price`             | Total kostnad inklusive addons   | Beräknas automatiskt             |
| `addons`                  | JSONB array med tilläggstjänster | Se struktur nedan                |
| `prepayment_status`       | Status för förskottsbetalning    | 'unpaid', 'paid', 'refunded'     |
| `prepayment_invoice_id`   | Länk till förskottsfaktura       | FK till invoices.id              |
| `afterpayment_invoice_id` | Länk till efterskottsfaktura     | FK till invoices.id              |
| `belongings`              | Saker hunden har med sig         | "Filt, leksak, egen mat"         |
| `bed_location`            | Plats i rummet                   | "Övre bädden vänster"            |
| `cancellation_reason`     | Varför bokning avbokades         | Text från kund eller personal    |
| `cancelled_at`            | När avbokning skedde             | Timestamp                        |
| `cancelled_by_user_id`    | Vem som avbokade                 | FK till profiles.id              |

**status förklarat:**

| Status        | Beskrivning                                  |
| ------------- | -------------------------------------------- |
| `pending`     | Bokning begärd, väntar på godkännande        |
| `confirmed`   | Godkänd, förskottsfaktura skickad            |
| `checked_in`  | Hunden är på pensionatet                     |
| `checked_out` | Hunden har lämnat, efterskottsfaktura skapad |
| `cancelled`   | Avbokad                                      |

**addons JSONB-struktur:**

```json
[
  {
    "service": "Kloklippning",
    "price": 150.0,
    "quantity": 1,
    "total": 150.0
  },
  {
    "service": "Medicin tillsyn",
    "price": 50.0,
    "quantity": 5,
    "total": 250.0,
    "note": "2 gånger dagligen"
  }
]
```

**⚠️ KRITISKT: Dubbel fakturering**

Pensionat använder **4-radssystemet** (frozen invoice prices):

1. **Vid godkännande** (status: pending → confirmed):
   - Skapa `prepayment_invoice_id` (förskott för rummet)
   - Frys `base_price` (så priset inte ändras senare)
   - Sätt `prepayment_status` = 'unpaid'

2. **Vid utcheckning** (status: checked_in → checked_out):
   - Skapa `afterpayment_invoice_id` (efterskott för addons)
   - Beräkna addons och extra_service
   - Total kostnad = förskott + efterskott

**Viktiga triggers:**

1. **`create_prepayment_invoice_on_approval()`**
   - Körs när status ändras till 'confirmed'
   - Skapar förskottsfaktura automatiskt

2. **`create_invoice_on_checkout()`**
   - Körs när status ändras till 'checked_out'
   - Skapar efterskottsfaktura automatiskt
   - Summerar alla tilläggstjänster

**Kopplingar:**

- ← `dogs.id` (MANY-TO-ONE: många bokningar → en hund)
- ← `owners.id` (MANY-TO-ONE: många bokningar → en ägare)
- ← `rooms.id` (MANY-TO-ONE: många bokningar → ett rum)
- → `invoices.id` (ONE-TO-ONE: en bokning → två fakturor)
- → `booking_services` (ONE-TO-MANY: en bokning → många tjänster)
- → `booking_events` (ONE-TO-MANY: en bokning → många händelser)

**Exempel query:**

```typescript
// Hämta bokningar med alla relationer
const { data: bookings } = await supabase
  .from("bookings")
  .select(
    `
    *,
    dogs(id, name, breed, owner:owners(full_name, email, phone)),
    rooms(id, name),
    prepayment_invoice:invoices!prepayment_invoice_id(*),
    afterpayment_invoice:invoices!afterpayment_invoice_id(*)
  `
  )
  .eq("org_id", currentOrgId)
  .gte("end_date", today)
  .order("start_date");
```

---

## 💰 FAKTURERING

### **invoices** - Fakturor

HUVUDTABELLEN för all fakturering (dagis, pensionat, frisör).

```sql
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    owner_id        UUID REFERENCES owners(id) ON DELETE SET NULL,
    invoice_number  TEXT,
    invoice_date    DATE DEFAULT NOW() NOT NULL,
    due_date        DATE,
    invoice_type    TEXT DEFAULT 'full',
    status          TEXT DEFAULT 'draft',
    total_amount    NUMERIC(12,2) DEFAULT 0,
    billed_name     TEXT,
    billed_email    TEXT,
    billed_address  TEXT,
    sent_at         TIMESTAMP WITH TIME ZONE,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT invoices_status_check
    CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),

    CONSTRAINT invoices_invoice_type_check
    CHECK (invoice_type IN ('prepayment', 'afterpayment', 'full'))
);
```

**Kolumner:**

| Kolumn           | Beskrivning                 | Viktigt                              |
| ---------------- | --------------------------- | ------------------------------------ |
| `org_id`         | **REQUIRED** - Organisation | FK till orgs.id                      |
| `owner_id`       | Vilken kund                 | FK till owners.id                    |
| `invoice_number` | Fakturanummer               | **Auto-genereras av trigger**        |
| `invoice_date`   | **REQUIRED** - Fakturadatum | Default: idag                        |
| `due_date`       | Förfallodatum               | Vanligtvis invoice_date + 30 dagar   |
| `invoice_type`   | Typ av faktura              | Se nedan                             |
| `status`         | Fakturastatus               | 'draft', 'sent', 'paid', 'cancelled' |
| `total_amount`   | Total summa                 | **Beräknas av trigger**              |
| `billed_name`    | Kundens namn (frozen)       | Kopieras från owner vid skapande     |
| `billed_email`   | Kundens email (frozen)      | Kopieras från owner                  |
| `billed_address` | Kundens adress (frozen)     | Kopieras från owner                  |
| `sent_at`        | När fakturan skickades      | Timestamp                            |
| `deleted_at`     | Mjuk radering               | NULL = inte raderad                  |

**invoice_type förklarat:**

| Typ            | Användning                                  | Exempel                          |
| -------------- | ------------------------------------------- | -------------------------------- |
| `prepayment`   | Förskottsfaktura (pensionat)                | Rumskostnad vid bokning          |
| `afterpayment` | Efterskottsfaktura (pensionat)              | Tilläggstjänster vid utcheckning |
| `full`         | Komplett faktura (dagis, frisör, månadsvis) | Månadsvis dagisfaktura           |

**⚠️ KRITISKT: Fakturanummer**

Fakturanummer genereras AUTOMATISKT av function `generate_invoice_number()`:

- Format: `ORG-YYYY-NNNN`
- Exempel: `ABC-2025-0001`, `ABC-2025-0002`, etc.
- Unikt per organisation och år
- Sätts vid INSERT om invoice_number är NULL

**⚠️ KRITISKT: Frysta kunduppgifter**

`billed_name`, `billed_email`, `billed_address` **frysts vid skapande** för att:

- Om kund byter adress ska gamla fakturor behålla gammal adress (GDPR + bokföring)
- Historiska fakturor ska vara oförändrade

**Viktiga triggers:**

1. **`generate_invoice_number()`**
   - Körs FÖRE INSERT
   - Genererar unikt fakturanummer automatiskt

2. **`calculate_invoice_total()`**
   - Körs när invoice_items ändras
   - Summerar alla rader och uppdaterar total_amount

**Kopplingar:**

- ← `owners.id` (MANY-TO-ONE: många fakturor → en ägare)
- → `invoice_items` (ONE-TO-MANY: en faktura → många rader)
- ← `bookings.prepayment_invoice_id` (ONE-TO-ONE: en faktura ← en bokning)
- ← `bookings.afterpayment_invoice_id` (ONE-TO-ONE: en faktura ← en bokning)

---

### **invoice_items** - Fakturarader

Varje rad på en faktura.

```sql
CREATE TABLE invoice_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id    UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description   TEXT NOT NULL,
    quantity      NUMERIC DEFAULT 1,
    unit_price    NUMERIC(10,2) NOT NULL,
    total_price   NUMERIC(10,2) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn        | Beskrivning                    | Exempel                          |
| ------------- | ------------------------------ | -------------------------------- |
| `invoice_id`  | **REQUIRED** - Vilken faktura  | FK till invoices.id              |
| `description` | **REQUIRED** - Beskrivning     | "Hundpensionat 3 nätter (Bella)" |
| `quantity`    | Antal                          | 3 (nätter)                       |
| `unit_price`  | **REQUIRED** - Pris per styck  | 450.00 (per natt)                |
| `total_price` | **REQUIRED** - Total för raden | 1350.00 (3 × 450)                |

**⚠️ VIKTIGT: Frozen prices**

När invoice_items skapas KOPIERAS priserna från aktuella priser. Om prislistan ändras senare påverkas INTE gamla fakturor!

**Trigger:**

- `calculate_invoice_total()` summerar alla items och uppdaterar invoices.total_amount

**Exempel query:**

```typescript
// Hämta faktura med alla rader
const { data: invoice } = await supabase
  .from("invoices")
  .select(
    `
    *,
    owner:owners(full_name, email, customer_number),
    items:invoice_items(*)
  `
  )
  .eq("id", invoiceId)
  .single();
```

---

### **invoice_runs** - Månadsvis faktureringskörning

Spårar när månadsvis mass-fakturering körs (för dagis-abonnemang).

```sql
CREATE TABLE invoice_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    run_date            DATE DEFAULT NOW() NOT NULL,
    billing_period      TEXT NOT NULL,
    status              TEXT DEFAULT 'pending',
    total_invoices      INTEGER DEFAULT 0,
    total_amount        NUMERIC(12,2) DEFAULT 0,
    processed_count     INTEGER DEFAULT 0,
    error_count         INTEGER DEFAULT 0,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_by          UUID REFERENCES profiles(id),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Används för:**

- Skapa ALLA dagis-fakturor för en månad på en gång
- Spåra vilka fakturor som hör till samma körning
- Rapportering (hur många fakturor skickades i december?)

---

## 💵 PRISLISTOR

### **daycare_pricing** - Dagis-priser

```sql
CREATE TABLE daycare_pricing (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    subscription_type TEXT NOT NULL,
    size_category     TEXT NOT NULL,
    monthly_price     NUMERIC(10,2) NOT NULL,
    daily_price       NUMERIC(10,2),
    is_active         BOOLEAN DEFAULT true,
    valid_from        DATE DEFAULT NOW(),
    valid_until       DATE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn              | Beskrivning                      | Exempel                                      |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `subscription_type` | **REQUIRED** - Typ av abonnemang | 'heltid', 'deltid_2', 'deltid_3', 'dagshund' |
| `size_category`     | **REQUIRED** - Storlek på hund   | 'small', 'medium', 'large'                   |
| `monthly_price`     | **REQUIRED** - Månadspris        | 4500.00                                      |
| `daily_price`       | Pris per dag (för dagshundar)    | 350.00                                       |
| `valid_from`        | När priset börjar gälla          | Default: idag                                |
| `valid_until`       | När priset slutar gälla          | NULL = gäller tills vidare                   |

**Subscription types:**

- **'heltid'** - 5 dagar/vecka
- **'deltid_2'** - 2 dagar/vecka
- **'deltid_3'** - 3 dagar/vecka
- **'dagshund'** - Ingen prenumeration, betalar per dag

**Size categories:**

- **'small'** - heightcm < 35
- **'medium'** - heightcm 35-50
- **'large'** - heightcm > 50

---

### **boarding_prices** - Pensionatspriser

```sql
CREATE TABLE boarding_prices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    size_category   TEXT NOT NULL,
    price_per_night NUMERIC(10,2) NOT NULL,
    season_id       UUID REFERENCES boarding_seasons(id),
    is_active       BOOLEAN DEFAULT true,
    valid_from      DATE DEFAULT NOW(),
    valid_until     DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn            | Beskrivning                  | Exempel                     |
| ----------------- | ---------------------------- | --------------------------- |
| `size_category`   | **REQUIRED** - Storlek       | 'small', 'medium', 'large'  |
| `price_per_night` | **REQUIRED** - Pris per natt | 450.00                      |
| `season_id`       | Om säsongspris               | FK till boarding_seasons.id |
| `valid_from`      | När priset börjar gälla      | Default: idag               |
| `valid_until`     | När priset slutar gälla      | NULL = gäller tills vidare  |

**Prisberäkning:**

Se `lib/boardingPriceCalculator.ts` för komplex logik som hanterar:

- Basepris per storlek
- Säsonger (jul, midsommar, sportlov)
- Helgdagar (lördagar/söndagar)
- Special dates (specifika datum med egen prissättning)

---

### **boarding_seasons** - Säsonger för pensionat

```sql
CREATE TABLE boarding_seasons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    season_name     TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    price_multiplier NUMERIC(3,2) DEFAULT 1.0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Exempel:**

| season_name | start_date | end_date   | price_multiplier |
| ----------- | ---------- | ---------- | ---------------- |
| Jul 2025    | 2025-12-20 | 2026-01-06 | 1.5              |
| Midsommar   | 2025-06-19 | 2025-06-22 | 1.3              |
| Sportlov    | 2025-02-17 | 2025-02-23 | 1.2              |

**price_multiplier:**

- 1.0 = Normalpris
- 1.5 = 50% dyrare (jul)
- 1.3 = 30% dyrare (midsommar)

---

### **special_dates** - Specifika datumpriser

```sql
CREATE TABLE special_dates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    date            DATE NOT NULL,
    date_type       TEXT NOT NULL,
    price_multiplier NUMERIC(3,2) DEFAULT 1.0,
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Exempel:**

| date       | date_type | price_multiplier | description   |
| ---------- | --------- | ---------------- | ------------- |
| 2025-12-24 | holiday   | 2.0              | Julafton      |
| 2025-12-31 | holiday   | 1.8              | Nyårsafton    |
| 2025-06-06 | holiday   | 1.5              | Nationaldagen |
| 2025-07-15 | weekend   | 1.2              | Helg (lördag) |

**date_type:**

- **'holiday'** - Helgdag
- **'weekend'** - Helg
- **'special'** - Annat specialdatum

---

## 📋 VÄNTELISTA OCH INTRESSE

### **interest_applications** - Ansökningar till väntelista

**⚠️ UPPDATERAD 3 Dec 2025:** Nya kolumner för spårbarhet (created_dog_id, created_owner_id)!

```sql
CREATE TABLE interest_applications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    application_date        DATE DEFAULT NOW() NOT NULL,
    owner_name              TEXT NOT NULL,
    owner_email             TEXT NOT NULL,
    owner_phone             TEXT,
    dog_name                TEXT NOT NULL,
    dog_breed               TEXT,
    dog_birth_date          DATE,
    dog_gender              TEXT,
    dog_size                TEXT,
    desired_start_date      DATE,
    subscription_type       TEXT,
    days_of_week            TEXT,
    service_type            TEXT DEFAULT 'daycare',
    additional_info         TEXT,
    status                  TEXT DEFAULT 'pending',
    assigned_to_user_id     UUID REFERENCES profiles(id),
    processed_at            TIMESTAMP WITH TIME ZONE,
    notes                   TEXT,
    created_dog_id          UUID REFERENCES dogs(id) ON DELETE SET NULL,      -- 🆕 Spårbarhet!
    created_owner_id        UUID REFERENCES owners(id) ON DELETE SET NULL,     -- 🆕 Spårbarhet!
    consent_given           BOOLEAN DEFAULT false,
    gdpr_consent            BOOLEAN DEFAULT false,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Viktiga kolumner:**

| Kolumn                | Beskrivning                              | Användning                          |
| --------------------- | ---------------------------------------- | ----------------------------------- |
| `status`              | Status för ansökan                       | 'pending', 'approved', 'rejected'   |
| `service_type`        | Vilken tjänst de är intresserade av      | 'daycare', 'boarding', 'grooming'   |
| `desired_start_date`  | När de vill börja                        | Planeringsverktyg                   |
| `created_dog_id`      | 🆕 Om ansökan resulterade i skapad hund  | FK till dogs.id (**Spårbarhet!**)   |
| `created_owner_id`    | 🆕 Om ansökan resulterade i skapad ägare | FK till owners.id (**Spårbarhet!**) |
| `assigned_to_user_id` | Vilken personal som hanterar ansökan     | FK till profiles.id                 |

**🆕 KONVERTERINGSANALYS:**

Med de nya kolumnerna kan du enkelt spåra hur många intresseanmälningar som blir faktiska kunder:

```typescript
// När du godkänner en ansökan och skapar kund/hund
const { data: newOwner } = await supabase
  .from("owners")
  .insert({
    org_id: currentOrgId,
    full_name: application.owner_name,
    email: application.owner_email,
    phone: application.owner_phone,
    // ...
  })
  .select()
  .single();

const { data: newDog } = await supabase
  .from("dogs")
  .insert({
    org_id: currentOrgId,
    owner_id: newOwner.id,
    name: application.dog_name,
    breed: application.dog_breed,
    // ...
  })
  .select()
  .single();

// 👉 Länka tillbaka till intresseanmälan för spårbarhet!
await supabase
  .from("interest_applications")
  .update({
    created_dog_id: newDog.id,
    created_owner_id: newOwner.id,
    status: "approved",
    processed_at: new Date().toISOString(),
  })
  .eq("id", application.id);
```

**📊 Se konverteringsgrad:**

```sql
-- Använd den nya analytics-vyn
SELECT * FROM analytics_conversion_rate
WHERE org_id = 'din-org-id';

-- Output:
-- service_type | total_applications | converted_dogs | conversion_rate_percent
-- daycare      | 42                | 28            | 66.7%
-- boarding     | 18                | 12            | 66.7%
```

**Workflow:**

1. Kund fyller i formulär på hemsida
2. Skapas som interest_application med status='pending'
3. Personal granskar i admin-panel
4. Vid godkännande: Skapa owner + dog, **länka via created_owner_id/created_dog_id** 🆕
5. Status = 'approved'
6. Nu kan du analysera konverteringsgrad! 📊

---

## 💇 FRISÖR

### **grooming_bookings** - Frisörbokningar

**✅ Verifierad produktion:** Tabellen finns och fungerar med externa kunder  
**✅ RLS Status:** Aktiverat - användare ser endast sin orgs bokningar  
**🔒 Policies:** 4 st (SELECT, INSERT, UPDATE, DELETE) - authenticated only

```sql
CREATE TABLE grooming_bookings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES orgs(id) ON DELETE CASCADE,
    dog_id                  UUID REFERENCES dogs(id) ON DELETE CASCADE,
    appointment_date        DATE NOT NULL,
    appointment_time        TIME,
    service_type            TEXT NOT NULL,
    estimated_price         NUMERIC(10,2),
    status                  TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    -- Externa kunder (walk-in)
    external_customer_name  TEXT,
    external_customer_phone TEXT,
    external_dog_name       TEXT,
    external_dog_breed      TEXT,
    clip_length             TEXT,
    shampoo_type            TEXT
);
```

**Kolumner:**

| Kolumn                   | Beskrivning                | Användning                                       |
| ------------------------ | -------------------------- | ------------------------------------------------ |
| `dog_id`                 | Om hunden finns i systemet | FK till dogs.id, CASCADE vid radering            |
| `appointment_date`       | **REQUIRED** - Datum       | DATE (ej timestamp)                              |
| `appointment_time`       | Tid på dagen               | TIME (frivilligt)                                |
| `service_type`           | Typ av tjänst              | 'bath', 'bath_trim', 'full_groom', etc.          |
| `estimated_price`        | Uppskattat pris            | Sätts vid bokning                                |
| `status`                 | Bokningsstatus             | 'confirmed', 'completed', 'cancelled', 'no_show' |
| `external_customer_name` | För walk-in kunder         | Kunder ej i systemet (NULLABLE)                  |
| `external_dog_name`      | För hundar ej i systemet   | Walk-in hundar (NULLABLE)                        |
| `clip_length`            | Önskad klipplängd          | T.ex. "3mm", "kort", "lång"                      |
| `shampoo_type`           | Val av schampo             | Frivilligt                                       |

**Externa kunder (Walk-in):**

Om kund/hund INTE finns i systemet kan frisören boka via external-fält. Detta är för:

- Walk-in kunder
- En-gångs klippningar
- Kunder som inte vill registreras

**Viktigt:**

- Antingen `dog_id` (registrerad hund) ELLER `external_dog_name` (walk-in) ska vara ifyllt
- `org_id` är ALLTID required (multi-tenant)
- RLS policies säkerställer att användare endast ser sin orgs bokningar

---

### **grooming_prices** - Frisörprislista

**✅ Verifierad produktion:** Tabellen finns och används för prissättning  
**✅ RLS Status:** Aktiverat - användare ser endast sin orgs priser  
**🔒 Policies:** 4 st (SELECT, INSERT, UPDATE, DELETE) - authenticated only

```sql
CREATE TABLE grooming_prices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE,
    service_name      TEXT NOT NULL,
    service_type      TEXT NOT NULL,
    description       TEXT,
    base_price        NUMERIC(10,2) NOT NULL,
    price_small       NUMERIC(10,2),
    price_medium      NUMERIC(10,2),
    price_large       NUMERIC(10,2),
    price_xlarge      NUMERIC(10,2),
    duration_minutes  INTEGER,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

**Exempel:**

| service_name | service_type | base_price | price_small | price_medium | price_large | duration_minutes |
| ------------ | ------------ | ---------- | ----------- | ------------ | ----------- | ---------------- |
| Klippning    | full_groom   | 600.00     | 500.00      | 600.00       | 800.00      | 90               |
| Bad          | bath         | 300.00     | 250.00      | 300.00       | 400.00      | 45               |
| Kloklippning | nails        | 150.00     | 150.00      | 150.00       | 150.00      | 15               |
| Trimning     | trim         | 700.00     | 600.00      | 700.00       | 900.00      | 120              |

**Prissättning per storlek:**

- Om `price_small`, `price_medium`, etc. är NULL → använd `base_price` (fast pris)
- Om de är satta → välj pris baserat på hundstorlek

---

### **grooming_journal** - Frisörjournal

**✅ Verifierad produktion:** Tabellen finns och används för historik  
**✅ RLS Status:** Aktiverat - användare ser endast sin orgs journal  
**🔒 Policies:** 3 st (SELECT, INSERT, UPDATE) - authenticated only

```sql
CREATE TABLE grooming_journal (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      UUID REFERENCES orgs(id),
    dog_id                      UUID REFERENCES dogs(id),
    appointment_date            DATE NOT NULL,
    service_type                TEXT NOT NULL,
    clip_length                 TEXT,
    shampoo_type                TEXT,
    special_treatments          TEXT,
    final_price                 NUMERIC(10,2) DEFAULT 0 NOT NULL,
    duration_minutes            INTEGER,
    notes                       TEXT,
    before_photos               TEXT[],
    after_photos                TEXT[],
    next_appointment_recommended TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    -- Externa kunder
    external_customer_name      TEXT,
    external_dog_name           TEXT,
    external_dog_breed          TEXT,
    booking_id                  UUID REFERENCES grooming_bookings(id)
);
```

**Användning:**

- Historik över utförda frisörtjänster
- Foton före/efter (URLs till Supabase Storage)
- Kan kopplas till booking via `booking_id`
- Stödjer både registrerade hundar (`dog_id`) och externa (`external_*`)

**Viktigt:**

- `final_price` är faktiskt pris som debiterades (kan skilja från estimated_price)
- `before_photos` och `after_photos` är arrayer av URL:er
- Används för att visa kunden tidigare klippningar

---

## 🏨 PENSIONAT (BOARDING)

### **boarding_seasons** - Säsonger med olika priser

**✅ Verifierad produktion:** Tabellen finns med 2 säsonger  
**✅ RLS Status:** Aktiverat - användare ser endast sin orgs säsonger  
**🔒 Policies:** 4 st (SELECT, INSERT, UPDATE, DELETE) - authenticated only

```sql
CREATE TABLE boarding_seasons (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    type              TEXT CHECK (type IN ('high', 'low', 'holiday')),
    price_multiplier  NUMERIC(3,2) DEFAULT 1.0,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

**Exempel:**

| name       | start_date | end_date   | type    | price_multiplier |
| ---------- | ---------- | ---------- | ------- | ---------------- |
| Sommar     | 2026-06-01 | 2026-08-30 | high    | 1.2              |
| Jul & Nyår | 2025-12-15 | 2026-01-05 | holiday | 1.5              |

**Användning:**

- Olika priser beroende på säsong
- `price_multiplier` = bas-pris × multiplier
- `is_active` = kan inaktiveras utan att radera

---

### **special_dates** - Röda dagar och helgdagar

**✅ Verifierad produktion:** Tabellen finns med 7030 rader (alla svenska helgdagar)  
**✅ RLS Status:** Aktiverat - användare ser endast sin orgs datum  
**🔒 Policies:** 4 st (SELECT, INSERT, UPDATE, DELETE) - authenticated only

```sql
CREATE TABLE special_dates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           UUID REFERENCES orgs(id) ON DELETE CASCADE,
    date             DATE NOT NULL,
    name             TEXT NOT NULL,
    category         TEXT CHECK (category IN ('holiday', 'peak', 'off_peak')),
    price_surcharge  NUMERIC(10,2) DEFAULT 0,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, date)
);
```

**Exempel svenska helgdagar 2026:**

| date       | name          | category | price_surcharge |
| ---------- | ------------- | -------- | --------------- |
| 2026-01-01 | Nyårsdagen    | holiday  | 200.00          |
| 2026-12-24 | Julafton      | holiday  | 300.00          |
| 2026-12-25 | Juldagen      | holiday  | 300.00          |
| 2026-06-06 | Nationaldagen | holiday  | 150.00          |

**Användning:**

- Extra kostnad per dag för helgdagar
- Läggs till på grundpriset
- UNIQUE constraint på (org_id, date) - inga dubbletter

---

## 🔧 LOGG- OCH SYSTEMTABELLER

### **daycare_service_completions** - Dagishändelser

Spårar när hundar checkar in/ut på dagis och vilka tjänster som utförs.

**⚠️ VIKTIGT:** Tabellen har två olika användningar:

1. **Närvaroregistrering** (in/ut-checkning)
2. **Tilläggstjänster** (kloklipp, tassklipp, bad)

```sql
CREATE TABLE daycare_service_completions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    dog_id          UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
    service_type    TEXT NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad')),
    scheduled_date  DATE NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    completed_by    TEXT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kolumner:**

| Kolumn           | Typ       | Beskrivning              | Viktigt                        |
| ---------------- | --------- | ------------------------ | ------------------------------ |
| `id`             | UUID      | PRIMARY KEY              | Auto-genereras                 |
| `org_id`         | UUID      | Organisation             | **REQUIRED**                   |
| `dog_id`         | UUID      | Vilken hund              | **REQUIRED**                   |
| `service_type`   | TEXT      | Typ av tjänst            | 'kloklipp', 'tassklipp', 'bad' |
| `scheduled_date` | DATE      | Planerat datum           | **REQUIRED**                   |
| `completed_at`   | TIMESTAMP | När tjänsten slutfördes  | NULL = ej utförd än            |
| `completed_by`   | TEXT      | Vem som utförde tjänsten | Personal                       |
| `notes`          | TEXT      | Anteckningar             | Frivilligt                     |
| `created_at`     | TIMESTAMP | När posten skapades      | Auto                           |
| `updated_at`     | TIMESTAMP | Senast uppdaterad        | Auto via trigger               |

**Används för:**

- Närvarorapporter (vilka hundar var här vilken dag?)
- Fakturering (räkna antal dagar per månad)
- Statistik (beläggningsgrad)
- Tilläggstjänster (kloklipp, bad etc.)

---

### **booking_events** - Händelser på pensionatsbokningar

Audit trail för bokningar.

```sql
CREATE TABLE booking_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    event_type      TEXT NOT NULL,
    event_data      JSONB,
    user_id         UUID REFERENCES profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**event_type exempel:**

- 'booking_created'
- 'booking_confirmed'
- 'checked_in'
- 'checked_out'
- 'cancelled'
- 'price_updated'
- 'addon_added'

---

### **consent_logs** - GDPR-samtycken

Spårar alla GDPR-samtycken.

```sql
CREATE TABLE consent_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    owner_id                UUID REFERENCES owners(id),
    consent_type            TEXT NOT NULL,
    consent_given           BOOLEAN NOT NULL,
    consent_text            TEXT NOT NULL,
    consent_version         TEXT DEFAULT '1.0',
    ip_address              INET,
    user_agent              TEXT,
    signed_document_url     TEXT,
    witness_staff_id        UUID REFERENCES profiles(id),
    witness_notes           TEXT,
    given_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    withdrawn_at            TIMESTAMP WITH TIME ZONE,
    expires_at              TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**consent_type:**

- 'digital_email' - Samtycke via email-klick
- 'physical_form' - Pappersformulär
- 'phone_verbal' - Telefonsamtycke
- 'in_person' - På plats

---

## 🔥 TRIGGERS OCH AUTOMAGI

Systemet har **33+ triggers** som kör AUTOMATISKT. Här är de viktigaste:

### **ORGANISATION & ANVÄNDARE**

| Trigger                | Tabell     | När          | Vad den gör                                          |
| ---------------------- | ---------- | ------------ | ---------------------------------------------------- |
| `on_auth_user_created` | auth.users | EFTER INSERT | Skapar profil + org från user_metadata (**Layer 1**) |
| `set_org_from_user()`  | Flera      | FÖRE INSERT  | Sätter org_id från inloggad användare                |

### **KUNDNUMMER & FAKTURANUMMER**

| Trigger                                         | Tabell   | När         | Vad den gör                                            |
| ----------------------------------------------- | -------- | ----------- | ------------------------------------------------------ |
| `ensure_unique_customer_number_before_insert()` | owners   | FÖRE INSERT | Genererar unikt kundnummer per org (10001, 10002, ...) |
| `generate_invoice_number()`                     | invoices | FÖRE INSERT | Genererar fakturanummer (ORG-2025-0001, etc.)          |

### **PRISER & SUMMOR**

| Trigger                        | Tabell        | När                 | Vad den gör                                               |
| ------------------------------ | ------------- | ------------------- | --------------------------------------------------------- |
| `calculate_invoice_total()`    | invoice_items | EFTER INSERT/UPDATE | Summerar invoice_items → uppdaterar invoices.total_amount |
| `update_booking_total_price()` | bookings      | FÖRE UPDATE         | Beräknar total_price från base_price + addons             |

### **FAKTURERING (4-RADSSYSTEMET)**

| Trigger                                   | Tabell   | När          | Vad den gör                                          |
| ----------------------------------------- | -------- | ------------ | ---------------------------------------------------- |
| `create_prepayment_invoice_on_approval()` | bookings | EFTER UPDATE | När status → 'confirmed': Skapa förskottsfaktura     |
| `create_invoice_on_checkout()`            | bookings | EFTER UPDATE | När status → 'checked_out': Skapa efterskottsfaktura |

### **TIMESTAMP-HANTERING**

| Trigger                 | Tabell | När         | Vad den gör                 |
| ----------------------- | ------ | ----------- | --------------------------- |
| `update_last_updated()` | dogs   | FÖRE UPDATE | Sätter last_updated = NOW() |
| `handle_updated_at()`   | Flera  | FÖRE UPDATE | Sätter updated_at = NOW()   |

### **GDPR & ANONYMISERING**

| Trigger                     | Tabell | När          | Vad den gör                                    |
| --------------------------- | ------ | ------------ | ---------------------------------------------- |
| `anonymize_owner_trigger()` | owners | EFTER UPDATE | När is_anonymized=true: Radera personuppgifter |

---

## 🛠️ VIKTIGA FUNCTIONS

Systemet har **50+ functions**. Här är de kritiska:

### **AUTENTISERING & ORG-TILLDELNING**

```sql
-- Layer 1: Trigger-driven (körs vid registrering)
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Skapar org + profil från user_metadata
  -- Detta är PRIMÄR vägen för org_id-tilldelning
END;
$$ LANGUAGE plpgsql;

-- Layer 3: Healing (körs från AuthContext om org_id saknas)
CREATE FUNCTION heal_user_missing_org(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reparerar profiler som saknar org_id
  -- Skapar org om den inte finns
END;
$$ LANGUAGE plpgsql;
```

**⚠️ KRITISKT: 3-lagers org_id-systemet**

1. **Layer 1** (trigger): `on_auth_user_created` → `handle_new_user()`
2. **Layer 2** (API fallback): `/api/onboarding/auto`
3. **Layer 3** (healing): `heal_user_missing_org()`

Detta system får **ALDRIG** ändras utan djup förståelse!

### **KUNDPORTAL-VERIFIERING (7 December 2025)**

```sql
-- Verifiera kundkonto vid login (bypasser RLS)
CREATE OR REPLACE FUNCTION verify_customer_account(p_user_id UUID)
RETURNS TABLE (
  owner_id UUID,
  full_name TEXT,
  email TEXT,
  customer_number TEXT,
  org_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Körs med skaparens rättigheter (bypasser RLS)
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as owner_id,
    o.full_name,
    o.email,
    o.customer_number,
    o.org_id
  FROM owners o
  WHERE o.id = p_user_id;
END;
$$;
```

**Användning i kundportal-login:**

```typescript
// Efter lyckad auth.signInWithPassword()
const { data: ownerData, error: ownerError } = await supabase
  .rpc("verify_customer_account", { p_user_id: data.user.id })
  .maybeSingle();

// Om ingen owner → inte en kundregistrerad användare
if (!ownerData) {
  await supabase.auth.signOut();
  throw new Error("Inget kundkonto hittades");
}
```

**Varför SECURITY DEFINER?**

- RLS på `owners` tillåter bara `id = auth.uid()` efter inloggning
- Vid login-verifiering är `auth.uid()` ännu inte satt korrekt
- Denna funktion bypasser RLS tillfälligt för att verifiera kontot

### **FAKTURERING**

```sql
-- Generera fakturanummer
CREATE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Format: ORG-2025-NNNN
  -- Unikt per org och år
END;
$$ LANGUAGE plpgsql;

-- Skapa förskottsfaktura
CREATE FUNCTION create_prepayment_invoice(booking_id UUID)
RETURNS UUID AS $$
BEGIN
  -- Skapar invoice med invoice_type='prepayment'
  -- Fryser base_price
  -- Returnerar invoice_id
END;
$$ LANGUAGE plpgsql;

-- Skapa efterskottsfaktura
CREATE FUNCTION create_invoice_on_checkout(booking_id UUID)
RETURNS UUID AS $$
BEGIN
  -- Skapar invoice med invoice_type='afterpayment'
  -- Summerar alla addons och extra_service
  -- Returnerar invoice_id
END;
$$ LANGUAGE plpgsql;
```

### **RUMSBERÄKNING**

```sql
-- Beräkna rumskapacitet enligt Jordbruksverket
CREATE FUNCTION calculate_room_capacity(
  room_m2 NUMERIC,
  dog_heights INTEGER[]
)
RETURNS INTEGER AS $$
BEGIN
  -- Implementerar Jordbruksverkets regler
  -- Returnerar max antal hundar som får plats
END;
$$ LANGUAGE plpgsql;
```

**OBS:** Denna function är komplicerad och finns också i `lib/roomCalculator.ts` för client-side-beräkningar.

### **PRISBERÄKNING**

```sql
-- Beräkna pensionatspris
CREATE FUNCTION calculate_boarding_price(
  dog_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS NUMERIC AS $$
BEGIN
  -- Hämtar hundstorlek
  -- Loopar genom dagar
  -- Applicerar säsonger, helger, special_dates
  -- Returnerar totalpris
END;
$$ LANGUAGE plpgsql;
```

**OBS:** Även denna finns i `lib/boardingPriceCalculator.ts` för client-side.

---

## 🗺️ DATAFLÖDESDIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORGANISATION (orgs)                          │
│                    Multi-tenancy hub - ALLA tabeller                 │
│                          har org_id FK hit                           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────────┐
        │              │              │                  │
        ▼              ▼              ▼                  ▼
   ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌─────────────┐
   │profiles │   │ owners  │   │    rooms    │   │  pricing    │
   │(staff)  │   │(kunder) │   │             │   │   tables    │
   └─────────┘   └────┬────┘   └──────┬──────┘   └─────────────┘
                      │               │
                      ▼               │
                 ┌─────────┐          │
                 │  dogs   │◄─────────┘
                 └────┬────┘
                      │
      ┌───────────────┼───────────────┬──────────────┐
      │               │               │              │
      ▼               ▼               ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ bookings │   │ grooming │   │daycare   │   │dog_journal   │
│(pensionat)│  │_bookings │   │_service_ │   │              │
│          │   │          │   │completions│  │              │
└────┬─────┘   └────┬─────┘   └──────────┘   └──────────────┘
     │              │
     │              │
     ▼              ▼
┌────────────────────────┐
│      invoices          │
│   (4-radssystemet)     │
│                        │
│  prepayment_invoice    │
│  afterpayment_invoice  │
│  full (dagis/frisör)   │
└───────┬────────────────┘
        │
        ▼
┌────────────────┐
│ invoice_items  │
│ (fakturarader) │
└────────────────┘
```

---

## 🚨 RLS (ROW LEVEL SECURITY) POLICIES

**ALLA tabeller** har RLS aktiverat. Detta betyder:

```sql
-- Exempel RLS policy för dogs
CREATE POLICY "Users can only see dogs from their org"
ON dogs
FOR SELECT
USING (org_id = auth.uid_org_id());

CREATE POLICY "Users can insert dogs in their org"
ON dogs
FOR INSERT
WITH CHECK (org_id = auth.uid_org_id());
```

**Vad betyder detta:**

- Användare ser **ENDAST** data från sin egen organisation
- Multi-tenancy säkerställs på databasnivå
- Även om någon gissar UUID:er kan de INTE komma åt andras data

**Function för org-hämtning:**

```sql
CREATE FUNCTION auth.uid_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## ✅ BEST PRACTICES

### **Vid INSERT av nya poster:**

```typescript
// ✅ RÄTT: Sätt alltid org_id explicit
await supabase.from("dogs").insert({
  org_id: currentOrgId, // ALLTID sätt denna!
  owner_id: ownerId,
  name: "Bella",
  // ...
});

// ❌ FEL: Lita inte på att trigger sätter org_id
await supabase.from("dogs").insert({
  owner_id: ownerId,
  name: "Bella",
  // org_id saknas = RISK för NULL!
});
```

### **Vid queries:**

```typescript
// ✅ RÄTT: Filtrera alltid på org_id
const { data } = await supabase
  .from("dogs")
  .select("*")
  .eq("org_id", currentOrgId) // ALLTID filtrera på org!
  .eq("is_active", true);

// ⚠️ OK (RLS skyddar), men mindre tydligt
const { data } = await supabase.from("dogs").select("*").eq("is_active", true);
// RLS kommer automatiskt lägga till org_id-filter
```

### **Vid uppdatering av priser:**

```typescript
// ✅ RÄTT: Gamla fakturor påverkas INTE
// Priserna är "frysta" i invoice_items

// Uppdatera prislista
await supabase
  .from("boarding_prices")
  .update({ price_per_night: 500.0 })
  .eq("id", priceId);

// Gamla fakturor behåller sina frozen prices i invoice_items ✅
```

### **Vid fakturering:**

```typescript
// ✅ RÄTT: Låt triggers hantera fakturanummer
await supabase.from("invoices").insert({
  org_id: currentOrgId,
  owner_id: ownerId,
  invoice_date: new Date().toISOString().split("T")[0],
  // invoice_number sätts AUTOMATISKT av trigger
});

// ❌ FEL: Försök INTE sätta invoice_number manuellt
await supabase.from("invoices").insert({
  invoice_number: "ABC-2025-0001", // Trigger överskriver detta ändå!
  // ...
});
```

---

## 💰 FAKTURERINGSSYSTEM - KOMPLETT GUIDE

**Uppdaterad:** 1 Dec 2025 (Kritiska buggar fixade)  
**Status:** ✅ Produktionsklar

### Översikt

DogPlanner har två separata faktureringssystem:

1. **🏨 HUNDPENSIONAT** - Booking-baserad (förskott + efterskott)
2. **🐕 HUNDDAGIS** - Månadsbaserad (automatisk via cron)

---

### 🏨 HUNDPENSIONAT - Booking-baserad fakturering

#### Förskottsfaktura (Prepayment)

**När:** Booking status: `pending` → `confirmed`  
**Trigger:** `trg_create_prepayment_invoice`  
**Function:** `create_prepayment_invoice()`

**Vad inkluderas:**

```sql
-- RAD 1: Bokning grundpris (from bookings.total_price)
-- RAD 2: Prepayment services (from booking_services WHERE charge_at = 'prepayment')
-- Förfallodatum: MIN(14 dagar, 3 dagar före start_date)
-- Status: 'draft' (fakturaunderlag)
```

**Exempel:**

```
Hundpensionat (7 nätter, 2025-12-20 - 2025-12-27): 700 kr/natt × 7 = 4900 kr
Bad och nagelvård (förskott): 300 kr
──────────────────────────────────────────────────────────────
Förskottsfaktura: 5200 kr
Förfallodatum: 2025-12-17 (3 dagar före check-in)
```

#### Efterskottsfaktura (Checkout)

**När:** Booking status: any → `checked_out`  
**Trigger:** `trg_create_invoice_on_checkout`  
**Function:** `create_invoice_on_checkout()`

**Vad inkluderas:**

```sql
-- RAD 1: Grundpris (redan i förskott)
-- RAD 2: booking_services (charge_at = 'full')
-- RAD 3: extra_service (performed during stay)
-- RAD 4: Rabatt (från bookings.discount_amount)
```

**Beräkning:**

```typescript
total_with_services = base_price + SUM(services_price);
discount = bookings.discount_amount;
final_invoice_amount = total_with_services - discount;
```

**Exempel:**

```
Hundpensionat (7 nätter): 4900 kr (redan i förskott)
Veterinärbesök (utfört under vistelsen): 800 kr
Extra promenad dagligen (7 dagar × 50 kr): 350 kr
Rabatt (stamkund): -200 kr
──────────────────────────────────────────────────────────────
Efterskottsfaktura: 5850 kr
(4900 + 800 + 350 - 200)
```

---

### 🐕 HUNDDAGIS - Månadsbaserad fakturering

#### Automatisk månadsfakturering

**System:** Edge Function `generate_invoices`  
**Körs:** Automatiskt via Supabase pg_cron  
**Schema:** `'0 8 1 * *'` (kl 08:00 UTC den 1:a varje månad)  
**Migration:** `20251122_setup_automatic_invoice_cron.sql`

**Verifiera cron:**

```sql
SELECT * FROM cron.job WHERE jobname = 'monthly-invoice-generation';
-- Förväntat: schedule = '0 8 1 * *', active = true
```

#### Prissättning per organisation

**VIKTIGT:** Varje organisation har sina egna priser i `daycare_pricing` tabellen!

```sql
CREATE TABLE daycare_pricing (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id),  -- 👈 Varje org har sin egen rad

  -- Abonnemangspriser (företaget bestämmer själv)
  subscription_1day DECIMAL(10,2),   -- "Deltid 1" (1 dag/vecka)
  subscription_2days DECIMAL(10,2),  -- "Deltid 2" (2 dagar/vecka)
  subscription_3days DECIMAL(10,2),  -- "Deltid 3" (3 dagar/vecka)
  subscription_4days DECIMAL(10,2),  -- "Deltid 4" (4 dagar/vecka)
  subscription_5days DECIMAL(10,2),  -- "Heltid" (5 dagar/vecka)

  -- Drop-in-pris (Dagshund - faktureras INTE månadsvis)
  single_day_price DECIMAL(10,2),

  -- Rabatter (företaget bestämmer själv)
  sibling_discount_percent INTEGER,  -- Syskonrabatt i %

  -- Metadata
  effective_from DATE,
  updated_at TIMESTAMP
);
```

**Exempel - olika organisationers priser:**

**Organisation A (Cassandras Hunddagis, Stockholm):**

```sql
subscription_5days: 4500 kr/månad
subscription_3days: 3300 kr/månad
subscription_2days: 2500 kr/månad
sibling_discount_percent: 10
```

**Organisation B (Norrlands Hundpensionat, Kiruna):**

```sql
subscription_5days: 3200 kr/månad  -- Lägre hyror
subscription_3days: 2400 kr/månad
subscription_2days: 1800 kr/månad
sibling_discount_percent: 15  -- Mer generös
```

**Organisation C (Luxury Dog Spa, Östermalm):**

```sql
subscription_5days: 6500 kr/månad  -- Premium!
subscription_3days: 4800 kr/månad
subscription_2days: 3500 kr/månad
sibling_discount_percent: 5  -- Mindre rabatt
```

#### Hur Edge Function fungerar (FIXAD 2025-12-01)

**Flöde:**

```
1. Cron triggar kl 08:00 UTC den 1:a varje månad
2. Edge Function startar
3. För varje organisation:
   a. Hämta ORGANISATIONENS daycare_pricing
   b. Hämta hundar med aktiva abonnemang för denna org
   c. Filtrera: startdate <= månadens slut, enddate >= månadens start (eller NULL)
   d. Exkludera: subscription = "Dagshund" (de faktureras INTE månadsvis)
   e. För varje hund:
      - Lägg till abonnemangspris (från daycare_pricing)
      - Lägg till extra services (återkommande tillägg)
   f. Applicera syskonrabatt om > 1 hund
   g. Skapa faktura med status 'draft'
4. Logga resultat i invoice_runs
```

**Kritiska buggar fixade 2025-12-01:**

```diff
- ❌ FÖRE: Läste från price_lists (gammal tabell) → 0 kr för alla abonnemang!
+ ✅ EFTER: Läser från daycare_pricing → Korrekta priser per organisation

- ❌ FÖRE: prices["heltid".toLowerCase()] → undefined → 0 kr
+ ✅ EFTER: subscriptionMap["Heltid"] → 4500 kr (eller org's pris)

- ❌ FÖRE: Hämtade ALLA hundar, även utan subscription
+ ✅ EFTER: Endast hundar med aktiva abonnemang (startdate/enddate filter)

- ❌ FÖRE: Skapade fakturor med 0 kr
+ ✅ EFTER: Skippar fakturor utan billable items
```

**Kod (förenklad):**

```typescript
// Hämta ORGANISATIONENS priser
const { data: pricingData } = await supabase
  .from("daycare_pricing")
  .select("*")
  .eq("org_id", orgId) // 👈 Per organisation!
  .maybeSingle();

// Korrekt subscription-mappning
const subscriptionMap = {
  Heltid: pricingData.subscription_5days, // 4500 kr (eller org's pris)
  "Deltid 4": pricingData.subscription_4days,
  "Deltid 3": pricingData.subscription_3days, // 3300 kr
  "Deltid 2": pricingData.subscription_2days, // 2500 kr
  "Deltid 1": pricingData.subscription_1day,
};

const priceVal = subscriptionMap[dog.subscription];
```

#### Exempel - Månadsfaktura

**Organisation: Cassandras Hunddagis**  
**Månad: November 2025**  
**Ägare: Anna Andersson (3 hundar)**

```
Bella – Heltid: 4500 kr
Max – Heltid: 4500 kr
Luna – Deltid 3: 3300 kr
──────────────────────────────────
Subtotal: 12300 kr

Extra tjänster:
Bella – Träningskurs (månad): 500 kr
Max – Medicinering (daglig): 400 kr
──────────────────────────────────
Subtotal med tillägg: 13200 kr

Syskonrabatt (3 hundar, -10%): -1320 kr
──────────────────────────────────
TOTALT: 11880 kr
```

**Jämfört med annan organisation:**

**Organisation: Luxury Dog Spa** (högre priser)  
**Samma hundar:**

```
Bella – Heltid: 6500 kr (vs 4500 kr)
Max – Heltid: 6500 kr
Luna – Deltid 3: 4800 kr (vs 3300 kr)
Subtotal: 17800 kr

Extra tjänster: 900 kr
Syskonrabatt (3 hundar, -5%): -935 kr (mindre rabatt!)
──────────────────────────────────
TOTALT: 17765 kr
```

#### Extra services (återkommande tillägg)

**Tabell:** `extra_service`

```sql
CREATE TABLE extra_service (
  id UUID PRIMARY KEY,
  dogs_id UUID REFERENCES dogs(id),
  org_id UUID REFERENCES orgs(id),
  service_type TEXT,  -- "Träningskurs", "Medicinering", "Grooming"
  price DECIMAL(10,2),

  -- För HUNDDAGIS (återkommande)
  is_active BOOLEAN,
  frequency TEXT,  -- "daily", "weekly", "monthly"
  start_date DATE,
  end_date DATE,  -- NULL = pågående

  -- För PENSIONAT (engångstillägg)
  performed_at TIMESTAMP,
  quantity INTEGER
);
```

**Beräkning för hunddagis:**

```typescript
if (extra.frequency === "daily") {
  quantity = Math.ceil(daysInMonth * 0.8); // ~80% av dagarna
} else if (extra.frequency === "weekly") {
  quantity = 4; // 4 veckor per månad
} else if (extra.frequency === "monthly") {
  quantity = 1;
}

total = quantity * extra.price;
```

**Exempel:**

```
Medicinering (daily, 50 kr/dag):
- November har 30 dagar
- Hunden är där ~80% = 24 dagar
- Total: 24 × 50 kr = 1200 kr

Träningskurs (weekly, 200 kr/vecka):
- 4 veckor per månad
- Total: 4 × 200 kr = 800 kr

Grooming (monthly, 500 kr):
- 1 gång per månad
- Total: 1 × 500 kr = 500 kr
```

#### Syskonrabatt

**Appliceras automatiskt** om samma ägare har > 1 hund med abonnemang.

```typescript
if (dogsList.length > 1 && siblingDiscountPercent > 0 && total > 0) {
  const discountAmount = total * (siblingDiscountPercent / 100);
  total -= discountAmount;
}
```

**Exempel:**

```
Organisation A (10% syskonrabatt):
3 hundar, subtotal 12300 kr
Rabatt: 12300 × 0.10 = -1230 kr
Final: 11070 kr

Organisation B (15% syskonrabatt):
3 hundar, subtotal 12300 kr
Rabatt: 12300 × 0.15 = -1845 kr
Final: 10455 kr
```

### 📊 Fakturastatuser

```
draft       Fakturaunderlag (nyskapat, ej skickat)
sent        Skickat till kund
paid        Betalt
overdue     Förfallen
cancelled   Makulerad
```

**Flöde:**

```
1. System skapar: status = 'draft'
2. Admin granskar i /admin/faktura
3. Admin klickar "Skicka": status = 'sent' (email skickas)
4. Kund betalar: status = 'paid' (manuellt eller Stripe webhook)
5. Om ej betalt vid due_date: status = 'overdue'
```

### 🛠️ Fakturatabeller

**invoices:**

```sql
id UUID PRIMARY KEY
org_id UUID  -- Vilken organisation fakturan tillhör
owner_id UUID  -- Vilken ägare/kund
invoice_number TEXT UNIQUE  -- "INV-2025-001" (auto-genererad)
invoice_date DATE
due_date DATE
total_amount DECIMAL(10,2)
status TEXT  -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
invoice_type TEXT  -- 'prepayment', 'full', 'afterpayment'
billed_name TEXT
billed_email TEXT
notes TEXT
created_at TIMESTAMP
```

**invoice_items:**

```sql
id UUID PRIMARY KEY
invoice_id UUID REFERENCES invoices(id)
description TEXT  -- "Bella – Heltid", "Syskonrabatt"
quantity INTEGER
unit_price DECIMAL(10,2)
total_amount DECIMAL(10,2)
```

**invoice_runs:**

```sql
id UUID PRIMARY KEY
month_id TEXT  -- "2025-11"
status TEXT  -- 'success', 'failed'
invoices_created INTEGER
error_message TEXT
metadata JSONB  -- { total_amount, dog_count, timestamp }
created_at TIMESTAMP
```

### 🔍 Felsökning

**Cron körs inte:**

```sql
-- Kolla om cron finns
SELECT * FROM cron.job;

-- Om tom, kör migration:
-- supabase/migrations/20251122_setup_automatic_invoice_cron.sql
```

**Inga fakturor skapas:**

```sql
-- Kolla Edge Function logs i Supabase Dashboard
-- Eller kolla function_logs-tabellen:
SELECT * FROM function_logs
WHERE function_name = 'generate_invoices'
ORDER BY created_at DESC
LIMIT 10;
```

**Priser är 0 kr:**

```sql
-- Kolla om daycare_pricing finns för organisationen
SELECT * FROM daycare_pricing WHERE org_id = 'din-org-id';

-- Om tom, lägg till:
INSERT INTO daycare_pricing (org_id, subscription_5days, subscription_3days, ...)
VALUES ('din-org-id', 4500, 3300, ...);
```

**Hundar faktureras dubbelt:**

```sql
-- Kolla att startdate/enddate är korrekta
SELECT
  id,
  name,
  subscription,
  startdate,
  enddate
FROM dogs
WHERE org_id = 'din-org-id';

-- Sätt enddate om hund slutat:
UPDATE dogs
SET enddate = '2025-11-30'
WHERE id = 'hund-id';
```

### 🧪 Testning

**Manuell fakturagenerering:**

```bash
# I Supabase Dashboard → Edge Functions → generate_invoices
# Body:
{ "month": "2025-11" }
```

**Verifiera resultat:**

```sql
-- Senaste fakturorna
SELECT
  invoice_number,
  billed_name,
  total_amount,
  status,
  invoice_date
FROM invoices
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Fakturarader med priser
SELECT
  i.invoice_number,
  ii.description,
  ii.unit_price,
  ii.quantity,
  ii.total_amount
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.created_at > NOW() - INTERVAL '1 hour'
ORDER BY i.created_at DESC;

-- Verifiera att abonnemangspriser INTE är 0 kr!
SELECT * FROM invoice_items
WHERE description LIKE '%Heltid%'
AND unit_price = 0;  -- Ska vara TOM!
```

### 📝 Viktigt att veta

**Multi-tenant säkerhet:**

✅ **Allt är isolerat per organisation:**

- Priser hämtas från daycare_pricing WHERE org_id = X
- Hundar filtreras på org_id automatiskt via RLS
- Extra services filtreras på org_id
- Fakturor skapas med korrekt org_id

**Dagshundar faktureras INTE månadsvis:**

```sql
-- Dagshundar har subscription = "Dagshund"
-- De exkluderas från månadsfakturering:
.not("subscription", "eq", "Dagshund")

-- Dagshundar betalar per besök (single_day_price)
```

**Abonnemang måste vara aktiva:**

```sql
-- Endast hundar med:
startdate <= månadens slut
AND (enddate IS NULL OR enddate >= månadens start)

-- Exempel November 2025:
startdate <= 2025-11-30
AND (enddate IS NULL OR enddate >= 2025-11-01)
```

---

## 🎯 SAMMANFATTNING

### **Kritiska punkter som ALDRIG får glömmas:**

1. ✅ **org_id finns på ALLA tabeller** - Multi-tenancy är systemets ryggrad
2. ✅ **RLS är aktiverat överallt** - Automatisk dataisolering mellan orgs
3. ✅ **UUID primary keys** - ALDRIG integer IDs
4. ✅ **Triggers genererar kundnummer & fakturanummer** - Gör INTE manuellt
5. ✅ **4-radssystemet** - Pensionat = 2 fakturor (prepayment + afterpayment)
6. ✅ **Frozen prices** - invoice_items kopierar priser vid skapande
7. ✅ **Jordbruksverket** - capacity_m2 + heightcm → rumsberäkning
8. ✅ **3-lagers org_id-system** - Trigger → API → Healing (får EJ ändras!)
9. ✅ **GDPR-compliance** - Samtycken loggas, automatisk 2-års journal retention 🆕
10. ✅ **Supabase @supabase/ssr** - ALDRIG @supabase/auth-helpers-nextjs!
11. ✅ **Hunddagis-fakturering** - Automatisk månadsvis via cron + Edge Function
12. ✅ **Multi-tenant pricing** - Varje org har sina egna priser i daycare_pricing
13. ✅ **Spårbarhet** - Intresseanmälningar har created_dog_id/created_owner_id för konverteringsanalys 🆕
14. ✅ **Analytics** - 5 views för beläggning, intäkter, populära raser, konvertering 🆕
15. ✅ **Backup-verifiering** - Functions för automatisk integritetskontroll 🆕

### **Verifierat i produktion ✅:**

- 38+ triggers aktiva
- 56+ functions deployed (inkl verify_customer_account)
- Alla fakturafunktioner verified (generate_invoice_number, create_prepayment_invoice, create_invoice_on_checkout)
- RLS policies aktiva på 67+ tabeller
- Multi-tenancy fungerar 100%
- Edge Function generate_invoices fixad (0 kr bug löst 2025-12-01)
- Journal retention cron job aktiverad (2025-12-03)
- Analytics views deployade och RLS-säkra (2025-12-03)
- Kundportal-login med verify_customer_account RPC (2025-12-07) 🆕

### **🆕 Förbättringar 7 December 2025:**

1. **Kundportal layout** - Egen layout för /kundportal med kundanpassad header (ingen "Personal"-navbar)
2. **verify_customer_account()** - SECURITY DEFINER RPC för kundlogin-verifiering (bypasser RLS)
3. **Design-standard** - Alla kundportal-sidor följer nu samma design-standard (bg-gray-50, max-w-5xl, border-b headers)
4. **Dashboard förbättrad** - Statistik, snabbknappar, hundlista och bokningslista i ren design
5. **Min profil** - Ny sida `/kundportal/min-profil` för kundprofilhantering (kontaktinfo, kontaktperson 2, samtycken)
6. **Mina hundar** - Komplett hundprofil med alla fält:
   - Bilduppladdning (Supabase Storage: `dog-photos` bucket)
   - Kön (hane/tik)
   - Försäkringsinfo (bolag + nummer)
   - 5 beteende-checkboxar (kastrerad, förstör saker, rumsren, rymningsbenägen, kan vara med andra hundar)
   - Allergier, mediciner, foder, beteendeanteckningar, övriga anteckningar
7. **Ny bokning (4 steg)** - Förbättrat bokningsflöde:
   - Steg 1: Välj pensionat (lista på alla orgs med `enabled_services` som innehåller "boarding")
   - Steg 2: Välj hund
   - Steg 3: Datum & tillvalstjänster (hämtas från valt pensionat)
   - Steg 4: Bekräfta (prisberäkning med pensionatets prislista)
8. **Pattern 3 fix** - `dogs.org_id` utelämnas vid insert för pensionatkunder (NULL i databas)

### **⚠️ VIKTIGT: Spara hundar i kundportalen**

För pensionatkunder (Pattern 3) gäller:

```typescript
// ✅ RÄTT - Inkludera INTE org_id om det är NULL
const insertData: any = { owner_id: user?.id, ...dogData };
if (user?.user_metadata?.org_id) {
  insertData.org_id = user.user_metadata.org_id;
}
// org_id utelämnas helt = NULL i databasen (korrekt för pensionatkunder)

const { error } = await supabase.from("dogs").insert(insertData);
```

```typescript
// ❌ FEL - Skickar user.id som org_id (foreign key constraint fail!)
const org_id = user?.user_metadata?.org_id || user?.id; // ❌ user.id är inte en org!
await supabase.from("dogs").insert({ org_id, owner_id: user.id, ...dogData });
// Error: Key is not present in table "orgs"
```

### **🆕 Förbättringar 3 December 2025:**

1. **Spårbarhet** - `interest_applications` har nu `created_dog_id` och `created_owner_id` för konverteringsanalys
2. **Renare schema** - Redundant `dog_journal.text` kolumn borttagen (använd endast `content`)
3. **GDPR-compliant** - Automatisk 2-års journal retention via cron (körs månadsvis kl 02:00 UTC)
4. **Analytics Dashboard** - 5 nya views:
   - `analytics_daycare_occupancy` - Beläggningsgrad hunddagis
   - `analytics_boarding_occupancy` - Beläggningsgrad hundpensionat
   - `analytics_revenue_by_service` - Intäkter per tjänst
   - `analytics_popular_breeds` - Populäraste hundraser
   - `analytics_conversion_rate` - Konverteringsgrad från intresseanmälan
5. **Backup-verifiering** - 2 nya functions:
   - `verify_database_integrity()` - Kontrollerar kritiska fält och säkerhet
   - `get_table_counts()` - Räknar rader per tabell

### **Migration-filer:**

```bash
# Kör i Supabase SQL Editor:
supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql
supabase/migrations/20251207_customer_login_rpc.sql  # 🆕 verify_customer_account
```

---

**Dokumentation uppdaterad:** 7 December 2025  
**Schema version:** 20251207 (Kundportal-login + verify_customer_account RPC)  
**Verifierad mot:** Live Supabase-databas  
**Next.js version:** 15.5.7 (säkerhetspatch CVE-2025-55182 applicerad)

🎉 **Systemet är robust, avancerat, analytiskt och KLART för produktion!**
