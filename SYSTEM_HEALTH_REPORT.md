# 🏥 DogPlanner - Systemhälsa & Långsiktig Hållbarhet

**Datum:** 30 november 2025  
**Syfte:** Fullständig genomgång av systemets hållbarhet och synkronisering

---

## 🚨 KRITISKA PROBLEM IDENTIFIERADE

### 1. **Supabase Client Configuration (HÖGSTA PRIORITET)**

**Problem:** 31+ filer använder `createClientComponentClient()` från `@supabase/auth-helpers-nextjs` som **INTE laddar API-nyckeln** från `.env.local`.

**Symtom i konsolen:**

```
Failed to load resource: the server responded with a status of 400
No API key found in request
```

**Drabbade filer (urval):**

- ✅ `app/admin/hundfrisor/priser/page.tsx` (FIXAD)
- ❌ `app/faktura/page.tsx`
- ❌ `app/hunddagis/[id]/page.tsx`
- ❌ `app/hunddagis/priser/page.tsx`
- ❌ `app/hunddagis/intresseanmalningar/page.tsx`
- ❌ `app/ekonomi/page.tsx`
- ❌ `app/hundpensionat/ansokningar/page.tsx`
- ❌ `app/admin/abonnemang/page.tsx`
- ❌ `app/admin/tjanster/page.tsx`
- ❌ `app/admin/users/page.tsx`
- ❌ `app/admin/faktura/page.tsx`
- ❌ `app/admin/rapporter/page.tsx`
- ❌ `app/frisor/ny-bokning/page.tsx`
- ❌ `app/kundportal/login/page.tsx`
- ❌ `app/kundportal/dashboard/page.tsx`
- ❌ `app/kundportal/boka/page.tsx`
- ❌ `app/kundportal/registrera/page.tsx`
- ... och 14 till

**Effekt:** Många sidor kan inte kommunicera med Supabase → ingen data laddas → 400-fel.

**Lösning:**

```typescript
// FEL (nuvarande i 31 filer):
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createClientComponentClient(); // ❌ Ingen API-nyckel!

// RÄTT (använd överallt):
import { supabase } from "@/lib/supabase"; // ✅ API-nyckel inkluderad!
```

---

### 2. **RLS-Policys Status**

**Nuläge:** `grooming_prices` tabellen har **helt öppna policys** (från ABSOLUTE_FINAL_FIX.sql):

```sql
CREATE POLICY "grooming_insert" ON grooming_prices
FOR INSERT WITH CHECK (true); -- Tillåter allt!
```

**Problem:** Ingen org-filtrering → alla organisationer kan se/ändra varandras priser.

**Kritiska tabeller att granska:**

- `grooming_prices` - Öppen (temporärt för testing)
- `bookings` - Okänd status
- `daycare_completions` - Okänd status
- `grooming_journal` - Okänd status (syns i 400-felen)
- `invoices` - Okänd status
- `rooms` - Okänd status
- `dogs` - Okänd status
- `profiles` - Okänd status

**Nästa steg:** Kör `COMPLETE_RLS_AUDIT.sql` i Supabase för att få fullständig rapport.

---

### 3. **Environment Variables**

**Status:** ✅ `.env.local` innehåller alla nycklar

```
NEXT_PUBLIC_SUPABASE_URL=https://fhdkkkujnhteetllxypg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (giltig JWT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (giltig)
```

**Problem:** Nycklar finns men används inte pga fel Supabase client (se Problem #1).

---

### 4. **Database Schema Synkronisering**

**Behöver verifieras:**

- Lokala migrations vs produktion
- Triggers (handle_new_user, heal_user_missing_org)
- Foreign keys och constraints

**Verktyg:** `SCHEMA_SYNC_GUIDE.md` (finns i repo)

---

## ✅ VAD SOM FUNGERAR BRA

### Prisstruktur

- ✅ Hundfrisör: 199 kr/mån
- ✅ Hunddagis: 399 kr/mån
- ✅ Pensionat: 399 kr/mån
- ✅ 2 tjänster: 599 kr/mån
- ✅ 3 tjänster: 799 kr/mån
- ✅ Alla Stripe Price IDs konfigurerade

### Trial-perioder

- ✅ Alla kritiska filer har 60 dagar (2 månader)
- ✅ Checkout, auto-onboarding, migrations - alla konsekventa

### Stripe Integration

- ✅ 10 Price IDs konfigurerade
- ✅ Webhook secret konfigurerad
- ✅ Test mode fungerar

### UI Design

- ✅ Registreringssidan fixad (grön text läsbar)
- ✅ Bra visuell hierarki

---

## 🔧 ÅTGÄRDSPLAN (Prioriterad)

### KRITISK (Gör NU)

#### 1. Fixa Supabase Client Globalt

**Estimerad tid:** 2-3 timmar  
**Risk:** HÖG - många sidor påverkas

**Metod A - Automatisk (rekommenderas):**

```bash
# Kör Python-scriptet som skapats:
python3 fix-supabase-clients.py
# Följ instruktioner, granska ändringar med git diff
# Testa applikationen grundligt
```

**Metod B - Manuell (säkrare men långsam):**
För varje fil i listan ovan:

1. Öppna filen
2. Ersätt `import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";`  
   med `import { supabase } from "@/lib/supabase";`
3. Ta bort `const supabase = createClientComponentClient();`
4. Testa sidan

**Prioriterade filer att fixa först:**

1. `app/admin/faktura/page.tsx` (faktureringssystem)
2. `app/kundportal/dashboard/page.tsx` (kundportal)
3. `app/kundportal/boka/page.tsx` (bokningar)
4. `app/hunddagis/[id]/page.tsx` (dagisöversikt)
5. `app/hundpensionat/ansokningar/page.tsx` (ansökningar)

#### 2. Stäng RLS-Policys på grooming_prices

**Estimerad tid:** 10 minuter

Kör detta SQL i Supabase:

```sql
-- Ta bort öppna policys
DROP POLICY IF EXISTS "grooming_select" ON grooming_prices;
DROP POLICY IF EXISTS "grooming_insert" ON grooming_prices;
DROP POLICY IF EXISTS "grooming_update" ON grooming_prices;
DROP POLICY IF EXISTS "grooming_delete" ON grooming_prices;

-- Lägg till säkra policys med org-filtrering
CREATE POLICY "grooming_select" ON grooming_prices
FOR SELECT USING (
  org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "grooming_insert" ON grooming_prices
FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "grooming_update" ON grooming_prices
FOR UPDATE
USING (org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "grooming_delete" ON grooming_prices
FOR DELETE USING (
  org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
);
```

#### 3. Granska Alla RLS-Policys

**Estimerad tid:** 30 minuter

Kör `COMPLETE_RLS_AUDIT.sql` i Supabase och granska output:

- Tabeller med RLS enabled men inga policys → KRITISKT problem
- Tabeller utan RLS → Potentiell säkerhetsrisk
- Policys med `USING (true)` → Måste fixas

---

### VIKTIGT (Gör inom 1 vecka)

#### 4. Schema Synkronisering

Verifiera att lokal schema matchar produktion:

```bash
# Exportera schema från Supabase
# Jämför med lokala migrations
```

#### 5. End-to-End Testing

Testa kritiska flöden:

- [ ] Registrering ny användare
- [ ] Bokning hunddagis
- [ ] Bokning pensionat
- [ ] Bokning hundfrisör
- [ ] Fakturagenerering
- [ ] Betalning via Stripe
- [ ] E-postnotifieringar

#### 6. Performance Audit

- Kolla långsamma queries
- Lägg till index där det behövs
- Optimera stora datahämtningar

---

### LÅGPRIORITERAT (Nice-to-have)

#### 7. Uppdatera SLA-sidan

`app/legal/sla/page.tsx` refererar till gamla plannamn (Free/Basic/Pro/Enterprise).

#### 8. Sentry Deprecation Warning

Flytta `sentry.client.config.ts` → `instrumentation-client.ts`

#### 9. Code Cleanup

- Ta bort `page_old.tsx` filer
- Ta bort `page_original.tsx` filer
- Städa upp oanvända imports

---

## 📊 HÅLLBARHETSMATRIS

| Område                 | Status    | Hållbarhet | Kritikalitet |
| ---------------------- | --------- | ---------- | ------------ |
| **Supabase Client**    | 🔴 Trasig | Låg        | KRITISK      |
| **RLS Säkerhet**       | 🟡 Delvis | Medel      | HÖG          |
| **Prisstruktur**       | 🟢 OK     | Hög        | MEDEL        |
| **Stripe Integration** | 🟢 OK     | Hög        | HÖG          |
| **Trial-perioder**     | 🟢 OK     | Hög        | MEDEL        |
| **Database Schema**    | 🟡 Oklar  | ?          | HÖG          |
| **Environment Vars**   | 🟢 OK     | Hög        | KRITISK      |
| **UI/UX**              | 🟢 OK     | Hög        | MEDEL        |
| **Testing**            | 🔴 Saknas | Låg        | HÖG          |

**Legende:**

- 🟢 OK - Fungerar bra
- 🟡 Delvis - Behöver åtgärd
- 🔴 Trasig - Kritiskt problem

---

## 🎯 SAMMANFATTNING

### Är hemsidan långsiktigt hållbar?

**Nuvarande svar: ❌ NEJ** (men fixbart på 2-4 timmar)

**Huvudproblem:**

1. 31 filer använder felaktig Supabase client → många sidor får 400-fel
2. RLS-policys är helt öppna på `grooming_prices` → säkerhetsrisk
3. Okänd RLS-status på andra tabeller → potentiella säkerhetsrisker

**Efter fixes:**
✅ JA - systemet blir långsiktigt hållbart om:

1. Alla filer använder global `supabase` client från `lib/supabase.ts`
2. Alla tabeller har korrekta RLS-policys med org-filtrering
3. End-to-end testing genomförs och passerar

---

## 🚀 NÄSTA STEG

1. **NU:** Fixa Supabase client i alla 31 filer (kör `fix-supabase-clients.py`)
2. **NU:** Stäng RLS-policys på `grooming_prices`
3. **IDAG:** Kör RLS-audit och fixa eventuella problem
4. **VECKAN:** End-to-end testing av alla kritiska flöden
5. **SEDAN:** Schema-synkronisering och performance-audit

---

## 📝 TRACKING

**Skapad:** 2025-11-30  
**Senast uppdaterad:** 2025-11-30  
**Status:** 🔴 KRITISKA PROBLEM IDENTIFIERADE  
**Nästa review:** Efter fixes genomförts
