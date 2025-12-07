# 📄 FAKTURAUNDERLAG FÖR BOKFÖRINGSSYSTEM

**Skapad:** 2025-11-22  
**Syfte:** Standardisera fakturor för enkel export till Fortnox, Bokio, Visma osv.

---

## 🎯 MÅL

1. **Korrekt fakturanumrering** enligt svensk standard
2. **OCR/Referensnummer** för automatisk matchning
3. **Betalningspåminnelser** med ränta och avgifter
4. **Exportformat** kompatibelt med bokföringssystem
5. **Momsfrihet** (hundtjänster är momsfria enligt ML 3:11)

---

## 📋 SVENSK FAKTURASTANDARD (enligt bokföringslagen)

### Obligatoriska uppgifter:

#### **Säljare (Organisationen):**

- [x] Företagsnamn
- [x] Organisationsnummer
- [x] Adress
- [x] Telefon
- [x] E-post
- [ ] **F-skattebevis** (rekommenderat att visa)
- [ ] **Momsregistreringsnummer** (om momspliktigt)

#### **Köpare (Kunden):**

- [x] Kundnummer (unikt per organisation)
- [x] Namn
- [x] Adress (faktureringsadress)
- [ ] **Organisationsnummer** (för företagskunder)
- [ ] **Referens** (kontaktperson)

#### **Fakturan:**

- [ ] **Fakturanummer** (löpande, unikt, ej återanvänt)
- [x] Fakturadatum
- [x] Förfallodatum
- [ ] **OCR-nummer** (för automatisk betalning)
- [ ] **Betalningsvillkor** (14 dagar netto, 30 dagar netto, etc)

#### **Specifikation:**

- [x] Beskrivning av vara/tjänst
- [x] Antal/Kvantitet
- [x] Enhetspris
- [x] Totalpris per rad
- [ ] **Momssats** (25%, 12%, 6%, 0%)
- [x] Delsumma exkl. moms
- [x] Momssumma per momssats
- [x] **Totalsumma inkl. moms**

#### **Betalningsinformation:**

- [ ] **Bankgiro** eller **Plusgiro**
- [ ] **Swish-nummer**
- [ ] **OCR-nummer** (om bankgiro)
- [ ] **Betalningsreferens** (om inte OCR)
- [ ] **Dröjsmålsränta** (rekommenderat: 8% enligt referensräntan)

---

## 🔢 FAKTURANUMRERING

### Nuvarande problem:

```typescript
// I koden nu:
invoice_number: string | null  // Ofta null
// Eller:
invoice.id.slice(0, 8)  // UUID-snippet (ej löpande)
```

### Lösning: Löpande fakturanummer per organisation

#### **Format:** `{org_prefix}-{YYYY}-{sequential}`

**Exempel:**

- `DP-2025-00001` — DogPlanner AB, 2025, första fakturan
- `HUND-2025-00142` — Hunddagis Stockholm, 2025, faktura 142
- `PENS-2025-00089` — Hundpensionat Göteborg, 2025, faktura 89

#### **Implementation:**

**Databas-trigger:**

```sql
-- Ny tabell för räknare
CREATE TABLE invoice_counters (
  org_id UUID PRIMARY KEY REFERENCES orgs(id),
  current_year INT NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT 'INV',
  UNIQUE(org_id, current_year)
);

-- Funktion för att generera nästa fakturanummer
CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year INT;
  v_counter INT;
  v_prefix TEXT;
  v_invoice_number TEXT;
BEGIN
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Hämta eller skapa räknare för detta år
  INSERT INTO invoice_counters (org_id, current_year, counter, prefix)
  VALUES (p_org_id, v_current_year, 1, 'INV')
  ON CONFLICT (org_id, current_year)
  DO UPDATE SET counter = invoice_counters.counter + 1
  RETURNING counter, prefix INTO v_counter, v_prefix;

  -- Formatera: PREFIX-YYYY-NNNNN
  v_invoice_number := v_prefix || '-' || v_current_year || '-' || LPAD(v_counter::TEXT, 5, '0');

  RETURN v_invoice_number;
END;
$$;

-- Trigger för att auto-generera fakturanummer vid INSERT
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();
```

---

## 🔢 OCR-NUMMER (BETALNINGSREFERENS)

### Syfte:

OCR (Optical Character Recognition) = Automatisk matchning av betalningar i bank

### Format:

**Längd 2-25 siffror med kontrolltecken (Luhn-algoritm eller MOD10)**

#### **Variant 1: Kundnummer + Fakturanummer**

```
Format: KKKKKKFFFFFC
K = Kundnummer (6 siffror)
F = Fakturanummer (5 siffror)
C = Kontrollsiffra (Luhn)

Exempel:
  Kundnummer: 000123
  Faktura: 00001
  OCR: 0001230000015 (sista siffran = kontroll)
```

#### **Variant 2: Endast Fakturanummer**

```
Format: FFFFFFFFFC
F = Fakturanummer (9 siffror)
C = Kontrollsiffra

Exempel:
  Faktura: 2025-00001 → 202500001
  OCR: 2025000018 (sista siffran = kontroll)
```

#### **Implementation (Luhn-algoritm):**

```typescript
// lib/ocrGenerator.ts

export function generateOCR(customerId: number, invoiceNumber: string): string {
  // Ta bort prefix och formatering från fakturanummer
  const numericInvoice = invoiceNumber.replace(/\D/g, ''); // "2025-00001" → "202500001"

  // Kombinera kundnummer (6 siffror) + fakturanummer (9 siffror)
  const customerPart = customerId.toString().padStart(6, '0');
  const invoicePart = numericInvoice.slice(-9).padStart(9, '0');
  const baseOCR = customerPart + invoicePart;

  // Beräkna kontrolltecken med Luhn-algoritm
  const checkDigit = calculateLuhnCheckDigit(baseOCR);

  return baseOCR + checkDigit;
}

function calculateLuhnCheckDigit(number: string): string {
  let sum = 0;
  let alternate = false;

  // Gå igenom från höger till vänster
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);

    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    alternate = !alternate;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

// Exempel:
// generateOCR(123, "2025-00001")
// → "0001232025000018"
```

---

## 💰 BETALNINGSINFORMATION

### Nuvarande databas (orgs-tabellen):

```typescript
orgs:
  swish_number: string | null
  bankgiro: string | null
```

### Utökad betalningsinformation:

```sql
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plusgiro TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bic_swift TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 14;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC DEFAULT 60.00;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 8.00;
```

### På fakturan:

```
BETALNINGSINFORMATION
─────────────────────────────
Bankgiro: 123-4567
OCR-nummer: 0001232025000018

Swish: 123 456 78 90
QR-kod: [QR]

Betalningsvillkor: 14 dagar netto
Förfallodatum: 2025-12-06

Vid försenad betalning tillkommer:
- Påminnelseavgift: 60 kr
- Dröjsmålsränta: 8% per år
```

---

## 📧 BETALNINGSPÅMINNELSER

### Flöde:

```
FAKTURA SKICKAD (status: sent)
    ↓
FÖRFALLODATUM PASSERAT
    ↓ +7 dagar
PÅMINNELSE 1 (status: reminder_1)
    - Ingen avgift
    - E-post: "Betalningspåminnelse"
    ↓ +10 dagar
PÅMINNELSE 2 (status: reminder_2)
    - Påminnelseavgift: 60 kr
    - E-post: "Andra påminnelse"
    ↓ +14 dagar
INKASSO (status: collection)
    - Överlämnas till inkassobolag
    - Inkassoavgift: 180 kr
```

### Databas-ändringar:

```sql
-- Lägg till nya statusar
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN (
    'draft',
    'sent',
    'paid',
    'cancelled',
    'overdue',        -- Ny: Förfallen men ingen påminnelse skickad
    'reminder_1',     -- Ny: Första påminnelsen skickad
    'reminder_2',     -- Ny: Andra påminnelsen skickad
    'collection'      -- Ny: Skickad till inkasso
  ));

-- Lägg till påminnelsedata
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_1_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_2_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_1_fee NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_2_fee NUMERIC DEFAULT 60;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS collection_fee NUMERIC DEFAULT 180;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_interest NUMERIC DEFAULT 0;
```

### Automatisk påminnelsehantering (Cron-jobb):

```typescript
// app/api/cron/check-overdue-invoices/route.ts

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Hämta alla obetalda fakturor
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .in('status', ['sent', 'overdue', 'reminder_1'])
    .lt('due_date', today)
    .is('paid_date', null);

  for (const invoice of invoices || []) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue >= 31 && invoice.status === 'reminder_1') {
      // Andra påminnelsen (31+ dagar sen)
      await sendReminder2(invoice);
      await supabase
        .from('invoices')
        .update({
          status: 'reminder_2',
          reminder_2_date: today,
          reminder_2_fee: 60,
          total_amount: invoice.total_amount + 60,
        })
        .eq('id', invoice.id);
    }
    else if (daysOverdue >= 14 && invoice.status === 'overdue') {
      // Första påminnelsen (14+ dagar sen)
      await sendReminder1(invoice);
      await supabase
        .from('invoices')
        .update({
          status: 'reminder_1',
          reminder_1_date: today,
        })
        .eq('id', invoice.id);
    }
    else if (daysOverdue >= 1 && invoice.status === 'sent') {
      // Markera som förfallen
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id);
    }
  }

  return Response.json({ success: true });
}
```

### Vercel Cron-jobb (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue-invoices",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 📊 EXPORTFORMAT FÖR BOKFÖRINGSSYSTEM

### CSV-format (Excel-kompatibelt):

```csv
Fakturanummer,Fakturadatum,Förfallodatum,Kundnummer,Kundnamn,Beskrivning,Antal,Á-pris,Momssats,Momsbelopp,Totalt,Status,Betaldatum,OCR
DP-2025-00001,2025-11-22,2025-12-06,123,Anna Andersson,"Hundpensionat 2025-11-10 - 2025-11-15",5,400.00,0%,0.00,2000.00,paid,2025-12-01,0001232025000018
DP-2025-00002,2025-11-23,2025-12-07,456,Bengt Bengtsson,"Hunddagis November 2025",20,350.00,0%,0.00,7000.00,sent,,0004562025000025
```

### JSON-format (API-export):

```json
{
  "export_date": "2025-11-22T10:30:00Z",
  "organization": {
    "id": "abc-123",
    "name": "DogPlanner AB",
    "org_number": "556789-0123"
  },
  "invoices": [
    {
      "invoice_number": "DP-2025-00001",
      "invoice_date": "2025-11-22",
      "due_date": "2025-12-06",
      "customer": {
        "customer_number": 123,
        "name": "Anna Andersson",
        "email": "anna@example.com",
        "org_number": null
      },
      "items": [
        {
          "description": "Hundpensionat 2025-11-10 - 2025-11-15 (5 nätter)",
          "quantity": 5,
          "unit_price": 400.0,
          "vat_rate": 0,
          "vat_amount": 0,
          "total": 2000.0,
          "account": "3000"
        }
      ],
      "totals": {
        "subtotal_excl_vat": 2000.0,
        "vat_amount": 0.0,
        "total_incl_vat": 2000.0
      },
      "payment": {
        "status": "paid",
        "paid_date": "2025-12-01",
        "paid_amount": 2000.0,
        "ocr": "0001232025000018",
        "payment_method": "bankgiro"
      }
    }
  ],
  "summary": {
    "total_invoices": 1,
    "total_amount": 2000.0,
    "paid_amount": 2000.0,
    "unpaid_amount": 0.0
  }
}
```

### SIE-format (Svensk standard för bokföring):

```
#FLAGGA 0
#PROGRAM "DogPlanner" 1.0
#FORMAT PC8
#GEN 20251122
#SIETYP 4
#ORGNR 556789-0123
#FNAMN "DogPlanner AB"
#VER A 1 20251122 "Faktura DP-2025-00001"
{
  #TRANS 1510 {} 2000.00 20251122 "Anna Andersson"
  #TRANS 3000 {} -2000.00 20251122 "Hundpensionat"
}
```

---

## 🧾 PDF-MALL (UPPDATERAD)

### Tillägg som behövs:

```typescript
// app/api/invoices/[id]/pdf/route.ts

// ... existing code ...

// EFTER KUNDINFO-BOX:

// === BETALNINGSINFORMATION ===
const paymentY = customerBoxY + 100;

doc
  .fontSize(11)
  .font('Helvetica-Bold')
  .fillColor('#2c7a4c')
  .text('Betalningsinformation', 50, paymentY);

doc.fontSize(9).font('Helvetica').fillColor('#333');

let paymentInfoY = paymentY + 20;

// Bankgiro + OCR
if (invoice.org?.bankgiro) {
  doc.text(`Bankgiro: ${invoice.org.bankgiro}`, 50, paymentInfoY);
  paymentInfoY += 12;

  // Generera OCR
  const ocr = generateOCR(invoice.owner?.customer_number, invoice.invoice_number);
  doc.font('Helvetica-Bold').text(`OCR-nummer: ${ocr}`, 50, paymentInfoY);
  paymentInfoY += 20;
}

// Swish + QR
if (invoice.org?.swish_number) {
  doc.font('Helvetica').text(`Swish: ${invoice.org.swish_number}`, 50, paymentInfoY);
  paymentInfoY += 12;

  // QR-kod för Swish
  const swishQR = await QRCode.toDataURL(
    `swish://payment?phone=${invoice.org.swish_number}&amount=${invoice.total_amount}&message=${invoice.invoice_number}`
  );
  doc.image(swishQR, 50, paymentInfoY, { width: 80 });
  paymentInfoY += 90;
}

// Betalningsvillkor
doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor('#666')
  .text('Betalningsvillkor:', 50, paymentInfoY);

doc
  .font('Helvetica-Bold')
  .fillColor('#000')
  .text(`${invoice.org?.payment_terms_days || 14} dagar netto`, 150, paymentInfoY);

paymentInfoY += 12;

doc
  .font('Helvetica')
  .fillColor('#666')
  .text('Förfallodatum:', 50, paymentInfoY);

doc
  .font('Helvetica-Bold')
  .fillColor('#000')
  .text(new Date(invoice.due_date).toLocaleDateString('sv-SE'), 150, paymentInfoY);

// Dröjsmålsränta
paymentInfoY += 20;
doc
  .fontSize(8)
  .font('Helvetica')
  .fillColor('#999')
  .text(
    `Vid försenad betalning tillkommer påminnelseavgift (${invoice.org?.late_fee_amount || 60} kr) samt dröjsmålsränta (${invoice.org?.interest_rate || 8}% per år).`,
    50,
    paymentInfoY,
    { width: 500 }
  );

// ... rest of PDF generation ...
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Databas:

- [ ] Skapa `invoice_counters` tabell
- [ ] Lägg till `generate_invoice_number()` funktion
- [ ] Lägg till `set_invoice_number()` trigger
- [ ] Utöka `orgs` med betalningsinformation
- [ ] Utöka `invoices` med påminnelsekolumner
- [ ] Uppdatera status-constraint

### Backend (API):

- [ ] Skapa `lib/ocrGenerator.ts`
- [ ] Skapa `/api/cron/check-overdue-invoices`
- [ ] Skapa `/api/invoices/export` (CSV/JSON/SIE)
- [ ] Uppdatera PDF-generering med OCR + betalningsinfo

### Frontend:

- [ ] Lägg till påminnelsehantering i `/faktura`
- [ ] Visa OCR-nummer i fakturavy
- [ ] Exportfunktion (CSV, Excel, JSON)
- [ ] Inställningar för org-betalningsinfo

### Vercel:

- [ ] Konfigurera Cron-jobb i `vercel.json`
- [ ] Sätt `CRON_SECRET` environment variable

---

## 📖 DOKUMENTATION FÖR FÖRETAGSKUND

**"Så överför du fakturor till ditt bokföringssystem"**

### Fortnox:

1. Gå till Ekonomi → Fakturor → Exportera
2. Välj datumintervall
3. Ladda ner CSV eller SIE
4. I Fortnox: Arkiv → Importera → Verifikationer → Välj fil

### Bokio:

1. Exportera fakturor som CSV
2. I Bokio: Bokföring → Import → Verifikationer
3. Matcha kolumner automatiskt

### Visma eEkonomi:

1. Exportera som JSON eller CSV
2. I Visma: Inställningar → Import/Export → Verifikationer
3. Välj DogPlanner-format

---

**Skapad:** 2025-11-22  
**Nästa steg:** Implementera databas-ändringar och API-endpoints
