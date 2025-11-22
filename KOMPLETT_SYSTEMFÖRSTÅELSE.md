# 🐕 DOGPLANNER — KOMPLETT SYSTEMFÖRSTÅELSE

**Skapad:** 2025-11-22  
**Baserad på:** Djupgående analys av hela applikationen från alla perspektiv

---

## 🎯 VAD ÄR DOGPLANNER?

DogPlanner är en **SaaS-plattform** för hundverksamheter (hunddagis, hundpensionat, hundfrisör) som hanterar:

- **Kundhantering** (hundägare + hundar)
- **Bokningar** (dagis, pensionat, frisör)
- **Prissättning** (dynamisk med säsonger, helger, högtider)
- **Fakturering** (automatisk från bokningar)
- **Ekonomi** (rapporter, statistik, betalstatus)

**Två huvudanvändare:**

1. **Företagskund** (hundverksamheten) — hanterar verksamheten
2. **Privatperson** (hundägare) — bokar tjänster för sin hund

---

## 🏗️ SYSTEMARKITEKTUR

### 1. Next.js App Router-struktur

```
app/
├── page.tsx                    → Landing page (B2C hundägare)
├── foretag/page.tsx           → Landing page (B2B företag)
├── register/page.tsx          → Företagsregistrering
├── login/page.tsx             → Företagsinloggning
├── dashboard/page.tsx         → Företags dashboard
│
├── ansokan/                   → Publik ansökan (hundägare)
│   ├── hunddagis/
│   └── pensionat/
│
├── kundportal/                → Hundägares portal
│   ├── login/
│   ├── registrera/
│   ├── dashboard/
│   ├── ny-bokning/
│   ├── mina-bokningar/
│   └── mina-hundar/
│
├── hunddagis/                 → MODUL 1: Dagis
│   ├── page.tsx               → Huvudvy (alla hundar)
│   ├── [id]/page.tsx          → Hundprofil
│   ├── dagens-schema/         → Dagsschema
│   ├── intresseanmalningar/   → Kö/väntlista
│   └── priser/
│
├── hundpensionat/             → MODUL 2: Pensionat
│   ├── page.tsx               → Huvudvy (alla bokningar)
│   ├── [id]/page.tsx          → Bokningsdetaljer
│   ├── nybokning/             → Skapa bokning (admin)
│   ├── kalender/              → Kalendervy
│   ├── schema/                → Schemavy
│   ├── aktiva-gaster/         → Incheckade hundar
│   ├── ansokningar/           → Väntande ansökningar
│   └── tillval/               → Tillvalstjänster
│
├── frisor/                    → MODUL 3: Frisör
│   ├── page.tsx               → Huvudvy (dagens bokningar)
│   ├── [dogId]/page.tsx       → Hundprofil med journal
│   ├── ny-bokning/            → Skapa tidsbokning
│   └── kalender/              → Frisörkalender
│
├── ekonomi/page.tsx           → Ekonomiöversikt
├── faktura/page.tsx           → Fakturahantering
│
├── owners/                    → Kundhantering
│   ├── page.tsx               → Alla kunder
│   └── [id]/page.tsx          → Kundprofil
│
├── rooms/                     → Rumhantering
│   ├── page.tsx               → Alla rum
│   └── overview/              → Rumsöversikt
│
├── admin/                     → Adminverktyg
│   ├── users/
│   ├── abonnemang/
│   ├── faktura/
│   ├── priser/
│   │   ├── dagis/
│   │   ├── pensionat/
│   │   └── frisor/
│   ├── rum/
│   ├── rapporter/
│   └── loggar/
│
└── api/                       → Backend endpoints
    ├── bookings/
    ├── invoices/
    ├── pdf/
    ├── onboarding/
    └── subscription/
```

---

## 👥 ANVÄNDARPERSPEKTIV

### A. FÖRETAGSKUND (HUNDVERKSAMHETEN)

#### Registrering & Onboarding

1. **Landing:** `/foretag` → "Prova gratis"
2. **Registrering:** `/register`
   - Företagsnamn, orgnummer, kontaktuppgifter
   - Län, kommun (för lokal sökning)
   - Tjänstetyper: [hunddagis, pensionat, frisör, rehab]
3. **Auth:** `handle_new_user()` trigger skapar:
   - `orgs` (organisation)
   - `profiles` (användare med role='admin')
   - `org_subscriptions` (3 månaders trial)
4. **Dashboard:** `/dashboard` → Översikt med statistik

#### Arbetsflöde per modul

**🐕 HUNDDAGIS (`/hunddagis`)**

**Syfte:** Hantera dagliga bokningar & abonnemang

**Översikt:**

- Tabell med alla hundar i dagis
- Filter: Abonnemangstyp (heltid/deltid2/deltid3/dagshund)
- Sorterbara kolumner: Namn, ras, ägare, rum, startdatum, dagar
- Checkboxes för visning av kolumner
- Live-statistik: Antal hundar idag, incheckade, waitlist

**Bokningstyper:**

1. **Heltid** — 5 dagar/vecka (mån-fre)
2. **Deltid 2** — 2 dagar/vecka
3. **Deltid 3** — 3 dagar/vecka
4. **Dagshund** — Boka enskilda dagar (ingen fast veckodag)

**Viktiga funktioner:**

- Redigera hundprofil (klicka på hund)
- Visa "Dagens schema" — vilka hundar kommer idag
- Visa "Tjänster" (extra_service) — tillägg som följer med hunden
- Visa "Hundrum" — rumstilldelning
- Visa "Väntlista" — intresseanmälningar
- Export till PDF/Excel

**Prismodell:**

- Månadsabonnemang (faktureras per månad)
- Pris baseras på:
  - Hundstorlek (mankhöjd)
  - Abonnemangstyp (heltid/deltid)
  - Tilläggstjänster (`extra_service`)
- Rabatter: Flerhundsrabatt, kundspecifika rabatter (`owner_discounts`)

**Fakturering:**

- Månadsvis faktura skapas automatiskt
- Inkluderar: Abonnemangskostnad + tilläggstjänster
- Rabatter appliceras

---

**🏠 HUNDPENSIONAT (`/hundpensionat`)**

**Syfte:** Hantera övernattningsbokningar

**Översikt:**

- Tabell med alla bokningar
- Filter: Status (pending/confirmed/checked_in/checked_out/cancelled)
- Snabbfilter: Alla / Idag / Denna vecka / Denna månad
- Live-statistik:
  - Hundar här idag
  - Incheckning idag/imorgon
  - Utcheckning idag/imorgon
  - Väntande bokningar (pending)

**Bokningsflöde (ADMIN):**

1. **Skapa bokning:** `/hundpensionat/nybokning`
   - Välj hund (eller skapa ny)
   - Välj ägare (kopplas automatiskt)
   - Period: Från/till-datum + tider
   - Välj rum (endast lediga rum visas)
   - Tillvalstjänster: Bad, promenad, kloklipp, etc
   - **Beräkna pris:**
     - Grundpris per natt (baserat på hundstorlek)
     - Helgtillägg (fre-sön)
     - Högtidstillägg (röda dagar)
     - Säsongstillägg (sommar, sportlov, etc)
     - Tillvalstjänster (per dag/per gång/fast pris)
     - Rabatter (kundspecifika)
     - Moms (inkl/exkl beroende på org-inställning)
   - Anteckningar: Tillhörigheter, sängplats, journalnoteringar
2. **Status:** `pending` → väntar på godkännande
3. **Godkänn:** Admin godkänner → status blir `confirmed`
   - **TRIGGER:** `trg_create_prepayment_invoice` skapar förskottsfaktura
4. **Incheckning:** Status blir `checked_in` (check-in dag)
5. **Utcheckning:** Status blir `checked_out`
   - **TRIGGER:** `trg_create_invoice_on_checkout` skapar slutfaktura
     - Rad 1: Grundpris (logi)
     - Rad 2: Tillval från `booking_services`
     - Rad 3: Återkommande tillägg från `extra_service`
     - Rad 4: Rabatt

**Bokningsflöde (KUNDPORTAL):**

1. **Hundägare:** `/kundportal/ny-bokning`
   - Välj hund (från sina egna hundar)
   - Välj period
   - Välj tillvalstjänster
   - Se prisberäkning (realtid)
   - Skicka ansökan
2. **Status:** `pending` → väntar på godkännande
3. **Admin godkänner** → Hundägare får notis

**Viktiga vyer:**

- `/hundpensionat/kalender` — Kalendervy med alla bokningar
- `/hundpensionat/schema` — Schemaläggning
- `/hundpensionat/aktiva-gaster` — Alla incheckade hundar just nu
- `/hundpensionat/ansokningar` — Väntande ansökningar från kundportal

**Prisberäkning (`lib/pricing.ts` + `lib/boardingPriceCalculator.ts`):**

```typescript
Grundpris (boarding_prices):
  - Liten hund (<35cm): 1.0x
  - Medium (35-54cm): 1.2x
  - Stor (>55cm): 1.4-1.6x

+ Helgtillägg (boarding_prices.weekend_multiplier)
  - Fredag-söndag: +20-50%

+ Högtidstillägg (special_dates)
  - Röda dagar, event: +50-100%

+ Säsongstillägg (boarding_seasons)
  - Sommar, sportlov, jul: ×1.2-1.5

+ Tillvalstjänster (extra_services):
  - Per dag: Bad (50 kr/dag)
  - Per gång: Promenad (100 kr/gång)
  - Fast pris: Klotrimning (200 kr)

- Rabatter (owner_discounts):
  - Flerhundsrabatt: -10%
  - Långvistelse: -15%
  - Kundspecifik: varierar

= Totalpris exkl moms
+ Moms (25% eller 0% beroende på org)
= Totalpris inkl moms
```

**Fakturering:**

- **Förskottsfaktura** (vid confirmed):
  - Skapas av `trg_create_prepayment_invoice`
  - Förfallodatum: 14 dagar eller 3 dagar före startdatum
  - Innehåller: Rumsbokning + prepayment-tjänster
- **Slutfaktura** (vid utcheckning):
  - Skapas av `trg_create_invoice_on_checkout`
  - Innehåller: Logi + tillval + återkommande tjänster - rabatter

---

**✂️ HUNDFRISÖR (`/frisor`)**

**Syfte:** Hantera tidsb okningar för frisörbehandlingar

**Översikt:**

- **Dagens bokningar** — Lista med alla tidsslots idag
- **Senaste journalposter** — Historik (30 senaste)
- Sökfunktion — Sök hund/ägare för att se behandlingshistorik

**Behandlingstyper:**

- Badning
- Bad + trimning
- Fullständig klippning
- Klotrimning
- Öronrengöring
- Tandrengöring
- Anpassad

**Bokningsflöde:**

1. **Skapa bokning:** `/frisor/ny-bokning`
   - Välj hund (eller extern kund)
   - Välj datum + tid
   - Välj behandlingstyp
   - Ange klipplängd (om relevant)
2. **Status:** `confirmed` (ingen pending-fas, direkt bokad)
3. **Utför behandling:** Markera som `completed`
   - **Skapar journalpost** i `grooming_journal`
   - **Skapar fakturarad** automatiskt
4. **Faktura:** Skapas direkt vid completed

**Viktiga funktioner:**

- `/frisor/[dogId]` — Hundprofil med fullständig behandlingshistorik
- `/frisor/kalender` — Kalendervy för bokningar
- Extern kundhantering (för hundar utanför systemet)

**Prismodell:**

- **Per behandling** — Fast pris per tjänst
- Paketpriser — Kombinerade behandlingar till rabatterat pris
- Storleksjustering — Baserat på hundens mankhöjd

**Fakturering:**

- **Direktfakturering** — Faktura skapas när behandling är klar
- Ingen prepayment, betalas efter utförd tjänst

---

**💰 EKONOMI & FAKTURERING**

**Ekonomiöversikt (`/ekonomi`)**

- Månadsstatistik: Totala intäkter, antal fakturor, snittbelopp
- Andel obetalda fakturor
- Fördelning per tjänstetyp (dagis/pensionat/frisör)
- Filter: Status, datumperiod
- Kundanalyser: Historik, betalningshistorik

**Fakturahantering (`/faktura`)**

- Lista alla fakturor
- Filter: Status (draft/sent/paid/cancelled), månad, kund
- Sorterbara kolumner
- Statushantering:
  - `draft` → grå (utkast, ej skickad)
  - `sent` → blå (skickad till kund)
  - `paid` → grön (betald)
  - `cancelled` → röd (makulerad)
- Åtgärder:
  - Skicka faktura (e-post/PDF)
  - Markera som betald
  - Makulera
  - Ladda ner PDF
  - Skapa betalningspåminnelse

**Fakturastruktur:**

```typescript
invoices:
  - id, org_id, owner_id
  - invoice_number
  - invoice_date, due_date
  - total_amount, paid_amount
  - status
  - billed_name, billed_email, billed_address
  - notes

invoice_items (rader):
  - invoice_id
  - description
  - quantity, unit_price
  - total_amount
  - tax_rate
```

**PDF-generering (`/api/pdf/route.ts`):**

- Hämtar faktura + relations (owner, org, items)
- Genererar PDF med:
  - Organisationens logotyp
  - Företagsinformation
  - Kundinformation (kundnummer)
  - Fakturainfo (nummer, datum, förfallodatum)
  - Fakturarader (tabell)
  - Totalsumma (exkl/inkl moms)
  - QR-kod (Swish/betalning)
  - Betalningsinformation (bankgiro, swish)

---

### B. PRIVATPERSON (HUNDÄGARE)

#### Registrering & Onboarding

1. **Landing:** `/` (B2C) → "Boka hunddagis" eller "Boka pensionat"
2. **Ansökan (publik):**
   - `/ansokan/hunddagis` — Intresseanmälan för dagis
   - `/ansokan/pensionat` — Bokningsförfrågan för pensionat
   - Fyll i: Personuppgifter, hunduppgifter, önskade datum
   - **Skickas till:** Vald organisation → hamnar i `applications` (väntande ansökningar)
3. **Kundportal:**
   - `/kundportal/registrera` — Skapa konto
   - `/kundportal/login` — Logga in

#### Kundportal arbetsflöde

**Dashboard (`/kundportal/dashboard`)**

- Kommande bokningar
- Aktiva hundar
- Senaste fakturor
- Meddelanden från företaget

**Mina hundar (`/kundportal/mina-hundar`)**

- Lista alla hundar
- Lägg till ny hund
- Redigera hundprofil:
  - Namn, ras, födelsedatum
  - Mankhöjd, vikt
  - Vaccinationer
  - Försäkring
  - Allergier, mediciner, specialbehov
  - Beteendenoteringar
  - Matinformation
  - Kastrerad, lös/stall, flyktrisk, destruktiv

**Ny bokning (`/kundportal/ny-bokning`)**

1. **Steg 1:** Välj hund (från sina egna)
2. **Steg 2:** Välj period (från/till-datum)
3. **Steg 3:** Välj tillvalstjänster
4. **Steg 4:** Se prisberäkning (realtid)
   - Grundpris per natt
   - Helgtillägg
   - Högtidstillägg
   - Säsongstillägg
   - Tillvalstjänster
   - Rabatter (om tillämpliga)
   - Totalpris inkl moms
5. **Skicka ansökan** → Status: `pending`
6. **Vänta på godkännande** → Företaget godkänner/avvisar

**Mina bokningar (`/kundportal/mina-bokningar`)**

- Lista alla bokningar (pending/confirmed/completed/cancelled)
- Se bokningsdetaljer
- Avboka (om tillåtet)
- Se faktura
- Ladda ner kvitto

**Mina fakturor (`/kundportal/dashboard`)**

- Lista alla fakturor
- Se status (skickad/betald)
- Ladda ner PDF
- Betala (Swish QR-kod)

---

## 💸 FAKTURERINGSSYSTEMET (DETALJERAT)

### Automatisk fakturering — Triggers

**1. PENSIONAT — Förskottsfaktura**

```sql
Trigger: trg_create_prepayment_invoice
När: Bokning ändras från 'pending' → 'confirmed'
Skapar: Faktura med invoice_type='prepayment'

Innehåll:
  - Rumsbokning (start_date → end_date)
  - Tillvalstjänster med payment_type='prepayment'

Förfallodatum:
  - 14 dagar från nu
  - ELLER 3 dagar före startdatum (det som är tidigast)
```

**2. PENSIONAT — Slutfaktura**

```sql
Trigger: trg_create_invoice_on_checkout
När: Bokning ändras från 'checked_in' → 'checked_out'
Skapar: Faktura med invoice_type='afterpayment'

Fakturarader:
  RAD 1: Grundpris (logi)
    - "Hundpensionat 2025-01-10 - 2025-01-15 (5 nätter)"
    - Quantity: 5
    - Unit_price: base_price / nights
    - Total: base_amount

  RAD 2: Tillval från booking_services
    - För varje bokad tillvalstjänst:
    - "Bad - Utfört 2025-01-12"
    - Quantity: 1
    - Unit_price: service_price
    - Total: service_price

  RAD 3: Återkommande tillägg från extra_service
    - För varje aktiv extra_service under bokningsperioden:
    - "Promenad (daglig) - Extra motion"
    - Quantity: 1
    - Unit_price: service_price
    - Total: service_price

  RAD 4: Rabatt
    - "Rabatt"
    - Quantity: 1
    - Unit_price: -discount_amount
    - Total: -discount_amount

Total: SUM(alla rader) → MAX(0, total) (aldrig negativt)
```

**3. DAGIS — Månadsvis faktura**

```sql
Trigger: Månadsvis cron-jobb (eller manuell generering)
Skapar: Faktura för varje aktiv abonnemang

Innehåll:
  - Abonnemangskostnad (heltid/deltid2/deltid3)
  - Antal dagar närvaro
  - Tilläggstjänster från extra_service
  - Rabatter

Förfallodatum:
  - Sista dagen i månaden + 14 dagar
```

**4. FRISÖR — Direktfaktura**

```sql
Trigger: När behandling markeras som 'completed'
Skapar: Faktura direkt

Innehåll:
  - Behandlingstyp (badning, klippning, etc)
  - Klipplängd (om relevant)
  - Fast pris per behandling

Förfallodatum:
  - Samma dag (förväntas betalas direkt)
```

---

### Fakturaflöde — Steg-för-steg

```
1. BOKNING/TJÄNST UTFÖRS
   ↓
2. TRIGGER/CRON SKAPAR FAKTURA
   - Status: 'draft'
   - Fakturanummer: Auto-genererat
   - Rader: Från bokningar/tjänster
   ↓
3. ADMIN GRANSKAR
   - Kontrollerar belopp
   - Lägger till noteringar
   - Kan justera manuellt
   ↓
4. FAKTURA SKICKAS
   - Status: 'sent'
   - E-post till kund
   - PDF bifogad
   ↓
5. KUND BETALAR
   - Via Swish/bankgiro
   - Referens: Fakturanummer
   ↓
6. ADMIN MARKERAR SOM BETALD
   - Status: 'paid'
   - Paid_date: Dagens datum
   - Paid_amount: Total_amount
   ↓
7. ARKIVERING
   - Faktura sparad i system
   - Export till bokföringssystem (Fortnox/Bokio/Visma)
```

---

## 🔐 SÄKERHET & RLS (ROW LEVEL SECURITY)

### Policies per tabell

**`dogs` — Hundar**

- Admin kan se/redigera alla hundar i sin organisation
- Ägare kan se/redigera sina egna hundar
- RLS: `org_id = current_org_id` OCH (`role = 'admin'` ELLER `owner_id = current_user_id`)

**`bookings` — Bokningar**

- Admin kan se/redigera alla bokningar i sin organisation
- Ägare kan se sina egna bokningar (via dog_id)
- RLS: `org_id = current_org_id` OCH (`role = 'admin'` ELLER `owner_id = current_user_id`)

**`invoices` — Fakturor**

- Admin kan se/redigera alla fakturor i sin organisation
- Ägare kan se sina egna fakturor
- RLS: `org_id = current_org_id` OCH (`role = 'admin'` ELLER `owner_id = current_user_id`)

**`rooms` — Rum**

- Admin kan se/redigera alla rum i sin organisation
- Ägare kan INTE se rum (internt)
- RLS: `org_id = current_org_id` OCH `role = 'admin'`

**`extra_services` — Tillvalstjänster**

- Admin kan se/redigera alla tjänster i sin organisation
- Ägare kan se tillgängliga tjänster (för bokning)
- RLS: `org_id = current_org_id`

---

## 📊 STATISTIK & RAPPORTER

### Live-statistik (per modul)

**Hunddagis:**

- Antal hundar idag
- Antal incheckade
- Väntlista (intresseanmälningar)
- Lediga platser

**Hundpensionat:**

- Hundar här idag
- Incheckning idag/imorgon
- Utcheckning idag/imorgon
- Väntande bokningar (pending)
- Beläggningsgrad (%)

**Frisör:**

- Dagens bokningar
- Slutförda behandlingar idag
- Väntande tidsslots

**Ekonomi:**

- Totala intäkter denna månad
- Antal fakturor (skickade/betalda)
- Obetalda fakturor (totalt/förfallna)
- Genomsnittligt fakturabelopp
- Fördelning per tjänstetyp

### Rapporter (`/admin/rapporter`)

- Månadsrapport (intäkter, bokningar, kunder)
- Årsrapport (trender, tillväxt)
- Kundanalys (mest lönsamma kunder, återkommande)
- Tjänsteanalys (mest bokade tjänster, lönsamhet)
- Beläggningsgrad (per rum, per månad)
- Export till Excel/CSV

---

## 🧩 DATABASSTRUKTUR (FÖRENKLAD)

```
orgs (Organisationer)
  - id, name, org_number, email, phone
  - vat_included, vat_rate
  - logo_url, address, city, postal_code

profiles (Användare)
  - id, org_id, role (admin/staff/owner)
  - email, full_name, phone

owners (Hundägare/kunder)
  - id, org_id, full_name, email, phone
  - customer_number (auto-increment per org)
  - address, city, postal_code
  - gdpr_consent, marketing_consent, photo_consent

dogs (Hundar)
  - id, org_id, owner_id, name, breed
  - heightcm, weightkg, birth_date, gender
  - subscription (heltid/deltid2/deltid3/dagshund)
  - startdate, enddate, days (för dagis)
  - room_id (tilldelat rum)
  - vaccinationer, försäkring
  - allergies, medications, special_needs
  - checked_in, checkin_date, checkout_date

rooms (Rum)
  - id, org_id, name, capacity_m2
  - room_type (daycare/boarding/both)
  - max_dogs, max_height_cm
  - is_active

bookings (Pensionatsbokningar)
  - id, org_id, dog_id, owner_id, room_id
  - start_date, end_date
  - status (pending/confirmed/checked_in/checked_out/cancelled)
  - total_price, discount_amount
  - prepayment_invoice_id, afterpayment_invoice_id

booking_services (Tillval per bokning)
  - id, booking_id, service_id
  - quantity, unit_price, total_price

extra_services (Tillvalstjänster)
  - id, org_id, label, price, unit
  - service_type (boarding/daycare/both)
  - payment_type (prepayment/afterpayment)

extra_service (Återkommande tillägg per hund)
  - id, org_id, dog_id, service_type
  - frequency, price, notes
  - start_date, end_date, is_active

boarding_prices (Grundpriser pensionat)
  - id, org_id, dog_size, base_price
  - weekend_surcharge, weekend_multiplier
  - holiday_multiplier, high_season_multiplier

boarding_seasons (Säsonger)
  - id, org_id, name, start_date, end_date
  - type (high/low/holiday)
  - price_multiplier

special_dates (Specialdatum)
  - id, org_id, date, name
  - category (red_day/holiday/event)
  - price_surcharge

owner_discounts (Kundrabatter)
  - id, org_id, owner_id
  - discount_name, discount_percent

grooming_bookings (Frisörbokningar)
  - id, org_id, dog_id
  - appointment_date, appointment_time
  - service_type, clip_length
  - status (confirmed/completed/cancelled)

grooming_journal (Frisörjournal)
  - id, org_id, dog_id
  - appointment_date, service_type, clip_length
  - notes, staff_notes

invoices (Fakturor)
  - id, org_id, owner_id
  - invoice_number, invoice_date, due_date
  - total_amount, paid_amount
  - status (draft/sent/paid/cancelled)
  - invoice_type (prepayment/afterpayment)
  - billed_name, billed_email, billed_address

invoice_items (Fakturarader)
  - id, invoice_id
  - description, quantity, unit_price
  - total_amount, tax_rate

org_subscriptions (SaaS-abonnemang)
  - id, org_id, status
  - trial_ends_at, subscription_ends_at

applications (Ansökningar)
  - id, org_id
  - parent_name, parent_email, parent_phone
  - dog_name, dog_breed, dog_size
  - preferred_start_date, preferred_days
  - status (pending/approved/rejected)
```

---

## 🎨 UI/UX DESIGNPRINCIPER

### Färgschema

- **Primärfärg:** Grön (#2c7a4c) — trygghet, natur
- **Sekundärfärg:** Blå — professionalism
- **Accentfärg:** Orange — uppmärksamhet
- **Neutral:** Grå — bakgrund, text

### Statusfärger

- **Draft/Pending:** Grå — väntar på åtgärd
- **Sent/Confirmed:** Blå — skickad/bekräftad
- **Paid/Completed:** Grön — klar/betald
- **Cancelled/Overdue:** Röd — avbruten/försenad

### Designprinciper

- **Minimalistisk:** Ren, luftig design
- **Rundade hörn:** Mjuka former (8px border-radius)
- **Tydliga knappar:** Stor touch-area, tydlig text
- **Färgkodning:** Konsekvent användning av statusfärger
- **Kortbaserad layout:** Modulära komponenter
- **Tabs & Tabeller:** Strukturerad datapresentation

---

## 🚀 TEKNISK STACK

**Frontend:**

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI (komponenter)

**Backend:**

- Supabase (PostgreSQL)
- Auth (RLS policies)
- Realtime (live updates)

**Fakturering:**

- pdfkit (PDF-generering)
- qrcode (QR-koder för betalning)
- stream-buffers (PDF-streaming)

**Hosting:**

- Vercel (frontend)
- Supabase (backend/databas)

---

## 🔄 KRITISKA FLÖDEN

### 1. Nytt företag registrerar sig

```
1. /register → Fyll i företagsuppgifter
2. Skapa auth.user
3. Trigger: handle_new_user()
   - Skapar orgs
   - Skapar profiles (role='admin')
   - Skapar org_subscriptions (3 mån trial)
4. Redirect → /dashboard
5. Företaget börjar lägga till hundar/kunder
```

### 2. Hundägare bokar pensionat

```
1. Landing page → /ansokan/pensionat
2. Fyll i ansökan (publik, ingen inloggning)
   - Personuppgifter
   - Hunduppgifter
   - Önskade datum
3. Skickas till vald organisation
4. Admin får notis → /hundpensionat/ansokningar
5. Admin granskar → Godkänn/Avvisa
6. Om godkänd:
   - Status: pending → confirmed
   - Trigger: trg_create_prepayment_invoice
   - Förskottsfaktura skapas
7. Hundägare får e-post med bekräftelse + faktura
8. Hundägare betalar förskott
9. På incheckningsdagen: Status → checked_in
10. På utcheckningsdagen: Status → checked_out
    - Trigger: trg_create_invoice_on_checkout
    - Slutfaktura skapas
11. Hundägare får slutfaktura
12. Hundägare betalar slutfaktura
13. Admin markerar som betald
```

### 3. Frisörbokning & fakturering

```
1. Admin: /frisor/ny-bokning
2. Välj hund, datum, tid, behandlingstyp
3. Status: confirmed (direkt bokad)
4. När behandling utförd: Markera som completed
5. Automatiskt:
   - Skapa grooming_journal-post
   - Skapa faktura
6. Faktura skickas till kund
7. Kund betalar (ofta direkt via Swish)
8. Admin markerar som betald
```

---

## 💡 SAMMANFATTNING — KÄRNFUNKTIONALITET

**DogPlanner är:**

- ✅ En SaaS för hundverksamheter (3 mån trial → betalabonnemang)
- ✅ Modulärt system (dagis, pensionat, frisör kan användas separat)
- ✅ Automatiserad fakturering (triggers från bokningar)
- ✅ Dynamisk prissättning (helger, högtider, säsonger, rabatter)
- ✅ Kundportal för hundägare (ansökan, bokning, fakturor)
- ✅ Komplett administrativt system (kunder, hundar, rum, priser, fakturor)
- ✅ Statistik & rapporter (realtid & historik)
- ✅ PDF-generering (fakturor, kvitton)
- ✅ Multi-tenant (varje org är isolerad via RLS)

**Fokus:**

- **Enkelhet för hundägare** — Lätt att ansöka/boka
- **Effektivitet för företag** — Automatisering, översikt, ekonomi
- **Flexibilitet** — Anpassningsbara priser, rabatter, tjänster
- **Spårbarhet** — Allt loggat, fakturor kopplade till bokningar

---

**Skapad:** 2025-11-22  
**Baserat på:** Fullständig genomgång av alla moduler, API:er, databas och UI
