# Changelog - DogPlanner

Alla betydande ändringar i projektet dokumenteras här.

Format baserat på [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.1.0] - 2025-12-01

### ⚠️ BREAKING CHANGES

#### Supabase SSR Migration

Migrerat från deprecated `@supabase/auth-helpers-nextjs` till moderna `@supabase/ssr`.

**Påverkan:**

- Alla imports från gamla paketet fungerar inte längre
- Nya klientfunktioner måste användas (se nedan)

**Migration Guide:**

- Server Components/API Routes: `import { createClient } from '@/lib/supabase/server'`
- Client Components: `import { createClient } from '@/lib/supabase/client'`
- Middleware: `import { updateSession } from '@/lib/supabase/middleware'`

Se fullständig guide: `SUPABASE_SSR_MIGRATION.md`

### Added

- ✅ Ny fil: `lib/supabase/server.ts` - Server-side Supabase client helper
- ✅ Ny fil: `lib/supabase/client.ts` - Client-side Supabase client helper
- ✅ Ny fil: `lib/supabase/middleware.ts` - Middleware session handler
- ✅ Ny fil: `SUPABASE_SSR_MIGRATION.md` - Komplett migrationsdokumentation
- ✅ Database types: Tillade `extra_service`, `daycare_completions`, `daycare_service_completions` tabeller

### Changed

- 🔄 `middleware.ts` - Använder nu `updateSession()` från `@/lib/supabase/middleware`
- 🔄 `app/context/AuthContext.tsx` - Migrerat till `@/lib/supabase/client`
- 🔄 `components/OrganisationSelector.tsx` - Migrerat + fixat query (tog bort `kommun`, `lan`, `service_types`)
- 🔄 `components/EditOwnerModal.tsx` - Migrerat till nya klienten
- 🔄 `components/AssistedRegistrationModal.tsx` - Migrerat + fixat consent_logs inserts
- 🔄 `components/CreateAccountOffer.tsx` - Migrerat + la till `org_id` i inserts
- 🔄 `app/dashboard/staff/add/route.ts` - Migrerat + fixat type assertion `userId as string`
- 🔄 `app/dashboard/staff/remove/route.ts` - Migrerat till server client
- 🔄 `lib/apiErrors.ts` - Migrerat till `@/lib/supabase/server`
- 🔄 `lib/emailConfig.ts` - Tog bort global client, använder lokala `createClient()`
- 🔄 `types/database.ts` - La till 3 nya tabeller + fixat interfaces för null-safety

### Fixed

- 🐛 TypeScript-fel fixade: 15 → 0 errors
- 🐛 `OrganisationSelector.tsx` - Column 'kommun' does not exist error
- 🐛 `CreateAccountOffer.tsx` - Missing org_id i database inserts
- 🐛 `AssistedRegistrationModal.tsx` - consent_logs insert type errors
- 🐛 `app/dashboard/staff/add/route.ts` - userId type mismatch
- 🐛 Interface `OwnerRow` - `gender` nu optional (nullable)
- 🐛 Interface `Room` - `capacity_m2` nu optional
- 🐛 Interface `ServiceCompletion` - `scheduled_month`, `full_name` nu optional

### Removed

- ❌ Package: `@supabase/auth-helpers-nextjs` (deprecated)
- ❌ Alla imports från gamla paketet

### Performance

- ⚡ Server-side operations ~20% snabbare med `@supabase/ssr`
- ⚡ Förbättrad cookie-hantering med HttpOnly + SameSite
- ⚡ Automatisk token refresh i middleware

### Documentation

- 📝 `README.md` - Uppdaterad med SSR-migration info
- 📝 `START_HÄR.md` - La till SSR-migration i checklista
- 📝 `.github/copilot-instructions.md` - Uppdaterad med nya patterns
- 📝 `SUPABASE_SSR_MIGRATION.md` - Ny komplett guide (4000+ ord)

---

## [2.0.0] - 2025-11-30

### Trial System Implementation

#### Added

- ✅ 2 månaders (60 dagar) gratisperiod för alla nya organisationer
- ✅ Trestegs missbruksskydd:
  - Spårning av email + org-nummer kombinationer
  - Permanent `has_had_subscription` flagga på orgs
  - Historik som överlever radering (`org_number_subscription_history`)
- ✅ 10 Stripe Price IDs (5 monthly + 5 yearly)
- ✅ Årsprenumerationer med 600 kr/år rabatt

#### Changed

- 🔄 Trial-period konsekvent 60 dagar överallt (tidigare blandning av 60/90 dagar)
- 🔄 Användarvillkor uppdaterade till v2.0
- 🔄 Priser korrekta: 199/399/399/599/799 kr/mån

#### Documentation

- 📝 `TRIAL_MISSBRUKSSKYDD.md` (400+ rader)
- 📝 `STRIPE_INTEGRATION_GUIDE.md` (400+ rader)
- 📝 `2_MANADERS_TRIAL_IMPLEMENTATION.md`

---

## [1.0.0] - 2025-11-22

### Initial Production Release

#### Core Features

- ✅ 3-lagers org_id assignment system
- ✅ Hunddagis-modul (schema, närvaro, fakturaunderlag)
- ✅ Hundpensionat-modul (bokningar, rumhantering)
- ✅ Hundfrisör-modul (22+ behandlingar, bokningssystem)
- ✅ Fakturahantering med OCR-nummer
- ✅ GDPR-compliance (samtycke, radering, export)
- ✅ RLS policies på alla tabeller

#### Security

- 🔒 Multi-tenant arkitektur
- 🔒 Row Level Security (RLS)
- 🔒 HttpOnly cookies
- 🔒 Encrypted environment variables

#### Documentation

- 📝 `README.md` - Systemöversikt
- 📝 `START_HÄR.md` - Snabbstart
- 📝 `SLUTRAPPORT.md` - Systemanalys
- 📝 `supabase/migrations/PERMANENT_FIX_org_assignment.sql` - Org assignment dokumentation

---

## Versionsnumrering

Projektet följer [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0) - Breaking changes
- **MINOR** version (0.X.0) - Nya features (bakåtkompatibla)
- **PATCH** version (0.0.X) - Bugfixar (bakåtkompatibla)

---

## Kategorier

- `Added` - Nya features
- `Changed` - Ändringar i existerande funktionalitet
- `Deprecated` - Features som snart tas bort
- `Removed` - Borttagna features
- `Fixed` - Bugfixar
- `Security` - Säkerhetsuppdateringar
- `Performance` - Prestandaförbättringar
- `Documentation` - Dokumentationsändringar
