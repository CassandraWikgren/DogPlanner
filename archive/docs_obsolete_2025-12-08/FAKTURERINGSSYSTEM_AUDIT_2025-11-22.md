# FAKTURERINGSSYSTEM - KOMPLETT AUDIT

**Datum:** 2025-11-22  
**Syfte:** Verifiera att ALLA företagsinkomster faktureras korrekt  
**Status:** ⚠️ KRITISKA BRISTER FUNNA

---

## 🔴 SAMMANFATTNING - KRITISKA PROBLEM

### ❌ Problem 1: Hunddagis faktureras INTE automatiskt

**Påverkan:** FÖRETAGEN FÖRLORAR PENGAR VARJE MÅNAD

**Nuläge:**

- Hunddagis (abonnemang) faktureras via MANUELL Edge Function (`generate_invoices`)
- Körs via GitHub Actions 1:a varje månad kl 08:00 UTC
- **INGEN automatisk fakturering om cron failar**
- Ingen backup-mekanism

\*\*Beh

över:\*\*

- Supabase scheduled Edge Function istället för GitHub Actions
- Automatisk retry vid fel
- Notifikation om fakturagenerering misslyckas

---

### ⚠️ Problem 2: Rabatter på hunddagis hanteras INTE

**Påverkan:** FÖRETAGEN KAN INTE GE KUNDRABATTER KORREKT

**Nuläge:**

- `owner_discounts` tabell finns i databasen
- `dogs` tabell har inga discount-kolumner
- Edge Function `generate_invoices` läser INTE rabatter
- Syskonrabatt (`daycare_pricing.sibling_discount_percent`) ignoreras

**Behöver:**

- Integrera `owner_discounts` i fakturagenereringen
- Beräkna syskonrabatt automatiskt
- Visa rabatt på fakturan som separat rad

---

### ⚠️ Problem 3: Tilläggsabonnemang (extra_service) saknas på dagisfakturor

**Påverkan:** FÖRETAGEN FAKTURERAR INTE FÖR EXTRA TJÄNSTER

**Nuläge:**

- `extra_service` tabellen har kopplingar dogs_id + org_id
- Edge Function läser INTE `extra_service` för hunddagis
- Endast pensionat (checkout-trigger) läser `extra_service`

**Behöver:**

- Lägg till `extra_service` i månadsfakturering
- Beräkna antal förekomster per månad baserat på `frequency`
- Summera och lägg till på fakturan

---

## 📊 FAKTURAFLÖDEN - KOMPLETT KARTLÄGGNING

### 🏨 HUNDPENSIONAT (FUNGERAR BRA ✅)

#### Trigger 1: Förskottsfaktura

```sql
CREATE TRIGGER trg_create_prepayment_invoice
BEFORE UPDATE ON bookings
WHEN (status = 'confirmed' AND old.status = 'pending')
```

**Vad händer:**

1. Bokning godkänns (pending → confirmed)
2. `create_prepayment_invoice()` körs
3. Skapar faktura med `invoice_type = 'prepayment'`
4. Beräknar belopp från `bookings.total_price`
5. Drar bort afterpayment-tjänster från `extra_service_ids`
6. Sätter `bookings.prepayment_invoice_id`

**Vad inkluderas:**

- ✅ Rumsbokning (base_price)
- ✅ Prepayment-tjänster (om markerade)
- ❌ Rabatter (finns inte i systemet ännu)

**Förfallodatum:** MIN(14 dagar, 3 dagar innan start_date)

---

#### Trigger 2: Efterskottsfaktura (vid utcheckning)

```sql
CREATE TRIGGER trg_create_invoice_on_checkout
AFTER UPDATE ON bookings
WHEN (status = 'checked_out' AND old.status != 'checked_out')
```

**Vad händer:**

1. Bokning checkas ut (any → checked_out)
2. `create_invoice_on_checkout()` körs
3. Skapar faktura med `invoice_type = 'afterpayment'`
4. Läser från flera källor
5. Sätter `bookings.afterpayment_invoice_id`

**Fakturarader som skapas:**

#### RAD 1: Grundpris (logi)

```sql
INSERT INTO invoice_items (
  description: 'Hundpensionat {start_date} - {end_date} ({nights} nätter)',
  quantity: nights,
  unit_price: base_amount / nights,
  total_amount: base_amount
)
```

- **Källa:** `bookings.total_price` eller `bookings.base_price`
- **Problem:** ❌ INGEN koppling till `boarding_prices` tabell!
- **Risk:** Prisändring i `boarding_prices` påverkar INTE befintliga bokningar

---

#### RAD 2: Tillval (booking_services)

```sql
FOR v_booking_service IN
  SELECT bs.*, ps.label
  FROM booking_services bs
  LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
  WHERE bs.booking_id = NEW.id
```

- **Källa:** `booking_services` tabell
- **Fält:** quantity, unit_price, total_price, staff_notes
- **Visas som:** "{service_name} - {staff_notes}"
- **Status:** ✅ FUNGERAR BRA

---

#### RAD 3: Återkommande tillägg (extra_service)

```sql
FOR v_extra_service IN
  SELECT service_type, frequency, price, notes
  FROM extra_service
  WHERE dogs_id = NEW.dog_id
    AND org_id = NEW.org_id
    AND is_active = true
    AND start_date <= NEW.end_date
    AND (end_date IS NULL OR end_date >= NEW.start_date)
```

- **Källa:** `extra_service` tabell (tillägg kopplade till hunden)
- **Fält:** service_type, frequency, price, notes
- **Pris:** Hämtar från `extra_service.price` eller `extra_services` katalog
- **Status:** ✅ FUNGERAR BRA
- **Problem:** ❌ Beräknar INTE frekvens (daily/weekly) × antal dagar

---

#### RAD 4: Rabatt

```sql
IF NEW.discount_amount > 0 THEN
  INSERT INTO invoice_items (
    description: 'Rabatt',
    quantity: 1,
    unit_price: -discount_amount,
    total_amount: -discount_amount
  )
END IF
```

- **Källa:** `bookings.discount_amount`
- **Status:** ✅ FUNGERAR
- **Problem:** ⚠️ INGEN koppling till `owner_discounts` tabell!
- **Saknas:** Ingen auto-applicering av rabatter vid bokning

---

### 🐕 HUNDDAGIS (STORA BRISTER ⚠️)

#### Edge Function: `generate_invoices`

**Körs:** Manuellt eller via GitHub Actions 1:a varje månad kl 08:00 UTC

**Workflow:**

```typescript
1. Hämta alla aktiva hundar med subscription:
   SELECT * FROM dogs
   WHERE subscription IS NOT NULL
     AND startdate <= current_month
     AND (enddate IS NULL OR enddate >= current_month)

2. Gruppera per owner_id
3. För varje ägare:
   a. Beräkna månadspris från daycare_pricing
   b. Skapa en faktura per ägare
   c. Lägg till rader för varje hund

4. Skapa invoice + invoice_items
5. Skicka email-notifiering (om configured)
```

**Problem identifierade:**

#### ❌ Problem 2.1: INGEN automatisk körning

- Beror på GitHub Actions (kan faila tyst)
- Ingen logging om fel uppstår
- Ingen retry-mekanism
- Företaget får INGEN notifikation om fakturering misslyckas

**Lösning:**

```sql
-- Migrera till Supabase Cron Jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'monthly-invoice-generation',
  '0 8 1 * *', -- 08:00 första dagen varje månad
  $$
    SELECT net.http_post(
      url := 'https://fhdkkkujnhteetllxypg.supabase.co/functions/v1/generate_invoices',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key') || '"}',
      body := '{"month": "' || to_char(CURRENT_DATE, 'YYYY-MM') || '"}'
    );
  $$
);
```

---

#### ❌ Problem 2.2: Rabatter ignoreras

**Kod i `generate_invoices/index.ts`:**

```typescript
// FINNS INTE - sökning efter "discount" ger 0 resultat!
// Ingen läsning från owner_discounts tabell
// Ingen syskonrabatt-beräkning
```

**Vad som BORDE hända:**

```typescript
// 1. Läs rabatter från owner_discounts
const { data: discounts } = await supabase
  .from('owner_discounts')
  .select('*')
  .eq('owner_id', owner.id)
  .eq('org_id', org_id)
  .gte('valid_until', new Date().toISOString())
  .eq('is_active', true);

// 2. Beräkna syskonrabatt
const { data: pricing } = await supabase
  .from('daycare_pricing')
  .select('sibling_discount_percent')
  .eq('org_id', org_id)
  .single();

if (dogsInFamily.length > 1 && pricing.sibling_discount_percent > 0) {
  const siblingDiscount = totalPrice * (pricing.sibling_discount_percent / 100);
  lines.push({
    description: `Syskonrabatt (${pricing.sibling_discount_percent}%)`,
    quantity: 1,
    unit_price: -siblingDiscount,
    total: -siblingDiscount
  });
  totalPrice -= siblingDiscount;
}

// 3. Applicera owner_discounts
discounts.forEach(discount => {
  if (discount.discount_type === 'percentage') {
    const amount = totalPrice * (discount.discount_value / 100);
    lines.push({
      description: discount.description || 'Rabatt',
      quantity: 1,
      unit_price: -amount,
      total: -amount
    });
    totalPrice -= amount;
  } else if (discount.discount_type === 'fixed') {
    lines.push({
      description: discount.description || 'Rabatt',
      quantity: 1,
      unit_price: -discount.discount_value,
      total: -discount.discount_value
    });
    totalPrice -= discount.discount_value;
  }
});
```

---

#### ❌ Problem 2.3: extra_service ignoreras

**Kod i `generate_invoices/index.ts`:**

```typescript
// FINNS INTE - ingen läsning av extra_service för hunddagis!
```

**Vad som BORDE hända:**

```typescript
// För varje hund, läs tilläggsabonnemang
const { data: extraServices } = await supabase
  .from('extra_service')
  .select('*')
  .eq('dogs_id', dog.id)
  .eq('org_id', org_id)
  .eq('is_active', true)
  .lte('start_date', monthEnd)
  .or(`end_date.is.null,end_date.gte.${monthStart}`);

extraServices.forEach(service => {
  let quantity = 1;

  // Beräkna antal baserat på frequency
  if (service.frequency === 'daily') {
    quantity = daysInMonth; // Antal dagar hunden går
  } else if (service.frequency === 'weekly') {
    quantity = Math.ceil(daysInMonth / 7);
  } // else monthly = 1

  lines.push({
    description: `${service.service_type} (${dog.name})`,
    quantity: quantity,
    unit_price: service.price,
    total: quantity * service.price
  });

  totalPrice += quantity * service.price;
});
```

---

#### ⚠️ Problem 2.4: Beräkning av dagar fel

**Nuvarande kod (approximation):**

```typescript
// Kod läser subscription ("Heltid", "Deltid 3", "Deltid 2")
// Men beräknar INTE exakta dagar från dogs.days
```

**Vad som BORDE hända:**

```typescript
function calculateActualDays(dog: Dog, month: string): number {
  if (!dog.days) return 0;

  const daysArray = dog.days.split(',').map(d => d.trim());
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });

    // Kolla om hunden går denna dag
    if (daysArray.includes(dayName)) {
      count++;
    }
  }

  return count;
}

// Använd i beräkning
const actualDays = calculateActualDays(dog, month);
const dailyRate = monthlyPrice / expectedDaysPerMonth;
const adjustedPrice = dailyRate * actualDays;
```

---

## 🔍 DATABAS-KOPPLINGAR

### ✅ Pensionat → Faktura (FUNKAR)

```
bookings
  ├─ org_id → orgs
  ├─ owner_id → owners
  ├─ dog_id → dogs
  ├─ room_id → rooms
  ├─ total_price (beräknat från boarding_prices + booking_services + extra_service)
  ├─ discount_amount (manuellt insatt)
  ├─ prepayment_invoice_id → invoices
  └─ afterpayment_invoice_id → invoices

bookings → invoice_items:
  RAD 1: Grundpris (logi)
  RAD 2: booking_services (tillval vid bokning)
  RAD 3: extra_service (återkommande tillägg)
  RAD 4: Rabatt (från discount_amount)
```

### ⚠️ Hunddagis → Faktura (BRISTER)

```
dogs
  ├─ org_id → orgs
  ├─ owner_id → owners
  ├─ subscription ("Heltid", "Deltid 3", "Deltid 2")
  ├─ days ("Måndag,Tisdag,Onsdag")
  ├─ startdate
  └─ enddate

daycare_pricing (per org)
  ├─ subscription_fulltime (5 dagar/vecka)
  ├─ subscription_parttime_3days
  ├─ subscription_parttime_2days
  ├─ single_day_price
  ├─ additional_day_price
  ├─ sibling_discount_percent ❌ ANVÄNDS INTE
  └─ trial_day_price

owner_discounts ❌ ANVÄNDS INTE
  ├─ owner_id → owners
  ├─ discount_type (percentage/fixed)
  ├─ discount_value
  ├─ valid_from
  ├─ valid_until
  └─ is_active

extra_service ❌ ANVÄNDS INTE FÖR DAGIS
  ├─ dogs_id → dogs
  ├─ org_id → orgs
  ├─ service_type ("Foder", "Medicin", "Extra promenad")
  ├─ frequency ("daily", "weekly", "monthly")
  ├─ price
  ├─ start_date
  └─ end_date

generate_invoices() Edge Function
  ├─ Läser dogs.subscription
  ├─ Läser daycare_pricing
  ├─ ❌ LÄSER INTE owner_discounts
  ├─ ❌ LÄSER INTE extra_service
  ├─ ❌ BERÄKNAR INTE syskonrabatt
  └─ ❌ BERÄKNAR INTE exakta dagar
```

---

## 🎯 REKOMMENDATIONER - PRIORITERAD LISTA

### 🔴 KRITISKT (Gör NU - företag förlorar pengar)

#### 1. Migrera hunddagis-fakturering till Supabase Cron

**Varför:** GitHub Actions är opålitlig, ingen error-handling
**Hur:**

- Aktivera `pg_cron` extension
- Schemalägg `generate_invoices` Edge Function
- Lägg till error-notification via email
- Logga alla körningar i `invoice_runs` tabell

**Kod:** Se Problem 2.1 ovan

---

#### 2. Lägg till rabatter i hunddagis-fakturering

**Varför:** Företag kan inte ge kundrabatter korrekt
**Hur:**

- Uppdatera `generate_invoices/index.ts`
- Läs `owner_discounts` tabell
- Beräkna syskonrabatt från `daycare_pricing.sibling_discount_percent`
- Lägg till rabatt-rader på fakturan

**Kod:** Se Problem 2.2 ovan

---

#### 3. Lägg till extra_service i hunddagis-fakturering

**Varför:** Företag fakturerar INTE för tilläggsabonnemang
**Hur:**

- Uppdatera `generate_invoices/index.ts`
- Läs `extra_service` för varje hund
- Beräkna antal förekomster baserat på frequency
- Lägg till på fakturan

**Kod:** Se Problem 2.3 ovan

---

### ⚠️ VIKTIGT (Gör inom 1 vecka)

#### 4. Fixa dagberäkning i hunddagis

**Varför:** Fel pris om hund inte går alla dagar
**Hur:**

- Beräkna exakta dagar från `dogs.days` + kalender
- Justera pris baserat på faktiska dagar
- Visa "X dagar à Y kr = Z kr" på fakturan

**Kod:** Se Problem 2.4 ovan

---

#### 5. Koppla pensionat till boarding_prices

**Problem:** Prisändring i `boarding_prices` påverkar inte bokningar
**Lösning:**

- Vid bokning: läs pris från `boarding_prices`
- Spara i `bookings.base_price`
- Vid utcheckning: använd sparat pris (ej ny lookup)

---

#### 6. Lägg till auto-rabatter vid pensionat-bokning

**Problem:** Rabatter måste matas in manuellt
**Lösning:**

- Vid bokning: läs `owner_discounts`
- Applicera automatiskt
- Visa på bokningsbekräftelse
- Spara i `bookings.discount_amount`

---

### 💡 BRA ATT HA (Gör när tid finns)

#### 7. Unified invoice API

Skapa ett gemensamt API för ALLA fakturatyper:

```typescript
POST /api/invoices/create
{
  type: "daycare_monthly" | "pension_prepayment" | "pension_afterpayment",
  owner_id: uuid,
  dog_ids: uuid[],
  period: { start: date, end: date },
  auto_apply_discounts: boolean
}
```

---

#### 8. Invoice preview

Visa faktura INNAN den skapas:

- För hunddagis: "Kommande faktura i slutet av månaden"
- För pensionat: "Förhandsvisning av faktura vid utcheckning"

---

#### 9. Batch-processing för stora organisationer

Om en organisation har 100+ hundar:

- Kör fakturering i background job
- Visa progress bar
- Skicka email när klar

---

## 📋 TEST-CHECKLISTA

När fixarna är implementerade, testa:

### Hundpensionat:

- [ ] Skapa bokning med tillval (booking_services)
- [ ] Skapa bokning med återkommande tillägg (extra_service)
- [ ] Lägg till rabatt manuellt på bokning
- [ ] Godkänn bokning → förskottsfaktura skapas
- [ ] Checka ut → efterskottsfaktura skapas
- [ ] Verifiera alla rader finns på fakturan
- [ ] Verifiera totalbelopp stämmer

### Hunddagis:

- [ ] Skapa hund med Heltid-abonnemang
- [ ] Skapa hund med Deltid 3
- [ ] Lägg till syskon (samma owner_id)
- [ ] Lägg till extra_service på en hund
- [ ] Lägg till owner_discount
- [ ] Kör månadsfakturering manuellt
- [ ] Verifiera syskonrabatt appliceras
- [ ] Verifiera owner_discount appliceras
- [ ] Verifiera extra_service finns på fakturan
- [ ] Verifiera antal dagar beräknas korrekt

### Edge cases:

- [ ] Hund startar mitt i månad → pro-rata beräkning
- [ ] Hund slutar mitt i månad → pro-rata beräkning
- [ ] Rabatt större än pris → faktura = 0 kr
- [ ] Extra_service startar/slutar mitt i period
- [ ] Flera rabatter samtidigt → korrekt ordning

---

## 🔗 RELATERADE FILER

**Pensionat-triggers:**

- `supabase/migrations/20251122160200_remote_schema.sql` (rad 578-940)
- `create_invoice_on_checkout()` - efterskottsfaktura
- `create_prepayment_invoice()` - förskottsfaktura

**Hunddagis-fakturering:**

- `supabase/functions/generate_invoices/index.ts` - månadsfakturering
- `.github/workflows/auto_generate_invoices.yml` - cron-trigger

**Prissättning:**

- `lib/pricing.ts` - prisberäkningar
- `lib/pensionatCalculations.ts` - pensionatpriser
- `lib/roomCalculator.ts` - rumskap acitet

**Tabeller:**

- `bookings` - pensionatbokningar
- `dogs` - hunddagis (abonnemang)
- `invoices` - alla fakturor
- `invoice_items` - fakturarader
- `daycare_pricing` - dagisprislist
- `boarding_prices` - pensionatprislist
- `owner_discounts` - kundrabatter ⚠️ ANVÄNDS INTE
- `extra_service` - tilläggsabonnemang
- `booking_services` - tillval vid bokning

---

**Skapad:** 2025-11-22  
**Status:** 🔴 BRISTER FUNNA - AKUT ÅTGÄRD KRÄVS  
**Nästa steg:** Implementera fix #1-3 omedelbart
