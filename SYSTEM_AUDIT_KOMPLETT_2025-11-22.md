# 🔍 KOMPLETT SYSTEMANALYS OCH ÅTGÄRDSPLAN

**Datum:** 2025-11-22  
**Omfattning:** Hel kodbasgenomgång med fokus på robusthet och långsiktig hållbarhet  
**Källa:** `supabase/detta är_min_supabase_just_nu.sql` (uppdaterad 2025-11-22 13:28)

---

## 📋 EXECUTIVE SUMMARY

### ✅ STYRKOR (Välfungerande)

1. **3-lagers org_id assignment system** - Robust redundans för användarregistrering
2. **Automatisk fakturering** - Komplett trigger-driven fakturering vid checkout
3. **Omfattande RLS policies** - 100+ policies för dataskydd
4. **Auth-system** - AuthContext med healing-funktionalitet
5. **TypeScript-typer** - Väl definierade databastyper

### ⚠️ KRITISKA PROBLEM (Måste åtgärdas)

1. **KRITISKT: `heal_user_missing_org()` funktionen saknas i databasen**
   - AuthContext anropar den men den finns inte i `detta är_min_supabase_just_nu.sql`
   - Finns bara i migrations-filer
   - Risk: Layer 3 i org_id assignment fungerar inte

2. **MAJOR: Inkonsistent fakturasystem**
   - `org_subscriptions` vs `subscriptions` - dubbla tabeller
   - Förvirrande referens till gamla strukturer

3. **MEDIUM: Loading state problem**
   - Flera sidor saknar else-case för när `currentOrgId` är null
   - Kan orsaka "evighets-spinner" för vissa användare

4. **MEDIUM: Överlappande RLS policies**
   - Många tabeller har 5-10 policies som kan kollidera
   - Exempel: `extra_service` har 11 policies

---

## 🔴 KRITISKA ÅTGÄRDER

### 1. ⚠️ AKUT: Lägg till `heal_user_missing_org()` i databasen

**Problem:**

```typescript
// app/context/AuthContext.tsx rad 323
const { data, error } = await supabase.rpc("heal_user_missing_org", {
  p_user_id: userId,
});
```

Funktionen anropas men **finns inte i `detta är_min_supabase_just_nu.sql`**!

**Lösning:**
Funktionen finns i `supabase/migrations/PERMANENT_FIX_org_assignment.sql` och måste köras i Supabase SQL Editor.

**SQL att köra:**

```sql
-- Från PERMANENT_FIX_org_assignment.sql rad 136
CREATE OR REPLACE FUNCTION heal_user_missing_org(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_email text;
  v_user_metadata jsonb;
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
  v_lan text;
  v_kommun text;
  v_service_types text[];
  v_org_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id)
  INTO v_profile_exists;

  -- Extract metadata
  v_org_name := COALESCE(
    v_user_metadata->>'org_name',
    split_part(v_user_email, '@', 1) || 's Hunddagis'
  );
  v_org_number := v_user_metadata->>'org_number';
  v_full_name := COALESCE(
    v_user_metadata->>'full_name',
    split_part(v_user_email, '@', 1)
  );
  v_phone := v_user_metadata->>'phone';
  v_lan := v_user_metadata->>'lan';
  v_kommun := v_user_metadata->>'kommun';

  IF v_user_metadata ? 'service_types' THEN
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(v_user_metadata->'service_types')
    );
  END IF;

  -- Try to find existing org
  SELECT id INTO v_org_id
  FROM orgs
  WHERE email = v_user_email
     OR (org_number IS NOT NULL AND org_number = v_org_number)
  LIMIT 1;

  -- Create org if not found
  IF v_org_id IS NULL THEN
    INSERT INTO orgs (
      name, org_number, email, phone, lan, kommun, service_types, created_at
    ) VALUES (
      v_org_name, v_org_number, v_user_email, v_phone, v_lan, v_kommun, v_service_types, now()
    ) RETURNING id INTO v_org_id;
  END IF;

  -- Update or create profile
  IF v_profile_exists THEN
    UPDATE profiles
    SET org_id = v_org_id,
        full_name = COALESCE(full_name, v_full_name),
        phone = COALESCE(phone, v_phone),
        updated_at = now()
    WHERE id = p_user_id;
  ELSE
    INSERT INTO profiles (id, org_id, role, email, full_name, phone, created_at)
    VALUES (p_user_id, v_org_id, 'admin', v_user_email, v_full_name, v_phone, now());
  END IF;

  -- Ensure subscription exists
  INSERT INTO org_subscriptions (org_id, status, trial_ends_at, created_at)
  VALUES (v_org_id, 'trialing', now() + interval '3 months', now())
  ON CONFLICT (org_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_org_id,
    'message', 'User healed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Verifiering:**

```sql
-- Kör i Supabase SQL Editor
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'heal_user_missing_org'
  AND routine_schema = 'public';
```

---

### 2. 🔧 Konsolidera subscription-system

**Problem:**
Databasen har BÅDE `subscriptions` OCH `org_subscriptions` tabeller.

**Verifiera vilken som används:**

```sql
-- Kör i Supabase
SELECT
  'subscriptions' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry
FROM subscriptions
UNION ALL
SELECT
  'org_subscriptions' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry
FROM org_subscriptions;
```

**Åtgärd:**

- Om `org_subscriptions` används → uppdatera AuthContext och API:er
- Om `subscriptions` används → uppdatera `handle_new_user()` trigger

---

### 3. 🐛 Fixa loading states i alla sidor

**Problem:**
Flera sidor hanterar inte fallet när `currentOrgId` är null, vilket orsakar oändlig loading.

**Drabbade filer:**

- `app/rooms/page.tsx`
- `app/applications/page.tsx`
- `app/owners/page.tsx`
- `app/admin/abonnemang/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/priser/frisor/page.tsx`
- `app/admin/priser/dagis/page.tsx`

**Pattern som saknas:**

```typescript
// FEL (saknar else)
useEffect(() => {
  if (currentOrgId) {
    loadData();
  }
}, [currentOrgId]);

// RÄTT (med else)
useEffect(() => {
  if (currentOrgId) {
    loadData();
  } else {
    setLoading(false); // ← VIKTIGT!
  }
}, [currentOrgId]);
```

---

## 🟡 MEDEL PRIORITET

### 4. Rensa överlappande RLS policies

**Exempel - `extra_service` tabell har 11 policies:**

```sql
-- Duplicerade policies (gör samma sak):
1. "Org members can read org extra_service"
2. "extra_service_select"
3. "select_own_org"
4. "allow_select_extra_service"

-- Lösning: Konsolidera till EN policy per operation
```

**Åtgärd:**
Skapa `CLEANUP_RLS_POLICIES.sql` som:

1. Identifierar duplicerade policies
2. Behåller den mest specifika
3. Droppar övriga

---

### 5. Verifiera alla triggers är aktiva

**Kritiska triggers att verifiera:**

```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'trg_create_invoice_on_checkout',
    'trg_create_prepayment_invoice',
    'trg_set_booking_org_id',
    'trg_auto_match_owner'
  )
ORDER BY event_object_table, trigger_name;
```

---

## 🟢 LÅG PRIORITET (Men viktiga för långsiktig hållbarhet)

### 6. TypeScript type safety

**Verifiera att `types/database.ts` matchar aktuell databas:**

```bash
# I terminal
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > types/database-generated.ts
diff types/database.ts types/database-generated.ts
```

---

### 7. Dokumentera alla API routes

**Skapa en API-inventory:**

```bash
find app/api -name "route.ts" | sort
```

För varje route, dokumentera:

- Auth-krav
- Input validation
- Error handling
- Rate limiting

---

### 8. Lägg till monitoring

**Implementera:**

- Sentry error tracking (redan konfigurerad i `sentry.*.config.ts`)
- Database query performance monitoring
- Auth flow success rate tracking

---

## 📊 DATABAS HEALTH CHECK

### Kör dessa queries i Supabase SQL Editor:

```sql
-- 1. Verifiera att alla användare har org_id
SELECT
  COUNT(*) FILTER (WHERE org_id IS NULL) as users_without_org,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE org_id IS NOT NULL) / COUNT(*), 2) as coverage_percent
FROM profiles;

-- 2. Hitta organisationer utan admin
SELECT
  o.id,
  o.name,
  COUNT(p.id) as total_users,
  COUNT(p.id) FILTER (WHERE p.role = 'admin') as admin_count
FROM orgs o
LEFT JOIN profiles p ON p.org_id = o.id
GROUP BY o.id, o.name
HAVING COUNT(p.id) FILTER (WHERE p.role = 'admin') = 0;

-- 3. Verifiera trigger-funktioner
SELECT
  routine_name,
  routine_type,
  created
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'heal_user_missing_org',
    'create_invoice_on_checkout',
    'create_prepayment_invoice',
    'set_booking_org_id'
  )
ORDER BY routine_name;

-- 4. Count RLS policies per tabell
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 5
ORDER BY COUNT(*) DESC;
```

---

## 🎯 PRIORITERAD ÅTGÄRDSLISTA

### VECKA 1 (KRITISKT - GÖR NU)

1. ✅ Kör `heal_user_missing_org()` SQL i Supabase
2. ✅ Verifiera att funktionen finns: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'heal_user_missing_org'`
3. ✅ Testa healing-funktionen: `SELECT heal_user_missing_org('[test-user-id]'::uuid)`
4. ✅ Fixa loading states i alla 7 drabbade sidor

### VECKA 2 (VIKTIGT)

5. 🔄 Konsolidera subscription-system
6. 🧹 Rensa duplicerade RLS policies
7. ✅ Verifiera alla kritiska triggers är aktiva

### VECKA 3-4 (FÖRBÄTTRINGAR)

8. 📝 Dokumentera alla API routes
9. 🔍 Lägg till monitoring och alerting
10. 🧪 Skriv integrationstester för kritiska flöden

---

## 🛠️ VERKTYG FÖR UNDERHÅLL

### 1. Daglig Health Check Script

```bash
#!/bin/bash
# save as: scripts/health-check.sh

echo "🏥 DogPlanner Health Check"
echo "=========================="

# Check if heal_user_missing_org exists
psql $DATABASE_URL -c "
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ heal_user_missing_org EXISTS'
    ELSE '❌ heal_user_missing_org MISSING'
  END as status
FROM information_schema.routines
WHERE routine_name = 'heal_user_missing_org';
"

# Check users without org_id
psql $DATABASE_URL -c "
SELECT
  COUNT(*) as users_without_org
FROM profiles
WHERE org_id IS NULL;
"

# Check for failed triggers
psql $DATABASE_URL -c "
SELECT
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%org%'
ORDER BY event_object_table;
"
```

### 2. Migration Verification Script

```bash
#!/bin/bash
# Verifiera att alla migrations är körda

echo "Checking migrations..."
psql $DATABASE_URL -c "
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
"
```

---

## 📚 DOKUMENTATION ATT UPPDATERA

1. **README.md** - Lägg till troubleshooting-sektion
2. **.github/copilot-instructions.md** - Uppdatera med nya findings
3. **SYSTEMDOKUMENTATION.md** - Lägg till API-dokumentation
4. Skapa **DEPLOYMENT_CHECKLIST.md** - Steg för deployment

---

## 🚀 DEPLOYMENT CHECKLIST

Innan varje deployment till produktion:

- [ ] Kör `npm run build` lokalt utan fel
- [ ] Kör health check queries i Supabase
- [ ] Verifiera att `heal_user_missing_org()` finns
- [ ] Testa registreringsflödet i staging
- [ ] Verifiera att alla env-variabler är satta i Vercel
- [ ] Kontrollera Sentry för nya fel
- [ ] Backup av databas

---

## 📞 KONTAKTPUNKTER

- **Databas:** Supabase Dashboard → SQL Editor
- **Hosting:** Vercel Dashboard → dogplanner project
- **Error Tracking:** Sentry → javascript-nextjs project
- **Monitoring:** (Behöver implementeras)

---

## 💡 LÅNGSIKTIGA FÖRBÄTTRINGAR

1. **Automatisera healing:** Lägg till cron-job som kör `heal_user_missing_org()` för alla användare utan org_id
2. **Rate limiting:** Implementera för känsliga API-routes
3. **Audit logging:** Logga alla admin-åtgärder
4. **Backup strategi:** Automatiska dagliga backups
5. **Disaster recovery:** Dokumenterad återställningsplan

---

**Slutsats:**  
Systemet är i grunden robust men har några kritiska luckor som måste åtgärdas innan produktion. Den viktigaste åtgärden är att lägga till `heal_user_missing_org()` funktionen i databasen.

**Next Steps:**

1. Kör SQL för `heal_user_missing_org()` i Supabase SQL Editor **NU**
2. Fixa loading states i alla 7 sidor
3. Verifiera med health check queries
4. Testa registreringsflödet end-to-end
