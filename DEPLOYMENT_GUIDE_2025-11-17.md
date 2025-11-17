# 🚀 Deployment Guide - Invoice & Registration Improvements

**Datum:** 2025-11-17  
**Status:** Redo för deployment

## ✅ Genomförda förbättringar

### 1. Email-notifikationer (4 touchpoints)

- ✅ `lib/emailTemplates.ts` - Confirmation, notification, approval, rejection templates
- ✅ `lib/emailSender.ts` - Integrerad med Resend API
- ✅ `app/api/applications/route.ts` - Skickar emails vid ansökan
- ✅ Redo att användas i hela systemet

### 2. Automatisk organisationsinformation vid registrering

- ✅ `lib/swedishLocations.ts` - Alla 21 län + ~290 kommuner
- ✅ `supabase/migrations/20251117_auto_setup_org_location.sql` - Trigger uppdaterad
- ✅ Nya användare får automatiskt län/kommun/service_types
- ✅ 3 månaders gratis prenumeration skapas automatiskt

### 3. Förbättrad månadsfakturering

- ✅ `invoice_runs` tabell - Loggar alla körningar
- ✅ Auto-genererade fakturanummer (format: 2025-11-0001)
- ✅ Auto-skicka fakturor (status: draft → sent)
- ✅ Email-notifiering till kunder
- ✅ `supabase/functions/generate_invoices/index.ts` - Redan uppdaterad!

---

## 📋 Deployment Checklist

### Steg 1: Verifiera databas ✅ (KLART)

- [x] Kör `20251117_improve_monthly_invoicing.sql` i Supabase
- [x] Kör `20251117_auto_setup_org_location.sql` i Supabase
- [x] Kör `20251117_email_notifications.sql` i Supabase

### Steg 2: Testa databas-funktioner

```sql
-- Kör detta i Supabase SQL Editor för att verifiera:
-- (Använd filen test_invoice_system.sql)

-- Test 1: Verifiera invoice_runs tabell
SELECT * FROM invoice_runs_summary;

-- Test 2: Testa invoice number generation
SELECT generate_invoice_number((SELECT id FROM orgs LIMIT 1));

-- Test 3: Verifiera org location fields
SELECT lan, kommun, service_types FROM orgs LIMIT 5;
```

### Steg 3: Edge Function (Redan uppdaterad! ✅)

Edge Function `generate_invoices` innehåller redan:

- ✅ Loggning till `invoice_runs`
- ✅ Auto-send fakturor med `sent_at`
- ✅ Email via `send_invoice_email` RPC
- ✅ Metadata tracking

**Inget att göra här - Edge Function är färdig!**

### Steg 4: Verifiera email-konfiguration

```bash
# Kontrollera att Resend API key finns i .env.local:
grep RESEND_API_KEY .env.local
```

**Viktigt:** På Vercel, lägg till i Environment Variables:

- `RESEND_API_KEY` = ditt Resend API key

### Steg 5: Testa registreringsflödet

1. Öppna `/register` i inkognitoläge
2. Registrera ny användare med:
   - Email
   - Lösenord
   - Organisationsnamn
   - Organisationsnummer
   - Telefon
   - Län (välj från dropdown)
   - Kommun (välj från dropdown)
3. Verifiera i Supabase att:
   - `orgs` tabell har `lan`, `kommun`, `service_types`
   - `org_subscriptions` har 3 månaders trial
   - `profiles` har koppling till org

### Steg 6: Git commit och push

```bash
git add .
git commit -m "feat: Add email notifications, auto org setup, and invoice improvements

- Email templates for application flow (4 touchpoints)
- Swedish locations (21 län + 290 kommuner) auto-setup
- Invoice runs logging and auto-numbering
- Invoice email notifications
- Auto-send invoices (draft → sent)
- Enhanced Edge Function with full tracking"

git push origin main
```

### Steg 7: Deploy till Vercel

Vercel kommer automatiskt att deploya när du pushar till `main`.

Monitor deployment på: https://vercel.com/cassandrawikgren/dogplanner

### Steg 8: Testa i produktion

1. **Registrering:** Skapa testkonto och verifiera län/kommun
2. **Fakturering:** Trigger manuell fakturagenerering via GitHub Actions
3. **Email:** Verifiera att emails skickas korrekt

---

## 🔍 Felsökning

### Problem: Invoice number genereras inte

**Lösning:** Kolla att trigger är aktiverad:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_invoice_number';
```

### Problem: Email skickas inte

**Lösning:** Kontrollera Resend API key och loggar:

```sql
SELECT * FROM function_logs
WHERE function_name = 'send_invoice_email'
ORDER BY created_at DESC
LIMIT 10;
```

### Problem: Län/kommun visas inte vid registrering

**Lösning:** Kolla att `swedishLocations.ts` importeras korrekt i register-komponenten.

---

## 📊 Monitoring

### Övervaka invoice runs

```sql
SELECT * FROM invoice_runs_summary
ORDER BY month_id DESC;
```

### Kolla senaste fakturor

```sql
SELECT invoice_number, status, sent_at, total_amount
FROM invoices
ORDER BY created_at DESC
LIMIT 10;
```

### Email-loggar

```sql
SELECT * FROM function_logs
WHERE function_name IN ('send_invoice_email', 'generate_invoices')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 Nästa steg (framtida förbättringar)

- [ ] Implementera PDF-generering för fakturor
- [ ] Lägg till email-prenumerationer (notifications preferences)
- [ ] Bygg dashboard för invoice_runs statistik
- [ ] Implementera automatiska påminnelser för obetalda fakturor
- [ ] Lägg till batch-email funktionalitet för marknadsföring

---

## 📚 Relaterade filer

### Migrations

- `supabase/migrations/20251117_improve_monthly_invoicing.sql`
- `supabase/migrations/20251117_auto_setup_org_location.sql`
- `supabase/migrations/20251117_email_notifications.sql`

### TypeScript/React

- `lib/emailTemplates.ts`
- `lib/emailSender.ts`
- `lib/swedishLocations.ts`
- `supabase/functions/generate_invoices/index.ts`

### Test & Dokumentation

- `test_invoice_system.sql`
- `DEPLOYMENT_GUIDE_2025-11-17.md` (denna fil)

---

**Skapad av:** GitHub Copilot  
**Datum:** 2025-11-17  
**Frågor?** Kör test-scriptet först, sen felsök med SQL-queries ovan.
