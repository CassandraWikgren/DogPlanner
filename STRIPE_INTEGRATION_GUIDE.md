# 💳 Stripe Integration Guide - DogPlanner

**Skapad:** 30 november 2025  
**Syfte:** Komplett guide för att sätta upp Stripe-betalningar för modulära tjänster

---

## 🎯 Översikt

DogPlanner använder Stripe för att hantera abonnemangsbetalningar baserat på vilka tjänster företaget aktiverar:

| Tjänster             | Pris/mån | Stripe Product  |
| -------------------- | -------- | --------------- |
| **Endast Frisör**    | 299 kr   | `grooming_only` |
| **Endast Dagis**     | 399 kr   | `daycare_only`  |
| **Endast Pensionat** | 399 kr   | `boarding_only` |
| **2 tjänster**       | 599 kr   | `two_services`  |
| **Alla 3 tjänster**  | 799 kr   | `all_services`  |

---

## 📋 Steg 1: Skapa Produkter i Stripe Dashboard

### 1.1 Logga in på Stripe

1. Gå till [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Välj rätt konto (test/live)

### 1.2 Skapa Produkt: Hundfrisör (299 kr)

1. **Products** → **Add product**
2. **Name:** `DogPlanner - Hundfrisör`
3. **Description:** `Bokningssystem för hundfrisörer med prishantering, kundregister och fakturering`
4. **Pricing:**
   - **Pricing model:** Recurring
   - **Price:** `299 SEK`
   - **Billing period:** Monthly
   - **Price description:** `Per månad`
5. **Click:** Save product
6. **Kopiera Price ID:** `price_xxxxxxxxxxxxx` → Spara som `STRIPE_PRICE_ID_GROOMING`

### 1.3 Skapa Produkt: Hunddagis (399 kr)

1. **Products** → **Add product**
2. **Name:** `DogPlanner - Hunddagis`
3. **Description:** `Dagisverksamhet med närvaroregistrering, kapacitetshantering och abonnemangsfakturering`
4. **Pricing:**
   - **Pricing model:** Recurring
   - **Price:** `399 SEK`
   - **Billing period:** Monthly
5. **Click:** Save product
6. **Kopiera Price ID:** `price_xxxxxxxxxxxxx` → Spara som `STRIPE_PRICE_ID_DAYCARE`

### 1.4 Skapa Produkt: Hundpensionat (399 kr)

1. **Products** → **Add product**
2. **Name:** `DogPlanner - Hundpensionat`
3. **Description:** `Pensionatbokning med rumshantering, säsongspriser och tillvalstjänster`
4. **Pricing:**
   - **Pricing model:** Recurring
   - **Price:** `399 SEK`
   - **Billing period:** Monthly
5. **Click:** Save product
6. **Kopiera Price ID:** `price_xxxxxxxxxxxxx` → Spara som `STRIPE_PRICE_ID_BOARDING`

### 1.5 Skapa Produkt: 2 Tjänster Paket (599 kr)

1. **Products** → **Add product**
2. **Name:** `DogPlanner - 2 Tjänster`
3. **Description:** `Paket med 2 valfria tjänster (Dagis + Pensionat, Dagis + Frisör, eller Pensionat + Frisör)`
4. **Pricing:**
   - **Pricing model:** Recurring
   - **Price:** `599 SEK`
   - **Billing period:** Monthly
5. **Click:** Save product
6. **Kopiera Price ID:** `price_xxxxxxxxxxxxx` → Spara som `STRIPE_PRICE_ID_TWO_SERVICES`

### 1.6 Skapa Produkt: Alla 3 Tjänster (799 kr)

1. **Products** → **Add product**
2. **Name:** `DogPlanner - Fullservice (Alla 3 tjänster)`
3. **Description:** `Komplett paket med Hunddagis, Hundpensionat och Hundfrisör - allt inkluderat`
4. **Pricing:**
   - **Pricing model:** Recurring
   - **Price:** `799 SEK`
   - **Billing period:** Monthly
5. **Click:** Save product
6. **Kopiera Price ID:** `price_xxxxxxxxxxxxx` → Spara som `STRIPE_PRICE_ID_ALL_SERVICES`

---

## 🔧 Steg 2: Konfigurera Miljövariabler

### 2.1 Lokalt (.env.local)

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs (Test Mode)
STRIPE_PRICE_ID_GROOMING=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_DAYCARE=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BOARDING=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TWO_SERVICES=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_ALL_SERVICES=price_xxxxxxxxxxxxx

# Webhook Secret (från Stripe Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Vercel (Production)

1. Gå till [vercel.com](https://vercel.com) → Ditt projekt
2. **Settings** → **Environment Variables**
3. Lägg till SAMMA variabler som ovan men med **LIVE** keys:
   - `STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx`
   - Etc.

---

## 🔗 Steg 3: Konfigurera Webhooks

Stripe webhooks behövs för att synkronisera betalningsstatus med databasen.

### 3.1 Skapa Webhook Endpoint

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **Endpoint URL:** `https://din-domän.se/api/subscription/webhook`
4. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. **Click:** Add endpoint
6. **Kopiera Signing secret:** `whsec_xxxxxxxxxxxxxxxxxxxxx`
7. **Lägg till i miljövariabler:** `STRIPE_WEBHOOK_SECRET`

### 3.2 Testa Webhook Lokalt (med Stripe CLI)

```bash
# Installera Stripe CLI
brew install stripe/stripe-brew/stripe

# Logga in
stripe login

# Lyssna på webhooks
stripe listen --forward-to localhost:3000/api/subscription/webhook

# Testa event
stripe trigger checkout.session.completed
```

---

## 💻 Steg 4: Uppdatera Backend API

### 4.1 Checkout API (app/api/subscription/checkout/route.ts)

Filen `route_new.ts` innehåller den uppdaterade versionen. Byt ut gamla filen:

```bash
mv app/api/subscription/checkout/route.ts app/api/subscription/checkout/route_old.ts
mv app/api/subscription/checkout/route_new.ts app/api/subscription/checkout/route.ts
```

**Vad den gör:**

- Tar emot `services` array från frontend
- Mappar till rätt Stripe Price ID baserat på antal tjänster
- Sparar `enabled_services` i session metadata
- Redirectar till Stripe Checkout

### 4.2 Webhook API (app/api/subscription/webhook/route.ts)

Uppdatera för att hantera metadata:

```typescript
// Läs metadata från session
const enabledServices = JSON.parse(session.metadata?.enabled_services || "[]");

// Uppdatera orgs-tabellen
await supabase
  .from("orgs")
  .update({
    enabled_services: enabledServices,
    service_types: mapToServiceTypes(enabledServices),
  })
  .eq("id", orgId);

// Uppdatera subscriptions-tabellen
await supabase
  .from("subscriptions")
  .update({
    status: "active",
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
  })
  .eq("org_id", orgId);
```

---

## 🎨 Steg 5: Uppdatera Frontend (Abonnemangssidan)

### 5.1 Lägg till Stripe Checkout Knapp

I `/app/admin/abonnemang/page.tsx`:

```typescript
const handleUpgrade = async () => {
  try {
    setLoading(true);

    // Hämta session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Ingen giltig session");
    }

    // Anropa checkout API med valda tjänster
    const response = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        services: selectedServices, // ['daycare', 'boarding', 'grooming']
      }),
    });

    const data = await response.json();

    if (data.url) {
      // Redirect till Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Kunde inte skapa checkout");
    }
  } catch (err: any) {
    console.error("Checkout error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 5.2 Lägg till Knapp i UI

```tsx
<Button
  onClick={handleUpgrade}
  disabled={loading || selectedServices.length === 0}
  className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white h-10"
>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Omdirigerar till betalning...
    </>
  ) : (
    <>
      <CreditCard className="mr-2 h-4 w-4" />
      Uppgradera till Betald Plan
    </>
  )}
</Button>
```

---

## 🧪 Steg 6: Testning

### 6.1 Test Cards (Stripe Test Mode)

```
✅ Successful payment: 4242 4242 4242 4242
❌ Card declined: 4000 0000 0000 0002
⏳ Requires authentication: 4000 0025 0000 3155

CVV: Vilken 3-siffrig kod som helst
Exp: Vilket framtida datum som helst
```

### 6.2 Test Scenario 1: Enbart Frisör

1. Gå till `/admin/abonnemang`
2. Välj endast "Hundfrisör"
3. Se att priset blir **299 kr/mån**
4. Klicka "Uppgradera till Betald Plan"
5. Fyll i test-kort `4242 4242 4242 4242`
6. Verifiera i Supabase:
   - `subscriptions.status = 'active'`
   - `orgs.enabled_services = ['grooming']`
   - `orgs.service_types = ['hundfrisor']`

### 6.3 Test Scenario 2: Alla 3 Tjänster

1. Välj alla tre tjänster
2. Se att priset blir **799 kr/mån**
3. Genomför betalning
4. Verifiera:
   - `orgs.enabled_services = ['daycare', 'boarding', 'grooming']`
   - Alla menyer syns i navigation

---

## 📊 Steg 7: Övervaka i Stripe Dashboard

### 7.1 Customers

**Customers** → Se alla registrerade kunder

- Email
- Subscription status
- Metadata (org_id, enabled_services)

### 7.2 Subscriptions

**Subscriptions** → Se aktiva prenumerationer

- Which plan
- Next billing date
- MRR (Monthly Recurring Revenue)

### 7.3 Payments

**Payments** → Se alla transaktioner

- Successful payments
- Failed payments
- Refunds

### 7.4 Webhooks

**Developers** → **Webhooks** → Se alla webhook events

- Success/failure rate
- Retry attempts
- Event logs

---

## ⚠️ Viktiga Säkerhetsregler

### ✅ DO:

1. **Validera metadata** - Alltid kolla att `org_id` och `enabled_services` finns
2. **Använd HTTPS** - Endast säkra anslutningar i produktion
3. **Verifiera webhook signature** - Använd `STRIPE_WEBHOOK_SECRET`
4. **Logga fel** - Spara alla Stripe-fel i Sentry eller liknande
5. **Hantera edge cases** - Vad händer om betalning misslyckas mitt i?

### ❌ DON'T:

1. ❌ Exponera Secret Keys i frontend
2. ❌ Lita på frontend-data utan backend-validering
3. ❌ Skippa webhook signature verification
4. ❌ Glöm hantera failed payments
5. ❌ Hårdkoda price IDs (använd miljövariabler)

---

## 🔄 Steg 8: Hantera Plan-ändringar

### 8.1 Uppgradera (Fler Tjänster)

När användare lägger till tjänster:

```typescript
// 1. Skapa ny Stripe Checkout session med nya tjänster
// 2. Stripe hanterar automatisk prorata för resterande period
// 3. Webhook uppdaterar enabled_services
```

### 8.2 Nedgradera (Färre Tjänster)

```typescript
// 1. Visa varning: "Funktioner kommer försvinna vid nästa faktureringsdatum"
// 2. Schemalägg ändring till slutet av billing period
// 3. Webhook aktiveras vid period_end
```

### 8.3 Pausa Prenumeration

```typescript
// API call till Stripe:
await stripe.subscriptions.update(subscriptionId, {
  pause_collection: {
    behavior: "mark_uncollectible",
  },
});

// Uppdatera status i DB:
status = "paused";
```

---

## 📝 Sammanfattning - Implementationschecklista

### Backend:

- [x] Skapa 5 produkter i Stripe Dashboard
- [ ] Kopiera alla Price IDs till miljövariabler
- [ ] Uppdatera `checkout/route.ts` med ny logik
- [ ] Uppdatera `webhook/route.ts` för metadata
- [ ] Testa med Stripe CLI lokalt

### Frontend:

- [ ] Lägg till "Uppgradera"-knapp på abonnemangssidan
- [ ] Implementera `handleUpgrade()` funktion
- [ ] Visa loading state under redirect
- [ ] Hantera success/cancel callbacks
- [ ] Visa current subscription status

### Deployment:

- [ ] Lägg till alla miljövariabler i Vercel
- [ ] Konfigurera webhook endpoint med LIVE URL
- [ ] Testa med test cards i produktion
- [ ] Övervaka första riktiga betalningar

### Dokumentation:

- [ ] Dokumentera för support-team
- [ ] Skapa FAQ för kunder
- [ ] Setup monitoring (Sentry, Stripe Dashboard)

---

## 🆘 Troubleshooting

### Problem: "Ingen Checkout URL returneras"

**Lösning:**

1. Kolla att alla `STRIPE_PRICE_ID_*` finns i miljövariabler
2. Verifiera att Price IDs är korrekta i Stripe Dashboard
3. Kolla console logs för Stripe API-fel

### Problem: "Webhook får 401 Unauthorized"

**Lösning:**

1. Verifiera `STRIPE_WEBHOOK_SECRET` är korrekt
2. Kolla att endpoint URL är HTTPS i produktion
3. Test med `stripe listen` lokalt

### Problem: "Betalning går igenom men status uppdateras inte"

**Lösning:**

1. Kolla webhook logs i Stripe Dashboard
2. Verifiera metadata finns i session
3. Kolla Supabase logs för update-fel

---

## 🚀 Nästa Steg

Efter grundläggande Stripe-integration fungerar:

1. **Customer Portal** - Låt kunder hantera sitt kort själva
2. **Invoices** - Automatiska fakturor via email
3. **Tax Handling** - Svensk moms (25%)
4. **Refunds** - Hantera återbetalningar
5. **Analytics** - MRR, Churn rate, LTV

---

**Skapad av:** GitHub Copilot  
**Datum:** 30 november 2025  
**Status:** Redo för implementation

**Nästa steg:** Börja med Steg 1 - Skapa produkter i Stripe Dashboard! 💳
