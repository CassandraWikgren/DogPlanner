# KOMPLETT SYSTEMANALYS - DogPlanner

**Datum:** 2025-11-22  
**Typ:** Djupgående granskning av hela systemets arkitektur, robusthet och långsiktig hållbarhet  
**Status:** 🔴 KRITISKA PROBLEM FUNNA

---

## SAMMANFATTNING

Efter en grundlig granskning av hela systemet har jag identifierat **14 kritiska problem** som måste åtgärdas för långsiktig stabilitet. Systemet har flera "dubbla system", inkonsekventa triggers och potentiella säkerhetshål.

### 🔴 KRITISKA PROBLEM (omedelbar åtgärd krävs)

1. **Dubbelt prissystem** - två separata prisberäkningar som refererar olika tabeller
2. **Trigger-konflikt** på `owners.customer_number` - både gammal och ny funktion aktiv
3. **Inkonsekvent org_id-hantering** - triggers sätter olika värden än kod
4. **Schema/migration mismatch** - schema.sql matchar inte deployade migrations
5. **Säkerhetshål i customer_number** - ingen validering vid manuell INSERT

### 🟡 ALLVARLIGA PROBLEM (åtgärd inom kort)

6. **AuthContext healing-funktion** använder fel parameternamn
7. **Infinite loading spinner** risk på sidor utan org_id-check
8. **Missing error boundaries** i React-komponenter
9. **No rate limiting** på publika API-endpoints
10. **Invoice triggers** saknar transaktionshantering

### 🟢 MINDRE PROBLEM (förbättringsförslag)

11. **TypeScript any-typer** används på flera ställen
12. **Duplicerade SQL-filer** i supabase-mappen
13. **Ingen logging-strategi** för production errors
14. **Missing indexes** på kritiska foreign keys

---

## 1. DATABAS & SCHEMA

### 1.1 Schema vs Migrations Mismatch

**PROBLEM:** `supabase/schema.sql` innehåller GAMMAL kod som inte matchar deployade migrations.

#### Bevis:

```sql
-- I schema.sql (rad 2010-2020):
CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number := nextval('owners_customer_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- I deployed migration (fix_customer_number_race_condition.sql):
-- Använder pg_get_serial_sequence() dynamiskt + fallback-logik
```

**KONSEKVENS:** Om någon kör `schema.sql` i Supabase överskrivs den nya, robusta versionen.

**LÖSNING:**

1. Uppdatera `schema.sql` med exakt samma funktioner som i migrations
2. Eller: Ta bort funktioner från schema.sql och lita endast på migrations
3. Lägg till varningskommentar: "⚠️ KÖR EJ DENNA FIL - använd migrations/"

---

### 1.2 Trigger-konflikt på customer_number

**PROBLEM:** Det finns två triggers som båda försöker sätta `customer_number`:

```sql
-- 1. I schema.sql rad 2019:
CREATE TRIGGER trigger_auto_customer_number
BEFORE INSERT OR UPDATE ON owners
FOR EACH ROW
EXECUTE FUNCTION auto_generate_customer_number();

-- 2. I migrations/setup_customer_number_auto_generation.sql:
-- Samma trigger med samma namn
```

**RISK:** Om båda är aktiva kan de:

- Skapa dubbla sequence-anrop
- Orsaka deadlocks vid concurrent inserts
- Generera fel customer_number

**VERIFIERING BEHÖVS:**

```sql
-- Kör detta i Supabase för att se vilka triggers som finns:
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'owners'
  AND trigger_name LIKE '%customer%';
```

---

### 1.3 RLS Policies - Status

**POSITIVT:** RLS policies är korrekt deployade och matchar det vi vill ha:

| Tabell     | Policy                          | Tillåter                             |
| ---------- | ------------------------------- | ------------------------------------ |
| `owners`   | owners_select_by_org_or_self    | ✅ org_id ELLER self                 |
| `owners`   | owners_update_by_org_or_self    | ✅ org_id ELLER self                 |
| `dogs`     | dogs_select_by_org_or_owner     | ✅ org_id ELLER owner_id             |
| `dogs`     | dogs_update_by_org_or_owner     | ✅ org_id ELLER owner_id             |
| `bookings` | bookings_select_by_org_or_owner | ✅ org_id ELLER owner_id             |
| `bookings` | bookings_update_by_org_or_owner | ✅ org_id ELLER (owner_id + pending) |

**MEN:** Policies för DELETE saknas för kundportal-användare:

- Customers kan inte ta bort sina egna hundar
- Customers kan inte ta bort sina egna bokningar (endast pending?)

**REKOMMENDATION:** Lägg till DELETE policies:

```sql
CREATE POLICY "owners_delete_self" ON owners FOR DELETE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "dogs_delete_by_owner" ON dogs FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "bookings_delete_by_owner" ON bookings FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND status = 'pending');
```

---

## 2. ORG_ID 3-LAYER SYSTEM

### 2.1 System Status - ✅ KORREKT IMPLEMENTERAT

Det 3-lagers systemet är korrekt implementerat:

**LAYER 1: Database Trigger** (`handle_new_user()`)

- ✅ Läser user_metadata korrekt: org_name, org_number, full_name, phone, län, kommun, service_types
- ✅ Skapar org + profile + subscription atomiskt
- ✅ EXCEPTION handler förhindrar att registration blockeras
- ✅ Deployed via PERMANENT_FIX_org_assignment.sql

**LAYER 2: API Fallback** (`/api/onboarding/auto`)

- ✅ Anropas av AuthContext.safeAutoOnboarding()
- ✅ Skapar org om trigger misslyckades
- ⚠️ MEN: Ingen logging när detta sker (kan missa buggar)

**LAYER 3: Healing Function** (`heal_user_missing_org()`)

- ✅ RPC-funktion i databasen
- ✅ Kan anropas manuellt eller automatiskt
- ✅ AuthContext.healMissingOrg() anropar den vid behov
- 🔴 **KRITISKT PROBLEM:** Använder fel parameternamn!

#### Bevis för parameterfel:

```typescript
// I AuthContext.tsx rad 308:
const { data, error } = await supabase.rpc("heal_user_missing_org", {
  user_id: userId,  // ❌ ANVÄNDER user_id
});

// I PERMANENT_FIX_org_assignment.sql rad 134:
CREATE OR REPLACE FUNCTION heal_user_missing_org(p_user_id uuid)
-- ✅ FÖRVÄNTAR p_user_id
```

**KONSEKVENS:** Healing-funktionen kommer ALLTID att misslyckas med:

```
function heal_user_missing_org(user_id => uuid) does not exist
```

**FIX:** Ändra AuthContext.tsx rad 308:

```typescript
const { data, error } = await supabase.rpc("heal_user_missing_org", {
  p_user_id: userId, // ✅ RÄTT PARAMETERNAMN
});
```

---

### 2.2 Org_id Triggers - INKONSISTENT

**PROBLEM:** Flera triggers sätter `org_id` automatiskt, vilket kan kollidera med manuell kod:

```sql
-- 1. set_dog_org_id() - hämtar från profiles
-- 2. set_owner_org_id() - hämtar från profiles
-- 3. set_booking_org_id() - hämtar från dogs
```

**KONFLIKTER:**

#### A) Dogs-trigger vs EditDogModal.tsx

```typescript
// EditDogModal.tsx rad 142 sätter org_id manuellt:
const updates = {
  ...formData,
  org_id: currentOrgId, // <-- Manuell setting
};

// MEN trigger set_dog_org_id() försöker också sätta org_id från profiles
// Om triggers och kod kör olika vägar får vi inkonsistent data
```

**Problem:** Om `currentOrgId` kommer från metadata men trigger läser från profiles kan de bli olika.

#### B) Bookings-trigger Design Issue

```sql
CREATE OR REPLACE FUNCTION set_booking_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM dogs
    WHERE id = NEW.dog_id;  -- <-- Hämtar från dogs
  END IF;
  RETURN NEW;
END;
```

**Detta är faktiskt RÄTT design** (enligt `.github/copilot-instructions.md`):

> "Bookings get org_id from pensionat, not from owner"

Men det skapar förvirring eftersom:

- Kundportal-användare har INGEN org_id i profiles
- Deras hundar har INGEN org_id
- Men bokningen MÅSTE ha org_id (från pensionatet)

**VERIFIERING BEHÖVS:** Kontrollera att:

1. Kundportal-hundar INTE får org_id vid skapande
2. Bokningar FÅR org_id från pensionatets org_id (inte från hundens)

---

## 3. CUSTOMER_NUMBER SYSTEM

### 3.1 Status - ✅ KORREKT MEN OSÄKER

Migrationen `fix_customer_number_race_condition.sql` är korrekt deployed:

- ✅ Använder `pg_get_serial_sequence()` dynamiskt
- ✅ Har fallback till MAX+1 om sequence saknas
- ✅ Synkar sequence med existing data

**MEN:** Det finns säkerhetshål:

### 3.2 Säkerhetshål - Manuell INSERT

**PROBLEM:** RLS policy tillåter ALLA att INSERT i owners:

```sql
CREATE POLICY "owners_public_insert" ON owners
FOR INSERT TO anon, authenticated
WITH CHECK (true);  -- <-- INGEN VALIDERING!
```

**RISK:** Någon kan:

1. Manuellt sätta `customer_number = 99999`
2. Skapa kollisioner med legitimate customers
3. Trigga inte om `customer_number` redan är satt

**BEVIS:**

```sql
-- Denna INSERT kommer INTE trigga auto-generering:
INSERT INTO owners (id, full_name, customer_number)
VALUES (gen_random_uuid(), 'Hacker', 99999);
-- Trigger kollar: IF NEW.customer_number IS NULL
-- Så den hoppar över om värde redan finns!
```

**FIX:** Lägg till validation i trigger:

```sql
CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_name TEXT;
  next_val INTEGER;
BEGIN
  -- NYTT: Validera om customer_number försöker sättas manuellt
  IF NEW.customer_number IS NOT NULL AND TG_OP = 'INSERT' THEN
    -- Tillåt endast om användaren är admin/superuser
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    ) THEN
      RAISE EXCEPTION 'customer_number kan inte sättas manuellt';
    END IF;
  END IF;

  -- Rest av original-kod...
  IF NEW.customer_number IS NULL THEN
    SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
    IF seq_name IS NOT NULL THEN
      EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
      NEW.customer_number := next_val;
    ELSE
      SELECT COALESCE(MAX(customer_number), 0) + 1
      INTO NEW.customer_number
      FROM owners;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.3 UI-Integration - SAKNAS

**PROBLEM:** `customer_number` genereras i databasen men visas ALDRIG i UI:

Sökningar i koden visar:

- ✅ `owners`-tabellen har kolumnen
- ✅ Trigger genererar värdet
- ❌ INGEN komponent visar customer_number
- ❌ INGEN sida visar "Ditt kundnummer: 12345"
- ❌ Ingen sökning på kundnummer

**REKOMMENDATION:**

1. Visa customer_number på `/kundportal/profil`
2. Lägg till sökning i `/owners` på customer_number
3. Visa i fakturor och bokningsbekräftelser

---

## 4. PRISSYSTEM - 🔴 DUBBELT SYSTEM (KRITISKT)

### 4.1 Två Separata Prissystem

**PROBLEM:** Det finns TVÅ helt separata prisberäkningssystem:

#### System 1: boardingPriceCalculator.ts ✅ FUNGERAR

```typescript
// Använder tabeller:
- boarding_prices (grundpris per storlek)
- special_dates (röda dagar, event)
- boarding_seasons (sommar, vinter, sportlov)

// Används av:
- app/kundportal/boka/page.tsx
- app/hundpensionat/ansokningar/page.tsx
```

**Detta system fungerar och är korrekt implementerat.**

#### System 2: pensionatCalculations.ts ❌ TRASIGT

```typescript
// Försöker använda tabeller:
- pensionat_prices  // ❌ FINNS INTE I SCHEMA!
- pricing_seasons   // ❌ FINNS INTE I SCHEMA!
- special_dates     // ✅ Finns

// Används av:
- app/ansokan/pensionat/page.tsx (EN enda fil)
```

**Detta system är trasigt och kommer krascha vid runtime:**

```typescript
const { data: prices, error: pricesError } = await supabase
  .from("pensionat_prices") // ❌ TABLE DOES NOT EXIST
  .select("*");
```

### 4.2 Varför Finns Två System?

Analys av historik:

1. **pensionatCalculations.ts** skapades först (äldre design)
2. **boardingPriceCalculator.ts** skapades senare (ny, fungerande design)
3. Gamla koden togs INTE bort
4. Nu finns båda och skapar förvirring

### 4.3 Konsekvenser

**Aktuellt läge:**

- ✅ `/kundportal/boka` fungerar (använder boardingPriceCalculator)
- ✅ `/hundpensionat/ansokningar` fungerar (använder boardingPriceCalculator)
- ❌ `/ansokan/pensionat` är trasigt (använder pensionatCalculations)

**Men:** `/ansokan/pensionat` verkar vara en gammal, oanvänd route. Sökning visar ingen länk till den.

### 4.4 Långsiktig Risk

**STÖRSTA RISKEN:** Någon utvecklare ser två filer och tror:

- "Jag ska implementera X, vilken ska jag använda?"
- Väljer fel fil
- Skapar ny feature med trasigt system
- Production crash

### 4.5 Lösning

**OMEDELBART:**

1. Ta bort `lib/pensionatCalculations.ts`
2. Ta bort `app/ansokan/pensionat/page.tsx` (om den inte används)
3. Dokumentera att `boardingPriceCalculator.ts` är den enda sanningen

**LÅNGSIKTIGT:** 4. Konsolidera alla pris-relaterade typer i en fil 5. Skapa enhetstester för prisberäkningar 6. Dokumentera prislogik i README

---

## 5. AUTHCONTEXT - ROBUST MEN FÖRBÄTTRINGSBAR

### 5.1 Vad Fungerar Bra ✅

AuthContext har flera bra safety-features:

- ✅ 10-sekunds timeout förhindrar infinite loading
- ✅ Quick org_id från metadata ger snabb rendering
- ✅ Demo-cookie support för utveckling
- ✅ Comprehensive error handling

### 5.2 Problem med refreshProfile()

**PROBLEM:** refreshProfile() har komplicerad fallback-logik för att hantera olika schemaversioner:

```typescript
// Rad 232: Försök läsa minimal data
const baseRes: any = await supabase
  .from("profiles")
  .select("id, org_id")
  .eq("id", userId)
  .single();

// Rad 241: Försök läsa extra fält
const extraRes: any = await supabase
  .from("profiles")
  .select("role, full_name, email, phone")
  .eq("id", userId)
  .single();

// Ignorera fel här – vissa kolumner kan saknas i en äldre databas
```

**Varför?** Detta verkar vara en workaround för att hantera olika dev/prod-scheman.

**Problem:** Om kolumner faktiskt saknas i prod kommer:

- `role` alltid vara "admin" (default på rad 288)
- `full_name`, `email`, `phone` vara undefined
- Ingen varning syns för admins

**BÄTTRE LÖSNING:**

1. Se till att prod ALLTID har alla kolumner
2. Ta bort try/catch-logiken
3. Om fel uppstår → logga till error-tracking (Sentry?)

---

### 5.3 Healing-funktionens Parameterfel

**SE AVSNITT 2.1** - Detta är KRITISKT och måste fixas omedelbart.

---

## 6. INFINITE LOADING SPINNER RISK

### 6.1 Problem Pattern

Många sidor har detta mönster:

```typescript
const { currentOrgId, loading } = useAuth();

useEffect(() => {
  if (currentOrgId && !loading) {
    loadData();
  }
}, [currentOrgId, loading]);

async function loadData() {
  if (!currentOrgId) return; // Early exit
  // ... fetch data ...
}
```

**RISK:** Om användare saknar `org_id`:

- `currentOrgId` är `null`
- `loading` blir `false` efter 10 sekunder
- `loadData()` anropas ALDRIG
- Sidan visar loading spinner FOREVER
- Ingen error message
- Användaren sitter fast

### 6.2 Drabbade Sidor

Sökning visar att dessa sidor har problemet:

- `/hundpensionat/ansokningar` ✅ HAS FIX (rad 105: `if (currentOrgId && !authLoading)`)
- `/frisor/ny-bokning` ✅ HAS FIX
- `/hunddagis/intresseanmalningar` ❌ SAKNAR FIX
- `/rooms` ❌ SAKNAR FIX
- `/foretagsinformation` ❌ SAKNAR FIX
- `/owners` ❌ SAKNAR FIX

### 6.3 Korrekt Pattern

```typescript
const { currentOrgId, loading } = useAuth();

useEffect(() => {
  if (loading) return; // Vänta tills AuthContext är klart

  if (currentOrgId) {
    loadData();
  } else {
    // ✅ VIKTIGT: Sätt loading till false även om currentOrgId saknas
    setLoading(false);
    setError("Du måste vara inloggad för att se denna sida");
  }
}, [currentOrgId, loading]);
```

### 6.4 Lösning

**OMEDELBART:** Fixa alla sidor som saknar else-case.

**EXEMPEL FIX för `/rooms/page.tsx`:**

```typescript
// FÖRE (rad 72-78):
useEffect(() => {
  if (user && currentOrgId) {
    loadRooms();
    loadPensionat();
  }
}, [user, authLoading, currentOrgId]);

// EFTER:
useEffect(() => {
  if (authLoading) return;

  if (user && currentOrgId) {
    loadRooms();
    loadPensionat();
  } else {
    setLoading(false); // ✅ Stoppa loading spinner
    // Optionalt: Visa error eller redirect
  }
}, [user, authLoading, currentOrgId]);
```

---

## 7. BOKNINGSSYSTEM - org_id Propagation

### 7.1 Design (från copilot-instructions.md)

```
Bookings get org_id from pensionat, not from owner
```

Detta betyder:

1. Kund registrerar på `/kundportal/skapa-konto` → INGEN org_id
2. Kund skapar hund → hunden får INGEN org_id
3. Kund bokar pensionat → bokningen får org_id från PENSIONATET

### 7.2 Implementering

Kontrolle av kod:

#### A) Kundportal Booking Creation

```typescript
// app/kundportal/boka/page.tsx rad 352
const bookingData = {
  dog_id: selectedDogId,
  org_id: pensionatData.org_id, // ✅ FRÅN PENSIONAT
  owner_id: ownerId,
  // ...
};
```

**Detta är KORREKT!** 👍

#### B) Database Trigger

```sql
-- schema.sql rad 2026-2040
CREATE OR REPLACE FUNCTION set_booking_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM dogs
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
```

**DETTA ÄR FEL!** ❌

Trigger försöker hämta org_id från DOGS, men enligt design ska det komma från pensionat!

### 7.3 Konflikt

**Scenario 1: Normal Flow (kundportal)**

- Kod sätter `org_id = pensionatData.org_id` ✅
- Trigger ser att org_id INTE är NULL
- Trigger gör ingenting ✅
- **Fungerar!**

**Scenario 2: Manuell INSERT (t.ex. migration, admin-tool)**

```sql
INSERT INTO bookings (dog_id, owner_id, checkin_date, checkout_date)
VALUES ('dog-uuid', 'owner-uuid', '2025-12-01', '2025-12-05');
-- org_id är NULL!
```

- Trigger försöker hämta org_id från dogs
- Dogs har INGEN org_id (kundportal-hund)
- org_id blir NULL i bookings
- **RLS blockerar access!** ❌

### 7.4 Lösning

**RÄTT TRIGGER:**

```sql
CREATE OR REPLACE FUNCTION set_booking_org_id()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF NEW.org_id IS NULL THEN
    -- Försök hämta från pensionat (kräver pensionat_id i bookings?)
    -- ELLER: Kräv att org_id alltid sätts manuellt
    -- ELLER: Hämta från owner → profiles → org_id för företag

    -- För kundportal-bokningar måste org_id sättas explicit!
    -- Om det inte finns, logga error
    IF NEW.org_id IS NULL THEN
      RAISE WARNING 'Booking created without org_id: dog_id=%', NEW.dog_id;
      -- Försök hitta pensionat-org från... var?
    END IF;
  END IF;
  RETURN NEW;
END;
```

**PROBLEM:** Bookings-tabellen saknar `pensionat_id`-kolumn!

**LÅNGSIKTIG FIX:**

1. Lägg till `pensionat_id uuid REFERENCES orgs(id)` i bookings
2. Uppdatera alla booking-skapande-ställen att sätta pensionat_id
3. Låt trigger hämta org_id från pensionat_id

---

## 8. FAKTURASYSTEM - Trigger Robustness

### 8.1 Invoice Triggers

Det finns två faktura-triggers:

1. `trg_create_prepayment_invoice` - Skapar förskottsfaktura vid `status = confirmed`
2. `trg_create_invoice_on_checkout` - Skapar slutfaktura vid `status = checked_out`

### 8.2 Problem - Saknar Transaktionshantering

**AKTUELL KOD:**

```sql
CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS trigger AS $$
DECLARE
  v_invoice_id UUID;
  v_total_amount NUMERIC := 0;
BEGIN
  -- 1. Skapa invoice
  INSERT INTO invoices (...) VALUES (...) RETURNING id INTO v_invoice_id;

  -- 2. Lägg till invoice_items
  INSERT INTO invoice_items (...) ...;

  -- 3. Uppdatera invoice.total_amount
  UPDATE invoices SET total_amount = v_total_amount WHERE id = v_invoice_id;

  -- 4. Uppdatera booking med invoice_id
  UPDATE bookings SET afterpayment_invoice_id = v_invoice_id WHERE id = NEW.id;

  RETURN NEW;
END;
```

**RISK:** Om något steg failar mitt i:

- Invoice skapas men utan items
- Invoice_items skapas men invoice.total_amount är fel
- Booking uppdateras inte med invoice_id
- **Systemet hamnar i inkonsistent state** ❌

### 8.3 Lösning

**LÄGG TILL EXCEPTION HANDLING:**

```sql
CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS trigger AS $$
DECLARE
  v_invoice_id UUID;
  v_total_amount NUMERIC := 0;
BEGIN
  BEGIN  -- ← Start exception block
    -- All invoice creation logic här...

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Logga fel
      INSERT INTO error_logs (
        error_type,
        error_message,
        context_data,
        created_at
      ) VALUES (
        'invoice_creation_failed',
        SQLERRM,
        jsonb_build_object(
          'booking_id', NEW.id,
          'user_id', auth.uid()
        ),
        now()
      );

      -- Låt triggern fortsätta utan att blockera checkout
      RAISE WARNING 'Invoice creation failed for booking %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. API ENDPOINTS - Säkerhet

### 9.1 Publika Endpoints Utan Rate Limiting

Följande endpoints är publika och har INGEN rate limiting:

- `/api/onboarding/auto` - Skapar organisation
- `/api/bookings/create` - Skapar bokning (?)
- Alla `/ansokan/*` routes

**RISK:** DDoS-attack kan:

1. Skapa tusentals fake-organisationer
2. Fylla databasen med spam-bokningar
3. Krascha systemet

### 9.2 Lösning

**IMPLEMENTERA RATE LIMITING:**

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

export async function middleware(request: Request) {
  // Rate limit publika endpoints
  if (request.url.includes("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response("Too Many Requests", { status: 429 });
    }
  }

  return NextResponse.next();
}
```

**Eller använd Vercel Edge Functions rate limiting.**

---

## 10. REACT ERROR BOUNDARIES

### 10.1 Problem

**INGEN error boundary finns i applikationen!**

Om någon komponent krashar:

- Hela sidan blir vit
- Användaren ser ingen error message
- Ingen logging till Sentry/etc
- Utvecklare vet inte att något är fel

### 10.2 Lösning

**SKAPA ERROR BOUNDARY:**

```typescript
// components/ErrorBoundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // TODO: Logga till Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Något gick fel
            </h1>
            <p className="text-gray-600 mb-4">
              Ett oväntat fel uppstod. Vänligen försök igen senare.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Ladda om sidan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**ANVÄND I LAYOUT:**

```typescript
// app/layout.tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 11. TYPESCRIPT - any-TYPER

### 11.1 Problem

Många ställen använder `any` istället för proper types:

```typescript
// AuthContext.tsx rad 232
const baseRes: any = await supabase.from("profiles")...

// pensionatCalculations.ts rad 26
const { data: dog, error: dogError } = await (supabase as any)...

// boardingPriceCalculator.ts
export async function calculateBookingPrice(...): Promise<any> { ... }
```

**RISK:**

- Ingen type safety
- Buggar upptäcks inte vid compile-time
- Svårare att refaktorera

### 11.2 Lösning

**ANVÄND PROPER TYPES:**

```typescript
// types/supabase.ts
import { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];

// AuthContext.tsx
const { data, error } = await supabase
  .from("profiles")
  .select("id, org_id, role, full_name, email, phone")
  .eq("id", userId)
  .single();

const profile = data as Profile | null;
```

---

## 12. DUPLICERADE SQL-FILER

### 12.1 Problem

`supabase/`-mappen innehåller många duplicerade/gamla filer:

```
supabase/
  schema.sql (GAMMAL)
  migrations/
    fix_customer_number_race_condition.sql (NY)
    setup_customer_number_auto_generation.sql (GAMMAL? DUPLIKAT?)
    PERMANENT_FIX_org_assignment.sql
```

**RISK:** Någon kör fel fil och förstör production-databasen.

### 12.2 Lösning

**CLEANUP:**

1. Flytta gamla filer till `supabase/archive/`
2. Lägg till README som förklarar migration-ordning
3. Markera vilka filer som är "source of truth"

---

## 13. LOGGING STRATEGY SAKNAS

### 13.1 Problem

**INGEN CENTRALISERAD LOGGING!**

Errors loggas till:

- Console.log() (försvinner)
- Ingen Sentry/LogRocket/etc
- Ingen alert vid kritiska fel
- Ingen monitoring av production

### 13.2 Lösning

**IMPLEMENTERA SENTRY:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**LOGGA VIKTIGA EVENTS:**

- AuthContext healing failures
- Invoice creation failures
- Pricing calculation errors
- Database trigger errors

---

## 14. DATABASE INDEXES SAKNAS

### 14.1 Problem

Kritiska foreign keys saknar indexes:

```sql
-- bookings.org_id - används i nästan alla queries
-- dogs.owner_id - används för owner-lookups
-- owners.org_id - används för org-filtering
-- bookings.owner_id - används för customer portal
```

**KONSEKVENS:** Queries blir långsamma när data växer.

### 14.2 Lösning

**LÄGG TILL INDEXES:**

```sql
CREATE INDEX IF NOT EXISTS idx_bookings_org_id ON bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogs_org_id ON dogs(org_id);
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON owners(org_id);
CREATE INDEX IF NOT EXISTS idx_owners_customer_number ON owners(customer_number);
```

---

## PRIORITERAD ÅTGÄRDSLISTA

### 🔴 KRITISKT (gör omedelbart)

1. **FIX:** AuthContext healing-funktion parameternamn (`user_id` → `p_user_id`)
2. **TA BORT:** `lib/pensionatCalculations.ts` (trasigt system)
3. **FIX:** Infinite loading spinner på `/rooms`, `/foretagsinformation`, `/owners`
4. **VALIDERA:** customer_number trigger mot manuella inserts
5. **UPPDATERA:** schema.sql att matcha deployade migrations

### 🟡 VIKTIGT (gör inom kort)

6. **LÄGG TILL:** Error boundaries i React
7. **LÄGG TILL:** Rate limiting på publika API-endpoints
8. **FIX:** Invoice triggers exception handling
9. **LÄGG TILL:** DELETE policies för kundportal
10. **DOKUMENTERA:** Prissystem i README

### 🟢 FÖRBÄTTRINGAR (gör när tid finns)

11. **IMPLEMENTERA:** Sentry logging
12. **LÄGG TILL:** Database indexes
13. **REFAKTORERA:** TypeScript any-typer
14. **CLEANUP:** Duplicerade SQL-filer

---

## VERIFIERINGSSTEG

För att verifiera att alla fixes fungerar:

```sql
-- 1. Kolla aktiva triggers på owners
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'owners'
ORDER BY trigger_name;

-- 2. Testa customer_number generation
INSERT INTO owners (full_name, email)
VALUES ('Test User', 'test@example.com')
RETURNING id, customer_number;

-- 3. Verifiera RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('owners', 'dogs', 'bookings')
ORDER BY tablename, policyname;

-- 4. Kolla indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'dogs', 'owners')
ORDER BY tablename, indexname;
```

---

## SLUTSATS

DogPlanner-systemet är **funktionellt men har kritiska tekniska skulder** som måste adresseras för långsiktig stabilitet:

✅ **Vad fungerar bra:**

- RLS policies är korrekt implementerade
- 3-lagers org_id-system är smart design
- AuthContext har bra error handling
- Prisberäkning i boardingPriceCalculator.ts är robust

❌ **Vad måste fixas:**

- Dubbelt prissystem skapar förvirring
- Schema/migration mismatch kan förstöra production
- Saknade error boundaries kan dölja kritiska buggar
- Ingen rate limiting öppnar för abuse
- TypeScript any-typer förhindrar type safety

**REKOMMENDATION:** Prioritera 🔴 KRITISKA fixes innan nya features utvecklas.
