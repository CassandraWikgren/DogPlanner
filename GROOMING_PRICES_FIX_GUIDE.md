# 🔧 GROOMING PRICES - KOMPLETT FELSÖKNINGSGUIDE

**Datum:** 30 november 2025  
**Problem:** "new row violates row-level security policy for table grooming_prices"  
**Status:** 🔴 KRITISKT - Användare kan inte lägga till priser

---

## 📊 PROBLEMANALYS

### Felet som uppstår:

```
Kunde inte lägga till: new row violates row-level security policy for table "grooming_prices"
```

### Vad betyder det?

- Supabase RLS (Row Level Security) blockerar INSERT-operationen
- Den aktuella användaren saknar rättigheter att lägga till rader
- Ofta beror detta på:
  1. ❌ RLS policy använder FOR ALL med komplex subquery
  2. ❌ WITH CHECK clause matchar inte de värden som skickas
  3. ❌ org_id är NULL eller felaktigt i INSERT
  4. ❌ Användaren har ingen profile med org_id

---

## 🔍 DIAGNOSTIK - KÖR DESSA QUERIES

### Steg 1: Kolla om tabellen finns

```sql
SELECT
  'Tabell exists' as check_type,
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'grooming_prices'
  ) as result;
```

**Förväntat resultat:** `result = true`

---

### Steg 2: Kolla RLS policies

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'grooming_prices'
ORDER BY policyname;
```

**Problem att leta efter:**

- ❌ Endast EN policy med `cmd = 'ALL'` (för brett)
- ❌ Komplex subquery i WITH CHECK
- ❌ Användning av `LIMIT 1` i subquery (kan returnera NULL)

**Korrekt state (4 separata policies):**

- ✅ `Users can view grooming prices in their org` (SELECT)
- ✅ `Users can insert grooming prices in their org` (INSERT)
- ✅ `Users can update grooming prices in their org` (UPDATE)
- ✅ `Users can delete grooming prices in their org` (DELETE)

---

### Steg 3: Kolla användarens profile

```sql
SELECT
  id,
  email,
  org_id,
  role
FROM profiles
WHERE id = auth.uid();
```

**Problem att leta efter:**

- ❌ `org_id` är NULL
- ❌ Ingen rad returneras (användaren har ingen profile)

**Korrekt state:**

- ✅ org_id har ett UUID-värde
- ✅ role är 'admin' eller 'manager'

---

### Steg 4: Testa INSERT med ditt org_id

```sql
-- Byt ut 'DIT_ORG_ID' med det UUID du fick från Steg 3
INSERT INTO grooming_prices (
  org_id,
  service_name,
  service_type,
  price,
  duration_minutes,
  active
) VALUES (
  'DIT_ORG_ID',
  'Test Badning',
  'bath',
  300,
  60,
  true
);
```

**Om detta fungerar:** RLS policies är OK, problemet är i koden  
**Om detta INTE fungerar:** RLS policies är trasiga

---

## ✅ LÖSNING 1: Fixa RLS Policies (REKOMMENDERAS)

### SQL att köra i Supabase SQL Editor:

```sql
-- =====================================================
-- FIX: GROOMING_PRICES RLS POLICIES
-- =====================================================

-- Ta bort gamla policies
DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can insert grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can update grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can delete grooming prices in their org" ON public.grooming_prices;

-- SELECT: Visa priser för användarens org
CREATE POLICY "Users can view grooming prices in their org"
ON public.grooming_prices
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- INSERT: Lägg till priser i användarens org
-- VIKTIGT: WITH CHECK använder samma subquery som USING
CREATE POLICY "Users can insert grooming prices in their org"
ON public.grooming_prices
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- UPDATE: Uppdatera priser i användarens org
CREATE POLICY "Users can update grooming prices in their org"
ON public.grooming_prices
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- DELETE: Ta bort priser i användarens org
CREATE POLICY "Users can delete grooming prices in their org"
ON public.grooming_prices
FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Verifiera att RLS är aktiverat
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

-- Bekräftelse
SELECT 'RLS policies uppdaterade!' as status;
```

---

## ✅ LÖSNING 2: Verifiera Koden

### Kontrollera att currentOrgId skickas korrekt

I `/app/admin/hundfrisor/priser/page.tsx`, rad ~228:

```typescript
const addNewPrice = async () => {
  if (!currentOrgId || !newPrice.service_name || !newPrice.price) {
    setError("Tjänstnamn och pris måste fyllas i");
    return;
  }

  // 🔍 LÄGG TILL DEBUG-LOGGING HÄR:
  console.log("🐛 DEBUG - Adding price:", {
    currentOrgId,
    newPrice,
    fullInsert: { ...newPrice, org_id: currentOrgId },
  });

  setSaving(true);
  setError(null);
  try {
    const { data, error } = await supabase
      .from("grooming_prices")
      .insert([{ ...newPrice, org_id: currentOrgId }])
      .select(); // 🔍 Lägg till .select() för att se vad som returneras

    if (error) {
      // 🔍 LOGGA HELA FELOBJEKTET
      console.error("❌ Supabase error:", error);
      throw new Error(`Kunde inte lägga till: ${error.message}`);
    }

    console.log("✅ Insert successful:", data);

    await loadPrices();
    // ... rest of code
  } catch (err: any) {
    console.error("Error adding price:", err);
    setError(err.message || "Okänt fel vid tillägg");
  } finally {
    setSaving(false);
  }
};
```

---

## ✅ LÖSNING 3: Verifiera AuthContext

### Kolla att currentOrgId faktiskt har ett värde:

I `/app/context/AuthContext.tsx`, kontrollera att:

```typescript
// Användaren har en profile med org_id
const { data: profile, error } = await supabase
  .from("profiles")
  .select("org_id, role")
  .eq("id", user.id)
  .single();

if (!profile?.org_id) {
  console.error("❌ Användare saknar org_id!");
  // Kör healing function
  await supabase.rpc("heal_user_missing_org", { user_id: user.id });
}
```

---

## 🔬 DJUPARE DIAGNOSTIK

### Testa RLS Policies manuellt

Kör detta för att se exakt vad RLS kollar:

```sql
-- Simulera INSERT som aktuell användare
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "DIN_USER_ID_HÄR"}';

-- Försök insert
INSERT INTO grooming_prices (
  org_id,
  service_name,
  service_type,
  price,
  duration_minutes
) VALUES (
  (SELECT org_id FROM profiles WHERE id = 'DIN_USER_ID_HÄR'),
  'Test',
  'bath',
  300,
  60
);

-- Återställ
RESET ROLE;
```

---

## 📋 CHECKLISTA - GENOMFÖR I ORDNING

### Fas 1: Diagnostik

- [ ] Kör Steg 1: Verifiera att tabellen finns
- [ ] Kör Steg 2: Lista alla RLS policies
- [ ] Kör Steg 3: Kontrollera användarprofil (org_id finns?)
- [ ] Kör Steg 4: Testa manuell INSERT

### Fas 2: Fix

- [ ] Kör LÖSNING 1 SQL (fixa RLS policies)
- [ ] Lägg till debug-logging i kod (LÖSNING 2)
- [ ] Verifiera att AuthContext returnerar org_id (LÖSNING 3)

### Fas 3: Verifiering

- [ ] Logga in i DogPlanner UI
- [ ] Öppna Console (F12) för att se logs
- [ ] Gå till Admin → Hundfrisör → Priser
- [ ] Klicka "Lägg till pris"
- [ ] Fyll i formulär och klicka "Spara"
- [ ] Kolla Console för debug-logs
- [ ] Verifiera att priset läggs till

---

## 🎯 VANLIGA ORSAKER OCH LÖSNINGAR

| Symptom                       | Orsak                               | Lösning                                    |
| ----------------------------- | ----------------------------------- | ------------------------------------------ |
| "new row violates RLS policy" | RLS policy med FOR ALL är för bred  | Kör LÖSNING 1 (separata policies)          |
| currentOrgId är undefined     | AuthContext laddar inte org_id      | Kontrollera AuthContext + healing function |
| Priset sparas men visas inte  | RLS SELECT policy blockerar läsning | Kör LÖSNING 1 (fixa SELECT policy)         |
| Fel: "column does not exist"  | Schema är inte synkat               | Kör `20251125_create_grooming_prices.sql`  |

---

## 🚨 OM INGET FUNGERAR

### Nödfallslösning: Stäng av RLS temporärt (ENDAST FÖR DEBUGGING!)

```sql
-- ⚠️ VARNING: GÖR DETTA ENDAST I DEV-MILJÖ!
ALTER TABLE public.grooming_prices DISABLE ROW LEVEL SECURITY;

-- Testa om INSERT fungerar nu
-- Om JA: Problemet är RLS policies
-- Om NEJ: Problemet är något annat (schema, kod, etc.)

-- ÅTERAKTIVERA DIREKT EFTERÅT:
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;
```

---

## 📞 SUPPORT

Om problemet kvarstår efter att ha följt denna guide:

1. Kör alla diagnostikqueries och spara resultaten
2. Ta skärmdumpar av Console errors (F12)
3. Kontrollera Supabase Dashboard → Table Editor → grooming_prices
4. Verifiera att FIX_GROOMING_PRICES_RLS.sql har körts

**Vanligaste lösningen:** Kör LÖSNING 1 SQL-scriptet i Supabase SQL Editor.

---

## ✅ BEKRÄFTELSE

Efter fix, verifiera att:

```sql
-- 1. RLS är aktivt
SELECT relrowsecurity FROM pg_class WHERE relname = 'grooming_prices';
-- Förväntat: true

-- 2. Fyra policies finns
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'grooming_prices';
-- Förväntat: 4

-- 3. INSERT fungerar
INSERT INTO grooming_prices (org_id, service_name, service_type, price, duration_minutes)
SELECT org_id, 'Test Badning', 'bath', 300, 60
FROM profiles WHERE id = auth.uid();
-- Förväntat: 1 rad inserted

-- 4. Rensa test-data
DELETE FROM grooming_prices WHERE service_name = 'Test Badning';
```

**Om alla 4 steg fungerar:** ✅ Problemet är löst!
