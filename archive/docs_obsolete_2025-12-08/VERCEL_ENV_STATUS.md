# ✅ VERCEL ENVIRONMENT VARIABLES STATUS

**Kontrollerat:** 1 December 2025

---

## ✅ FINNS REDAN (Verifierat)

| Variable                              | Status | Används för                    |
| ------------------------------------- | ------ | ------------------------------ |
| `JWT_SECRET`                          | ✅     | Consent tokens                 |
| `NEXT_PUBLIC_JWT_SECRET`              | ✅     | Client-side JWT validation     |
| `NEXT_PUBLIC_SITE_URL`                | ✅     | Email links, redirects         |
| `SENTRY_ORG`                          | ✅     | Error tracking                 |
| `SENTRY_PROJECT`                      | ✅     | Error tracking                 |
| `NEXT_PUBLIC_SENTRY_DSN`              | ✅     | Client-side error tracking     |
| `SENTRY_AUTH_TOKEN`                   | ✅     | Source maps upload             |
| `STRIPE_PRICE_ID_DAYCARE`             | ✅     | Hunddagis prenumeration        |
| `STRIPE_PRICE_ID_DAYCARE_YEARLY`      | ✅     | Hunddagis årsprenumeration     |
| `STRIPE_PRICE_ID_BOARDING`            | ✅     | Hundpensionat prenumeration    |
| `STRIPE_PRICE_ID_BOARDING_YEARLY`     | ✅     | Hundpensionat årsprenumeration |
| `STRIPE_PRICE_ID_GROOMING`            | ✅     | Frisör prenumeration           |
| `STRIPE_PRICE_ID_GROOMING_YEARLY`     | ✅     | Frisör årsprenumeration        |
| `STRIPE_PRICE_ID_TWO_SERVICES`        | ✅     | 2 tjänster prenumeration       |
| `STRIPE_PRICE_ID_TWO_SERVICES_YEARLY` | ✅     | 2 tjänster årsprenumeration    |
| `STRIPE_PRICE_ID_ALL_SERVICES`        | ✅     | Alla tjänster prenumeration    |
| `STRIPE_PRICE_ID_ALL_SERVICES_YEARLY` | ✅     | Alla tjänster årsprenumeration |
| `STRIPE_WEBHOOK_SECRET`               | ✅     | Webhook signature validation   |

**Total: 18 av ~22 finns redan! 🎉**

---

## ✅ ALLA KRITISKA VARIABLER FINNS!

**Status:** Verifierat 1 December 2025 - ALLA env vars finns i Vercel!

### Tidigare misstänkta saknade (NU VERIFIERADE SOM FINNS):

#### 1. **NEXT_PUBLIC_SUPABASE_URL**

```
https://[ditt-projekt-id].supabase.co
```

- **Var hittar jag det?** Supabase Dashboard → Settings → API → Project URL
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **Var hittar jag det?** Supabase Dashboard → Settings → API → `anon` `public` key
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 3. **SUPABASE_SERVICE_ROLE_KEY**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **⚠️ KÄNSLIG!** Endast server-side, bypass RLS
- **Var hittar jag det?** Supabase Dashboard → Settings → API → `service_role` `secret` key
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 4. **RESEND_API_KEY**

```
re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **Var hittar jag det?** Resend Dashboard → API Keys
- **Environment:** ✅ Production ✅ Preview ✅ Development

---

## 📋 STEG-FÖR-STEG: LÄGG TILL SAKNADE VARIABLER

### Steg 1: Öppna Vercel Dashboard

```
https://vercel.com/cassandrawikgren/dogplanner/settings/environment-variables
```

### Steg 2: Hämta Supabase credentials

1. Gå till: https://supabase.com/dashboard/project/[ditt-projekt]/settings/api
2. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

### Steg 3: Hämta Resend API key

1. Gå till: https://resend.com/api-keys
2. Skapa ny API key om du inte har en
3. Kopiera → `RESEND_API_KEY`

### Steg 4: Lägg till i Vercel

För varje variable:

1. Klicka "Add New" i Vercel
2. Ange Name (t.ex. `NEXT_PUBLIC_SUPABASE_URL`)
3. Ange Value (från Supabase/Resend)
4. Välj Environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klicka "Save"

### Steg 5: Redeploy

Efter att alla variabler är tillagda:

```bash
# Trigger redeploy från terminalen
vercel --prod

# ELLER från Vercel Dashboard:
# Deployments → Latest → ⋮ → Redeploy
```

---

## ✅ VERIFIERING

Efter deploy, testa att följande fungerar:

### Test 1: Supabase Connection

```bash
# Öppna din production URL
# Navigera till /auth-debug
# Kontrollera att Supabase URL och keys visas korrekt
```

### Test 2: Authentication

```bash
# Försök registrera ny användare
# Om det fungerar = Supabase keys är korrekta ✅
```

### Test 3: Email Sending

```bash
# Gå till /test-email (om sidan finns)
# Skicka test-email
# Om det fungerar = Resend API key är korrekt ✅
```

---

## 🔒 SÄKERHETSNOTERINGAR

### NEXT*PUBLIC*\* variabler:

- ✅ OK att exponera till client
- Används i browser-kod
- Exempel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### SERVER-ONLY variabler:

- 🔒 **ALDRIG** exponera till client!
- Endast tillgängliga i server-side kod (API routes, Server Components)
- Exempel: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, JWT_SECRET

### Vercel hanterar detta automatiskt:

- `NEXT_PUBLIC_*` → Injiceras i browser bundle
- Övriga → Endast tillgängliga server-side

---

## 📊 SAMMANFATTNING

| Kategori                | Antal | Status    |
| ----------------------- | ----- | --------- |
| **Redan i Vercel**      | 18    | ✅ Klar   |
| **Behöver läggas till** | 4     | ⏳ Väntar |
| **Totalt**              | 22    | 82% klart |

### Nästa steg:

1. ✅ Lägg till de 4 saknade variablerna (5-10 min)
2. ✅ Redeploy från Vercel
3. ✅ Testa auth + email
4. 🚀 Launch!

---

**Tid att fixa:** ~10 minuter  
**Komplexitet:** Låg (bara copy-paste från Supabase/Resend)  
**Blockerar lansering?** Ja, systemet fungerar inte utan dessa
