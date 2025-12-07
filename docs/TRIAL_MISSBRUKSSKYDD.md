# Missbruksskydd för 2 Månaders Gratisperiod

## 🎯 Krav

1. **Gratis period:** 2 månader (60 dagar) - gäller endast första gången
2. **Blockera missbruk:** Användare kan INTE få flera gratisperioder genom att:
   - Skapa nya konton med andra e-postadresser
   - Registrera nya organisationer med samma org-nummer
   - Återskapa raderade organisationer

## 🛡️ Implementerad Lösning

### 1. Databas-Flagga: `has_had_subscription`

**Syfte:** Spåra om en organisation någonsin haft en prenumeration (trial eller betald)

```sql
-- Lägg till kolumn i orgs-tabellen
ALTER TABLE orgs
ADD COLUMN IF NOT EXISTS has_had_subscription BOOLEAN DEFAULT false;

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_orgs_has_had_subscription
ON orgs(has_had_subscription);
```

**När sätts den till `true`?**

- När en ny trial startar (vid registrering)
- När användaren uppgraderar till betald prenumeration
- Sätts ALDRIG tillbaka till `false` (permanent spårning)

### 2. Email-Spårning

**Problem:** Användare kan registrera nya konton med olika email-adresser

**Lösning:** Spara historik över alla email-adresser som använts med en organisation

```sql
-- Ny tabell för email-historik
CREATE TABLE IF NOT EXISTS org_email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_number, email)
);

-- Index för snabb sökning
CREATE INDEX idx_org_email_history_org_number ON org_email_history(org_number);
CREATE INDEX idx_org_email_history_email ON org_email_history(org_number);
```

### 3. Org-Nummer Spårning

**Problem:** Användare kan radera organisation och återskapa med samma org-nummer

**Lösning:** Spåra alla org-nummer som någonsin haft en prenumeration

```sql
-- Ny tabell för org-nummer historik
CREATE TABLE IF NOT EXISTS org_number_subscription_history (
  org_number TEXT PRIMARY KEY,
  has_had_subscription BOOLEAN DEFAULT true,
  first_subscription_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔒 Implementering

### Steg 1: Skapa Database Migrations

```sql
-- Fil: supabase/migrations/ADD_TRIAL_ABUSE_PROTECTION.sql

-- 1. Lägg till flagga i orgs
ALTER TABLE orgs
ADD COLUMN IF NOT EXISTS has_had_subscription BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orgs_has_had_subscription
ON orgs(has_had_subscription);

-- 2. Email-historik tabell
CREATE TABLE IF NOT EXISTS org_email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_number, email)
);

CREATE INDEX IF NOT EXISTS idx_org_email_history_org_number
ON org_email_history(org_number);
CREATE INDEX IF NOT EXISTS idx_org_email_history_email
ON org_email_history(email);

-- 3. Org-nummer historik tabell
CREATE TABLE IF NOT EXISTS org_number_subscription_history (
  org_number TEXT PRIMARY KEY,
  has_had_subscription BOOLEAN DEFAULT true,
  first_subscription_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Funktion för att kontrollera om trial är tillåten
CREATE OR REPLACE FUNCTION check_trial_eligibility(
  p_org_number TEXT,
  p_email TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_org_has_subscription BOOLEAN;
  v_email_used BOOLEAN;
  v_result JSONB;
BEGIN
  -- Kontrollera om org-nummer tidigare haft prenumeration
  SELECT EXISTS (
    SELECT 1 FROM org_number_subscription_history
    WHERE org_number = p_org_number
  ) INTO v_org_has_subscription;

  -- Kontrollera om email använts med detta org-nummer tidigare
  SELECT EXISTS (
    SELECT 1 FROM org_email_history
    WHERE org_number = p_org_number AND email = p_email
  ) INTO v_email_used;

  -- Bygg resultat
  v_result := jsonb_build_object(
    'is_eligible', NOT (v_org_has_subscription OR v_email_used),
    'reason', CASE
      WHEN v_org_has_subscription THEN 'org_number_used'
      WHEN v_email_used THEN 'email_used'
      ELSE 'eligible'
    END,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funktion för att registrera ny prenumeration
CREATE OR REPLACE FUNCTION register_subscription_start(
  p_org_id UUID,
  p_org_number TEXT,
  p_email TEXT
)
RETURNS void AS $$
BEGIN
  -- Markera org som att den haft prenumeration
  UPDATE orgs
  SET has_had_subscription = true
  WHERE id = p_org_id;

  -- Spara email-historik
  INSERT INTO org_email_history (org_number, email)
  VALUES (p_org_number, p_email)
  ON CONFLICT (org_number, email) DO NOTHING;

  -- Spara org-nummer historik
  INSERT INTO org_number_subscription_history (org_number)
  VALUES (p_org_number)
  ON CONFLICT (org_number) DO UPDATE
  SET last_checked_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Steg 2: Uppdatera Trigger för Nya Användare

```sql
-- Uppdatera handle_new_user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_org_number TEXT;
  v_trial_eligibility JSONB;
BEGIN
  -- Hämta metadata
  v_org_name := NEW.raw_user_meta_data->>'org_name';
  v_org_number := NEW.raw_user_meta_data->>'org_number';

  -- KONTROLLERA TRIAL-BERÄTTIGANDE
  v_trial_eligibility := check_trial_eligibility(
    v_org_number,
    NEW.email
  );

  -- Om INTE berättigad till trial
  IF NOT (v_trial_eligibility->>'is_eligible')::boolean THEN
    RAISE EXCEPTION 'Trial period not allowed: %',
      v_trial_eligibility->>'reason';
  END IF;

  -- Skapa organisation (tidigare kod...)
  INSERT INTO orgs (name, org_number, enabled_services, service_types, has_had_subscription)
  VALUES (v_org_name, v_org_number, enabled_services_array, service_types_array, true)
  RETURNING id INTO v_org_id;

  -- Skapa trial prenumeration med 2 månader (60 dagar)
  INSERT INTO org_subscriptions (
    org_id,
    plan,
    status,
    trial_starts_at,
    trial_ends_at,
    is_active
  ) VALUES (
    v_org_id,
    'basic',
    'trialing',
    now(),
    now() + interval '60 days', -- 2 MÅNADER
    true
  );

  -- REGISTRERA att prenumeration startats
  PERFORM register_subscription_start(
    v_org_id,
    v_org_number,
    NEW.email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Steg 3: Uppdatera API-rutt för Onboarding

```typescript
// app/api/onboarding/auto/route.ts

// Innan org skapas - kontrollera berättigande
const { data: eligibility } = await supabase.rpc("check_trial_eligibility", {
  p_org_number: orgNumber,
  p_email: userEmail,
});

if (!eligibility?.is_eligible) {
  return NextResponse.json(
    {
      error: `Gratisperiod ej tillgänglig. Orsak: ${eligibility.reason}`,
      reason: eligibility.reason,
    },
    { status: 403 }
  );
}

// Skapa org med has_had_subscription = true
const { data: org } = await supabase
  .from("orgs")
  .insert([
    {
      name: orgName,
      org_number: orgNumber,
      enabled_services: ["daycare"],
      service_types: ["hunddagis"],
      has_had_subscription: true, // VIKTIGT!
    },
  ])
  .select()
  .single();

// Skapa 2 månaders trial (60 dagar)
const trialEnds = new Date();
trialEnds.setDate(trialEnds.getDate() + 60); // 2 MÅNADER

await supabase.from("org_subscriptions").insert([
  {
    org_id: org.id,
    plan: "basic",
    status: "trialing",
    trial_starts_at: new Date().toISOString(),
    trial_ends_at: trialEnds.toISOString(),
    is_active: true,
  },
]);

// Registrera prenumerationsstart
await supabase.rpc("register_subscription_start", {
  p_org_id: org.id,
  p_org_number: orgNumber,
  p_email: userEmail,
});
```

### Steg 4: Uppdatera Stripe Checkout för Trial

```typescript
// app/api/subscription/checkout/route_new.ts

// Kontrollera om org redan haft prenumeration
const { data: org } = await supabase
  .from("orgs")
  .select("has_had_subscription")
  .eq("id", profile.org_id)
  .single();

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [{ price: priceId, quantity: 1 }],

  // Lägg till trial ENDAST om första prenumerationen
  subscription_data: {
    trial_period_days: org?.has_had_subscription ? 0 : 60, // 2 månader
    metadata: {
      org_id: profile.org_id,
      enabled_services: JSON.stringify(services),
    },
  },

  customer_email: user.email!,
  metadata: {
    org_id: profile.org_id,
    user_id: user.id,
    enabled_services: JSON.stringify(services),
    plan_name: planName,
  },
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/abonnemang?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/abonnemang?cancelled=true`,
});
```

### Steg 5: Uppdatera Stripe Webhook

```typescript
// app/api/subscription/webhook/route.ts

// När checkout.session.completed eller customer.subscription.created
if (event.type === "checkout.session.completed") {
  const session = event.data.object;
  const orgId = session.metadata?.org_id;
  const orgNumber = session.customer_details?.org_number; // Om tillgängligt
  const email = session.customer_email;

  // Registrera att prenumeration startats
  await supabase.rpc("register_subscription_start", {
    p_org_id: orgId,
    p_org_number: orgNumber,
    p_email: email,
  });

  // Uppdatera org
  await supabase
    .from("orgs")
    .update({ has_had_subscription: true })
    .eq("id", orgId);
}
```

## 🧪 Testscenarier

### Scenario 1: Första registreringen (OK)

```
Användare: anna@example.com
Org-nummer: 556677-8899
Resultat: ✅ Får 2 månaders gratis trial
```

### Scenario 2: Samma email, nytt org-nummer (BLOCKERAS)

```
Användare: anna@example.com (samma som tidigare)
Org-nummer: 111222-3333 (nytt)
Resultat: ❌ "Email har redan använts för gratisperiod"
```

### Scenario 3: Ny email, samma org-nummer (BLOCKERAS)

```
Användare: anders@example.com (ny)
Org-nummer: 556677-8899 (samma som scenario 1)
Resultat: ❌ "Organisationsnummer har redan haft prenumeration"
```

### Scenario 4: Radera och återskapa (BLOCKERAS)

```
1. Anna raderar sitt konto och organisation
2. Anna registrerar igen med anna@example.com och 556677-8899
Resultat: ❌ "Organisationsnummer har redan haft prenumeration"
```

### Scenario 5: Uppgradering från trial till betald (OK)

```
Användare: anna@example.com (i trial)
Action: Betalar för prenumeration via Stripe
Resultat: ✅ Ingen ny trial, direkt betalning
```

## ✅ Implementerings-Checklista

- [ ] Kör ADD_TRIAL_ABUSE_PROTECTION.sql i Supabase
- [ ] Uppdatera handle_new_user() trigger
- [ ] Uppdatera app/api/onboarding/auto/route.ts
- [ ] Uppdatera app/api/subscription/checkout/route_new.ts
- [ ] Uppdatera app/api/subscription/webhook/route.ts
- [ ] Ändra alla 3-månaders referenser till 2 månader (60 dagar)
- [ ] Testa alla 5 scenarier ovan
- [ ] Dokumentera i STRIPE_INTEGRATION_GUIDE.md

## 🔐 Säkerhet

**RLS Policies behövs:**

```sql
-- Tillåt endast service role att läsa historik
CREATE POLICY "Service role only" ON org_email_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON org_number_subscription_history
  FOR ALL USING (auth.role() = 'service_role');
```

**Viktigt:**

- Historiktabellerna får ALDRIG raderas (permanent spårning)
- has_had_subscription får ALDRIG sättas tillbaka till false
- Funktioner måste vara SECURITY DEFINER (bypass RLS)
