# 📦 Arkiv - Gamla filer och dokument

Denna mapp innehåller gamla SQL-scripts och dokumentation som inte längre är aktuell men sparas för historiska ändamål.

## 📁 Mappstruktur

- **`sql_old/`** - Gamla SQL-scripts (migrations, cleanup, fix scripts som redan körts)
- **`docs_old/`** - Föråldrad dokumentation (gamla audits, deployment guides, change logs)

## ⚠️ Varning

**Kör INTE dessa SQL-scripts i produktion!**

Filerna här har antingen:

- Redan körts i produktionsdatabasen
- Ersatts av nyare versioner
- Blivit obsoleta pga systemändringar

## 📋 Arkiverade SQL-filer (`sql_old/`)

### Cleanup scripts (redan körda)

- `cleanup_dogs_timestamp_duplicate.sql` - Fixade dubbletter i dogs.last_updated triggers
- `cleanup_duplicate_triggers.sql` - Tog bort duplicerade triggers
- `quick_fix_missing_columns.sql` - Lade till saknade kolumner (2025-11)
- `fix_user_org_assignment.sql` - Gamla org-assignment fix (ersatt av PERMANENT_FIX)

### Legacy migrations

- `UPDATE_CASSANDRA_ORG.sql` - One-off update för Cassandras organisation
- `min vision.sql` - Gamla visionsdokument i SQL-format
- `fix_waitlist_legacy_data.sql` - Migrerade gammal vänteliste-data
- `add_waitlist_tracking_fields.sql` - Lade till tracking-fält (redan deployed)

### Supabase fixes (redan deployed)

- `fix_public_interest_applications.sql` - RLS fix för anonym insättning
- `check_interest_policies.sql` - Validering av policies
- `fix_interest_applications_rls.sql` - RLS-justeringar
- `fix_waitlist_status.sql` - Statusfält-fix
- `update_waitlist_by_dates.sql` - Datumbaserad uppdatering

### Grooming system setup (redan deployed)

- `test_grooming_trigger.sql` - Test av grooming triggers
- `create_grooming_journal_trigger.sql` - Skapade journal trigger
- `add_external_customers_to_grooming.sql` - External customers support
- `create_external_customers_table.sql` - Extern kundtabell
- `fix_dog_journal_content_column.sql` - Journal content kolumn-fix

## 📄 Arkiverade dokument (`docs_old/`)

### Gamla system audits

- `SYSTEM_AUDIT_2025-11-02.md` - Systemaudit från november (ersatt av nyare)
- `DATAFLÖDES_VERIFIERING_2025-01-17.md` - Dataflödesanalys januari
- `DASHBOARD_HUNDDAGIS_FIXES_2025-01-17.md` - Dashboard fixes

### Fix rapporter

- `CLEANUP_LOG.md` - Cleanup logg (consolidated i nyare dokument)
- `FIX_DATABASE_ERRORS.md` - Database error fixes
- `FIX_RLS_INSTRUKTIONER.md` - RLS instruktioner
- `SINGLE_FIX_RAPPORT_2025-01-17.md` - Single fix rapport januari

### Deployment guides

- `DEPLOY_FIX_ORG_ASSIGNMENT.md` - Org assignment deployment (utdaterad)
- `DEPLOYMENT_GUIDE_2025-11-17.md` - Deployment guide november
- `INSTALL_MIGRATION.md` - Migration installationsinstruktioner

### Implementation summaries

- `IMPLEMENTATION_SUMMARY_20251116.md` - Implementation summary november
- `EDITDOGMODAL_FIXES_2025-11-17.md` - EditDogModal fixes
- `LANDING_PAGES_REFACTORED.md` - Landing page refactoring
- `LANDING_PAGE_ROBUSTNESS_AUDIT.md` - Landing page audit

### Change logs & status

- `NYBOKNING_V2_CHANGES.md` - Nybokning v2 ändringar
- `REFACTOR_PLAN_NYBOKNING.md` - Refactor plan
- `STATUS_20251117.md` - Status rapport 17 november
- `ÄNDRINGAR_2025-11-17.md` - Ändringar 17 november
- `STEG_FÖR_STEG_GUIDE.md` - Steg-för-steg guide
- `NEXT_STEPS_MANUAL.md` - Next steps manual

## ✅ Aktiv dokumentation (ligger kvar i root)

### Aktuella systemdokument

- `SYSTEMANALYS_KOMPLETT_2025-11-22.md` - Senaste systemanalys
- `TRIGGER_ANALYS_2025-11-22.md` - Triggeranalys (facit från Supabase)
- `CLEANUP_PLAN_2025-11-22.md` - Cleanup plan
- `UX_FORBATTRINGAR_2025-11-22.md` - UX-förbättringar

### Viktiga system-README:er

- `README.md` - Huvuddokumentation
- `FAS6_README.md` - Fas 6 features
- `SYSTEMDOKUMENTATION.md` - Systemdokumentation
- `NYBOKNING_V2_README.md` - Nybokning v2
- `PENSIONAT_BOOKING_FLOW.md` - Booking flow
- `TRIGGERS_README.md` - Trigger dokumentation
- `SQL_FILES_README.md` - SQL fil guide

### Användbara SQL-scripts

- `AUDIT_CURRENT_DATABASE.sql` - Kör för att se aktuellt state
- `VALIDATE_CUSTOMER_NUMBERS.sql` - Validera customer numbers
- `check_org.sql` - Organisationscheck
- `test_invoice_system.sql` - Test invoice system

## 🔄 När behövs arkiverade filer?

Använd arkiverade filer endast för:

- Historisk kontext vid debugging
- Förstå hur systemet byggdes upp
- Referens vid liknande problem
- Backup om något oväntat händer

**Använd INTE för:**

- Nya installationer (använd migrations/)
- Produktionsändringar (skapa ny migration)
- Dokumentation (läs aktiva README:er)

## 📅 Arkiverat datum

**2025-11-22** - Initial cleanup och arkivering efter systemanalys

**Skapad av:** Systematisk cleanup efter trigger-analys och systemgenomgång
**Anledning:** Minska förvirring genom att separera aktiv från historisk dokumentation
