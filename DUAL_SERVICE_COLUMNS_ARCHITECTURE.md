# Dubbel-Kolumn Arkitektur: service_types vs enabled_services

**Skapad:** 30 november 2025  
**Syfte:** Förklara varför DogPlanner använder BÅDA kolumnerna och hur de skiljer sig åt

---

## 🎯 Översikt

DogPlanner-systemet använder **två separata kolumner** för tjänstehantering i `orgs`-tabellen:

1. **`enabled_services`** - Vilka funktioner organisationen har åtkomst till i plattformen
2. **`service_types`** - Vilka tjänster organisationen erbjuder publikt till kunder

Dessa kolumner har **olika syften** och måste **synkroniseras** men inte nödvändigtvis vara identiska.

---

## 📊 Kolumnernas Syfte

### 1️⃣ `enabled_services` (Plattformstillgång)

**Typ:** `TEXT[]`  
**Värden:** `['daycare', 'boarding', 'grooming']`  
**Syfte:** Styr vilka **funktioner/moduler** som visas i organisationens admin-gränssnitt

**Används av:**

- ✅ `useEnabledServices()` hook
- ✅ `ServiceGuard` komponenter (alla 3 varianter)
- ✅ Dashboard smart routing
- ✅ Navbar conditional links
- ✅ Dashboard widgets
- ✅ Admin tjänster-sida

**Logik:**

```typescript
if (hasDaycare) {
  // Visa Hunddagis-menyn och funktioner
}
if (hasBoarding) {
  // Visa Hundpensionat-menyn och funktioner
}
if (hasGrooming) {
  // Visa Hundfrisör-menyn och funktioner
}
```

**Exempel:**

- Ett företag med `enabled_services = ['grooming']` ser ENDAST frisörfunktioner
- Ett företag med `enabled_services = ['daycare', 'boarding']` ser dagis + pensionat

---

### 2️⃣ `service_types` (Publik Synlighet)

**Typ:** `TEXT[]`  
**Värden:** `['hunddagis', 'hundpensionat', 'hundfrisor']`  
**Syfte:** Styr vilka tjänster organisationen **erbjuder PUBLIKT** till kunder som bokar

**Används av:**

- ✅ `OrganisationSelector.tsx` - Kunder väljer företag baserat på vilken tjänst de behöver
- ✅ Location-baserad filtrering (län + kommun)
- ✅ Publik företagslista på bokningssidor

**Logik:**

```typescript
// Kund söker efter hundfrisör i sitt län
await supabase
  .from("orgs")
  .select("*")
  .eq("is_visible_to_customers", true)
  .contains("service_types", ["hundfrisor"])
  .eq("lan", "Stockholm");
```

**Exempel:**

- Ett företag med `service_types = ['hundfrisor']` syns ENDAST i frisör-sökningen
- Ett företag med `service_types = ['hunddagis', 'hundpensionat']` syns i dagis + pensionat

---

## 🔄 Mappning Mellan Kolumnerna

Eftersom kolumnerna använder **olika namnkonventioner**, mappas de enligt:

| enabled_services | →   | service_types   |
| ---------------- | --- | --------------- |
| `daycare`        | →   | `hunddagis`     |
| `boarding`       | →   | `hundpensionat` |
| `grooming`       | →   | `hundfrisor`    |

**Varför olika namn?**

- `enabled_services` = Internationellt/API-vänligt format
- `service_types` = Svensk/användarvänligt format (äldre kolumn)

---

## 🛠️ Implementering: Synkronisering

### ✅ 1. Database Trigger (`handle_new_user()`)

```sql
-- FIX_TRIGGER_BOTH_COLUMNS.sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_enabled_services text[];
  v_service_types text[];
BEGIN
  -- Läs enabled_services från user_metadata
  IF NEW.raw_user_meta_data ? 'enabled_services' THEN
    v_enabled_services := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'enabled_services')
    );
    -- Mappa till service_types
    v_service_types := v_enabled_services; -- (mappning sker)
  END IF;

  -- Skapa org med BÅDA kolumnerna
  INSERT INTO orgs (
    name, enabled_services, service_types, ...
  ) VALUES (
    v_org_name, v_enabled_services, v_service_types, ...
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ✅ 2. Onboarding API

```typescript
// app/api/onboarding/auto/route.ts
const enabledServices = user.user_metadata?.enabled_services || ['daycare', 'boarding', 'grooming'];

const serviceTypesMap: Record<string, string> = {
  daycare: "hunddagis",
  boarding: "hundpensionat",
  grooming: "hundfrisor",
};
const serviceTypes = enabledServices.map((s: string) => serviceTypesMap[s] || s);

await supabase
  .from("orgs")
  .insert([{
    enabled_services: enabledServices,  // ✅ Plattformstillgång
    service_types: serviceTypes,        // ✅ Publik synlighet
    ...
  }]);
```

### ✅ 3. Admin Tjänster-sida

```typescript
// app/admin/tjanster/page.tsx
const handleSave = async () => {
  const serviceTypesMap: Record<string, string> = {
    daycare: "hunddagis",
    boarding: "hundpensionat",
    grooming: "hundfrisor",
  };
  const serviceTypes = selectedServices.map((s) => serviceTypesMap[s] || s);

  await supabase
    .from("orgs")
    .update({
      enabled_services: selectedServices, // ✅ Uppdatera plattformstillgång
      service_types: serviceTypes, // ✅ Uppdatera publik synlighet
    })
    .eq("id", currentOrgId);
};
```

---

## 🎨 Användningsfall

### Scenario 1: Enbart Frisör-företag

```
enabled_services = ['grooming']
service_types = ['hundfrisor']

Resultat:
✅ Ser endast Frisör-menyn i admin
✅ Syns endast i frisör-sökningen för kunder
✅ Dashboard auto-redirectar till /hundfrisor
```

### Scenario 2: Dagis + Pensionat (utan frisör)

```
enabled_services = ['daycare', 'boarding']
service_types = ['hunddagis', 'hundpensionat']

Resultat:
✅ Ser Dagis + Pensionat-menyer
✅ Syns i dagis- och pensionat-sökningen
✅ Dashboard visar kort för båda tjänsterna
```

### Scenario 3: Fullservice (alla tjänster)

```
enabled_services = ['daycare', 'boarding', 'grooming']
service_types = ['hunddagis', 'hundpensionat', 'hundfrisor']

Resultat:
✅ Ser alla menyer
✅ Syns i alla sökningar
✅ Dashboard visar alla tjänstekort
✅ 799 kr/mån pris (paketerbjudande)
```

---

## ⚠️ Viktiga Regler

### DO ✅

1. **Synkronisera alltid BÅDA kolumnerna** när du uppdaterar tjänster
2. Använd mappningen `daycare → hunddagis` etc
3. Läs `enabled_services` för UI-logik (ServiceGuard, useEnabledServices)
4. Läs `service_types` för publik sökning (OrganisationSelector)
5. Testa att BÅDA flödena fungerar:
   - Registrering → trigger → båda kolumnerna satta
   - Admin ändrar tjänster → båda kolumnerna uppdateras

### DON'T ❌

1. ❌ Uppdatera endast EN kolumn (bryter synkronisering)
2. ❌ Blanda namnkonventioner (`daycare` i `service_types`)
3. ❌ Ta bort en kolumn (båda behövs!)
4. ❌ Glöm mappningen när du sparar från frontend

---

## 🧪 Testscenarier

### Test 1: Ny Registrering

```
1. Gå till /register
2. Välj endast "Frisör" (299 kr/mån)
3. Registrera konto
4. ✅ Verifiera i Supabase:
   - enabled_services = ['grooming']
   - service_types = ['hundfrisor']
5. ✅ Verifiera i UI:
   - Dashboard redirectar till /hundfrisor
   - Navbar visar endast Frisör-länk
```

### Test 2: Ändra Tjänster i Admin

```
1. Logga in som org med ['grooming']
2. Gå till Admin → Tjänster
3. Lägg till "Dagis" och "Pensionat"
4. Spara
5. ✅ Verifiera i Supabase:
   - enabled_services = ['daycare', 'boarding', 'grooming']
   - service_types = ['hunddagis', 'hundpensionat', 'hundfrisor']
6. ✅ Verifiera i UI:
   - Navbar visar alla tre länkar
   - Dashboard visar alla tjänstekort
```

### Test 3: Kund Söker Frisör

```
1. Gå till ny bokning (hundfrisör)
2. Välj län och kommun
3. ✅ Verifiera:
   - Endast företag med 'hundfrisor' i service_types visas
   - Företag med endast ['daycare', 'boarding'] visas INTE
```

---

## 📁 Berörda Filer

### Database Layer

- ✅ `supabase/migrations/ADD_ENABLED_SERVICES.sql` - Lägger till kolumn
- ✅ `supabase/migrations/FIX_TRIGGER_BOTH_COLUMNS.sql` - **NYA TRIGGERN** (uppdaterar båda)
- ⚠️ `supabase/migrations/20251120_permanent_fix_org_assignment.sql` - Gammal (behöver ersättas)

### Backend Layer

- ✅ `app/api/onboarding/auto/route.ts` - Fallback onboarding
- ✅ `lib/hooks/useEnabledServices.ts` - Hook för enabled_services

### Frontend Layer

- ✅ `app/register/page.tsx` - Skickar enabled_services
- ✅ `app/admin/tjanster/page.tsx` - Uppdaterar båda kolumnerna
- ✅ `components/OrganisationSelector.tsx` - Läser service_types
- ✅ `components/ServiceGuard.tsx` - Använder enabled_services
- ✅ `components/Navbar.tsx` - Använder enabled_services
- ✅ `components/DashboardWidgets.tsx` - Använder enabled_services
- ✅ `app/dashboard/page.tsx` - Använder enabled_services

---

## 🚀 Migration Plan

Om du startar från scratch:

```sql
-- 1. Kör denna SQL-fil FÖRST (om inte redan gjord)
-- supabase/migrations/ADD_ENABLED_SERVICES.sql

-- 2. Kör denna SQL-fil för att fixa triggern
-- supabase/migrations/FIX_TRIGGER_BOTH_COLUMNS.sql

-- 3. Verifiera att båda kolumnerna finns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orgs'
AND column_name IN ('enabled_services', 'service_types');

-- 4. Uppdatera existerande orgs (om needed):
UPDATE orgs
SET enabled_services = CASE
  WHEN 'hundfrisor' = ANY(service_types) AND array_length(service_types, 1) = 1
    THEN ARRAY['grooming']
  WHEN 'hunddagis' = ANY(service_types) AND array_length(service_types, 1) = 1
    THEN ARRAY['daycare']
  WHEN 'hundpensionat' = ANY(service_types) AND array_length(service_types, 1) = 1
    THEN ARRAY['boarding']
  ELSE ARRAY['daycare', 'boarding', 'grooming']
END
WHERE enabled_services IS NULL;
```

---

## 📞 Support

Om du ser följande fel betyder det att synkroniseringen saknas:

❌ **"Företaget syns inte i kundsökningen"** → `service_types` är NULL eller fel  
❌ **"Menyer visas inte i admin"** → `enabled_services` är NULL eller fel  
❌ **"Infinite loading spinner"** → Båda kolumnerna saknas (se `currentOrgId` check i `AuthContext`)

**Lösning:** Kör `FIX_TRIGGER_BOTH_COLUMNS.sql` och verifiera att ALLA tre ställen (trigger, API, admin-sida) uppdaterar BÅDA kolumnerna.

---

## ✅ Sammanfattning

| Aspekt            | enabled_services                        | service_types                                  |
| ----------------- | --------------------------------------- | ---------------------------------------------- |
| **Syfte**         | Plattformstillgång                      | Publik synlighet                               |
| **Format**        | `['daycare', 'boarding', 'grooming']`   | `['hunddagis', 'hundpensionat', 'hundfrisor']` |
| **Används för**   | Admin UI, menyer, routing               | Kundsökning, location-filter                   |
| **Läses av**      | useEnabledServices, ServiceGuard        | OrganisationSelector                           |
| **Uppdateras av** | Trigger, API, Admin-sida                | Samma (synkroniserat!)                         |
| **Måste synkas**  | ✅ JA - alltid uppdatera båda samtidigt | ✅ JA - alltid uppdatera båda samtidigt        |

**NYCKELREGEL:** Varje gång du ändrar tjänster, uppdatera **BÅDA** kolumnerna med korrekt mappning!
