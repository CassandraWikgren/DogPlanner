# Hundpensionat - Komplett Bokningsflöde & Datahantering

## 📋 Översikt

Komplett analys av bokningsflödet från initial förfrågan till fakturering och datalagring.

---

## 🔄 FLÖDE 1: Bokningsprocess

### STEG 1: Kund bokar plats

#### A. **Med inloggning** (Befintlig kund)

```
Kund → /hundpensionat/nybokning (inloggad)
↓
Kund fyller i:
- Väljer befintlig hund från dropdown
- start_date, end_date
- Rum (frivilligt)
- Special requests, belongings
↓
INSERT INTO bookings:
  status: 'pending'
  dog_id: <befintlig hund>
  owner_id: <från session>
  org_id: <från session>
```

#### B. **Utan inloggning** (Ny kund - GDPR-flow)

```
Kund → /ansokan/pensionat
↓
AssistedRegistrationModal öppnas
↓
Alternativ 1: Email-baserad
  - Personal fyller i: namn, email, telefon, adress
  - System skapar owner med consent_status='pending'
  - Email skickas med JWT-link (7 dagar)
  - Kund klickar → /consent/verify → fyller i GDPR + personnummer
  - Status → 'verified'
  ↓
  INSERT INTO owners (consent_status='pending')
  INSERT INTO consent_logs (consent_type='email_verification_sent')

Alternativ 2: Fysisk blankett
  - Personal laddar upp signerad blankett
  - Lagras i Supabase Storage bucket 'documents'
  - owner skapas direkt med consent_status='verified'
  ↓
  INSERT INTO owners (consent_status='verified')
  INSERT INTO consent_logs (consent_type='paper_form', document_url='...')

Därefter:
  INSERT INTO dogs (org_id, owner_id)
  INSERT INTO bookings (status='pending', consent_required=true om email)
```

**SAKNAS IDAG:**

- ❌ Direkt bokningssida för kunder utan inlogg (`/ansokan/pensionat`)
- ❌ Email-notifiering till pensionat vid ny förfrågan
- ✅ AssistedRegistrationModal (FAS 6 implementerad)

---

### STEG 2: Pensionat får förfrågan

**SAKNAS IDAG:**

- ❌ Dedikerad "Bokningsförfrågningar"-sida
- ❌ Notifieringar (email/in-app) vid ny booking med status='pending'

**BÖR IMPLEMENTERAS:**

```typescript
// /app/hundpensionat/fórfragningar/page.tsx
- Lista alla bookings WHERE status='pending' AND org_id=current
- Visa: Kund, Hund, Datum, Special requests
- Actions: Godkänn / Avslå / Kontakta kund
```

---

### STEG 3: Pensionat godkänner bokning

**VID GODKÄNNANDE:**

```sql
UPDATE bookings
SET
  status = 'confirmed',
  room_id = <tilldelat rum>,
  bed_location = 'Rum 3, Säng A'
WHERE id = <booking_id>;

-- Skapa förskottsfaktura (om tillämpligt)
INSERT INTO invoices (
  org_id,
  customer_id (owner_id),
  booking_id,
  invoice_type = 'prepayment',
  amount = <förskott 50%>,
  due_date = start_date - 7 dagar,
  status = 'unpaid'
);

UPDATE bookings
SET prepayment_invoice_id = <ny faktura>
WHERE id = <booking_id>;

-- Email till kund: "Bokning godkänd + faktura"
```

**BÖR IMPLEMENTERAS:**

```typescript
// API route: /api/bookings/approve
POST /api/bookings/approve
Body: {
  booking_id: uuid,
  room_id: uuid,
  bed_location: string,
  prepayment_required: boolean,
  prepayment_percentage: number
}

Response:
- UPDATE booking
- CREATE prepayment invoice
- SEND email confirmation
```

**SAKNAS IDAG:**

- ❌ Godkännande-funktionalitet i UI
- ❌ Automatisk fakturagenerering vid godkännande
- ❌ Email till kund vid godkännande

---

### STEG 4: Hund & Bokning i systemet

**EFTER GODKÄNNANDE:**

```sql
-- BOOKING
SELECT * FROM bookings WHERE id = <booking_id>
→ status: 'confirmed'
→ room_id: assigned
→ bed_location: 'Rum 3, Säng A'
→ prepayment_invoice_id: <faktura-id>

-- HUND
SELECT * FROM dogs WHERE id = <dog_id>
→ Hund finns permanent i systemet (koppla till owner)
→ Synlig i /hunddagis och /hundpensionat

-- ÄGARE
SELECT * FROM owners WHERE id = <owner_id>
→ Ägare finns permanent
→ consent_status: 'verified' eller 'pending'
```

**VIKTIGT:**

- ✅ Hund + Ägare skapas PERMANENT vid första bokningen
- ✅ Finns kvar även efter utcheckning
- ✅ Kan användas för framtida bokningar

---

### STEG 5: Incheckning

**KUND CHECKAR IN:**

```sql
UPDATE bookings
SET
  status = 'checked_in',
  checkin_time = NOW()
WHERE id = <booking_id>
  AND start_date = CURRENT_DATE;

-- Optional: Lägg till journal-anteckning
INSERT INTO journal_entries (
  org_id,
  dog_id,
  entry_type = 'check_in',
  description = 'Incheckning hundpensionat',
  created_by_user_id = <staff user>
);
```

**I SYSTEMET:**

- Hunden syns som "Aktiv gäst" i pensionat-vyn
- Status: `checked_in`
- Tilldelad säng/rum: `bed_location`

**BÖR IMPLEMENTERAS:**

```typescript
// /app/hundpensionat/aktiva-gaster/page.tsx
- Lista alla bookings WHERE status='checked_in' AND org_id=current
- Filtrera: per rum, per datum
- Quick actions: Lägg till journal, Visa hund-info
```

**SAKNAS IDAG:**

- ❌ Incheckning-funktion i UI
- ❌ "Aktiva gäster"-vy för pensionat
- ✅ Journal-system finns (kan användas)

---

### STEG 6: Utcheckning

**KUND CHECKAR UT:**

```sql
UPDATE bookings
SET
  status = 'checked_out',
  checkout_time = NOW()
WHERE id = <booking_id>;

-- Beräkna slutpris (inkl. extra tjänster)
UPDATE bookings
SET total_price = (
  base_price +
  SUM(extra_services) -
  discount_amount
)
WHERE id = <booking_id>;

-- Skapa efterskottsfaktura
INSERT INTO invoices (
  org_id,
  customer_id (owner_id),
  booking_id,
  invoice_type = 'afterpayment',
  amount = total_price - prepayment_paid,
  due_date = checkout_date + 14 dagar,
  status = 'unpaid'
);

UPDATE bookings
SET afterpayment_invoice_id = <ny faktura>
WHERE id = <booking_id>;

-- Email till kund: "Tack för besöket + faktura"
```

**BÖR IMPLEMENTERAS:**

```typescript
// /app/hundpensionat/utcheckning/page.tsx
- Välj bokning från aktiva gäster
- Lägg till extra tjänster:
  * Kloklippning: 150 kr
  * Medicinering: 50 kr/dag
  * Tandrengöring: 300 kr
- Beräkna totalpris automatiskt
- Generera slutfaktura
- Markera som 'checked_out'
```

**SAKNAS IDAG:**

- ❌ Utchecknings-UI
- ❌ Extra tjänster-kalkylator
- ❌ Automatisk efterskottsfakturering
- ✅ Fakturahantering finns (kan byggas på)

---

## 💰 FLÖDE 2: Fakturering & Betalning

### Förskott (Prepayment)

```
Vid godkännande:
→ CREATE invoices (invoice_type='prepayment', amount=50% av base_price)
→ UPDATE bookings.prepayment_invoice_id
→ UPDATE bookings.prepayment_status = 'unpaid'

Vid betalning:
→ UPDATE invoices SET status='paid', paid_at=NOW()
→ UPDATE bookings SET prepayment_status='paid'
```

### Efterskott (Afterpayment)

```
Vid utcheckning:
→ Beräkna: total_price = base_price + extra_services - discount
→ CREATE invoices (invoice_type='afterpayment', amount=total_price - prepayment)
→ UPDATE bookings.afterpayment_invoice_id
→ UPDATE bookings.prepayment_status (om kund betalade allt)

Vid betalning:
→ UPDATE invoices SET status='paid'
→ UPDATE bookings.prepayment_status='paid'
```

**BETALNINGSMETODER:**

- Swish
- Kort (Stripe/Klarna)
- Faktura (betala inom 14 dagar)
- Kontant

**SAKNAS IDAG:**

- ❌ Integration med betalningslösning (Swish API, Stripe)
- ❌ Manuell betalningsregistrering i UI
- ✅ Faktura-databas finns (invoices-tabell)

---

## 🗄️ FLÖDE 3: Datalagring efter utcheckning

### VAD HÄNDER MED DATA?

#### **BOKNING (bookings-tabell)**

```sql
-- EFTER UTCHECKNING:
SELECT * FROM bookings WHERE id = <booking_id>
→ status: 'checked_out'
→ checkout_time: 2025-11-16 10:00:00
→ total_price: 3500 kr
→ prepayment_invoice_id: <faktura 1>
→ afterpayment_invoice_id: <faktura 2>

-- SPARAS PERMANENT? JA! ✅
-- Används för:
-- - Historik
-- - Bokföringsunderlag (7 år enligt lag)
-- - Kundanalys
-- - Återkommande kunder
```

**RENSNING (GDPR Art. 17 - Rätt till radering):**

```sql
-- Kund begär radering:
UPDATE bookings
SET
  notes = NULL,
  special_requests = NULL,
  belongings = NULL
WHERE id = <booking_id>;

-- Anonymisera (behåll statistik):
UPDATE bookings
SET
  owner_id = NULL, -- Bryt kopplingen
  notes = '[RADERAD]'
WHERE id = <booking_id>;

-- Hårdradering (endast om INGEN faktura kopplad):
DELETE FROM bookings
WHERE id = <booking_id>
  AND prepayment_invoice_id IS NULL
  AND afterpayment_invoice_id IS NULL;
```

**REKOMMENDERAD POLICY:**

```
SPARAS PERMANENT:
- Bokningar med fakturor: 7 år (bokföring)
- Bokningar utan fakturor: 3 år (affärsanalys)

AUTOMATISK RENSNING:
- booking.notes, special_requests: 2 år efter utcheckning
- booking.belongings: 1 år efter utcheckning

ANONYMISERING:
- owner_id tas bort: 7 år efter utcheckning (behåll statistik)
```

---

#### **HUND (dogs-tabell)**

```sql
-- SPARAS PERMANENT? JA! ✅
-- Används för:
-- - Framtida bokningar (återkommande kund)
-- - Medicinsk historik
-- - Beteendeanalys
-- - Allergi-/specialkostinformation

-- Vid GDPR-radering:
UPDATE dogs
SET
  medical_conditions = NULL,
  allergies = NULL,
  special_diet = NULL,
  is_deleted = true,
  deleted_at = NOW()
WHERE id = <dog_id>;

-- Mjuk radering (behåll för statistik):
-- Hund syns inte i UI men finns kvar i DB
```

**REKOMMENDERAD POLICY:**

```
SPARAS PERMANENT:
- Aktiva hundar: Oändligt
- Inaktiva hundar (ingen bokning senaste 3 åren): Markeras 'inactive'

MJUK RADERING:
- Kund begär: is_deleted=true (dölj i UI, behåll i DB)

HÅRD RADERING:
- Efter 7 år inaktivitet OCH ingen koppling till fakturor
```

---

#### **ÄGARE (owners-tabell)**

```sql
-- SPARAS PERMANENT? JA! ✅
-- Används för:
-- - Kundregister
-- - Fakturering
-- - Marknadsföring (om samtycke)
-- - GDPR-compliance

-- Vid GDPR-radering:
UPDATE owners
SET
  name = 'Raderad kund',
  email = NULL,
  phone = NULL,
  address = NULL,
  personal_number = NULL,
  gdpr_marketing_consent = false,
  is_anonymized = true,
  anonymized_at = NOW()
WHERE id = <owner_id>;

-- Hårdradering (endast om INGA fakturor):
DELETE FROM owners
WHERE id = <owner_id>
  AND NOT EXISTS (
    SELECT 1 FROM invoices WHERE customer_id = <owner_id>
  );
```

**REKOMMENDERAD POLICY:**

```
SPARAS PERMANENT:
- Aktiva kunder (bokning senaste 3 åren): Oändligt
- Inaktiva kunder: Anonymiseras efter 7 år

GDPR-COMPLIANCE:
- Kund kan när som helst begära radering
- Om fakturor finns: Anonymisera (behåll faktura-data 7 år)
- Om INGA fakturor: Hårdradera omedelbart
```

---

## ❌ FLÖDE 4: Avbokning

### VAR AVBOKAR KUND?

**SCENARIO 1: Före godkännande** (status='pending')

```
Kund → Ej inloggad = Ring/Maila pensionat
Kund → Inloggad = /mina-bokningar → Knapp "Avboka"

UPDATE bookings
SET
  status = 'cancelled',
  cancellation_reason = 'Kund avbokade',
  cancelled_at = NOW()
WHERE id = <booking_id>;

-- Ingen faktura skapad = Ingen återbetalning
```

**SCENARIO 2: Efter godkännande, före incheckning** (status='confirmed')

```
Kund → /mina-bokningar → "Avboka bokning"
↓
System kollar avbokningspolicy:
- Mer än 7 dagar kvar: Full återbetalning
- 3-7 dagar: 50% avgift
- <3 dagar: Ingen återbetalning

UPDATE bookings
SET
  status = 'cancelled',
  cancellation_reason = 'Kund avbokade <datum>',
  cancelled_at = NOW()
WHERE id = <booking_id>;

-- Återbetala förskott (om tillämpligt):
UPDATE invoices
SET
  status = 'refunded',
  refund_amount = <belopp>,
  refund_date = NOW()
WHERE id = prepayment_invoice_id;

-- Email: "Din bokning är avbokad"
```

**SCENARIO 3: Efter incheckning** (status='checked_in')

```
→ Kund kan EJ avboka själv
→ Kontakta pensionat
→ Personal hanterar manuellt
```

**AVBOKNINGSPOLICY (BÖR DEFINIERAS):**

```typescript
// /lib/cancellationPolicy.ts
export function calculateCancellationFee(
  booking: Booking,
  cancellationDate: Date
): number {
  const daysUntilStart = differenceInDays(booking.start_date, cancellationDate);

  if (daysUntilStart >= 7) {
    return 0; // Full återbetalning
  } else if (daysUntilStart >= 3) {
    return booking.total_price * 0.5; // 50% avgift
  } else {
    return booking.total_price; // Ingen återbetalning
  }
}
```

**SAKNAS IDAG:**

- ❌ Avbokningsfunktion i kundportal
- ❌ Automatisk avbokningspolicy
- ❌ Återbetalnings-hantering
- ❌ Email-notifiering vid avbokning

**BÖR IMPLEMENTERAS:**

```typescript
// /app/kundportal/mina-bokningar/page.tsx
- Lista alla bookings WHERE owner_id=current_user
- Status-badges: Pending, Confirmed, Checked in, Completed, Cancelled
- Actions per status:
  * Pending: "Avboka" (gratis)
  * Confirmed: "Avboka" (visa avgift först)
  * Checked_in: Ingen knapp (kontakta pensionat)
```

---

## 📊 DATAMODELL - Sammanfattning

### BOOKINGS (Bokningar)

```sql
status:
- 'pending'      → Väntar på godkännande
- 'confirmed'    → Godkänd, väntar på incheckning
- 'checked_in'   → Aktiv gäst
- 'checked_out'  → Utcheckad, klar
- 'cancelled'    → Avbokad

Sparas: PERMANENT (7 år för bokföring)
Rensas: notes, special_requests efter 2 år
Anonymiseras: owner_id efter 7 år
```

### DOGS (Hundar)

```sql
Sparas: PERMANENT (för återkommande kunder)
Mjuk radering: is_deleted=true (dölj i UI)
Hård radering: Efter 7 år inaktivitet + GDPR-begäran
```

### OWNERS (Ägare)

```sql
consent_status:
- 'pending'    → Email-verifiering väntar
- 'verified'   → GDPR godkänt
- 'withdrawn'  → Samtycke återkallat

Sparas: PERMANENT (för kundregister)
Anonymiseras: Vid GDPR-begäran (om fakturor finns)
Hårdraderas: Om INGA fakturor (direkt radering OK)
```

### INVOICES (Fakturor)

```sql
invoice_type:
- 'prepayment'    → Förskottsfaktura (vid godkännande)
- 'afterpayment'  → Slutfaktura (vid utcheckning)

status:
- 'unpaid'         → Ej betald
- 'paid'           → Betald
- 'partially_paid' → Delbetalning
- 'overdue'        → Försenad
- 'refunded'       → Återbetald (avbokning)

Sparas: PERMANENT (7 år enligt bokföringslag)
Raderas: ALDRIG (även efter GDPR-radering av kund)
```

---

## ✅ IMPLEMENTERAT (2025-11-16)

### HÖGT PRIORITERADE - KLART ✅

1. ✅ **Bokningsförfrågningar-sida** (`/hundpensionat/ansokningar`)
   - ✅ Lista pending bookings
   - ✅ Godkänn/Avslå-knappar
   - ✅ Rabattsystem integrerat
   - ⏳ Email-notifiering (TODO)

2. ✅ **Incheckning/Utcheckning-UI** (`/hundpensionat/aktiva-gaster`)
   - ✅ Checka in gäst (status → 'checked_in')
   - ✅ Checka ut gäst (status → 'checked_out')
   - ✅ Lägg till extra tjänster vid utcheckning
   - ✅ Visa aktiva gäster och väntande incheckningar
   - ✅ Automatisk prisberäkning

3. ✅ **Kundportal - Mina bokningar** (`/kundportal/mina-bokningar`)
   - ✅ Visa alla egna bookings (filter: Kommande, Tidigare, Avbokade, Alla)
   - ✅ Avboka innan start_date med automatisk avgiftsberäkning
   - ✅ Se fakturahistorik (prepayment + afterpayment)
   - ✅ Status-badges och komplett bokningsinfo

4. ✅ **Avbokningspolicy-system** (`lib/cancellationPolicy.ts`)
   - ✅ Beräkna avgift baserat på dagar kvar (7+ = 0%, 3-7 = 50%, <3 = 100%)
   - ✅ API endpoint `/api/bookings/cancel`
   - ✅ Automatisk återbetalningslogik
   - ✅ Uppdatering av faktura-status till 'refunded'
   - ⏳ Email-bekräftelse (TODO)

5. ✅ **Databas-migration** (`20251116_add_cancellation_and_gdpr_fields.sql`)
   - ✅ Cancellation-fält: `cancellation_reason`, `cancelled_at`, `cancelled_by_user_id`
   - ✅ GDPR-fält: `is_anonymized`, `data_retention_until`, `anonymization_reason`
   - ✅ Soft delete för hundar: `is_deleted`, `deleted_at`, `deleted_reason`
   - ✅ Booking events audit log (GDPR Article 30)
   - ✅ Helper functions: `calculate_cancellation_fee()`, `anonymize_owner()`
   - ✅ Triggers för auto-logging av bokningsändringar
   - ⚠️ **MÅSTE KÖRAS I SUPABASE SQL EDITOR**

### MEDEL PRIORITERADE - DELVIS KLART

6. ⏳ **Automatisk fakturering**
   - ✅ CREATE prepayment invoice vid godkännande (via trigger i ansokningar/page.tsx)
   - ⏳ CREATE afterpayment invoice vid utcheckning (implementerat i UI, trigger behövs)
   - ⏳ Email med PDF-faktura

7. ⏳ **Email-notifieringar**
   - ⏳ Till pensionat: "Ny bokningsförfrågan"
   - ⏳ Till kund: "Bokning godkänd"
   - ⏳ Till kund: "Påminnelse - incheckning imorgon"
   - ⏳ Till kund: "Tack för besöket + slutfaktura"
   - ⏳ Till kund: "Avbokningsbekräftelse"

8. ⏳ **Data retention policy** (GDPR-compliance)
   - ✅ Helper functions för anonymisering
   - ⏳ Automatisk cron job för 7-års-rensning
   - ⏳ GDPR-export för kunder

9. ❌ **Betalningsintegration**
   - ❌ Swish API
   - ❌ Stripe/Klarna
   - ❌ Manuell betalningsregistrering

---

## 🚨 KVARVARANDE FUNKTIONER

### HÖGT PRIORITERADE (Måste implementeras)

1. ❌ **Bokningsförfrågningar-sida** (`/hundpensionat/fórfragningar`)
   - Lista pending bookings
   - Godkänn/Avslå-knappar
   - Email-notifiering

2. ❌ **Incheckning/Utcheckning-UI** (`/hundpensionat/aktiva-gaster`)
   - Checka in gäst (status → 'checked_in')
   - Checka ut gäst (status → 'checked_out')
   - Lägg till extra tjänster

3. ❌ **Kundportal - Mina bokningar** (`/kundportal/mina-bokningar`)
   - Visa alla egna bookings
   - Avboka innan start_date
   - Se fakturahistorik

4. ❌ **Automatisk fakturering**
   - CREATE prepayment invoice vid godkännande
   - CREATE afterpayment invoice vid utcheckning
   - Email med PDF-faktura

5. ❌ **Email-notifieringar**
   - Till pensionat: "Ny bokningsförfrågan"
   - Till kund: "Bokning godkänd"
   - Till kund: "Påminnelse - incheckning imorgon"
   - Till kund: "Tack för besöket + slutfaktura"

### MEDEL PRIORITERADE

6. ❌ **Avbokningspolicy-system**
   - Beräkna avgift baserat på dagar kvar
   - Automatisk återbetalning
   - Email-bekräftelse

7. ❌ **Data retention policy** (GDPR-compliance)
   - Automatisk anonymisering efter 7 år
   - Mjuk radering av inaktiva hundar
   - GDPR-export för kunder

8. ❌ **Betalningsintegration**
   - Swish API
   - Stripe/Klarna
   - Manuell betalningsregistrering

---

## 📝 REKOMMENDERADE ÄNDRINGAR I SCHEMA

### 1. Lägg till `cancellation_reason` i bookings

```sql
ALTER TABLE bookings ADD COLUMN cancellation_reason text;
ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
ALTER TABLE bookings ADD COLUMN cancelled_by_user_id uuid REFERENCES auth.users(id);
```

### 2. Lägg till `is_deleted` i dogs (mjuk radering)

```sql
ALTER TABLE dogs ADD COLUMN is_deleted boolean DEFAULT false;
ALTER TABLE dogs ADD COLUMN deleted_at timestamptz;
```

### 3. Lägg till `is_anonymized` i owners (GDPR)

```sql
ALTER TABLE owners ADD COLUMN is_anonymized boolean DEFAULT false;
ALTER TABLE owners ADD COLUMN anonymized_at timestamptz;
```

### 4. Lägg till `cancellation_policy` i organisations

```sql
ALTER TABLE organisations ADD COLUMN cancellation_policy jsonb DEFAULT '{
  "days_7_plus": 0,
  "days_3_to_7": 0.5,
  "days_under_3": 1.0
}'::jsonb;
```

### 5. Skapa `booking_events` tabell (audit log)

```sql
CREATE TABLE booking_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'created', 'approved', 'cancelled', 'checked_in', 'checked_out'
  notes text,
  performed_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

---

## ✅ IMPLEMENTATIONSPLAN

### FAS 1: Grundläggande bokningshantering (1 vecka)

- [ ] Skapa `/hundpensionat/fórfragningar` sida
- [ ] Godkänn/Avslå-funktionalitet
- [ ] Email till pensionat vid ny förfrågan
- [ ] Email till kund vid godkännande

### FAS 2: In-/Utcheckning (1 vecka)

- [ ] Skapa `/hundpensionat/aktiva-gaster` sida
- [ ] Incheckning-funktion
- [ ] Utcheckning-funktion med extra tjänster
- [ ] Automatisk fakturagenerering vid utcheckning

### FAS 3: Kundportal (1 vecka)

- [ ] Skapa `/kundportal/mina-bokningar`
- [ ] Visa bokningshistorik
- [ ] Avbokningsfunktion
- [ ] Visa fakturor

### FAS 4: Automatisering & GDPR (2 veckor)

- [ ] Email-notifieringar (Resend)
- [ ] Avbokningspolicy-motor
- [ ] Data retention scripts
- [ ] GDPR-export funktion

### FAS 5: Betalningar (2 veckor)

- [ ] Swish integration
- [ ] Stripe/Klarna
- [ ] Manuell betalningsregistrering

---

## 🎯 NÄSTA STEG

**PRIORITET 1: Bokningshantering**

1. Implementera `/hundpensionat/fórfragningar`
2. Skapa API `/api/bookings/approve`
3. Lägg till email-notifieringar

**PRIORITET 2: Kundportal**

1. Bygg `/kundportal/mina-bokningar`
2. Implementera avbokningsfunktion
3. Visa fakturahistorik

**PRIORITET 3: GDPR & Datarensning**

1. Skapa data retention policy
2. Implementera anonymiseringsscript
3. GDPR-export funktion

---

**Dokumenterad:** 2025-11-16  
**Status:** Komplett analys - Redo för implementation  
**Nästa review:** Efter FAS 1 implementation
