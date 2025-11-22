# 🧹 SYSTEM CLEANUP PLAN - DogPlanner

**Datum:** 2025-11-22  
**Syfte:** Rensa bort gamla filer, fixa dubbletter, synka schema.sql med deployed migrations

---

## ⚠️ KRITISKT: KÖR AUDIT FÖRST!

**Innan vi tar bort NÅGOT måste du:**

1. Öppna Supabase Dashboard → SQL Editor
2. Kör hela `AUDIT_CURRENT_DATABASE.sql`
3. Exportera resultaten
4. Dela med AI så vi kan verifiera vad som faktiskt finns

**Varför?** Vi behöver veta exakt vilka triggers, policies och funktioner som finns deployed innan vi ändrar något.

---

## 📋 IDENTIFIERADE PROBLEM (från SYSTEMANALYS_KOMPLETT)

### 🔴 KRITISKA (Fix omedelbart)

| #   | Problem                      | Lösning                                                                                             | Påverkan                              |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | **Dubbelt prissystem**       | Fix `/ansokan/pensionat` att använda `boardingPriceCalculator` istället för `pensionatCalculations` | Hög - sidan används från landing page |
| 2   | **pensionatCalculations.ts** | Efter fix av #1, ta bort filen (används inte längre)                                                | Låg - inga andra användare            |
| 3   | **schema.sql ur sync**       | Uppdatera med funktioner från migrations/                                                           | Hög - risk att någon kör fel version  |
| 4   | **Trigger dubbletter**       | Verifiera med audit, ta bort gamla versioner                                                        | Medium - kan orsaka race conditions   |

### 🟡 VIKTIGA (Fix inom kort)

| #   | Problem                     | Lösning                              | Påverkan                                 |
| --- | --------------------------- | ------------------------------------ | ---------------------------------------- |
| 5   | **Gamla SQL-filer i root**  | Flytta till archive/ folder          | Låg - förhindrar förvirring              |
| 6   | **Gamla MD-filer**          | Flytta föråldrade docs till archive/ | Låg - förbättrar navigation              |
| 7   | **Missing DELETE policies** | Lägg till DELETE för kundportal      | Medium - users kan inte ta bort sin data |

---

## 🗑️ FILER ATT FLYTTA TILL ARCHIVE

### SQL-filer (root directory) → `archive/sql/`

```bash
# GAMLA/OUTDATED - flytta till archive
cleanup_dogs_timestamp_duplicate.sql     # Fix redan deployed
cleanup_duplicate_triggers.sql           # One-time fix
fix_user_org_assignment.sql              # Ersatt av PERMANENT_FIX
check_org.sql                            # Diagnostic script
quick_fix_missing_columns.sql            # Temporary fix
min vision.sql                           # Old planning doc
test_invoice_system.sql                  # Test script
test-email.js                            # Test script
test-nybokning.sh                        # Test script
check-loading-pattern.sh                 # Test script
fix-loading-bugs.sh                      # Test script
auto-fix-loading.py                      # Test script
UPDATE_CASSANDRA_ORG.sql                 # One-time update
add_waitlist_tracking_fields.sql         # Kolla om redan i schema
```

### SQL-filer (supabase/) → `supabase/archive/`

```bash
# GAMLA - kräver verifiering först
detta är_min_supabase_just_nu.sql       # Snapshot - behålls för referens?
fix_interest_applications_rls.sql        # Kolla om policies finns i schema
fix_public_interest_applications.sql     # Kolla om policies finns
enable_rls_and_realtime.sql              # One-time setup
test_grooming_trigger.sql                # Test script
```

### MD-filer → `archive/docs/`

```bash
# GAMLA AUDITS (behåll senaste, arkivera gamla)
SYSTEM_AUDIT_2025-11-02.md               # Gammal audit
SYSTEM_ROBUSTNESS_AUDIT_2025-11-20.md   # Gammal audit
SYSTEM_ROBUSTNESS_AUDIT_2025-11-22.md   # Äldre än SYSTEMANALYS_KOMPLETT
SYSTEM_HELHETSANALYS_2025-11-17.md      # Gammal analys

# GAMLA FIXRAPPORTER (safe att arkivera efter verifiering)
SINGLE_FIX_RAPPORT_2025-01-17.md         # Fix redan deployed
DASHBOARD_HUNDDAGIS_FIXES_2025-01-17.md # Fix redan deployed
DATAFLÖDES_VERIFIERING_2025-01-17.md    # Verifiering done
EDITDOGMODAL_FIXES_2025-11-17.md         # Fix redan deployed

# GAMLA GUIDES (konsolidera eller arkivera)
STEG_FÖR_STEG_GUIDE.md                   # Check om aktuell
FAS6_README.md                           # Check om aktuell
NEXT_STEPS_MANUAL.md                     # Check om aktuell

# DEPLOYMENT DOCS (behåll senaste)
DEPLOY_FIX_ORG_ASSIGNMENT.md             # Redan deployed
VERCEL_REDEPLOY_NEEDED.md                # Check om aktuell
DEPLOYMENT_GUIDE_2025-11-17.md           # Äldre deployment guide

# REDUNDANT DOCS
LANDING_PAGE_ROBUSTNESS_AUDIT.md         # Ingår i systemanalys
LANDING_PAGES_REFACTORED.md              # Change log, safe att arkivera
ÄNDRINGAR_2025-11-17.md                  # Change log, safe att arkivera
NYBOKNING_V2_CHANGES.md                  # Change log, safe att arkivera
RECENT_CHANGES.md                        # Check om det finns nyare info

# INSTALLATION DOCS (konsolidera)
INSTALL_MIGRATION.md                     # Merge med README?
INSTALLATION_FORSKOTT.md                 # Merge med README?

# TRIGGER DOCS (konsolidera)
TRIGGERS_README.md                       # Merge med schema docs?
TRIGGER_AUDIT_RAPPORT.md                 # Gammal audit
```

---

## 🔧 FIXAR ATT GÖRA

### 1. Fix `/ansokan/pensionat/page.tsx` (KRITISKT)

**Problem:** Använder `calculatePensionatPrice` som försöker läsa från tabeller som inte finns.

**Fix:**

```typescript
// FÖRE:
import { calculatePensionatPrice } from "@/lib/pensionatCalculations";

// EFTER:
import { calculateBookingPrice } from "@/lib/boardingPriceCalculator";
```

**Steg:**

1. ✅ Byt import
2. ✅ Uppdatera function call att matcha boardingPriceCalculator API
3. ✅ Ta bort priceBreakdown state (använd enklare struktur)
4. ✅ Test i browser att prisberäkning fungerar
5. ✅ Commit: "🐛 Fix: Use correct price system in /ansokan/pensionat"

### 2. Ta bort `lib/pensionatCalculations.ts`

**Endast efter #1 är fixad och testad!**

```bash
git rm lib/pensionatCalculations.ts
git commit -m "🗑️ Remove: Obsolete pensionatCalculations.ts (broken price system)"
```

### 3. Uppdatera `supabase/schema.sql`

**Problem:** Innehåller gamla funktioner som inte matchar deployed migrations.

**Lösning:**

**VARIANT A (Rekommenderad):** Lägg till varningskommentar överst:

```sql
-- ⚠️ VIKTIGT: ANVÄND EJ DENNA FIL FÖR NYA MIGRATIONS!
-- Denna fil är en SNAPSHOT av schemat från [DATUM].
-- För att ändra schemat: Skapa ny fil i migrations/ och kör via Supabase
-- För att se aktuellt schema: Kör AUDIT_CURRENT_DATABASE.sql
```

**VARIANT B:** Uppdatera hela schema.sql med latest från migrations:

1. Export current schema från Supabase: `Settings → Database → Schema visualizer`
2. Ersätt schema.sql
3. Commit: "📝 Update: schema.sql synced with deployed database"

### 4. Skapa archive/ folders

```bash
mkdir -p archive/sql
mkdir -p archive/docs
mkdir -p supabase/archive
```

### 5. Flytta gamla filer

**EFTER VERIFIERING** att de inte används i CI/CD eller scripts:

```bash
# SQL files
git mv cleanup_*.sql archive/sql/
git mv fix_user_org_assignment.sql archive/sql/
git mv check_org.sql archive/sql/
# ... etc

# Docs
git mv SYSTEM_AUDIT_2025-11-02.md archive/docs/
git mv SINGLE_FIX_RAPPORT_*.md archive/docs/
# ... etc

# Supabase
cd supabase
git mv test_grooming_trigger.sql archive/
# ... etc
```

---

## ✅ VERIFIERINGSCHECKLISTA

Efter alla ändringar:

- [ ] `npm run build` - No errors
- [ ] Test landing page "Boka pensionat" button
- [ ] Test BookingOptionsModal "Boka utan konto"
- [ ] Test `/ansokan/pensionat` price calculation
- [ ] Verify no broken imports (search for `pensionatCalculations`)
- [ ] Check Supabase logs for errors
- [ ] Test kundportal booking flow (sanity check)
- [ ] Run `git status` - no unintended changes

---

## 📊 PRIORITERAD ORDNING

### Fas 1: AUDIT & VALIDATION (GÖR FÖRST)

1. ✅ Skapat `AUDIT_CURRENT_DATABASE.sql`
2. ⏳ **USER ACTION:** Kör audit i Supabase
3. ⏳ **USER ACTION:** Dela audit results med AI
4. ⏳ Analysera audit results vs schema.sql

### Fas 2: KRITISKA FIXAR

5. Fix `/ansokan/pensionat` price system
6. Test booking flow thoroughly
7. Ta bort `lib/pensionatCalculations.ts`
8. Commit och push

### Fas 3: SCHEMA SYNC

9. Uppdatera `supabase/schema.sql` (variant A eller B)
10. Commit och push

### Fas 4: CLEANUP

11. Skapa archive folders
12. Flytta gamla SQL files
13. Flytta gamla MD files
14. Update README med archive location
15. Commit och push

### Fas 5: FINAL VERIFICATION

16. Full system test
17. Check all critical flows
18. Verify no regressions
19. Create documentation of cleanup

---

## 🚨 SÄKERHETSREGLER

**TOUCH INTE:**

- ❌ `supabase/migrations/PERMANENT_FIX_org_assignment.sql` (kritiskt för org system)
- ❌ `supabase/migrations/fix_customer_number_race_condition.sql` (kritiskt för customer_number)
- ❌ `app/context/AuthContext.tsx` (redan fixad)
- ❌ `lib/boardingPriceCalculator.ts` (fungerande prissystem)
- ❌ `.github/copilot-instructions.md` (system knowledge)

**TAR BORT:**

- ✅ `lib/pensionatCalculations.ts` (efter fix av användare)
- ✅ Gamla audit-rapporter (arkivera, ta ej bort permanent)
- ✅ One-time fix scripts (arkivera)

---

## 📝 SLUTRAPPORT

Efter genomförd cleanup, skapa:

**CLEANUP_RAPPORT_2025-11-22.md:**

- Vad som togs bort/arkiverades
- Vad som fixades
- Vad som är kvar att göra
- Nya best practices för framtiden

---

## 🆘 OM NÅGOT GÅR FEL

**Restore plan:**

1. All kod är i git - `git revert <commit>`
2. Schema changes i Supabase kan rullas tillbaka via migrations history
3. Arkiverade filer finns kvar i git history
4. Supabase har automatic backups (check retention policy)

**Emergency contacts:**

- Supabase Support: support@supabase.io
- Git history: `git log --all -- <filename>`
- Database backup: Supabase Dashboard → Settings → Backups
