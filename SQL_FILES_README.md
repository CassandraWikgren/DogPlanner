# 📁 SQL-filer i DogPlanner

Översikt över alla SQL-filer i projektet och när de ska användas.

---

## 🟢 PRODUCTION SETUP (Kör i Supabase SQL Editor)

### 1. **`fix_registration_triggers.sql`** ⭐ VIKTIGT!

**Vad**: Skapar trigger som automatiskt genererar organisation + profil + prenumeration vid nya registreringar

**När**: Kör EN GÅNG i production för att aktivera auto-registrering

**Effekt**:

- Nya användare får automatiskt en organisation
- Profil kopplas till organisationen med admin-roll
- 3 månaders gratis prenumeration skapas
- Backup: `/api/onboarding/auto` körs också via AuthContext om trigger misslyckas

**Kör**: I Supabase SQL Editor (Production) → Kopiera hela filen → Run

---

### 2. **`enable_triggers_for_production.sql`** (VALFRITT)

**Vad**: Aktiverar triggers för automatisk org_id-sättning på owners/dogs/rooms

**När**: Valfritt - koden sätter redan org_id manuellt i EditDogModal

**Effekt**:

- Säkerhetsbackup om koden glömmer sätta org_id
- Fungerar tillsammans med manuell kod (IF NEW.org_id IS NULL)

**Rekommendation**: Kör om du vill ha extra säkerhet, men inte nödvändigt

---

## 🔴 DEVELOPMENT SETUP (localhost)

### 3. **`complete_testdata.sql`**

**Vad**: Testdata för development + DISABLAR alla triggers för enklare debugging

**När**: Kör i local Supabase för att få testdata

**Effekt**:

- Disablar RLS (Row Level Security)
- Disablar triggers
- Skapar testorganisation med hundar/ägare/rum
- Perfekt för development där man vill debugga utan begränsningar

**⚠️ KÖR ALDRIG I PRODUCTION!**

---

## 🛠️ MANUELLA FIXES (vid behov)

### 4. **`fix_cassandra_profile_20251101.sql`**

**Vad**: Fixade Cassandras specifika profil/organisation

**Status**: ✅ Körts 2025-11-01, behöver inte köras igen

**Användning**: Mall för att fixa andra användares profiler vid behov

---

### 5. **`create_org_and_profile.sql`**

**Vad**: Skapar organisation + profil manuellt för en specifik användare

**När**: Om en användare saknar profil/org och du behöver fixa det manuellt

**Hur**: Ändra email-adressen i filen, kör i Supabase SQL Editor

---

### 6. **`check_user_profile.sql`**

**Vad**: Kontrollerar en användares profil och organisations-status

**När**: Vid debugging - kolla om användare har org_id kopplat

**Hur**: Ändra email, kör för att se status

---

## 📋 KONFIGURATIONSFILER

### 7. **`supabase/schema.sql`**

**Vad**: Komplett schema med alla tabeller, funktioner och triggers

**När**: Referensdokument - kör INTE direkt (används av Supabase migrations)

**Innehåll**:

- Alla tabeller (orgs, profiles, owners, dogs, rooms, etc.)
- Alla funktioner (set*org_id*\*, handle_new_user, etc.)
- Dokumentation om triggers och relaterade filer

---

## 🚀 QUICK START GUIDE

### För nya PRODUCTION-installationer:

1. Kör `fix_registration_triggers.sql` i Supabase SQL Editor
2. (Valfritt) Kör `enable_triggers_for_production.sql` för extra säkerhet
3. Klart! Nya användare får nu automatiskt org/profil vid registrering

### För DEVELOPMENT:

1. Kör `complete_testdata.sql` i local Supabase för testdata
2. Använd test-användare från filen för att logga in
3. Debugga fritt utan triggers/RLS

### Vid problem med specifik användare:

1. Kör `check_user_profile.sql` för att se status
2. Om profil/org saknas, använd `create_org_and_profile.sql` som mall
3. Kör i Supabase SQL Editor med användarens email

---

## 🔍 TRIGGER-STATUS VERIFIERING

Kolla vilka triggers som är aktiva:

\`\`\`sql
SELECT
trigger_name,
event_object_table,
action_timing,
event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
\`\`\`

**Production borde ha**:

- `on_auth_user_created` → auth.users (från fix_registration_triggers.sql)
- `trg_set_org_id_owners` → owners (från enable_triggers_for_production.sql)
- `trg_set_org_id_dogs` → dogs
- `trg_set_org_id_rooms` → rooms

**Development borde ha**:

- Inga triggers (disabled av complete_testdata.sql)

---

## 💡 BACKUP-LÖSNINGAR

Systemet har flera lager av säkerhet:

1. **Trigger**: handle_new_user() körs automatiskt vid registrering
2. **API Backup**: `/api/onboarding/auto` körs av AuthContext om trigger misslyckas
3. **Manuell kod**: EditDogModal sätter org_id direkt i TypeScript
4. **Manuella SQL**: Vid total krasch kan admin köra create_org_and_profile.sql

Detta betyder att även om EN lösning misslyckas, fungerar systemet ändå! ✅

---

## 📞 SUPPORT

Vid problem:

1. Kör `check_user_profile.sql` för att diagnostisera
2. Kolla browser console för felmeddelanden
3. Kolla Vercel logs för API-fel
4. Kolla Supabase logs för database-fel

**Vanliga problem**:

- "Ingen organisation tilldelad" → Kör fix_cassandra_profile_20251101.sql som mall
- Nya användare får ingen org → Kör fix_registration_triggers.sql
- Hundar får fel org_id → Kör enable_triggers_for_production.sql

---

**Senast uppdaterad**: 2025-11-01
