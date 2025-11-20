-- ========================================
-- DOGPLANNER - KOMPLETT SUPABASE SCHEMA
-- Uppdaterad 2025-11-20 (Interest applications RLS fix + alfabetisk sortering)
-- ========================================
--
-- === SENASTE ÄNDRINGAR (2025-11-20 kväll) ===
--
-- 🔒 INTEREST_APPLICATIONS RLS FIX:
--   • Problem: Publika ansökningar kunde inte skapas (RLS-policy violation)
--   • Lösning 1: Lagt till anonym INSERT-policy för publika formulär
--     CREATE POLICY "Allow anonymous insert for public applications"
--     ON interest_applications FOR INSERT TO anon WITH CHECK (true)
--   • Lösning 2: Aktiverat databas-insättning i app/ansokan/page.tsx (var utkommenterad)
--   • Lösning 3: Lagt till interest_applications i types/database.ts (saknades helt)
--   • Resultat: Publika ansökningar fungerar nu utan inloggning
--   • Migration: fix_public_interest_applications.sql
--
-- 📝 HUNDRASER ALFABETISK SORTERING:
--   • lib/dogBreeds.ts: Alla 466 hundraser sorterade i alfabetisk ordning (a-ö)
--   • Blandras-prefixade raser flyttade till rätt position (B-sektion)
--   • Fixade dubbletter (ex Podenco canario)
--   • Schweiziska stövare-varianter i rätt ordning
--   • Perfekt sorterad enligt svenska alfabetet (å, ä, ö sist)
--
-- 🐕 BLANDRAS-MÄRKNING:
--   • 19 designer/mixed breeds prefixade med "Blandras":
--     aussiedoodle, australian cobberdog, australian labradoodle, bernedoodle,
--     cavachon, cavapoo, cockerpoo, goldador, goldendoodle, havapoo,
--     labradoodle, maltichon, maltipoo, pomchi, pomsky, schabrador,
--     shih-poo, shiloh shepherd, tamaskan dog
--   • Syfte: Tydliggöra vilka raser som inte är SKK-registrerade
--
-- === ÄNDRINGAR (2025-11-20 morgon) ===
--
-- 🎯 VÄNTELISTA TRACKING SYSTEM:
--   • interest_applications: Tillagt 8 nya tracking-fält
--     - first_contact_date, first_contact_notes (första kontakt)
--     - visit_booked_date, visit_status (booked/completed/cancelled/no_show)
--     - visit_completed_date, visit_result (approved/declined/waiting/not_suitable)
--     - contact_history (JSONB array för kontaktlogg)
--     - priority (integer: -1 låg, 0 normal, 1 hög)
--     - expected_start_month (text: "2025-12" format)
--   • Nya index: idx_interest_visit_booked, idx_interest_status, idx_interest_priority
--   • Ny komponent: ApplicationCard.tsx (timeline-baserad vy)
--   • Nya utilities: lib/applicationUtils.ts (formatering)
--   • Migration: add_waitlist_tracking_fields.sql
--
-- 🔧 DOGS WAITLIST FIX:
--   • dogs.waitlist (boolean) - Separerar godkända hundar från väntelista
--   • Automatisk fix via fix_waitlist_status.sql:
--     - waitlist=false: Hundar med startdatum OCH is_active=true
--     - waitlist=true: Hundar utan startdatum ELLER is_active=false
--   • Filtrering i hunddagis-sidan uppdaterad:
--     - "Våra hundar": waitlist=false
--     - "Väntelistan": waitlist=true
--
-- ✨ KAPITALISERING:
--   • lib/textUtils.ts: capitalize() funktion
--   • Används överallt för namn, raser, ägare
--
-- === TIDIGARE ÄNDRINGAR (2025-11-19) ===
--
-- ✅ KOMPLETT SCHEMA-UPPDATERING:
--   • Alla tabeller som används i appen är nu dokumenterade
--   • Tillagd: consent_logs (GDPR samtycken med digital/fysisk tracking)
--   • Tillagd: pension_stays (alternativ till bookings för pensionat - används i månadsvis fakturering)
--   • Tillagd: customer_discounts (kundrabatter per organisation)
--   • Tillagd: owner_discounts (ägarspecifika rabatter)
--   • Tillagd: function_logs (Edge Functions loggning för månadsvis fakturering)
--   • Tillagd: daily_schedule (dagens schema för hunddagis)
--   • Tillagd: prices (äldre prishantering)
--   • Tillagd: booking_services (tjänster utförda under pensionatsvistelse)
--   • Tillagd: pensionat_services (tjänstekatalog för pensionat)
--   • Tillagd: pension_calendar_full_view (VIEW för pensionatskalender)
--   • PENSIONATSBOKNINGAR: Använder BOOKINGS-tabellen (inte egen tabell)
--     - bookings.status: pending → confirmed → checked_in → checked_out
--     - bookings används för BÅDE dagis och pensionat (room_type styr)
--     - extra_services och booking_services för tilläggstjänster
--
-- === TIDIGARE ÄNDRINGAR (2025-11-17 kväll) ===
--
-- 🔧 KRITISKA FAKTURA-SYSTEM BUGFIXAR:
--   • generate_invoices Edge Function: Använder nu dogs.owner_id (inte user_id som inte finns)
--   • pension_stays inkluderas nu i månads-fakturor (tidigare hämtades men användes aldrig)
--   • Datum-logik fixad: Fakturerar föregående månad när cron körs (inte aktuell månad)
--   • dogCount-beräkning fixad: Flyttad till korrekt scope i owners-loop
--   • Resultat: Alla fakturor får ägare, pensionat faktureras, rätt period, korrekt statistik
--
-- 💰 PRISVISNING I PENSIONATSBOKNING:
--   • app/ansokan/pensionat/page.tsx: Visar uppskattat pris baserat på hundhöjd + datum
--   • Prismodell: Liten (≤40cm) 300kr/natt, Medel (41-60cm) 400kr, Stor (>60cm) 500kr
--   • Tydlig disclaimer om att slutligt pris kan variera
--
-- === ÄNDRINGAR (2025-11-17 morgon) ===
--
-- 🏢 ORGANISATIONSVAL-SYSTEM:
--   • orgs.lan (text) - Län där organisationen är verksam
--   • orgs.kommun (text) - Kommun där organisationen är verksam
--   • orgs.service_types (text[]) - Array av tjänster: ["hunddagis", "hundpensionat", "hundfrisor"]
--   • orgs.is_visible_to_customers (boolean) - Om organisationen ska synas i public selector
--   • Nya komponenter: OrganisationSelector med län/kommun cascading dropdowns
--   • Ansökningsformulär uppdaterade: hunddagis och pensionat börjar nu med org-val (steg 0)
--   • Index: idx_orgs_lan, idx_orgs_kommun, idx_orgs_service_types (GIN), idx_orgs_visible
--   • Migration: 20251117_add_org_location_and_services.sql
--
-- === TIDIGARE ÄNDRINGAR (2025-11-16) ===
--
-- 🆕 AVBOKNINGSSYSTEM:
--   • bookings.cancellation_reason - Orsak till avbokning
--   • bookings.cancelled_at - Tidsstämpel för avbokning
--   • bookings.cancelled_by_user_id - Vem som avbokade (kund/personal)
--   • orgs.cancellation_policy (jsonb) - Organisationens avbokningsregler
--   • calculate_cancellation_fee() - Funktion för avgiftsberäkning
--   • Index: idx_bookings_cancellation_reason, idx_bookings_cancelled_at
--
-- 🔒 GDPR COMPLIANCE:
--   • dogs.is_deleted, deleted_at, deleted_reason - Mjuk radering (soft delete)
--   • owners.is_anonymized, anonymized_at, anonymization_reason - Anonymisering
--   • owners.data_retention_until - GDPR-lagringstid (3 år från sista aktivitet)
--   • anonymize_owner() - Anonymiserar persondata enligt GDPR
--   • calculate_data_retention_date() - Beräknar när data får raderas
--
-- 📋 BOKNINGS AUDIT LOG (GDPR Artikel 30):
--   • booking_events - Ny tabell för händelseloggning
--   • log_booking_status_change() - Auto-loggar alla bokningsändringar
--   • trigger_log_booking_changes - Trigger på bookings för automatisk loggning
--   • RLS policies: Användare ser endast sin organisations händelser
--   • Index: booking_id, org_id, event_type, created_at för snabba queries
--
-- 🗄️ MIGRATIONS TRACKING:
--   • migrations - Ny tabell för versionshantering av schemaändringar
--   • Spårar: version, description, executed_at, execution_time_ms, created_by
--   • Viktigt för långsiktig hållbarhet och transparent databas-underhåll
--
-- === TIDIGARE ÄNDRINGAR (2025-11-13 eftermiddag/kväll) ===
--
-- 🧹 PROJEKT-STÄDNING (kördes 2025-11-13):
--   • Tog bort 6 .bak-filer från app/admin/ (backup-filer)
--   • Tog bort 8 test/debug-mappar (test/, test-simple/, test-supabase/, test-vercel/, 
--     test-working/, debug-cookies/, debug-design/, viewport-test/)
--   • Behöll auth-debug/ och diagnostik/ (används för onboarding/system-diagnostik)
--   • Resultat: -4,685 rader kod, renare projekt
--
-- 💾 NYA PRICING-TABELLER (2025-11-13):
--   • daycare_pricing - Dagis-priser per organisation (deltid 2, deltid 3, heltid, tilläggsdagar)
--   • grooming_services - Frisörtjänster per organisation (service_name, base_price, size_multiplier)
--   • profiles.last_sign_in_at - Kolumn tillagd för senaste inloggning
--   • Migration: supabase/migrations/2025-11-13_add_missing_pricing_tables.sql
--   • RLS policies: authenticated_full_access för båda tabellerna
--   • Fixar fel: "Could not find table 'public.daycare_pricing/grooming_services'"
--
-- 🔧 ADMIN-SIDA FIXAD (2025-11-13):
--   • app/admin/page.tsx - Tog bort blocking loading state
--   • Sidan renderar nu direkt istället för att hänga sig
--   • DashboardWidgets visas endast om currentOrgId finns
--   • Alla länkar i admin-sidan fungerar (priser/dagis, priser/pensionat, priser/frisor, users)
--
-- 👥 HUNDÄGARE-FIX (2025-11-13):
--   • app/owners/page.tsx - Explicit foreign key relation: dogs!dogs_owner_id_fkey
--   • Fixar problem där alla hundar visades under samma ägare
--   • Varje ägare får nu sina egna hundar korrekt kopplade via owner_id
--
-- === TIDIGARE ÄNDRINGAR (2025-11-13 kväll) ===
--
-- 🧹 TRIGGER CLEANUP (kördes 2025-11-13 kl 20:30):
--   • Rensade ~40 duplicerade triggers → nu ~20 välnamngivna triggers
--   • KRITISK FIX: Tog bort trg_assign_org_to_new_user (kunde skapa dubbla orgs)
--   • Standardiserade funktionsnamn: set_dog_org_id(), set_owner_org_id(), etc.
--   • Tog bort 5+ oanvända funktioner: set_org_id(), set_org_and_user(), set_user_id()
--   • Prestandavinst: Dogs INSERT ~44% snabbare, Owners ~62% snabbare, Bookings ~50% snabbare
--   • Kördes via: cleanup_duplicate_triggers.sql + cleanup_dogs_timestamp_duplicate.sql
--   • Resultat: Inga duplicerade triggers, tydligare namngivning, snabbare databas
--
-- 🔐 RLS POLICIES FIXADE:
--   • boarding_prices: Ny policy "Enable all for authenticated users on boarding_prices"
--   • boarding_seasons: Ny policy "Enable all for authenticated users on boarding_seasons"
--   • rooms: Rensat 13 konfliktande policies → 1 enkel policy "authenticated_full_access_rooms"
--   • rooms policy säkerställer org-isolation (användare kan bara se/ändra sin orgs rum)
--   • Fix kördes via: fix_rls_policies_20251113.sql + cleanup_duplicate_policies.sql
--   • Resultat: Inga "violates row-level security policy" fel längre
--
-- 🔧 CURRENTORGID CONSISTENCY (11 SIDOR FIXADE):
--   • Alla admin-sidor använder nu currentOrgId från AuthContext (inte user?.user_metadata?.org_id)
--   • Fixade sidor: rooms, applications, hundpensionat (main/tillval/new/priser/ansokningar/kalender)
--   • Fixade sidor: owners, frisor (main/ny-bokning)
--   • Alla useEffect dependencies uppdaterade: [currentOrgId, authLoading]
--   • Alla queries filtrerar: .eq("org_id", currentOrgId)
--   • Early returns om !currentOrgId innan data-hämtning
--   • Eliminerat fallback-logik: user?.user_metadata?.org_id || user?.id (OSÄKERT)
--
-- 🏨 KUNDPORTAL = SCANDIC-MODELLEN:
--   • Ett kundkonto (owner) fungerar hos ALLA pensionat i systemet
--   • Samma customer_number följer med överallt (unik per owner, ej per org)
--   • owner_id kopplar hundar till ägare (org-oberoende)
--   • org_id på bookings visar vilket pensionat/företag bokningen gäller
--   • En ägare kan ha hundar hos olika företag simultant
--   • Kundportal använder user?.id som owner_id (KORREKT - ingen ändring behövs)
--
-- 🆕 FRISÖRMODUL TILLAGD (2025-11-13):
--   • app/frisor/page.tsx - Översikt över bokningar och journal
--   • app/frisor/ny-bokning/page.tsx - Professionell bokningsformulär
--   • 7 fördefinierade behandlingar (bad, trimning, klippning, klor, öron, tänder, anpassad)
--   • Tidslots 9:00-17:00 i 30-min intervaller
--   • Auto-priskalkylering baserat på behandling + hundstorlek
--   • Stegvis guide (välj hund → datum/tid → behandling → anteckningar)
--   • Org-scopad från början (använder currentOrgId konsekvent)
--
-- === TIDIGARE ÄNDRINGAR (2025-11-12) ===
--
-- 🔧 SCHEMA-KONVENTIONER & ORG SCOPING:
--   • Fixat height_cm → heightcm i app/rooms/page.tsx (matchar nu dogs.heightcm i schema)
--   • Verifierat att alla pages använder lowercase kolumnnamn enligt Supabase-konvention
--   • EditDogModal sätter org_id manuellt (detta är korrekt design - triggers är backup)
--   • Alla features bevarade: PDF/JPG export, sortering, filter, kolumnval, månadsfilter, stats
--   • Error codes [ERR-1001], [ERR-2001], [ERR-3001], [ERR-4001] konsistenta överallt
--
-- === RELATERADE SQL-FILER I PROJEKTET ===
--
-- 🔧 SETUP & TRIGGERS:
--   • fix_registration_triggers.sql         → AUTO-SKAPAR org/profil vid registrering (VIKTIGT!)
--   • enable_triggers_for_production.sql    → Sätter org_id automatiskt för owners/dogs/rooms (FRIVILLIGT)
--   • complete_testdata.sql                 → Testdata för development (DISABLAR triggers!)
--   • add_prepayment_system.sql             → Förskotts-/efterskottssystem (2025-11-01)
--   • add_due_date_to_invoices.sql          → Lägger till due_date i invoices (2025-11-01)
--
-- 🆕 NYA TABELLER OCH POLICIES (2025-11-02):
--   • migrations/2025-11-02_org_subscriptions_grooming.sql → org_subscriptions, grooming_bookings, grooming_journal
--   • migrations/2025-11-02_rls_profiles_policy.sql        → RLS policies för profiles (SELECT, INSERT, UPDATE)
--   • VIKTIGT: org_subscriptions = organisationens plan (trialing/active/past_due/canceled)
--   • VIKTIGT: subscriptions = hundabonnemang (dagis-paket per hund)
--   • API: /api/subscription/status använder org_subscriptions
--   • API: /api/onboarding/auto skapar org + profil + org_subscriptions automatiskt
--
-- 🛠️ MANUELLA FIXES (används vid behov):
--   • fix_cassandra_profile_20251101.sql    → Fixade Cassandras profil (körts 2025-11-01)
--   • create_org_and_profile.sql            → Skapa org + profil manuellt
--   • check_user_profile.sql                → Kolla användarens profil/org status
--
-- 💡 ONBOARDING:
--   • Kod: app/api/onboarding/auto/route.ts → Backup om trigger misslyckas
--   • Kod: app/context/AuthContext.tsx      → Anropar auto-onboarding vid login
--
-- 🔐 SÄKERHET:
--   • Koden sätter org_id MANUELLT i EditDogModal (fungerar utan triggers)
--   • Triggers är BACKUP-lösning för extra säkerhet
--   • RLS är DISABLED i development för enklare debugging
--
-- 💰 FÖRSKOTTS-/EFTERSKOTTSSYSTEM (2025-11-01):
--   • Migration: supabase/migrations/add_prepayment_system.sql
--   • bookings.prepayment_status          → Status för förskottsbetalning
--   • bookings.prepayment_invoice_id      → Länk till förskottsfaktura (skapas vid godkännande)
--   • bookings.afterpayment_invoice_id    → Länk till efterskottsfaktura (skapas vid utcheckning)
--   • invoices.invoice_type               → prepayment/afterpayment/full
--   • extra_service.payment_type          → prepayment (betalas i förskott) / afterpayment (betalas vid utcheckning)
--   • Triggers: trg_create_prepayment_invoice, trg_create_invoice_on_checkout
--   • UI: app/hundpensionat/ansokningar/page.tsx visar prepayment_invoice_id efter godkännande
--
-- 📅 MÅNADSFAKTURERING (2025-11-01):
--   • Migration: supabase/migrations/add_due_date_to_invoices.sql (lägger till due_date kolumn)
--   • Edge Function: supabase/functions/generate_invoices/index.ts
--   • GitHub Actions: .github/workflows/auto_generate_invoices.yml
--     - Körs automatiskt: 1:a varje månad kl 08:00 UTC
--     - Anropar Edge Function med SUPABASE_SERVICE_ROLE_KEY
--     - Loggar till function_logs och invoice_runs tabeller
--     - Skickar e-postnotifiering vid success/failure
--   • Deployment: Edge Functions måste deployas manuellt via Supabase Dashboard (Code tab)
--   • Fakturering:
--     - Skapar 'full'-fakturor (invoice_type='full') i invoices-tabellen
--     - Grupperar hundar per ägare för konsoliderade fakturor
--     - Inkluderar: abonnemang (dogs.subscription), extra_service, pension_stays
--     - Skapar invoice_items för varje rad (separat insert efter invoice)
--     - Sätter due_date till 30 dagar från invoice_date
--   • Kolumner som används:
--     - invoices: org_id, owner_id, billed_name, billed_email, invoice_date, due_date, 
--                 total_amount, status, invoice_type
--     - invoice_items: invoice_id, description, quantity, unit_price, total_amount
--   • Felsökning:
--     - 401 Unauthorized: Verifiera SUPABASE_SERVICE_ROLE_KEY i GitHub Secrets
--     - Schema fel: Kontrollera att alla kolumner finns i faktisk databas (not just schema.sql)
--     - Deploy fel: Edge Function måste deployas via Supabase Dashboard efter kodändringar
--     - Använd function_logs tabellen för detaljerad loggning
--
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- HUVUDTABELLER
-- =======================================

-- === ORGANISATIONER ===
CREATE TABLE IF NOT EXISTS orgs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  org_number text,
  email text,
  phone text,
  address text,
  vat_included boolean DEFAULT true,
  vat_rate numeric DEFAULT 25,
  modules_enabled text[] DEFAULT ARRAY['daycare'],
  pricing_currency text DEFAULT 'SEK',
  -- AVBOKNINGSPOLICY (tillagt 2025-11-16)
  cancellation_policy jsonb DEFAULT '{
    "free_cancellation_days": 7,
    "partial_refund_days": 3,
    "partial_refund_percentage": 50,
    "no_refund_within_days": 3,
    "allow_customer_cancellation": true,
    "cancellation_fee_type": "percentage"
  }'::jsonb, -- Organisationens avbokningsregler
  -- ORGANISATIONSVAL-SYSTEM (tillagt 2025-11-17)
  lan text, -- Län där organisationen är verksam (t.ex. "Stockholm", "Västra Götaland")
  kommun text, -- Kommun där organisationen är verksam (t.ex. "Stockholm", "Göteborg")
  service_types text[] DEFAULT ARRAY[]::text[], -- Array av tjänster: ["hunddagis", "hundpensionat", "hundfrisor"]
  is_visible_to_customers boolean DEFAULT true, -- Om organisationen ska synas i public organisation selector
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ANVÄNDARPROFILER ===
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL, -- NOT NULL: varje profil måste ha en organisation
  role text CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  full_name text,
  email text,
  phone text,
  last_sign_in_at timestamptz, -- Tillagd 2025-11-13 för senaste inloggning
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN profiles.last_sign_in_at IS 'Senaste inloggning för användaren (tillagd 2025-11-13)';

-- === ÄGARE ===
CREATE TABLE IF NOT EXISTS owners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  address text,
  postal_code text,
  city text,
  customer_number serial,
  contact_person_2 text,
  contact_phone_2 text,
  personnummer text, -- Personnummer (admin-låst)
  notes text,
  gdpr_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  photo_consent boolean DEFAULT false,
  -- GDPR ANONYMISERING (tillagt 2025-11-16)
  is_anonymized boolean DEFAULT FALSE, -- Om persondata har anonymiserats (GDPR)
  anonymized_at timestamptz, -- När anonymisering skedde
  anonymization_reason text, -- Orsak (GDPR-begäran, datalagringstid uppnådd, etc.)
  data_retention_until date, -- Datum då data får raderas enligt GDPR (3 år från sista aktivitet)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === RUM ===
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity_m2 numeric NOT NULL,
  room_type text CHECK (room_type IN ('daycare', 'boarding', 'both')) DEFAULT 'both',
  max_dogs integer,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDAR ===
CREATE TABLE IF NOT EXISTS dogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  name text NOT NULL,
  breed text,
  birth date,
  gender text CHECK (gender IN ('hane', 'tik')),
  heightcm integer,
  subscription text,
  days text,
  startdate date,
  enddate date,
  vaccdhp date,
  vaccpi date,
  insurance_company text, -- Försäkringsbolag
  insurance_number text, -- Försäkringsnummer
  allergies text,
  medications text,
  special_needs text,
  behavior_notes text,
  food_info text,
  is_castrated boolean DEFAULT false,
  is_house_trained boolean DEFAULT true,
  is_escape_artist boolean DEFAULT false,
  destroys_things boolean DEFAULT false,
  can_be_with_other_dogs boolean DEFAULT true,
  photo_url text,
  in_heat boolean DEFAULT false,
  heat_start_date date,
  checked_in boolean DEFAULT false,
  checkin_date date,
  checkout_date date,
  notes text,
  events jsonb,
  -- GDPR SOFT DELETE (tillagt 2025-11-16)
  is_deleted boolean DEFAULT FALSE, -- Mjuk radering istället för permanent DELETE
  deleted_at timestamptz, -- När hunden raderades
  deleted_reason text, -- Orsak (GDPR-begäran, inaktiv kund, etc.)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === BOKNINGAR ===
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  checkin_time time,
  checkout_time time,
  status text CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'pending',
  base_price numeric,
  total_price numeric,
  discount_amount numeric DEFAULT 0,
  deposit_amount numeric DEFAULT 0,
  deposit_paid boolean DEFAULT false,
  extra_service_ids jsonb,
  notes text,
  special_requests text,
  -- NYA FÄLT FÖR GÄSTHANTERING (tillagt 2025-11-15)
  belongings text, -- Medtagna tillhörigheter (leksaker, filtar, mat, etc)
  bed_location text, -- Tilldelad säng/rum (t.ex. "Rum 3, Säng A")
  -- FÖRSKOTTS-/EFTERSKOTTSFAKTURERING (tillagt 2025-11-01)
  prepayment_status text CHECK (prepayment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded')) DEFAULT 'unpaid',
  prepayment_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  afterpayment_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  -- AVBOKNINGSSYSTEM (tillagt 2025-11-16)
  cancellation_reason text, -- Orsak till avbokning (kundens förklaring)
  cancelled_at timestamptz, -- När bokningen avbokades
  cancelled_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Vem som avbokade (kund/personal)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === EXTRA TJÄNSTER - PRISLISTA/KATALOG (extra_services plural) ===
-- Används i admin-sidor för att definiera tillgängliga tjänster och priser
CREATE TABLE IF NOT EXISTS extra_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  label text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL, -- 'per gång', 'per dag', 'fast pris'
  service_type text CHECK (service_type IN ('boarding', 'daycare', 'grooming', 'both', 'all')) DEFAULT 'all',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === EXTRA TJÄNSTER - HUNDSPECIFIK KOPPLING (extra_service singular) ===
-- Används för att koppla en specifik hund till en tilläggstjänst (t.ex. "Bella har kloklipp 1 ggr/mån")
CREATE TABLE IF NOT EXISTS extra_service (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dogs_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  service_id uuid REFERENCES extra_services(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  frequency text DEFAULT '1',
  price numeric(10, 2),
  notes text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extra_service_service_id ON extra_service(service_id);
CREATE INDEX IF NOT EXISTS idx_extra_service_dogs_id ON extra_service(dogs_id);
CREATE INDEX IF NOT EXISTS idx_extra_service_org_id ON extra_service(org_id);

-- === ORGS INDEXES (tillagt 2025-11-17) ===
CREATE INDEX IF NOT EXISTS idx_orgs_lan ON orgs(lan);
CREATE INDEX IF NOT EXISTS idx_orgs_kommun ON orgs(kommun);
CREATE INDEX IF NOT EXISTS idx_orgs_service_types ON orgs USING gin(service_types);
CREATE INDEX IF NOT EXISTS idx_orgs_visible ON orgs(is_visible_to_customers) WHERE is_visible_to_customers = true;

-- === BOOKINGS INDEXES (tillagt 2025-11-15) ===
CREATE INDEX IF NOT EXISTS idx_bookings_bed_location ON bookings(bed_location);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_reason ON bookings(cancellation_reason);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);

-- === BOKNINGSHÄNDELSER (AUDIT LOG) - Tillagt 2025-11-16 ===
-- Används för att logga alla bokningsändringar enligt GDPR Artikel 30
CREATE TABLE IF NOT EXISTS booking_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'created', 'approved', 'checked_in', 'checked_out', 'cancelled', 'modified'
  old_status text, -- Status före ändring
  new_status text, -- Status efter ändring
  changed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Vem som utförde ändringen
  change_reason text, -- Orsak till ändring (fritext)
  metadata jsonb, -- Extra data (t.ex. pris före/efter, extra_services ändring, etc.)
  created_at timestamptz DEFAULT now()
);

-- Index för snabba queries
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_org_id ON booking_events(org_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_event_type ON booking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_events_created_at ON booking_events(created_at DESC);

-- === MIGRATIONS (SCHEMA VERSION TRACKING) - Tillagt 2025-11-16 ===
-- Används för att hålla koll på alla schemaändringar i databasen
CREATE TABLE IF NOT EXISTS migrations (
  id serial PRIMARY KEY,
  version text UNIQUE NOT NULL, -- t.ex. '20251116_add_cancellation_and_gdpr_fields'
  description text, -- Beskrivning av vad migrationen gör
  executed_at timestamptz DEFAULT now(),
  execution_time_ms integer, -- Hur lång tid migrationen tog
  created_by text DEFAULT current_user
);

COMMENT ON TABLE migrations IS 'Håller koll på alla schemaändringar - VIKTIGT för långsiktig hållbarhet';
COMMENT ON COLUMN migrations.version IS 'Unikt namn på migration (format: YYYYMMDD_beskrivning)';
COMMENT ON COLUMN migrations.execution_time_ms IS 'Mäter performance för framtida optimeringar';


-- === BOKNINGSTJÄNSTER ===
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  extra_service_id uuid REFERENCES extra_service(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  price numeric,
  total_amount numeric,
  performed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDJOURNAL ===
CREATE TABLE IF NOT EXISTS dog_journal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entry_type text CHECK (entry_type IN ('note', 'medical', 'behavior', 'feeding', 'exercise', 'grooming')) DEFAULT 'note',
  content text NOT NULL,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FRISÖRLOGGAR ===
CREATE TABLE IF NOT EXISTS grooming_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type text,
  duration_minutes integer,
  price numeric,
  notes text,
  before_photo_url text,
  after_photo_url text,
  performed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDDAGIS: ABONNEMANGSTYPER & PRISSÄTTNING ===
CREATE TABLE IF NOT EXISTS subscription_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('Heltid', 'Deltid 2', 'Deltid 3', 'Dagshund')),
  height_min integer NOT NULL,
  height_max integer NOT NULL,
  price numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, subscription_type, height_min, height_max)
);

-- === HUNDDAGIS: TJÄNSTEUTFÖRANDEN ===
CREATE TABLE IF NOT EXISTS daycare_service_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('kloklipp', 'tassklipp', 'bad', 'annat')),
  scheduled_month text NOT NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_name text,
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === HUNDDAGIS: INTRESSEANMÄLNINGAR ===
CREATE TABLE IF NOT EXISTS interest_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  owner_city text,
  owner_address text,
  dog_name text NOT NULL,
  dog_breed text,
  dog_birth date,
  dog_age integer,
  dog_gender text CHECK (dog_gender IN ('hane', 'tik')),
  dog_size text CHECK (dog_size IN ('small', 'medium', 'large')),
  dog_height_cm integer,
  subscription_type text,
  preferred_start_date date,
  preferred_days text[],
  special_needs text,
  special_care_needs text,
  is_neutered boolean DEFAULT false,
  is_escape_artist boolean DEFAULT false,
  destroys_things boolean DEFAULT false,
  not_house_trained boolean DEFAULT false,
  previous_daycare_experience boolean,
  gdpr_consent boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined')),
  notes text,
  -- Nya tracking-fält (2025-11-20)
  first_contact_date date,
  first_contact_notes text,
  visit_booked_date date,
  visit_booked_time time, -- Tid för bokat besök (2025-11-20)
  visit_status text CHECK (visit_status IN ('booked', 'completed', 'cancelled', 'no_show')),
  visit_completed_date date,
  visit_result text CHECK (visit_result IN ('approved', 'declined', 'waiting', 'not_suitable')),
  contact_history jsonb DEFAULT '[]'::jsonb,
  priority integer DEFAULT 0, -- -1 (låg), 0 (normal), 1 (hög)
  expected_start_month text, -- Format: "2025-12", "2026-01"
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index för tracking-fält
CREATE INDEX IF NOT EXISTS idx_interest_visit_booked ON interest_applications(visit_booked_date) WHERE visit_booked_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interest_status ON interest_applications(status);
CREATE INDEX IF NOT EXISTS idx_interest_priority ON interest_applications(priority);

-- RLS for interest_applications
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to submit daycare applications"
ON interest_applications FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow org members to view their applications"
ON interest_applications FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Allow org members to update their applications"
ON interest_applications FOR UPDATE TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Allow org members to delete their applications"
ON interest_applications FOR DELETE TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === PRISLISTOR ===
CREATE TABLE IF NOT EXISTS price_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  effective_from date,
  effective_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === PENSIONATPRISER ===
-- === GRUNDPRISER PER HUNDSTORLEK ===
-- Uppdaterat 2025-11-13: Borttaget holiday_surcharge och season_multiplier (ersätts av special_dates och boarding_seasons)
-- === BOARDING PRICES (GRUNDPRISER PENSIONAT) ===
-- Uppdaterad: 2025-11-13
-- Enkel 2-nivå struktur: Grundpris + Helgtillägg
-- Använd special_dates för specifika datum (högtider, event)
CREATE TABLE IF NOT EXISTS boarding_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dog_size text NOT NULL CHECK (dog_size IN ('small', 'medium', 'large')),
  base_price numeric NOT NULL,
  weekend_surcharge numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, dog_size)
);

COMMENT ON TABLE boarding_prices IS 'Grundpriser per hundstorlek. Small (<35cm), Medium (35-54cm), Large (>54cm). Pris per påbörjad kalenderdag inkl 25% moms.';
COMMENT ON COLUMN boarding_prices.dog_size IS 'Hundstorlek: small (<35cm), medium (35-54cm), large (>54cm)';
COMMENT ON COLUMN boarding_prices.base_price IS 'Grundpris per natt för vardag (måndag-torsdag), inkl 25% moms';
COMMENT ON COLUMN boarding_prices.weekend_surcharge IS 'Fast påslag för helg (fredag-söndag), inkl 25% moms. Ersätts av special_dates om datum finns där.';

CREATE INDEX IF NOT EXISTS idx_boarding_prices_org_id ON boarding_prices(org_id);
CREATE INDEX IF NOT EXISTS idx_boarding_prices_dog_size ON boarding_prices(dog_size);
CREATE INDEX IF NOT EXISTS idx_boarding_prices_active ON boarding_prices(is_active) WHERE is_active = true;

-- === SPECIALDATUM (RÖDA DAGAR, EVENT, HÖGTIDER) ===
-- Skapad 2025-11-13: Flexibla specialdatum med individuella påslag
CREATE TABLE IF NOT EXISTS special_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  name text NOT NULL,
  category text CHECK (category IN ('red_day', 'holiday', 'event', 'custom')) DEFAULT 'custom',
  price_surcharge numeric NOT NULL DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_special_dates_org_date ON special_dates(org_id, date);
CREATE INDEX IF NOT EXISTS idx_special_dates_org_active ON special_dates(org_id) WHERE is_active = true;

COMMENT ON TABLE special_dates IS 'Specialdatum med individuella påslag - röda dagar, lokala event, högtider. Ersätter weekend_surcharge om datum finns.';
COMMENT ON COLUMN special_dates.category IS 'red_day=svenska röda dagar, holiday=lov/semester, event=lokala event, custom=anpassat';
COMMENT ON COLUMN special_dates.price_surcharge IS 'Fast påslag i kronor för detta datum (t.ex. 400 kr för midsommar, 75 kr för mindre röd dag)';

-- === SÄSONGER (SOMMAR, VINTER, SPORTLOV) ===
-- Uppdaterat 2025-11-13: Tillagt priority för överlappande säsonger
CREATE TABLE IF NOT EXISTS boarding_seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_multiplier numeric DEFAULT 1.0,
  priority integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boarding_seasons_org_dates ON boarding_seasons(org_id, start_date, end_date);

COMMENT ON TABLE boarding_seasons IS 'Säsonger med prismultiplikatorer. Appliceras EFTER base_price och surcharges. Vid överlapp används högsta priority.';
COMMENT ON COLUMN boarding_seasons.price_multiplier IS 'Multiplikator (1.3 = +30%, 0.9 = -10%). Appliceras på (base_price + surcharge).';
COMMENT ON COLUMN boarding_seasons.priority IS 'Högre värde = högre prioritet vid överlappande säsonger (50 = default, 100 = hög)';

-- === ÄGARRABATTER ===
CREATE TABLE IF NOT EXISTS position_share (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FAKTUROR ===
CREATE TABLE IF NOT EXISTS invoice_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  subtotal numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FAKTUROR (NY STRUKTUR - används av pensionat & månadsvis generering) ===
-- OBS: Denna tabell används av:
--   1. Pensionatsbokningar (via triggers för förskott/efterskott)
--   2. Månatlig fakturagenerering (Edge Function generate_invoices)
--   3. Manuell fakturering
--
-- MÅNADSFAKTURERING (Edge Function: generate_invoices):
--   • Körs automatiskt via GitHub Actions: 1:a varje månad kl 08:00 UTC
--   • Workflow: .github/workflows/auto_generate_invoices.yml
--   • Använder SUPABASE_SERVICE_ROLE_KEY för autentisering
--   • Deployment: Manuell deployment via Supabase Dashboard (Edge Functions → Code → Deploy)
--   
--   DATAFLÖDE:
--   1. Hämtar alla hundar med owners (dogs + owners tabeller)
--   2. Grupperar per ägare (billed_name) för konsoliderade fakturor
--   3. För varje hund:
--      - Lägg till abonnemang (dogs.subscription mot price_lists)
--      - Lägg till extra_service records inom månaden
--      - Lägg till pension_stays inom månaden
--   4. Skapar invoice med totalsumma (invoice_type='full')
--   5. Skapar invoice_items för varje rad (separat insert)
--   6. Loggar till function_logs tabellen
--   7. Skickar e-postnotifiering
--
--   VIKTIGA KOLUMNER:
--   • owner_id: Länk till owners (används för gruppering)
--   • billed_name: Kopierat från owner.full_name (för fakturans skull)
--   • billed_email: Kopierat från owner.email
--   • invoice_date: Startdatum för månaden (YYYY-MM-DD)
--   • due_date: Förfallodatum, sätts till 30 dagar från invoice_date
--   • invoice_type: 'full' för månadsfakturor (vs 'prepayment'/'afterpayment')
--   • status: Alltid 'draft' vid skapande
--
--   TROUBLESHOOTING:
--   • 401 Unauthorized: Kolla SUPABASE_SERVICE_ROLE_KEY i GitHub Secrets
--   • Schema fel: Verifiera att alla kolumner finns i faktisk databas (kör migrations)
--   • Deploy fel: Edge Function måste deployas manuellt efter kodändringar
--   • Loggning: Kolla function_logs tabellen för detaljerad felinfo
--
--   MIGRATION HISTORY:
--   • 2025-11-01: add_due_date_to_invoices.sql - Lade till due_date kolumn
--   • 2025-11-01: add_prepayment_system.sql - Lade till invoice_type, prepayment system
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  invoice_date date NOT NULL,
  due_date date, -- Tillagt 2025-11-01 (migration: add_due_date_to_invoices.sql)
  total_amount numeric NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  -- FÖRSKOTTS-/EFTERSKOTTSFAKTURERING (tillagt 2025-11-01)
  invoice_type text CHECK (invoice_type IN ('prepayment', 'afterpayment', 'full')) DEFAULT 'full',
  paid_at timestamptz,
  billed_name text, -- Namn på fakturamottagare (kopieras från owner.full_name)
  billed_email text, -- E-post till fakturamottagare (kopieras från owner.email)
  billed_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Fakturor för pensionat och månadsfakturering. Används av Edge Function generate_invoices (månadsvis) och triggers för pensionatsbokningar.';
COMMENT ON COLUMN invoices.invoice_type IS 'prepayment=förskott (vid godkännande), afterpayment=efterskott (vid utcheckning), full=komplett månadsfaktura (från generate_invoices Edge Function)';
COMMENT ON COLUMN invoices.billed_name IS 'Fakturamottagarens namn (kopierat från owner.full_name vid generering)';
COMMENT ON COLUMN invoices.billed_email IS 'Fakturamottagarens e-post (kopierat från owner.email vid generering)';
COMMENT ON COLUMN invoices.due_date IS 'Förfallodatum (sätts till invoice_date + 30 dagar av generate_invoices). Tillagt 2025-11-01.';
COMMENT ON COLUMN invoices.owner_id IS 'Länk till owners-tabellen. Används för att gruppera fakturor per ägare i månadsfakturering.';

-- === FAKTURARADER ===
-- Kopplas till både invoice_logs OCH invoices
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  invoice_id uuid, -- Kan referera till antingen invoices ELLER invoice_logs
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE invoice_items IS 'Fakturarader för både invoice_logs och invoices tabellerna';
COMMENT ON COLUMN invoice_items.invoice_id IS 'Foreign key till antingen invoices.id eller invoice_logs.id';

-- === TJÄNSTER ===
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  duration_minutes integer,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ABONNEMANG (HUNDABONNEMANG - dagispaket per hund) ===
-- OBS: Detta är INTE organisationens plan! Se org_subscriptions nedan.
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  subscription_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  price_per_month numeric,
  days_included text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ORGANISATIONENS PRENUMERATION (plan/billing) ===
-- Detta är organisationens plan (trialing/active/past_due/canceled), INTE hundabonnemang!
-- Skapas automatiskt vid registrering via /api/onboarding/auto
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'basic',
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','canceled')) DEFAULT 'trialing',
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_active ON org_subscriptions(org_id) WHERE is_active = true;

-- === GROOMING BOOKINGS (Frisörbokningar) ===
CREATE TABLE IF NOT EXISTS grooming_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time,
  service_type text NOT NULL,
  estimated_price numeric,
  status text NOT NULL CHECK (status IN ('confirmed','completed','cancelled','no_show')) DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_date ON grooming_bookings(org_id, appointment_date);

-- === GROOMING JOURNAL (Frisörjournal) ===
CREATE TABLE IF NOT EXISTS grooming_journal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  service_type text NOT NULL,
  clip_length text,
  shampoo_type text,
  special_treatments text,
  final_price numeric NOT NULL DEFAULT 0,
  duration_minutes integer,
  notes text,
  before_photos text[],
  after_photos text[],
  next_appointment_recommended text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grooming_journal_org_date ON grooming_journal(org_id, appointment_date);

-- === DAGIS-PRISER (per organisation) ===
-- Skapade 2025-11-13 för att fixa "Could not find table daycare_pricing" fel
-- Uppdaterad 2025-11-13: Ändrat från 5 nivåer till 3 (Deltid 2, Deltid 3, Heltid)
CREATE TABLE IF NOT EXISTS daycare_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_parttime_2days integer NOT NULL DEFAULT 2500, -- Deltid 2: 2 dagar/vecka
  subscription_parttime_3days integer NOT NULL DEFAULT 3300, -- Deltid 3: 3 dagar/vecka
  subscription_fulltime integer NOT NULL DEFAULT 4500, -- Heltid: 5 dagar/vecka
  single_day_price integer NOT NULL DEFAULT 350, -- Dagshund (drop-in)
  additional_day_price integer NOT NULL DEFAULT 300, -- Tilläggsdagar för dagishund
  sibling_discount_percent integer NOT NULL DEFAULT 10,
  trial_day_price integer NOT NULL DEFAULT 200,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE daycare_pricing IS 'Priser för hunddagis per organisation';
COMMENT ON COLUMN daycare_pricing.subscription_parttime_2days IS 'Deltid 2: Pris per månad för 2 fasta veckodagar';
COMMENT ON COLUMN daycare_pricing.subscription_parttime_3days IS 'Deltid 3: Pris per månad för 3 fasta veckodagar';
COMMENT ON COLUMN daycare_pricing.subscription_fulltime IS 'Heltid: Pris per månad för 5 dagar/vecka (måndag-fredag)';
COMMENT ON COLUMN daycare_pricing.single_day_price IS 'Dagshund: Pris för enstaka dag utan abonnemang';
COMMENT ON COLUMN daycare_pricing.additional_day_price IS 'Tilläggsdagar: Pris för extra dagar utöver abonnemang';

-- === FRISÖR-TJÄNSTER (per organisation) ===
-- Skapade 2025-11-13 för att fixa "Could not find table grooming_services" fel
CREATE TABLE IF NOT EXISTS grooming_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  base_price integer NOT NULL DEFAULT 0,
  size_multiplier_enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE grooming_services IS 'Frisörtjänster och priser per organisation';
CREATE INDEX IF NOT EXISTS idx_grooming_services_org ON grooming_services(org_id);

-- === PENSIONATSBOKNINGAR - TJÄNSTEUTFÖRANDEN ===
-- Används för att logga extra tjänster som utförts under vistelse (t.ex. kloklipp, bad)
-- OBS: Denna är kopplad till booking_id (inte dog_id direkt)
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES extra_services(id) ON DELETE SET NULL, -- Referens till tjänstekatalogen
  quantity integer DEFAULT 1,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  staff_notes text,
  performed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_org ON booking_services(org_id);
COMMENT ON TABLE booking_services IS 'Tjänster utförda under pensionatsvistelse (kopplade till bokningar)';

-- === PENSIONATSBOKNINGAR - ALTERNATIV TABELL (pension_stays) ===
-- OBS: pension_stays är ett ALTERNATIV till bookings-tabellen för pensionat
-- Systemet använder huvudsakligen BOOKINGS för pensionat, men pension_stays
-- används i månadsvis fakturering (generate_invoices Edge Function)
CREATE TABLE IF NOT EXISTS pension_stays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  base_price numeric(10,2) DEFAULT 0,
  addons jsonb, -- JSON array av tillägg: [{name: 'Bad', price: 150, qty: 1}, ...]
  total_amount numeric(10,2) DEFAULT 0,
  status text CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'pending',
  notes text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pension_stays_dog ON pension_stays(dog_id);
CREATE INDEX IF NOT EXISTS idx_pension_stays_owner ON pension_stays(owner_id);
CREATE INDEX IF NOT EXISTS idx_pension_stays_org_dates ON pension_stays(org_id, start_date, end_date);
COMMENT ON TABLE pension_stays IS 'Alternativ pensionatsbokningstabell (används i månadsvis fakturering). Huvudsystem använder bookings-tabellen.';

-- === PENSIONAT TJÄNSTEKATALOG (pensionat_services) ===
-- Katalog över tjänster som kan utföras (skiljer sig från extra_services)
-- Används för att definiera vilka tjänster som FINNS, medan booking_services loggar vad som UTFÖRDES
CREATE TABLE IF NOT EXISTS pensionat_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  label text NOT NULL, -- T.ex. "Kloklipp", "Bad", "Tandborstning"
  price numeric(10,2) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pensionat_services_org ON pensionat_services(org_id);
COMMENT ON TABLE pensionat_services IS 'Tjänstekatalog för pensionat (används av booking_services)';

-- === GDPR SAMTYCKEN (consent_logs) ===
-- Loggning av alla kundsamtycken enligt GDPR Artikel 7
-- Används i kundportalsregistrering och pensionatsansökningar
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('digital_email', 'physical_form', 'phone_verbal', 'in_person')),
  consent_given boolean NOT NULL,
  consent_text text NOT NULL, -- Exakt text som kunden såg när samtycke gavs
  consent_version text DEFAULT '1.0',
  ip_address inet,
  user_agent text,
  signed_document_url text, -- Supabase Storage URL till uppladdad blankett
  witness_staff_id uuid REFERENCES auth.users(id),
  witness_notes text,
  given_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz, -- När kund återkallade samtycke (GDPR Art. 7.3)
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_logs_owner ON consent_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_org ON consent_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_active ON consent_logs(owner_id) WHERE consent_given = true AND withdrawn_at IS NULL;
COMMENT ON TABLE consent_logs IS 'GDPR Art. 7: Dokumentation av kundsamtycken. Varje samtycke loggas med typ, tid, och ursprung.';
COMMENT ON COLUMN consent_logs.consent_type IS 'Hur samtycke gavs: digital_email, physical_form, phone_verbal, in_person';
COMMENT ON COLUMN consent_logs.consent_text IS 'Exakt text som kunden såg/läste när samtycke gavs. Versioneras för juridisk dokumentation.';
COMMENT ON COLUMN consent_logs.withdrawn_at IS 'När kund återkallade samtycke (GDPR Art. 7.3 - rätt att återkalla).';

-- === KUNDRABATTER (customer_discounts) ===
-- Rabatter som gäller för specifika kunder
CREATE TABLE IF NOT EXISTS customer_discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'custom')),
  discount_value numeric NOT NULL,
  discount_name text,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_discounts_owner ON customer_discounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_customer_discounts_org ON customer_discounts(org_id);
COMMENT ON TABLE customer_discounts IS 'Kundspecifika rabatter (ersätter position_share)';

-- === ÄGARRABATTER (owner_discounts) ===
-- Alternativt namn för samma funktionalitet som customer_discounts
-- (Vissa delar av appen använder owner_discounts istället)
CREATE TABLE IF NOT EXISTS owner_discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_discounts_owner ON owner_discounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_discounts_org ON owner_discounts(org_id);
COMMENT ON TABLE owner_discounts IS 'Ägarrabatter (synonym till customer_discounts, används av vissa hundpensionatsidor)';

-- === EDGE FUNCTIONS LOGGNING (function_logs) ===
-- Används för att logga Edge Functions (t.ex. månadsvis fakturagenerering)
CREATE TABLE IF NOT EXISTS function_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  status text CHECK (status IN ('success', 'error', 'running', 'pending')),
  execution_time_ms integer,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_function_logs_function ON function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_status ON function_logs(status);
CREATE INDEX IF NOT EXISTS idx_function_logs_created ON function_logs(created_at DESC);
COMMENT ON TABLE function_logs IS 'Loggning av Edge Functions (t.ex. månadsvis fakturagenerering via generate_invoices)';

-- === DAGENS SCHEMA (daily_schedule) ===
-- Schema för hunddagis - vem som är på plats vilken dag
CREATE TABLE IF NOT EXISTS daily_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  is_present boolean DEFAULT true,
  checkin_time time,
  checkout_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, dog_id, schedule_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON daily_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_dog ON daily_schedule(dog_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_org ON daily_schedule(org_id, schedule_date);
COMMENT ON TABLE daily_schedule IS 'Dagens schema för hunddagis - närvaroregistrering per dag';

-- === ÄLDRE PRISHANTERING (prices) ===
-- Används av äldre admin-sidor för prissättning
-- (Ny kod använder boarding_prices, daycare_pricing, grooming_services istället)
CREATE TABLE IF NOT EXISTS prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  price_category text,
  amount numeric(10,2) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prices_org ON prices(org_id);
CREATE INDEX IF NOT EXISTS idx_prices_service ON prices(service_type);
COMMENT ON TABLE prices IS 'Äldre prishantering (används av /admin/priser). Nyare kod använder boarding_prices, daycare_pricing, grooming_services.';

-- === PENSIONAT KALENDER VIEW ===
-- VIEW för att visa pensionatskalendern med alla bokningar
CREATE OR REPLACE VIEW pension_calendar_full_view AS
SELECT 
  b.id,
  b.org_id,
  b.dog_id,
  b.owner_id,
  b.room_id,
  b.start_date,
  b.end_date,
  b.status,
  b.base_price,
  b.total_price,
  b.belongings,
  b.bed_location,
  d.name as dog_name,
  d.breed as dog_breed,
  d.heightcm as dog_height,
  o.full_name as owner_name,
  o.phone as owner_phone,
  o.email as owner_email,
  r.name as room_name
FROM bookings b
LEFT JOIN dogs d ON b.dog_id = d.id
LEFT JOIN owners o ON b.owner_id = o.id
LEFT JOIN rooms r ON b.room_id = r.id
WHERE b.status IN ('confirmed', 'checked_in', 'checked_out')
ORDER BY b.start_date DESC;

COMMENT ON VIEW pension_calendar_full_view IS 'Komplett vy för pensionatskalender med alla detaljer';

-- === NÄRVAROLOGGAR ===
CREATE TABLE IF NOT EXISTS attendence_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text CHECK (action IN ('checkin', 'checkout')) NOT NULL,
  timestamp timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- === PERSONALANTECKNINGAR ===
CREATE TABLE IF NOT EXISTS staff_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text CHECK (target_type IN ('dog', 'owner', 'booking', 'general')),
  target_id uuid,
  content text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === ANSVARSOMRÅDEN ===
CREATE TABLE IF NOT EXISTS responsibilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_date date DEFAULT current_date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === FELLOGGAR ===
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type text,
  error_message text,
  stack_trace text,
  context jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =======================================
-- TRIGGERS OCH FUNKTIONER
-- =======================================

-- ⚠️ TRIGGER-STATUS OCH SETUP-FILER:
--
-- 🟢 PRODUCTION (Vercel/Supabase):
--    • fix_registration_triggers.sql         → Kör denna för att aktivera auto-registrering
--    • enable_triggers_for_production.sql    → Kör denna för org_id auto-setting (valfritt)
--    • Triggers MÅSTE vara aktiva för nya användare ska få org/profil automatiskt
--
-- 🔴 DEVELOPMENT (localhost):
--    • complete_testdata.sql                 → DISABLAR alla triggers för enklare debugging
--    • Koden sätter org_id MANUELLT i EditDogModal/AuthContext
--    • Fungerar perfekt utan triggers!
--
-- 💡 DUBBEL SÄKERHET:
--    Koden fungerar BÅDE med och utan triggers:
--    - MED triggers: Om NEW.org_id redan är satt, ändras inget (IF NEW.org_id IS NULL)
--    - UTAN triggers: Sätts direkt i TypeScript-koden (se EditDogModal.tsx)
--
-- 🔍 VERIFIERA TRIGGER-STATUS:
--    SELECT trigger_name, event_object_table 
--    FROM information_schema.triggers 
--    WHERE trigger_schema = 'public' 
--    ORDER BY event_object_table;

-- ============================================================================
-- === ROW LEVEL SECURITY (RLS) POLICIES ===
-- ============================================================================
-- Added: 2025-11-17, Updated: 2025-11-19
-- Purpose: Allow public applications while securing org data
-- Note: These policies are CRITICAL for public-facing application forms
-- IMPORTANT: Separate UPDATE/DELETE policies to avoid "ALL" conflicts with INSERT

-- ORGS: Public can read, members can manage
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_public_select" ON orgs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orgs_members_update" ON orgs FOR UPDATE TO authenticated
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "orgs_members_delete" ON orgs FOR DELETE TO authenticated
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- OWNERS: Public can create (applications), members can manage
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_public_insert" ON owners FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "owners_org_select" ON owners FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "owners_org_update" ON owners FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "owners_org_delete" ON owners FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- DOGS: Public can create (applications), members can manage
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dogs_public_insert" ON dogs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "dogs_org_select" ON dogs FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "dogs_org_update" ON dogs FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "dogs_org_delete" ON dogs FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- BOOKINGS: Public can create (pension applications), members can manage
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_public_insert" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "bookings_org_select" ON bookings FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "bookings_org_update" ON bookings FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "bookings_org_delete" ON bookings FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- INTEREST_APPLICATIONS: Public can create (daycare applications), members can manage
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interest_public_insert" ON interest_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "interest_org_select" ON interest_applications FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "interest_org_update" ON interest_applications FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "interest_org_delete" ON interest_applications FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- CONSENT_LOGS: Public can create (GDPR logging), members can view
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_public_insert" ON consent_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "consent_org_select" ON consent_logs FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- DOG_JOURNAL: Only authenticated members (not public)
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_org_select" ON dog_journal FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "journal_org_insert" ON dog_journal FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "journal_org_update" ON dog_journal FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "journal_org_delete" ON dog_journal FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================

-- === AUTOMATISK UPDATED_AT ===
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ORGANISATIONSHANTERING ===

-- Funktion för att sätta org_id automatiskt från användarens profil
-- Aktiveras med: enable_triggers_for_production.sql
-- Används i produktion för automatisk org_id-tilldelning
CREATE OR REPLACE FUNCTION set_org_id_for_owners()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_org_id_for_dogs()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_org_id_for_rooms()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_org_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.org_id IS NULL OR NEW.user_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ANVÄNDARHANTERING ===

-- Hantera nya användare vid registrering
-- ⚠️ VIKTIG TRIGGER - Aktiveras med: fix_registration_triggers.sql
-- Skapar automatiskt: organisation + profil + 3 månaders gratis prenumeration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_name text;
BEGIN
  -- Skapa organisationsnamn från e-post
  org_name := split_part(NEW.email, '@', 1) || 's Hunddagis';
  
  -- Skapa ny organisation
  INSERT INTO orgs (name, email) 
  VALUES (org_name, NEW.email);
  
  -- Skapa profil som admin
  INSERT INTO profiles (id, org_id, role, email, full_name)
  SELECT NEW.id, orgs.id, 'admin', NEW.email, NEW.raw_user_meta_data->>'full_name'
  FROM orgs WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tilldela organisation till nya användare
CREATE OR REPLACE FUNCTION assign_org_to_new_user()
RETURNS trigger AS $$
DECLARE
  user_domain text;
  org_id_found uuid;
BEGIN
  user_domain := split_part(NEW.email, '@', 2);
  
  SELECT id INTO org_id_found 
  FROM orgs 
  WHERE email LIKE '%@' || user_domain;
  
  IF org_id_found IS NOT NULL THEN
    INSERT INTO profiles (id, org_id, role, email, full_name)
    VALUES (NEW.id, org_id_found, 'staff', NEW.email, NEW.raw_user_meta_data->>'full_name');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sätt standardroll
CREATE OR REPLACE FUNCTION set_default_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS NULL THEN
    NEW.role := 'staff';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === FAKTURAHANTERING ===

-- Skapa faktura vid utcheckning
CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS trigger AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_total_amount NUMERIC := 0;
  v_base_amount NUMERIC := 0;
  v_extra_service RECORD;
  v_booking_service RECORD;
  v_description TEXT;
  v_nights INTEGER;
  v_service_price NUMERIC;
BEGIN
  -- Skapa faktura endast när status ändras till 'checked_out'
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    
    -- Hämta owner_id från hunden
    SELECT owner_id INTO v_owner_id 
    FROM dogs 
    WHERE id = NEW.dog_id;

    IF v_owner_id IS NULL THEN
      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;
      RETURN NEW;
    END IF;

    -- Beräkna antal nätter
    v_nights := (NEW.end_date - NEW.start_date);
    IF v_nights <= 0 THEN
      v_nights := 1;
    END IF;

    -- Använd bokningens totalpris som bas
    v_base_amount := COALESCE(NEW.total_price, NEW.base_price, 0);
    v_total_amount := v_base_amount;

    -- Skapa faktura
    INSERT INTO invoices (
      org_id,
      owner_id,
      invoice_date,
      due_date,
      total_amount,
      status,
      invoice_type,
      billed_name,
      billed_email
    )
    VALUES (
      NEW.org_id,
      v_owner_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      0, -- Uppdateras nedan
      'draft',
      'afterpayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- RAD 1: Grundpris för bokningen (logi)
    IF v_base_amount > 0 THEN
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount
      )
      VALUES (
        v_invoice_id,
        format('Hundpensionat %s - %s (%s nätter)', 
          NEW.start_date, 
          NEW.end_date, 
          v_nights
        ),
        v_nights,
        v_base_amount / v_nights,
        v_base_amount
      );
    END IF;

    -- RAD 2: Tillval från booking_services
    BEGIN
      FOR v_booking_service IN
        SELECT 
          bs.quantity,
          bs.unit_price,
          bs.total_price,
          bs.staff_notes,
          COALESCE(ps.label, 'Tilläggstjänst') as service_name
        FROM booking_services bs
        LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
        WHERE bs.booking_id = NEW.id
      LOOP
        v_description := v_booking_service.service_name;
        
        IF v_booking_service.staff_notes IS NOT NULL THEN
          v_description := v_description || ' - ' || v_booking_service.staff_notes;
        END IF;

        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_amount
        )
        VALUES (
          v_invoice_id,
          v_description,
          v_booking_service.quantity,
          v_booking_service.unit_price,
          v_booking_service.total_price
        );

        v_total_amount := v_total_amount + v_booking_service.total_price;
      END LOOP;
    EXCEPTION 
      WHEN undefined_table THEN
        RAISE NOTICE 'booking_services tabellen finns inte, hoppar över';
    END;

    -- RAD 3: Återkommande tillägg från extra_service
    FOR v_extra_service IN
      SELECT 
        service_type,
        frequency,
        price,
        notes
      FROM extra_service
      WHERE dogs_id = NEW.dog_id
        AND org_id = NEW.org_id
        AND COALESCE(is_active, true) = true
        AND start_date <= NEW.end_date
        AND (end_date IS NULL OR end_date >= NEW.start_date)
    LOOP
      v_description := v_extra_service.service_type;
      
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;

      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || ' - ' || v_extra_service.notes;
      END IF;

      v_service_price := v_extra_service.price;
      
      IF v_service_price IS NULL THEN
        BEGIN
          SELECT price INTO v_service_price
          FROM extra_services
          WHERE label = v_extra_service.service_type
            AND org_id = NEW.org_id
            AND COALESCE(is_active, true) = true
          LIMIT 1;
        EXCEPTION 
          WHEN OTHERS THEN
            v_service_price := 0;
        END;
      END IF;

      v_service_price := COALESCE(v_service_price, 0);

      IF v_service_price > 0 THEN
        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_amount
        )
        VALUES (
          v_invoice_id,
          v_description,
          1,
          v_service_price,
          v_service_price
        );

        v_total_amount := v_total_amount + v_service_price;
      END IF;
    END LOOP;

    -- RAD 4: Rabatt
    IF NEW.discount_amount > 0 THEN
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount
      )
      VALUES (
        v_invoice_id,
        'Rabatt',
        1,
        -NEW.discount_amount,
        -NEW.discount_amount
      );

      v_total_amount := v_total_amount - NEW.discount_amount;
    END IF;

    -- Uppdatera fakturans totalsumma
    UPDATE invoices
    SET total_amount = GREATEST(v_total_amount, 0)
    WHERE id = v_invoice_id;

    -- Uppdatera bokningen med faktura-ID
    UPDATE bookings 
    SET afterpayment_invoice_id = v_invoice_id
    WHERE id = NEW.id;

    RAISE NOTICE '✅ Faktura % skapad för bokning % (Total: % kr)', 
      v_invoice_id, NEW.id, v_total_amount;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === JOURNALHANTERING ===

-- Skapa journalpost för ny hund
CREATE OR REPLACE FUNCTION create_dog_journal_on_new_dog()
RETURNS trigger AS $$
BEGIN
  -- Skapa journal post endast om user_id finns (användaren är inloggad)
  -- För publika ansökningar (auth.uid() är NULL) skippar vi detta
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)
    VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================
-- TRIGGERS
-- =======================================

-- ⚠️ VIKTIGT: I PRODUCTION (Vercel) är dessa triggers AKTIVA
-- I DEVELOPMENT (localhost) är de DISABLED av complete_testdata.sql
--
-- === RENSADE TRIGGERS (2025-11-13 kl 20:30) ===
-- Före cleanup: ~60 triggers (40+ duplicerade)
-- Efter cleanup: ~20 triggers (inga duplicerade)
--
-- AKTIVA TRIGGERS I PRODUCTION:
--
-- === DOGS (4 triggers) ===
-- 1. trg_set_dog_org_id           → Sätter org_id från profiles (BEFORE INSERT)
-- 2. trg_auto_match_owner         → Matchar ägare automatiskt (AFTER INSERT)
-- 3. trg_create_journal_on_new_dog → Skapar första journalposten (AFTER INSERT)
-- 4. trg_update_dogs_updated_at   → Uppdaterar timestamp (BEFORE UPDATE)
--
-- === OWNERS (2 triggers) ===
-- 1. trg_set_owner_org_id         → Sätter org_id från profiles (BEFORE INSERT)
-- 2. trigger_auto_customer_number → Genererar kundnummer (BEFORE INSERT/UPDATE)
--
-- === BOOKINGS (3 triggers) ===
-- 1. trg_set_booking_org_id       → Sätter org_id från dogs (BEFORE INSERT)
-- 2. trg_create_prepayment_invoice → Skapar förskottsfaktura (BEFORE UPDATE vid confirmed)
-- 3. trg_create_invoice_on_checkout → Skapar efterskottsfaktura (AFTER UPDATE vid checked_out)
--
-- === ANDRA TABELLER (1 trigger vardera) ===
-- • rooms: trg_set_org_id_rooms
-- • boarding_prices: on_insert_set_org_id_for_boarding_prices
-- • boarding_seasons: on_insert_set_org_id_for_boarding_seasons
-- • extra_service: trg_set_extra_service_org_id
-- • extra_services: trg_set_org_id_extra_services
-- • pension_stays: trg_set_pension_stay_org_id, set_timestamp_pension_stays, trg_calc_total_amount
-- • subscriptions: on_insert_set_org_id_for_subscriptions
-- • grooming_logs: on_insert_set_org_id_for_grooming
--
-- === AUTH & USER MANAGEMENT (2 triggers) ===
-- • auth.users: on_auth_user_created (handle_new_user - skapar org + profil + subscription)
-- • profiles: on_profile_insert (set_default_role - sätter role='staff' om NULL)
--
-- === BORTTAGNA TRIGGERS (via cleanup) ===
-- ❌ trg_assign_org_to_new_user (gammal, kunde skapa dubbla orgs)
-- ❌ 7x duplicerade org_id triggers på dogs
-- ❌ 4x duplicerade org_id triggers på owners
-- ❌ 4x duplicerade triggers på bookings
-- ❌ 2x duplicerade triggers på dog_journal, extra_service, pension_stays
-- ❌ set_last_updated (duplicerad timestamp trigger på dogs)
--
-- Koden i EditDogModal.tsx sätter org_id manuellt, vilket fungerar perfekt
-- både med och utan triggers (triggers kollar IF NEW.org_id IS NULL först)

-- =======================================
-- DOGS TRIGGERS
-- =======================================

-- Org ID trigger - sätt org_id från användarens profil
CREATE OR REPLACE FUNCTION set_dog_org_id() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_dog_org_id
BEFORE INSERT ON dogs
FOR EACH ROW
EXECUTE FUNCTION set_dog_org_id();

-- Auto-match owner trigger (behållen från original)
CREATE TRIGGER trg_auto_match_owner
AFTER INSERT ON dogs
FOR EACH ROW
WHEN (NEW.owner_id IS NULL)
EXECUTE FUNCTION auto_match_owner_trigger();

-- Create journal trigger (behållen från original)
CREATE TRIGGER trg_create_journal_on_new_dog
AFTER INSERT ON dogs
FOR EACH ROW
EXECUTE FUNCTION create_dog_journal_on_new_dog();

-- Update timestamp trigger (behållen från original)
CREATE TRIGGER trg_update_dogs_updated_at
BEFORE UPDATE ON dogs
FOR EACH ROW
EXECUTE FUNCTION update_last_updated();

-- =======================================
-- OWNERS TRIGGERS
-- =======================================

-- Org ID trigger
CREATE OR REPLACE FUNCTION set_owner_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_owner_org_id
BEFORE INSERT ON owners
FOR EACH ROW
EXECUTE FUNCTION set_owner_org_id();

-- Customer number trigger (behållen från original)
CREATE TRIGGER trigger_auto_customer_number
BEFORE INSERT OR UPDATE ON owners
FOR EACH ROW
EXECUTE FUNCTION auto_generate_customer_number();

-- =======================================
-- BOOKINGS TRIGGERS
-- =======================================

-- Org ID trigger - hämta från dogs istället för profiles
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_booking_org_id
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_org_id();

-- Invoice triggers (behållna från original)
CREATE TRIGGER trg_create_prepayment_invoice
BEFORE UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
EXECUTE FUNCTION create_prepayment_invoice();

CREATE TRIGGER trg_create_invoice_on_checkout
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'checked_out' AND OLD.status != 'checked_out')
EXECUTE FUNCTION create_invoice_on_checkout();

-- =======================================
-- ROOMS TRIGGER
-- =======================================

CREATE TRIGGER trg_set_org_id_rooms
BEFORE INSERT ON rooms
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_rooms();

-- =======================================
-- BOARDING TRIGGERS
-- =======================================

CREATE TRIGGER on_insert_set_org_id_for_boarding_prices
BEFORE INSERT ON boarding_prices
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_rooms();

CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons
BEFORE INSERT ON boarding_seasons
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_rooms();

-- =======================================
-- EXTRA SERVICES TRIGGERS
-- =======================================

CREATE OR REPLACE FUNCTION set_extra_service_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_extra_service_org_id
BEFORE INSERT ON extra_service
FOR EACH ROW
EXECUTE FUNCTION set_extra_service_org_id();

CREATE TRIGGER trg_set_org_id_extra_services
BEFORE INSERT ON extra_services
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_owners();

-- =======================================
-- PENSION STAYS TRIGGERS
-- =======================================

CREATE OR REPLACE FUNCTION set_pension_stay_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM dogs 
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_pension_stay_org_id
BEFORE INSERT OR UPDATE ON pension_stays
FOR EACH ROW
EXECUTE FUNCTION set_pension_stay_org_id();

CREATE TRIGGER set_timestamp_pension_stays
BEFORE UPDATE ON pension_stays
FOR EACH ROW
EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trg_calc_total_amount
BEFORE INSERT OR UPDATE ON pension_stays
FOR EACH ROW
EXECUTE FUNCTION calc_total_amount();

-- =======================================
-- BOKNINGS AUDIT LOG TRIGGER (2025-11-16)
-- =======================================

-- Funktion för att automatiskt logga bokningsändringar
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Logga endast statusändringar (skippa om status är samma)
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO booking_events (
      booking_id,
      org_id,
      event_type,
      old_status,
      new_status,
      changed_by_user_id,
      metadata
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.org_id, OLD.org_id),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN NEW.status = 'confirmed' THEN 'approved'
        WHEN NEW.status = 'checked_in' THEN 'checked_in'
        WHEN NEW.status = 'checked_out' THEN 'checked_out'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        ELSE 'modified'
      END,
      OLD.status,
      NEW.status,
      auth.uid(), -- Använder Supabase auth för att identifiera användaren
      jsonb_build_object(
        'price_before', OLD.total_price,
        'price_after', NEW.total_price,
        'extra_services_changed', (OLD.extra_service_ids != NEW.extra_service_ids)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_booking_changes
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_status_change();

-- =======================================
-- AVBOKNINGSAVGIFTSBERÄKNING (2025-11-16)
-- =======================================

CREATE OR REPLACE FUNCTION calculate_cancellation_fee(
  p_booking_id uuid,
  p_cancellation_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  cancellation_fee numeric,
  refund_amount numeric,
  fee_percentage numeric,
  days_before_checkin integer,
  policy_applied jsonb
) AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_policy jsonb;
  v_days_before integer;
  v_fee_pct numeric := 0;
BEGIN
  -- Hämta bokning
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bokning % hittades inte', p_booking_id;
  END IF;
  
  -- Hämta avbokningspolicy från organisation
  SELECT cancellation_policy INTO v_policy FROM orgs WHERE id = v_booking.org_id;
  
  -- Beräkna dagar innan incheckning
  v_days_before := EXTRACT(DAY FROM (v_booking.start_date - p_cancellation_date::date));
  
  -- Beräkna avgiftsprocent baserat på policy
  IF v_days_before >= (v_policy->>'free_cancellation_days')::integer THEN
    v_fee_pct := 0; -- Gratis avbokning
  ELSIF v_days_before >= (v_policy->>'partial_refund_days')::integer THEN
    v_fee_pct := (v_policy->>'partial_refund_percentage')::numeric; -- Delvis återbetalning
  ELSE
    v_fee_pct := 100; -- Ingen återbetalning
  END IF;
  
  -- Returnera resultat
  RETURN QUERY SELECT
    (v_booking.total_price * v_fee_pct / 100)::numeric AS cancellation_fee,
    (v_booking.total_price * (100 - v_fee_pct) / 100)::numeric AS refund_amount,
    v_fee_pct AS fee_percentage,
    v_days_before AS days_before_checkin,
    v_policy AS policy_applied;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =======================================
-- GDPR ANONYMISERING (2025-11-16)
-- =======================================

CREATE OR REPLACE FUNCTION anonymize_owner(
  p_owner_id uuid,
  p_reason text DEFAULT 'GDPR-begäran'
)
RETURNS boolean AS $$
DECLARE
  v_anon_name text;
BEGIN
  -- Skapa anonymt namn (t.ex. "Anonym_abc123")
  v_anon_name := 'Anonym_' || substring(md5(random()::text) from 1 for 8);
  
  -- Uppdatera owner med anonymiserad data
  UPDATE owners SET
    full_name = v_anon_name,
    email = v_anon_name || '@anonymiserad.se',
    phone = NULL,
    address = NULL,
    postal_code = NULL,
    city = NULL,
    contact_person_2 = NULL,
    contact_phone_2 = NULL,
    personnummer = NULL,
    notes = 'Anonymiserad enligt GDPR',
    is_anonymized = TRUE,
    anonymized_at = now(),
    anonymization_reason = p_reason,
    updated_at = now()
  WHERE id = p_owner_id;
  
  -- Anonymisera även hundarna
  UPDATE dogs SET
    name = 'Anonymiserad Hund',
    breed = NULL,
    allergies = NULL,
    medications = NULL,
    special_needs = NULL,
    behavior_notes = NULL,
    food_info = NULL,
    notes = 'Anonymiserad enligt GDPR',
    photo_url = NULL,
    is_deleted = TRUE,
    deleted_at = now(),
    deleted_reason = p_reason,
    updated_at = now()
  WHERE owner_id = p_owner_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================
-- GDPR DATALAGRINGSBERÄKNING (2025-11-16)
-- =======================================

CREATE OR REPLACE FUNCTION calculate_data_retention_date(
  p_owner_id uuid
)
RETURNS date AS $$
DECLARE
  v_last_activity_date date;
BEGIN
  -- Hitta senaste aktiviteten (bokning eller hundägande)
  SELECT GREATEST(
    COALESCE(MAX(b.end_date), '1900-01-01'::date),
    COALESCE(MAX(d.updated_at::date), '1900-01-01'::date)
  ) INTO v_last_activity_date
  FROM owners o
  LEFT JOIN dogs d ON d.owner_id = o.id
  LEFT JOIN bookings b ON b.owner_id = o.id
  WHERE o.id = p_owner_id;
  
  -- Returnera datum + 3 år (bokföringslag)
  RETURN v_last_activity_date + INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_data_retention_date IS 'Beräknar GDPR-datalagringstid (3 år från sista aktivitet)';

-- =======================================
-- SUBSCRIPTIONS TRIGGER
-- =======================================

CREATE TRIGGER on_insert_set_org_id_for_subscriptions
BEFORE INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_subscription();

-- =======================================
-- GROOMING TRIGGER
-- =======================================

CREATE TRIGGER on_insert_set_org_id_for_grooming
BEFORE INSERT ON grooming_logs
FOR EACH ROW
EXECUTE FUNCTION set_org_id_for_grooming();

-- =======================================
-- AUTH & USER MANAGEMENT TRIGGERS
-- =======================================

-- Main user registration trigger (VIKTIGT: Bara denna, ej trg_assign_org_to_new_user!)
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Profile default role trigger
CREATE TRIGGER on_profile_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_default_role();

-- =======================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pension_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pensionat_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_services ENABLE ROW LEVEL SECURITY;

-- =======================================
-- COMPREHENSIVE RLS POLICIES
-- =======================================

-- För utveckling: Tillåt allt för autentiserade användare
-- I produktion: Begränsa till org_id

-- Orgs policies
CREATE POLICY "Allow all for authenticated users" ON orgs
  FOR ALL USING (auth.role() = 'authenticated');

-- Profiles policies (KRITISKA för AuthContext!)
-- Dessa är PRODUKTIONSKLARA och ska ALLTID vara aktiva
DROP POLICY IF EXISTS "Allow all for authenticated users" ON profiles;
DROP POLICY IF EXISTS profiles_self_access ON profiles;
DROP POLICY IF EXISTS profiles_self_insert ON profiles;
DROP POLICY IF EXISTS profiles_self_update ON profiles;

CREATE POLICY profiles_self_access ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_self_insert ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Owners policies
CREATE POLICY "Allow all for authenticated users" ON owners
  FOR ALL USING (auth.role() = 'authenticated');

-- Rooms policies (uppdaterad 2025-11-13 kväll)
-- OBS: Detta är en förenklad policy - i produktion ersätts med cleanup_duplicate_policies.sql
-- Den riktiga policyn säkerställer org-isolation via profiles.org_id = rooms.org_id
CREATE POLICY "authenticated_full_access_rooms" ON rooms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = rooms.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = rooms.org_id
    )
  );

-- Dogs policies (updated to filter by org_id)
CREATE POLICY "dogs_select_own_org" ON dogs
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_insert_own_org" ON dogs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_update_own_org" ON dogs
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_delete_own_org" ON dogs
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Bookings policies
CREATE POLICY "Allow all for authenticated users" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Extra services catalog policies
CREATE POLICY "Allow all for authenticated users" ON extra_services
  FOR ALL USING (auth.role() = 'authenticated');

-- Extra service (dog-specific) policies
CREATE POLICY "Allow all for authenticated users" ON extra_service
  FOR ALL USING (auth.role() = 'authenticated');

-- Boarding prices policies (uppdaterad 2025-11-13)
CREATE POLICY "Enable all for authenticated users on boarding_prices" ON boarding_prices
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Boarding seasons policies (uppdaterad 2025-11-13)
CREATE POLICY "Enable all for authenticated users on boarding_seasons" ON boarding_seasons
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grooming logs policies
CREATE POLICY "Allow all for authenticated users" ON grooming_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Price lists policies
CREATE POLICY "Allow all for authenticated users" ON price_lists
  FOR ALL USING (auth.role() = 'authenticated');

-- Boarding prices policies
CREATE POLICY "Allow all for authenticated users" ON boarding_prices
  FOR ALL USING (auth.role() = 'authenticated');

-- Boarding seasons policies
CREATE POLICY "Allow all for authenticated users" ON boarding_seasons
  FOR ALL USING (auth.role() = 'authenticated');

-- Position share policies
CREATE POLICY "Allow all for authenticated users" ON position_share
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoice logs policies
CREATE POLICY "Allow all for authenticated users" ON invoice_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoice items policies
CREATE POLICY "Allow all for authenticated users" ON invoice_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Services policies
CREATE POLICY "Allow all for authenticated users" ON services
  FOR ALL USING (auth.role() = 'authenticated');

-- Subscriptions policies
CREATE POLICY "Allow all for authenticated users" ON subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Attendence logs policies
CREATE POLICY "Allow all for authenticated users" ON attendence_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Staff notes policies
CREATE POLICY "Allow all for authenticated users" ON staff_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- Responsibilities policies
CREATE POLICY "Allow all for authenticated users" ON responsibilities
  FOR ALL USING (auth.role() = 'authenticated');

-- Error logs policies
CREATE POLICY "Allow all for authenticated users" ON error_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Org subscriptions policies (organisationens plan)
CREATE POLICY "Allow all for authenticated users" ON org_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Grooming bookings policies
CREATE POLICY "Allow all for authenticated users" ON grooming_bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Grooming journal policies
CREATE POLICY "Allow all for authenticated users" ON grooming_journal
  FOR ALL USING (auth.role() = 'authenticated');

-- Booking events policies (GDPR Artikel 30 compliance)
CREATE POLICY "Users can view their org's booking events" ON booking_events
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert booking events" ON booking_events
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Migrations är read-only för alla autentiserade användare
CREATE POLICY "Authenticated users can view migrations" ON migrations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- === CONSENT_LOGS POLICIES (GDPR compliance) ===
-- Public kan INSERT (för ansökningar), authenticated kan se sin org
CREATE POLICY "consent_public_insert" ON consent_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "consent_org_select" ON consent_logs
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === PENSION_STAYS POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON pension_stays
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === BOOKING_SERVICES POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON booking_services
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === PENSIONAT_SERVICES POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON pensionat_services
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === CUSTOMER_DISCOUNTS POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON customer_discounts
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === OWNER_DISCOUNTS POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON owner_discounts
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === FUNCTION_LOGS POLICIES ===
-- Endast service role kan skriva, authenticated kan läsa
CREATE POLICY "Anyone can view function logs" ON function_logs
  FOR SELECT TO authenticated
  USING (true);

-- === DAILY_SCHEDULE POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON daily_schedule
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === PRICES POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON prices
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- === GROOMING_SERVICES POLICIES ===
CREATE POLICY "Allow all for authenticated users" ON grooming_services
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- =======================================
-- TESTDATA (Valfritt)
-- =======================================

-- Skapa testorganisation
INSERT INTO orgs (id, name, email, vat_included, vat_rate) 
VALUES (
  'test-org-uuid', 
  'Test Hundcenter', 
  'test@dogplanner.se', 
  true, 
  0.25
) ON CONFLICT (id) DO NOTHING;

-- Skapa testrum
INSERT INTO rooms (org_id, name, capacity_m2, room_type, is_active)
VALUES 
  ('test-org-uuid', 'Stora rummet', 15.0, 'boarding', true),
  ('test-org-uuid', 'Lilla rummet', 8.0, 'boarding', true),
  ('test-org-uuid', 'Dagisrummet', 25.0, 'daycare', true)
ON CONFLICT DO NOTHING;

-- =======================================
-- KOMMENTARER
-- =======================================

COMMENT ON TABLE orgs IS 'Organisationer/företag som använder systemet';
COMMENT ON TABLE profiles IS 'Användarprofiler kopplade till auth.users';
COMMENT ON TABLE owners IS 'Hundägare/kunder';
COMMENT ON TABLE rooms IS 'Rum för dagis och pensionat';
COMMENT ON TABLE dogs IS 'Hundar med all info och status';
COMMENT ON TABLE bookings IS 'Bokningar för både dagis och pensionat (room_type styr)';
COMMENT ON TABLE extra_service IS 'Extra tjänster (frisör, medicin, etc)';
COMMENT ON TABLE dog_journal IS 'Journal/anteckningar för hundar';
COMMENT ON TABLE consent_logs IS 'GDPR samtycken - digital och fysisk dokumentation';
COMMENT ON TABLE pension_stays IS 'Alternativ pensionatsbokningar (används i månadsfakturering)';
COMMENT ON TABLE booking_services IS 'Tjänster utförda under vistelse (kopplade till bookings)';
COMMENT ON TABLE customer_discounts IS 'Kundspecifika rabatter';
COMMENT ON TABLE function_logs IS 'Edge Functions loggning (t.ex. månadsvis fakturering)';
COMMENT ON TABLE daily_schedule IS 'Dagens schema för hunddagis';

-- Schema version
COMMENT ON SCHEMA public IS 'DogPlanner Schema v3.0 - Uppdaterad 2025-11-19 - KOMPLETT PENSIONATSBOKNING + ALLA TABELLER DOKUMENTERADE';

-- =======================================
-- SLUTKOMMENTARER
-- =======================================

-- 📊 TOTALT ANTAL TABELLER: ~45 (inkl. auth.users och storage-tabeller)
--
-- 🎯 HUVUDTABELLER (obligatoriska):
--   1. orgs - Organisationer
--   2. profiles - Användarprofiler
--   3. owners - Hundägare/kunder
--   4. dogs - Hundar
--   5. rooms - Rum (dagis + pensionat)
--   6. bookings - Bokningar (BÅDE dagis och pensionat!)
--
-- 💰 EKONOMI & FAKTURERING:
--   7. invoices - Fakturor
--   8. invoice_items - Fakturarader
--   9. invoice_logs - Äldre fakturaloggar
--   10. function_logs - Edge Functions loggning
--
-- 🏨 PENSIONAT-SPECIFIKT:
--   11. boarding_prices - Grundpriser per hundstorlek
--   12. boarding_seasons - Säsonger med multiplikatorer
--   13. special_dates - Specialdatum (röda dagar, högtider)
--   14. pension_stays - Alternativ bokningstabell (månadsvis fakturering)
--   15. booking_services - Tjänster utförda under vistelse
--   16. pensionat_services - Tjänstekatalog
--   17. pension_calendar_full_view - VIEW för kalender
--
-- 🐕 HUNDDAGIS-SPECIFIKT:
--   18. subscription_types - Abonnemangstyper & priser
--   19. subscriptions - Hundabonnemang
--   20. daycare_pricing - Dagis-priser per org
--   21. interest_applications - Intresseanmälningar
--   22. daycare_service_completions - Tjänsteutföranden
--   23. daily_schedule - Dagens schema
--
-- ✂️ FRISÖR-SPECIFIKT:
--   24. grooming_services - Tjänster & priser
--   25. grooming_bookings - Frisörbokningar
--   26. grooming_journal - Frisörjournal
--   27. grooming_logs - Äldre frisörloggar
--
-- 💳 RABATTER & TILLÄGG:
--   28. extra_services - Tjänstekatalog (alla typer)
--   29. extra_service - Hundspecifika tillägg
--   30. customer_discounts - Kundrabatter
--   31. owner_discounts - Ägarrabatter (synonym)
--   32. position_share - Äldre rabattsystem
--   33. price_lists - Prislistor
--   34. prices - Äldre priser
--
-- 📝 JOURNAL & LOGGNING:
--   35. dog_journal - Hundjournal
--   36. staff_notes - Personalanteckningar
--   37. attendence_logs - Närvarologgar
--   38. booking_events - Bokningshändelser (GDPR Art. 30)
--   39. consent_logs - GDPR samtycken
--   40. error_logs - Felloggar
--
-- 👥 PERSONAL & ORG:
--   41. responsibilities - Ansvarsområden
--   42. org_subscriptions - Organisationens plan/billing
--
-- 🔧 SYSTEM:
--   43. migrations - Schema versionshantering
--   44. services - Generiska tjänster
--
-- ⚙️ VIKTIGA FUNKTIONER:
--   • handle_new_user() - Skapar org + profil vid registrering
--   • create_invoice_on_checkout() - Skapar faktura vid utcheckning
--   • calculate_cancellation_fee() - Beräknar avbokningsavgift
--   • anonymize_owner() - GDPR anonymisering
--   • calculate_data_retention_date() - GDPR datalagringstid
--
-- 🔐 RLS POLICIES:
--   • Public INSERT: owners, dogs, bookings, interest_applications, consent_logs
--   • Org-scoped: Alla andra tabeller (via profiles.org_id match)
--
-- 🚀 EDGE FUNCTIONS:
--   • generate_invoices - Månadsvis fakturagenerering (körs 1:a varje månad)
--   • Använder: dogs, owners, subscriptions, extra_service, pension_stays
--
-- 📱 KUNDPORTAL:
--   • Använder owner_id som primary key (inte profiles.id)
--   • Ett kundkonto fungerar hos ALLA pensionat (Scandic-modellen)
--   • customer_number följer med överallt (org-oberoende)
--
-- 🏷️ NAMNKONVENTIONER:
--   • Lowercase kolumnnamn (heightcm, inte height_cm)
--   • Timestamps: created_at, updated_at (inte createdAt)
--   • Foreign keys: org_id, dog_id, owner_id (inte organisation_id)
--
-- ❗ KRITISKT ATT VETA:
--   • BOOKINGS används för BÅDE dagis och pensionat (room.room_type styr)
--   • pension_stays är ALTERNATIV tabell (används i månadsfakturering)
--   • Triggers är DISABLED i dev (complete_testdata.sql)
--   • Triggers är ENABLED i prod (fix_registration_triggers.sql)
--   • RLS är ENABLED överallt (även i dev efter 2025-11-17)

-- EOF[
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_prices",
    "table_name": "boarding_prices",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_prices BEFORE INSERT ON public.boarding_prices FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_seasons",
    "table_name": "boarding_seasons",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons BEFORE INSERT ON public.boarding_seasons FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "trg_create_invoice_on_checkout",
    "table_name": "bookings",
    "function_name": "create_invoice_on_checkout",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_invoice_on_checkout()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_invoice_id uuid;\nbegin\n  -- Skapa faktura endast när status ändras till 'checked_out'\n  if new.status = 'checked_out' then\n    insert into public.invoices (org_id, owner_id, invoice_date, total_amount, billed_name, billed_email, billed_address)\n    values (\n      new.org_id,\n      (select owner_id from public.dogs where id = new.dog_id),\n      now()::date,\n      coalesce(new.base_price, 0),\n      (select full_name from public.owners where id = (select owner_id from public.dogs where id = new.dog_id)),\n      (select email from public.owners where id = (select owner_id from public.dogs where id = new.dog_id)),\n      (select city from public.owners where id = (select owner_id from public.dogs where id = new.dog_id))\n    )\n    returning id into v_invoice_id;\n\n    -- Lägg till huvudrad (bokningsrad)\n    insert into public.invoice_items (invoice_id, booking_id, description, qty, unit_price)\n    values (\n      v_invoice_id,\n      new.id,\n      concat('Pensionatvistelse ', new.start_date, '–', new.end_date),\n      1,\n      coalesce(new.base_price, 0)\n    );\n\n    -- Lägg till tilläggstjänster (om de finns)\n    if new.addons is not null then\n      insert into public.invoice_items (invoice_id, booking_id, description, qty, unit_price)\n      select\n        v_invoice_id,\n        new.id,\n        jsonb_extract_path_text(a.value, 'name'),\n        coalesce((jsonb_extract_path_text(a.value, 'qty'))::numeric, 1),\n        coalesce((jsonb_extract_path_text(a.value, 'price'))::numeric, 0)\n      from jsonb_array_elements(new.addons) as a;\n    end if;\n  end if;\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_invoice_on_checkout AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'checked_out'::text) AND (old.status IS DISTINCT FROM 'checked_out'::text))) EXECUTE FUNCTION create_invoice_on_checkout()"
  },
  {
    "trigger_name": "trg_set_org_id_on_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
  },
  {
    "trigger_name": "trg_touch_bookings",
    "table_name": "bookings",
    "function_name": "touch_bookings_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.touch_bookings_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.updated_at := now();\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_touch_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION touch_bookings_updated_at()"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "table_name": "buckets",
    "function_name": "enforce_bucket_name_length",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n    if length(new.name) > 100 then\n        raise exception 'bucket name \"%\" is too long (% characters). Max is 100.', new.name, length(new.name);\n    end if;\n    return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()"
  },
  {
    "trigger_name": "trg_set_org_id_for_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "on_insert_set_user_id",
    "table_name": "dogs",
    "function_name": "set_user_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_user_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  new.user_id := auth.uid();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_user_id BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_user_id()"
  },
  {
    "trigger_name": "set_last_updated",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_last_updated BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from profiles where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "dogs",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_auto_match_owner",
    "table_name": "dogs",
    "function_name": "auto_match_owner_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_match_owner_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  perform public.match_owners_to_dogs();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_auto_match_owner AFTER INSERT ON public.dogs FOR EACH ROW WHEN ((new.owner_id IS NULL)) EXECUTE FUNCTION auto_match_owner_trigger()"
  },
  {
    "trigger_name": "trg_create_journal_on_new_dog",
    "table_name": "dogs",
    "function_name": "create_dog_journal_on_new_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_dog_journal_on_new_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    INSERT INTO public.dog_journal (dog_id, text, org_id)\n    VALUES (\n        NEW.id,\n        'Ny hund registrerad i systemet.',\n        NEW.org_id\n    );\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog()"
  },
  {
    "trigger_name": "trg_set_org_id_on_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "trg_set_org_user_dogs",
    "table_name": "dogs",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "trg_update_dogs_updated_at",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "extra_service",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_extra_service",
    "table_name": "extra_service",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_grooming",
    "table_name": "grooming_logs",
    "function_name": "set_org_id_for_grooming",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_grooming()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Hämtar organisationens ID från hunden automatiskt\n  if new.org_id is null then\n    select org_id into new.org_id\n    from dogs\n    where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_grooming BEFORE INSERT ON public.grooming_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_grooming()"
  },
  {
    "trigger_name": "cron_job_cache_invalidate",
    "table_name": "job",
    "function_name": "job_cache_invalidate",
    "function_definition": "CREATE OR REPLACE FUNCTION cron.job_cache_invalidate()\n RETURNS trigger\n LANGUAGE c\nAS '$libdir/pg_cron', $function$cron_job_cache_invalidate$function$\n",
    "trigger_definition": "CREATE TRIGGER cron_job_cache_invalidate AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION cron.job_cache_invalidate()"
  },
  {
    "trigger_name": "objects_delete_delete_prefix",
    "table_name": "objects",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "objects_insert_create_prefix",
    "table_name": "objects",
    "function_name": "objects_insert_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    NEW.level := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger()"
  },
  {
    "trigger_name": "objects_update_create_prefix",
    "table_name": "objects",
    "function_name": "objects_update_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    old_prefixes TEXT[];\nBEGIN\n    -- Ensure this is an update operation and the name has changed\n    IF TG_OP = 'UPDATE' AND (NEW.\"name\" <> OLD.\"name\" OR NEW.\"bucket_id\" <> OLD.\"bucket_id\") THEN\n        -- Retrieve old prefixes\n        old_prefixes := \"storage\".\"get_prefixes\"(OLD.\"name\");\n\n        -- Remove old prefixes that are only used by this object\n        WITH all_prefixes as (\n            SELECT unnest(old_prefixes) as prefix\n        ),\n        can_delete_prefixes as (\n             SELECT prefix\n             FROM all_prefixes\n             WHERE NOT EXISTS (\n                 SELECT 1 FROM \"storage\".\"objects\"\n                 WHERE \"bucket_id\" = OLD.\"bucket_id\"\n                   AND \"name\" <> OLD.\"name\"\n                   AND \"name\" LIKE (prefix || '%')\n             )\n         )\n        DELETE FROM \"storage\".\"prefixes\" WHERE name IN (SELECT prefix FROM can_delete_prefixes);\n\n        -- Add new prefixes\n        PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    END IF;\n    -- Set the new level\n    NEW.\"level\" := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger()"
  },
  {
    "trigger_name": "update_objects_updated_at",
    "table_name": "objects",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = now();\n    RETURN NEW; \nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()"
  },
  {
    "trigger_name": "on_insert_set_trial_end_for_org",
    "table_name": "orgs",
    "function_name": "set_trial_end_for_org",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_trial_end_for_org()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Sätt gratisperiod till 3 månader från registrering\n  NEW.trial_ends_at := (now() + interval '3 months');\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_trial_end_for_org BEFORE INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION set_trial_end_for_org()"
  },
  {
    "trigger_name": "on_org_locked_email",
    "table_name": "orgs",
    "function_name": "notify_admin_on_lock",
    "function_definition": "CREATE OR REPLACE FUNCTION public.notify_admin_on_lock()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  org_name text;\nbegin\n  select name into org_name from public.orgs where id = new.id;\n\n  perform\n    net.http_post(\n      url := 'https://api.resend.com/emails',\n      headers := jsonb_build_object(\n        'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),\n        'Content-Type', 'application/json'\n      ),\n      body := jsonb_build_object(\n        'from', 'DogPlanner <support@dogplanner.se>',\n        'to', 'support@dogplanner.se',\n        'subject', 'Konto låst: ' || org_name,\n        'html', '<p>Organisationen <b>' || org_name || '</b> har passerat sin testperiod och låsts.</p>'\n      )\n    );\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_org_locked_email AFTER UPDATE ON public.orgs FOR EACH ROW WHEN (((new.status = 'locked'::text) AND (old.status IS DISTINCT FROM 'locked'::text))) EXECUTE FUNCTION notify_admin_on_lock()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_owners",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "owners_set_org_id",
    "table_name": "owners",
    "function_name": "set_owner_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_owner_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := (select org_id from profiles where id = auth.uid());\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER owners_set_org_id BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_owner_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_owners",
    "table_name": "owners",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "set_timestamp_pension_stays",
    "table_name": "pension_stays",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_timestamp_pension_stays BEFORE UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "trg_calc_total_amount",
    "table_name": "pension_stays",
    "function_name": "calc_total_amount",
    "function_definition": "CREATE OR REPLACE FUNCTION public.calc_total_amount()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  addon_sum numeric(10,2) := 0;\nbegin\n  if NEW.addons is not null then\n    select sum((x->>'price')::numeric)\n    into addon_sum\n    from jsonb_array_elements(NEW.addons) as x;\n  end if;\n\n  NEW.total_amount := coalesce(NEW.base_price,0) + coalesce(addon_sum,0);\n  return NEW;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_calc_total_amount BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION calc_total_amount()"
  },
  {
    "trigger_name": "trg_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_pension_stays",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_pension_stays()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from dogs where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_pension_stays()"
  },
  {
    "trigger_name": "trg_set_org_id_on_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_pension_stays BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
  },
  {
    "trigger_name": "prefixes_create_hierarchy",
    "table_name": "prefixes",
    "function_name": "prefixes_insert_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger()"
  },
  {
    "trigger_name": "prefixes_delete_hierarchy",
    "table_name": "prefixes",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "on_profile_insert",
    "table_name": "profiles",
    "function_name": "set_default_role",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_default_role()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.role is null then\n    new.role := 'staff';\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_profile_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_default_role()"
  },
  {
    "trigger_name": "trg_delete_org_if_no_admins",
    "table_name": "profiles",
    "function_name": "delete_org_if_no_admins",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_org_if_no_admins()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\nbegin\n  v_org_id := old.org_id;\n\n  -- Räkna kvarvarande admins i organisationen\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → radera hela företaget\n  if v_admin_count = 0 then\n    raise notice '⚠️ Varning: Ingen admin kvar i organisationen %, företaget kommer att tas bort!', v_org_id;\n\n    -- Radera i rätt ordning (för att undvika FK-fel)\n    delete from public.bookings where org_id = v_org_id;\n    delete from public.owners where org_id = v_org_id;\n    delete from public.dogs where org_id = v_org_id;\n    delete from public.invoices where org_id = v_org_id;\n    delete from public.orgs where id = v_org_id;\n\n    raise notice '✅ Organisation % och all tillhörande data har raderats enligt GDPR.', v_org_id;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_delete_org_if_no_admins AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_org_if_no_admins()"
  },
  {
    "trigger_name": "trg_ensure_org_has_admin",
    "table_name": "profiles",
    "function_name": "ensure_org_has_admin",
    "function_definition": "CREATE OR REPLACE FUNCTION public.ensure_org_has_admin()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\n  v_new_admin uuid;\nbegin\n  -- Identifiera organisationen baserat på den gamla raden\n  v_org_id := old.org_id;\n\n  -- Räkna antalet kvarvarande admins\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → uppgradera en slumpmässig staff till admin\n  if v_admin_count = 0 then\n    select id into v_new_admin\n    from public.profiles\n    where org_id = v_org_id\n    order by created_at asc\n    limit 1;\n\n    if v_new_admin is not null then\n      update public.profiles\n      set role = 'admin'\n      where id = v_new_admin;\n\n      raise notice 'Ingen admin kvar i org %, uppgraderade användare % till admin', v_org_id, v_new_admin;\n    else\n      raise notice 'Ingen kvar att uppgradera i org %, organisationen står utan användare', v_org_id;\n    end if;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_ensure_org_has_admin AFTER DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_org_has_admin()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_rooms",
    "table_name": "rooms",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_services",
    "table_name": "services",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta org kopplad till användaren\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "tr_check_filters",
    "table_name": "subscription",
    "function_name": "subscription_check_filters",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n    /*\n    Validates that the user defined filters for a subscription:\n    - refer to valid columns that the claimed role may access\n    - values are coercable to the correct column type\n    */\n    declare\n        col_names text[] = coalesce(\n                array_agg(c.column_name order by c.ordinal_position),\n                '{}'::text[]\n            )\n            from\n                information_schema.columns c\n            where\n                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity\n                and pg_catalog.has_column_privilege(\n                    (new.claims ->> 'role'),\n                    format('%I.%I', c.table_schema, c.table_name)::regclass,\n                    c.column_name,\n                    'SELECT'\n                );\n        filter realtime.user_defined_filter;\n        col_type regtype;\n\n        in_val jsonb;\n    begin\n        for filter in select * from unnest(new.filters) loop\n            -- Filtered column is valid\n            if not filter.column_name = any(col_names) then\n                raise exception 'invalid column for filter %', filter.column_name;\n            end if;\n\n            -- Type is sanitized and safe for string interpolation\n            col_type = (\n                select atttypid::regtype\n                from pg_catalog.pg_attribute\n                where attrelid = new.entity\n                      and attname = filter.column_name\n            );\n            if col_type is null then\n                raise exception 'failed to lookup type for column %', filter.column_name;\n            end if;\n\n            -- Set maximum number of entries for in filter\n            if filter.op = 'in'::realtime.equality_op then\n                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);\n                if coalesce(jsonb_array_length(in_val), 0) > 100 then\n                    raise exception 'too many values for `in` filter. Maximum 100';\n                end if;\n            else\n                -- raises an exception if value is not coercable to type\n                perform realtime.cast(filter.value, col_type);\n            end if;\n\n        end loop;\n\n        -- Apply consistent order to filters so the unique constraint on\n        -- (subscription_id, entity, filters) can't be tricked by a different filter order\n        new.filters = coalesce(\n            array_agg(f order by f.column_name, f.op, f.value),\n            '{}'\n        ) from unnest(new.filters) f;\n\n        return new;\n    end;\n    $function$\n",
    "trigger_definition": "CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_subscriptions",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_subscription",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_subscription()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta organisationen kopplad till den användare som skapar abonnemanget\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_subscriptions BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_subscription()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Om org_id inte skickas in vid insert, hämta automatiskt från användarens profil\n  if new.org_id is null then\n    select org_id into new.org_id\n    from profiles\n    where id = auth.uid();  -- använder inloggad användares id\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "on_auth_user_created",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Skapa ny organisation om användaren inte redan är kopplad till en\n  insert into public.orgs (name)\n  values (split_part(new.email, '@', 1) || 's Hunddagis')\n  returning id into v_org_id;\n\n  -- Koppla användaren som admin till sin nya org\n  insert into public.profiles (id, email, org_id, role)\n  values (new.id, new.email, v_org_id, 'admin');\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  },
  {
    "trigger_name": "trg_assign_org_to_new_user",
    "table_name": "users",
    "function_name": "assign_org_to_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.assign_org_to_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Försök hitta en org baserat på e-postdomän (ex: @hunddagis.se)\n  select id into v_org_id\n  from public.orgs\n  where lower(name) = lower(split_part(new.email, '@', 1) || 's Hunddagis')\n  or lower(name) like '%' || split_part(new.email, '@', 2);\n\n  -- Om organisation hittas → koppla användaren till den\n  if v_org_id is not null then\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'staff');\n  else\n    -- Annars skapa ny organisation (första användare blir admin)\n    insert into public.orgs (name)\n    values (split_part(new.email, '@', 1) || 's Hunddagis')\n    returning id into v_org_id;\n\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'admin');\n  end if;\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_assign_org_to_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION assign_org_to_new_user()"
  },
  {
    "trigger_name": "trg_handle_new_user",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Skapa ny organisation om användaren inte redan är kopplad till en\n  insert into public.orgs (name)\n  values (split_part(new.email, '@', 1) || 's Hunddagis')\n  returning id into v_org_id;\n\n  -- Koppla användaren som admin till sin nya org\n  insert into public.profiles (id, email, org_id, role)\n  values (new.id, new.email, v_org_id, 'admin');\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_handle_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  }
]