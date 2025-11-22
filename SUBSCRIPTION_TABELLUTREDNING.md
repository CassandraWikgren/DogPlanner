# 🔍 SUBSCRIPTION TABELLUTREDNING

## PROBLEM: Två olika subscription-tabeller upptäckta!

Från `supabase/detta är_min_supabase_just_nu.sql`:

### Tabell 1: `subscriptions`

```sql
CREATE TRIGGER on_insert_set_org_id_for_subscriptions
BEFORE INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION set_org_id_for_subscription()
```

**RLS Policies (10 st):**

- allow_insert_for_profile_org
- allow_select_subscriptions
- delete_policy
- delete_subscriptions_admin_only
- insert_policy
- insert_subscriptions_admin_only
- read_subscriptions_admin_only
- select_policy
- update_policy
- update_subscriptions_admin_only

---

### Tabell 2: `org_subscriptions`

```sql
-- Används i handle_new_user trigger:
INSERT INTO org_subscriptions (
  org_id,
  status,
  trial_ends_at,
  created_at
) VALUES (
  v_org_id,
  'trialing',
  now() + interval '3 months',
  now()
);
```

---

## ❓ VAD BEHÖVER KLARLÄGGAS:

### Query 1: Vilka tabeller finns?

```sql
-- KÖR I SUPABASE SQL EDITOR:
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%subscription%'
ORDER BY table_name;
```

### Query 2: Hur många rader i varje?

```sql
SELECT
  'subscriptions' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_row,
  MAX(created_at) as newest_row
FROM subscriptions
UNION ALL
SELECT
  'org_subscriptions',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM org_subscriptions;
```

### Query 3: Vilka kolumner har varje tabell?

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('subscriptions', 'org_subscriptions')
ORDER BY table_name, ordinal_position;
```

### Query 4: Vilken används i koden?

```bash
# Kör i terminalen:
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031

# Sök efter subscriptions:
grep -r "from subscriptions" app/ --include="*.ts" --include="*.tsx" | wc -l

# Sök efter org_subscriptions:
grep -r "from org_subscriptions" app/ --include="*.ts" --include="*.tsx" | wc -l
```

---

## 🎯 MÖJLIGA SCENARION:

### Scenario A: Båda används parallellt

**Problem:** Data-inkonsistens, dubbelt arbete  
**Lösning:** Migrera allt till EN tabell

### Scenario B: En är gammal (deprecated)

**Problem:** Dead code, förvirrande  
**Lösning:** Ta bort oanvänd tabell + triggers + policies

### Scenario C: Olika syften

**Problem:** Oklart från namnen vad skillnaden är  
**Lösning:** Dokumentera tydligt + överväg namnbyte

---

## 🔧 REKOMMENDERAD LÖSNING

**OM `org_subscriptions` är den aktiva:**

1. Verifiera att ALL kod använder `org_subscriptions`
2. Ta bort trigger för `subscriptions`
3. Ta bort RLS policies för `subscriptions`
4. Migrera eventuell data
5. Droppa `subscriptions`-tabellen

```sql
-- Migration (KÖR EJ INNAN VERIFIERING!):
BEGIN;

-- Steg 1: Migrera data om nödvändig
INSERT INTO org_subscriptions (org_id, status, created_at)
SELECT org_id, status, created_at
FROM subscriptions
WHERE NOT EXISTS (
  SELECT 1 FROM org_subscriptions
  WHERE org_subscriptions.org_id = subscriptions.org_id
);

-- Steg 2: Ta bort gamla policies
DROP POLICY IF EXISTS "allow_insert_for_profile_org" ON subscriptions;
DROP POLICY IF EXISTS "allow_select_subscriptions" ON subscriptions;
-- ... (alla 10 policies)

-- Steg 3: Ta bort trigger
DROP TRIGGER IF EXISTS on_insert_set_org_id_for_subscriptions ON subscriptions;

-- Steg 4: Ta bort tabell
DROP TABLE subscriptions;

COMMIT;
```

---

## ⚠️ INNAN DU GÖR NÅGOT:

1. ✅ Kör Query 1-4 ovan
2. ✅ Säkerhetskopiera databasen
3. ✅ Granska vilket namn som används i `app/`-koden
4. ✅ Kontrollera om det finns foreign keys
5. ✅ Testa i development först

---

**Nästa steg:** Kör queries och rapportera resultaten här!
