# ✅ Email-system implementerat!

## 🎯 Vad har gjorts

### 1. Två-nivåers email-arkitektur

#### **System-nivå (DogPlanner)**

✉️ `info@dogplanner.se`

- Registrering och välkomst-email
- Lösenordsåterställning
- Plattforms-uppdateringar
- Support-ärenden

#### **Organisations-nivå (Kundens företag)**

✉️ Konfigurerbart per företag

- Kundfakturor
- Bekräftelser (dagisplats godkänd)
- Påminnelser
- All kundkommunikation

---

## 📁 Nya filer

### 1. `add-email-configuration.sql`

SQL-migration som:

- Lägger till 4 nya kolumner i `orgs`:
  - `contact_email` - Kontakt-email för kunder
  - `invoice_email` - Avsändare på fakturor
  - `reply_to_email` - Reply-to adress
  - `email_sender_name` - Avsändarnamn
- Skapar `system_config` tabell
- Sätter `info@dogplanner.se` som system-email

### 2. `lib/emailConfig.ts`

TypeScript helper med:

- `SYSTEM_EMAILS` konstanter
- `getEmailSender()` - Bestämmer rätt avsändare
- `getOrgEmailConfig()` - Hämtar organisations email
- `updateOrgEmailConfig()` - Uppdaterar email-config
- Email-typer: `customer_invoice`, `customer_confirmation`, `password_reset`, etc.

### 3. `app/foretagsinformation/page.tsx` (omskriven)

Admin-sida med tabs:

- **Allmänt:** Namn, org.nr, telefon, adress
- **Email-inställningar:** ⭐ NY - konfigurera alla email-adresser
- **Fakturering:** Valuta, moms
- **Länkar:** Snabblänkar till andra sidor

### 4. `EMAIL_SYSTEM_README.md`

Komplett dokumentation:

- Arkitektur-översikt
- Användningsexempel
- Nästa steg för integration
- Felsökningsguide

---

## 🚀 Hur det används

### I kod (exempel från överföringsfunktionen):

```typescript
import { getEmailSender } from "@/lib/emailConfig";

// Vid överföring till hunddagis
const sendConfirmationEmail = async () => {
  // Hämta organisations email-konfiguration
  const sender = await getEmailSender("customer_confirmation", currentOrgId);

  // sender innehåller:
  // {
  //   email: "kontakt@belladagis.se",
  //   name: "Bella Hunddagis",
  //   replyTo: "info@belladagis.se"
  // }

  // TODO: Skicka email via email-service
  // await sendEmail({
  //   from: { email: sender.email, name: sender.name },
  //   replyTo: sender.replyTo,
  //   to: customerEmail,
  //   subject: "Välkommen till dagis!",
  //   body: "..."
  // });
};
```

### I admin-UI:

1. Gå till `/foretagsinformation`
2. Klicka på "Email-inställningar" tab
3. Fyll i:
   - Avsändarnamn (t.ex. "Bella Hunddagis")
   - Kontakt-email (t.ex. "kontakt@belladagis.se")
   - Faktura-email (t.ex. "faktura@belladagis.se")
   - Reply-to email (t.ex. "info@belladagis.se")
4. Spara

---

## 📋 Nästa steg (för full email-integration)

### 1. Kör SQL-migration

```bash
# I Supabase SQL Editor
# Kör: add-email-configuration.sql
```

### 2. Välj email-service

Rekommendationer:

- **Resend** - Modern, enkel, bra för Next.js
- **SendGrid** - Etablerad, många funktioner
- **AWS SES** - Billig, skalbar

### 3. Lägg till API-nycklar

```env
# .env.local
EMAIL_SERVICE_API_KEY=xxx
```

### 4. Implementera sendEmail-helper

```typescript
// lib/sendEmail.ts
export async function sendEmail({
  from,
  to,
  subject,
  body,
  replyTo,
}: EmailParams) {
  // Integrera med vald email-service
}
```

### 5. Uppdatera befintliga TODO-kommentarer

Sök efter:

```typescript
// TODO: Skicka bekräftelse-mejl
```

Ersätt med:

```typescript
const sender = await getEmailSender("customer_confirmation", orgId);
await sendEmail({...});
```

---

## 🎨 UI-förhandsvisning

### Före (gammal sida):

```
Företagsinformation
├── Länkar till andra sidor
└── Ingen konfiguration
```

### Efter (ny sida):

```
Företagsinformation
├── Tab: Allmänt
│   ├── Företagsnamn
│   ├── Organisationsnummer
│   ├── Email
│   ├── Telefon
│   └── Adress
├── Tab: Email-inställningar ⭐ NY
│   ├── Avsändarnamn
│   ├── Kontakt-email
│   ├── Faktura-email
│   ├── Reply-to email
│   └── Info om system-email
├── Tab: Fakturering
│   ├── Valuta
│   ├── Momssats
│   └── Priser inkl. moms
└── Tab: Länkar
    ├── Mitt abonnemang
    ├── Villkor
    └── Fakturor
```

---

## 💡 Fördelar med denna lösning

### ✅ Separation av concerns

- System-emails (DogPlanner) är separerade från kund-emails
- Tydlig ansvarsfördelning

### ✅ Flexibilitet

- Varje företag kan använda egna email-adresser
- Eller fallback till primär email om de inte konfigurerar

### ✅ Professionellt

- Kunder ser företagets egen email, inte "noreply@dogplanner.se"
- Företag kan ha olika emails för faktura vs. kontakt

### ✅ Skalbart

- Lätt att lägga till fler email-typer
- Lätt att byta email-service senare

### ✅ Säkert

- Reply-to separerat från avsändare
- Möjlighet att använda noreply för automatiska emails

---

## 🔍 Exempel-scenario

### Scenario: "Bella Hunddagis godkänner Charlie"

1. **Admin:** Klickar "Överför till Hunddagis" för Charlie
2. **System:** Anropar `getEmailSender("customer_confirmation", orgId)`
3. **Resultat:**
   ```
   From: "Bella Hunddagis" <kontakt@belladagis.se>
   Reply-To: info@belladagis.se
   To: lisa.johansson@example.com
   Subject: Charlie har fått dagisplats hos Bella Hunddagis!
   ```
4. **Kund:** Ser email från Bella Hunddagis (inte DogPlanner)
5. **Kund:** Svarar på emailet → går till info@belladagis.se

### Scenario: "Lösenordsåterställning"

1. **Användare:** Klickar "Glömt lösenord"
2. **System:** Anropar `getEmailSender("password_reset")`
3. **Resultat:**
   ```
   From: "DogPlanner" <noreply@dogplanner.se>
   Reply-To: support@dogplanner.se
   To: admin@belladagis.se
   Subject: Återställ ditt lösenord
   ```
4. **Användare:** Ser email från DogPlanner (plattformen)

---

## 📊 Status

| Feature               | Status                         |
| --------------------- | ------------------------------ |
| Databas-schema        | ✅ Klar (SQL skapad)           |
| Email-config helper   | ✅ Klar (lib/emailConfig.ts)   |
| Admin UI              | ✅ Klar (/foretagsinformation) |
| Dokumentation         | ✅ Klar (README)               |
| **Email-integration** | ⏳ TODO (välj service)         |
| **Send-helper**       | ⏳ TODO (implementera)         |
| **Templates**         | ⏳ TODO (HTML-mallar)          |

---

**Klar för testning efter SQL-migration körs! 🚀**

Nästa steg: Kör `add-email-configuration.sql` i Supabase för att lägga till fälten.
