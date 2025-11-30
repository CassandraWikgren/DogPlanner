# 🐾 DogPlanner - Modern Plattform för Hundverksamheter

**Version:** 2.0 (30 november 2025)  
**Status:** 🟢 Produktionsklar & Långsiktigt Hållbar

> Ett komplett affärssystem för hunddagis, hundpensionat och hundfrisörer byggt med Next.js 15, Supabase och Stripe.

---

## 📋 Innehållsförteckning

- [Om Systemet](#-om-systemet)
- [Teknisk Stack](#-teknisk-stack)
- [Systemöversikt](#-systemöversikt)
- [Installation](#-installation)
- [Abonnemangssystem](#-abonnemangssystem)
- [Prismodell](#-prismodell)
- [Säkerhet & GDPR](#-säkerhet--gdpr)
- [Deployment](#-deployment)
- [Felsökning](#-felsökning)

---

## 🎯 Om Systemet

DogPlanner är en molnbaserad plattform som automatiserar administration för hundverksamheter. Systemet hanterar:

- **🐕 Hunddagis** - Schema, närvarohantering, rumstilldelning, fakturaunderlag
- **🏨 Hundpensionat** - Bokningar, in-/utcheckning, rumhantering, säsongspriser
- **✂️ Hundfrisör** - Bokningssystem, 22+ behandlingstyper, prishantering, kalender

### Nyckelfördelar

✅ **Modulärt** - Välj endast de tjänster du behöver (frisör, dagis, pensionat)  
✅ **Automatiserat** - Fakturaunderlag, betalningshantering, missbruksskydd  
✅ **Säkert** - Multi-tenant arkitektur med RLS, GDPR-compliant  
✅ **Skalbart** - Bygg på Vercel + Supabase, hanterar 1000+ organisationer

---

## 🛠 Teknisk Stack

```
Frontend:     Next.js 15 (App Router) + React 19 + TypeScript
Styling:      Tailwind CSS + Radix UI
Backend:      Supabase (PostgreSQL + Auth + Storage)
Payments:     Stripe Checkout + Webhooks
Email:        Resend API
Hosting:      Vercel (Edge Functions)
Monitoring:   Sentry
```

### Viktiga Dependencies

```json
{
  "next": "^15.5.6",
  "react": "^19.0.0",
  "stripe": "^19.1.0",
  "@supabase/auth-helpers-nextjs": "latest",
  "pdfkit": "^0.15.1",
  "qrcode": "^1.5.4"
}
```

---

## 📊 Systemöversikt

### Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Hunddagis  │  │  Pensionat   │  │   Frisör     │      │
│  │   /hunddagis │  │ /hundpensionat│  │   /frisor    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│          │                  │                  │             │
│          └──────────────────┴──────────────────┘             │
│                           │                                  │
├───────────────────────────┼──────────────────────────────────┤
│                    Auth Context                              │
│        (currentOrgId, services, subscription)                │
├───────────────────────────┼──────────────────────────────────┤
│                      Backend Layer                           │
│  ┌───────────────────────┴─────────────────────────┐        │
│  │          Supabase PostgreSQL                     │        │
│  │  • orgs (enabled_services, has_had_subscription) │        │
│  │  • profiles (org_id, role)                       │        │
│  │  • org_subscriptions (trial, status)             │        │
│  │  • dogs, owners, bookings                        │        │
│  │  • grooming_prices (dynamic pricing)             │        │
│  └──────────────────────────────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┴──────────────────────┐          │
│  │        Stripe Integration                      │          │
│  │  • 10 Price IDs (5 monthly + 5 yearly)        │          │
│  │  • Webhooks (checkout, subscription updates)  │          │
│  │  • Trial: 60 days (første gang)               │          │
│  └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 3-Lagers Org Assignment System

**KRITISKT:** Systemet använder 3 redundanta lager för att säkerställa att alla användare får `org_id`:

1. **Layer 1 (Primary)**: Database trigger `on_auth_user_created` → `handle_new_user()`
2. **Layer 2 (Fallback)**: API `/api/onboarding/auto` skapar org om trigger misslyckas
3. **Layer 3 (Healing)**: AuthContext's `refreshProfile()` kallar `heal_user_missing_org()`

📄 **Migration:** `supabase/migrations/PERMANENT_FIX_org_assignment.sql`

---

## 🚀 Installation

### 1. Förutsättningar

```bash
Node.js 18+
npm eller yarn
Supabase-konto (gratis tier OK)
Stripe-konto (test mode OK)
```

### 2. Klona Repository

```bash
git clone https://github.com/CassandraWikgren/DogPlanner.git
cd DogPlanner
npm install
```

### 3. Environment Variables

Skapa `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Monthly)
STRIPE_PRICE_ID_GROOMING=price_...        # 199 kr/mån
STRIPE_PRICE_ID_DAYCARE=price_...         # 399 kr/mån
STRIPE_PRICE_ID_BOARDING=price_...        # 399 kr/mån
STRIPE_PRICE_ID_TWO_SERVICES=price_...    # 599 kr/mån
STRIPE_PRICE_ID_ALL_SERVICES=price_...    # 799 kr/mån

# Stripe Price IDs (Yearly - 50 kr/mån rabatt)
STRIPE_PRICE_ID_GROOMING_YEARLY=price_...     # 1788 kr/år
STRIPE_PRICE_ID_DAYCARE_YEARLY=price_...      # 4188 kr/år
STRIPE_PRICE_ID_BOARDING_YEARLY=price_...     # 4188 kr/år
STRIPE_PRICE_ID_TWO_SERVICES_YEARLY=price_... # 6588 kr/år
STRIPE_PRICE_ID_ALL_SERVICES_YEARLY=price_... # 8988 kr/år

# Email (Resend)
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Databas Setup

Kör migrations i Supabase SQL Editor (i ordning):

```sql
-- 1. Core schema
\i supabase/migrations/20251122160200_remote_schema.sql

-- 2. Org assignment system (3-lagers säkerhet)
\i supabase/migrations/PERMANENT_FIX_org_assignment.sql

-- 3. Trial abuse protection (missbruksskydd)
\i supabase/migrations/ADD_TRIAL_ABUSE_PROTECTION.sql

-- 4. Yearly subscriptions
\i supabase/migrations/ADD_YEARLY_SUBSCRIPTIONS.sql

-- 5. Grooming prices
\i supabase/migrations/20251125_create_grooming_prices.sql

-- 6. Testdata (valfritt)
\i complete_testdata.sql
```

### 5. Starta Development Server

```bash
npm run dev
# Öppnar på http://localhost:3000 (eller :3002 om 3000 är upptagen)
```

---

## 💰 Abonnemangssystem

### Modulär Prismodell

DogPlanner använder ett **tjänstebaserat system** där organisationer betalar endast för aktiverade tjänster:

| Tjänster           | Pris/mån | Pris/år | Rabatt/år |
| ------------------ | -------- | ------- | --------- |
| Hundfrisör         | 199 kr   | 1788 kr | 600 kr    |
| Hunddagis          | 399 kr   | 4188 kr | 600 kr    |
| Hundpensionat      | 399 kr   | 4188 kr | 600 kr    |
| 2 tjänster (paket) | 599 kr   | 6588 kr | 600 kr    |
| Alla 3 (paket)     | 799 kr   | 8988 kr | 600 kr    |

**✨ Gratisperiod:** 2 månader (60 dagar) - endast första gången per organisation

### Missbruksskydd

**Problem:** Användare kan skapa flera konton för att få flera gratisperioder.

**Lösning:** Trestegs-spårning som blockerar:

1. **Samma email** med nytt org-nummer → ❌ Blockeras
2. **Samma org-nummer** med ny email → ❌ Blockeras
3. **Raderade + återskapade** konton → ❌ Blockeras (historik finns kvar)

**Implementation:**

```typescript
// Vid registrering - kontrollera berättigande
const { data: eligibility } = await supabase.rpc("check_trial_eligibility", {
  p_org_number: orgNumber,
  p_email: email,
});

if (!eligibility.is_eligible) {
  throw new Error(`Trial ej tillåten: ${eligibility.reason}`);
}

// Vid Stripe checkout - ge trial endast första gången
subscription_data: {
  trial_period_days: org?.has_had_subscription ? 0 : 60,
}
```

**Database Tables:**

- `orgs.has_had_subscription` - Permanent flagga (sätts aldrig tillbaka)
- `org_email_history` - Spårar email + org-nummer kombinationer
- `org_number_subscription_history` - Permanent historik (överlever radering)

📄 **Guide:** `TRIAL_MISSBRUKSSKYDD.md` (400+ rader)

### Stripe Integration

**Checkout Flow:**

1. Användare registrerar → 60 dagars gratis trial (automatiskt)
2. Trial går ut → Väljer tjänster på `/admin/abonnemang`
3. System mappar till Stripe Price ID baserat på val
4. Redirectas till Stripe Checkout
5. Betalar → Får 60 dagar trial (om första betalningen)
6. Efter trial → Automatisk månadsbetalning

**Webhook Events:**

```typescript
// /api/subscription/webhook/route.ts
switch (event.type) {
  case "checkout.session.completed":
  // Aktiverar prenumeration, sätter has_had_subscription=true
  case "invoice.payment_succeeded":
  // Uppdaterar betalningsstatus
  case "customer.subscription.updated":
  // Uppdaterar status (active/past_due/canceled)
  case "customer.subscription.deleted":
  // Avslutar prenumeration
}
```

📄 **Guide:** `STRIPE_INTEGRATION_GUIDE.md` (400+ rader)

---

## 📋 Prismodell

### Månadspriser

```
Hundfrisör:      199 kr/mån
Hunddagis:       399 kr/mån
Hundpensionat:   399 kr/mån
──────────────────────────────
2 tjänster:      599 kr/mån (Spar 199 kr/mån)
Alla 3 tjänster: 799 kr/mån (Spar 398 kr/mån)
```

### Årspriser (50 kr/mån rabatt)

```
Hundfrisör:      1788 kr/år (149 kr/mån)
Hunddagis:       4188 kr/år (349 kr/mån)
Hundpensionat:   4188 kr/år (349 kr/mån)
──────────────────────────────
2 tjänster:      6588 kr/år (549 kr/mån)
Alla 3 tjänster: 8988 kr/år (749 kr/mån)
```

**Total årsrabatt:** 600 kr per tjänst

### Konsistens Verifierad ✅

Alla priser är korrekta i:

- `/app/register/page.tsx` - Registreringssida
- `/app/foretag/page.tsx` - Företagssida
- `/app/admin/abonnemang/page.tsx` - Admin prenumeration
- `/app/admin/tjanster/page.tsx` - Tjänsteinställningar
- `/app/legal/terms-business/page.tsx` - Användarvillkor
- `/app/api/subscription/checkout/route_new.ts` - Checkout API

---

## 🔒 Säkerhet & GDPR

### Row Level Security (RLS)

Alla tabeller använder RLS för att isolera data mellan organisationer:

```sql
-- Exempel: owners-tabellen
CREATE POLICY "Users can view owners in their org"
ON owners FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM profiles
    WHERE id = auth.uid()
  )
);
```

**RLS-aktiverade tabeller:**

- `orgs`, `profiles`, `owners`, `dogs`
- `bookings`, `grooming_bookings`, `grooming_prices`
- `org_subscriptions`, `subscription_history`
- `owner_discounts`, `boarding_seasons`

### GDPR-Compliance

**Artikel 6.1.a - Samtycke:**

- Användare samtycker vid registrering
- Samtycke loggas i `consent_logs` tabell
- Kan återkallas när som helst

**Artikel 15 - Rätt till tillgång:**

- Användare kan exportera sin data via `/account/gdpr`
- JSON-format med all persondata

**Artikel 17 - Rätt till radering:**

- Soft delete: `dogs.is_deleted`, `owners.is_anonymized`
- Data behålls 3 år för bokföring (bokföringslagen)
- Permanent radering efter lagringstid

**Artikel 30 - Register över behandlingar:**

- `booking_events` loggar alla bokningsändringar
- Spårar: vem, vad, när, varför

📄 **Migration:** `20251116_add_cancellation_and_gdpr_fields.sql`

---

## 🌐 Deployment

### Vercel Setup

1. **Koppla GitHub Repository**

   ```bash
   vercel login
   vercel link
   ```

2. **Konfigurera Environment Variables**

   Gå till Vercel Dashboard → Settings → Environment Variables:

   ```
   ✅ NEXT_PUBLIC_SUPABASE_URL
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ STRIPE_SECRET_KEY
   ✅ STRIPE_WEBHOOK_SECRET
   ✅ STRIPE_PRICE_ID_GROOMING (+ 9 andra Price IDs)
   ✅ RESEND_API_KEY
   ✅ NEXT_PUBLIC_APP_URL
   ```

3. **Deploy**

   ```bash
   git push origin main
   # Vercel deployer automatiskt
   ```

### Stripe Webhook Setup

1. Gå till Stripe Dashboard → Developers → Webhooks
2. Lägg till endpoint: `https://your-domain.vercel.app/api/subscription/webhook`
3. Välj events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Kopiera webhook secret → Lägg till i Vercel som `STRIPE_WEBHOOK_SECRET`

### Supabase Production Setup

1. **Kör migrations** i Production database
2. **Verifiera RLS policies** är aktiverade
3. **Konfigurera Storage bucket** för `documents` (privat)
4. **Testa auth-flödet** med test-användare

---

## 🐛 Felsökning

### "Ingen organisation tilldelad" vid registrering

**Orsak:** Ett av de 3 lagren i org assignment misslyckades.

**Lösning:**

1. Kontrollera att trigger `on_auth_user_created` finns:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Verifiera att `/api/onboarding/auto` körs efter registrering
3. Kör healing-funktionen manuellt:
   ```sql
   SELECT heal_user_missing_org(auth.uid());
   ```

📄 **Se:** `PERMANENT_FIX_org_assignment.sql` för fullständig dokumentation

### Trial-period visar fel antal dagar

**Symptom:** Visar 90 dagar istället för 60 dagar.

**Orsak:** Gammal kod använde 3 månader.

**Verifiering:**

```bash
# Sök efter fel trial-period
grep -r "setMonth.*+\s*3" app/
grep -r "interval '90 days'" supabase/
```

**Fix:**

- ✅ `app/api/onboarding/complete/route.ts` - Fixat till 60 dagar (30 nov 2025)
- ✅ `app/api/onboarding/auto/route.ts` - Korrekt (60 dagar)
- ✅ `app/api/subscription/checkout/route_new.ts` - Korrekt (`trial_period_days: 60`)
- ✅ `supabase/migrations/ADD_TRIAL_ABUSE_PROTECTION.sql` - Korrekt (`interval '60 days'`)

### Prisfel i UI

**Symptom:** Hundfrisör visar 299 kr istället för 199 kr.

**Lösning:**

```bash
# Sök efter alla förekomster av 299 kr
grep -r "299 kr" app/
# Ersätt med 199 kr där hundfrisör nämns
```

**Verifierade filer (30 nov 2025):**

- ✅ `/app/register/page.tsx`
- ✅ `/app/foretag/page.tsx`
- ✅ `/app/admin/abonnemang/page.tsx`
- ✅ `/app/admin/tjanster/page.tsx`

### Stripe checkout misslyckas

**Symptom:** 404 eller 500 fel vid checkout.

**Debug:**

1. Verifiera Price IDs i `.env.local`:
   ```bash
   echo $STRIPE_PRICE_ID_GROOMING
   # Ska returnera: price_1SZ7UoJrKJIC6EVuE3sU800E
   ```
2. Testa Price ID i Stripe Dashboard → Products
3. Verifiera webhook secret:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   # Ska börja med: whsec_
   ```

### Infinite loading spinner

**Symptom:** Sida laddar oändligt, ingen data visas.

**Orsak:** Använder inte `currentOrgId` från AuthContext.

**Fix:**

```typescript
// ❌ FEL:
const { user } = useAuth();
useEffect(() => {
  if (user) loadData();
}, [user]);

// ✅ RÄTT:
const { currentOrgId, loading: authLoading } = useAuth();
useEffect(() => {
  if (currentOrgId && !authLoading) {
    loadData();
  } else if (!authLoading && !currentOrgId) {
    setLoading(false); // VIKTIGT: Stoppa loading om ingen org
  }
}, [currentOrgId, authLoading]);
```

---

## 📚 Dokumentation

### Viktiga Filer

| Dokument                                               | Beskrivning                                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| `README.md`                                            | Denna fil - systemöversikt                       |
| `TRIAL_MISSBRUKSSKYDD.md`                              | Missbruksskydd för 2 månaders trial (400+ rader) |
| `STRIPE_INTEGRATION_GUIDE.md`                          | Stripe setup-guide (400+ rader)                  |
| `2_MANADERS_TRIAL_IMPLEMENTATION.md`                   | Komplett sammanfattning av trial-system          |
| `.github/copilot-instructions.md`                      | Guide för AI-kodning (3-lagers org assignment)   |
| `supabase/migrations/PERMANENT_FIX_org_assignment.sql` | Dokumentation av org assignment-system           |
| `complete_testdata.sql`                                | Testdata för development                         |

### SQL Migrations

Alla migrations finns i `supabase/migrations/`:

```
20251122160200_remote_schema.sql              - Core schema
PERMANENT_FIX_org_assignment.sql              - 3-lagers org assignment
ADD_TRIAL_ABUSE_PROTECTION.sql                - Missbruksskydd
ADD_YEARLY_SUBSCRIPTIONS.sql                  - Årsprenumerationer
20251125_create_grooming_prices.sql           - Frisörpriser
20251116_add_cancellation_and_gdpr_fields.sql - GDPR-compliance
```

---

## ✅ System Status (30 november 2025)

### Produktionsklar ✅

Alla kritiska komponenter verifierade och deployade:

**Backend:**

- ✅ 3-lagers org assignment system
- ✅ 2 månaders trial överallt (60 dagar)
- ✅ Missbruksskydd aktivt
- ✅ RLS policies korrekta
- ✅ Database triggers fungerar

**Stripe:**

- ✅ 10 Price IDs konfigurerade (5 monthly + 5 yearly)
- ✅ Webhook secret konfigurerad
- ✅ Checkout-flöde testat
- ✅ Trial-period korrekt (60 dagar)

**UI/UX:**

- ✅ Trial-text konsekvent "2 månader" överallt
- ✅ Priser korrekta (199/399/399/599/799 kr)
- ✅ Registreringssida clean design
- ✅ Legal-sidor uppdaterade (Terms v2.0, PUB v2.0)

**Deployment:**

- ✅ Vercel konfigurerad med alla environment variables
- ✅ Automatisk deployment vid push till main
- ✅ Production URL: https://dog-planner.vercel.app

### Kända Begränsningar

⚠️ **SLA-sidan** (`/app/legal/sla/page.tsx`) refererar fortfarande till gamla planer (Free/Basic/Professional/Enterprise).

- **Påverkan:** Ingen - sidan används inte i produktflödet
- **Åtgärd:** Kan uppdateras senare om önskvärt

---

## 🤝 Bidra

### Utvecklingsmiljö

```bash
# 1. Klona repository
git clone https://github.com/CassandraWikgren/DogPlanner.git

# 2. Installera dependencies
npm install

# 3. Kopiera .env.example → .env.local och fyll i nycklar

# 4. Starta development server
npm run dev

# 5. Öppna http://localhost:3000
```

### Commit-konventioner

```
feat: Ny funktion
fix: Bugfix
docs: Dokumentation
style: Formatering
refactor: Kod-omstrukturering
test: Tester
chore: Underhåll
```

**Exempel:**

```bash
git commit -m "fix: Korrigera trial-period till 2 månader i onboarding/complete"
```

### Pull Requests

1. Skapa feature branch: `git checkout -b feature/min-nya-funktion`
2. Commita ändringar: `git commit -m "feat: Lägg till X"`
3. Pusha: `git push origin feature/min-nya-funktion`
4. Öppna PR på GitHub

---

## 📞 Support

**Email:** info@dogplanner.se  
**GitHub Issues:** [https://github.com/CassandraWikgren/DogPlanner/issues](https://github.com/CassandraWikgren/DogPlanner/issues)

---

## 📜 Licens

Copyright © 2025 DogPlanner. Alla rättigheter förbehållna.

---

**Senast uppdaterad:** 30 november 2025  
**Version:** 2.0  
**Commit:** deee6c2 (Trial-period fix)
