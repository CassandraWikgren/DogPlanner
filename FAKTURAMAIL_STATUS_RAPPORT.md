# 🔍 FAKTURAMAIL SETUP - STATUSRAPPORT

**Datum:** 2025-11-22  
**Undersökning:** Befintliga Supabase-resurser för fakturamail

---

## ✅ VAD SOM REDAN FINNS

### 1. **Edge Function: send_invoice_email** ✅

**Plats:** `/supabase/functions/send_invoice_email/index.ts`

**Status:**

- ✅ Finns och är UPPDATERAD med SMTP2GO
- ✅ Använder `SMTP2GO_API_KEY` istället för Resend
- ✅ Komplett implementation (392 rader)

**Funktionalitet:**

- Hämtar faktura med owners + orgs data
- Validerar att owner har email
- Validerar att faktura är draft
- Genererar HTML email-mall
- Skickar via SMTP2GO API
- Uppdaterar status: draft → sent
- Sätter sent_at timestamp

### 2. **Database Function: send_invoice_email()** ✅

**Plats:** `/supabase/migrations/20251122160200_remote_schema.sql` (rad 1779-1827)

**Status:**

- ✅ Finns i databasen
- ⚠️ **MEN**: Detta är en GAMMAL placeholder-funktion
- ❌ Används INTE längre (Edge Function ersätter den)

**Vad den gör:**

- Loggar att email "skulle skickas"
- Returnerar success utan att faktiskt skicka
- Markerad som TODO: "Integrera med emailSender.ts"

**Rekommendation:** Kan ignoreras - Edge Function är den riktiga implementationen

### 3. **RLS Policies för invoices** ✅

**Status:** Finns redan följande policies:

```sql
-- 1. SELECT: Läs fakturor i egen org
CREATE POLICY "select_invoices_in_org"
ON invoices FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2. INSERT: Skapa fakturor i egen org
CREATE POLICY "insert_invoices_in_org"
ON invoices FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 3. UPDATE: Uppdatera fakturor i egen org
CREATE POLICY "update_invoices_in_org"
ON invoices FOR UPDATE
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

**Analys:**

- ✅ Grundläggande policies finns
- ⚠️ **MEN**: Ingen specifik "endast admin kan skicka fakturor" policy
- ⚠️ Nuvarande policy tillåter ALLA i organisationen att uppdatera fakturor
- ❌ **SÄKERHETSPROBLEM**: Staff kan också ändra status till "sent"

---

## ⚠️ VAD SOM SAKNAS / BEHÖVER FIXAS

### 1. **Specifik "Admin can send invoices" policy** ❌

**Problem:**
Nuvarande `update_invoices_in_org` tillåter ALLA användare i org att uppdatera fakturor, även staff.

**Lösning:**
Behöver lägga till ny policy som begränsar status-ändringar till endast admin:

```sql
-- Ny policy: Endast admin kan skicka fakturor (ändra draft → sent)
CREATE POLICY "admin_can_send_invoices"
ON invoices
FOR UPDATE
USING (
  -- Måste vara admin i organisationen
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = invoices.org_id
    AND profiles.role = 'admin'
  )
  -- OCH faktura måste vara draft
  AND status = 'draft'
);
```

**Viktigt:** Denna policy behöver INTE ersätta `update_invoices_in_org`, utan fungerar tillsammans med den för att ge mer specifik kontroll.

### 2. **SMTP2GO_API_KEY i Supabase Vault** ❌

**Status:** Finns INTE ännu (behöver läggas till)

**Hur:**

1. Gå till Supabase Dashboard
2. Settings → Vault
3. Lägg till secret: `SMTP2GO_API_KEY` = `api-...`

### 3. **Deploy Edge Function** ❌

**Status:** Edge Function finns lokalt men är INTE deployed till Supabase

**Hur:**

```bash
supabase functions deploy send_invoice_email
```

---

## 📋 KOMPLETTA DEPLOYMENT STEG

### ✅ Steg 1: Verifiera befintlig setup

**Status:** KLART - Vi har verifierat att:

- Edge Function finns och är uppdaterad
- Grundläggande RLS policies finns
- Database function finns (men ersätts av Edge Function)

### 🔧 Steg 2: Lägg till säkerhetspoliny (KÖR I SUPABASE)

```sql
-- Ta bort gammal om den finns
DROP POLICY IF EXISTS "admin_can_send_invoices" ON invoices;

-- Skapa ny policy: Endast admin kan skicka fakturor
CREATE POLICY "admin_can_send_invoices"
ON invoices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = invoices.org_id
    AND profiles.role = 'admin'
  )
  AND status = 'draft'
);

-- Lägg till kommentar
COMMENT ON POLICY "admin_can_send_invoices" ON invoices IS
'Endast admin kan uppdatera fakturor från draft till sent';
```

### 🔑 Steg 3: Lägg till SMTP2GO API-nyckel

1. Skapa SMTP2GO konto: https://www.smtp2go.com/pricing/
2. Kopiera API-nyckel från Settings → Users → API Keys
3. Supabase Dashboard → Settings → Vault → New Secret
   - Name: `SMTP2GO_API_KEY`
   - Value: `api-...`

### 🚀 Steg 4: Deploy Edge Function

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase functions deploy send_invoice_email
```

### ✅ Steg 5: Verifiera deployment

```sql
-- Kolla att policy finns
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'invoices'
AND policyname = 'admin_can_send_invoices';

-- Hitta test-faktura
SELECT i.id, i.invoice_number, i.status, o.email
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
WHERE i.status = 'draft'
AND o.email IS NOT NULL
LIMIT 1;
```

### 🎯 Steg 6: Testa i appen

1. Gå till `/ekonomi`
2. Klicka "Skicka faktura" på en draft
3. Bekräfta dialogen
4. ✅ Verifiera att email kom fram
5. ✅ Verifiera att status ändrades till "sent"

---

## 🎉 SLUTSATS

**Vad vi INTE behöver göra:**

- ❌ Skapa Edge Function (finns redan!)
- ❌ Uppdatera UI med knapp (finns redan!)
- ❌ Skapa email-template (finns redan i Edge Function!)

**Vad vi BEHÖVER göra:**

1. ✅ Kör SQL för säkerhetspolicy (5 sek)
2. ✅ Skaffa SMTP2GO konto + API-nyckel (5 min)
3. ✅ Lägg till SMTP2GO_API_KEY i Vault (1 min)
4. ✅ Deploy Edge Function (1 min)
5. ✅ Testa (2 min)

**Total tid:** ~10 minuter 🚀

---

## 📄 FILER ATT ANVÄNDA

1. **SQL att köra:** `/FAKTURAMAIL_SQL_SETUP.sql` (redan fixad med DROP IF EXISTS)
2. **Setup-guide:** `/FAKTURAMAIL_SMTP2GO_SETUP.md`
3. **Edge Function:** `/supabase/functions/send_invoice_email/index.ts` (redo!)

---

**Nästa steg:** Följ Steg 2-6 ovan för deployment! 🎯
