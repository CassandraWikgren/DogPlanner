# PENSIONATSBOKNINGAR - KOMPLETT GUIDE

## 🎯 Översikt

Pensionatsbokningar i DogPlanner använder **BOOKINGS-tabellen**, inte en egen tabell. Detta dokument beskriver EXAKT hur pensionatsbokningar fungerar, vilka tabeller som är involverade, och hur data flödar genom systemet.

## 📊 Huvudtabell: BOOKINGS

`bookings`-tabellen används för **BÅDE** hunddagis och hundpensionat. `rooms.room_type` styr vilken typ av bokning det är.

### Bokningsstatus-flöde

```
pending (ansökan inskickad)
    ↓
confirmed (personal godkände)
    ↓ [trigger: skapa förskottsfaktura]
checked_in (hunden incheckat)
    ↓
checked_out (hunden utcheckat)
    ↓ [trigger: skapa efterskottsfaktura]
```

### Viktiga kolumner i bookings

```sql
-- Grundläggande
id uuid
org_id uuid          -- Vilket pensionat
dog_id uuid          -- Vilken hund
owner_id uuid        -- Vilken ägare
room_id uuid         -- Vilket rum (rooms.room_type: 'boarding' eller 'both')

-- Datum & tider
start_date date
end_date date
checkin_time time
checkout_time time

-- Status
status text          -- pending, confirmed, checked_in, checked_out, cancelled

-- Priser
base_price numeric
total_price numeric
discount_amount numeric
deposit_amount numeric
deposit_paid boolean

-- Gästhantering (tillagt 2025-11-15)
belongings text      -- "Leksak, filt, mat"
bed_location text    -- "Rum 3, Säng A"

-- Fakturering (tillagt 2025-11-01)
prepayment_status text
prepayment_invoice_id uuid     -- Förskottsfaktura (vid confirmed)
afterpayment_invoice_id uuid   -- Efterskottsfaktura (vid checked_out)

-- Avbokning (tillagt 2025-11-16)
cancellation_reason text
cancelled_at timestamptz
cancelled_by_user_id uuid

-- Extra tjänster
extra_service_ids jsonb        -- JSON array av service IDs
notes text
special_requests text
```

## 🔗 Relaterade tabeller

### 1. rooms

Rum där hunden bor. `room_type` styr om det är dagis, pensionat eller både och.

```sql
CREATE TABLE rooms (
  id uuid PRIMARY KEY,
  org_id uuid,
  name text,              -- "Stora rummet", "Pensionat A"
  capacity_m2 numeric,
  room_type text,         -- 'daycare', 'boarding', 'both'
  max_dogs integer,
  is_active boolean
);
```

**Viktigt:** rooms.room_type = 'boarding' eller 'both' för pensionat!

### 2. extra_services

Tjänstekatalog - admin definierar tillgängliga tjänster här.

```sql
CREATE TABLE extra_services (
  id uuid PRIMARY KEY,
  org_id uuid,
  label text,              -- "Kloklipp", "Bad", "Tandborstning"
  price numeric,
  unit text,               -- 'per gång', 'per dag', 'fast pris'
  service_type text,       -- 'boarding', 'daycare', 'grooming', 'both', 'all'
  is_active boolean
);
```

Används av:

- Admin för att skapa tjänster: `/app/hundpensionat/tillval/page.tsx`
- Bokningsformulär för att visa tillgängliga tjänster

### 3. booking_services

Loggar vilka tjänster som **faktiskt utfördes** under vistelsen.

```sql
CREATE TABLE booking_services (
  id uuid PRIMARY KEY,
  org_id uuid,
  booking_id uuid,         -- Kopplad till bookings!
  service_id uuid,         -- Referens till extra_services
  quantity integer,
  unit_price numeric,
  total_price numeric,
  staff_notes text,        -- "Utfört av Maria kl 14:00"
  performed_at timestamptz
);
```

**När används den?**

- Personal loggar tjänster i `/app/hundpensionat/aktiva-gaster/page.tsx`
- Visas i faktura vid utcheckning (trigger läser från booking_services)

### 4. pensionat_services

Alternativ tjänstekatalog (skiljer sig från extra_services).

```sql
CREATE TABLE pensionat_services (
  id uuid PRIMARY KEY,
  org_id uuid,
  label text,
  price numeric,
  description text,
  is_active boolean
);
```

**Skillnad mot extra_services:**

- `extra_services` = Generisk katalog (används av dagis, pensionat, frisör)
- `pensionat_services` = Pensionat-specifik katalog

**I praktiken:** Båda används, men extra_services är vanligare.

### 5. pension_stays

**ALTERNATIV TABELL** till bookings (används i månadsfakturering).

```sql
CREATE TABLE pension_stays (
  id uuid PRIMARY KEY,
  org_id uuid,
  dog_id uuid,
  owner_id uuid,
  start_date date,
  end_date date,
  base_price numeric,
  addons jsonb,            -- JSON array: [{name: 'Bad', price: 150}]
  total_amount numeric,
  status text,
  last_updated timestamptz
);
```

**När används den?**

- Edge Function `generate_invoices` (månadsvis fakturering)
- Används INTE av huvudsystemet (använder bookings istället)

**Varför finns den?**

- Historiska skäl (äldre implementering)
- Månadsvis fakturering läser från pension_stays OCH bookings

## 📝 Ansökningsflöde (Steg-för-steg)

### 1. Kund fyller i ansökan

**Sida:** `/app/ansokan/pensionat/page.tsx`

**Formulär:**

- Steg 0: Välj organisation (län, kommun, service_types)
- Steg 1: Ägarinformation (namn, telefon, e-post, personnummer)
- Steg 2: Hundinformation (namn, ras, storlek, ålder, kön)
- Steg 3: Bokningsperiod (start_date, end_date)
- Steg 4: Önskemål (allergier, medicinering, beteende)
- Steg 5: GDPR-samtycken (gdpr_consent, marketing_consent, photo_consent)

**Skapar:**

```javascript
// 1. Skapa ägare
const owner = await supabase.from("owners").insert({
  org_id: selectedOrgId,
  full_name,
  phone,
  email,
  address,
  postal_code,
  city,
  personnummer,
  gdpr_consent,
  marketing_consent,
  photo_consent,
});

// 2. Skapa hund
const dog = await supabase.from("dogs").insert({
  org_id: selectedOrgId,
  owner_id: owner.id,
  name,
  breed,
  birth,
  gender,
  heightcm,
  allergies,
  medications,
  special_needs,
  behavior_notes,
});

// 3. Skapa bokning
const booking = await supabase.from("bookings").insert({
  org_id: selectedOrgId,
  dog_id: dog.id,
  owner_id: owner.id,
  start_date,
  end_date,
  status: "pending",
  base_price: calculatePrice(dog.heightcm, start_date, end_date),
  special_requests,
});

// 4. Logga GDPR-samtycke
await supabase.from("consent_logs").insert({
  owner_id: owner.id,
  org_id: selectedOrgId,
  consent_type: "digital_email",
  consent_given: true,
  consent_text: "Fullständig samtyckes-text här...",
  ip_address: req.ip,
  given_at: new Date(),
});
```

### 2. Personal ser ansökan

**Sida:** `/app/hundpensionat/ansokningar/page.tsx`

**Query:**

```javascript
const { data: bookings } = await supabase
  .from("bookings")
  .select(
    `
    *,
    dogs:dogs(*),
    owners:owners(*),
    rooms:rooms(*)
  `
  )
  .eq("org_id", currentOrgId)
  .eq("status", "pending")
  .order("created_at", { ascending: false });
```

**Actions:**

- Godkänn → `status = 'confirmed'`
- Avböj → `status = 'cancelled'`
- Redigera → Öppna modal för att ändra rum, datum, priser

### 3. Godkännande → Förskottsfaktura

**Trigger:** `trg_create_prepayment_invoice`

```sql
CREATE TRIGGER trg_create_prepayment_invoice
BEFORE UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
EXECUTE FUNCTION create_prepayment_invoice();
```

**Vad händer:**

1. Skapar faktura i `invoices` med `invoice_type='prepayment'`
2. Sätter `bookings.prepayment_invoice_id`
3. Skapar invoice_items för grundpris + valda tillägg

### 4. Incheckning

**Sida:** `/app/hundpensionat/ansokningar/page.tsx` (eller aktiva gäster)

**Action:**

```javascript
await supabase
  .from("bookings")
  .update({
    status: "checked_in",
    checkin_time: new Date().toTimeString(),
    belongings: "Leksak, filt, mat",
    bed_location: "Rum 3, Säng A",
  })
  .eq("id", bookingId);
```

### 5. Under vistelse - Logga tjänster

**Sida:** `/app/hundpensionat/aktiva-gaster/page.tsx`

**Action:**

```javascript
// Personal utför kloklipp
await supabase.from("booking_services").insert({
  org_id: currentOrgId,
  booking_id: bookingId,
  service_id: "uuid-for-kloklipp",
  quantity: 1,
  unit_price: 150,
  total_price: 150,
  staff_notes: "Utfört av Maria",
  performed_at: new Date(),
});
```

### 6. Utcheckning → Efterskottsfaktura

**Trigger:** `trg_create_invoice_on_checkout`

```sql
CREATE TRIGGER trg_create_invoice_on_checkout
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'checked_out' AND OLD.status != 'checked_out')
EXECUTE FUNCTION create_invoice_on_checkout();
```

**Vad händer:**

1. Beräknar antal nätter
2. Hämtar alla `booking_services` för bokningen
3. Hämtar alla `extra_service` (återkommande tillägg) för hunden
4. Skapar faktura med:
   - RAD 1: Grundpris (logi)
   - RAD 2: Utförda tjänster (booking_services)
   - RAD 3: Återkommande tillägg (extra_service)
   - RAD 4: Rabatt (om finns)
5. Sätter `bookings.afterpayment_invoice_id`

## 🔐 RLS Policies

### Public kan skapa (för ansökningar)

```sql
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
```

### Authenticated ser endast sin org

```sql
CREATE POLICY "bookings_org_select" ON bookings
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

## 💰 Prisberäkning

### Grundpris (base_price)

Baserat på hundens höjd (heightcm):

```javascript
function calculateBasePrice(heightcm, start_date, end_date) {
  const nights = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24));

  // Bestäm hundstorlek
  let dog_size;
  if (heightcm <= 40) dog_size = 'small';
  else if (heightcm <= 60) dog_size = 'medium';
  else dog_size = 'large';

  // Hämta pris från boarding_prices
  const { data: priceRow } = await supabase
    .from('boarding_prices')
    .select('base_price, weekend_surcharge')
    .eq('org_id', currentOrgId)
    .eq('dog_size', dog_size)
    .single();

  let totalPrice = 0;

  // Loopa igenom varje natt
  for (let i = 0; i < nights; i++) {
    const date = new Date(start_date);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay(); // 0=söndag, 6=lördag

    // Kolla special_dates först
    const specialDate = await checkSpecialDate(date);
    if (specialDate) {
      totalPrice += priceRow.base_price + specialDate.price_surcharge;
    } else if (dayOfWeek >= 5) { // Fredag, lördag, söndag
      totalPrice += priceRow.base_price + priceRow.weekend_surcharge;
    } else {
      totalPrice += priceRow.base_price;
    }
  }

  // Applicera säsong-multiplikator (boarding_seasons)
  const season = await checkSeason(start_date, end_date);
  if (season) {
    totalPrice *= season.price_multiplier;
  }

  return totalPrice;
}
```

### Totalpris (total_price)

```javascript
total_price =
  base_price +
  sum(booking_services.total_price) +
  sum(extra_service.price) -
  discount_amount;
```

## 📱 Viktiga sidor

### Admin/Personal

- `/app/hundpensionat/ansokningar` - Alla ansökningar (pending)
- `/app/hundpensionat/aktiva-gaster` - Aktiva bokningar (checked_in)
- `/app/hundpensionat/kalender` - Översikt över alla bokningar
- `/app/hundpensionat/tillval` - Hantera extra_services
- `/app/hundpensionat/priser` - Hantera boarding_prices, special_dates, boarding_seasons
- `/app/admin/faktura` - Visa fakturor

### Kund (Public)

- `/app/ansokan/pensionat` - Ansökningsformulär (public, ingen inloggning)
- `/app/kundportal/mina-bokningar` - Visa mina bokningar (kräver inloggning)

## 🔄 Månadsvis fakturering (Edge Function)

**Function:** `generate_invoices`  
**Körs:** 1:a varje månad kl 08:00 UTC (GitHub Actions)

**Läser från:**

1. `dogs` + `owners` (grupperar per ägare)
2. `subscriptions` (hundabonnemang, t.ex. "Deltid 3")
3. `extra_service` (återkommande tillägg, t.ex. "Kloklipp 1ggr/mån")
4. `pension_stays` (pensionatsvistelser under månaden)

**Skapar:**

- `invoices` (invoice_type='full')
- `invoice_items` (en rad per tjänst)

## ❗ Viktigt att veta

### BOOKINGS vs PENSION_STAYS

- **BOOKINGS** = Huvudsystem (används överallt)
- **PENSION_STAYS** = Alternativ tabell (används endast i månadsvis fakturering)

### Extra Services vs Booking Services

- **extra_services** = Tjänstekatalog (admin skapar)
- **booking_services** = Vad som faktiskt utfördes (personal loggar)

### Org Scoping

- Alla tabeller har `org_id`
- RLS filtrerar automatiskt: `org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())`
- Triggers sätter `org_id` automatiskt vid INSERT

### Kundportal

- Använder `owner_id` (inte `profiles.id`)
- Ett kundkonto fungerar hos ALLA pensionat
- `customer_number` är UNIK per owner (org-oberoende)

## 🐛 Felsökning

### "Ingen organisation tilldelad"

→ Kolla att `orgs.service_types` innehåller `'hundpensionat'`  
→ Kolla att `orgs.is_visible_to_customers = true`

### "RLS policy violation"

→ Kolla att användaren har `profiles.org_id` satt  
→ Kolla att bookings har korrekt `org_id`

### "Faktura skapas inte"

→ Kolla att triggers är aktiverade: `SELECT * FROM pg_trigger WHERE tgname LIKE '%invoice%';`  
→ Kolla trigger-loggar: `SELECT * FROM function_logs WHERE function_name LIKE '%invoice%';`

### "Pris blir fel"

→ Kolla `boarding_prices` (grundpris per storlek)  
→ Kolla `special_dates` (specialdatum kan overridea weekend_surcharge)  
→ Kolla `boarding_seasons` (multiplikator appliceras sist)

## 📞 Support

Vid frågor, kolla:

- `supabase/schema.sql` - Fullständig tabell-dokumentation
- `SCHEMA_UPPDATERING_2025-11-19.md` - Senaste ändringar
- `SYSTEMDOKUMENTATION.md` - Övergripande guide
