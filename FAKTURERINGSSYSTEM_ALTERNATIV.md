# AKTIVERA FAKTURERINGSSYSTEM - Implementation Guide

**Syfte:** Låt företag skicka fakturor direkt från systemet till hundägare  
**Status:** Systemet är 90% klart, behöver bara aktivera send-funktionen

---

## 🎯 VAD SOM REDAN FINNS

### ✅ Komplett fakturaunderlag-system

- Skapar fakturaunderlag automatiskt (pensionat + hunddagis)
- OCR-nummer genereras (16 siffror med Luhn-check)
- Sekvensnumrering (per organisation)
- PDF-generering fungerar (`/api/pdf/route.ts`)
- Betalningsinformation (bankgiro, plusgiro, Swish, IBAN)

### ✅ UI för granskning

- `/ekonomi` - Företaget ser alla fakturaunderlag
- `/faktura` - Detaljerad fakturavy
- Status-hantering: draft → sent → paid
- "Markera som betald" knapp

### ⚠️ VAD SOM SAKNAS (enkelt att fixa)

- Email-funktionalitet är **avstängd** (vi tog bort den för att ni sa "bara underlag")
- Behöver återaktivera med säkerhets-kontroll (admin måste godkänna)

---

## 🔧 IMPLEMENTATION - 3 ENKLA STEG

### STEG 1: Aktivera Email-skickning (30 min)

**A. Skapa email-template:**

```typescript
// supabase/functions/send_invoice_email/index.ts (NYTT)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { invoice_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Hämta faktura + PDF
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      owners (full_name, email),
      orgs (name, email, phone)
    `)
    .eq("id", invoice_id)
    .single();

  if (!invoice || !invoice.owners.email) {
    return new Response("No email found", { status: 400 });
  }

  // 2. Generera PDF (via intern API)
  const pdfUrl = `${Deno.env.get("SUPABASE_URL")}/api/pdf?id=${invoice_id}`;

  // 3. Skicka via Resend (eller annan email-tjänst)
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${invoice.orgs.name} <faktura@dogplanner.se>`,
      to: invoice.owners.email,
      subject: `Faktura ${invoice.invoice_number} från ${invoice.orgs.name}`,
      html: `
        <h2>Faktura ${invoice.invoice_number}</h2>
        <p>Hej ${invoice.owners.full_name}!</p>
        <p>Här kommer din faktura från ${invoice.orgs.name}.</p>

        <h3>Betalningsinformation:</h3>
        <p><strong>Totalt att betala:</strong> ${invoice.total_amount} kr</p>
        <p><strong>Förfallodatum:</strong> ${invoice.due_date}</p>
        <p><strong>OCR-nummer:</strong> ${invoice.ocr_number}</p>

        <h3>Betala via:</h3>
        <ul>
          <li><strong>Bankgiro:</strong> ${invoice.orgs.bankgiro || 'Ej angivet'}</li>
          <li><strong>Plusgiro:</strong> ${invoice.orgs.plusgiro || 'Ej angivet'}</li>
          <li><strong>Swish:</strong> ${invoice.orgs.swish_number || 'Ej angivet'}</li>
        </ul>

        <p>Fakturan är bifogad som PDF.</p>

        <p>Vid frågor, kontakta oss på ${invoice.orgs.email} eller ${invoice.orgs.phone}.</p>

        <p>Med vänliga hälsningar,<br>${invoice.orgs.name}</p>
      `,
      attachments: [
        {
          filename: `faktura-${invoice.invoice_number}.pdf`,
          path: pdfUrl
        }
      ]
    })
  });

  if (!emailResponse.ok) {
    return new Response("Email send failed", { status: 500 });
  }

  // 4. Uppdatera faktura till 'sent'
  await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString()
    })
    .eq("id", invoice_id);

  return new Response("Email sent", { status: 200 });
});
```

**B. Uppdatera UI - Lägg till "Skicka faktura" knapp:**

```tsx
// I /app/ekonomi/page.tsx eller /app/faktura/page.tsx

async function sendInvoice(invoiceId: string) {
  if (!confirm("Är du säker på att du vill skicka denna faktura till kunden?")) {
    return;
  }

  try {
    setLoading(true);

    // Anropa Edge Function
    const { data, error } = await supabase.functions.invoke(
      "send_invoice_email",
      { body: { invoice_id: invoiceId } }
    );

    if (error) throw error;

    alert("✅ Faktura skickad till kund!");
    await fetchInvoices(); // Uppdatera listan
  } catch (err) {
    console.error(err);
    alert("❌ Fel vid skickning av faktura");
  } finally {
    setLoading(false);
  }
}

// I JSX:
{invoice.status === "draft" && (
  <Button onClick={() => sendInvoice(invoice.id)}>
    📧 Skicka faktura till kund
  </Button>
)}
```

---

### STEG 2: Email-leverantör (Resend - Rekommenderat)

**Varför Resend?**

- ✅ 100 emails/dag GRATIS (räcker långt för er)
- ✅ 3000 emails/månad för $20 (när ni växer)
- ✅ Enkel integration med Supabase
- ✅ Bifoga PDF direkt
- ✅ Svenskt företagsnamn som avsändare

**Setup (5 min):**

```bash
1. Gå till https://resend.com
2. Skapa konto (gratis)
3. Verifiera er domän (t.ex. faktura@dogplanner.se)
4. Kopiera API-nyckel
5. Lägg till i Supabase Secrets:
   RESEND_API_KEY=re_xxxxx
```

**Alternativ email-leverantörer:**

- **SendGrid:** 100 emails/dag gratis
- **Mailgun:** 5000 emails/månad första månaden gratis, sen $35/mån
- **AWS SES:** $0.10 per 1000 emails (billigast för stora volymer)

---

### STEG 3: Säkerhet & Access Control

**Lägg till RLS-policy:**

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
```

---

## 💰 KOSTNADSANALYS

### Alternativ 1: Inbyggt system (Rekommenderat)

**Engångskostnad:**

- Implementation: 2-4 timmar utveckling
- Email-leverantör setup: 5 min

**Löpande kostnad:**

- Resend Free: 0 kr (100 emails/dag)
- Resend Paid: $20/mån (3000 emails)
- **TOTALT:** 0-200 kr/mån

**Fördelar:**

- ✅ Full kontroll
- ✅ Ingen mellanhänder
- ✅ Kunddata stannar hos er
- ✅ Anpassningsbar
- ✅ Kunden betalar direkt till företaget

**Nackdelar:**

- ⚠️ Företaget måste hantera betalningspåminnelser själva
- ⚠️ Ingen automatisk kravhantering

---

### Alternativ 2: Fakturaservice (Fortnox, Visma, Billecta)

**Engångskostnad:**

- API-integration: 8-16 timmar utveckling
- Avtalstecknande per företag

**Löpande kostnad per företag:**

- **Fortnox:** 149 kr/mån + 5-10 kr per faktura
- **Visma eEkonomi:** 99 kr/mån + 8 kr per faktura
- **Billecta:** 199 kr/mån + 12-25 kr per faktura (inkl. kravhantering)

**Exempel beräkning (10 företag, 50 fakturor/månad vardera):**

- Fortnox: (149 × 10) + (50 × 10 × 7) = 1490 + 3500 = **4990 kr/mån**
- Billecta: (199 × 10) + (50 × 10 × 15) = 1990 + 7500 = **9490 kr/mån**

**Fördelar:**

- ✅ Automatiska påminnelser
- ✅ Kravhantering inkluderat
- ✅ Företaget slipper hantera obetalta fakturor
- ✅ Bokföringsintegration

**Nackdelar:**

- ❌ Dyr för små företag
- ❌ Varje företag måste ha eget avtal
- ❌ Ni tar ansvar för betalningsflödet
- ❌ Juridiskt ansvar om något går fel

---

## 🎯 MIN REKOMMENDATION

### Fas 1: INBYGGT SYSTEM (Starta här)

**Varför:**

1. Systemet är redan 90% klart
2. Billigt (0-200 kr/mån total)
3. Företagen får full kontroll
4. Ni slipper juridiskt ansvar för betalningar
5. Kan implementeras på 3-4 timmar

**Workflow:**

```
1. Systemet skapar fakturaunderlag (automatiskt)
2. Företag (admin) granskar i /ekonomi
3. Företag klickar "Skicka faktura"
4. Email skickas till hundägare med PDF + betalinfo
5. Hundägare betalar till företagets konto
6. Företag markerar som "betald" när pengar kommit
7. Om ej betalt: Företaget ringer/mejlar själva
```

### Fas 2: FAKTURASERVICE (Senare, om företagen vill)

**När:**

- När företag har 20+ fakturor/månad
- När företag får många sena betalningar
- När företag vill automatisera påminnelser

**Hur:**

- Gör det som tillval (opt-in)
- "Aktivera automatisk fakturering via Fortnox" checkbox
- Företaget tecknar eget avtal med Fortnox
- Ni skickar bara data via API

---

## 🚀 IMPLEMENTATION PLAN

### Vecka 1: Aktivera email-skickning

```bash
1. Skapa Edge Function: send_invoice_email
2. Lägg till "Skicka faktura" knapp i UI
3. Sätt upp Resend-konto (gratis)
4. Testa med 3-5 test-fakturor
```

### Vecka 2: Polera & lansera

```bash
1. Lägg till bekräftelsedialog
2. Visa "Skickad till X" i fakturahistorik
3. Logga alla skickade emails
4. Skapa guide för företagen
```

### Vecka 3: Övervaka & förbättra

```bash
1. Samla feedback från 2-3 företag
2. Justera email-template om behövs
3. Lägg till "Skicka påminnelse" knapp (manuell)
```

---

## 📊 JÄMFÖRELSETABELL

| Funktion               | Inbyggt System     | Fakturaservice             |
| ---------------------- | ------------------ | -------------------------- |
| **Kostnad (startup)**  | 0 kr               | 0 kr                       |
| **Kostnad (löpande)**  | 0-200 kr/mån       | 5000-10000 kr/mån          |
| **Implementation**     | 3-4 timmar         | 16-24 timmar               |
| **Betalning går till** | Företaget direkt   | Fakturaservice → Företaget |
| **Juridiskt ansvar**   | Företaget          | Ni + Företaget             |
| **Påminnelser**        | Manuellt           | Automatiskt                |
| **Kravhantering**      | Företaget hanterar | Inkluderat                 |
| **Bokföringsexport**   | Excel/CSV          | Direkt till Fortnox        |

---

## ✅ MIN SLUTLIGA REKOMMENDATION

**Gör så här:**

1. **NU (nästa vecka):** Implementera inbyggt email-system
   - Kostar 3-4 timmar utveckling
   - 0 kr i månadskostnad
   - Företagen får full kontroll
   - Ni slipper juridiskt ansvar

2. **Om 3-6 månader:** Utvärdera fakturaservice
   - Om många företag vill ha auto-påminnelser
   - Gör det som tillval (opt-in)
   - Endast för företag som verkligen behöver det

**Företagen kommer älska detta eftersom:**

- ✅ De slipper manuellt skapa fakturor
- ✅ De får professionella PDF:er
- ✅ Betalningen går direkt till deras konto
- ✅ De behåller full kontroll
- ✅ Ingen extra kostnad

---

## 📝 NÄSTA STEG

Vill du att jag implementerar det inbyggda email-systemet nu? Det tar 3-4 timmar och ni kan börja skicka fakturor i helgen. 🚀

**Eller** vill du att jag undersöker Fortnox/Billecta API:er närmare först?
