# 🐾 DogPlanner - Komplett Systemdokumentation

**Uppdaterad: 2 november 2025**  
**Version: 2.1**  
**Status: Production-Ready med uppdaterade RLS policies**

> **📌 VIKTIG INFORMATION FÖR NYA UTVECKLARE**  
> Detta är den centrala källan till sanning för DogPlanner-systemet.  
> Läs denna dokumentation noggrant innan du gör ändringar i koden.
>
> **SENASTE UPPDATERINGAR (2025-11-02):**
>
> - ✅ org_subscriptions tabell tillagd (organisationens plan, INTE hundabonnemang)
> - ✅ grooming_bookings & grooming_journal tabeller för frisörfunktionalitet
> - ✅ RLS policies för profiles är NU PRODUKTIONSKLARA (SELECT, INSERT, UPDATE)
> - ✅ API routes använder pure service role för att bypassa RLS korrekt
> - ✅ AuthContext laddar profiler via klient-sidan med korrekta policies
> - ⚠️ VIKTIGT: subscriptions = hundabonnemang, org_subscriptions = organisationens plan

---

## 📋 Innehållsförteckning

1. [🎯 Översikt & Syfte](#-översikt--syfte)
2. [🏗️ Systemarkitektur](#️-systemarkitektur)
3. [📧 Email-System (Två-Nivåers)](#-email-system-två-nivåers)
4. [💾 Databas - Komplett Schema](#-databas---komplett-schema)
5. [📁 Filstruktur & Viktiga Filer](#-filstruktur--viktiga-filer)
6. [🚀 Installation & Setup (Steg-för-Steg)](#-installation--setup-steg-för-steg)
7. [📱 Användning - Admin Workflows](#-användning---admin-workflows)
8. [⚙️ Teknisk Implementation](#️-teknisk-implementation)
9. [🔒 Säkerhet & GDPR](#-säkerhet--gdpr)
10. [🐛 Felsökning & Troubleshooting](#-felsökning--troubleshooting)
11. [📋 TODO & Framtida Features](#-todo--framtida-features)
12. [🤝 Bidra till Projektet](#-bidra-till-projektet)

---

## 🎯 Översikt & Syfte

### Vad är DogPlanner?

DogPlanner är en **SaaS-plattform (Software as a Service)** för hundverksamheter i Sverige. Systemet är specifikt designat för:

- 🏠 **Hunddagis** - daglig hundvård med abonnemang
- 🏨 **Hundpensionat** - övernattningar och längre vistelser
- ✂️ **Hundfrisörer** - bokningar och tjänstehantering

### Vem är systemet för?

**Primära användare:**

- **Hunddagis-ägare** som behöver hantera dagliga bokningar, abonnemang och fakturering
- **Personal** som checkar in/ut hundar och loggar händelser
- **Administratörer** som hanterar ekonomi, priser och rapporter

**Sekundära användare:**

- **Hundägare (kunder)** via kundportal där de ansöker om dagisplats

### Kärnprinciper

1. **Multi-Tenant** - Flera hundverksamheter på samma plattform, data helt separerad
2. **Svensk anpassning** - Jordbruksverkets regler, svenska personnummer, SEK
3. **GDPR-compliant** - Dataskydd, anonymisering, consent tracking
4. **Automatisering** - Minimera manuellt arbete (autofakturering, prisberäkning)
5. **Enkelhet** - Intuitivt gränssnitt, snabb onboarding

### Affärsmodell

**DogPlanner som plattform:**

- info@dogplanner.se hanterar registrering, support, plattformskommunikation
- Varje hunddagis får sitt eget "konto" (organisation) med egen subdomain
- Hunddagis konfigurerar sina egna email-adresser för kundkommunikation
- Exempel: `bella-hunddagis.dogplanner.se` (planerat för framtiden)

---

## 🏗️ Systemarkitektur

---

## 🏗️ Systemarkitektur

### Teknisk Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (CLIENT)                        │
│                                                               │
│  Next.js 15 (App Router) + React 19 + TypeScript            │
│  Tailwind CSS + Radix UI (shadcn/ui komponenter)            │
│  Supabase Client (Real-time subscriptions)                  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (SERVER)                          │
│                                                               │
│  Next.js API Routes (Server Actions & Route Handlers)       │
│  Server Components för initial data fetch                   │
│  PDF Generation (pdfkit + qrcode för fakturor)             │
└─────────────────────────────────────────────────────────────┘
                            ↕ PostgREST API
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE (BACKEND-AS-A-SERVICE)            │
│                                                               │
│  PostgreSQL Database (data storage)                          │
│  Authentication (JWT-baserad med email/password)            │
│  Row Level Security (RLS) - inaktiverad i dev               │
│  Storage (för framtida hundbilder/dokument)                 │
│  Realtime (WebSocket för live-uppdateringar)               │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Arkitektur

Systemet använder **shared database, shared schema** multi-tenancy:

```sql
-- Alla tabeller har org_id som kolumn
CREATE TABLE dogs (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id),  -- <-- Denna kolumn isolerar data
  name text,
  ...
);

-- Queries filtrerar alltid på org_id
SELECT * FROM dogs WHERE org_id = current_user_org_id();
```

**Fördelar:**

- ✅ Enkel databasunderhåll (en schema för alla)
- ✅ Kostnadseffektivt (ingen separat databas per kund)
- ✅ Enkelt att lägga till nya organisationer

**Säkerhet:**

- Användare har `organisation_id` i sin profil
- All data-access filtreras på `org_id`
- RLS policies säkerställer isolering (aktiveras i production)

### Dataflöde - Exempel: Skapa ny hund

```mermaid
User --> Frontend: Fyller i "Lägg till hund" formulär
Frontend --> Supabase Auth: Validerar session token
Supabase Auth --> Frontend: Returnerar user med organisation_id
Frontend --> Supabase DB: INSERT INTO dogs (org_id, name, breed, ...)
Supabase DB --> Triggers: (inaktiverade i dev, men finns för produktion)
Supabase DB --> Frontend: Returnerar skapad hund-objekt
Frontend --> User: Visar bekräftelse + uppdaterad lista
```

### Routing & Sidstruktur (Next.js App Router)

```
app/
├── page.tsx                    → Landing page (publik)
├── layout.tsx                  → Root layout med Supabase client
├── login/page.tsx             → Inloggning
├── register/page.tsx          → Registrering
│
├── dashboard/page.tsx         → Huvudöversikt efter inlogg
│
├── hunddagis/
│   ├── page.tsx              → Lista över aktiva hundar
│   ├── intresseanmalningar/
│   │   └── page.tsx          → Hantera ansökningar (VIKTIGT!)
│   └── kalender/
│       └── page.tsx          → Bokningskalender (TODO)
│
├── hundpensionat/
│   └── page.tsx              → Pensionat-modul (parallell till dagis)
│
├── foretagsinformation/
│   └── page.tsx              → Organisationsinställningar + EMAIL-CONFIG
│
├── ekonomi/
│   └── page.tsx              → Ekonomiöversikt
│
├── faktura/
│   └── page.tsx              → Fakturering
│
├── kundportal/
│   └── page.tsx              → Publik sida för kunder att ansöka
│
└── api/
    ├── generate-pdf/         → Server-side PDF-generering
    └── send-email/           → Email-utskick (TODO)
```

### Tekniska Beroenden

**Core:**

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.3.0",
  "@supabase/auth-helpers-nextjs": "^0.8.0",
  "@supabase/supabase-js": "^2.38.0"
}
```

**UI:**

```json
{
  "tailwindcss": "^3.4.0",
  "@radix-ui/react-*": "olika versioner", // Alert, Dialog, Tabs, etc.
  "lucide-react": "^0.292.0" // Ikoner
}
```

**Server-side:**

```json
{
  "pdfkit": "^0.14.0", // PDF-generering
  "qrcode": "^1.5.3", // QR-koder för Swish
  "stream-buffers": "^3.0.2" // Buffer-hantering
}
```

---

## 📧 Email-System (Två-Nivåers)

---

## 📧 Email-System (Två-Nivåers)

### Arkitektur & Filosofi

DogPlanner använder ett **två-nivåers email-system** för att separera plattforms-kommunikation från kundkommunikation:

```
┌──────────────────────────────────────────────────────────────┐
│              NIVÅ 1: DogPlanner (System-nivå)                │
│                                                                │
│  info@dogplanner.se      → Registrering, plattformsinfo      │
│  support@dogplanner.se   → Teknisk support                    │
│  noreply@dogplanner.se   → Automatiska systemmeddelanden     │
└──────────────────────────────────────────────────────────────┘
                            VS
┌──────────────────────────────────────────────────────────────┐
│      NIVÅ 2: Organisation (Varje hunddagis konfigurerar)     │
│                                                                │
│  kontakt@belladagis.se   → Allmän kundkontakt                │
│  faktura@belladagis.se   → Visas på fakturor                 │
│  info@belladagis.se      → Reply-To för kundmail             │
│  "Bella Hunddagis"       → Avsändarnamn                       │
└──────────────────────────────────────────────────────────────┘
```

### När används vilken nivå?

| Email-typ                      | Nivå         | Email som används                | Syfte                                |
| ------------------------------ | ------------ | -------------------------------- | ------------------------------------ |
| **Användarregistrering**       | System       | info@dogplanner.se               | Ny admin skapar konto på plattformen |
| **Lösenordsåterställning**     | System       | info@dogplanner.se               | Användaren har glömt lösenord        |
| **Support-ärende**             | System       | support@dogplanner.se            | Teknisk hjälp med plattformen        |
| **Systemavisering**            | System       | noreply@dogplanner.se            | Underhåll, uppdateringar             |
| **Faktura till kund**          | Organisation | `invoice_email` från org-config  | Månadsdebitering                     |
| **Bekräftelse (platsansökan)** | Organisation | `contact_email` från org-config  | "Din ansökan mottagen"               |
| **Påminnelse**                 | Organisation | `contact_email` från org-config  | "Glöm inte vaccinera hunden"         |
| **Allmän kundkommunikation**   | Organisation | `reply_to_email` från org-config | Kunden klickar "Svara"               |

### Databas-schema för Email-konfiguration

```sql
-- I tabellen 'orgs' finns följande kolumner:
ALTER TABLE orgs ADD COLUMN email text;              -- Grundemail för organisationen
ALTER TABLE orgs ADD COLUMN contact_email text;      -- För allmän kundkontakt
ALTER TABLE orgs ADD COLUMN invoice_email text;      -- Visas på fakturor
ALTER TABLE orgs ADD COLUMN reply_to_email text;     -- Reply-To header
ALTER TABLE orgs ADD COLUMN email_sender_name text;  -- T.ex. "Bella Hunddagis"
```

**Exempel-data:**

```sql
INSERT INTO orgs (name, email, contact_email, invoice_email, reply_to_email, email_sender_name)
VALUES (
  'Bella Hunddagis',
  'info@belladagis.se',
  'kontakt@belladagis.se',
  'faktura@belladagis.se',
  'info@belladagis.se',
  'Bella Hunddagis'
);
```

### TypeScript Implementation

**Fil:** `lib/emailConfig.ts`

```typescript
// Email-typer som systemet hanterar
export enum EmailType {
  // System-nivå (använder DogPlanner email)
  SYSTEM_NOTIFICATION = "system_notification",
  PASSWORD_RESET = "password_reset",
  REGISTRATION = "registration",
  SUPPORT_TICKET = "support_ticket",

  // Organisations-nivå (använder hunddagis egen email)
  CUSTOMER_INVOICE = "customer_invoice",
  CUSTOMER_CONFIRMATION = "customer_confirmation",
  CUSTOMER_REMINDER = "customer_reminder",
}

// Hämta rätt avsändare baserat på email-typ
export async function getEmailSender(
  emailType: EmailType,
  orgId?: string
): Promise<{ email: string; name: string; replyTo: string }> {
  // System-nivå email
  if (
    [
      EmailType.REGISTRATION,
      EmailType.PASSWORD_RESET,
      EmailType.SUPPORT_TICKET,
    ].includes(emailType)
  ) {
    return {
      email: "info@dogplanner.se",
      name: "DogPlanner",
      replyTo: "info@dogplanner.se",
    };
  }

  // Organisations-nivå email
  if (!orgId) throw new Error("orgId krävs för organisationsspecifika email");

  const orgConfig = await getOrgEmailConfig(orgId);

  switch (emailType) {
    case EmailType.CUSTOMER_INVOICE:
      return {
        email: orgConfig.invoice_email || orgConfig.email,
        name: orgConfig.email_sender_name || orgConfig.name,
        replyTo: orgConfig.reply_to_email || orgConfig.email,
      };

    case EmailType.CUSTOMER_CONFIRMATION:
    case EmailType.CUSTOMER_REMINDER:
      return {
        email: orgConfig.contact_email || orgConfig.email,
        name: orgConfig.email_sender_name || orgConfig.name,
        replyTo: orgConfig.reply_to_email || orgConfig.email,
      };

    default:
      throw new Error(`Okänd email-typ: ${emailType}`);
  }
}

// Hämta organisationens email-konfiguration från databasen
async function getOrgEmailConfig(orgId: string) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("orgs")
    .select(
      "name, email, contact_email, invoice_email, reply_to_email, email_sender_name"
    )
    .eq("id", orgId)
    .single();

  if (error) throw error;
  return data;
}
```

### Admin-gränssnitt för Email-konfiguration

**Fil:** `app/foretagsinformation/page.tsx`

Administratören kan konfigurera email-inställningar via UI:

**Tab: "Email-inställningar"**

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">Allmänt</TabsTrigger>
    <TabsTrigger value="email">Email-inställningar</TabsTrigger>{" "}
    {/* <-- VIKTIGT! */}
    <TabsTrigger value="billing">Fakturering</TabsTrigger>
    <TabsTrigger value="links">Länkar</TabsTrigger>
  </TabsList>

  <TabsContent value="email">
    <Card>
      <CardHeader>
        <CardTitle>Email-konfiguration</CardTitle>
        <CardDescription>
          Konfigurera de email-adresser som dina kunder ser. System-email
          (info@dogplanner.se) används för registrering och support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email_sender_name">Avsändarnamn</Label>
          <Input
            id="email_sender_name"
            placeholder="T.ex. Bella Hunddagis"
            value={orgSettings.email_sender_name || ""}
            onChange={(e) =>
              setOrgSettings({
                ...orgSettings,
                email_sender_name: e.target.value,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Namnet som visas när du skickar email till kunder
          </p>
        </div>

        <div>
          <Label htmlFor="contact_email">Kontakt-Email</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="kontakt@dittdagis.se"
            value={orgSettings.contact_email || ""}
            onChange={(e) =>
              setOrgSettings({ ...orgSettings, contact_email: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Används för allmän kundkommunikation och bekräftelser
          </p>
        </div>

        <div>
          <Label htmlFor="invoice_email">Faktura-Email</Label>
          <Input
            id="invoice_email"
            type="email"
            placeholder="faktura@dittdagis.se"
            value={orgSettings.invoice_email || ""}
            onChange={(e) =>
              setOrgSettings({ ...orgSettings, invoice_email: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Visas på fakturor som avsändare
          </p>
        </div>

        <div>
          <Label htmlFor="reply_to_email">Reply-To Email</Label>
          <Input
            id="reply_to_email"
            type="email"
            placeholder="info@dittdagis.se"
            value={orgSettings.reply_to_email || ""}
            onChange={(e) =>
              setOrgSettings({ ...orgSettings, reply_to_email: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            När kunder klickar "Svara" går mailet hit
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings}>Spara inställningar</Button>
      </CardFooter>
    </Card>
  </TabsContent>
</Tabs>
```

### Hur man använder Email-systemet i kod

**Exempel 1: Skicka faktura (organisations-email)**

```typescript
import { getEmailSender, EmailType } from "@/lib/emailConfig";

async function sendInvoiceEmail(invoiceId: string, orgId: string) {
  // Hämta rätt avsändare
  const sender = await getEmailSender(EmailType.CUSTOMER_INVOICE, orgId);

  // sender = {
  //   email: 'faktura@belladagis.se',
  //   name: 'Bella Hunddagis',
  //   replyTo: 'info@belladagis.se'
  // }

  // Skicka email via email-tjänst (Resend/SendGrid)
  await emailService.send({
    from: `${sender.name} <${sender.email}>`,
    to: customer.email,
    replyTo: sender.replyTo,
    subject: "Din faktura från Bella Hunddagis",
    html: generateInvoiceHTML(invoiceId),
  });
}
```

**Exempel 2: Skicka registreringsmail (system-email)**

```typescript
async function sendWelcomeEmail(userEmail: string) {
  const sender = await getEmailSender(EmailType.REGISTRATION);

  // sender = {
  //   email: 'info@dogplanner.se',
  //   name: 'DogPlanner',
  //   replyTo: 'info@dogplanner.se'
  // }

  await emailService.send({
    from: `${sender.name} <${sender.email}>`,
    to: userEmail,
    subject: "Välkommen till DogPlanner!",
    html: welcomeEmailTemplate(),
  });
}
```

### Email-tjänst Integration (TODO)

**Status:** Email-routing är implementerat, men ingen faktisk email-tjänst är konfigurerad än.

**Rekommendation: Resend**

1. **Skapa konto på Resend.com**
2. **Verifiera domains:**
   - `dogplanner.se` (för system-email)
   - `belladagis.se` (för varje hunddagis som ansluter)
3. **Lägg till API-key i `.env.local`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Installera package:**
   ```bash
   npm install resend
   ```
5. **Skapa email-service:**

   ```typescript
   // lib/emailService.ts
   import { Resend } from "resend";

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function sendEmail({ from, to, subject, html, replyTo }) {
     const { data, error } = await resend.emails.send({
       from,
       to,
       subject,
       html,
       reply_to: replyTo,
     });

     if (error) throw error;
     return data;
   }
   ```

**Alternativ:**

- **SendGrid** - Gammal, pålitlig, mer komplicerad setup
- **AWS SES** - Billigast, kräver AWS-kunskap
- **Postmark** - Bra för transaktionella mail

---

## 💾 Databas - Komplett Schema

---

## 💾 Databas - Komplett Schema

### Översikt

DogPlanner använder **PostgreSQL** via **Supabase**. Databasen har 8 huvudtabeller:

```
system_config (4 rader)
    ↓
orgs (1+ organisationer)
    ↓
    ├─→ owners (hundägare/kunder)
    │     ↓
    │     └─→ dogs (aktiva hundar på dagis)
    │            ↓
    │            └─→ daycare_service_completions (klipp, tass, bad)
    │
    ├─→ interest_applications (ansökningar från kundportal)
    │
    └─→ subscription_types (prissättning per storlek & abonnemang)
```

### 1. system_config - Systemkonfiguration

**Syfte:** DogPlanner-nivå inställningar (inte organisationsspecifika)

**Schema:**

```sql
CREATE TABLE public.system_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Testdata:**
| config_key | config_value | description |
|------------|-------------|-------------|
| system_email | info@dogplanner.se | System-email för plattforms-meddelanden |
| system_email_name | DogPlanner | Avsändarnamn för system-email |
| support_email | support@dogplanner.se | Support-email för teknisk hjälp |
| noreply_email | noreply@dogplanner.se | No-reply email för automatiska meddelanden |

**Användning:**

```typescript
const { data } = await supabase
  .from("system_config")
  .select("config_value")
  .eq("config_key", "system_email")
  .single();
// data.config_value = 'info@dogplanner.se'
```

---

### 2. orgs - Organisationer (Hunddagis/Pensionat)

**Syfte:** Varje hunddagis som använder plattformen

**Schema:**

```sql
CREATE TABLE public.orgs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,                      -- "Bella Hunddagis"
  org_number text,                         -- "556789-1234" (organisationsnummer)

  -- Kontaktinformation
  email text,                              -- info@belladagis.se
  phone text,                              -- "08-123 456 78"
  address text,                            -- "Hundgatan 123, 123 45 Stockholm"

  -- Email-konfiguration (för kundkommunikation)
  contact_email text,                      -- kontakt@belladagis.se
  invoice_email text,                      -- faktura@belladagis.se
  reply_to_email text,                     -- info@belladagis.se
  email_sender_name text,                  -- "Bella Hunddagis"

  -- Faktureringsinställningar
  vat_included boolean DEFAULT true,       -- Inkluderar moms i priser?
  vat_rate numeric DEFAULT 25,             -- 25% svensk moms
  pricing_currency text DEFAULT 'SEK',     -- Valuta

  -- Subdomain (framtida feature)
  slug text UNIQUE,                        -- "bella-hunddagis" → bella-hunddagis.dogplanner.se

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Testdata:**

```sql
INSERT INTO orgs (name, org_number, email, phone, address, contact_email, invoice_email, reply_to_email, email_sender_name, slug, vat_included, vat_rate, pricing_currency)
VALUES (
  'Bella Hunddagis',
  '556789-1234',
  'info@belladagis.se',
  '08-123 456 78',
  'Hundgatan 123, 123 45 Stockholm',
  'kontakt@belladagis.se',
  'faktura@belladagis.se',
  'info@belladagis.se',
  'Bella Hunddagis',
  'demo',
  true,
  25,
  'SEK'
);
```

**Relationer:**

- `owners.org_id` → `orgs.id`
- `dogs.org_id` → `orgs.id`
- `interest_applications.org_id` → `orgs.id`
- `subscription_types.org_id` → `orgs.id`
- `daycare_service_completions.org_id` → `orgs.id`

---

### 3. owners - Hundägare (Kunder)

**Syfte:** Kunder som har hundar på dagis

**Schema:**

```sql
CREATE TABLE public.owners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,

  -- Personuppgifter
  full_name text NOT NULL,                 -- "Anna Andersson"
  personnummer text,                       -- "198001011234" (för GDPR/anonymisering)

  -- Kontakt
  email text NOT NULL,                     -- anna@example.com
  phone text,                              -- "070-111 11 11"

  -- Adress
  city text,                               -- "Stockholm"
  address text,                            -- "Testgatan 1, 123 45 Stockholm"

  -- GDPR
  gdpr_consent boolean DEFAULT false,      -- Har godkänt datainsamling?
  anonymize_at timestamptz,                -- När ska data anonymiseras?

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Testdata:**

```sql
INSERT INTO owners (org_id, full_name, email, phone, city, address, personnummer, gdpr_consent)
SELECT
  id,
  'Anna Andersson',
  'anna@example.com',
  '070-111 11 11',
  'Stockholm',
  'Testgatan 1, 123 45 Stockholm',
  '198001011234',
  true
FROM orgs WHERE slug = 'demo';
```

**GDPR-hantering:**

- `gdpr_consent` måste vara `true` för att lagra personuppgifter
- `anonymize_at` kan sättas automatiskt (t.ex. 2 år efter sista aktivitet)
- Trigger kan automatiskt anonymisera när `anonymize_at` passeras (inaktiverad i dev)

---

### 4. dogs - Hundar (Aktiva på dagis)

**Syfte:** Hundar som har plats på dagis/pensionat

**Schema:**

```sql
CREATE TABLE public.dogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE NOT NULL,

  -- Grundinfo
  name text NOT NULL,                      -- "Bella"
  breed text,                              -- "Golden Retriever"
  birth date,                              -- 2020-05-15
  gender text CHECK (gender IN ('hane', 'tik')),
  heightcm integer,                        -- 55 (mankhöjd i cm - VIKTIGT FÖR PRISSÄTTNING!)

  -- Abonnemang
  subscription text CHECK (subscription IN ('heltid', 'deltid_3', 'deltid_2', 'timdagis')),
  days text,                               -- "måndag,tisdag,onsdag,torsdag,fredag"
  startdate date,                          -- När började hunden på dagis?

  -- Försäkring
  insurance_company text,                  -- "Agria"
  insurance_number text,                   -- "AGR123456"

  -- Beteende & hälsa
  is_castrated boolean DEFAULT false,      -- Kastrerad/steriliserad?
  is_escape_artist boolean DEFAULT false,  -- Flyr hunden?
  destroys_things boolean DEFAULT false,   -- Förstör saker?
  is_house_trained boolean DEFAULT true,   -- Rumsren?
  special_needs text,                      -- "Allergisk mot kyckling"

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Testdata:**

```sql
INSERT INTO dogs (
  org_id, owner_id, name, breed, birth, gender, heightcm,
  subscription, days, startdate,
  insurance_company, insurance_number,
  is_castrated, is_house_trained, special_needs
)
SELECT
  o.org_id, o.id,
  'Bella', 'Golden Retriever', '2020-05-15', 'tik', 55,
  'heltid', 'måndag,tisdag,onsdag,torsdag,fredag', '2024-01-10',
  'Agria', 'AGR123456',
  true, true, 'Allergisk mot kyckling'
FROM owners o
WHERE o.full_name = 'Anna Andersson';
```

**Prissättning:**
Priset för hunden beräknas automatiskt baserat på:

1. `heightcm` (mankhöjd) - t.ex. 55 cm
2. `subscription` - t.ex. 'heltid'
3. Matchas mot `subscription_types` tabell:
   ```sql
   SELECT price FROM subscription_types
   WHERE org_id = $1
   AND subscription_type = 'heltid'
   AND 55 BETWEEN height_min AND height_max;
   -- Result: 5200 SEK (för 36-50 cm span, men här är hunden 55cm)
   ```

**Jordbruksverkets regler:**
Se `lib/roomCalculator.ts` för beräkningar av rumsstorlek baserat på mankhöjd.

---

### 5. interest_applications - Intresseanmälningar

**Syfte:** Ansökningar från kundportalen, väntar på godkännande

**Schema:**

```sql
CREATE TABLE public.interest_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,

  -- Förälder/Ägare
  parent_name text NOT NULL,               -- "Maria Svensson"
  parent_email text NOT NULL,              -- maria.svensson@example.com
  parent_phone text NOT NULL,              -- "0701234567"
  owner_city text,                         -- "Stockholm"
  owner_address text,                      -- "Storgatan 12"

  -- Hund
  dog_name text NOT NULL,                  -- "Luna"
  dog_breed text,                          -- "Golden Retriever"
  dog_birth date,                          -- 2023-03-15
  dog_age integer,                         -- Beräknas från dog_birth (framtida feature)
  dog_gender text CHECK (dog_gender IN ('hane', 'tik')),
  dog_size text CHECK (dog_size IN ('small', 'medium', 'large')),  -- Uppskattning
  dog_height_cm integer,                   -- 55 (exakt mankhöjd om ägaren vet)

  -- Önskemål
  subscription_type text,                  -- "heltid"
  preferred_start_date date,               -- 2025-11-15
  preferred_days text[],                   -- ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  special_needs text,                      -- Fritt textfält
  special_care_needs text,                 -- Specifika omsorgsbehov

  -- Beteende
  is_neutered boolean DEFAULT false,       -- Kastrerad?
  is_escape_artist boolean DEFAULT false,  -- Flyr?
  destroys_things boolean DEFAULT false,   -- Förstör saker?
  not_house_trained boolean DEFAULT false, -- EJ rumsren?
  previous_daycare_experience boolean,     -- Varit på dagis förut?

  -- GDPR
  gdpr_consent boolean DEFAULT false,      -- Måste vara true

  -- Status & workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined')),
  notes text,                              -- Admin-anteckningar

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Status-workflow:**

```
pending      → Ny ansökan, inte kontaktad än
   ↓
contacted    → Admin har pratat med kunden
   ↓
accepted     → Godkänd! Redo att överföra till hunddagis
   ↓
[ÖVERFÖR]    → Skapar owner + dog, raderar ansökan

ALTERNATIVT:
declined     → Avslagen (hunden passar inte, ingen plats, etc.)
```

**Testdata:**

```sql
INSERT INTO interest_applications (
  org_id, parent_name, parent_email, parent_phone, owner_city, owner_address,
  dog_name, dog_breed, dog_birth, dog_gender, dog_height_cm,
  subscription_type, preferred_start_date, preferred_days,
  special_care_needs, is_neutered, gdpr_consent, status, notes
)
SELECT
  id,
  'Maria Svensson', 'maria.svensson@example.com', '0701234567', 'Stockholm', 'Storgatan 12',
  'Luna', 'Golden Retriever', '2023-03-15', 'tik', 55,
  'heltid', '2025-11-15', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'Luna är jättesnäll men blir lite nervös i stora grupper.', true, true,
  'pending', 'Ny ansökan inkom via webbformulär 2025-10-28'
FROM orgs WHERE slug = 'demo';
```

**Överföring till hunddagis:**
Se [Användning - Admin Workflows](#-användning---admin-workflows) för steg-för-steg guide.

---

### 6. subscription_types - Prissättning

**Syfte:** Priser baserade på mankhöjd och abonnemangstyp

**Schema:**

```sql
CREATE TABLE public.subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,

  subscription_type text NOT NULL CHECK (subscription_type IN ('heltid', 'deltid_3', 'deltid_2', 'timdagis')),
  height_min integer NOT NULL DEFAULT 0,   -- 0 cm
  height_max integer NOT NULL DEFAULT 999, -- 35 cm
  price numeric(10,2) NOT NULL,            -- 4500.00 SEK

  is_active boolean DEFAULT true,          -- Kan inaktivera gamla priser

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, subscription_type, height_min, height_max)  -- En organisation kan inte ha dubbla priser
);
```

**Testdata (Bella Hunddagis):**
| subscription_type | height_min | height_max | price |
|-------------------|------------|------------|-------|
| heltid | 0 | 35 | 4500.00 |
| heltid | 36 | 50 | 5200.00 |
| heltid | 51 | 999 | 5900.00 |
| deltid_3 | 0 | 35 | 3200.00 |
| deltid_3 | 36 | 50 | 3700.00 |
| deltid_3 | 51 | 999 | 4200.00 |

**Prisberäkning i kod:**

```typescript
async function calculateDogPrice(
  orgId: string,
  heightcm: number,
  subscription: string
) {
  const { data, error } = await supabase
    .from("subscription_types")
    .select("price")
    .eq("org_id", orgId)
    .eq("subscription_type", subscription)
    .lte("height_min", heightcm)
    .gte("height_max", heightcm)
    .single();

  if (error) throw error;
  return data.price; // 5200.00 för heltid, 55 cm hund
}
```

**SQL insert:**

```sql
INSERT INTO subscription_types (org_id, subscription_type, height_min, height_max, price)
SELECT id, 'heltid', 0, 35, 4500 FROM orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'heltid', 36, 50, 5200 FROM orgs WHERE slug = 'demo'
UNION ALL
SELECT id, 'heltid', 51, 999, 5900 FROM orgs WHERE slug = 'demo';
```

---

### 7. daycare_service_completions - Tjänster

**Syfte:** Tjänster som utförs på hundar (kloklipp, tassklipp, bad)

**Schema:**

```sql
CREATE TABLE public.daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,

  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad')),

  scheduled_date date NOT NULL,            -- 2025-11-15 (planerad)
  completed_at timestamptz,                -- 2025-11-15 10:30:00 (faktisk tid)
  completed_by text,                       -- "Anna" (personalens namn)

  notes text,                              -- "Hunden var nervös"

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Testdata:**

```sql
-- Klart tjänst
INSERT INTO daycare_service_completions (org_id, dog_id, service_type, scheduled_date, completed_at, completed_by)
SELECT d.org_id, d.id, 'kloklipp', '2025-11-15', '2025-11-15 10:30:00', 'Anna'
FROM dogs d WHERE d.name = 'Bella';

-- Planerad tjänst (ej utförd än)
INSERT INTO daycare_service_completions (org_id, dog_id, service_type, scheduled_date)
SELECT d.org_id, d.id, 'tassklipp', '2025-11-20'
FROM dogs d WHERE d.name = 'Max';
```

**UI-integration:**

- Lista planerade tjänster för idag
- Markera som "klar" → sätter `completed_at` och `completed_by`
- Används för fakturering (tilläggstjänster utöver grundavgift)

---

### Databas-relationer (ER-diagram)

```
┌──────────────────┐
│  system_config   │
│  (plattform)     │
└──────────────────┘

┌──────────────────┐
│      orgs        │  ← Huvudtabell
│  (hunddagis)     │
└────────┬─────────┘
         │
         ├─────────────────┐
         │                 │
         ↓                 ↓
┌─────────────────┐  ┌──────────────────────┐
│  subscription_  │  │ interest_applications│
│     types       │  │   (ansökningar)      │
│  (prissättning) │  └──────────────────────┘
└─────────────────┘
         │
         ↓
┌──────────────────┐
│     owners       │
│  (hundägare)     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│      dogs        │
│  (aktiva hundar) │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────┐
│ daycare_service_         │
│    completions           │
│ (klipp, tass, bad)       │
└──────────────────────────┘
```

### SQL-filer

**Huvudfil:** `complete_testdata.sql`

Denna fil gör ALLT:

1. Tar bort triggers och inaktiverar RLS
2. Lägger till saknade kolumner (med IF NOT EXISTS checks)
3. Skapar nya tabeller
4. Rensar befintlig testdata
5. Skapar komplett testdata:
   - 1 organisation (Bella Hunddagis)
   - 2 ägare (Anna, Bengt)
   - 2 hundar (Bella, Max)
   - 3 intresseanmälningar (Luna, Rex, Charlie)
   - 6 priser (heltid + deltid_3 för 3 storleksgrupper)
   - 2 tjänster (klipp)
   - 4 system_config poster
6. Verifierar installationen med SELECT statements

**Kör i Supabase SQL Editor:**

```bash
# Kopiera innehållet från complete_testdata.sql
# Klistra in i Supabase Dashboard → SQL Editor
# Klicka "Run"
```

**Förväntat resultat:**

```
SUCCESS! | orgs_count: 1 | owners_count: 2 | dogs_count: 2 | applications_count: 3 | prices_count: 6 | services_count: 2 | system_config_count: 4
```

---

## 📁 Filstruktur & Viktiga Filer

---

## 📁 Filstruktur & Viktiga Filer

### Projektöversikt

```
dogplanner/
├── app/                           → Next.js App Router (ALLA sidor)
│   ├── layout.tsx                 → Root layout, Supabase client setup
│   ├── page.tsx                   → Landing page (/)
│   │
│   ├── hunddagis/                 → 🐕 HUNDDAGIS-MODUL (huvudfunktion)
│   │   ├── page.tsx               →    Lista aktiva hundar
│   │   ├── intresseanmalningar/   →    **VIKTIGT!** Hantera ansökningar
│   │   │   └── page.tsx           →       Överför från ansökan → aktiv hund
│   │   └── kalender/              →    TODO: Bokningskalender
│   │       └── page.tsx
│   │
│   ├── foretagsinformation/       → ⚙️ ORGANISATIONSINSTÄLLNINGAR
│   │   └── page.tsx               →    Email-config, fakturering, företagsinfo
│   │
│   ├── dashboard/                 → 📊 Huvudöversikt efter inlogg
│   ├── ekonomi/                   → 💰 Ekonomi & rapporter
│   ├── faktura/                   → 📄 Fakturering
│   ├── kundportal/                → 🌐 Publik ansökningssida för kunder
│   │
│   ├── login/ & register/         → 🔐 Autentisering
│   ├── context/                   → React contexts (Auth, etc.)
│   └── api/                       → Server-side API routes
│       ├── generate-pdf/          →    PDF-fakturor
│       └── send-email/            →    TODO: Email-utskick
│
├── components/                    → Återanvändbara React-komponenter
│   ├── DashboardHeader.tsx
│   ├── EditDogModal.tsx           → 🐕 Redigera hund (viktigt!)
│   ├── EditOwnerModal.tsx         → 👤 Redigera ägare
│   ├── Navbar.tsx
│   ├── TrialBanner.tsx
│   └── ui/                        → shadcn/ui komponenter (Button, Dialog, etc.)
│
├── lib/                           → 📚 BUSINESS LOGIC & HELPERS
│   ├── supabase.ts                → Supabase client factory
│   ├── emailConfig.ts             → ⭐ Email-routing (system vs org)
│   ├── roomCalculator.ts          → Jordbruksverkets beräkningar
│   ├── pricing.ts                 → Prisberäkning baserat på mankhöjd
│   ├── pensionatCalculations.ts   → Pensionat-specifika beräkningar
│   └── utils.ts                   → Generella hjälpfunktioner
│
├── types/                         → TypeScript type definitions
│   └── database.types.ts          → Autogenererade Supabase-typer
│
├── public/                        → Statiska filer (bilder, etc.)
│
├── supabase/                      → Supabase-relaterade filer
│   └── schema.sql                 → Original schema (kan ignoreras)
│
├── complete_testdata.sql          → ⭐⭐⭐ HUVUDFIL för databas-setup
│
├── .env.local                     → Environment variables (SKAPAS MANUELLT)
├── next.config.ts                 → Next.js konfiguration
├── tailwind.config.js             → Tailwind CSS konfiguration
├── tsconfig.json                  → TypeScript konfiguration
├── package.json                   → Dependencies
│
└── DOKUMENTATION/
    ├── SYSTEMDOKUMENTATION.md     → ⭐ DENNA FIL - Central dokumentation
    ├── EMAIL_SYSTEM_README.md     → Email-system teknisk guide
    ├── EMAIL_SYSTEM_SUMMARY.md    → Email-system användarguide
    ├── SNABBSTART.md              → Snabbstart för databas
    └── README.md                  → Projektöversikt
```

### Viktiga filer i detalj

#### 🔴 KRITISKA FILER (får ej ändras utan att läsa dokumentation)

| Fil                                          | Syfte                    | Varning                                                               |
| -------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `complete_testdata.sql`                      | Komplett databas-setup   | Ändra endast om du vet vad du gör! Innehåller triggers, RLS, testdata |
| `lib/emailConfig.ts`                         | Email-routing system/org | Ändra ej logiken utan att uppdatera docs                              |
| `app/hunddagis/intresseanmalningar/page.tsx` | Överför ansökan→hund     | Bryt ej `transferToHunddagis()` funktionen                            |
| `lib/supabase.ts`                            | Supabase client          | Ändra ej utan att testa ALLA sidor                                    |
| `next.config.ts`                             | Server packages config   | PDF/QR-kod kräver specifika settings                                  |

#### 🟡 VIKTIGA FILER (testa noggrant efter ändringar)

| Fil                                | Syfte                | Notera                                          |
| ---------------------------------- | -------------------- | ----------------------------------------------- |
| `app/foretagsinformation/page.tsx` | Org-inställningar UI | Email-config tab finns här                      |
| `components/EditDogModal.tsx`      | Redigera hund        | Validering av mankhöjd viktigt för prissättning |
| `lib/pricing.ts`                   | Prisberäkning        | Används vid fakturering                         |
| `lib/roomCalculator.ts`            | Jordbruksverket      | Svenska lagar för hundhållning                  |

#### 🟢 VANLIGA FILER (kan ändras relativt fritt)

| Fil                              | Syfte              |
| -------------------------------- | ------------------ |
| `components/DashboardHeader.tsx` | Header-komponent   |
| `components/Navbar.tsx`          | Navigation         |
| `app/dashboard/page.tsx`         | Dashboard-översikt |
| `app/globals.css`                | Global styling     |

### Borttagn a filer (rensades 30 oktober 2025)

**Obsoleta SQL-filer som tagits bort:**

- `direct-testdata.sql`, `direct_testdata.sql`
- `simple_testdata.sql`
- `setup-testdata.sql`
- `disable_rls_and_add_testdata.sql`
- `hunddagis-tables.sql`
- `hundpensionat-database-extended.sql`
- `pensionat_testdata.sql`
- `kundportal_testdata.sql`
- `super_simple_fix.sql`
- `database-improvements.sql`
- `create-missing-tables.sql`
- `setup-storage.sql`
- `fix_triggers.sql`
- `add_missing_columns.sql`
- `hunddagis_schema_update.sql`

**Anledning:** Allt konsoliderat i `complete_testdata.sql`

**BEHÅLLS:**

- `complete_testdata.sql` - Huvudfil
- `check_*.sql` - Verifieringsfiler
- `analyze-current-database.sql` - Debug
- `verify-database.sql` - Validering
- `create-rooms-table.sql` - Rumsfunktionalitet (framtida)

---

## 🚀 Installation & Setup (Steg-för-Steg)

> **⚠️ VIKTIG INFORMATION**  
> Följ dessa steg i EXAKT denna ordning. Hoppa inte över steg.  
> Om något går fel, se [Felsökning](#-felsökning--troubleshooting).

### Förberedelser

**Vad du behöver:**

- ✅ Node.js 18+ installerat ([nodejs.org](https://nodejs.org))
- ✅ Git installerat
- ✅ Ett Supabase-konto ([supabase.com](https://supabase.com)) - GRATIS
- ✅ En code editor (VS Code rekommenderas)
- ✅ Grundläggande terminal-kunskap

**Tidsåtgång:** ~15 minuter första gången

---

### Steg 1: Klona Repository

```bash
# Klona projektet
git clone https://github.com/CassandraWikgren/DogPlanner.git
cd dogplanner

# Verifiera att du är i rätt mapp
ls  # Ska visa app/, components/, lib/, package.json, etc.
```

---

### Steg 2: Installera Dependencies

```bash
npm install
```

**Vad installeras:**

- Next.js, React, TypeScript
- Supabase client
- Tailwind CSS, Radix UI
- PDF-generering (pdfkit, qrcode)
- ~350MB i `node_modules/`

**Förväntat resultat:**

```
added 1234 packages in 45s
```

**Om fel uppstår:**

```bash
# Rensa cache och försök igen
rm -rf node_modules package-lock.json
npm install
```

---

### Steg 3: Skapa Supabase-projekt

1. **Gå till [supabase.com](https://supabase.com)**
2. **Klicka "Start your project"** (skapa konto om du inte har)
3. **New Project:**
   - **Name:** DogPlanner (eller valfritt namn)
   - **Database Password:** Generera stark lösenord (spara det!)
   - **Region:** North Europe (Stockholm) - närmast Sverige
   - **Pricing Plan:** Free (fullt funktionell för utveckling)
4. **Klicka "Create new project"**
5. **Vänta 2-3 minuter** medan projektet skapas

---

### Steg 4: Hämta Supabase Credentials

1. **I Supabase Dashboard, gå till:**  
   `Settings` (⚙️ ikonen) → `API`

2. **Du behöver 3 värden:**

   **A) Project URL**

   ```
   https://abcdefghijklmnop.supabase.co
   ```

   **B) anon (public) key**

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (LÅNG sträng)
   ```

   **C) service_role key** (secret!)

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (ANNAN lång sträng)
   ```

3. **Kopiera dessa värden** (du behöver dem i nästa steg)

---

### Steg 5: Skapa Environment Variables

1. **Skapa fil `.env.local` i projektets root:**

   ```bash
   touch .env.local
   ```

2. **Öppna filen och klistra in:**

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Ersätt** värdena med dina faktiska credentials från Steg 4

4. **Spara filen**

**⚠️ VIKTIGT:**

- `.env.local` är i `.gitignore` - commita ALDRIG denna fil!
- `service_role` key ger FULL access till databasen - håll hemlig!

---

### Steg 6: Sätt upp Databasen

Detta är det mest kritiska steget!

**Metod A: Via Supabase Dashboard (REKOMMENDERAT)**

1. **Gå till Supabase Dashboard**
2. **Klicka på `SQL Editor`** (⚡ ikonen i sidomenyn)
3. **Klicka `+ New query`**
4. **Öppna `complete_testdata.sql` i din code editor**
5. **Kopiera HELA innehållet** (Ctrl+A, Ctrl+C)
6. **Klistra in i Supabase SQL Editor**
7. **Klicka `Run`** (eller Ctrl+Enter)

**Förväntad output (längst ner i editorn):**

```sql
-- SUCCESS!
-- orgs_count: 1
-- owners_count: 2
-- dogs_count: 2
-- applications_count: 3
-- prices_count: 6
-- services_count: 2
-- system_config_count: 4

-- === ORGANISATION ===
-- Bella Hunddagis | info@belladagis.se | kontakt@belladagis.se | demo

-- === ÄGARE ===
-- Anna Andersson | anna@example.com | Stockholm
-- Bengt Bengtsson | bengt@example.com | Göteborg

-- === HUNDAR ===
-- Bella | Golden Retriever | heltid | Anna Andersson
-- Max | Border Collie | deltid_3 | Bengt Bengtsson

-- === INTRESSEANMÄLNINGAR ===
-- Maria Svensson | Luna | pending
-- Erik Andersson | Rex | contacted
-- Lisa Johansson | Charlie | accepted

-- === PRISER ===
-- heltid | 0 | 35 | 4500
-- heltid | 36 | 50 | 5200
-- heltid | 51 | 999 | 5900
-- deltid_3 | 0 | 35 | 3200
-- deltid_3 | 36 | 50 | 3700
-- deltid_3 | 51 | 999 | 4200
```

**Om du ser detta → Databasen är klar! ✅**

**Om fel uppstår:**

- Se [Felsökning - Databas-fel](#databas-fel)
- Kör `check_current_status.sql` för att se vad som finns

---

### Steg 7: Verifiera Databas-installation

**I Supabase Dashboard:**

1. **Gå till `Table Editor`** (📊 ikonen)
2. **Kontrollera att dessa tabeller finns:**
   - ✅ `orgs` (1 rad: Bella Hunddagis)
   - ✅ `owners` (2 rader: Anna, Bengt)
   - ✅ `dogs` (2 rader: Bella, Max)
   - ✅ `interest_applications` (3 rader: Luna, Rex, Charlie)
   - ✅ `subscription_types` (6 rader: priser)
   - ✅ `daycare_service_completions` (2 rader: tjänster)
   - ✅ `system_config` (4 rader: email-config)

3. **Klicka på `orgs` tabellen:**
   - Ska visa "Bella Hunddagis"
   - Email: info@belladagis.se
   - contact_email: kontakt@belladagis.se
   - invoice_email: faktura@belladagis.se

**Om alla tabeller finns → Fortsätt till Steg 8! ✅**

---

### Steg 8: Inaktivera Email-verifiering (dev-miljö)

**Varför:** Supabase kräver default att användare verifierar sin email. För utveckling är detta opraktiskt.

**Gör så här:**

1. **Supabase Dashboard → `Authentication`** (🔐 ikonen)
2. **Gå till `Providers`** (undermeny)
3. **Klicka på `Email`**
4. **Scrolla ner till "Confirm email"**
5. **Inaktivera checkboxen "Enable email confirmations"**
6. **Klicka `Save`**

**⚠️ VIKTIGT:** Aktivera detta igen i production!

---

### Steg 9: Starta Development Server

```bash
npm run dev
```

**Förväntat resultat:**

```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000

✓ Ready in 3.2s
```

**Om port 3000 är upptagen:**

```
- Local:        http://localhost:3002  ← Använd denna istället
```

---

### Steg 10: Skapa Test-användare

1. **Öppna browser:** `http://localhost:3000`
2. **Klicka på `Registrera`** (eller gå till `/register`)
3. **Fyll i formulär:**
   - Email: `test@example.com`
   - Lösenord: `TestLösenord123!`
   - Bekräfta lösenord: `TestLösenord123!`
4. **Klicka `Skapa konto`**

**Förväntat:**

- Omdirigeras till `/dashboard`
- Ser välkomstmeddelande

**Vid registrering skapas automatiskt:**

- En ny organisation i `orgs` (vid första inloggningen)
- Användare kopplas till organisationen

---

### Steg 11: Verifiera Installation - Testa Funktioner

**Test 1: Hunddagis-översikt**

```
http://localhost:3000/hunddagis
```

- ✅ Ska visa 2 hundar: Bella och Max
- ✅ Varje hund har namn, ras, ägare, abonnemangstyp
- ✅ Kan klicka "Redigera" (öppnar modal)

**Test 2: Intresseanmälningar**

```
http://localhost:3000/hunddagis/intresseanmalningar
```

- ✅ Ska visa 3 ansökningar: Luna, Rex, Charlie
- ✅ Status-badges: 🟡 Pending, 🔵 Contacted, 🟢 Accepted
- ✅ Charlie ska ha grön "Överför till Hunddagis" knapp

**Test 3: Företagsinformation**

```
http://localhost:3000/foretagsinformation
```

- ✅ Ska visa "Bella Hunddagis" (eller din nya org)
- ✅ Tab "Email-inställningar" finns
- ✅ Kan redigera och spara inställningar

**Test 4: Överför ansökan (VIKTIGT!)**

1. Gå till `/hunddagis/intresseanmalningar`
2. Hitta "Charlie" (status: accepted)
3. Klicka grön **"Överför till Hunddagis"** knapp
4. Bekräfta i dialog
5. **Förväntat resultat:**
   - Charlie försvinner från ansökningar
   - Charlie dyker upp i `/hunddagis` som aktiv hund
   - En ny ägare "Lisa Johansson" skapas

**Om alla 4 tester fungerar → Installation KLAR! 🎉**

---

### Steg 12: (Valfritt) Bekanta dig med UI

**Utforska dessa sidor:**

- `/dashboard` - Huvudöversikt
- `/hunddagis` - Aktiva hundar
- `/hunddagis/intresseanmalningar` - Hantera ansökningar
- `/foretagsinformation` - Organisationsinställningar
- `/ekonomi` - Ekonomiöversikt (TODO: inte fullt implementerad)
- `/faktura` - Fakturering (TODO: inte fullt implementerad)

---

## 📱 Användning - Admin Workflows

> **💡 TIPS**  
> Denna sektion visar hur du använder DogPlanner som administratör.  
> Varje workflow är beskriven steg-för-steg med skärmbilder och exempel.

---

### Workflow 1: Hantera Intresseanmälningar (från kundportal)

Detta är kärnan i systemet - att omvandla ansökningar till aktiva hundar.

#### Steg 1.1: Navigera till Intresseanmälningar

**URL:** `http://localhost:3000/hunddagis/intresseanmalningar`

**Vad du ser:**

- Tabell med alla ansökningar
- Status-badges med färgkoder:
  - 🟡 **Pending** (gul/orange) - Ny ansökan, inte kontaktad än
  - 🔵 **Contacted** (blå) - Du har pratat med kunden
  - 🟢 **Accepted** (grön) - Godkänd! Redo att överföra
  - 🔴 **Declined** (röd) - Avslagen

**Kolumner:**
| Kolumn | Innehåll |
|--------|----------|
| Föräldrakontakt | Namn, email, telefon |
| Hund | Namn, ras, ålder |
| Önskad start | Datum kunden vill börja |
| Status | Pending/Contacted/Accepted/Declined |
| Åtgärder | Knappar för att ändra status/överföra |

#### Steg 1.2: Granska ansökan i detalj

**Klicka på en rad** i tabellen för att expandera detaljer:

**Sektion A: Föräldrakontakt**

```
Namn:    Maria Svensson
Email:   maria.svensson@example.com
Telefon: 0701234567
Adress:  Storgatan 12, Stockholm
```

**Sektion B: Hundinfo**

```
Namn:       Luna
Ras:        Golden Retriever
Födelsedag: 2023-03-15 (2 år gammal)
Kön:        Tik
Mankhöjd:   55 cm  ← VIKTIGT för prissättning!
```

**Sektion C: Önskemål**

```
Abonnemang:    Heltid
Önskad start:  2025-11-15
Önskade dagar: Måndag, Tisdag, Onsdag, Torsdag, Fredag
```

**Sektion D: Beteende & Hälsa**

```
✅ Kastrerad/steriliserad
❌ Inte flyktartist
❌ Förstör inte saker
✅ Rumsren
```

**Sektion E: Specialbehov**

```
"Luna är jättesnäll men blir lite nervös i stora grupper."
```

**Sektion F: GDPR**

```
✅ GDPR-samtycke givet (2025-10-28)
```

#### Steg 1.3: Kontakta kunden

1. **Ring eller emaila kunden** (kontaktuppgifter i Sektion A)
2. **Diskutera:**
   - Är hunden lämplig för dagis?
   - Bekräfta önskad startdatum
   - Diskutera specialbehov
   - Informera om priser (baserat på mankhöjd)
3. **Uppdatera status i systemet:**
   - Klicka **"Ändra status"** dropdown
   - Välj **"Contacted"**
   - Status-badge blir blå 🔵

#### Steg 1.4: Godkänn eller avslå

**Om godkänd:**

1. Klicka **"Ändra status"** → **"Accepted"**
2. Status blir grön 🟢
3. Knappen **"Överför till Hunddagis"** dyker upp (grön, stor)

**Om avslagen:**

1. Klicka **"Ändra status"** → **"Declined"**
2. Status blir röd 🔴
3. Ansökan stannar kvar men är markerad som avslagen
4. **(Framtida feature: Skicka avslagsmail)**

#### Steg 1.5: Överför till Hunddagis (VIKTIGT!)

**Endast för ansökningar med status "Accepted" (🟢)**

1. **Klicka på den gröna knappen "Överför till Hunddagis"**

2. **En dialog dyker upp:**

   ```
   ⚠️ Överför ansökan till Hunddagis?

   Detta kommer att:
   • Skapa en ny ägare: Maria Svensson
   • Skapa en ny hund: Luna (Golden Retriever)
   • Automatiskt beräkna pris baserat på mankhöjd (55 cm)
   • Radera ansökan från denna lista

   Är du säker?

   [Avbryt]  [Ja, överför]
   ```

3. **Klicka "Ja, överför"**

4. **Systemet utför följande (automatiskt):**

   **A) Skapar ny ägare i `owners` tabell:**

   ```sql
   INSERT INTO owners (org_id, full_name, email, phone, city, address, gdpr_consent)
   VALUES (
     current_org_id,
     'Maria Svensson',
     'maria.svensson@example.com',
     '0701234567',
     'Stockholm',
     'Storgatan 12',
     true
   );
   ```

   **B) Skapar ny hund i `dogs` tabell:**

   ```sql
   INSERT INTO dogs (
     org_id, owner_id, name, breed, birth, gender, heightcm,
     subscription, days, startdate
   )
   VALUES (
     current_org_id,
     new_owner_id,
     'Luna',
     'Golden Retriever',
     '2023-03-15',
     'tik',
     55,  -- mankhöjd
     'heltid',
     'måndag,tisdag,onsdag,torsdag,fredag',
     '2025-11-15'
   );
   ```

   **C) Beräknar pris:**

   ```sql
   -- Luna: 55 cm, heltid
   -- Matchas mot: heltid, 51-999 cm = 5900 SEK/månad
   SELECT price FROM subscription_types
   WHERE org_id = current_org_id
   AND subscription_type = 'heltid'
   AND 55 BETWEEN height_min AND height_max;
   -- Result: 5900 SEK
   ```

   **D) Raderar ansökan:**

   ```sql
   DELETE FROM interest_applications WHERE id = application_id;
   ```

   **E) TODO: Skickar bekräftelsemail till kunden**

   ```typescript
   // Detta är inte implementerat än!
   await sendEmail({
     to: "maria.svensson@example.com",
     subject: "Välkommen till Bella Hunddagis!",
     body: "Din ansökan för Luna är godkänd...",
   });
   ```

5. **Success-meddelande visas:**

   ```
   ✅ Luna har överförts till hunddagis!
   ```

6. **Verifiera:**
   - Gå till `/hunddagis`
   - Luna ska nu synas i listan över aktiva hundar
   - Ägare: Maria Svensson
   - Pris: 5900 SEK/månad (baserat på 55 cm mankhöjd)

#### Vanliga frågor - Intresseanmälningar

**Q: Vad händer om jag överför av misstag?**  
A: Hunden finns nu i `/hunddagis`. Du kan radera hunden där, men ägaren finns kvar. Ansökan är borta permanent (finns inte i DB längre).

**Q: Kan jag ångra en överföring?**  
A: Nej, inte automatiskt. Du måste manuellt radera hunden från `/hunddagis` och eventuellt ägaren från databasen.

**Q: Hur skickar jag bekräftelsemail?**  
A: Detta är inte implementerat än. Se [TODO](#-todo--framtida-features) för email-integration.

**Q: Vad om kunden ändrar sig efter "Accepted"?**  
A: Ändra status tillbaka till "Pending" eller "Declined" INNAN du klickar "Överför".

---

### Workflow 2: Konfigurera Email-inställningar

Så här sätter du upp organisationens email-adresser för kundkommunikation.

#### Steg 2.1: Navigera till Företagsinformation

**URL:** `http://localhost:3000/foretagsinformation`

**Vad du ser:**

- Tabs längst upp:
  - **Allmänt** - Företagsnamn, org.nr, adress
  - **Email-inställningar** ← DU VILL HIT!
  - **Fakturering** - Moms, valuta
  - **Länkar** - Snabblänkar

#### Steg 2.2: Klicka på "Email-inställningar" tab

**Formulär med 4 fält:**

**1. Avsändarnamn**

```
Input: "Bella Hunddagis"
Beskrivning: Namnet som visas när du skickar email till kunder
```

**Används i:** `From: Bella Hunddagis <faktura@belladagis.se>`

**2. Kontakt-Email**

```
Input: "kontakt@belladagis.se"
Beskrivning: Används för allmän kundkommunikation och bekräftelser
```

**Används för:**

- Bekräftelsemail efter ansökan mottagen
- Påminnelser om vaccination
- Allmän kommunikation

**3. Faktura-Email**

```
Input: "faktura@belladagis.se"
Beskrivning: Visas på fakturor som avsändare
```

**Används för:**

- PDF-fakturor (visas i From-fältet)
- Betalningspåminnelser

**4. Reply-To Email**

```
Input: "info@belladagis.se"
Beskrivning: När kunder klickar "Svara" går mailet hit
```

**Används som:** `Reply-To:` header i alla utgående mail

#### Steg 2.3: Spara inställningar

1. **Fyll i alla 4 fält**
2. **Klicka "Spara inställningar"**
3. **Success-meddelande:** "✅ Inställningar sparade!"
4. **Verifiering:**
   ```sql
   -- I databasen uppdateras:
   UPDATE orgs
   SET contact_email = 'kontakt@belladagis.se',
       invoice_email = 'faktura@belladagis.se',
       reply_to_email = 'info@belladagis.se',
       email_sender_name = 'Bella Hunddagis',
       updated_at = NOW()
   WHERE id = current_org_id;
   ```

#### Steg 2.4: Förstå System vs Organisations-email

**System-email (DogPlanner):**

- ❌ **KAN EJ ändras** av dig
- ✉️ `info@dogplanner.se` - Registrering, plattformsinfo
- ✉️ `support@dogplanner.se` - Teknisk support
- ✉️ `noreply@dogplanner.se` - Automatiska meddelanden

**Används för:**

- Ny användare registrerar sig på DogPlanner
- Glömt lösenord
- Support-ärenden
- Plattformsunderhåll

**Organisations-email (Ditt dagis):**

- ✅ **DU konfigurerar** via `/foretagsinformation`
- ✉️ Dina egna email-adresser (t.ex. @belladagis.se)

**Används för:**

- Fakturor till dina kunder
- Bekräftelser på bokningar
- Kundkommunikation

**Varför denna separation?**

- Kunder ska inte se "info@dogplanner.se" på fakturor
- Kunder ska kontakta DIG, inte DogPlanner-plattformen
- Ger professionell image för ditt företag

---

### Workflow 3: Redigera befintlig hund

#### Steg 3.1: Navigera till Hunddagis

**URL:** `http://localhost:3000/hunddagis`

#### Steg 3.2: Hitta hunden

**Sök/filtrera:**

- Sökfält: Skriv hundnamn, ras eller ägarnamn
- Filter: Välj abonnemangstyp (heltid, deltid, etc.)

#### Steg 3.3: Klicka "Redigera"

Modal öppnas med formulär:

**Sektion A: Grundinfo**

- Namn
- Ras
- Födelsedatum
- Kön (hane/tik)
- Mankhöjd (cm) ← **VIKTIGT! Ändrar du denna ändras priset!**

**Sektion B: Abonnemang**

- Typ (heltid, deltid_3, deltid_2, timdagis)
- Dagar (välj vilka veckodagar)
- Startdatum

**Sektion C: Försäkring**

- Försäkringsbolag (t.ex. "Agria")
- Försäkringsnummer

**Sektion D: Beteende**

- ☐ Kastrerad/steriliserad
- ☐ Flyktartist
- ☐ Förstör saker
- ☐ Rumsren

**Sektion E: Specialbehov**

- Fritext (t.ex. "Allergisk mot kyckling")

#### Steg 3.4: Spara ändringar

1. **Gör dina ändringar**
2. **Klicka "Spara"**
3. **OBS! Om du ändrade mankhöjd:**

   ```
   ⚠️ Mankhöjd ändrad från 55 cm till 48 cm

   Priset kommer att uppdateras:
   Gammalt pris: 5900 SEK/månad (51+ cm)
   Nytt pris: 5200 SEK/månad (36-50 cm)

   Fortsätt?

   [Avbryt]  [Ja, spara]
   ```

4. **Systemet uppdaterar:**
   - Hund-data i `dogs` tabell
   - Priset beräknas om automatiskt
   - Framtida fakturor använder nya priset

---

### Workflow 4: Se och hantera tjänster (klipp, tass, bad)

#### Steg 4.1: Navigera till tjänster

**TODO:** Denna feature är inte fullt implementerad än.

**Planerad URL:** `http://localhost:3000/hunddagis/tjanster`

**Planerad funktionalitet:**

- Lista alla planerade tjänster för idag/denna vecka
- Markera tjänst som "klar" (sätter `completed_at` och `completed_by`)
- Lägg till nya tjänster för hundar
- Används för fakturering (tilläggstjänster utöver grundpris)

---

### Workflow 5: Generera och skicka fakturor

#### Status: ⚠️ Delvis implementerad

**Nuvarande status:**

- PDF-generering fungerar (pdfkit + qrcode)
- Manuell nedladdning fungerar
- Automatisk utskick via email saknas (kräver email-tjänst)

**Se:**

- `app/api/generate-pdf/` för implementation
- `lib/pricing.ts` för prisberäkningar
- [TODO](#-todo--framtida-features) för automatisk fakturering

---

## ⚙️ Teknisk Implementation

> **🔧 För utvecklare**  
> Denna sektion förklarar tekniska detaljer för de som ska utveckla/underhålla systemet.

---

### Next.js Configuration (`next.config.ts`)

**Server-side packages:**

```typescript
serverExternalPackages: ["pdfkit", "stream-buffers", "qrcode"];
```

**Varför?** Dessa packages innehåller native bindings som inte fungerar i Vercel's Edge Runtime. De måste köras server-side.

**Output file tracing:**

```typescript
outputFileTracingIncludes: {
  '/api/generate-pdf': ['./node_modules/pdfkit/**/*']
}
```

**Varför?** Säkerställer att pdfkit-filer inkluderas i Vercel deployment.

**Import aliases:**

```typescript
'@': './''
@components': './components',
'@lib': './lib',
'@context': './app/context'
```

---

### Supabase Client Patterns

**Server Component (kan använda cookies):**

```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.from("dogs").select("*");
  return <div>{/* ... */}</div>;
}
```

**Client Component (browser-only):**

```typescript
"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Component() {
  const supabase = createClientComponentClient();
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    supabase
      .from("dogs")
      .select("*")
      .then(({ data }) => setDogs(data));
  }, []);

  return <div>{/* ... */}</div>;
}
```

**API Route:**

```typescript
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.from("dogs").select("*");
  return Response.json(data);
}
```

---

### Row Level Security (RLS)

**Development Status:** ❌ Inaktiverad i `complete_testdata.sql`

**Varför?** Enklare testning, ingen risk för "access denied" fel.

**Production:** ✅ Måste aktiveras!

**Exempel-policies:**

```sql
-- Aktivera RLS
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Användare ser endast sin egen orgs data
CREATE POLICY "users_see_own_org_dogs" ON dogs
  FOR SELECT
  USING (org_id = (SELECT organisation_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "users_insert_own_org_dogs" ON dogs
  FOR INSERT
  WITH CHECK (org_id = (SELECT organisation_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "users_update_own_org_dogs" ON dogs
  FOR UPDATE
  USING (org_id = (SELECT organisation_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "users_delete_own_org_dogs" ON dogs
  FOR DELETE
  USING (org_id = (SELECT organisation_id FROM auth.users WHERE id = auth.uid()));
```

**OBS!** `auth.users` måste ha kolumn `organisation_id` för att detta ska fungera.

---

### Triggers & Functions (Inaktiverade i Dev)

**Status:** ❌ Droppade i `complete_testdata.sql`

**Varför?** Kan orsaka problem under utveckling (constraint violations, etc.)

**Triggers som finns (men är inaktiverade):**

**1. `set_org_user` - Auto-assign organisation**

```sql
-- Automatiskt sätta org_id på nya rader
CREATE FUNCTION set_org_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.org_id := (SELECT organisation_id FROM auth.users WHERE id = auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_org_user_dogs
  BEFORE INSERT ON dogs
  FOR EACH ROW
  EXECUTE FUNCTION set_org_user();
```

**2. `anonymize_owner` - GDPR-anonymisering**

```sql
-- Anonymisera ägare när anonymize_at passeras
CREATE FUNCTION trigger_anonymize_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anonymize_at IS NOT NULL AND NEW.anonymize_at <= NOW() THEN
    NEW.full_name := 'Anonymiserad';
    NEW.email := 'anonymized@example.com';
    NEW.phone := NULL;
    NEW.address := NULL;
    NEW.personnummer := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_anonymize_owner
  BEFORE UPDATE ON owners
  FOR EACH ROW
  EXECUTE FUNCTION trigger_anonymize_owner();
```

**Återaktivera i production:** Kör dessa SQL-kommandon manuellt när du är redo.

---

### Prissättning - Beräkningslogik

**Fil:** `lib/pricing.ts`

**Algoritm:**

```typescript
async function calculateDogPrice(
  orgId: string,
  heightcm: number,
  subscription: "heltid" | "deltid_3" | "deltid_2" | "timdagis"
): Promise<number> {
  // 1. Hämta matchande pris från subscription_types
  const { data, error } = await supabase
    .from("subscription_types")
    .select("price")
    .eq("org_id", orgId)
    .eq("subscription_type", subscription)
    .lte("height_min", heightcm) // height_min <= heightcm
    .gte("height_max", heightcm) // height_max >= heightcm
    .single();

  if (error)
    throw new Error(`Inget pris hittat för ${subscription}, ${heightcm} cm`);

  return data.price;
}

// Exempel:
// calculateDogPrice(orgId, 55, 'heltid')
// → Matchas mot: heltid, 51-999 cm
// → Returnerar: 5900 SEK
```

**Jordbruksverkets regler:** Se `lib/roomCalculator.ts` för rumsstorlek baserat på mankhöjd.

---

### PDF-generering

**Fil:** `app/api/generate-pdf/route.ts`

**Stack:**

- `pdfkit` - PDF-dokument generering
- `qrcode` - QR-koder för Swish-betalning
- `stream-buffers` - Buffer-hantering

**Flow:**

```typescript
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function POST(request: Request) {
  const { invoiceData } = await request.json();

  // 1. Skapa PDF-dokument
  const doc = new PDFDocument();

  // 2. Lägg till fakturainformation
  doc.fontSize(20).text("FAKTURA", { align: "center" });
  doc.fontSize(12).text(`Fakturanummer: ${invoiceData.invoiceNumber}`);

  // 3. Generera QR-kod för Swish
  const qrCodeData = await QRCode.toDataURL(
    `swish://pay?amount=${invoiceData.amount}&message=${invoiceData.message}`
  );
  const qrBuffer = Buffer.from(qrCodeData.split(",")[1], "base64");
  doc.image(qrBuffer, { width: 150 });

  // 4. Konvertera till buffer
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  doc.end();

  await new Promise((resolve) => doc.on("end", resolve));
  const pdfBuffer = Buffer.concat(chunks);

  // 5. Returnera PDF
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="faktura-${invoiceData.invoiceNumber}.pdf"`,
    },
  });
}
```

---

### Email-integration (TODO)

**Status:** ⚠️ Routing implementerat, faktisk sending saknas

**Vad som finns:**

- ✅ `lib/emailConfig.ts` - getEmailSender() funktion
- ✅ Databas-schema för email-konfiguration
- ✅ Admin-UI för att konfigurera emails

**Vad som saknas:**

- ❌ Faktisk email-tjänst (Resend/SendGrid/SES)
- ❌ sendEmail() implementation
- ❌ Email-templates (HTML)

**Implementation-guide:**

**Steg 1: Välj email-tjänst**

- **Resend** (rekommenderat) - Modernt, enkelt API
- SendGrid - Etablerad, lite mer komplicerad
- AWS SES - Billigast, kräver AWS-kunskap

**Steg 2: Installera package**

```bash
npm install resend
```

**Steg 3: Lägg till API-key**

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Steg 4: Skapa email-service**

```typescript
// lib/emailService.ts
import { Resend } from "resend";
import { getEmailSender, EmailType } from "./emailConfig";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  type,
  orgId,
  to,
  subject,
  html,
}: {
  type: EmailType;
  orgId?: string;
  to: string;
  subject: string;
  html: string;
}) {
  // Hämta rätt avsändare baserat på typ
  const sender = await getEmailSender(type, orgId);

  // Skicka email
  const { data, error } = await resend.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to,
    subject,
    html,
    reply_to: sender.replyTo,
  });

  if (error) throw error;
  return data;
}
```

**Steg 5: Använd i kod**

```typescript
// I app/hunddagis/intresseanmalningar/page.tsx
// Efter överföring till hunddagis:

await sendEmail({
  type: EmailType.CUSTOMER_CONFIRMATION,
  orgId: currentOrgId,
  to: application.parent_email,
  subject: `Välkommen till ${orgName}!`,
  html: `
    <h1>Din ansökan är godkänd!</h1>
    <p>Hej ${application.parent_name},</p>
    <p>${application.dog_name} har nu fått en plats hos oss!</p>
    <p>Startdatum: ${application.preferred_start_date}</p>
  `,
});
```

---

## 🔒 Säkerhet & GDPR

### GDPR-compliance

**Personuppgifter som lagras:**

- Hundägares namn, email, telefon, adress, personnummer
- Hundens information (ej personuppgift, men känslig för ägaren)

**Laglig grund:**

- **Samtycke** (`gdpr_consent` kolumn måste vara `true`)
- **Avtalsuppfyllelse** (hunddagis-tjänst kräver dessa uppgifter)

**Rätt att bli glömd:**

```typescript
// Anonymisera ägare
async function anonymizeOwner(ownerId: string) {
  await supabase
    .from("owners")
    .update({
      full_name: "Anonymiserad",
      email: `anonymized-${ownerId}@example.com`,
      phone: null,
      address: null,
      city: null,
      personnummer: null,
      anonymize_at: new Date().toISOString(),
    })
    .eq("id", ownerId);
}
```

**Automatisk anonymisering:**

- Trigger (`trigger_anonymize_owner`) kan sätta `anonymize_at` automatiskt
- T.ex. 2 år efter sista aktivitet
- Körs vid varje UPDATE på `owners` tabell

**Dataminimering:**

- Samla endast in nödvändig data
- Personnummer är optional (används för GDPR-tracking)

### Säkerhet

**Environment Variables:**

- ❌ **COMMITA ALDRIG** `.env.local`
- ✅ Använd Vercel/Platform environment variables i production

**API Keys:**

- `SUPABASE_SERVICE_ROLE_KEY` ger FULL access - håll hemlig!
- Använd endast server-side (aldrig i client-code)

**RLS Policies:**

- Aktivera i production!
- Förhindrar användare från att se andra organisationers data

**SQL Injection:**

- Supabase client använder prepared statements - skyddat default
- Vid raw SQL: använd parameterized queries

---

## 🐛 Felsökning & Troubleshooting

> **💡 TIPS**  
> Läs hela felbeskrivningen innan du börjar felsöka.  
> Om problemet kvarstår efter dessa steg - kontakta support.

---

### Problem: Port 3000 är upptagen

**Symptom:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Orsak:** En annan process använder port 3000 (ofta en gammal Next.js-server)

**Lösning 1: Hitta och döda processen**

```bash
# Hitta process-ID
lsof -i :3000

# Exempel-output:
# COMMAND   PID USER
# node    12345 din-user

# Döda processen
kill -9 12345

# Försök starta igen
npm run dev
```

**Lösning 2: Använd annan port**

```bash
# Next.js väljer automatiskt nästa lediga port
npm run dev
# → Kommer köra på :3002 om 3000 är upptagen
```

**Lösning 3: Starta om datorn** (drastisk men fungerar alltid!)

---

### Problem: "Cannot connect to Supabase"

**Symptom:**

- Sidan laddar men data visas inte
- Console error: `fetch failed` eller `CORS error`
- `Error: Invalid Supabase URL`

**Orsak 1: Felaktig .env.local**

**Lösning:**

1. Öppna `.env.local`
2. Verifiera att värdena är korrekta:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[din-url].supabase.co  # Måste börja med https://
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Lång sträng
   ```
3. **Starta om dev-server** efter ändringar i `.env.local`:
   ```bash
   # Ctrl+C för att stoppa
   npm run dev  # Starta igen
   ```

**Orsak 2: Supabase-projektet är pausat**

**Lösning:**

1. Gå till [supabase.com](https://supabase.com)
2. Logga in
3. Klicka på ditt projekt
4. Om det står "Paused" - klicka "Unpause"
5. Vänta 1-2 minuter
6. Försök igen

---

### Problem: SQL-fel vid körning av complete_testdata.sql

**Symptom:**

```
ERROR: column "email" of relation "orgs" does not exist
```

**Orsak:** Kolumnen finns inte i tabellen (kanske första gången du kör SQL:en)

**Lösning:**

1. **Kolla vilka tabeller som finns:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Om `orgs` tabell saknas helt:**

   ```sql
   -- Skapa grundtabellen först
   CREATE TABLE IF NOT EXISTS public.orgs (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     name text NOT NULL,
     created_at timestamptz DEFAULT now()
   );
   ```

3. **Kör `complete_testdata.sql` igen**
   - Den har `DO $$ BEGIN ... IF NOT EXISTS ... END $$;` blocks
   - Lägger till saknade kolumner automatiskt

**Symptom:**

```
ERROR: null value in column "parent_name" violates not-null constraint
```

**Orsak:** Gamla kolumner från tidigare version av `interest_applications`

**Lösning:**

```sql
-- Droppa och återskapa tabellen (data förloras!)
DROP TABLE IF EXISTS public.interest_applications CASCADE;

-- Kör complete_testdata.sql igen
-- Den skapar tabellen med rätt schema
```

---

### Problem: "No data" / Tomma tabeller efter SQL

**Symptom:**

- SQL kördes utan fel
- Men inga hundar/ägare visas i UI
- Tabellerna är tomma i Supabase Table Editor

**Orsak:** INSERT-statements kördes inte (oftast för att TRUNCATE failade)

**Lösning:**

1. **Kör i Supabase SQL Editor:**

   ```sql
   -- Verifiera att data finns
   SELECT COUNT(*) as orgs_count FROM orgs;
   SELECT COUNT(*) as owners_count FROM owners;
   SELECT COUNT(*) as dogs_count FROM dogs;
   ```

2. **Om alla visar 0:**

   ```sql
   -- Kör endast INSERT-delen av complete_testdata.sql
   -- Börja från rad ~280 (efter TRUNCATE statements)
   -- Kör till slutet av filen
   ```

3. **Kör verification queries:**
   ```sql
   SELECT name, email FROM orgs;
   SELECT full_name, email FROM owners;
   SELECT name, breed FROM dogs;
   ```

---

### Problem: "RLS policy violation" / "new row violates row-level security"

**Symptom:**

```
Error: new row violates row-level security policy for table "dogs"
```

**Orsak:** Row Level Security (RLS) är aktiverad men policies saknas

**Lösning (Development):**

```sql
-- Inaktivera RLS temporärt
ALTER TABLE dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE interest_applications DISABLE ROW LEVEL SECURITY;
```

**Lösning (Production):**

```sql
-- Skapa policies (se "Teknisk Implementation" för exempel)
CREATE POLICY "users_see_own_org_dogs" ON dogs
  FOR SELECT
  USING (org_id = (SELECT organisation_id FROM auth.users WHERE id = auth.uid()));
```

---

### Problem: Email skickas inte

**Symptom:**

- Klickat "Överför till Hunddagis"
- Inget email mottaget av kunden

**Orsak:** Email-tjänst är inte konfigurerad än

**Status:** ⚠️ Email-routing finns, men faktisk sending saknas

**Lösning:**

1. Detta är en **TODO-feature**
2. Se [Teknisk Implementation - Email-integration](#email-integration-todo)
3. Konfigurera Resend/SendGrid/SES
4. Implementera `sendEmail()` funktion

**Workaround:**

- Ring/SMS kunden manuellt
- Eller skicka email från din egen email-klient

---

### Problem: "Failed to compile" / TypeScript-fel

**Symptom:**

```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**Orsak:** TypeScript type mismatch

**Lösning 1: Regenerera Supabase types**

```bash
# Installera Supabase CLI
npm install -g supabase

# Logga in
supabase login

# Generera types
supabase gen types typescript --project-id [ditt-project-id] > types/database.types.ts
```

**Lösning 2: Ignorera tillfälligt (ej rekommenderat)**

```typescript
// @ts-ignore
const { data } = await supabase...
```

**Lösning 3: Explicit typing**

```typescript
interface Dog {
  id: string;
  name: string;
  breed: string;
  // ... etc
}

const { data } = await supabase.from("dogs").select("*").returns<Dog[]>();
```

---

### Problem: Prisberäkning fel / "Inget pris hittat"

**Symptom:**

```
Error: Inget pris hittat för heltid, 55 cm
```

**Orsak:** `subscription_types` tabell saknar pris för den kombinationen

**Lösning:**

1. **Verifiera priser i databasen:**

   ```sql
   SELECT * FROM subscription_types
   WHERE org_id = '[din-org-id]'
   AND subscription_type = 'heltid'
   ORDER BY height_min;
   ```

2. **Lägg till saknade priser:**

   ```sql
   INSERT INTO subscription_types (org_id, subscription_type, height_min, height_max, price)
   VALUES ('[din-org-id]', 'heltid', 51, 999, 5900);
   ```

3. **Kör complete_testdata.sql igen** (skapar alla 6 priser)

---

### Problem: "Organisation not found" vid inloggning

**Symptom:**

- Kan logga in
- Men ser inget data
- Error i console: `org_id is null`

**Orsak:** Användaren är inte kopplad till en organisation

**Lösning:**

1. **Kolla user i Supabase:**
   - Dashboard → Authentication → Users
   - Klicka på användaren
   - Verifiera att `organisation_id` finns (custom claim)

2. **Om organisation_id saknas:**

   ```sql
   -- Skapa en organisation först
   INSERT INTO orgs (name, email) VALUES ('Mitt Dagis', 'info@mittdagis.se');

   -- Uppdatera användaren (ersätt user-id och org-id)
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"organisation_id": "[org-uuid]"}'::jsonb
   WHERE id = '[user-uuid]';
   ```

3. **Logga ut och in igen**

---

### Problem: Cannot read properties of null (reading 'xxx')

**Symptom:**

```
TypeError: Cannot read properties of null (reading 'name')
```

**Orsak:** Data är inte laddad än (async problem)

**Lösning:**

```typescript
// ❌ FEL
const dogName = dogs[0].name; // dogs kan vara null!

// ✅ RÄTT
const dogName = dogs?.[0]?.name ?? "Okänd";

// ELLER
if (!dogs || dogs.length === 0) {
  return <div>Inga hundar hittades</div>;
}
const dogName = dogs[0].name;
```

---

### Problem: Supabase Auth "Email not confirmed"

**Symptom:**

- Registrerar användare
- Får email om att bekräfta email
- Kan inte logga in förrän email bekräftats

**Orsak:** Supabase's default-inställning kräver email-verifiering

**Lösning (Development):**

1. Supabase Dashboard → Authentication → Settings → Email
2. **Inaktivera** "Enable email confirmations"
3. Spara
4. Registrera ny användare (ingen email-verifiering krävs)

**Lösning (Production):**

- Låt inställningen vara aktiverad
- Konfigurera SMTP-inställningar för att skicka verifieringsmail
- Eller använd Supabase's inbyggda email-tjänst

---

### Problem: Slow queries / Databasen svarar långsamt

**Symptom:**

- Sidor laddar långsamt
- Queries tar >1 sekund

**Orsak:** Saknade index

**Lösning:**

```sql
-- Skapa index på foreign keys
CREATE INDEX IF NOT EXISTS idx_dogs_org_id ON dogs(org_id);
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON owners(org_id);
CREATE INDEX IF NOT EXISTS idx_interest_applications_org_id ON interest_applications(org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_types_org_id ON subscription_types(org_id);

-- Index på sökbara fält
CREATE INDEX IF NOT EXISTS idx_dogs_name ON dogs(name);
CREATE INDEX IF NOT EXISTS idx_owners_full_name ON owners(full_name);
```

---

### Problem: Git commit fails / "Husky pre-commit"

**Symptom:**

```
husky > pre-commit hook failed
```

**Orsak:** Linting/formatting fel

**Lösning 1: Fixa felen**

```bash
npm run lint
npm run format
```

**Lösning 2: Bypass (ej rekommenderat)**

```bash
git commit --no-verify -m "Your message"
```

---

### Problem: Deployment fails på Vercel

**Symptom:**

```
Error: Module not found: Can't resolve 'pdfkit'
```

**Orsak:** Server-side packages inte korrekt konfigurerade

**Lösning:**

1. Verifiera `next.config.ts`:

   ```typescript
   serverExternalPackages: ["pdfkit", "stream-buffers", "qrcode"];
   ```

2. Verifiera environment variables i Vercel:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. Rebuild och deploy

---

### Fortfarande problem?

**Debugging-checklist:**

- [ ] Är dev-server startad? (`npm run dev`)
- [ ] Är `.env.local` korrekt konfigurerad?
- [ ] Har du kört `complete_testdata.sql`?
- [ ] Finns data i Supabase Table Editor?
- [ ] Är RLS inaktiverad (för dev)?
- [ ] Har du startat om dev-server efter env-ändringar?
- [ ] Kolla Browser Console för JavaScript-fel (F12)
- [ ] Kolla Terminal för Server-fel

**Avancerad debugging:**

```typescript
// Lägg till i din kod för att debugga
console.log("Data from Supabase:", data);
console.log("Error from Supabase:", error);
console.log("Current org_id:", orgId);
```

**Kontakta support:**

- Email: support@dogplanner.se
- Bifoga:
  - Felbeskrivning
  - Screenshots av fel
  - Browser Console output
  - Terminal output

---

## 📋 TODO & Framtida Features

### 🔴 Högt Prioritet (kritiskt för produktion)

| Feature                            | Status         | Beskrivning                                   | Estimerad tid |
| ---------------------------------- | -------------- | --------------------------------------------- | ------------- |
| **Email-tjänst integration**       | 🟡 Påbörjad    | Resend/SendGrid för att faktiskt skicka email | 4h            |
| **Bekräftelsemail vid överföring** | ⚪ Ej påbörjad | Automatiskt email när ansökan godkänns        | 2h            |
| **RLS Policies**                   | ⚪ Ej påbörjad | Aktivera säkerhet för produktion              | 3h            |
| **Automatisk fakturering**         | ⚪ Ej påbörjad | Generera och skicka fakturor månadsvis        | 8h            |
| **Kalendervy**                     | ⚪ Ej påbörjad | Bokningskalender för dagis                    | 16h           |

### 🟡 Medel Prioritet (förbättringar)

| Feature                 | Status         | Beskrivning                            | Estimerad tid |
| ----------------------- | -------------- | -------------------------------------- | ------------- |
| **Hundpensionat-modul** | ⚪ Ej påbörjad | Parallell modul för övernattningar     | 24h           |
| **Frisörbokning**       | ⚪ Ej påbörjad | Bokningstid för trim/klippning         | 12h           |
| **Notifikationssystem** | ⚪ Ej påbörjad | Push-notiser för viktiga händelser     | 8h            |
| **Ekonomi-dashboard**   | 🟡 Påbörjad    | Intäkter, kostnader, rapporter         | 16h           |
| **Staff-hantering**     | ⚪ Ej påbörjad | Personal, schemaläggning, behörigheter | 20h           |
| **Mobilapp**            | ⚪ Ej påbörjad | React Native app för iOS/Android       | 80h           |

### 🟢 Låg Prioritet (nice-to-have)

| Feature                  | Status         | Beskrivning                   | Estimerad tid |
| ------------------------ | -------------- | ----------------------------- | ------------- |
| **Multi-språk**          | ⚪ Ej påbörjad | Engelska + fler språk         | 12h           |
| **API för tredjeparter** | ⚪ Ej påbörjad | REST API för integrationer    | 16h           |
| **Export-funktioner**    | ⚪ Ej påbörjad | Exportera data till Excel/CSV | 4h            |
| **Dark mode**            | ⚪ Ej påbörjad | Mörkt tema                    | 6h            |
| **Offline-support**      | ⚪ Ej påbörjad | PWA med offline-capabilities  | 24h           |

### Kom igång med utveckling

**För att bidra:**

1. Forka repot
2. Skapa feature-branch: `git checkout -b feature/kalendervy`
3. Committa ändringar: `git commit -m "Add: Kalendervy för bokningar"`
4. Pusha: `git push origin feature/kalendervy`
5. Skapa Pull Request

**Kodstandarder:**

- TypeScript för all ny kod
- ESLint + Prettier för formattering
- Komponenter i `components/`
- Business logic i `lib/`
- Testa lokalt innan PR

---

## 🤝 Bidra till Projektet

### För Utvecklare

**Setup:**

```bash
git clone https://github.com/CassandraWikgren/DogPlanner.git
cd dogplanner
npm install
# Följ installation-guiden ovan
```

**Branch-strategi:**

- `main` - Production-redo kod
- `dev` - Development branch
- `feature/*` - Nya features
- `fix/*` - Bugfixar

**Commit-meddelanden:**

```
Add: Ny feature
Fix: Buggfix
Update: Uppdatering av befintlig feature
Refactor: Kodförbättring utan funktionsändring
Docs: Dokumentationsändringar
```

### För Designers

**Designsystem:**

- Tailwind CSS classes
- Radix UI components (via shadcn/ui)
- Färgschema: se `tailwind.config.js`

**UI-komponenter:**

- `components/ui/` - Baskomponenter (Button, Dialog, etc.)
- Följ befintlig design-språk
- Testa responsivitet (mobil, tablet, desktop)

### För Testare

**Testningsområden:**

- Registrering & inloggning
- Intresseanmälningar (hela flowet)
- Redigera hundar/ägare
- Email-konfiguration
- Responsivitet

**Rapportera buggar:**

- Öppna issue på GitHub
- Inkludera: steg för att återskapa, förväntat vs faktiskt resultat, screenshots

---

## 📞 Support & Kontakt

**Teknisk Support:**

- Email: support@dogplanner.se
- Responstid: 24-48h (vardagar)

**Försäljning & Demo:**

- Email: info@dogplanner.se

**Dokumentation:**

- **Denna fil:** `SYSTEMDOKUMENTATION.md` - Komplett systemöversikt
- **Email-system:** `EMAIL_SYSTEM_README.md` - Teknisk email-guide
- **Snabbstart:** `SNABBSTART.md` - Quick start för databas
- **README:** `README.md` - Projektöversikt

**Community:**

- GitHub Issues: Buggrapporter & feature requests
- GitHub Discussions: Frågor & diskussioner

---

## 📜 Changelog

### Version 2.0 - 30 Oktober 2025

**Stora förändringar:**

- ✅ Två-nivåers email-system implementerat (DogPlanner + organisation)
- ✅ Komplett databas-setup i `complete_testdata.sql`
- ✅ Intresseanmälningar med överföring till hunddagis
- ✅ Prissättning baserat på mankhöjd
- ✅ Admin-UI för email-konfiguration
- ✅ Komplett dokumentation (detta dokument)

**Rensning:**

- 🗑️ Raderade 18 obsoleta SQL-filer
- 🗑️ Konsoliderade all databas-setup i en fil

**Tekniskt:**

- Next.js 15 + React 19
- Supabase för backend
- TypeScript throughout
- Tailwind + Radix UI

---

**🐕 Tack för att du använder DogPlanner!**

**Skapad:** 30 oktober 2025  
**Version:** 2.0  
**Författare:** Cassandra Wikgren & DogPlanner Development Team  
**Licens:** Proprietary

---

_Detta dokument uppdateras kontinuerligt. Senaste version finns alltid på GitHub._

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
