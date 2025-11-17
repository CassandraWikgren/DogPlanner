# 🔍 DOGPLANNER SYSTEMANALYS - KOMPLETT GENOMGÅNG

**Datum:** 2025-11-17  
**Syfte:** Helhetsgranskning av systemet från alla perspektiv

---

## 📊 EXECUTIVE SUMMARY

### ✅ Vad som fungerar bra:

1. **Solid teknisk grund**: Next.js 15, React 19, Supabase, TypeScript
2. **Auth-system**: Triple-redundant org_id assignment (3-lagers säkerhet)
3. **Databasstruktur**: Väldefinierade relationer med FK constraints
4. **Modulär arkitektur**: Tydlig separation mellan admin/staff/kund-gränssnitt

### ⚠️ Kritiska brister identifierade:

1. **BROKEN: Ansökningsflöde** → Ingen koppling mellan ansökan och bokning
2. **MISSING: Faktureringssystem** → Ingen automatisk fakturagenering
3. **INCOMPLETE: Email-notifikationer** → Saknas för de flesta händelser
4. **FRAGILE: Organisation Selector** → Kräver manuell data-ifyllning

---

## 🗺️ ANVÄNDARFLÖDEN - ANALYS

### 1. 🐕 KUNDFLÖDE (Hundägare söker dagis/pensionat)

#### Steg 1: Landing Page → Ansökan

**Status:** ✅ FUNGERAR

- **URL:** `/` → `/ansokan/hunddagis` eller `/ansokan/pensionat`
- **Komponenter:**
  - `app/page.tsx` (B2C landing)
  - `app/ansokan/hunddagis/page.tsx`
  - `app/ansokan/pensionat/page.tsx`
  - `components/OrganisationSelector.tsx` (NY)
  - `components/DogBreedSelect.tsx` (NY)

**Dataflöde:**

```
1. Kund fyller formulär:
   - Väljer län/kommun → Väljer pensionat
   - Hundinfo (ras dropdown, ålder, vaccinationer)
   - Ägarinfo (personnummer, telefon, etc.)

2. Formulär skickas till Supabase:
   INSERT INTO pending_bookings (
     org_id,           ← från OrganisationSelector
     dog_name,
     dog_breed,        ← från DogBreedSelect (557 raser)
     dog_birth,
     owner_name,
     owner_phone,
     owner_email,
     booking_type,     ← 'daycare' | 'boarding'
     start_date,
     end_date,
     status            ← 'pending'
   )
```

**✅ Styrkor:**

- Clean UI med stegvis process
- Organisationsfiltrering (län/kommun)
- Standardiserade hundraser (557 st)
- Validering på klientsidan

**❌ KRITISKA BRISTER:**

```diff
- INGET BEKRÄFTELSEMAIL skickas till kunden
- INGEN NOTIFIERING till pensionatet
- INGEN KUNDPORTAL för uppföljning av ansökan
- STATUS finns bara i DB, ingen UI för kund att se den
```

---

#### Steg 2: Ansökan → Godkännande (BROKEN CHAIN)

**Status:** 🔴 BROKEN

**Förväntad kedja:**

```
pending_bookings (status='pending')
  → Admin ser ansökan i /hundpensionat/ansokningar
  → Admin godkänner
  → Skapar owner i owners-tabellen
  → Skapar dog i dogs-tabellen
  → Skapar booking i bookings-tabellen
  → Status: pending_bookings.status = 'approved'
  → Email till kund: "Din ansökan är godkänd!"
```

**VERKLIG SITUATION:**

```typescript
// app/hundpensionat/ansokningar/page.tsx finns
// MEN: Inget automatiskt flöde för att skapa owner + dog + booking
// MAN MÅSTE MANUELLT:
// 1. Gå till /owners → Skapa ägare
// 2. Gå till /hundpensionat/nybokning → Skapa bokning
// 3. Kopiera data MANUELLT från pending_bookings
```

**🔥 FIX REQUIRED:**

```typescript
// SAKNAS: "Godkänn ansökan"-knapp som gör:
async function approveApplication(pendingId: string) {
  // 1. Skapa owner
  const { data: owner } = await supabase
    .from("owners")
    .insert({
      full_name: pending.owner_name,
      email: pending.owner_email,
      phone: pending.owner_phone,
      org_id: pending.org_id,
    })
    .select()
    .single();

  // 2. Skapa dog
  const { data: dog } = await supabase
    .from("dogs")
    .insert({
      name: pending.dog_name,
      breed: pending.dog_breed,
      owner_id: owner.id,
      org_id: pending.org_id,
    })
    .select()
    .single();

  // 3. Skapa booking
  await supabase.from("bookings").insert({
    dog_id: dog.id,
    start_date: pending.start_date,
    end_date: pending.end_date,
    org_id: pending.org_id,
    status: "confirmed",
  });

  // 4. Uppdatera pending_bookings
  await supabase
    .from("pending_bookings")
    .update({ status: "approved" })
    .eq("id", pendingId);

  // 5. SKICKA EMAIL till kund
  await sendApprovalEmail(pending.owner_email, dog.name);
}
```

---

#### Steg 3: Kundportal (INCOMPLETE)

**Status:** ⚠️ PARTIALLY COMPLETE

**Vad som finns:**

- `/kundportal/login` - Separat login för kunder ✅
- `/kundportal/dashboard` - Dashboard ✅
- `/kundportal/mina-hundar` - Lista hundar ✅
- `/kundportal/mina-bokningar` - Lista bokningar ✅

**Vad som SAKNAS:**

```diff
- Länk till kundportal från ansökningsbekräftelse
- "Skapa konto"-knapp efter godkänd ansökan
- Email med inloggningsinstruktioner
- "Spåra min ansökan"-funktion
- Notifikationer vid statusändring
```

---

### 2. 👔 FÖRETAGSFLÖDE (Pensionat registrerar sig)

#### Steg 1: Landing → Registrering

**Status:** ✅ FUNGERAR

- **URL:** `/foretag` → `/register`
- **Dataflöde:**

```
1. Företag fyller registreringsformulär:
   - Företagsnamn
   - Organisationsnummer
   - Telefon
   - Email

2. Supabase Auth: Skapar användare
3. Trigger: on_auth_user_created
4. Function: handle_new_user()
   → Skapar organisation i orgs
   → Skapar profil i profiles med org_id
```

**⚠️ PROBLEM:**

```diff
- Nya organisationer får INTE län/kommun/service_types automatiskt
- Måste fyllas i MANUELLT i Supabase eller via UPDATE
- OrganisationSelector visar INTE org förrän dessa fält finns
```

**FIX:**

```sql
-- Lägg till i handle_new_user():
UPDATE orgs
SET
  lan = (user_metadata->>'lan'),
  kommun = (user_metadata->>'kommun'),
  service_types = ARRAY[user_metadata->>'service_type'],
  is_visible_to_customers = true
WHERE id = new_org_id;
```

---

### 3. 💼 ADMINFLÖDE (Personal hanterar bokningar)

#### Admin Dashboard

**Status:** ✅ FUNGERAR

- `/admin` - Översikt med snabbknappar
- `/admin/rum` - Rum & platser hantering ✅
- `/admin/users` - Personalhantering ✅
- `/admin/priser/dagis` - Priser hunddagis ✅
- `/admin/priser/pensionat` - Priser + tillval ✅
- `/admin/abonnemang` - Abonnemangshantering ✅
- `/admin/faktura` - Fakturering (INCOMPLETE)

---

## 🗄️ DATABASINTEGRITET - ANALYS

### Relationer & Foreign Keys

#### ✅ KORREKT UPPSATTA:

```sql
dogs.owner_id → owners.id (ON DELETE CASCADE)
dogs.org_id → orgs.id (ON DELETE CASCADE)
dogs.room_id → rooms.id (ON DELETE SET NULL)
bookings.dog_id → dogs.id (ON DELETE CASCADE)
extra_service.dogs_id → dogs.id (ON DELETE CASCADE)
extra_service.service_id → extra_services.id (ON DELETE SET NULL)
```

#### ⚠️ SAKNAS/INKONSEKVENTA:

```sql
-- pending_bookings har INGEN FK till orgs!
ALTER TABLE pending_bookings
ADD CONSTRAINT fk_pending_bookings_org
FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE;

-- bookings har INGEN FK till owners!
-- Om owner raderas → booking finns kvar men är "föräldralös"
ALTER TABLE bookings
ADD COLUMN owner_id uuid REFERENCES owners(id) ON DELETE SET NULL;
```

---

### Triggers - Granskning

#### ✅ FUNGERAR:

1. **on_auth_user_created** → handle_new_user()
   - Skapar org + profile
   - 3-lagers redundans för org_id
2. **trg_auto_customer_number**
   - Auto-genererar kundnummer för owners
3. **trg*set_org_id*\* (12 triggers)**
   - Propagerar org_id från parent till child

#### ⚠️ SAKNAS:

```sql
-- Trigger för att notifiera vid ny pending_booking
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Skicka email till org
  PERFORM net.http_post(
    url := 'YOUR_EMAIL_API',
    body := json_build_object(
      'to', (SELECT email FROM orgs WHERE id = NEW.org_id),
      'subject', 'Ny ansökan mottagen',
      'template', 'new_application',
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_new_application
AFTER INSERT ON pending_bookings
FOR EACH ROW EXECUTE FUNCTION notify_new_application();
```

---

## 📧 EMAIL-SYSTEM - ANALYS

### Nuvarande status:

- `lib/emailSender.ts` finns ✅
- `lib/emailConfig.ts` finns ✅
- Resend API konfigurerad ✅

### Email-flöden som SAKNAS:

```typescript
// 1. Efter ansökan skickats
sendApplicationConfirmation(
  to: customer_email,
  data: { dogName, pensionatName, applicationId }
);

// 2. När ansökan godkänns
sendApplicationApproved(
  to: customer_email,
  data: { dogName, startDate, loginLink }
);

// 3. När ansökan avslås
sendApplicationRejected(
  to: customer_email,
  data: { dogName, reason }
);

// 4. Påminnelse 24h före bokning
sendBookingReminder(
  to: customer_email,
  data: { dogName, date, address }
);

// 5. Efter avslutad bokning
sendBookingFeedback(
  to: customer_email,
  data: { dogName, feedbackLink }
);

// 6. Faktura skapad
sendInvoice(
  to: customer_email,
  data: { invoiceNumber, amount, dueDate, pdfUrl }
);
```

---

## 💰 FAKTURERINGSSYSTEM - ANALYS

### Nuvarande status:

- `invoices` tabell finns ✅
- `invoice_items` tabell finns ✅
- `/admin/faktura` sida finns ✅

### Vad som SAKNAS:

```typescript
// INGEN automatisk fakturagenering
// MÅSTE SKAPAS MANUELLT

// Borde finnas:
async function generateMonthlyInvoices() {
  // 1. Hämta alla aktiva abonnemang
  const subscriptions = await supabase
    .from("dogs")
    .select("*, owners(*)")
    .not("subscription", "is", null)
    .eq("org_id", currentOrgId);

  // 2. För varje hund
  for (const dog of subscriptions) {
    // Beräkna pris från pricing-tabeller
    const price = calculateMonthlyPrice(dog);

    // Hämta extra_services för hunden
    const extras = await supabase
      .from("extra_service")
      .select("*, extra_services(*)")
      .eq("dogs_id", dog.id)
      .eq("is_active", true);

    // 3. Skapa faktura
    const invoice = await supabase
      .from("invoices")
      .insert({
        owner_id: dog.owner_id,
        org_id: dog.org_id,
        total_amount: price + extras.reduce((sum, e) => sum + e.price, 0),
        status: "pending",
        due_date: addDays(new Date(), 30),
      })
      .select()
      .single();

    // 4. Skapa invoice_items
    await supabase.from("invoice_items").insert([
      {
        invoice_id: invoice.id,
        description: `${dog.subscription} - ${dog.name}`,
        quantity: 1,
        unit_price: price,
        total_price: price,
      },
      ...extras.map((e) => ({
        invoice_id: invoice.id,
        description: e.extra_services.label,
        quantity: parseInt(e.frequency),
        unit_price: e.price,
        total_price: e.price * parseInt(e.frequency),
      })),
    ]);

    // 5. Generera PDF
    const pdfUrl = await generateInvoicePDF(invoice.id);

    // 6. Skicka email
    await sendInvoice(dog.owners.email, {
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total_amount,
      dueDate: invoice.due_date,
      pdfUrl,
    });
  }
}

// Cron job (körs 1:a varje månad):
// export const config = { cron: '0 0 1 * *' }
```

---

## 🔒 SÄKERHET - ANALYS

### ✅ BRA:

1. **RLS (Row Level Security)** aktiverat på alla tabeller
2. **org_id isolation** - Användare ser bara sin organisations data
3. **Auth policies** - Authenticated users only för känslig data
4. **Triple-redundant org_id** - Omöjligt att skapa data utan org

### ⚠️ FÖRBÄTTRINGSOMRÅDEN:

```sql
-- 1. pending_bookings är för öppen
-- Kunder kan se ALLA ansökningar (inte bara sina egna)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON pending_bookings;

CREATE POLICY "Users can view own org applications"
ON pending_bookings FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Public can insert applications"
ON pending_bookings FOR INSERT
WITH CHECK (true); -- Tillåt anonyma ansökningar

-- 2. bookings har för bred åtkomst
-- Kunder borde INTE se andras bokningar
CREATE POLICY "Customers can view own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  dog_id IN (
    SELECT d.id FROM dogs d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
```

---

## 📱 RESPONSIVITET & UX

### ✅ BRA:

- Tailwind CSS för responsiv design
- Mobile-first approach
- Hamburgermeny på mobil

### ⚠️ FÖRBÄTTRA:

```diff
- Landing page Hero-bild för stor på mobil (600px höjd)
- OrganisationSelector dropdown kan vara svår att läsa på liten skärm
- EditDogModal för bred på mobil (max-w-4xl → max-w-full på mobil)
```

---

## 🚀 SKALBARHET

### ✅ ROBUSTA DELAR:

1. **Supabase** hanterar 500k MAU gratis, skalbar till miljoner
2. **Next.js** server-side rendering → snabb initial load
3. **Modulär struktur** → lätt att lägga till nya features

### ⚠️ POTENTIELLA FLASKHALSAR:

```typescript
// 1. INEFFEKTIV QUERY i många komponenter:
// Hämtar ALLA hundar, filtrerar sen i client
const { data: dogs } = await supabase
  .from("dogs")
  .select("*, owners(*)") // Hämtar ALLAstående hundar
  .eq("org_id", currentOrgId);

// BÄTTRE: Pagination + filtering i DB
const { data: dogs } = await supabase
  .from("dogs")
  .select("*, owners(*)", { count: "exact" })
  .eq("org_id", currentOrgId)
  .range(page * 50, (page + 1) * 50 - 1)
  .order("name");

// 2. INGEN CACHING
// Varje sidladdning = ny DB-query
// LÄGG TILL: React Query eller SWR för caching
import { useQuery } from "@tanstack/react-query";

const { data: dogs } = useQuery({
  queryKey: ["dogs", currentOrgId],
  queryFn: () => fetchDogs(currentOrgId),
  staleTime: 5 * 60 * 1000, // Cache 5 min
});
```

---

## 🛠️ TEKNISK SKULD

### Identifierade problem:

1. **Duplicerad kod**

   ```typescript
   // Samma Supabase queries kopieras mellan filer
   // LÖSNING: Skapa shared hooks i app/hooks/

   // hooks/useDogs.ts
   export function useDogs(orgId: string) {
     return useQuery({
       queryKey: ["dogs", orgId],
       queryFn: () =>
         supabase.from("dogs").select("*, owners(*)").eq("org_id", orgId),
     });
   }
   ```

2. **Inkonsekvent error handling**

   ```typescript
   // Vissa filer:
   .catch(err => console.error(err))

   // Andra filer:
   .catch(err => setError(err.message))

   // LÖSNING: Centraliserad error handler
   // lib/errorHandler.ts
   export function handleError(error: any, context: string) {
     console.error(`[${context}]`, error);
     toast.error(error.message || 'Ett fel uppstod');
     // Skicka till Sentry/LogRocket
   }
   ```

3. **Saknade TypeScript types för Supabase**
   ```typescript
   // Använder 'any' på många ställen
   // LÖSNING: Generera types från Supabase schema
   // npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
   ```

---

## 📋 KRITISKA ÅTGÄRDER (PRIORITERAT)

### 🔴 AKUT (Blockerande för produktion):

1. **Fix ansökningskedjan**
   - [ ] Skapa "Godkänn ansökan"-knapp i `/hundpensionat/ansokningar`
   - [ ] Auto-skapa owner + dog + booking vid godkännande
   - [ ] Skicka bekräftelsemail till kund

2. **Email-notifikationer**
   - [ ] Ansökningsbekräftelse till kund
   - [ ] Ny ansökan-notis till pensionat
   - [ ] Godkänd ansökan-email med loginlänk

3. **Säkra pending_bookings**
   - [ ] Lägg till FK till orgs
   - [ ] Rätta RLS policies

### 🟡 VIKTIGT (Behövs inom 1 månad):

4. **Automatisk fakturering**
   - [ ] Månatlig batch-job för fakturor
   - [ ] PDF-generering
   - [ ] Email med faktura

5. **Kundportal-integration**
   - [ ] "Spåra min ansökan"-funktion
   - [ ] Notifikationer vid statusändring
   - [ ] Länk från ansökan till kundportal

6. **Organisation auto-setup**
   - [ ] Samla in län/kommun vid registrering
   - [ ] Auto-fyll i handle_new_user()
   - [ ] Visas direkt i OrganisationSelector

### 🟢 ÖNSKVÄRT (Nice-to-have):

7. **Performance-optimering**
   - [ ] Lägg till React Query för caching
   - [ ] Pagination på alla listor
   - [ ] Lazy loading av bilder

8. **Shared hooks & utils**
   - [ ] Centralisera Supabase queries
   - [ ] Unified error handling
   - [ ] Generera TypeScript types från schema

9. **Monitoring & Analytics**
   - [ ] Lägg till Sentry för error tracking
   - [ ] Google Analytics för användarflöden
   - [ ] Performance monitoring (Vercel Analytics)

---

## ✅ SLUTSATS

### SYSTEMET ÄR:

- ✅ **Tekniskt solidt** - Bra grund med Next.js + Supabase
- ✅ **Väl strukturerat** - Tydlig separation mellan moduler
- ⚠️ **Funktionellt ofullständigt** - Ansökan → Bokning-kedjan SAKNAS
- ⚠️ **Manuellt intensivt** - Mycket som kunde automatiserats
- 🔴 **INTE produktionsklart** - Kritiska bitar saknas

### REKOMMENDATION:

**Fixera de 3 AKUTA punkterna FÖRST**, sedan kan systemet börja användas i produktion med manuell fakturering. Efter det, bygg ut automatisk fakturering och förbättra UX stegvis.

**Tid att bli produktionsklar:** ~3-5 arbetsdagar för AKUTA punkter.
