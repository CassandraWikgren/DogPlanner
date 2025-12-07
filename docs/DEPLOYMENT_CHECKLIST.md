# 🚀 DEPLOYMENT CHECKLIST - DogPlanner

**Datum:** 1 December 2025  
**Status:** Förberedelser för lansering

---

## ✅ STEG 1: VERCEL ENVIRONMENT VARIABLES

### Logga in på Vercel Dashboard:

```bash
https://vercel.com/cassandrawikgren/dogplanner/settings/environment-variables
```

### Kontrollera att dessa finns (bocka av när klar):

- [ ] **NEXT_PUBLIC_SUPABASE_URL**
  - Värde: `https://[ditt-projekt-id].supabase.co`
  - Environment: ✅ Production ✅ Preview ✅ Development

- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY**
  - Värde: `eyJhbGc...` (från Supabase → Settings → API)
  - Environment: ✅ Production ✅ Preview ✅ Development

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  - ⚠️ KÄNSLIG - Endast server-side!
  - Värde: `eyJhbGc...` (från Supabase → Settings → API)
  - Environment: ✅ Production ✅ Preview ✅ Development

- [ ] **JWT_SECRET**
  - Värde: Minst 32 tecken random string
  - Generera: `openssl rand -base64 32`
  - Environment: ✅ Production ✅ Preview ✅ Development

- [ ] **NEXT_PUBLIC_JWT_SECRET**
  - Värde: Samma som JWT_SECRET
  - Environment: ✅ Production ✅ Preview ✅ Development

- [ ] **NEXT_PUBLIC_SITE_URL**
  - Production: `https://dogplanner.se` (eller din domän)
  - Preview: `https://dogplanner-git-[branch].vercel.app`
  - Development: `http://localhost:3000`

- [ ] **RESEND_API_KEY**
  - Värde: `re_...` (från Resend Dashboard)
  - Environment: ✅ Production ✅ Preview ✅ Development

### Valfria (men rekommenderade):

- [ ] **NEXT_PUBLIC_SENTRY_DSN** (om Sentry används)
- [ ] **SENTRY_AUTH_TOKEN** (för source maps)
- [ ] **DATABASE_URL** (för direktåtkomst om behövs)

---

## ✅ STEG 2: SUPABASE SQL SCRIPTS

### 2A. Aktivera RLS & Realtime

**Kör i:** Supabase Dashboard → SQL Editor

**Fil:** `supabase/enable_rls_and_realtime.sql`

```sql
-- Detta script aktiverar Row Level Security på alla tabeller
-- och sätter upp Realtime för relevanta tabeller
```

- [ ] Script kört
- [ ] Inga errors
- [ ] Verifiera: Alla tabeller har RLS enabled

### 2B. Lägg till GDPR Policies

**Kör i:** Supabase Dashboard → SQL Editor

**Fil:** `supabase/ADD_GDPR_DELETE_POLICIES.sql`

```sql
-- Detta script lägger till policies för GDPR-compliance
-- och data deletion
```

- [ ] Script kört
- [ ] Inga errors
- [ ] Verifiera: GDPR policies finns

---

## ✅ STEG 3: TEST I STAGING

### Deploy till Preview Environment

```bash
git push origin main
# Vercel deplojar automatiskt till preview URL
```

- [ ] Preview deploy lyckades
- [ ] Öppna preview URL

### Testa kritiska flöden:

**Auth & Onboarding:**

- [ ] Registrera ny användare
- [ ] Verifiera att org_id sätts automatiskt
- [ ] Logga in
- [ ] Logga ut

**Hundregister:**

- [ ] Skapa ny hund
- [ ] Redigera hund
- [ ] Verifiera att endast din org ser hunden

**Bokningar:**

- [ ] Skapa dagisbokning
- [ ] Skapa pensionatbokning
- [ ] Verifiera att bokningen syns i kalendern

**Fakturering:**

- [ ] Skapa faktura (manuellt)
- [ ] Generera PDF
- [ ] Verifiera att PDF:en ser korrekt ut

**Email:**

- [ ] Testa email-utskick (om möjligt)
- [ ] Verifiera att rätt template används

---

## ✅ STEG 4: PRODUCTION DEPLOY

### Före deploy:

- [ ] Alla env vars verifierade
- [ ] SQL scripts körda
- [ ] Staging-tester OK
- [ ] Backup av Supabase tagen

### Deploy:

```bash
# Merge till main (om ej redan där)
git checkout main
git pull origin main

# Vercel deplojar automatiskt till production
# Eller manuellt:
vercel --prod
```

### Efter deploy:

- [ ] Production URL öppen
- [ ] Smoke test: Kan öppna sidan
- [ ] Smoke test: Kan logga in
- [ ] Smoke test: Kan skapa hund
- [ ] Monitoring: Kolla Vercel logs
- [ ] Monitoring: Kolla Supabase logs

---

## ✅ STEG 5: POST-LAUNCH MONITORING

### Första timmen:

- [ ] Kolla Vercel Analytics (fel-rate)
- [ ] Kolla Supabase Logs (databas-fel)
- [ ] Kolla Console i browser (frontend-fel)
- [ ] Testa från olika enheter (desktop, mobile)

### Första dagen:

- [ ] Performance metrics OK (< 3s load time)
- [ ] Inga kritiska errors i logs
- [ ] Email-utskick fungerar
- [ ] Betalningar fungerar (om aktiverat)

### Första veckan:

- [ ] User feedback samlat
- [ ] Bugfixes deployade
- [ ] Dokumentation uppdaterad

---

## 🆘 ROLLBACK PLAN

Om något går fel:

### Vercel Rollback:

```bash
# Gå till Vercel Dashboard → Deployments
# Klicka på senast fungerande deployment
# Klicka "Promote to Production"
```

### Supabase Rollback:

```sql
-- Kör backup SQL från tidigare
-- Eller använd Supabase Point-in-Time Recovery
```

### Emergency Contacts:

- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com

---

## 📊 SUCCESS METRICS

### Launch är lyckad när:

- ✅ Alla env vars finns och fungerar
- ✅ RLS policies skyddar multi-tenancy
- ✅ Användare kan registrera sig och logga in
- ✅ Hundar kan skapas och visas korrekt
- ✅ Bokningar kan skapas
- ✅ Fakturor kan genereras
- ✅ Inga kritiska errors i 24h

### Nästa steg efter lansering:

1. Installera Sentry för error tracking
2. Sätt upp automated backups
3. Konfigurera monitoring alerts
4. Dokumentera support-process
5. Skapa user onboarding guide

---

**Lycka till med lanseringen! 🚀**
