# 🔑 Hitta Stripe Price IDs

## 📍 Var Hittar Jag Price IDs?

### Steg 1: Öppna Stripe Dashboard

1. Gå till: https://dashboard.stripe.com/test/products
2. Logga in med ditt Stripe-konto

### Steg 2: Klicka På Varje Produkt

Du ska se dessa 5 produkter (från din screenshot):

- ✂️ **"Endast frisör"** - 199,00 kr/månad
- 🐕 **"Endast hunddagis"** - 399,00 kr/månad
- 🏨 **"Endast pensionat"** - 399,00 kr/månad
- 📦 **"2 tjänster"** (namn kan variera) - 599,00 kr/månad
- 🎁 **"Alla tjänster"** - 799,00 kr/månad (⚠️ kontrollera att det är 799, inte 399!)

### Steg 3: Kopiera Price ID

För varje produkt:

1. **Klicka på produktnamnet** (t.ex. "Endast frisör")
2. Under rubriken hittar du **"Price ID"**
3. Det ser ut som: `price_1QTxyz...` eller liknande
4. **Klicka på ID:t för att kopiera** eller använd kopiera-ikonen

### Steg 4: Klistra In i .env.local

Öppna `.env.local` och ersätt `price_XXX` med de faktiska Price IDs:

```bash
# 💰 Stripe Price IDs - Modulära Tjänster (2025-11-30)
STRIPE_PRICE_ID_GROOMING=price_1QTxyz...        # Hundfrisör: 199 kr/mån
STRIPE_PRICE_ID_DAYCARE=price_1QTabc...         # Hunddagis: 399 kr/mån
STRIPE_PRICE_ID_BOARDING=price_1QTdef...        # Hundpensionat: 399 kr/mån
STRIPE_PRICE_ID_TWO_SERVICES=price_1QTghi...    # 2 tjänster: 599 kr/mån
STRIPE_PRICE_ID_ALL_SERVICES=price_1QTjkl...    # Alla 3: 799 kr/mån
```

---

## ✅ Checklista

Kontrollera att du har:

- [ ] **5 Price IDs** - Ett för varje tjänstekombination
- [ ] **Rätt priser**:
  - Frisör: 199 kr/mån
  - Dagis: 399 kr/mån
  - Pensionat: 399 kr/mån
  - 2 tjänster: 599 kr/mån
  - Alla 3: **799 kr/mån** (inte 399!)
- [ ] **Test mode** - Price IDs ska börja med `price_` (inte `prod_`)
- [ ] **Recurring** - Alla ska vara "månatliga" subscriptions

---

## 🔍 Så Ser Price IDs Ut

**Exempel:**

```
price_1QTxyzABCDEF123456789
price_1QTabcGHIJKL987654321
price_1QTdefMNOPQR456789123
```

**Viktigt:**

- Börjar alltid med `price_`
- Följs av en unik ID-sträng
- Test mode: `price_1QT...`
- Production mode: `price_1QP...` (eller liknande)

---

## 🚨 Vanliga Problem

### Problem 1: Hittar Inte Price ID

**Lösning:**

- Klicka på produktens **namn** (inte priset)
- Scrolla ner till "Pricing" sektionen
- Price ID visas under pris-rubriken

### Problem 2: Flera Price IDs Per Produkt

**Lösning:**

- Använd det **senaste** Price ID (högst upp)
- Om osäker, kontrollera att priset stämmer (199/399/599/799 kr)

### Problem 3: "Alla tjänster" Visar 399 kr Istället för 799 kr

**Lösning:**

1. Gå in på produkten i Stripe
2. Klicka "Add another price"
3. Sätt 799 kr/mån
4. Markera den nya som "Default"
5. Kopiera det nya Price ID

---

## 📝 Nästa Steg

Efter att du klistrat in alla 5 Price IDs i `.env.local`:

1. ✅ **Spara filen**
2. ✅ **Starta om dev-servern:** `npm run dev`
3. ✅ **Testa på localhost:** Gå till `/admin/abonnemang` och se om priser visas korrekt
4. ✅ **Lägg till i Vercel:** Samma Price IDs ska läggas till som miljövariabler där

---

## 🎯 Vercel Environment Variables

När `.env.local` är klar, lägg till samma variabler i Vercel:

**Gå till:** https://vercel.com/cassandrawikgren/dog-planner/settings/environment-variables

**Lägg till en i taget:**

| Name                           | Value          | Environment            |
| ------------------------------ | -------------- | ---------------------- |
| `STRIPE_PRICE_ID_GROOMING`     | `price_1QT...` | Production ✓ Preview ✓ |
| `STRIPE_PRICE_ID_DAYCARE`      | `price_1QT...` | Production ✓ Preview ✓ |
| `STRIPE_PRICE_ID_BOARDING`     | `price_1QT...` | Production ✓ Preview ✓ |
| `STRIPE_PRICE_ID_TWO_SERVICES` | `price_1QT...` | Production ✓ Preview ✓ |
| `STRIPE_PRICE_ID_ALL_SERVICES` | `price_1QT...` | Production ✓ Preview ✓ |

**Viktigt:** Bocka i **både** Production och Preview!

---

## ✅ Klart!

När alla Price IDs är konfigurerade:

- ✅ Lokalt (`.env.local`)
- ✅ Vercel (miljövariabler)

Då kan du gå vidare till **nästa steg: Webhook-konfiguration**! 🚀
