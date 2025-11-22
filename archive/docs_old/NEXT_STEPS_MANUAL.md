# 🎯 Nästa Steg - Vad du behöver göra manuellt

## ✅ Klart (Automatiskt)

- ✅ Alla SQL-migrationer körda i Supabase
- ✅ Kod pushad till GitHub
- ✅ Vercel kommer deploya automatiskt
- ✅ Edge Function redan uppdaterad

---

## 📋 Manuella steg kvar

### 1️⃣ Verifiera i Supabase SQL Editor (2 min)

Kör detta för att säkerställa att allt är OK:

```sql
-- Öppna: https://supabase.com/dashboard/project/[ditt-projekt]/sql/new
-- Klistra in test_invoice_system.sql och kör
```

Förväntat resultat:

```
✅ invoice_runs table: EXISTS
✅ invoice_number column: EXISTS
✅ sent_at column: EXISTS
✅ generate_invoice_number(): 2025-11-0001
✅ org location fields: EXISTS
✅ handle_new_user trigger: EXISTS
```

---

### 2️⃣ Lägg till Resend API Key i Vercel (1 min)

1. Gå till: https://vercel.com/cassandrawikgren/dogplanner/settings/environment-variables
2. Lägg till:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxx` (ditt Resend API key)
   - **Environment:** Production, Preview, Development
3. Klicka "Save"
4. Redeploy senaste deployment (Vercel frågar automatiskt)

**Hur hittar jag mitt Resend API key?**

- Gå till: https://resend.com/api-keys
- Skapa nytt om du inte har: "Create API Key"
- Kopiera nyckeln (börjar med `re_`)

---

### 3️⃣ Testa registrering (3 min)

1. Öppna din app i inkognitoläge
2. Gå till `/register`
3. Fyll i formulär:
   - Email: `test@example.com`
   - Lösenord: `Test123!`
   - Org namn: `Testdagis AB`
   - Org nummer: `556123-4567`
   - Telefon: `0701234567`
   - **Län:** Välj från dropdown (t.ex. "Stockholm")
   - **Kommun:** Välj från dropdown (t.ex. "Stockholm")
4. Klicka "Registrera"

**Verifiera i Supabase:**

```sql
-- Kolla senaste organisationen
SELECT name, lan, kommun, service_types, created_at
FROM orgs
ORDER BY created_at DESC
LIMIT 1;

-- Förväntat: län och kommun ska vara ifyllda!
```

---

### 4️⃣ Testa fakturagenerering (5 min)

**OBS:** Du kan bara göra detta om du har hundar och subscriptions i databasen!

#### Via GitHub Actions:

1. Gå till: https://github.com/CassandraWikgren/DogPlanner/actions/workflows/auto_generate_invoices.yml
2. Klicka "Run workflow"
3. Välj branch: `main`
4. Klicka "Run workflow"
5. Vänta ~30 sekunder
6. Klicka på workflow-körningen för att se loggar

#### Verifiera resultat:

```sql
-- Kolla att invoice_runs loggats
SELECT * FROM invoice_runs_summary;

-- Kolla senaste fakturor
SELECT invoice_number, status, sent_at, total_amount
FROM invoices
ORDER BY created_at DESC
LIMIT 5;

-- Förväntat:
-- - invoice_number: "2025-11-0001", "2025-11-0002", etc.
-- - status: "sent" (INTE "draft"!)
-- - sent_at: timestamp ifylld
```

---

### 5️⃣ Testa email (om du vill, 2 min)

```sql
-- Skicka test-email för en faktura
SELECT send_invoice_email(
  (SELECT id FROM invoices ORDER BY created_at DESC LIMIT 1)
);
```

**Kolla loggen:**

```sql
SELECT * FROM function_logs
WHERE function_name = 'send_invoice_email'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🚨 Om något går fel

### Problem: "Ingen län/kommun visas vid registrering"

**Orsak:** TypeScript-filen kanske inte kompileras ännu  
**Lösning:** Vänta på Vercel deployment, eller kör lokalt: `npm run dev`

### Problem: "Invoice number är NULL"

**Orsak:** Trigger kanske inte är aktiv  
**Lösning:** Kör denna SQL:

```sql
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();
```

### Problem: "Email skickas inte"

**Orsak:** Resend API key saknas eller fel  
**Lösning:**

1. Kolla i Vercel Environment Variables
2. Testa lokalt först med `.env.local`
3. Kolla function_logs för felbeskrivning

---

## ✨ När allt fungerar

Du har nu:

- ✅ Email-notifikationer på 4 ställen (ansökan flow)
- ✅ Auto-ifyllning av län/kommun vid registrering
- ✅ Automatisk fakturagenerering varje månad
- ✅ Invoice numbers som 2025-11-0001
- ✅ Fakturor skickas automatiskt (sent status)
- ✅ Email till kunder när faktura skapas
- ✅ Loggning av alla invoice runs för statistik

**Grattis! 🎉**

---

## 📊 Monitoring (löpande)

Kör dessa queries regelbundet för att övervaka systemet:

```sql
-- Dagens statistik
SELECT
  COUNT(*) as total_invoices_today,
  SUM(total_amount) as total_amount_today,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_today
FROM invoices
WHERE created_at::date = CURRENT_DATE;

-- Månadens invoice runs
SELECT * FROM invoice_runs_summary
WHERE month_id = to_char(CURRENT_DATE, 'YYYY-MM');

-- Email success rate
SELECT
  function_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'error') as errors
FROM function_logs
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY function_name;
```

---

**Skapad:** 2025-11-17  
**Nästa review:** Efter första månadens fakturering (2025-12-01)
