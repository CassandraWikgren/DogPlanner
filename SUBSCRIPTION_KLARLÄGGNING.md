# ✅ SUBSCRIPTION-TABELLER KLARLAGT

## 🎯 SLUTSATS: Båda tabeller används med OLIKA SYFTEN

### `org_subscriptions` (Organisation-nivå) 🏢

**Syfte:** Organisationens betalplan (Saas-abonnemang)

**Används av:**

- ✅ `handle_new_user()` trigger — skapar 3-månaders trial vid registrering
- ✅ `/api/subscription/status` — läser org-status
- ✅ `/api/onboarding/auto` — fallback om trigger misslyckas

**Kolumner:**

```sql
org_id UUID           -- Vilken organisation
status TEXT           -- trialing/active/cancelled
trial_ends_at TIMESTAMP
is_active BOOLEAN
created_at TIMESTAMP
```

**Användningsfall:**

- Avgör om organisation får använda systemet
- Trial-period (3 månader)
- Betalstatus för hela organisationen

---

### `subscriptions` (Hund-nivå) 🐕

**Syfte:** Hundspecifika abonnemang (dagis/pensionat)

**Används av:**

- ✅ `/api/subscription/webhook` — Stripe webhooks
- ✅ `/api/subscription/cancel` — avboka hundabonnemang
- ✅ `/api/subscription/upgrade` — uppgradera hundabonnemang
- ✅ `/api/subscription/reactivate` — återaktivera hundabonnemang
- ✅ `/admin/abonnemang` — admin-vy för hundabonnemang

**Kolumner (förmodade):**

```sql
id UUID
org_id UUID
dog_id UUID (troligen)
plan TEXT             -- standard/premium/etc
status TEXT           -- active/cancelled
created_at TIMESTAMP
```

**Användningsfall:**

- Månadsabonnemang för enskilda hundar
- Stripe-integration för betalningar
- Olika planer per hund (standard/premium)

---

## 📊 ARKITEKTUR

```
Organisation (org_subscriptions)
  ├─ status: "trialing" / "active" / "cancelled"
  ├─ trial_ends_at: 2025-02-22
  │
  └─ Dogs (subscriptions)
       ├─ Bella: plan="standard", status="active"
       ├─ Max: plan="premium", status="cancelled"
       └─ Luna: plan="standard", status="active"
```

**Två olika abonnemangsnivåer:**

1. **Organisation** → Får använda systemet (org_subscriptions)
2. **Hund** → Har dagis/pensionat-abonnemang (subscriptions)

---

## ✅ INGEN FIX BEHÖVS

Detta är **KORREKT DESIGN** med två separata concerns:

- `org_subscriptions` = SaaS billing (kan organisationen logga in?)
- `subscriptions` = Produkt billing (har hunden ett abonnemang?)

**Analogi:**

- `org_subscriptions` = Netflix-konto (kan du logga in?)
- `subscriptions` = Netflix-profiler (vilka har tillgång?)

---

## 📋 REKOMMENDATIONER

### 1. Förtydliga namnen (valfritt)

Överväg omdöpning för tydlighet:

```sql
org_subscriptions → org_saas_subscriptions
subscriptions → dog_service_subscriptions
```

### 2. Dokumentera i kommentarer

Lägg till i migration-fil:

```sql
COMMENT ON TABLE org_subscriptions IS
'Organisation-nivå SaaS abonnemang. Avgör om organisationen får använda systemet.';

COMMENT ON TABLE subscriptions IS
'Hund-nivå service abonnemang. Månadsabonnemang för dagis/pensionat per hund.';
```

### 3. Lägg till foreign key (om inte finns)

```sql
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_dog
FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;
```

---

## 🔧 VERIFIERINGSFRÅGOR (kör i Supabase)

```sql
-- 1. Hur många org-subscriptions finns?
SELECT status, COUNT(*)
FROM org_subscriptions
GROUP BY status;

-- 2. Hur många dog-subscriptions finns?
SELECT plan, status, COUNT(*)
FROM subscriptions
GROUP BY plan, status;

-- 3. Finns det hundar med abonnemang men vars org är cancelled?
SELECT
  s.*,
  o.status as org_status
FROM subscriptions s
JOIN dogs d ON d.id = s.dog_id
JOIN org_subscriptions o ON o.org_id = d.org_id
WHERE s.status = 'active'
  AND o.status = 'cancelled';
```

---

## 🎯 SLUTSATS

**Status:** ✅ INGA PROBLEM  
**Åtgärd:** Ingen fix behövs - detta är korrekt design  
**Dokumentation:** Lägg till kommentarer för framtida utvecklare

**Uppdaterad bedömning:**

- Tidigare: 🔴 KRITISK - subscription-förvirring
- Nu: 🟢 OK - Två olika tabeller med olika syften

---

**Skapat:** 2025-11-22  
**Källa:** Kodanalys av `app/api/subscription/*` och `app/admin/abonnemang/`
