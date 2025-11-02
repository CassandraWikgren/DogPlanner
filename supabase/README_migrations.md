# Supabase Migrations - DogPlanner

**Uppdaterad: 2025-11-02**

Detta repo separerar nu organisationens prenumeration från hundabonnemang och lägger till grooming-tabeller + PRODUKTIONSKLARA RLS policies.

## 📋 Migreringar (i kronologisk ordning)

### 1. `2025-11-02_org_subscriptions_grooming.sql` ⭐ KRITISK

**Syfte:** Lägger till tre nya domän-tabeller för att matcha koden

**Tabeller:**

- `org_subscriptions` - Organisationens DogPlanner-plan (trialing/active/past_due/canceled)
  - ⚠️ VIKTIGT: Detta är INTE hundabonnemang!
  - En aktiv rad per organisation
  - Kolumner: org_id, plan, status, trial_starts_at, trial_ends_at, is_active
- `grooming_bookings` - Frisörbokningar (appointment_date/time, service_type, status)
- `grooming_journal` - Frisörjournal (final_price, foton, behandlingsinfo)

**Användning:**

```sql
-- Kör i Supabase SQL Editor
-- Safe att köra flera gånger (IF NOT EXISTS)
```

### 2. `2025-11-02_rls_profiles_policy.sql` ⭐ KRITISK

**Syfte:** Lägger till PRODUKTIONSKLARA RLS policies för profiles-tabellen

**Problem den löser:**

- `AuthContext` kunde inte läsa profiler på klientsidan (500-fel)
- Nya användare fick "Ingen organisation tilldelad" fel
- Dashboard, Hunddagis, Hundpensionat, Hundfrisör laddade inte korrekt

**Policies:**

- `profiles_self_access` (SELECT) - Användare kan läsa sin egen profil
- `profiles_self_insert` (INSERT) - Användare kan skapa sin egen profil (för auto-onboarding)
- `profiles_self_update` (UPDATE) - Användare kan uppdatera sin egen profil

**Villkor:** `auth.uid() = id` (användaren äger sitt eget record)

**Användning:**

```sql
-- Kör i Supabase SQL Editor
-- Safe att köra flera gånger (DROP IF EXISTS först)
```

---

## 🚀 Hur man applicerar (Production)

### Steg 1: Kör migrations i Supabase SQL Editor

1. Öppna Supabase Dashboard → Din projekt → **SQL Editor**
2. Kör först: `supabase/migrations/2025-11-02_org_subscriptions_grooming.sql`
3. Kör sedan: `supabase/migrations/2025-11-02_rls_profiles_policy.sql`
4. Verifiera: Båda bör ge "Success" (No rows returned är OK)

### Steg 2: Verifiera att allt fungerar

1. Gå till `/auth-debug` på din sajt
2. Logga in och klicka "Kör auto-onboarding nu"
3. Klicka "Kontrollera /api/subscription/status"
4. Du bör se: `{"status": "trialing", "trial_ends_at": null, "expired": false}`
5. Testa Dashboard, Hunddagis, Hundpensionat, Hundfrisör - alla bör fungera

---

## 💻 Kodändringar som beror på dessa migrations

### API Routes

- **`app/api/subscription/status/route.ts`**
  - Läser från `org_subscriptions` (inte `subscriptions`)
  - Använder pure service role (bypass RLS)
  - Returnerar `{status, trial_ends_at, expired}`

- **`app/api/onboarding/auto/route.ts`**
  - Skapar organisation + profil + org_subscriptions automatiskt
  - Ger 3 månaders gratis trial (`trial_ends_at = now() + 3 months`)
  - Anropas automatiskt vid första inloggningen

### Type System

- **`types/database.ts`** uppdaterad med:
  - `profiles` tabell (id, org_id, role, full_name, email, phone)
  - `org_subscriptions` (organisationens plan)
  - `subscriptions` korrigerad till hundabonnemang-nivå
  - `grooming_bookings` och `grooming_journal`

### Frontend

- **`app/context/AuthContext.tsx`**
  - Anropar `/api/onboarding/auto` vid session change
  - Laddar profil via klient (fungerar nu med RLS policies)
  - Hämtar subscription status för trial banner

---

## 🔄 Hålla types synkroniserade (rekommenderat)

För att undvika drift mellan databas och TypeScript types:

```sh
# Installera Supabase CLI (en gång)
npm i -D supabase

# Generera types från live projekt
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > types/database.ts
```

**Alternativt:** Gå till Supabase Dashboard → Settings → API → Generate Types → Copy

---

## ⚠️ Viktiga koncept att förstå

### org_subscriptions VS subscriptions

**FÖRVIRRING UNDVIKAS:**

- **`org_subscriptions`** = Organisationens DogPlanner-plan (betalar för att använda plattformen)
  - Status: trialing, active, past_due, canceled
  - En rad per organisation
  - Används av: `/api/subscription/status`, TrialBanner

- **`subscriptions`** = Hundabonnemang (dagis-paket per hund)
  - T.ex. "3 dagar/vecka", "Heltid"
  - Många rader per organisation (en per hund med abonnemang)
  - Används av: Hunddagis-modulen, prisberäkning

### RLS Policies - Produktion vs Development

**Profiles-policies är NU PRODUKTIONSKLARA!**

- SELECT: `auth.uid() = id` - Användaren kan bara läsa sin egen profil
- INSERT: `auth.uid() = id` - Användaren kan bara skapa sin egen profil
- UPDATE: `auth.uid() = id` - Användaren kan bara uppdatera sin egen profil

**Andra tabeller:**

- Development: "Allow all for authenticated users" (brett för snabb utveckling)
- Produktion: Bör begränsas till `org_id` för multi-tenant säkerhet

**TODO:** Implementera org_id-baserade policies för alla tabeller innan full production launch.

---

## 🐛 Troubleshooting

### "Ingen organisation kopplad till profilen"

**Orsak:** RLS policies saknades eller var felkonfigurerade  
**Lösning:** Kör `2025-11-02_rls_profiles_policy.sql`

### Profile visar null i AuthContext

**Orsak:** RLS blockerar klient-sidan från att läsa profiles  
**Lösning:** Kör `2025-11-02_rls_profiles_policy.sql`

### 500-fel på /api/subscription/status

**Orsak:** org_subscriptions tabellen saknades  
**Lösning:** Kör `2025-11-02_org_subscriptions_grooming.sql`

### 404-fel på grooming_bookings/grooming_journal

**Orsak:** Tabellerna saknades i databasen  
**Lösning:** Kör `2025-11-02_org_subscriptions_grooming.sql`

---

## 📚 Relaterade Filer

- `supabase/schema.sql` - Komplett schema (uppdaterad med nya tabeller + RLS)
- `SYSTEMDOKUMENTATION.md` - Fullständig systemdokumentation
- `README.md` - Senaste uppdateringar och quick start
- `.github/copilot-instructions.md` - Instruktioner för AI-assistenter

---

**Status:** ✅ Production-ready  
**Testad:** 2025-11-02  
**Nästa steg:** Lägg till org_id-baserade RLS policies för alla tabeller

# Generate types (replace with your project ref and anon key or service role)

# This command is an example; follow Supabase docs for your setup.

# supabase gen types typescript --project-id <PROJECT_REF> --schema public > types/database.ts

```

Alternatively, use the Dashboard → API → Generate Types and copy-paste into `types/database.ts`.
```
