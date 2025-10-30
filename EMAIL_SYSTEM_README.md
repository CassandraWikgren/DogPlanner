# 📧 Email-system för DogPlanner

## Översikt

DogPlanner använder ett **två-nivåers email-system**:

### 1. System-nivå (DogPlanner)

**Email:** `info@dogplanner.se`, `support@dogplanner.se`, `noreply@dogplanner.se`

**Används för:**

- ✅ Registrering och välkomst-email
- ✅ Lösenordsåterställning
- ✅ Plattforms-uppdateringar
- ✅ Support-ärenden
- ✅ Tekniska meddelanden

### 2. Organisations-nivå (Kundens företag)

**Email:** Konfigurerbart per organisation

**Används för:**

- 📧 Kundfakturor
- 📧 Bekräftelser (dagisplats godkänd)
- 📧 Påminnelser (vaccination, abonnemang)
- 📧 All kundkommunikation

---

## 🗄️ Databas-struktur

### Tabell: `orgs`

```sql
email               text    -- Primär email (generell kontakt)
contact_email       text    -- Kontakt-email (visas för kunder)
invoice_email       text    -- Email för fakturor
reply_to_email      text    -- Reply-to för emails
email_sender_name   text    -- Avsändarnamn (t.ex. "Bella Hunddagis")
```

### Tabell: `system_config`

```sql
config_key          text    -- 'system_email', 'support_email', etc.
config_value        text    -- Email-adress
description         text    -- Beskrivning
```

---

## 🔧 Implementation

### 1. Kör SQL-migration

```bash
# I Supabase SQL Editor:
# Kör: add-email-configuration.sql
```

### 2. Använd email-helper

```typescript
import { getEmailSender, EmailType } from "@/lib/emailConfig";

// Exempel: Skicka kundfaktura
const sender = await getEmailSender("customer_invoice", orgId);
// sender = {
//   email: "faktura@belladagis.se",
//   name: "Bella Hunddagis",
//   replyTo: "info@belladagis.se"
// }

// Exempel: Skicka lösenordsåterställning
const sender = await getEmailSender("password_reset");
// sender = {
//   email: "noreply@dogplanner.se",
//   name: "DogPlanner",
//   replyTo: "support@dogplanner.se"
// }
```

### 3. Konfigurera i UI

Organisationer kan konfigurera sina email-inställningar på:

```
/foretagsinformation → Email-inställningar tab
```

---

## 📋 Email-typer

| Email-typ               | Nivå         | Beskrivning            |
| ----------------------- | ------------ | ---------------------- |
| `system_notification`   | System       | Plattforms-meddelanden |
| `password_reset`        | System       | Lösenordsåterställning |
| `registration`          | System       | Välkomst-email         |
| `support_ticket`        | System       | Support-ärenden        |
| `customer_invoice`      | Organisation | Kundfakturor           |
| `customer_confirmation` | Organisation | Bekräftelser           |
| `customer_reminder`     | Organisation | Påminnelser            |

---

## 🎯 Användningsexempel

### Skicka bekräftelse vid godkänd dagisplats

```typescript
// I app/hunddagis/intresseanmalningar/page.tsx

import { getEmailSender } from "@/lib/emailConfig";

const sendConfirmationEmail = async (
  customerEmail: string,
  customerName: string,
  dogName: string
) => {
  // Hämta organisations email-konfiguration
  const sender = await getEmailSender("customer_confirmation", currentOrgId);

  // TODO: Integrera med email-service (SendGrid, Resend, etc.)
  const emailData = {
    from: {
      email: sender.email,
      name: sender.name,
    },
    replyTo: sender.replyTo,
    to: customerEmail,
    subject: `${dogName} har fått dagisplats hos ${sender.name}!`,
    body: `
      Hej ${customerName}!

      Vi bekräftar att ${dogName} har fått en plats hos oss.

      Välkommen!

      Med vänliga hälsningar,
      ${sender.name}
    `,
  };

  // await sendEmail(emailData);
};
```

### Skicka faktura

```typescript
import { getEmailSender } from "@/lib/emailConfig";

const sendInvoiceEmail = async (customerEmail: string, invoiceData: any) => {
  const sender = await getEmailSender("customer_invoice", currentOrgId);

  const emailData = {
    from: {
      email: sender.email,
      name: sender.name,
    },
    replyTo: sender.replyTo,
    to: customerEmail,
    subject: `Faktura från ${sender.name}`,
    body: `...`,
    attachments: [
      {
        filename: "faktura.pdf",
        content: pdfBuffer,
      },
    ],
  };

  // await sendEmail(emailData);
};
```

---

## 🚀 Nästa steg

### 1. Välj email-service

Rekommenderade alternativ:

- **Resend** - Modern, enkel API, bra för Next.js
- **SendGrid** - Etablerad, många funktioner
- **AWS SES** - Billig, bra skalbarhet

### 2. Lägg till environment variables

```env
# .env.local
EMAIL_SERVICE_API_KEY=xxx
EMAIL_FROM_DOMAIN=dogplanner.se
```

### 3. Skapa send-email helper

```typescript
// lib/sendEmail.ts
export async function sendEmail({
  from,
  to,
  subject,
  body,
  replyTo,
  attachments,
}: EmailParams) {
  // Integrera med vald email-service
}
```

### 4. Implementera email-templates

- Skapa HTML-mallar för vanliga emails
- Använd variabler för personalisering
- Stöd för både HTML och plain text

---

## 🔒 Säkerhet

### SPF Records

Lägg till i DNS för `dogplanner.se`:

```
v=spf1 include:_spf.email-service.com ~all
```

### DKIM

Konfigurera DKIM-nycklar hos email-service

### DMARC

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@dogplanner.se
```

---

## 📊 Användningsstatistik

### System-emails (DogPlanner)

- info@dogplanner.se → Generell info
- support@dogplanner.se → Support
- noreply@dogplanner.se → Automatiska emails

### Organisations-emails

Konfigureras per företag i `/foretagsinformation`

---

## 🐛 Felsökning

### Problem: "Email bounces"

**Lösning:**

1. Verifiera email-adress hos email-service
2. Kontrollera SPF/DKIM-records
3. Testa med annat email-tjänst

### Problem: "Wrong sender email"

**Lösning:**

1. Kontrollera email-typ (system vs organisation)
2. Verifiera att orgId skickas för kundkommunikation
3. Kolla organisations email-konfiguration i databasen

### Problem: "Customer doesn't receive emails"

**Lösning:**

1. Kontrollera spam-filter
2. Verifiera email-adress är korrekt
3. Kolla email-service logs
4. Testa med annan email-adress

---

## 📝 TODO

- [ ] Välj och integrera email-service
- [ ] Skapa HTML email-templates
- [ ] Implementera sendEmail-helper
- [ ] Konfigurera DNS-records (SPF, DKIM, DMARC)
- [ ] Testa alla email-flöden
- [ ] Lägg till email-loggning i databasen
- [ ] Skapa email-statistik dashboard

---

**Skapad:** 2025-10-30  
**Senast uppdaterad:** 2025-10-30
