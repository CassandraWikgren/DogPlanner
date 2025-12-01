# 🗄️ Supabase Databasstruktur - DogPlanner

**Uppdaterad:** 1 Dec 2025  
**Version:** Next.js 15.5 + React 19 + Supabase (@supabase/ssr 0.8.0)

---

## 📌 Viktiga punkter

- **Autentisering:** Supabase Auth (INTE Firebase) med `@supabase/ssr`
- **Multi-tenancy:** Alla tabeller har `org_id` för dataisolering
- **RLS (Row Level Security):** Aktiverat på alla tabeller
- **Primary Keys:** Alla tabeller använder UUID
- **Automatik:** Triggers hanterar kundnummer, fakturasummor, org-tilldelning

---

## 🔐 Autentisering

### **auth.users** (Supabase-hanterad)

Supabase sköter autentiseringen automatiskt.

### **profiles** - Användarprofiler

Kopplas automatiskt via trigger när ny användare skapas.

```sql
id                UUID (PK, → auth.users.id)
org_id            UUID (FK → orgs.id) ⚠️ KRITISK
full_name         TEXT
email             TEXT
phone             TEXT
role              TEXT ('admin', 'staff', 'owner')
created_at        TIMESTAMP
```

**Viktiga triggers:**

- `on_auth_user_created` → `handle_new_user()` - Skapar profil + org automatiskt
- `heal_user_missing_org()` - Reparerar användare utan org_id

**Kopplingar:**

- → `dog_journal.created_by` (vem skapade journalanteckning)
- ← `orgs.id` (en profil tillhör en organisation)

---

## 🏢 Organisationer

### **orgs** - Hunddagis/pensionat/frisörer

Huvudtabellen för multi-tenancy. Varje företag får sitt eget `org_id`.

```sql
id                UUID (PK)
name              TEXT - "Stockholms Hunddagis"
org_number        TEXT - Organisationsnummer
email             TEXT
phone             TEXT
address           TEXT
postal_code       TEXT
city              TEXT
bank_account      TEXT
created_at        TIMESTAMP
```

**Används av:** ALLA tabeller via `org_id` foreign key

**Kopplingar:**

- → ALL DATA (owners, dogs, invoices, bookings, rooms etc.)

---

## 👥 Hundägare

### **owners** - Kunder/hundägare

En ägare kan ha flera hundar. Kundnummer är unikt per organisation.

```sql
id                  UUID (PK)
org_id              UUID (FK → orgs.id) ⚠️ VIKTIGT
customer_number     INTEGER (auto-genereras via trigger)
full_name           TEXT
email               TEXT
phone               TEXT
personnummer        TEXT
postal_code         TEXT
city                TEXT
contact_person_2    TEXT - Extra kontakt
contact_phone_2     TEXT
created_at          TIMESTAMP
```

**UNIQUE CONSTRAINT:**

```sql
UNIQUE INDEX owners_org_personnummer_key
ON (org_id, personnummer)
WHERE personnummer IS NOT NULL
```

Detta förhindrar att samma personnummer läggs till två gånger = GDPR-compliant!

**Viktiga triggers:**

- `ensure_unique_customer_number_before_insert` - Genererar kundnummer automatiskt
- `set_owner_org_from_user` - Sätter org_id från inloggad användare

**Kopplingar:**

- → `dogs.owner_id` (en ägare → många hundar)
- → `invoices.owner_id` (en ägare → många fakturor)
- ← `orgs.id` (många ägare → en organisation)

---

## 🐕 Hundar

### **dogs** - Hundprofiler

Kärntabellen för all hunddata (dagis, pensionat, frisör).

```sql
id                  UUID (PK)
org_id              UUID (FK → orgs.id)
owner_id            UUID (FK → owners.id) ⚠️ Koppling till ägare
name                TEXT - "Bella"
breed               TEXT - "Golden Retriever"
birth               DATE
gender              TEXT - 'hane' / 'tik'
heightcm            INTEGER - Mankhöjd (viktigt för priser!)
subscription        TEXT - 'heltid', 'deltid_2', 'deltid_3', 'dagshund'
startdate           DATE - När abonnemang börjar
enddate             DATE - När det slutar (null = tills vidare)
days                TEXT - 'mån,ons,fre' (kommaseparerade dagar)
room_id             UUID (FK → rooms.id)
vaccdhp             DATE - Vaccination DHP (giltig 3 år)
vaccpi              DATE - Vaccination Pi (giltig 1 år)
insurance_company   TEXT
insurance_number    TEXT
photo_url           TEXT - URL till hundbild
waitlist            BOOLEAN - Om hunden är på väntelista
events              JSONB - Flexibel data (allergier, medicin, flaggor etc.)
created_at          TIMESTAMP
```

**events JSONB-struktur:**

```json
{
  "owner_address": "Storgatan 1",
  "gender": "hane",
  "care_notes": "Allergisk mot kyckling",
  "owner_comment": "Ring alltid innan hämtning",
  "food": "Royal Canin Medium Adult 2dl/dag",
  "allergies": "Kyckling",
  "medications": "Inga",
  "special_needs": "Behöver extra motion",
  "behavior_notes": "Lite skraj för barn",
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

- `set_dog_org_from_owner` - Sätter org_id från owner

**Kopplingar:**

- ← `owners.id` (många hundar → en ägare)
- ← `rooms.id` (många hundar → ett rum)
- → `dog_journal` (en hund → många journalanteckningar)
- → `extra_service` (en hund → många tilläggstjänster)
- → `bookings` (en hund → många pensionatsbokningar)
- → `grooming_bookings` (en hund → många frisörbokningar)

---

## 📝 Journaler och anteckningar

### **dog_journal** - Hundjournal

Append-only journal för varje hund. Alla anteckningar sparas i 2 år.

```sql
id                UUID (PK)
dog_id            UUID (FK → dogs.id) ⚠️ Koppling till hund
org_id            UUID (FK → orgs.id)
entry             TEXT - Journaltext
created_by        UUID (FK → profiles.id) - Vem skrev anteckningen
created_at        TIMESTAMP
```

**Användning:**

- Visas i EditDogModal under journalsektionen
- Sorteras nyast först (DESC på created_at)
- Kan inte redigeras efter att de skapats (append-only)

**Kopplingar:**

- ← `dogs.id` (många anteckningar → en hund)
- ← `profiles.id` (många anteckningar → en användare)

---

### **grooming_journal** - Frisörjournal

Liknande dog_journal men specifik för frisörtjänster.

```sql
id                UUID (PK)
dog_id            UUID (FK → dogs.id)
org_id            UUID (FK → orgs.id)
entry             TEXT
service_type      TEXT - 'trimning', 'bad', 'kloklippning'
created_by        UUID (FK → profiles.id)
created_at        TIMESTAMP
```

---

## 🛏️ Hundrum

### **rooms** - Dagis/pensionatsrum

Definierar vilka rum som finns på anläggningen.

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
name              TEXT - "Stora rummet", "Rum A"
room_type         TEXT - 'daycare', 'boarding', 'both'
capacity          INTEGER - Max antal hundar
size_limit        TEXT - 'small', 'medium', 'large', 'all'
created_at        TIMESTAMP
```

**Kopplingar:**

- → `dogs.room_id` (ett rum → många hundar)

---

## 💰 Tilläggstjänster

### **extra_service** - Återkommande tjänster (kloklipp etc.)

Kopplas till hundar för månatliga abonnemang som kloklipp, bad etc.

```sql
id                      UUID (PK)
dog_id                  UUID (FK → dogs.id) ⚠️ Koppling till hund
org_id                  UUID (FK → orgs.id)
service_name            TEXT - "Kloklipp", "Bad"
frequency_per_month     INTEGER - Antal gånger per månad
start_date              DATE
end_date                DATE
price                   NUMERIC
created_at              TIMESTAMP
```

**Användning:**

- Läggs till via EditDogModal under "Tillägg/Extra"
- Kan ha flera per hund (kloklipp + bad + tassklipp)
- Tas automatiskt bort från listan efter end_date

**Kopplingar:**

- ← `dogs.id` (många tjänster → en hund)

---

### **daycare_service_completions** - Utförda dagistjänster

Spårar när tilläggstjänster utförts (avkryssning).

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
dog_id            UUID (FK → dogs.id)
service_name      TEXT
completed_date    DATE
completed_by      UUID (FK → profiles.id)
created_at        TIMESTAMP
```

**Användning:**

- Personal kryssar i när kloklipp/bad utförts
- Visas i dagis-tjänstevy

---

## 📋 Intresseanmälningar

### **interest_applications** - Ansökningar till dagis

Hundägare fyller i formulär på hemsidan → hamnar här.

```sql
id                    UUID (PK)
org_id                UUID (FK → orgs.id)
owner_name            TEXT
owner_email           TEXT
owner_phone           TEXT
owner_city            TEXT
dog_name              TEXT
dog_breed             TEXT
dog_birth             DATE
dog_gender            TEXT
dog_heightcm          INTEGER
desired_subscription  TEXT - 'heltid', 'deltid_2', 'deltid_3'
desired_days          TEXT - 'mån,ons,fre'
status                TEXT - 'pending', 'approved', 'rejected'
notes                 TEXT
created_at            TIMESTAMP
```

**Användning:**

- Visas i väntelistan på hunddagis-sidan
- Admin kan godkänna → skapar dog + owner automatiskt
- Läggs till i dogs-tabellen när godkänd

---

## 🏨 Pensionatsbokningar

### **bookings** - Pensionatsvistelser

Bokning för när hund ska bo över.

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
dog_id            UUID (FK → dogs.id) ⚠️ Koppling till hund
checkin_date      DATE
checkout_date     DATE
status            TEXT - 'pending', 'checked_in', 'checked_out', 'cancelled'
total_price       NUMERIC
notes             TEXT
created_at        TIMESTAMP
```

**Statuscykeln:**

1. `pending` - Bokning skapad, inväntar incheckning
2. `checked_in` - Hunden är incheckad
3. `checked_out` - Hunden är utcheckad (genererar faktura)
4. `cancelled` - Bokning avbokad

**Kopplingar:**

- ← `dogs.id` (många bokningar → en hund)
- → `booking_services` (en bokning → många tilläggstjänster)

---

### **booking_services** - Tilläggstjänster för bokning

Engångsköp under pensionatsvistelse (extra promenader etc.).

```sql
id                UUID (PK)
booking_id        UUID (FK → bookings.id) ⚠️ Koppling till bokning
service_name      TEXT - "Extra promenad", "Bad"
price             NUMERIC
created_at        TIMESTAMP
```

**Kopplingar:**

- ← `bookings.id` (många tjänster → en bokning)

---

### **booking_events** - Bokning changelog

Loggar alla ändringar på bokningar.

```sql
id                UUID (PK)
booking_id        UUID (FK → bookings.id)
event_type        TEXT - 'created', 'checked_in', 'checked_out', 'modified'
event_data        JSONB
created_by        UUID (FK → profiles.id)
created_at        TIMESTAMP
```

---

## ✂️ Hundfrisör

### **grooming_bookings** - Frisörbokningar

Bokningar för trimning, bad, kloklippning.

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
dog_id            UUID (FK → dogs.id)
booking_date      DATE
booking_time      TIME
service_ids       TEXT[] - Array av service-ID:n
total_price       NUMERIC
status            TEXT - 'pending', 'completed', 'cancelled'
notes             TEXT
created_at        TIMESTAMP
```

**Kopplingar:**

- ← `dogs.id` (många bokningar → en hund)
- ← `grooming_services` (många-till-många via service_ids array)

---

### **grooming_services** - Frisörtjänster

Definierar tillgängliga frisörtjänster och priser.

```sql
id                  UUID (PK)
org_id              UUID (FK → orgs.id)
service_name        TEXT - "Trimning stor hund", "Bad liten hund"
price               NUMERIC
duration_minutes    INTEGER
created_at          TIMESTAMP
```

---

## 💳 Fakturering

### **invoices** - Fakturor

Huvud fakturatabellen.

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
owner_id          UUID (FK → owners.id) ⚠️ Koppling till ägare
invoice_number    TEXT - Auto-genereras
invoice_date      DATE
due_date          DATE
total_amount      NUMERIC - Beräknas automatiskt från invoice_items
status            TEXT - 'draft', 'sent', 'paid', 'cancelled'
billed_name       TEXT
billed_email      TEXT
billed_address    TEXT
pdf_url           TEXT - URL till genererad PDF
sent_at           TIMESTAMP
paid_at           TIMESTAMP
created_at        TIMESTAMP
```

**Viktiga triggers:**

- `set_invoice_org_from_owner` - Sätter org_id från owner
- `update_invoice_total` - Uppdaterar total_amount när invoice_items ändras
- `send_invoice_email` - Skickar faktura via SMTP2GO

**Kopplingar:**

- ← `owners.id` (många fakturor → en ägare)
- → `invoice_items` (en faktura → många rader)

---

### **invoice_items** - Fakturarader

Individuella rader på fakturan.

```sql
id                UUID (PK)
invoice_id        UUID (FK → invoices.id) ⚠️ Koppling till faktura
description       TEXT - "Hunddagis heltid oktober 2025"
qty               INTEGER - Antal
unit_price        NUMERIC - Styckpris
amount            NUMERIC - qty × unit_price (auto-beräknas)
created_at        TIMESTAMP
```

**Viktiga triggers:**

- `calculate_invoice_item_amount` - Beräknar amount automatiskt

**Kopplingar:**

- ← `invoices.id` (många rader → en faktura)

---

### **invoice_runs** - Faktureringskörningar

Spårar automatiska faktureringskörningar (cron job).

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
run_date          DATE
invoices_created  INTEGER
total_amount      NUMERIC
status            TEXT - 'completed', 'failed'
error_log         TEXT
created_at        TIMESTAMP
```

---

## 💵 Prissättning

### **daycare_pricing** - Dagis priser

Definierar månadsabonnemangspriser.

```sql
id                  UUID (PK)
org_id              UUID (FK → orgs.id)
subscription_type   TEXT - 'heltid', 'deltid_2', 'deltid_3', 'dagshund'
price               NUMERIC - 3990, 2990, 2490
size_category       TEXT - 'small', 'medium', 'large', 'all'
created_at          TIMESTAMP
```

**Exempel:**

- Heltid stor hund: 3990 kr/mån
- Deltid 2 (alla storlekar): 2990 kr/mån

---

### **boarding_prices** - Pensionat priser

Priser per natt baserat på hundstorlek och säsong.

```sql
id                  UUID (PK)
org_id              UUID (FK → orgs.id)
size_category       TEXT - 'small', 'medium', 'large'
price_per_night     NUMERIC - 350, 450, 550
season_id           UUID (FK → boarding_seasons.id)
created_at          TIMESTAMP
```

**Exempel:**

- Liten hund lågsäsong: 350 kr/natt
- Stor hund högsäsong: 650 kr/natt

**Kopplingar:**

- ← `boarding_seasons.id` (många priser → en säsong)

---

### **boarding_seasons** - Säsonger

Definierar högsäsong, lågsäsong etc.

```sql
id                UUID (PK)
org_id            UUID (FK → orgs.id)
season_name       TEXT - "Högsäsong sommar", "Lågsäsong vinter"
start_date        DATE
end_date          DATE
price_multiplier  NUMERIC - 1.0, 1.3, 1.5
created_at        TIMESTAMP
```

---

## 🔗 Relationskarta

```
auth.users (Supabase Auth)
    ↓
profiles (användare)
    ├── org_id → orgs (organisation)
    │               ├── owners (hundägare)
    │               │   ├── customer_number (auto-gen)
    │               │   ├── personnummer (UNIQUE per org)
    │               │   │
    │               │   ├── dogs (hundar)
    │               │   │   ├── owner_id → owners
    │               │   │   ├── room_id → rooms
    │               │   │   ├── dog_journal (journalanteckningar)
    │               │   │   ├── extra_service (tilläggstjänster)
    │               │   │   ├── bookings (pensionatsbokningar)
    │               │   │   │   └── booking_services
    │               │   │   └── grooming_bookings (frisörbokningar)
    │               │   │
    │               │   └── invoices (fakturor)
    │               │       └── invoice_items (fakturarader)
    │               │
    │               ├── rooms (hundrum)
    │               ├── interest_applications (ansökningar)
    │               ├── daycare_pricing (dagis priser)
    │               ├── boarding_prices (pensionat priser)
    │               │   └── season_id → boarding_seasons
    │               └── grooming_services (frisör priser)
    │
    └── created_by i dog_journal, grooming_journal
```

---

## 🔒 Row Level Security (RLS)

**Alla tabeller har RLS policies som säkerställer:**

1. Användare ser endast data från sin organisation (via `org_id`)
2. Admin har full åtkomst
3. Staff har läs/skriv på hundar, bokningar, journaler
4. Owners har endast läsåtkomst på sina egna hundar

**Exempel RLS policy:**

```sql
CREATE POLICY "Users can only access their org's data"
ON dogs
FOR SELECT
USING (org_id = (
  SELECT org_id FROM profiles WHERE id = auth.uid()
));
```

---

## 🤖 Viktiga Triggers

### **Kundnummer (owners)**

```sql
ensure_unique_customer_number_before_insert()
```

- Genererar unikt kundnummer automatiskt
- Förhindrar race conditions
- Se migration: `20251119_fix_customer_number_race_condition.sql`

### **Organisation (alla tabeller)**

```sql
set_dog_org_from_owner()
set_invoice_org_from_owner()
set_owner_org_from_user()
```

- Sätter automatiskt org_id från relations (owner, user etc.)
- Säkerställer dataisolering

### **Fakturasummor**

```sql
calculate_invoice_item_amount()
update_invoice_total()
```

- Beräknar `invoice_items.amount` = qty × unit_price
- Uppdaterar `invoices.total_amount` = SUM(invoice_items.amount)

### **Användarregistrering**

```sql
on_auth_user_created → handle_new_user()
```

- Skapar automatiskt:
  1. Organisation (om org_name finns i user_metadata)
  2. Profil med org_id
- Se migration: `PERMANENT_FIX_org_assignment.sql`

### **Healing function**

```sql
heal_user_missing_org()
```

- Reparerar användare som saknar org_id
- Anropas från AuthContext om org_id är NULL

---

## 📊 Viktiga migrations att känna till

| Fil                                               | Beskrivning                              |
| ------------------------------------------------- | ---------------------------------------- |
| `20251122160200_remote_schema.sql`                | Senaste fullständiga schema              |
| `PERMANENT_FIX_org_assignment.sql`                | Trippel-redundans för org_id tilldelning |
| `20251119_fix_customer_number_race_condition.sql` | Förhindrar duplicate kundnummer          |
| `20251122_setup_automatic_invoice_cron.sql`       | Automatisk fakturering (cron)            |
| `20251122_add_admin_send_invoice_policy.sql`      | RLS för fakturautskick                   |

---

## 🚀 Så fungerar Supabase i koden

### **Server Components/API Routes**

```typescript
import { createClient } from '@/lib/supabase/server';

// Hämta alla hundar för inloggad användares organisation
const supabase = await createClient();
const { data: dogs } = await supabase
  .from('dogs')
  .select(`
    *,
    owners(id, full_name, customer_number, phone, email),
    rooms(id, name, room_type)
  `)
  .order('name');
```

### **Client Components**

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase
  .from("dogs")
  .select("*")
  .eq("id", dogId)
  .single();
```

### **Realtidsuppdateringar**

```typescript
const channel = supabase
  .channel("dog_changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "dogs" },
    loadDogs
  )
  .subscribe();
```

---

## 💡 Best Practices

1. **Alltid filtrera på org_id** (sköts automatiskt av RLS men bra att veta)
2. **Använd joins** istället för separata queries (`.select('*, owners(*)')`)
3. **Kolla personnummer** innan du skapar owner (se EditDogModal.tsx)
4. **Låt triggers hantera** kundnummer, org_id, summor
5. **Använd type guards** från `types/auth.ts` istället för `as any`

---

**Frågor? Kolla:**

- `types/README.md` - Type system dokumentation
- `.github/copilot-instructions.md` - Systemarkitektur
- `SUPABASE_SSR_MIGRATION.md` - SSR migration guide
