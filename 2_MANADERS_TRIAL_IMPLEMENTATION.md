# 🎁 2 Månaders Gratis Trial + Missbruksskydd

**Datum:** 30 november 2025  
**Status:** ✅ Implementerad (redo för testning)

---

## 🎯 Sammanfattning

Systemet har uppdaterats för att:

1. ✅ **Ändra gratisperiod från 3 till 2 månader** (60 dagar)
2. ✅ **Blockera missbruk** - Användare kan INTE få flera gratisperioder
3. ✅ **Spåra historik** - Permanent registrering av org-nummer och email
4. ✅ **Integrera med Stripe** - 2 månaders trial vid första betalningen

---

## 📋 Vad Har Ändrats?

### 1. Database Migration (ADD_TRIAL_ABUSE_PROTECTION.sql)

**Ny kolumn i orgs:**

```sql
has_had_subscription BOOLEAN DEFAULT false
```

**Nya tabeller:**

```sql
-- Spåra email + org-nummer kombinationer
org_email_history (org_number, email, created_at)

-- Spåra alla org-nummer som haft prenumeration
org_number_subscription_history (org_number, has_had_subscription, first_subscription_at)
```

**Nya funktioner:**

```sql
-- Kontrollera om trial är tillåten
check_trial_eligibility(p_org_number, p_email) RETURNS JSONB

-- Registrera att prenumeration startat
register_subscription_start(p_org_id, p_org_number, p_email) RETURNS void
```

**Uppdaterad trigger:**

```sql
-- handle_new_user() - Ändrat från 90 dagar (3 mån) till 60 dagar (2 mån)
-- Kontrollerar berättigande innan trial skapas
-- Registrerar automatiskt prenumerationsstart
```

### 2. API-Ändringar

**app/api/onboarding/auto/route.ts:**

```typescript
// ✅ Kontrollerar trial-berättigande innan org skapas
const { data: eligibility } = await supabase.rpc('check_trial_eligibility', {
  p_org_number: orgNumber,
  p_email: userEmail
});

if (!eligibility.is_eligible) {
  // Blockerar med tydligt felmeddelande
}

// ✅ Ändrat från 3 månader till 2 månader
trialEnds.setDate(trialEnds.getDate() + 60); // 2 MÅNADER

// ✅ Registrerar prenumerationsstart
await supabase.rpc('register_subscription_start', {...});
```

**app/api/subscription/checkout/route_new.ts:**

```typescript
// ✅ Hämtar has_had_subscription från org
const { data: org } = await supabase
  .from('orgs')
  .select('has_had_subscription')
  .eq('id', profile.org_id)
  .single();

// ✅ Ger trial endast om första prenumerationen
subscription_data: {
  trial_period_days: org?.has_had_subscription ? 0 : 60, // 2 månader
}
```

**app/api/subscription/webhook/route.ts:**

```typescript
// ✅ Registrerar prenumeration när Stripe-betalning genomförs
if (event.type === "checkout.session.completed") {
  // Anropar register_subscription_start()
  // Sätter has_had_subscription = true
}
```

### 3. Dokumentation

**Ny fil: TRIAL_MISSBRUKSSKYDD.md**

- Komplett förklaring av missbruksskyddet
- 5 testscenarier
- Implementation guide
- RLS policies

**Uppdaterad: STRIPE_INTEGRATION_GUIDE.md**

- Referens till 2 månaders trial
- Missbruksskydd-sektion
- Länk till TRIAL_MISSBRUKSSKYDD.md

---

## 🔒 Hur Missbruksskyddet Fungerar

### Scenario 1: Första Registreringen ✅

```
Användare: anna@example.com
Org-nummer: 556677-8899
Resultat: Får 2 månaders gratis trial
```

### Scenario 2: Samma Email, Nytt Org-nummer ❌

```
Användare: anna@example.com (samma)
Org-nummer: 111222-3333 (nytt)
Resultat: BLOCKERAS - "Email har redan använts"
```

### Scenario 3: Ny Email, Samma Org-nummer ❌

```
Användare: anders@example.com (ny)
Org-nummer: 556677-8899 (samma)
Resultat: BLOCKERAS - "Organisationsnummer redan använt"
```

### Scenario 4: Radera och Återskapa ❌

```
1. Anna raderar sitt konto
2. Anna registrerar igen med samma info
Resultat: BLOCKERAS - Permanent historik finns kvar
```

### Scenario 5: Uppgradering till Betald ✅

```
Användare: anna@example.com (i trial)
Action: Betalar via Stripe
Resultat: Ingen ny trial, direkt betalning
```

---

## ✅ Implementation Checklist

### Backend (Klart ✅)

- [x] SQL migration skapad (`ADD_TRIAL_ABUSE_PROTECTION.sql`)
- [x] Database trigger uppdaterad (2 månader)
- [x] API onboarding/auto uppdaterad
- [x] Stripe checkout uppdaterad
- [x] Stripe webhook uppdaterad
- [x] Dokumentation skapad

### Deployment (Behöver göras 🔧)

- [ ] Kör `ADD_TRIAL_ABUSE_PROTECTION.sql` i Supabase SQL Editor
- [ ] Verifiera att funktioner skapades korrekt:
  ```sql
  SELECT check_trial_eligibility('test-org', 'test@example.com');
  ```
- [ ] Testa blockering genom att registrera samma org-nummer två gånger
- [ ] Verifiera att `has_had_subscription` sätts till `true`
- [ ] Kontrollera att historiktabeller fylls:
  ```sql
  SELECT * FROM org_email_history;
  SELECT * FROM org_number_subscription_history;
  ```

### Stripe (Behöver göras 🔧)

- [ ] Skapa 5 produkter i Stripe Dashboard (se STRIPE_INTEGRATION_GUIDE.md)
- [ ] Kopiera Price IDs till miljövariabler
- [ ] Konfigurera webhook endpoint
- [ ] Testa checkout med test-kort `4242 4242 4242 4242`
- [ ] Verifiera att trial visas som "60 days" i Stripe Dashboard

---

## 🧪 Testplan

### 1. Test Missbruksskydd

```bash
# Steg 1: Registrera första användaren
# Gå till /register
# Fyll i: anna@example.com, org: 556677-8899
# Förväntat: ✅ Trial skapas

# Steg 2: Försök registrera igen
# Gå till /register
# Fyll i: anna@example.com, org: 111222-3333 (nytt org-nummer)
# Förväntat: ❌ Blockeras med "Email har redan använts"

# Steg 3: Försök med ny email, samma org
# Fyll i: anders@example.com, org: 556677-8899 (samma)
# Förväntat: ❌ Blockeras med "Organisationsnummer redan använt"

# Steg 4: Verifiera i databas
SELECT * FROM org_email_history WHERE email = 'anna@example.com';
SELECT * FROM org_number_subscription_history WHERE org_number = '556677-8899';
SELECT has_had_subscription FROM orgs WHERE org_number = '556677-8899';
# Förväntat: has_had_subscription = true
```

### 2. Test Stripe Trial

```bash
# Steg 1: Skapa ny organisation (med annat org-nummer)
# Registrera: test@example.com, org: 999888-7777

# Steg 2: Gå till /admin/abonnemang
# Välj tjänster
# Klicka "Uppgradera till Betald Plan"

# Steg 3: I Stripe Checkout
# Fyll i test-kort: 4242 4242 4242 4242
# Förväntat: Trial period visas som "60 days free"

# Steg 4: Efter betalning
# Kontrollera i Supabase:
SELECT has_had_subscription FROM orgs WHERE email = 'test@example.com';
# Förväntat: has_had_subscription = true

# Steg 5: Försök registrera igen med test@example.com
# Förväntat: ❌ Blockeras
```

---

## 🚨 Viktiga Noteringar

### Säkerhet

1. **Historiktabeller får ALDRIG raderas**
   - `org_email_history` och `org_number_subscription_history` är permanenta
   - Ingen DELETE policy ska skapas

2. **has_had_subscription får ALDRIG sättas till false**
   - Detta är en permanent flagga
   - Om satt till `true`, stannar den där

3. **RLS Policies**
   - Endast `service_role` får läsa historiktabeller
   - Användare kan INTE se om email/org-nummer används

### Performance

1. **Index är skapade** för snabb sökning:

   ```sql
   idx_orgs_has_had_subscription
   idx_org_email_history_org_number
   idx_org_email_history_email
   ```

2. **Funktioner är SECURITY DEFINER**
   - Bypass RLS för att kunna läsa historik
   - Säkert eftersom endast backend anropar dem

---

## 📊 Metrics att Följa

Efter deployment, övervaka:

1. **Trial Conversion Rate**

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'trialing') as trial_count,
     COUNT(*) FILTER (WHERE status = 'active') as paid_count
   FROM org_subscriptions;
   ```

2. **Blockerade Försök**

   ```sql
   -- Spåra via application logs eller skapa event tabell
   SELECT COUNT(*) FROM org_email_history;
   -- Om fler email än orgs → Missbruksförsök blockerade
   ```

3. **Trial till Betald Conversion**
   ```sql
   SELECT
     COUNT(DISTINCT org_id) as total_trials,
     COUNT(DISTINCT org_id) FILTER (
       WHERE has_had_subscription = true
     ) as converted
   FROM org_subscriptions
   WHERE status = 'trialing';
   ```

---

## 🎉 Sammanfattning

**Vad fungerar nu:**

- ✅ 2 månaders gratis trial (60 dagar)
- ✅ Automatiskt missbruksskydd
- ✅ Stripe integration med trial
- ✅ Permanent historikspårning
- ✅ Komplett dokumentation

**Nästa steg:**

1. Kör SQL-migration i Supabase
2. Testa missbruksskydd lokalt
3. Skapa Stripe-produkter
4. Deploy till production
5. Övervaka metrics

**Dokumentation:**

- `TRIAL_MISSBRUKSSKYDD.md` - Komplett guide
- `STRIPE_INTEGRATION_GUIDE.md` - Stripe setup
- `ADD_TRIAL_ABUSE_PROTECTION.sql` - Database migration

---

**Status:** ✅ Redo för testning och deployment
