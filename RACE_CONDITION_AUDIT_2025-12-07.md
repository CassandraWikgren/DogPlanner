# Race Condition & Duplicate Prevention Audit

**Datum:** 7 december 2025  
**Syfte:** Identifiera potentiella buggar som kan orsaka dubbletter eller data-korruption

---

## 🔴 KRITISK PRIORITET (Måste fixas)

### 1. `/api/onboarding/complete/route.ts`

**Problem:** Skapar organisation utan dupliceringskontroll
**Risk:** Om endpoint anropas två gånger snabbt skapas två organisationer
**Åtgärd:**

```typescript
// Lägg till FÖRE insert
const { data: existingOrg } = await supabase
  .from("orgs")
  .select("id")
  .eq("email", userData.user.email)
  .maybeSingle();

if (existingOrg) {
  // Använd befintlig org istället för att skapa ny
}
```

### 2. `CreateAccountOffer.tsx` (rad 87-120)

**Problem:** Skapar ägare + hund utan att kontrollera om de redan finns
**Risk:** Dubbelklick → två ägare/hundar skapas
**Nuvarande skydd:** `setCreating(true)` + `disabled={creating}` ✅
**Saknas:** Server-side dupliceringskontroll
**Åtgärd:**

- Lägg till `ON CONFLICT` på owners.id
- Lägg till check om ägare med samma email redan finns

### 3. `AssistedRegistrationModal.tsx` (rad 81, 180)

**Problem:** Personal kan registrera samma kund flera gånger
**Risk:** Dubbla ägare med samma email/telefon
**Nuvarande skydd:** `setLoading(true)` ✅
**Saknas:** Unik constraint på email inom samma org
**Åtgärd:**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS owners_email_org_unique
ON owners (email, org_id)
WHERE email IS NOT NULL;
```

### 4. `InterestApplicationModal.tsx` (rad 161, 188)

**Problem:** Godkännande av ansökan skapar ägare + hund utan check
**Risk:** Om modal öppnas två gånger snabbt → dubbletter
**Nuvarande skydd:** `window.confirm()` dialog
**Saknas:** Kontroll om ansökan redan är godkänd
**Åtgärd:**

```typescript
// Kontrollera status FÖRE insert
const { data: currentApp } = await supabase
  .from("interest_applications")
  .select("status")
  .eq("id", application.id)
  .single();

if (currentApp?.status === "accepted") {
  alert("Denna ansökan är redan godkänd");
  return;
}
```

---

## 🟡 MEDIUM PRIORITET (Bör fixas)

### 5. `/app/owners/page.tsx` (rad 267)

**Problem:** Ny ägare skapas utan email-uniqueness check
**Risk:** Flera ägare med samma email i samma org
**Nuvarande skydd:** Validerar att namn finns
**Åtgärd:** Lägg till check för befintlig ägare med samma email

### 6. `/app/kundportal/registrera/page.tsx` (rad 273, 328)

**Problem:** Registration flow skapar ägare + hundar
**Risk:** Om browser crashar mitt i processen - orphan data
**Nuvarande skydd:** `setLoading(true)` + `disabled={loading}`
**Bra:** Rensar upp auth-användare vid fel ✅
**Saknas:** Transaction för atomär operation

### 7. `EditDogModal.tsx` (rad 711, 843, 890)

**Problem:** Skapar ägare/hundar/subscriptions i flera steg
**Risk:** Partiell data om något steg misslyckas
**Nuvarande skydd:** Felhantering finns
**Saknas:** Rollback-logik

### 8. `EditOwnerModal.tsx` (rad 68)

**Problem:** Insert utan check för existerande
**Risk:** Dubbla ägare om modal öppnas två gånger
**Nuvarande skydd:** Använder conditionally `.insert()` eller `.update()`
**Åtgärd:** Använd `.upsert()` med `onConflict: 'id'`

---

## 🟢 LÅG PRIORITET (Acceptabel risk)

### 9. Bokningar (`frisor/ny-bokning`, `hundpensionat/nybokning`)

**Problem:** Dubbla bokningar vid snabba klick
**Risk:** Låg - datumet gör varje bokning unik
**Nuvarande skydd:** `disabled={submitting}` ✅
**Status:** OK för nu

### 10. Prissättning (`admin/priser/pensionat`)

**Problem:** Dubbla prisrader
**Risk:** Låg - endast admin-access
**Status:** OK för nu

### 11. Rum (`admin/rum/page.tsx`)

**Problem:** Dubbla rum
**Risk:** Låg - synligt i UI omedelbart
**Status:** OK för nu

---

## 📋 REKOMMENDERADE DATABASÄNDRINGAR

```sql
-- 1. Unik constraint på owners.email per org (förhindrar dubbla kunder)
CREATE UNIQUE INDEX IF NOT EXISTS owners_email_org_unique
ON owners (lower(email), org_id)
WHERE email IS NOT NULL;

-- 2. Unik constraint på orgs.email (förhindrar dubbla organisationer)
CREATE UNIQUE INDEX IF NOT EXISTS orgs_email_unique
ON orgs (lower(email))
WHERE email IS NOT NULL;

-- 3. Unik constraint på dogs per ägare+namn (förhindrar dubbla hundar)
CREATE UNIQUE INDEX IF NOT EXISTS dogs_owner_name_unique
ON dogs (owner_id, lower(name));

-- 4. Unik constraint på interest_applications (förhindrar dubbla ansökningar)
CREATE UNIQUE INDEX IF NOT EXISTS applications_email_org_unique
ON interest_applications (lower(email), org_id);
```

---

## 📋 REKOMMENDERADE KODÄNDRINGAR

### Prioritet 1: Fixa `/api/onboarding/complete`

Se separat fix-fil.

### Prioritet 2: Lägg till `disabled` på alla submit-knappar

Mönster att följa:

```tsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  if (submitting) return; // Guard clause
  setSubmitting(true);
  try {
    // ... logic
  } finally {
    setSubmitting(false);
  }
};

<button disabled={submitting}>{submitting ? "Sparar..." : "Spara"}</button>;
```

### Prioritet 3: Server-side duplicate checks

Före varje INSERT, kolla om data redan finns:

```typescript
const { data: existing } = await supabase
  .from("table")
  .select("id")
  .eq("unique_field", value)
  .maybeSingle();

if (existing) {
  // Returnera befintlig eller visa fel
}
```

---

## ✅ REDAN FIXAT

1. ✅ `/api/onboarding/auto/route.ts` - Dupliceringsskydd tillagt (7 dec 2025)
2. ✅ `handle_new_user()` trigger - EXISTS-check tillagd (7 dec 2025)

---

## NÄSTA STEG

1. [ ] Kör SQL-constraints ovan i Supabase (efter att ta bort eventuella dubbletter)
2. [ ] Fixa `/api/onboarding/complete`
3. [ ] Granska och uppdatera `InterestApplicationModal.tsx`
4. [ ] Lägg till submit-guards i alla formulär som saknar dem
