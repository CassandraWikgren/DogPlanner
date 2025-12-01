Läs supabase/detta är_min_supabase_just_nu.sql om du inte hittar de du söker i texten nedan.


# Schema-uppdatering: Fakturaunderlag

**Datum:** 2025-11-22  
**Migration:** `20251122_invoice_system_improvements.sql`  
**Status:** ✅ Implementerad och körts framgångsrikt

## Översikt

Denna uppdatering lägger till komplett fakturaunderlag med:

- Löpande fakturanumrering per organisation och år
- OCR-nummer för automatisk betalningskoppling
- Påminnelse- och inkassospårning
- Exportkompatibilitet med Fortnox/Bokio/Visma

---

## 1. NY TABELL: `invoice_counters`

Håller reda på löpande fakturanummer per organisation.

```sql
CREATE TABLE invoice_counters (
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  current_year INT NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT 'INV',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, current_year)
);
```

**Exempel:**

- Org A, 2025: INV-2025-00001, INV-2025-00002, ...
- Org B, 2025: INV-2025-00001, INV-2025-00002, ...
- Org A, 2026: INV-2026-00001 (räknaren startar om)

---

## 2. NYA KOLUMNER I `orgs`

Betalningsinformation för fakturor:

| Kolumn               | Typ           | Default | Beskrivning                          |
| -------------------- | ------------- | ------- | ------------------------------------ |
| `bankgiro`           | TEXT          | NULL    | Bankgironummer (ex: 123-4567)        |
| `plusgiro`           | TEXT          | NULL    | Plusgironummer (ex: 12 34 56-7)      |
| `swish_number`       | TEXT          | NULL    | Swish-nummer (ex: 123 456 78 90)     |
| `bank_name`          | TEXT          | 'SEB'   | Bankens namn                         |
| `iban`               | TEXT          | NULL    | IBAN för internationella betalningar |
| `bic_swift`          | TEXT          | NULL    | BIC/SWIFT-kod                        |
| `payment_terms_days` | INT           | 14      | Betalningsvillkor (dagar)            |
| `late_fee_amount`    | NUMERIC(10,2) | 60.00   | Påminnelseavgift (kr)                |
| `interest_rate`      | NUMERIC(5,2)  | 8.00    | Dröjsmålsränta (% per år)            |
| `invoice_prefix`     | TEXT          | 'INV'   | Prefix för fakturanummer             |

**Användning:**
Företag kan konfigurera dessa i sina företagsinställningar för att fakturor ska visa korrekt betalningsinformation.

---

## 3. NYA KOLUMNER I `invoices`

Utökad spårning av betalningar och påminnelser:

| Kolumn              | Typ           | Default | Beskrivning                              |
| ------------------- | ------------- | ------- | ---------------------------------------- |
| `paid_at`           | TIMESTAMPTZ   | NULL    | När fakturan betalades (sätts manuellt)  |
| `payment_method`    | TEXT          | NULL    | Betalningsmetod (bankgiro/swish/kort)    |
| `reminder_1_date`   | DATE          | NULL    | Datum för första påminnelsen             |
| `reminder_2_date`   | DATE          | NULL    | Datum för andra påminnelsen              |
| `reminder_1_fee`    | NUMERIC(10,2) | 0       | Avgift första påminnelsen (ofta 0 kr)    |
| `reminder_2_fee`    | NUMERIC(10,2) | 0       | Avgift andra påminnelsen (60 kr)         |
| `collection_fee`    | NUMERIC(10,2) | 0       | Inkassoavgift (180 kr)                   |
| `late_interest`     | NUMERIC(10,2) | 0       | Beräknad dröjsmålsränta                  |
| `ocr_number`        | TEXT          | NULL    | OCR-nummer (16 siffror med Luhn-check)   |
| `payment_reference` | TEXT          | NULL    | Betalningsreferens (alternativ till OCR) |

**Status-uppdatering:**
Nya giltiga statusar:

- `draft` - Utkast
- `sent` - Skickad
- `paid` - Betald
- `cancelled` - Makulerad
- `overdue` - Förfallen (ej påmind)
- `reminder_1` - Första påminnelsen skickad
- `reminder_2` - Andra påminnelsen skickad
- `collection` - Skickad till inkasso

---

## 4. NYA FUNKTIONER

### `generate_invoice_number(org_id UUID)`

Genererar nästa löpande fakturanummer för en organisation.

**Exempel:**

```sql
SELECT generate_invoice_number('org-uuid-here');
-- Returnerar: 'INV-2025-00001'
```

### `set_invoice_number()` (TRIGGER)

Automatisk trigger som körs vid `INSERT` på `invoices` och sätter fakturanummer om det är NULL.

### `calculate_late_interest(invoice_id UUID)`

Beräknar dröjsmålsränta baserat på:

- Antal dagar försenad
- Organisations räntesats (default 8%)
- Fakturans totalbelopp

**Formel:**

```
Ränta = Belopp × (Räntesats / 100) × (Dagar / 365)
```

**Exempel:**

```sql
SELECT calculate_late_interest('invoice-uuid-here');
-- Returnerar: 43.84 (för 10 000 kr, 8%, 20 dagar)
```

### `update_invoice_with_fees(invoice_id UUID, reminder_level INT)`

Uppdaterar faktura med påminnelseavgifter och dröjsmålsränta.

**Användning:**

```sql
-- Första påminnelsen (0 kr avgift)
SELECT update_invoice_with_fees('invoice-uuid', 1);

-- Andra påminnelsen (60 kr avgift)
SELECT update_invoice_with_fees('invoice-uuid', 2);
```

---

## 5. NYA INDEX

För snabbare queries:

```sql
-- Hitta förfallna fakturor snabbt
CREATE INDEX idx_invoices_overdue
ON invoices(due_date, status)
WHERE status IN ('sent', 'overdue', 'reminder_1', 'reminder_2')
  AND paid_at IS NULL;

-- OCR-lookup
CREATE INDEX idx_invoices_ocr
ON invoices(ocr_number)
WHERE ocr_number IS NOT NULL;

-- Betalningsreferens-lookup
CREATE INDEX idx_invoices_payment_ref
ON invoices(payment_reference)
WHERE payment_reference IS NOT NULL;

-- Invoice counters lookup
CREATE INDEX idx_invoice_counters_org_year
ON invoice_counters(org_id, current_year);
```

---

## 6. ANVÄNDNINGSEXEMPEL

### Skapa ny faktura med auto-nummer

```sql
INSERT INTO invoices (org_id, owner_id, invoice_date, total_amount, billed_name)
VALUES (
  'org-uuid',
  'owner-uuid',
  CURRENT_DATE,
  5000.00,
  'Hundägare AB'
);
-- invoice_number genereras automatiskt: INV-2025-00001
```

### Markera faktura som betald

```sql
UPDATE invoices
SET
  status = 'paid',
  paid_at = NOW(),
  payment_method = 'bankgiro'
WHERE id = 'invoice-uuid';
```

### Skicka andra påminnelsen

```sql
-- Uppdatera med avgifter och ränta
SELECT update_invoice_with_fees('invoice-uuid', 2);

-- Markera som skickad
UPDATE invoices
SET
  status = 'reminder_2',
  reminder_2_date = CURRENT_DATE
WHERE id = 'invoice-uuid';
```

### Hitta förfallna fakturor

```sql
SELECT
  invoice_number,
  billed_name,
  total_amount,
  due_date,
  CURRENT_DATE - due_date as days_overdue
FROM invoices
WHERE status IN ('sent', 'overdue', 'reminder_1')
  AND paid_at IS NULL
  AND due_date < CURRENT_DATE
ORDER BY due_date;
```

---

## 7. INTEGRATION MED FRONTEND

### Komponenter som påverkas:

**Nya API-endpoints:**

- `GET /api/invoices/export` - Exportera till CSV/JSON/SIE
- `GET /api/invoices/[id]/pdf` - Uppdaterad med OCR och QR-kod
- `GET /api/cron/check-overdue-invoices` - Daglig monitoring (passiv)

**Uppdaterade komponenter:**

- `lib/ocrGenerator.ts` - OCR-generering med Luhn-algoritm
- `app/api/invoices/[id]/pdf/route.ts` - PDF med betalningsinformation

**UI-ändringar behövs i:**

- Företagsinställningar → Betalningsinformation (bankgiro, plusgiro, etc)
- Faktura-detaljvy → Visa OCR, betalningsstatus, påminnelser
- Faktura-lista → Filtrera på status (overdue, reminder_1, etc)

---

## 8. MIGRATION STATUS

✅ **Kördes framgångsrikt:** 2025-11-22

**Resultat:**

- `invoice_counters table`: 1 organisation
- `invoices with invoice_number`: 2 befintliga fakturor fick nummer
- `orgs with payment info`: 0 (inga testdata skapades)

**Nästa steg:**

1. Installera `qrcode` npm-paket för QR-koder i PDF
2. Konfigurera CRON_SECRET i Vercel för daglig monitoring
3. Lägg till UI för betalningsinformation i företagsinställningar
4. Testa fakturaskapande och PDF-generering
5. Informera företagskunder om nya funktioner

---

## 9. ROLLBACK-PLAN

Om problem uppstår, kör följande för att återställa:

```sql
-- Ta bort triggers
DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;
DROP FUNCTION IF EXISTS set_invoice_number();

-- Ta bort funktioner
DROP FUNCTION IF EXISTS generate_invoice_number(UUID);
DROP FUNCTION IF EXISTS calculate_late_interest(UUID);
DROP FUNCTION IF EXISTS update_invoice_with_fees(UUID, INT);

-- Ta bort tabell
DROP TABLE IF EXISTS invoice_counters;

-- Ta bort kolumner från orgs
ALTER TABLE orgs DROP COLUMN IF EXISTS bankgiro;
ALTER TABLE orgs DROP COLUMN IF EXISTS plusgiro;
ALTER TABLE orgs DROP COLUMN IF EXISTS swish_number;
ALTER TABLE orgs DROP COLUMN IF EXISTS bank_name;
ALTER TABLE orgs DROP COLUMN IF EXISTS iban;
ALTER TABLE orgs DROP COLUMN IF EXISTS bic_swift;
ALTER TABLE orgs DROP COLUMN IF EXISTS payment_terms_days;
ALTER TABLE orgs DROP COLUMN IF EXISTS late_fee_amount;
ALTER TABLE orgs DROP COLUMN IF EXISTS interest_rate;
ALTER TABLE orgs DROP COLUMN IF EXISTS invoice_prefix;

-- Ta bort kolumner från invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS paid_at;
ALTER TABLE invoices DROP COLUMN IF EXISTS payment_method;
ALTER TABLE invoices DROP COLUMN IF EXISTS reminder_1_date;
ALTER TABLE invoices DROP COLUMN IF EXISTS reminder_2_date;
ALTER TABLE invoices DROP COLUMN IF EXISTS reminder_1_fee;
ALTER TABLE invoices DROP COLUMN IF EXISTS reminder_2_fee;
ALTER TABLE invoices DROP COLUMN IF EXISTS collection_fee;
ALTER TABLE invoices DROP COLUMN IF EXISTS late_interest;
ALTER TABLE invoices DROP COLUMN IF EXISTS ocr_number;
ALTER TABLE invoices DROP COLUMN IF EXISTS payment_reference;

-- Återställ status constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'cancelled'));
```

---

## 10. RELATERAD DOKUMENTATION

- **Teknisk spec:** `FAKTURAUNDERLAG_BOKFÖRING.md`
- **Användarguide för företag:** `FAKTURAHANTERING_GUIDE.md`
- **Implementation summary:** `FAKTURAUNDERLAG_IMPLEMENTATION.md`
- **Migration SQL:** `supabase/migrations/20251122_invoice_system_improvements.sql`
- **OCR-generator:** `lib/ocrGenerator.ts`

---

**Skapad:** 2025-11-22  
**Senast uppdaterad:** 2025-11-22  
**Status:** ✅ Implementerad i produktion

---

# Schema-uppdatering: Frisörsystem med dynamiska priser

**Datum:** 2025-11-23  
**Migration:** `create_grooming_prices.sql`  
**Status:** ✅ Implementerad och körts framgångsrikt

## Översikt

Denna uppdatering lägger till databas-drivet prissystem för hundfrisörtjänster med:

- Dynamiska priser (inte hårdkodade i kod)
- Stöd för olika hundstorlekar (mini, small, medium, large, xlarge)
- Stöd för olika pälstyper (short, medium, long, wire, curly)
- Beräknad tid per behandling för kalenderplanering
- Admin-gränssnitt för att hantera priser
- Automatisk synkning mellan admin och bokningsflöde

---

## 1. NY TABELL: `grooming_prices`

Lagrar alla frisörtjänster och deras priser per organisation.

```sql
CREATE TABLE grooming_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    
    service_name TEXT NOT NULL,           -- Ex: "Badning", "Klippning"
    service_type TEXT NOT NULL,           -- Ex: "bath", "full_groom"
    description TEXT,                     -- Beskrivning av tjänsten
    
    dog_size TEXT CHECK (dog_size IN ('mini', 'small', 'medium', 'large', 'xlarge') OR dog_size IS NULL),
    coat_type TEXT CHECK (coat_type IN ('short', 'medium', 'long', 'wire', 'curly') OR coat_type IS NULL),
    
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, service_type, dog_size, coat_type)
);
```

**Indexering:**
- `idx_grooming_prices_org_id` på `org_id`
- `idx_grooming_prices_active` på `(org_id, active)` där `active = true`

**RLS Policies:**
- SELECT: Användare kan se priser i sin organisation
- ALL: Användare kan hantera priser i sin organisation

**Trigger:**
- `grooming_prices_updated_at` - Auto-uppdatera `updated_at` vid ändringar

**Exempel på användning:**

```sql
-- Lägg till badning för liten hund
INSERT INTO grooming_prices (org_id, service_name, service_type, dog_size, price, duration_minutes)
VALUES ('org-uuid', 'Badning - Liten hund', 'bath', 'small', 250.00, 45);

-- Lägg till klippning för medel hund med lång päls
INSERT INTO grooming_prices (org_id, service_name, service_type, dog_size, coat_type, price, duration_minutes)
VALUES ('org-uuid', 'Klippning - Medel hund (lång päls)', 'full_groom', 'medium', 'long', 650.00, 120);
```

---

## 2. ADMIN-GRÄNSSNITT

**Sida:** `/app/admin/hundfrisor/priser/page.tsx`

Komplett CRUD-gränssnitt där admin kan:

- ✅ Lägga till nya tjänster med priser
- ✅ Välja hundstorlek (dropdown med 5 alternativ)
- ✅ Välja pälstyp (dropdown med 5 alternativ)
- ✅ Ange beräknad tid i minuter
- ✅ Redigera befintliga priser
- ✅ Aktivera/deaktivera tjänster
- ✅ Ta bort tjänster

**Design:**
- Vit bakgrund på kort
- Grön primärfärg (#2c7a4c) med VIT text (#ffffff)
- Tydlig tabellstruktur med alternating rows
- Inline-redigering
- Responsiv design

---

## 3. BOKNINGSFLÖDE-UPPDATERING

**Fil:** `/app/frisor/ny-bokning/page.tsx`

**Innan:** Hårdkodad array `SERVICE_OPTIONS` med 7 statiska tjänster

**Efter:** Dynamisk hämtning från databas

```typescript
// Ny state
const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
const [loadingServices, setLoadingServices] = useState(true);

// Ny funktion
const loadGroomingPrices = async () => {
  const { data } = await supabase
    .from("grooming_prices")
    .select("*")
    .eq("org_id", currentOrgId)
    .eq("active", true);
  
  const transformed = data.map(price => ({
    value: price.service_type,
    label: price.service_name,
    basePrice: price.price,
    duration: price.duration_minutes,
    dog_size: price.dog_size,
    coat_type: price.coat_type,
  }));
  
  setServiceOptions(transformed);
};
```

**UI-förbättringar:**
- ✅ Loading state (spinner medan priser laddas)
- ✅ Empty state (hjälpsamt meddelande om inga priser finns)
- ✅ Visar hundstorlek i tjänstens label
- ✅ Kompaktare kundtyp-rutor (side-by-side layout)
- ✅ Vita behandlingskort istället för gröna (bättre läsbarhet)

---

## 4. DESIGN SYSTEM-UPPDATERING

**Fil:** `DESIGN_SYSTEM_V2.md`

Lagt till KRITISK REGEL:

```
⚠️ KRITISK REGEL: TEXT PÅ GRÖN BAKGRUND

ALLTID VIT TEXT (#FFFFFF) på grön bakgrund (#2C7A4C)
ALDRIG grå text på grön bakgrund (oläsligt)
```

**Exempel:**
- ✅ Rätt: `bg-[#2c7a4c] text-white`
- ❌ Fel: `bg-[#e6f4ea] text-gray-600`

---

## 5. FÖRDELAR MED NYA SYSTEMET

### För organisationer:
- ✅ Kan sätta egna priser utan att ändra kod
- ✅ Olika priser för olika hundstorlekar
- ✅ Olika priser för olika pälstyper
- ✅ Kan aktivera/deaktivera tjänster säsongsmässigt
- ✅ Kan uppdatera priser när som helst

### För utvecklare:
- ✅ Ingen hårdkodad data
- ✅ Org-isolerad (RLS säkerhet)
- ✅ Skalbart (lätt att lägga till fler varianter)
- ✅ Testbart (kan skapa mock-data)

### För användare:
- ✅ Ser alltid aktuella priser
- ✅ Priser anpassade efter deras hund
- ✅ Tydlig information om vad som ingår
- ✅ Beräknad tid visas

---

## 6. RELATERADE FILER

**Nya filer:**
- `app/admin/hundfrisor/priser/page.tsx` - Admin CRUD-gränssnitt
- `supabase/migrations/create_grooming_prices.sql` - Migration fil
- `GROOMING_PRICES.sql` - Ren SQL (lätt att köra)
- `KLART_FRISOR.md` - Deployment-guide
- `FRISOR_IMPLEMENTATION_GUIDE.md` - Teknisk dokumentation

**Modifierade filer:**
- `app/frisor/ny-bokning/page.tsx` - Dynamisk data-hämtning
- `DESIGN_SYSTEM_V2.md` - Färgkontrast-regler
- `supabase/schema.sql` - Denna fil (dokumentation)

---

## 7. FRAMTIDA FÖRBÄTTRINGAR

Möjliga utökningar:
- [ ] Auto-välja pris baserat på hundens storlek från profil
- [ ] Prishistorik/versionering
- [ ] Bulk-import av priser (CSV)
- [ ] Default-priser vid org-skapande
- [ ] Rabattkoder
- [ ] Paketpriser (t.ex. "Badning + Klippning" med rabatt)
- [ ] Säsongsbaserad prissättning

---

**Skapad:** 2025-11-23  
**Status:** ✅ Implementerad och deployad  
**Testning:** Genomförd med framgång
