# FAKTURERINGSSYSTEM - Setup Guide

**Skapad:** 2025-11-22  
**Status:** Redo för deployment

---

## 🎯 VAD SOM IMPLEMENTERATS

### ✅ Email-funktionalitet

- Edge Function: `send_invoice_email`
- UI-knapp: "Skicka faktura" (visas för draft-fakturor)
- Professionell HTML email-mall
- Automatisk status-uppdatering (draft → sent)

### 📧 Email innehåller:

- Proffsig design med företagets namn
- Totalt belopp (stort och tydligt)
- Förfallodatum (orange varning)
- OCR-nummer / Fakturanummer
- Alla betalningsalternativ (Bankgiro, Plusgiro, Swish, IBAN)
- Företagets kontaktinfo
- Länk att ladda ner PDF

---

## 🚀 DEPLOYMENT - STEG FÖR STEG

### STEG 1: Skaffa Resend API-nyckel (5 min)

1. Gå till https://resend.com
2. Klicka "Sign Up" (gratis)
3. Bekräfta email
4. Gå till "API Keys" → "Create API Key"
5. Namnge den: "DogPlanner Production"
6. Kopiera nyckeln (börjar med `re_...`)

**Kostnad:** 0 kr (100 emails/dag gratis, 3000 emails/månad)

---

### STEG 2: Lägg till i Supabase Secrets (2 min)

1. Gå till Supabase Dashboard
2. Välj ert projekt
3. Gå till **Settings** → **Vault** (eller **Edge Functions** → **Secrets**)
4. Klicka "New secret"
5. Name: `RESEND_API_KEY`
6. Value: Din kopierade nyckel (börjar med `re_...`)
7. Klicka "Save"

---

### STEG 3: Deploy Edge Function (1 min)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031

# Deploy funktionen
supabase functions deploy send_invoice_email

# Verifiera att den är live
supabase functions list
```

**Expected output:**

```
Deployed Functions:
- send_invoice_email (deployed)
- generate_invoices (deployed)
```

---

### STEG 4: Testa med en test-faktura (3 min)

1. Gå till `/ekonomi` i din app
2. Hitta en draft-faktura (eller skapa en ny)
3. **VIKTIGT:** Kontrollera att ägaren har email-adress
4. Klicka "Skicka faktura"
5. Bekräfta dialogen
6. Vänta på bekräftelse: "✅ Faktura skickad till..."

**Kontrollera:**

- ✅ Email kommit fram (kolla inbox + spam)
- ✅ Faktura-status ändrad från "draft" → "sent"
- ✅ PDF inkluderad (länk i emailet)
- ✅ All info stämmer (belopp, förfallodatum, betalningsinfo)

---

### STEG 5: Verifiera Resend-domän (VALFRITT - för produktion)

**Varför?** För att emails ska komma från `faktura@dogplanner.se` istället för `noreply@resend.dev`

**Steg:**

1. Gå till Resend Dashboard → "Domains"
2. Klicka "Add Domain"
3. Ange: `dogplanner.se`
4. Resend ger dig DNS-poster (MX, TXT, DKIM)
5. Lägg till DNS-posterna hos er domän-leverantör
6. Vänta 24-48h på verifiering
7. Uppdatera Edge Function:
   ```typescript
   from: `${invoice.orgs.name} <faktura@dogplanner.se>`,
   ```

**Utan verifierad domän:** Emails skickas från `onboarding@resend.dev` (fungerar men ser mindre proffsigt ut)

---

## 🔒 SÄKERHET & POLICIES

### RLS Policy för faktura-skickning

Kör denna SQL i Supabase SQL Editor:

```sql
-- Endast admin kan skicka fakturor
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
  AND status = 'draft' -- Kan bara skicka draft-fakturor
);

COMMENT ON POLICY "admin_can_send_invoices" ON invoices IS
'Endast admin kan uppdatera fakturor från draft till sent';
```

**Vad denna gör:**

- ✅ Endast admin i organisationen kan skicka fakturor
- ✅ Endast draft-fakturor kan skickas
- ✅ Staff/vanliga användare kan inte skicka

---

## 📊 WORKFLOW

### Så fungerar det för företagen:

```
1. 🤖 System skapar fakturaunderlag automatiskt
   ├─ Pensionat: Vid utcheckning
   ├─ Hunddagis: 1:a varje månad (föregående månad)
   └─ Status: 'draft'

2. 👀 Admin granskar i /ekonomi
   ├─ Kontrollera belopp
   ├─ Kontrollera rader
   └─ Kontrollera ägare har email

3. 📧 Admin klickar "Skicka faktura"
   ├─ Bekräftelsedialog visas
   ├─ Email skickas till hundägare
   ├─ PDF inkluderas som länk
   └─ Status ändras: draft → sent

4. 💰 Hundägare betalar
   ├─ Till företagets bankgiro/Swish
   ├─ Företaget ser betalning i sin bank
   └─ Admin markerar som "betald" i systemet

5. ✅ Faktura markerad som 'paid'
   └─ Syns i statistik och rapporter
```

---

## 🐛 FELSÖKNING

### Problem: "❌ Kunde inte skicka faktura"

**Lösning 1: Kontrollera Resend API-nyckel**

```bash
# Verifiera att secret finns
supabase secrets list

# Om saknas, lägg till:
supabase secrets set RESEND_API_KEY=re_your_key_here
```

**Lösning 2: Kolla Edge Function logs**

```bash
# Öppna Supabase Dashboard
# Gå till Edge Functions → send_invoice_email → Logs

# Leta efter errors:
# - "Authorization failed" = Fel API-nyckel
# - "Owner has no email" = Lägg till email för ägaren
# - "Invoice status is sent" = Faktura redan skickad
```

---

### Problem: Email kommer inte fram

**Lösning 1: Kolla spam-mappen**

- Första emails kan hamna i spam
- Markera som "Not spam" för framtida emails

**Lösning 2: Verifiera domän (se Steg 5 ovan)**

- Verifierad domän ger bättre deliverability

**Lösning 3: Kontrollera mottagarens email**

```sql
-- Verifiera att owner har email
SELECT
  o.full_name,
  o.email,
  i.invoice_number
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
WHERE i.id = 'FAKTURA_ID_HÄR';
```

---

### Problem: PDF-länk fungerar inte

**Orsak:** PDF-generering kräver att `POST /api/pdf` fungerar

**Lösning:**

```bash
# Testa PDF-generering lokalt
curl -X POST http://localhost:3000/api/pdf?id=FAKTURA_ID

# Ska returnera PDF-bytes
# Om fel, kolla app/api/pdf/route.ts
```

---

## 📈 NÄSTA STEG (Framtida förbättringar)

### 1. PDF som bilaga (istället för länk)

**Nu:** Email innehåller länk till PDF  
**Senare:** Bifoga PDF direkt i emailet

**Implementation:**

```typescript
// I send_invoice_email/index.ts
// Hämta PDF först
const pdfResponse = await fetch(pdfUrl);
const pdfBlob = await pdfResponse.arrayBuffer();
const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBlob)));

// Bifoga i email
attachments: [
  {
    filename: `faktura-${invoice.invoice_number}.pdf`,
    content: pdfBase64,
    content_type: "application/pdf"
  }
]
```

---

### 2. Påminnelser (manuell funktion)

**Lägg till knapp:** "Skicka påminnelse" för sent-fakturor efter förfallodatum

```typescript
// Ny Edge Function: send_reminder_email
// Liknande send_invoice_email men:
// - Annat subject: "Påminnelse: Faktura XXX"
// - Orange/röd färg i email
// - Text: "Din faktura har förfallit, vänligen betala snarast"
```

---

### 3. Automatiska påminnelser (via Cron)

**Kör dagligen:**

```sql
-- Hitta förfallna fakturor utan påminnelse
SELECT * FROM invoices
WHERE status = 'sent'
AND due_date < CURRENT_DATE
AND sent_at < CURRENT_DATE - INTERVAL '7 days'
AND reminder_sent_at IS NULL;

-- Skicka påminnelse via Edge Function
-- Uppdatera reminder_sent_at
```

---

## ✅ CHECKLISTA - REDO FÖR PRODUKTION

- [ ] Resend-konto skapat
- [ ] API-nyckel tillagd i Supabase Secrets
- [ ] Edge Function deployed
- [ ] Test-email skickat och mottaget
- [ ] Email-layout ser bra ut (mobil + desktop)
- [ ] PDF-länk fungerar
- [ ] Status ändras från draft → sent
- [ ] RLS-policy körd (endast admin kan skicka)
- [ ] Domän verifierad (valfritt men rekommenderat)

---

## 💰 KOSTNADSKALKYL

### Gratis tier (Resend):

- 100 emails/dag
- 3000 emails/månad
- Perfekt för: 1-10 företag med 10-50 fakturor/månad vardera

### Paid tier ($20/mån):

- 3000 emails/månad
- Bra för: 10-30 företag

### Ert scenario (10 företag, 50 fakturor/månad vardera):

- 10 × 50 = 500 emails/månad
- **Kostnad: 0 kr** (väl inom gratis tier)

---

## 🎉 KLART!

Systemet är nu redo att skicka fakturor. Företagen kan:

1. Granska fakturaunderlag i `/ekonomi`
2. Klicka "Skicka faktura"
3. Hundägaren får proffsig email med PDF
4. Betalning går direkt till företagets konto
5. Företaget markerar som betald när pengar kommit

**Totalkostnad:** 0 kr/mån  
**Implementationstid:** 3-4 timmar  
**Underhåll:** Minimal (några minuter/månad)

---

**Frågor?** Kontrollera logs i Supabase Dashboard → Edge Functions → Logs
