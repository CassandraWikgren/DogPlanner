# 🔄 SCHEMA SYNC WORKFLOW - Håll migrations synkade

**Datum:** 2 december 2025  
**Syfte:** Automatisera synkning mellan Supabase production och lokala migrations

---

## 🎯 PROBLEM

När du gör SQL-ändringar direkt i Supabase SQL Editor:

- ✅ Fixar production omedelbart
- ❌ Men migrations-filerna uppdateras INTE
- ❌ Andra utvecklare får inte ändringarna
- ❌ `supabase db reset` återställer till gammal schema

---

## ✅ LÖSNING: 3-stegs workflow

### Steg 1: Gör ändringar i Supabase (AKUT)

För kritiska buggar, kör SQL direkt i Supabase SQL Editor:

```sql
-- Snabb fix för production
ALTER TABLE special_dates ADD COLUMN new_field TEXT;
```

### Steg 2: Skapa migration-fil (SAMMA DAG)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031

# Skapa ny migration med timestamp
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_beskrivning.sql

# Kopiera SQL från Supabase till filen
# Eller skriv om den manuellt
```

**Exempel:**

```sql
-- supabase/migrations/20251202140000_add_special_dates_field.sql
ALTER TABLE public.special_dates
  ADD COLUMN IF NOT EXISTS new_field TEXT;
```

### Steg 3: Commit och pusha

```bash
git add supabase/migrations/
git commit -m "migration: Add new_field to special_dates"
git push origin main
```

---

## 📅 VECKORUTIN (Fredag 15:00)

### 1. Exportera current schema från Supabase

Kör i Supabase SQL Editor:

```sql
-- Visa ALLA tabeller
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Visa RLS-status
SELECT
  tablename,
  rowsecurity as rls_on
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. Jämför med migrations

```bash
# Lista alla migrations
ls -lh supabase/migrations/

# Kolla senaste migration
cat supabase/migrations/$(ls -t supabase/migrations/ | head -1)
```

### 3. Om discrepancy finns - skapa catch-up migration

```bash
# Skapa en "schema sync" migration
touch supabase/migrations/$(date +%Y%m%d)_weekly_schema_sync.sql

# Lägg till alla saknade ändringar
```

---

## 🚨 CRITICAL: Production deployment checklist

**Innan du enabler RLS i production:**

- [ ] Alla SQL fixes har migrations (kör `ls supabase/migrations/`)
- [ ] Migrations är pushade till GitHub
- [ ] Lokal `supabase db reset` fungerar utan fel
- [ ] Test-data finns i prod (kör `FIX_406_ERRORS_DATA.sql`)
- [ ] RLS policies är skapade men INTE enabled än
- [ ] Backup av production DB tagen (Supabase Dashboard → Database → Backups)

**Efter RLS enabled:**

- [ ] Logga in som test-user och verifiera att data visas
- [ ] Testa CRUD operations (create, read, update, delete)
- [ ] Kolla browser console för 406/401 fel
- [ ] Om något failar: `DISABLE ROW LEVEL SECURITY` och debug

---

## 🔧 Troubleshooting

### "Migration out of sync" error

```bash
# Reset lokal databas till production state
supabase db reset

# Om det failar, kolla vilken migration som är broken:
supabase migration list
```

### "RLS blocking queries efter enable"

```sql
-- Kolla vilken user du är:
SELECT current_user, auth.uid();

-- Kolla din org_id:
SELECT id, email, org_id FROM profiles WHERE id = auth.uid();

-- Om org_id är NULL - FIX:
-- Kör heal_user_missing_org() från PERMANENT_FIX_org_assignment.sql
```

### "406 errors fortfarande finns"

Detta är OK om:

- Tabellerna är tomma för din org
- Koden försöker `.single()` på 0 results

Fixa genom att:

1. Lägg till data med `FIX_406_ERRORS_DATA.sql`
2. ELLER ändra koden från `.single()` till `.maybeSingle()`

---

## 📊 Metrics att spåra

**Varje vecka, logga:**

- Antal migrations: `ls supabase/migrations/ | wc -l`
- Senaste migration datum: `ls -lt supabase/migrations/ | head -2`
- Production tables: (kör query från steg 1 ovan)

**Mål:**

- Max 7 dagar mellan production change och migration skapad
- Inga "ghost tables" (finns i prod men saknas i migrations)
- Inga "zombie migrations" (finns i migrations men inte i prod)

---

## ⚡ Quick Commands

```bash
# Skapa ny migration nu
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_my_change.sql

# Kolla senaste 5 migrations
ls -lt supabase/migrations/ | head -6

# Count migrations
ls supabase/migrations/*.sql | wc -l

# Testa migrations lokalt
supabase db reset

# Pusha migrations
git add supabase/migrations/ && git commit -m "migration: beskrivning" && git push
```

---

## 🎯 MÅLET: 10/10 Hållbarhet

Med detta workflow når vi:

- ✅ Reproducerbara databaser (migrations körbara när som helst)
- ✅ Team-friendly (andra devs får dina ändringar)
- ✅ Auditlog (git history visar alla schema changes)
- ✅ Rollback-möjlighet (återställ till äldre migration)
- ✅ CI/CD ready (kan automatisera migration-körning)

**Status nu:** 8/10  
**Status efter denna workflow:** 10/10 🎉
