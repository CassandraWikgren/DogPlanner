# RLS Långsiktig Hållbarhetsguide

> Skapad: 2025-12-08
> Senast verifierad: 2025-12-08

## Sammanfattning

Detta dokument beskriver den **långsiktigt hållbara** RLS-lösningen för DogPlanner.

---

## 🔑 Kritisk princip: ENDA sanningskälla

**`types/database_AUTO_GENERATED.ts`** är den ENDA tillförlitliga källan för:

- Tabellnamn
- Kolumnnamn
- Funktioner
- Views

### ⚠️ ALDRIG använd `types/database.ts` som källa!

Den filen är manuellt underhållen och INTE synkad med Supabase.

---

## Filer som ingår i lösningen

| Fil                                                     | Syfte                                       |
| ------------------------------------------------------- | ------------------------------------------- |
| `supabase/migrations/20251208_MASTER_RLS_POLICY_V3.sql` | Komplett RLS-policy för alla tabeller       |
| `RLS_TABLE_INVENTORY.md`                                | Dokumentation av alla tabeller och kolumner |
| `RLS_SUSTAINABILITY_GUIDE.md`                           | Denna fil - långsiktig guide                |

---

## Workflow vid schemaändringar

### 1. När du lägger till en NY tabell:

```bash
# 1. Lägg till tabellen i Supabase
# 2. Regenerera types:
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database_AUTO_GENERATED.ts

# 3. Lägg till RLS policy i V3.sql:
ALTER TABLE nya_tabellen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nya_tabellen_all" ON nya_tabellen;
CREATE POLICY "nya_tabellen_all" ON nya_tabellen
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());
```

### 2. När du ändrar kolumner:

```bash
# 1. Regenerera types först!
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database_AUTO_GENERATED.ts

# 2. Kontrollera att policy-filen matchar
# 3. Uppdatera RLS_TABLE_INVENTORY.md
```

### 3. Innan du deployar RLS-ändringar:

```sql
-- Kör alltid i staging först!
-- Verifiera med:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
SELECT column_name FROM information_schema.columns WHERE table_name = 'din_tabell';
```

---

## RLS-arkitektur

### Pattern 3: Hybrid Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                        AUTENTISERING                        │
│                                                             │
│  ┌─────────────────┐           ┌─────────────────┐         │
│  │     STAFF       │           │     KUNDER      │         │
│  │   (profiles)    │           │    (owners)     │         │
│  └────────┬────────┘           └────────┬────────┘         │
│           │                             │                   │
│           ▼                             ▼                   │
│  org_id = get_user_org_id()    user_id = auth.uid()        │
│           │                     OR profile_id = auth.uid()  │
│           │                             │                   │
│           └───────────┬─────────────────┘                  │
│                       ▼                                     │
│              ┌─────────────────┐                           │
│              │   ALLA TABELLER │                           │
│              │   (org_id-check)│                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Hjälpfunktion

```sql
-- Används i alla policies
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Kategorier av tabeller

### A. Tabeller med org_id (standard multi-tenant)

Policy: `org_id = get_user_org_id()`

### B. Kundtabeller (dubbla policies)

Policy: `org_id = get_user_org_id() OR user_id = auth.uid()`

- `owners`
- `dogs`
- `bookings`
- `invoices`

### C. Tabeller utan org_id (JOIN-baserade)

Policy: `EXISTS (SELECT 1 FROM parent_table WHERE ...)`

- `attendance_logs` → via `dogs.org_id`
- `booking_services` → via `bookings.org_id`
- `invoice_items` → via `invoices.org_id`

### D. Systemtabeller (service_role only)

RLS aktiverat, inga authenticated policies:

- `error_logs`, `function_logs`, `migrations`, `system_config`, etc.

---

## Vanliga misstag att undvika

### ❌ Fel: Använda kolumner som inte finns

```sql
-- FEL: boarding_seasons har INTE is_active!
WHERE is_active = true

-- RÄTT: kontrollera schema först
SELECT column_name FROM information_schema.columns
WHERE table_name = 'boarding_seasons';
```

### ❌ Fel: Använda tabeller som inte finns

```sql
-- FEL: tabellen heter INTE 'applications'
-- RÄTT: tabellen heter 'interest_applications'

-- FEL: tabellen heter INTE 'customer_discounts'
-- RÄTT: tabellen heter 'owner_discounts'
```

### ❌ Fel: Glömma SECURITY DEFINER på RPC-funktioner

```sql
-- RÄTT: RPC som behöver bypassa RLS
CREATE FUNCTION heal_user_missing_org(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER  -- 👈 KRITISKT!
AS $$...$$;
```

---

## Verifieringsrutiner

### Daglig/vid deployment:

```sql
-- Kontrollera att RLS är aktiverat
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Kontrollera policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Vid problem:

1. Kontrollera `database_AUTO_GENERATED.ts` för korrekta namn
2. Verifiera att `get_user_org_id()` fungerar
3. Kontrollera triggers och RPC-funktioner

---

## Kontaktpunkter för ändringar

- **Ny tabell?** → Lägg till i V3.sql + uppdatera inventory
- **Ny RPC?** → Överväg SECURITY DEFINER
- **Ändrad kolumn?** → Regenerera types + verifiera policies
- **Problem?** → Kolla `error_logs` och `trigger_execution_log`

---

## Historik

| Datum      | Version | Förändring                                                 |
| ---------- | ------- | ---------------------------------------------------------- |
| 2025-12-08 | V3      | Komplett omskrivning baserad på database_AUTO_GENERATED.ts |
| 2025-12-07 | V2      | Försök att fixa (trasig - fel tabellnamn)                  |
| 2025-12-07 | V1      | Initial version (ofullständig)                             |
