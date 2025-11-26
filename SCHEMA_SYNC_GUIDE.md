# 🔄 HÅLL SCHEMA SYNKAT MED SUPABASE

**Senast uppdaterad:** 2025-11-26

---

## Enkel Workflow

AI kan inte koppla sig direkt till Supabase, men du kan hålla lokalt schema uppdaterat på 2 minuter!

---

## ✅ Snabbguide (rekommenderad metod)

### När du ändrar något i Supabase:

**1. Öppna `supabase/EXPORT_COMPLETE_SCHEMA.sql`**

**2. Kopiera QUERY 1 (tabeller & kolumner)**

**3. Kör i Supabase SQL Editor**

**4. Kopiera JSON-resultatet**

**5. Klistra in i `supabase/detta är_min_supabase_just_nu.sql`**

**6. Säg till AI:n: "Schema uppdaterat!"**

✅ **Klart på 2 minuter!**

---

## 📋 Vad finns i EXPORT_COMPLETE_SCHEMA.sql?

Filen innehåller **7 färdiga SQL queries** för att exportera:

1. **Tabeller & Kolumner** ⭐ (detta är minimum, redan gjort!)
2. **Triggers & Functions** (automatiska processer)
3. **RLS Policies** (säkerhetsregler)
4. **Foreign Keys** (relationer)
5. **Indexes** (performance)
6. **Views** (färdiga queries)
7. **RPC Functions** (callable från app)

**Behöver du köra alla?** NEJ! Query 1 räcker oftast. Kör resten bara om du ändrat triggers/policies.

---

## ✅ Aktuell Status (2025-11-26)

### Nyligen tillagda tabeller:

- ✅ **grooming_prices** - Prislista för hundfrisörtjänster (2025-11-26)

### Schema-filer i projektet:

| Fil                                          | Beskrivning                        | Status     |
| -------------------------------------------- | ---------------------------------- | ---------- |
| `supabase/EXPORT_COMPLETE_SCHEMA.sql`        | **ANVÄND DENNA** - Färdiga queries | ✅ Aktiv   |
| `supabase/detta är_min_supabase_just_nu.sql` | JSON export från QUERY 1           | ✅ Aktuell |
| `supabase/schema.sql`                        | Dokumentation                      | ✅ Läs här |
| `GROOMING_PRICES.sql`                        | Migration för grooming_prices      | ✅ Körts   |

---

## 🎯 Detaljerad Workflow

### Steg 1: Öppna rätt fil

```bash
# Öppna denna fil i VS Code:
supabase/EXPORT_COMPLETE_SCHEMA.sql
```

### Steg 2: Kopiera QUERY 1

Scrolla ner till "QUERY 1: ALLA TABELLER OCH KOLUMNER" och kopiera hela SQL-queryn.

### Steg 3: Kör i Supabase SQL Editor

1. Gå till din Supabase Dashboard
2. Öppna SQL Editor
3. Klistra in queryn
4. Klicka "Run"
5. Kopiera JSON-resultatet

### Steg 4: Uppdatera lokal fil

Klistra in JSON:en i `supabase/detta är_min_supabase_just_nu.sql`

### Steg 5: Säg till AI:n

```
"Jag har uppdaterat schema-filen med ny info från Supabase"
```

✅ **Klart!** AI:n ser nu dina senaste ändringar.

---

## 🔧 Behöver du mer info?

Om du ändrat **triggers, RLS policies eller functions**, kör även QUERY 2-7 från samma fil.

Annars räcker QUERY 1! 🎯

---

## 📝 Commits (valfritt)

```bash
git add supabase/detta\ är_min_supabase_just_nu.sql
git commit -m "schema: Uppdaterad från Supabase $(date +%Y-%m-%d)"
git push
```

---

## 📋 SQL Query för fullständig export

Om du vill exportera ALLT (tabeller, funktioner, triggers, RLS):

```sql
-- ALTERNATIV 1: Simpel tabell-export (AKTUELL METOD)
SELECT json_agg(
  json_build_object(
    'column_name', column_name,
    'data_type', data_type,
    'column_default', column_default,
    'is_nullable', is_nullable
  )
)
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ALTERNATIV 2: Använd GET_CURRENT_SCHEMA.sql
-- (finns i supabase/GET_CURRENT_SCHEMA.sql)
```

---

## � Quick Reference

### Kolla om tabell finns:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'grooming_prices'
);
```

### Lista alla tabeller:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Kolla RLS policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 💡 När du behöver hjälp av AI

**För att AI ska kunna hjälpa dig maximalt:**

1. ✅ Exportera schema (se ovan)
2. ✅ Uppdatera `supabase/detta är_min_supabase_just_nu.sql`
3. ✅ Säg: "Jag har uppdaterat schema-filen, kan du kolla X?"

**AI kan då:**

- Ge exakta SQL-queries
- Förstå relationerna mellan tabeller
- Föreslå RLS policies
- Debugga databasproblem
- Föreslå optimeringar (index, queries)

---

## 📚 Viktiga filer att känna till

### Migrations (historik):

- `supabase/migrations/PERMANENT_FIX_org_assignment.sql` - Kritisk org_id-logik
- `supabase/migrations/20251122_invoice_system_improvements.sql` - Fakturaunderlag
- `supabase/migrations/create_grooming_prices.sql` - Grooming prices (kör denna om tabellen saknas)

### SQL helpers:

- `GROOMING_PRICES.sql` - Ren SQL för grooming_prices (enkel att köra)
- `supabase/GET_CURRENT_SCHEMA.sql` - Schema export query
- `FIX_DAYCARE_COMPLETIONS_RLS.sql` - RLS fix för en specifik tabell

### Dokumentation:

- `supabase/schema.sql` - Dokumenterad changelog
- `SCHEMA_SYNC_GUIDE.md` - Denna fil

---

## ⚠️ Viktigt att veta

### Kör ALDRIG dessa automatiskt:

- ❌ `complete_testdata.sql` - Disablar triggers & RLS (endast för dev/debug)
- ❌ Triggers som börjar med `handle_new_user` - Kritisk för org_id assignment

### Alltid safe:

- ✅ SELECT queries
- ✅ CREATE TABLE IF NOT EXISTS
- ✅ CREATE OR REPLACE FUNCTION
- ✅ DROP POLICY IF EXISTS + CREATE POLICY

---

## 🆘 Felsökning

### Problem: "Tabellen finns inte"

```sql
-- Kolla om den verkligen finns
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'min_tabell';

-- Om NEJ: Kör migrations-filen igen
```

### Problem: "RLS blockerar queries"

```sql
-- Kolla vilka policies som finns
SELECT * FROM pg_policies WHERE tablename = 'min_tabell';

-- Lägg till policy om den saknas
-- Se exempel i GROOMING_PRICES.sql
```

### Problem: "Kan inte se priser i frisörsbokningar"

1. Kolla att `grooming_prices` tabellen finns
2. Kolla att det finns rader: `SELECT * FROM grooming_prices LIMIT 5;`
3. Kolla RLS: `SELECT * FROM pg_policies WHERE tablename = 'grooming_prices';`
4. Kolla i DevTools Console för fel

---

**Lycka till! 🚀**
