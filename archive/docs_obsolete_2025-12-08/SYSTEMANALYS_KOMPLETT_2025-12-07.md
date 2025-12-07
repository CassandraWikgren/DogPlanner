# 🔍 KOMPLETT SYSTEMANALYS - DogPlanner (7 december 2025)

## SAMMANFATTNING

Efter djupdykning i dokumentation och kod har jag identifierat **systemets arkitektur**, **vad som fungerar**, och **potentiella krockar** som behöver åtgärdas.

### 🎯 FIXAR GJORDA I DENNA SESSION

| Problem                                            | Status   | Fil                           |
| -------------------------------------------------- | -------- | ----------------------------- |
| Dashboard visade bara Admin-kort                   | ✅ FIXAT | `app/context/AuthContext.tsx` |
| `setLoading(false)` kördes före `refreshProfile()` | ✅ FIXAT | `app/context/AuthContext.tsx` |
| `currentOrgId` var null vid render                 | ✅ FIXAT | `app/context/AuthContext.tsx` |

**Huvudfix:** Ändrade från `.then()` till `await` för att säkerställa att `currentOrgId` sätts INNAN `loading=false`.

---

## 📐 SYSTEMETS ARKITEKTUR

### Pattern 3 - Hybrid Multi-tenant

DogPlanner använder en **hybrid modell** där:

| Användartyp        | Tabell     | org_id                  | Kundnummer   | Inloggning          |
| ------------------ | ---------- | ----------------------- | ------------ | ------------------- |
| **Personal/Admin** | `profiles` | `NOT NULL` (kräver org) | -            | `/login`            |
| **Pensionatkund**  | `owners`   | `NULL` (global)         | 10001+       | `/kundportal/login` |
| **Dagiskund**      | `owners`   | Organisations-ID        | 101+ per org | Skapas av personal  |

### Viktiga tabellrelationer

```
auth.users
    ├── profiles (1:1) → org_id → orgs
    │       └── Personal ser data via org_id
    │
    └── owners (1:1 vid kundregistrering)
            ├── org_id = NULL (pensionatkund, global)
            └── org_id = <org> (dagiskund, per-org)
                    └── dogs (1:N) → owner_id
```

---

## ✅ VAD SOM FUNGERAR KORREKT

### 1. checkIfCustomer() - Logiken är RÄTT

```typescript
// AuthContext.tsx - Kollar owners FÖRST
async function checkIfCustomer(userId: string): Promise<boolean> {
  // STEG 1: Finns användaren i owners? → KUND
  const { data: ownerData } = await supabase
    .from("owners")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (ownerData) {
    setIsCustomer(true);
    setCurrentOrgId(null); // ✅ Kunder har INTE org_id
    return true;
  }

  // STEG 2: Finns org_id i profiles? → PERSONAL
  const { data: profileData } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileData?.org_id) {
    setIsCustomer(false);
    return false;
  }

  return false;
}
```

**KORREKT BETEENDE:**

- ✅ Kund i owners → `isCustomer=true`, `currentOrgId=null`
- ✅ Personal med profiles.org_id → `isCustomer=false`, kör refreshProfile()

### 2. RLS Policies - Pattern 3 stöds

```sql
-- owners: Kund ser sig själv, personal ser sin org
"owners_select_self_and_org" USING (
  id = auth.uid() OR
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
)

-- dogs: Samma princip
"dogs_select_owner_and_org" USING (
  owner_id = auth.uid() OR
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
)
```

### 3. Kundportal-login - Verifierar owners

```typescript
// /kundportal/login/page.tsx
const { data: ownerData } = await supabase.rpc("verify_customer_account", {
  p_user_id: data.user.id,
});

if (!ownerData) {
  await supabase.auth.signOut();
  throw new Error("Inget kundkonto hittades");
}
```

### 4. Personal-login - Direkt till dashboard

```typescript
// /login/page.tsx
if (data?.user) {
  router.push("/dashboard"); // AuthContext hanterar org_id via refreshProfile()
}
```

---

## ⚠️ IDENTIFIERADE KROCKAR OCH PROBLEM

### PROBLEM 1: Inkonsekvent kolumnnamn i dokumentation vs databas

| Dokumentation säger | Databas har        | Status                      |
| ------------------- | ------------------ | --------------------------- |
| `service_types`     | `enabled_services` | 🟡 BÅDA finns, inkonsekvent |
| `owners_id`         | `owner_id`         | ✅ Rätt (singular)          |
| `quantity`          | `qty`              | ✅ Rätt                     |

**enabled_services vs service_types:**

- `enabled_services`: `['daycare', 'boarding', 'grooming']` (engelska, används av kod)
- `service_types`: `['hunddagis', 'hundpensionat', 'hundfrisor']` (svenska, för UI)

**ÅTGÄRD:** Dokumentera att BÅDA behövs och synkroniseras av trigger.

---

### PROBLEM 2: checkIfCustomer körs FÖRE refreshProfile

**Flödet i AuthContext.tsx:**

```typescript
// 1. checkIfCustomer(userId) körs
const customerCheckResult = await checkIfCustomer(u.id);

// 2. OM kund → return tidigt (hoppar över refreshProfile)
if (customerCheckResult) {
  console.log("User is customer, skipping refreshProfile");
  return;
}

// 3. OM personal → kör refreshProfile
refreshProfile(u.id);
```

**POTENTIELLT PROBLEM:**

- Om en användare finns i BÅDE owners OCH profiles → klassas som KUND
- Detta kan ske om en dagiskund skapas och även får en profil

**SANNOLIKHET:** Låg, men möjlig vid manuella databasändringar.

**ÅTGÄRD:** Dokumentera att en användare ALDRIG ska finnas i BÅDA tabellerna med samma UUID.

---

### PROBLEM 3: ~~orgs.owner_id~~ - FALSKT ALARM ✅

Efter verifiering i `types/database.ts`:

- `orgs`-tabellen har INTE `owner_id` (och ska inte ha det)
- `dogs.owner_id` ✅ - Kopplar hund till ägare
- `bookings.owner_id` ✅ - Kopplar bokning till ägare

`.github/copilot-instructions.md` nämner "owner_id (NOT owners_id - singular!)" som en **allmän regel** för kolumnnamn, inte specifikt för orgs-tabellen.

**STATUS:** Inget problem.

---

### PROBLEM 4: Loading state och timing - **FIXAT! ✅**

**URSPRUNGLIGT PROBLEM:**

```typescript
// FÖRE: setLoading(false) kördes INNAN refreshProfile()
setLoading(false); // ← Problem!
...
safeAutoOnboarding(session.access_token)
  .then(() => refreshProfile(u.id))  // ← Körs EFTER loading=false
```

**SYMPTOM:**

- Dashboard renderades med `currentOrgId = null`
- `useEnabledServices` returnerade tom array
- Inga modulkort visades (endast Admin-kort)

**FIX (7 december 2025):**

```typescript
// EFTER: await alla async operationer FÖRE setLoading(false)
if (u && session?.access_token) {
  const customerCheckResult = await checkIfCustomer(u.id);

  if (customerCheckResult) {
    setLoading(false); // ✅ För kunder
    return;
  }

  // För personal: vänta på allt
  await safeAutoOnboarding(session.access_token);
  await refreshProfile(u.id); // ✅ currentOrgId sätts
  await refreshSubscription(session.access_token);
  setLoading(false); // ✅ EFTER allt är klart
}
```

**STATUS:** ✅ Fixat i `app/context/AuthContext.tsx`

---

### PROBLEM 4b: Safety timeout finns fortfarande

Safety timeout på 1.5 sekunder kvarstår som backup:

```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    console.warn("AuthContext: Loading timeout reached, forcing false");
    setLoading(false);
  }, 1500);
  return () => clearTimeout(timeout);
}, []);
```

---

### PROBLEM 5: Dagiskunder vs Pensionatkunder - Registreringsflöde

| Kundtyp       | Flöde                                         | org_id             | Skapas av    |
| ------------- | --------------------------------------------- | ------------------ | ------------ |
| Pensionatkund | `/kundportal/registrera` → väljer "Pensionat" | NULL               | Kunden själv |
| Dagiskund     | Intresseanmälan → Personal godkänner          | Organisationens ID | Personal     |

**POTENTIELL KROCK:**

- Om en pensionatkund sedan vill använda hunddagis hos SAMMA organisation, hur hanteras det?
- Dokumentationen säger att samma person kan vara kund hos flera orgs, men logiken är otydlig.

**REKOMMENDATION:** Klargör flödet för "pensionatkund blir dagiskund hos samma org".

---

## 📊 KOMPLETT FLÖDESSCHEMA

### A. Personal-inloggning (`/login`)

```
[Användare] → /login
      ↓
[Supabase Auth] → signInWithPassword()
      ↓
[AuthContext] → onAuthStateChange()
      ↓
[checkIfCustomer()] → Kolla owners-tabellen
      ↓
   ❌ Inte i owners → Fortsätt
      ↓
[refreshProfile()] → Hämta profiles.org_id
      ↓
   ✅ org_id finns → setCurrentOrgId()
      ↓
[/dashboard] → useEnabledServices() läser orgs.enabled_services
      ↓
[Visa modulkort] → Hunddagis, Pensionat, Frisör (baserat på enabled_services)
```

### B. Kundinloggning (`/kundportal/login`)

```
[Kund] → /kundportal/login
      ↓
[Supabase Auth] → signInWithPassword()
      ↓
[verify_customer_account RPC] → Kolla att user_id finns i owners
      ↓
   ✅ Finns → Fortsätt
      ↓
[AuthContext] → checkIfCustomer() → isCustomer=true
      ↓
[/kundportal/dashboard] → Kundens hundar, bokningar
```

### C. Kundregistrering (`/kundportal/registrera`)

```
[Ny kund] → /kundportal/registrera
      ↓
[Välj typ] → "Pensionat" eller "Hunddagis"
      ↓
┌─────────────────────┬────────────────────────┐
│ PENSIONAT           │ HUNDDAGIS              │
├─────────────────────┼────────────────────────┤
│ 1. Supabase signUp  │ 1. Redirect till       │
│ 2. INSERT owners    │    /kundportal/soka-   │
│    (org_id = NULL)  │    hunddagis           │
│ 3. INSERT dogs      │ 2. Skicka ansökan      │
│    (org_id = NULL)  │ 3. Personal godkänner  │
│ 4. Logga in         │ 4. Personal skapar     │
│                     │    owners + dogs med   │
│                     │    org_id              │
└─────────────────────┴────────────────────────┘
```

### D. Personal-registrering (`/register`)

```
[Ny företagsanvändare] → /register
      ↓
[Supabase signUp] → Med user_metadata:
  - org_name
  - org_number
  - enabled_services: ['daycare', 'boarding', 'grooming']
      ↓
[Trigger: handle_new_user()] →
  1. Kolla om org redan finns (duplicate check)
  2. Skapa org med enabled_services
  3. Skapa profiles med org_id + role='admin'
      ↓
[AuthContext] → refreshProfile() → currentOrgId sätts
      ↓
[/dashboard] → Alla moduler visas
```

---

## 🔧 REKOMMENDERADE ÅTGÄRDER

### PRIORITET 1: Dokumentation (Kritisk)

1. **Uppdatera DATABASE_QUICK_REFERENCE.md:**
   - Lägg till tydlig sektion om enabled_services vs service_types
   - Dokumentera att BÅDA behövs för full funktionalitet

2. **Skapa ANVÄNDARFLÖDEN.md:**
   - Dokumentera alla 4 flöden ovan med detaljerade steg
   - Inkludera felhantering och edge cases

### PRIORITET 2: Validering (Hög)

3. **Verifiera orgs-schemat:**

   ```sql
   \d orgs  -- Kolla alla kolumner
   SELECT column_name FROM information_schema.columns WHERE table_name = 'orgs';
   ```

4. **Lägg till constraint för att förhindra dubbletter:**
   ```sql
   -- En användare ska INTE finnas i BÅDE owners OCH profiles
   -- Detta är svårt att enforca på DB-nivå, men kan loggas
   ```

### PRIORITET 3: Kodförbättringar (Medium)

5. **Lägg till debug-logging i useEnabledServices:**

   ```typescript
   console.log("useEnabledServices: currentOrgId =", currentOrgId);
   console.log(
     "useEnabledServices: enabled_services =",
     data?.enabled_services
   );
   ```

6. **Förbättra felhantering i AuthContext:**
   - Logga specifika fel när checkIfCustomer misslyckas
   - Visa användarvänliga felmeddelanden

### PRIORITET 4: Framtida förbättringar (Låg)

7. **Överväg unified user-tabell:**
   - Istället för separata profiles + owners
   - En users-tabell med `user_type: 'staff' | 'customer'`
   - Mindre komplexitet, färre edge cases

---

## 📋 CHECKLISTA FÖR UTVECKLARE

### Vid nya sidor som kräver org_id:

```typescript
// ALLTID lägg till else-case för currentOrgId
const { currentOrgId } = useAuth();

useEffect(() => {
  if (currentOrgId) {
    loadData();
  } else {
    setLoading(false); // ✅ Förhindra infinite spinner
  }
}, [currentOrgId]);
```

### Vid nya tabeller:

- [ ] Lägg till `org_id` kolumn
- [ ] Skapa RLS-policy med org_id-filter
- [ ] Uppdatera DATABASE_QUICK_REFERENCE.md
- [ ] Testa med både personal och kund

### Vid ändringar i auth-flödet:

- [ ] Testa personal-login
- [ ] Testa kund-login (pensionat)
- [ ] Testa ny kund-registrering
- [ ] Testa ny företagsregistrering
- [ ] Verifiera att isCustomer sätts korrekt

---

## 📚 RELATERADE DOKUMENT

- `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` - Komplett DB-schema
- `DATABASE_QUICK_REFERENCE.md` - Snabbreferens för kolumnnamn
- `SYSTEMANALYS_KUND_PERSONAL_SEPARATION.md` - isCustomer-logik
- `PATTERN3_IMPLEMENTATION_STATUS.md` - Pattern 3 implementation
- `.github/copilot-instructions.md` - AI-instruktioner

---

_Dokumenterat: 7 december 2025_
_Författare: AI-assistent efter djupanalys av kodbas_
