# 🔧 PERMANENT FIX: Uppdatera handle_new_user() i Produktion

## Problem

Din trigger `on_auth_user_created` finns i Supabase, men den kör en gammal version av `handle_new_user()` som inte läser `user_metadata` korrekt. Detta gör att nya användare får org_id = NULL.

## Lösning

Uppdatera funktionen i Supabase SQL Editor.

---

## 📋 STEG-FÖR-STEG:

### **1. Öppna Supabase Dashboard**

1. Gå till: https://supabase.com/dashboard/project/fhdkkkujnhteetllxypg
2. Logga in med ditt Supabase-konto
3. Klicka på "SQL Editor" i vänstermenyn

### **2. Kör denna SQL (kopiera allt):**

```sql
-- ============================================================================
-- UPPDATERA handle_new_user() - Läser metadata korrekt
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
BEGIN
  -- Läs metadata från registreringsformuläret
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';

  RAISE NOTICE '🔵 handle_new_user: Skapar org för % med metadata: org_name=%, org_number=%',
    NEW.email, v_org_name, v_org_number;

  -- Skapa organisationen MED alla värden från registreringen
  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
  VALUES (
    v_org_name,
    v_org_number,
    NEW.email,
    true,
    25
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE '✅ Organisation skapad: %', v_org_id;

  -- Skapa profilen som admin MED alla värden från registreringen
  INSERT INTO profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    NEW.id,
    v_org_id,
    'admin',
    NEW.email,
    v_full_name,
    v_phone
  );

  RAISE NOTICE '✅ Profil skapad för användare: % med org_id: %', NEW.id, v_org_id;

  -- Skapa 3 månaders gratis prenumeration
  INSERT INTO org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, is_active)
  VALUES (
    v_org_id,
    'basic',
    'trialing',
    NOW(),
    NOW() + INTERVAL '3 months',
    true
  );

  RAISE NOTICE '✅ Prenumeration skapad för org: %', v_org_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ handle_new_user misslyckades: %', SQLERRM;
    RETURN NEW; -- Tillåt registrering även om trigger misslyckas
END;
$$;

-- Verifiera att funktionen uppdaterades
SELECT
  routine_name,
  routine_type,
  security_type,
  created as last_updated
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';
```

### **3. Klicka "Run" eller Ctrl+Enter**

Du ska se:

```
✅ Success. Returned 1 rows.
```

### **4. Verifiera att triggern är aktiv:**

Kör denna SQL:

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
```

Ska returnera:

```
trigger_name: on_auth_user_created
event_manipulation: INSERT
action_timing: AFTER
```

---

## 🧪 TESTA ÄNDRINGEN:

### **Metod 1: Registrera ny användare**

1. Logga ut från DogPlanner
2. Gå till /register
3. Skapa ett NYTT konto med ny email
4. Efter registrering, gå till /profile-check
5. Verifiera att `org_id` INTE är NULL

### **Metod 2: Testa healing på befintligt konto**

1. Gå till /profile-check
2. Klicka "Fixa automatiskt (Heal User)"
3. Ladda om sidan
4. org_id ska nu finnas

---

## ❌ **TA BORT diagnos-sidan senare**

Efter att du verifierat att allt fungerar:

```bash
rm app/profile-check/page.tsx
git add -A
git commit -m "chore: Remove temporary diagnostic page"
git push
```

Diagnos-sidan var bara för debugging - den ska INTE finnas i produktion långsiktigt.

---

## 🎯 **RESULTAT:**

Efter denna fix:

- ✅ Nya användare får `org_id` automatiskt vid registrering
- ✅ Inga fler "Ingen organisation tilldelad" fel
- ✅ Healing-funktionen finns kvar som säkerhetsnät
- ✅ Systemet är hållbart och självläkande

---

## 📊 **VARFÖR DETTA ÄR HÅLLBART:**

| Före                                        | Efter                                |
| ------------------------------------------- | ------------------------------------ |
| ❌ Gammal trigger ignorerar metadata        | ✅ Ny trigger läser metadata korrekt |
| ❌ org_id blir NULL för nya användare       | ✅ org_id sätts automatiskt          |
| ❌ Manuell fix krävs för varje ny användare | ✅ Helt automatiskt                  |
| ❌ 3-lagers säkerhet funkar inte            | ✅ Alla 3 lager fungerar             |

**Detta är root cause-fix, inte symptom-fix!** 🎉
