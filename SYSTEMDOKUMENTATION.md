# DogPlanner - Systemdokumentation

**Uppdaterad: 30 oktober 2025**

## 📋 Innehållsförteckning

1. [Översikt](#översikt)
2. [Systemarkitektur](#systemarkitektur)
3. [Email-system](#email-system)
4. [Databas](#databas)
5. [Viktiga filer](#viktiga-filer)
6. [Installation & Setup](#installation--setup)
7. [Användning](#användning)

---

## 🎯 Översikt

DogPlanner är en SaaS-plattform för hunddagis och hundpensionat. Systemet är byggt som en multi-tenant lösning där flera företag kan använda samma plattform men hålla sin data separerad.

### Teknisk Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Next.js API Routes + Supabase
- **Databas**: PostgreSQL via Supabase
- **Styling**: Tailwind CSS + Radix UI
- **Auth**: Supabase Authentication

### Kärnfunktioner

✅ Hunddagis-hantering med aktiva hundar  
✅ Intresseanmälningar från kundportal  
✅ Överföring från ansökan till aktiv hund  
✅ Prissättning baserad på mankhöjd och abonnemangstyp  
✅ Email-konfiguration på två nivåer (system + organisation)  
✅ Organisationsspecifika inställningar

---

## 🏗️ Systemarkitektur

### Multi-Tenant Struktur

Varje organisation (`orgs`) har:

- Egna ägare (`owners`)
- Egna hundar (`dogs`)
- Egna intresseanmälningar (`interest_applications`)
- Egen prissättning (`subscription_types`)
- Egna email-inställningar

Data isoleras via `org_id` kolumn i alla tabeller.

### Autentisering

- Användare registreras via Supabase Auth
- Vid registrering skapas automatiskt en organisation (via trigger)
- Användare kopplas till organisation via `organisation_id`

---

## 📧 Email-system

### Två-Nivåers Arkitektur

#### 1. System-nivå (DogPlanner)

Används för plattforms-kommunikation:

- `info@dogplanner.se` - Primär system-email
- `support@dogplanner.se` - Teknisk support
- `noreply@dogplanner.se` - Automatiska meddelanden

**Används för:**

- Registrering och lösenordsåterställning
- Support-ärenden
- System-notifikationer

#### 2. Organisations-nivå

Varje hunddagis kan konfigurera egna email-adresser för kundkommunikation:

| Kolumn              | Syfte                                  |
| ------------------- | -------------------------------------- |
| `contact_email`     | Allmän kontakt-email                   |
| `invoice_email`     | Email som visas på fakturor            |
| `reply_to_email`    | Reply-To för utgående mail             |
| `email_sender_name` | Avsändarnamn (t.ex. "Bella Hunddagis") |

**Används för:**

- Fakturor till kunder
- Bekräftelsemail
- Påminnelser
- Kundkommunikation

### Implementation

**TypeScript Helper**: `lib/emailConfig.ts`

```typescript
import { getEmailSender } from "@/lib/emailConfig";

// System-email
const systemEmail = getEmailSender("registration");
// { email: 'info@dogplanner.se', name: 'DogPlanner', replyTo: 'info@dogplanner.se' }

// Organisationsspecifik email
const invoiceEmail = await getEmailSender("customer_invoice", orgId);
// { email: 'faktura@belladagis.se', name: 'Bella Hunddagis', replyTo: 'info@belladagis.se' }
```

**Admin-gränssnitt**: `/foretagsinformation`

- Tab 1: Allmänt (namn, org.nr, adress)
- Tab 2: **Email-inställningar** (konfigurera alla 4 email-adresser)
- Tab 3: Fakturering (moms, valuta)
- Tab 4: Länkar (snabblänkar)

### TODO: Email-tjänst Integration

För att faktiskt skicka email behöver en tjänst integreras:

- **Rekommenderat**: [Resend](https://resend.com) (enkelt, modernt API)
- Alternativ: SendGrid, AWS SES

Se `EMAIL_SYSTEM_README.md` för detaljerad implementation.

---

## 💾 Databas

### Huvudtabeller

#### `orgs` - Organisationer

Hunddagis/pensionat som använder systemet.

```sql
- id, name, org_number
- email, phone, address
- contact_email, invoice_email, reply_to_email, email_sender_name
- vat_included, vat_rate, pricing_currency
- slug (för URL: demo.dogplanner.se)
```

#### `owners` - Hundägare

Kunder som har hundar på dagis.

```sql
- id, org_id, full_name, email, phone
- city, address, personnummer
- gdpr_consent, anonymize_at
```

#### `dogs` - Hundar

Aktiva hundar på dagis.

```sql
- id, org_id, owner_id
- name, breed, birth, gender, heightcm
- subscription (heltid/deltid_3/deltid_2/timdagis)
- days, startdate
- insurance_company, insurance_number
- is_castrated, is_escape_artist, destroys_things, is_house_trained
- special_needs
```

#### `interest_applications` - Intresseanmälningar

Ansökningar från kundportalen, väntar på godkännande.

```sql
- id, org_id, status (pending/contacted/accepted/declined)
- parent_name, parent_email, parent_phone
- owner_city, owner_address
- dog_name, dog_breed, dog_birth, dog_gender, dog_height_cm
- subscription_type, preferred_start_date, preferred_days
- special_care_needs
- is_neutered, is_escape_artist, destroys_things, not_house_trained
- gdpr_consent, notes
```

**Workflow:**

1. Kund fyller i formulär på kundportal → `status: 'pending'`
2. Admin kontaktar kund → `status: 'contacted'`
3. Admin godkänner → `status: 'accepted'`
4. Admin klickar "Överför till Hunddagis" → Skapar `owner` och `dog`, raderar ansökan

#### `subscription_types` - Prissättning

Priser baserade på mankhöjd och abonnemangstyp.

```sql
- org_id, subscription_type, height_min, height_max, price
```

**Exempel:**
| Typ | Höjd (cm) | Pris (SEK) |
|-----|-----------|-----------|
| heltid | 0-35 | 4500 |
| heltid | 36-50 | 5200 |
| heltid | 51+ | 5900 |
| deltid_3 | 0-35 | 3200 |
| deltid_3 | 36-50 | 3700 |
| deltid_3 | 51+ | 4200 |

Prissättningen är automatisk baserad på `dogs.heightcm` och `dogs.subscription`.

#### `daycare_service_completions` - Dagiståänster

Tjänster som utförs (kloklipp, tassklipp, bad).

```sql
- org_id, dog_id, service_type
- scheduled_date, completed_at, completed_by
- notes
```

#### `system_config` - Systemkonfiguration

DogPlanner-nivå inställningar.

```sql
- config_key, config_value, description
```

**Exempel:**

- `system_email`: info@dogplanner.se
- `support_email`: support@dogplanner.se

### Prissättningslogik

**Beräkning**: `lib/roomCalculator.ts` + `lib/pricing.ts`

1. Hund registreras med `heightcm` och `subscription`
2. System hittar matchande pris i `subscription_types`:
   ```sql
   WHERE org_id = $1
   AND subscription_type = $2
   AND height_min <= $3
   AND height_max >= $3
   ```
3. Pris visas i UI och används för fakturering

**Jordbruksverket-regler** för mankhöjd finns i `lib/roomCalculator.ts`.

---

## 📁 Viktiga filer

### Databas

| Fil                     | Syfte                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `complete_testdata.sql` | **HUVUDFIL** - Komplett setup med triggers, kolumner, tabeller, testdata |
| `supabase/schema.sql`   | Original schema (kan ignoreras)                                          |

**OBS:** Alla andra SQL-filer (direct_testdata, simple_testdata, etc.) är obsoleta och rensas bort.

### Email-system

| Fil                                | Syfte                               |
| ---------------------------------- | ----------------------------------- |
| `lib/emailConfig.ts`               | TypeScript helper för email-routing |
| `app/foretagsinformation/page.tsx` | Admin-UI för email-konfiguration    |
| `EMAIL_SYSTEM_README.md`           | Teknisk dokumentation               |
| `EMAIL_SYSTEM_SUMMARY.md`          | Översikt för användare              |

### Business Logic

| Fil                            | Syfte                                           |
| ------------------------------ | ----------------------------------------------- |
| `lib/roomCalculator.ts`        | Beräkningar för rumsstorlekar (Jordbruksverket) |
| `lib/pricing.ts`               | Prissättning baserat på mankhöjd                |
| `lib/pensionatCalculations.ts` | Pensionat-specifika beräkningar                 |

### Komponenter

| Fil                                          | Syfte                                   |
| -------------------------------------------- | --------------------------------------- |
| `app/hunddagis/page.tsx`                     | Huvudvy för aktiva hundar               |
| `app/hunddagis/intresseanmalningar/page.tsx` | Hantera ansökningar, överför till dagis |
| `app/foretagsinformation/page.tsx`           | Organisationsinställningar              |
| `components/EditDogModal.tsx`                | Redigera hund-modal                     |
| `components/EditOwnerModal.tsx`              | Redigera ägare-modal                    |

### Supabase

| Fil                           | Syfte                   |
| ----------------------------- | ----------------------- |
| `lib/supabase.ts`             | Supabase client helper  |
| `app/layout.tsx`              | App-nivå Supabase setup |
| `app/context/AuthContext.tsx` | Auth context provider   |

---

## 🚀 Installation & Setup

### 1. Klona & Installera

```bash
git clone <repo>
cd dogplanner
npm install
```

### 2. Environment Variables

Skapa `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Databas Setup

1. Gå till Supabase Dashboard → SQL Editor
2. Kopiera innehållet från `complete_testdata.sql`
3. Kör SQL:en
4. Verifiera:
   - ✅ 1 organisation (Bella Hunddagis)
   - ✅ 2 ägare (Anna, Bengt)
   - ✅ 2 hundar (Bella, Max)
   - ✅ 3 intresseanmälningar (Luna, Rex, Charlie)
   - ✅ 6 priser

### 4. Starta Development Server

```bash
npm run dev
```

Öppna http://localhost:3000 (eller 3002 om 3000 är upptagen)

### 5. Första Inloggning

**Viktigt:** Supabase Auth kan kräva email-verifiering. För dev:

1. Supabase Dashboard → Authentication → Settings
2. Inaktivera "Confirm email" temporärt
3. Registrera testanvändare via `/register`

---

## 📱 Användning

### Admin-workflow: Hantera Intresseanmälningar

#### Steg 1: Se ansökningar

Navigera till `/hunddagis/intresseanmalningar`

**Status-badges:**

- 🟡 **Pending** (gul) - Ny ansökan, inte kontaktad
- 🔵 **Contacted** (blå) - Har pratat med kund
- 🟢 **Accepted** (grön) - Godkänd, redo att överföra
- 🔴 **Declined** (röd) - Avslagen

#### Steg 2: Granska detaljer

Klicka på ansökan för att se:

- Föräldrakontakt (namn, email, telefon)
- Hundinfo (namn, ras, ålder, kön, mankhöjd)
- Beteendeinformation (kastrerad, flyktartist, förstör saker, etc.)
- Önskad start och dagar
- Specialbehov

#### Steg 3: Uppdatera status

- Kontaktat kund? → Ändra till "Contacted"
- Godkänt? → Ändra till "Accepted"
- Tackat nej? → Ändra till "Declined"

#### Steg 4: Överför till Hunddagis (endast "Accepted")

1. Klicka grön **"Överför till Hunddagis"** knapp
2. Systemet skapar:
   - En ny `owner` med förälderns info
   - En ny `dog` kopplad till ägaren
   - Automatisk prissättning baserad på mankhöjd
3. Ansökan raderas från listan
4. Hunden dyker upp i `/hunddagis`

**TODO:** Skicka bekräftelse-email till kund (kräver email-tjänst integration)

### Admin-workflow: Konfigurera Email

#### Steg 1: Gå till Företagsinformation

Navigera till `/foretagsinformation`

#### Steg 2: Klicka på "Email-inställningar" tab

Konfigurera:

1. **Avsändarnamn**  
   Exempel: "Bella Hunddagis"

2. **Kontakt-Email**  
   Exempel: kontakt@belladagis.se  
   _Används för allmän kundkommunikation_

3. **Faktura-Email**  
   Exempel: faktura@belladagis.se  
   _Visas på fakturor_

4. **Reply-To Email**  
   Exempel: info@belladagis.se  
   _Kunder svarar hit när de klickar "Svara"_

#### Steg 3: Spara

Systemet använder automatiskt dessa inställningar när email skickas till kunder.

**System-email** (info@dogplanner.se) används fortfarande för:

- Registrering
- Lösenordsåterställning
- Support

---

## 🔧 Tekniska Detaljer

### Next.js Configuration

`next.config.ts`:

- Server-side packages: `pdfkit`, `stream-buffers`, `qrcode`
- Output file tracing för Vercel deployment
- Import aliases: `@`, `@components`, `@lib`, `@context`

### Supabase Client

```typescript
// Server Component
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createServerComponentClient({ cookies });

// Client Component
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createClientComponentClient();
```

### Row Level Security (RLS)

**Development:** RLS är inaktiverad i `complete_testdata.sql` för enklare testning.

**Production:** Implementera RLS policies:

```sql
-- Exempel: Endast se sin egen org's data
CREATE POLICY "Users see own org data" ON dogs
  FOR SELECT USING (org_id = current_org_id());
```

### Triggers (Inaktiverade i Dev)

- `set_org_user` - Auto-assign org_id
- `anonymize_owner` - GDPR-anonymisering
- Kan återaktiveras i produktion

---

## 📋 TODO: Framtida Features

### Högt Prioritet

- [ ] Email-tjänst integration (Resend/SendGrid)
- [ ] Bekräftelsemail vid överföring från ansökan
- [ ] Kalendervy för dagisbokningar
- [ ] Automatisk fakturering

### Medel Prioritet

- [ ] Hundpensionat-modul (parallell till dagis)
- [ ] Frisörbokning
- [ ] Notifikationssystem
- [ ] Ekonomi-översikt

### Låg Priorit

- [ ] Multi-språkstöd (engelska)
- [ ] Mobilapp
- [ ] API för tredjepartsintegrationer

---

## 🐛 Felsökning

### Port 3000 upptagen

```bash
lsof -i :3000
kill -9 <PID>
# eller
npm run dev  # Använder automatiskt 3002
```

### Database saknar kolumner

Kör `complete_testdata.sql` igen - den har IF NOT EXISTS checks.

### RLS blockerar queries

I dev: Inaktivera RLS via SQL:

```sql
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

### Email skickas inte

Email-tjänst är inte konfigurerad än. Se `EMAIL_SYSTEM_README.md` för setup.

---

## 📞 Support

**Teknisk Support:** support@dogplanner.se  
**System-Admin:** info@dogplanner.se

**Dokumentation:**

- Detta dokument: `SYSTEMDOKUMENTATION.md`
- Email-system: `EMAIL_SYSTEM_README.md`
- Snabbstart: `SNABBSTART.md`
- README: `README.md`

---

**Skapad:** 30 oktober 2025  
**Version:** 1.0  
**Författare:** DogPlanner Development Team
