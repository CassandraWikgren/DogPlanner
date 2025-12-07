# 🔒 Säkerhetsaudit 2025-12-07

## Sammanfattning

Vid en genomgång av API-routes hittades flera endpoints som saknar autentisering och kan utgöra säkerhetsrisker.

---

## 🚨 Kritiska problem

### 1. `/api/test-email` - SPAM-RISK

**Fil:** `app/api/test-email/route.ts`

**Problem:** Öppen endpoint som kan skicka emails utan autentisering. Kan missbrukas för spam.

**Risk:** Hög - En illasinnad användare kan skicka tusentals emails via systemet.

**Åtgärd (REKOMMENDERAS):**

```typescript
// Lägg till i början av POST-funktionen:
if (process.env.VERCEL && process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

Eller ännu bättre - lägg till autentisering:

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

### 2. `/api/pdf` - EXPONERAR FAKTUROR

**Fil:** `app/api/pdf/route.ts`

**Problem:** Genererar PDF-fakturor utan autentisering. Vem som helst med ett invoice-ID kan ladda ner fakturan.

**Risk:** Medium-Hög - Om invoice-ID:n läcker kan utomstående ladda ner fakturor med känslig information.

**Åtgärd:**

```typescript
// Lägg till autentisering och organisationskontroll:
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Verifiera att användaren har tillgång till fakturan
const { data: profile } = await supabase
  .from("profiles")
  .select("org_id")
  .eq("id", user.id)
  .single();

// Kontrollera att fakturan tillhör användarens organisation
const { data: invoice } = await supabase
  .from("invoices")
  .select("org_id")
  .eq("id", invoiceId)
  .single();

if (invoice?.org_id !== profile?.org_id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

### 3. `/api/consent/send-email` - KAN SKICKA GODTYCKLIGA EMAILS

**Fil:** `app/api/consent/send-email/route.ts`

**Problem:** Skickar consent-emails utan autentisering. Kan missbrukas.

**Risk:** Medium - Kräver giltiga ownerId och orgId, men kan fortfarande spamma användare.

**Åtgärd:** Lägg till autentisering (endast staff ska kunna trigga consent-emails).

---

## ⚠️ Låg risk (acceptabla)

### 4. `/api/applications/pension`

**Problem:** Öppen för ansökningar utan autentisering.

**Status:** ACCEPTABELT - Kunder ska kunna ansöka utan att vara inloggade.

**OBS:** Bör ha rate-limiting för att förhindra missbruk.

---

### 5. `/api/pension/calendar`

**Problem:** Läser kalenderdata utan autentisering.

**Status:** Kontrollera om `pension_calendar_full_view` har RLS. Om den exponerar känslig info (kundnamn, etc.) bör auth läggas till.

---

### 6. `/api/env`

**Problem:** Exponerar miljövariabler.

**Status:** OK - Är redan skyddad i produktion (`if (process.env.VERCEL)`).

---

## ✅ Korrekta implementationer

Dessa API-routes har autentisering:

- `/api/invoices/[id]/pdf` ✅
- `/api/bookings/approve` ✅
- `/api/bookings/cancel` ✅
- `/api/upload-dog-photo` ✅
- `/api/onboarding/auto` ✅
- `/api/onboarding/complete` ✅
- `/api/subscription/*` ✅
- `/api/gdpr/delete-account` ✅

---

## Rekommenderade åtgärder (prioritet)

1. ~~**KRITISK:** Inaktivera `/api/test-email` i produktion~~ ✅ FIXAT
2. ~~**HÖG:** Lägg till auth i `/api/pdf`~~ ✅ FIXAT
3. ~~**MEDIUM:** Lägg till auth i `/api/consent/send-email`~~ ✅ FIXAT
4. **LÅG:** Implementera rate-limiting på öppna endpoints

---

## Åtgärdsstatus

| Endpoint                    | Status          | Prio    | Åtgärdat                  |
| --------------------------- | --------------- | ------- | ------------------------- |
| `/api/test-email`           | � Fixad         | Kritisk | ✅ Blockerad i produktion |
| `/api/pdf`                  | � Fixad         | Hög     | ✅ Auth + org-check       |
| `/api/consent/send-email`   | � Fixad         | Medium  | ✅ Auth + org-check       |
| `/api/applications/pension` | 🟢 OK (publikt) | -       | N/A                       |
| `/api/pension/calendar`     | 🟡 Kontrollera  | Låg     | RLS på vy?                |
| `/api/env`                  | 🟢 OK           | -       | N/A                       |

---

## Genomförda fixar (2025-12-07)

### 1. `/api/test-email` ✅

- Lagt till produktionskontroll som blockerar endpoint i Vercel + production
- Returnerar 404 istället för att exponera spam-endpoint

### 2. `/api/pdf` ✅

- Lagt till `getUser()` autentiseringskontroll
- Lagt till org_id-verifiering mot fakturan
- Returnerar 401 om ej inloggad, 403 om fel organisation

### 3. `/api/consent/send-email` ✅

- Lagt till `getUser()` autentiseringskontroll
- Verifierar att användaren är staff (har org_id i profiles)
- Verifierar att orgId i request matchar användarens organisation
- Returnerar 401/403 med tydliga felmeddelanden

---

_Genererad: 2025-12-07_
