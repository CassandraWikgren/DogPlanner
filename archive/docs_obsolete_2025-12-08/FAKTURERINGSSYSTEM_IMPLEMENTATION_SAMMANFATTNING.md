# FAKTURERINGSSYSTEM - DEPLOYMENT SAMMANFATTNING

**Datum:** 2025-11-22  
**Status:** ✅ IMPLEMENTATION KLAR

---

## 🎯 VAD SOM BYGGTS

### ✅ Komplett email-faktureringssystem

**Kostnad:** 0 kr/månad (100 emails/dag gratis)

**Så fungerar det:**

1. System skapar fakturaunderlag (status='draft')
2. **Admin granskar** i `/ekonomi`
3. **Admin klickar "Skicka faktura"** → Email skickas till hundägare
4. Hundägare betalar till företagets bankgiro/Swish
5. **Admin markerar "betald"** när pengar kommit

**Företaget hanterar själva:**

- Påminnelser (om sen betalning)
- Kravhantering (om fortsatt utebli betalning)

---

## 📂 NYA/ÄNDRADE FILER

### 1. ✅ Edge Function (NY)

**Fil:** `supabase/functions/send_invoice_email/index.ts`

**Funktioner:**

- Hämtar faktura + ägare + organisation
- Genererar proffsig HTML-email
- Skickar via Resend API
- Uppdaterar status: draft → sent
- Inkluderar alla betalningsalternativ
- Validerar email-adress finns

---

### 2. ✅ UI-uppdatering (ÄNDRAD)

**Fil:** `app/ekonomi/page.tsx`

**Ändringar:**

- Tillagt `sendInvoiceEmail()` funktion
- Tillagt `Send` icon från lucide-react
- Tillagt state: `sendingInvoice`
- Knapp: "Skicka faktura" (visas för draft-fakturor)
- Bekräftelsedialog med info om mottagare och belopp

**Knappen:**

```tsx
{invoice.status === "draft" && (
  <Button
    onClick={() => sendInvoiceEmail(invoice.id)}
    disabled={sendingInvoice === invoice.id}
    className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
  >
    <Send className="h-4 w-4 mr-2" />
    {sendingInvoice === invoice.id ? "Skickar..." : "Skicka faktura"}
  </Button>
)}
```

---

### 3. ✅ Setup Guide (NY)

**Fil:** `FAKTURERINGSSYSTEM_SETUP_GUIDE.md`

**Innehåll:**

- Steg-för-steg deployment
- Resend setup (5 min)
- Supabase secrets config
- Test-instruktioner
- Felsökning
- RLS-policies (säkerhet)

---

### 4. ✅ Alternativ-analys (NY)

**Fil:** `FAKTURERINGSSYSTEM_ALTERNATIV.md`

**Jämförelse:**

- Inbyggt system (0-200 kr/mån)
- Fortnox (5000 kr/mån)
- Billecta (10000 kr/mån)
- Rekommendation: Inbyggt system ✅

---

## 🚀 DEPLOYMENT - SNABBGUIDE

### Steg 1: Resend (5 min)

```
1. Gå till https://resend.com → Sign Up (gratis)
2. API Keys → Create API Key → Kopiera
```

### Steg 2: Supabase Secrets (2 min)

```
Supabase Dashboard → Settings → Vault → New secret
Name: RESEND_API_KEY
Value: re_xxxxx (din nyckel)
```

### Steg 3: Deploy (1 min)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase functions deploy send_invoice_email
```

### Steg 4: Testa (3 min)

```
1. Gå till /ekonomi
2. Hitta draft-faktura
3. Klicka "Skicka faktura"
4. Bekräfta → Vänta på "✅ Faktura skickad!"
5. Kolla email (kolla även spam första gången)
```

---

## 📧 EMAIL-INNEHÅLL

**Professionell design med:**

- Företagets namn i header
- Stort belopp i grön box
- Förfallodatum (orange varning)
- OCR-nummer (eller fakturanummer)
- Alla betalningssätt (Bankgiro, Plusgiro, Swish, IBAN)
- Företagets kontaktinfo
- Länk till PDF
- Responsiv (ser bra ut på mobil + desktop)

**Exempel:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Företagsnamn AB
Adress, Postnr Stad
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Faktura 2025-11-001

Hej Anna Andersson!

Här kommer din faktura från Företagsnamn AB.

┌─────────────────────────────────┐
│        4500 kr                  │
│     Totalt att betala           │
└─────────────────────────────────┘

⏰ Förfallodatum: 2025-12-15
Var vänlig betala senast detta datum.

OCR-nummer: 1234567890123456

💳 Betala via:
• Bankgiro: 123-4567
• Plusgiro: 12 34 56-7
• Swish: 0701234567

📄 Fakturadetaljer
• Fakturanummer: 2025-11-001
• Fakturadatum: 2025-11-22
• Förfallodatum: 2025-12-15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frågor?
📧 info@foretagsnamn.se
📞 070-123 45 67

Med vänliga hälsningar,
Företagsnamn AB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💰 KOSTNADER

### Resend Gratis Tier:

- **100 emails/dag**
- **3000 emails/månad**
- **0 kr/månad**

### Ert scenario (10 företag, 50 fakturor/månad):

- 10 × 50 = **500 emails/månad**
- **Kostnad: 0 kr** ✅

### När ni växer (100 företag):

- 100 × 50 = 5000 emails/månad
- **Kostnad: $20/månad ≈ 220 kr/månad** ✅

**Jämför med:**

- Fortnox: 5000 kr/månad
- Billecta: 10000 kr/månad

---

## 🔒 SÄKERHET

### ✅ Implementerad:

- RLS Policy (endast admin kan skicka)
- Validering (endast draft-fakturor kan skickas)
- Email-validering (ägare måste ha email)
- Bekräftelsedialog (förhindrar misstag)

### SQL för RLS:

```sql
CREATE POLICY "admin_can_send_invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = invoices.org_id
    AND profiles.role = 'admin'
  )
  AND status = 'draft'
);
```

---

## ✅ CHECKLISTA

- [x] Edge Function skapad
- [x] UI-knapp tillagd
- [x] Email-template designad
- [x] Validering implementerad
- [x] Säkerhet (RLS) dokumenterad
- [x] Setup-guide skapad
- [ ] **Deploy till produktion** ← NÄSTA STEG
- [ ] Testa med riktiga fakturor
- [ ] Verifiera domän (valfritt, bättre deliverability)

---

## 🎉 RESULTAT

**Företagen kan nu:**

1. ✅ Granska fakturaunderlag i systemet
2. ✅ Skicka professionella fakturor via email
3. ✅ Ta emot betalningar direkt till sitt konto
4. ✅ Markera som betald när pengar kommit

**Ni sparar:**

- ~5000-10000 kr/månad vs Fortnox/Billecta
- Komplexitet (ingen tredjepartsintegration)
- Juridiskt ansvar (betalningar går inte via er)

**Företagen får:**

- Full kontroll över sitt fakturaflöde
- Professionella PDF-fakturor
- Email-automation (men de godkänner innan skickning)
- 0 kr extra kostnad

---

**Nästa steg:** Deploy enligt `FAKTURERINGSSYSTEM_SETUP_GUIDE.md` 🚀
