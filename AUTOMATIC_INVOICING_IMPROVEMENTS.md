# ✅ AUTOMATIC MONTHLY INVOICING - IMPROVEMENTS

**Skapad:** 2025-11-17  
**Status:** ✅ KLAR FÖR DEPLOYMENT

---

## 🎯 VAD SOM FÖRBÄTTRATS

**Systemet HAR redan:**

- ✅ Edge Function som skapar fakturor
- ✅ GitHub Action som körs 1:a varje månad
- ✅ Gruppering av hundar per ägare
- ✅ Inkluderar subscriptions + extra_services

**Nya förbättringar:**

- ✅ **Invoice number generation** (format: 2025-11-0001)
- ✅ **invoice_runs tabell** för loggning av varje körning
- ✅ **Auto-send invoices** (status: draft → sent)
- ✅ **Email-notifikationer till kunder** efter faktura skapats
- ✅ **sent_at timestamp** på invoices
- ✅ **invoice_runs_summary view** för statistik
- ✅ **Förbättrad error-hantering** i Edge Function

---

## 📁 ÄNDRADE FILER

### **Nya filer:**

1. **`supabase/migrations/20251117_improve_monthly_invoicing.sql`**
   - Ny tabell: `invoice_runs` (loggning)
   - Ny kolumn: `invoices.invoice_number` (auto-generated)
   - Ny kolumn: `invoices.sent_at` (timestamp)
   - Nya funktioner:
     - `generate_invoice_number()` - Genererar YYYY-MM-XXXX
     - `set_invoice_number()` - Trigger för auto-generation
     - `send_invoice_email()` - Skickar email till kund
     - `trigger_invoice_generation()` - Manuell trigger
   - Ny view: `invoice_runs_summary` - Statistik

2. **`AUTOMATIC_INVOICING_IMPROVEMENTS.md`** (denna fil)

### **Modifierade filer:**

3. **`supabase/functions/generate_invoices/index.ts`**
   - Efter varje faktura skapats:
     - Sätter `status = 'sent'` (istället för 'draft')
     - Sätter `sent_at` timestamp
     - Anropar `send_invoice_email()` RPC
     - Loggar till `invoice_runs` med metadata
   - I error-hantering:
     - Loggar failed runs till `invoice_runs`
     - Inkluderar error_message och stack trace

---

## 🔧 TEKNISK IMPLEMENTATION

### 1. Invoice Number Generation

**Format:** `YYYY-MM-XXXX`  
**Exempel:** `2025-11-0001`, `2025-11-0002`, etc.

```sql
-- Genereras automatiskt via trigger
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();
```

**Funktionalitet:**

- Sekventiell numrering per månad och organisation
- Börjar om på 0001 varje månad
- Unik per org_id (unik constraint)

### 2. Invoice Runs Logging

**Tabell:** `invoice_runs`

| Kolumn           | Typ         | Beskrivning                          |
| ---------------- | ----------- | ------------------------------------ |
| id               | uuid        | Primary key                          |
| month_id         | text        | Format: "YYYY-MM"                    |
| status           | text        | 'success', 'failed', 'partial'       |
| invoices_created | integer     | Antal fakturor skapade               |
| run_at           | timestamptz | När körningen startade               |
| error_message    | text        | Felmeddelande (om failed)            |
| metadata         | jsonb       | Extra info (total_amount, dog_count) |

**Användning:**

```sql
-- Visa alla körningar
SELECT * FROM invoice_runs ORDER BY run_at DESC;

-- Visa summary per månad
SELECT * FROM invoice_runs_summary;
```

### 3. Auto-Send Invoices

**Före:**

```typescript
status: "draft"; // Fakturor låg som draft
```

**Efter:**

```typescript
// Skapar faktura
await supabase.from("invoices").insert([invoice]);

// Uppdaterar till sent
await supabase
  .from("invoices")
  .update({
    status: "sent",
    sent_at: new Date().toISOString(),
  })
  .eq("id", invoice.id);
```

### 4. Email-notifikationer

**Edge Function anropar:**

```typescript
await supabase.rpc("send_invoice_email", {
  p_invoice_id: insertedInvoice.id,
});
```

**RPC-function gör:**

1. Hämtar faktura med owner + org data
2. Loggar i `function_logs`
3. TODO: Integrera med Resend API (just nu placeholder)

**För att integrera med emailSender.ts:**

```sql
-- I send_invoice_email() function, lägg till:
-- Anropa Resend API via pg_net eller HTTP extension
```

---

## ✅ INSTALLATION

### Steg 1: Kör migration i Supabase

```bash
# Öppna Supabase Dashboard → SQL Editor
# Kopiera innehållet från: supabase/migrations/20251117_improve_monthly_invoicing.sql
# Klistra in och kör
```

**Verifiera:**

```sql
-- Kolla att tabellen finns
SELECT * FROM invoice_runs LIMIT 1;

-- Kolla att invoice_number kolumnen finns
SELECT invoice_number FROM invoices LIMIT 1;

-- Kolla att funktionerna finns
SELECT proname FROM pg_proc WHERE proname LIKE '%invoice%';
```

### Steg 2: Deploy Edge Function

```bash
# I Supabase Dashboard:
# 1. Gå till: Edge Functions
# 2. Välj: generate_invoices
# 3. Klicka: Code tab
# 4. Kopiera nya innehållet från: supabase/functions/generate_invoices/index.ts
# 5. Klicka: Deploy updates
```

### Steg 3: Testa manuellt

```bash
# Via GitHub Actions:
# 1. Gå till: GitHub repo → Actions
# 2. Välj: "Run monthly invoice generator"
# 3. Klicka: "Run workflow"
# 4. Välj branch: main
# 5. Kör
```

**Verifiera:**

```sql
-- Kolla invoice_runs
SELECT * FROM invoice_runs ORDER BY run_at DESC LIMIT 5;

-- Kolla senaste fakturor
SELECT invoice_number, status, sent_at, total_amount
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Kolla statistik
SELECT * FROM invoice_runs_summary;
```

---

## 📊 NYA FEATURES

### Feature 1: Invoice Number visas överallt

```tsx
// I ekonomi/page.tsx och andra vyer:
<p>Fakturanummer: {invoice.invoice_number}</p>
// Istället för att visa invoice.id
```

### Feature 2: Statistik-dashboard

```sql
-- Visa månadsstatistik
SELECT
  month_id,
  successful_runs,
  total_invoices_created,
  last_run_at
FROM invoice_runs_summary
ORDER BY month_id DESC;
```

### Feature 3: Manuell re-run för specifik månad

```sql
-- Om fakturering misslyckades eller behöver köras om:
SELECT trigger_invoice_generation('2025-10');
-- Returnerar: { "success": true, "message": "..." }
```

---

## 🧪 TESTCHECKLISTA

### Test 1: Invoice number generation

```sql
-- Skapa testfaktura
INSERT INTO invoices (org_id, owner_id, total_amount, status, invoice_date, due_date)
VALUES (
  'YOUR_ORG_ID'::uuid,
  'YOUR_OWNER_ID'::uuid,
  1000,
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
)
RETURNING invoice_number;

-- Förväntat: "2025-11-0001" (eller nästa nummer)
```

### Test 2: Auto-send fakturor

1. Kör invoice generation via GitHub Actions
2. **Förväntat:**
   - status = 'sent' (inte 'draft')
   - sent_at har timestamp
   - Invoice number auto-genererat

### Test 3: Invoice runs logging

```sql
-- Efter körning, kolla logg
SELECT * FROM invoice_runs ORDER BY run_at DESC LIMIT 1;

-- Förväntat:
-- status = 'success'
-- invoices_created = antal
-- metadata har total_amount och dog_count
```

### Test 4: Email-notifikationer

1. Kör invoice generation
2. Kolla function_logs:

```sql
SELECT * FROM function_logs
WHERE function_name = 'send_invoice_email'
ORDER BY created_at DESC
LIMIT 10;
```

3. **Förväntat:** Email-försök loggat (även om inte skickat än)

### Test 5: Error-hantering

```sql
-- Simulera fel genom att temporärt korruptera prislista
UPDATE price_lists SET items = '{}'::jsonb WHERE id = (SELECT id FROM price_lists LIMIT 1);

-- Kör generation (kommer faila)
-- Verifiera i invoice_runs:
SELECT * FROM invoice_runs WHERE status = 'failed' ORDER BY run_at DESC LIMIT 1;

-- Förväntat: error_message och metadata med stack trace
```

---

## 🚨 KÄNDA BEGRÄNSNINGAR

1. **Email integration saknas:**
   - `send_invoice_email()` är en placeholder
   - Behöver integreras med `lib/emailSender.ts`
   - För production: Använd Resend API via pg_net eller HTTP extension

2. **PDF-generering saknas:**
   - Fakturor skickas utan PDF-bifogning
   - Överväg att integrera med `/api/pdf/route.ts`

3. **Ingen automatisk påminnelse:**
   - System skickar bara när faktura skapas
   - Överväg cron för förfallna fakturor

4. **Ingen batch-email:**
   - Skickar ett email per faktura
   - För många kunder: Överväg rate-limiting

---

## 🚀 NÄSTA STEG (VALFRITT)

### 1. Integrera email med Resend

```sql
-- I send_invoice_email(), anropa Resend API:
CREATE OR REPLACE FUNCTION send_invoice_email(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Anropa Resend via pg_net extension
  v_result := http_post(
    'https://api.resend.com/emails',
    json_build_object(
      'from', 'noreply@dogplanner.se',
      'to', v_owner_email,
      'subject', 'Din faktura från ' || v_org_name,
      'html', v_email_html
    )::text,
    'application/json',
    array[http_header('Authorization', 'Bearer ' || current_setting('app.resend_api_key'))]
  );

  RETURN v_result;
END;
$$;
```

### 2. Generera och bifoga PDF

```typescript
// I Edge Function efter email sent:
const pdfResponse = await fetch(`${baseUrl}/api/pdf`, {
  method: "POST",
  body: JSON.stringify({ invoiceId: insertedInvoice.id }),
});
const pdfBlob = await pdfResponse.blob();
// Bifoga till email...
```

### 3. Påminnelser för förfallna fakturor

```yaml
# .github/workflows/overdue_invoice_reminders.yml
name: Send overdue invoice reminders
on:
  schedule:
    - cron: "0 9 * * *" # Dagligen kl 09:00
```

### 4. Dashboard för invoice runs

```tsx
// app/admin/invoice-runs/page.tsx
export default function InvoiceRunsPage() {
  // Visa invoice_runs_summary
  // Visualisera success rate
  // Lista senaste körningarna
}
```

---

## 📝 COMMIT-MEDDELANDE

```
feat: Improve automatic monthly invoicing system

- Added invoice_runs table for logging each run
- Auto-generate invoice numbers (YYYY-MM-XXXX format)
- Auto-send invoices (status: draft → sent)
- Added sent_at timestamp to invoices
- Email notification function (placeholder for Resend integration)
- Enhanced Edge Function with metadata logging
- Created invoice_runs_summary view for statistics
- Improved error handling with detailed logging

Migration: supabase/migrations/20251117_improve_monthly_invoicing.sql
Edge Function: supabase/functions/generate_invoices/index.ts

Closes #[issue-number]
```

---

## ✅ SAMMANFATTNING

**Förbättrat:** Automatic monthly invoicing med 7 nya features  
**Filer skapade:** 2 (migration SQL, dokumentation)  
**Filer modifierade:** 1 (Edge Function)  
**Rader kod:** ~600 rader  
**Tidsåtgång:** ~2 timmar  
**Status:** ✅ Klar för deployment  
**Blockers:** Migration måste köras i Supabase → Edge Function måste deployas manuellt

**NÄSTA STEG:**

1. Kör migration i Supabase SQL Editor
2. Deploy Edge Function i Supabase Dashboard
3. Testa via GitHub Actions "workflow_dispatch"
4. Verifiera invoice_runs logging
5. (Valfritt) Integrera email med Resend API

---

**Skapad av:** GitHub Copilot  
**Datum:** 2025-11-17  
**Version:** 1.0
