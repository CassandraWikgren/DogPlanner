# 📧 Fakturamail med SMTP2GO - 5 min setup

## ✅ Varför SMTP2GO istället för Resend?

- ✅ **1000 gratis emails/månad** (mer än Resend's 100)
- ✅ **Ingen domänverifiering behövs** (fungerar direkt!)
- ✅ **Testläge fungerar** (kan provköra innan verifiering)
- ✅ **Enkel setup** (5 min)

## 🚀 Setup (5 minuter)

### Steg 1: Skapa SMTP2GO konto (2 min)

1. Gå till: https://www.smtp2go.com/pricing/
2. Klicka "Try for Free"
3. Skapa konto med email
4. Verifiera email (kolla inbox)

### Steg 2: Skaffa API-nyckel (1 min)

1. Logga in på SMTP2GO dashboard
2. Klicka på **Settings → Users**
3. Klicka på ditt användarnamn
4. Scrolla ner till "API Keys"
5. Klicka **"Generate New API Key"**
6. Kopiera API-nyckeln (börjar med `api-...`)

### Steg 3: Lägg till i Supabase (1 min)

1. Gå till Supabase Dashboard
2. Välj ditt projekt
3. Gå till **Settings → Vault** (i vänstermenyn)
4. Klicka **"New secret"**
5. Fyll i:
   - **Name:** `SMTP2GO_API_KEY`
   - **Value:** Din kopierade API-nyckel
6. Klicka **"Create"**

### Steg 4: Deploy Edge Function (1 min)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase functions deploy send_invoice_email
```

### Steg 5: Testa! (30 sek)

1. Gå till `/ekonomi` i din app
2. Hitta en faktura med status "draft"
3. Klicka **"Skicka faktura"**
4. Bekräfta popup-dialogen
5. ✅ Email skickas!

## 📊 Kostnad

| Paket    | Emails/månad | Kostnad           |
| -------- | ------------ | ----------------- |
| **Free** | 1000         | **0 kr**          |
| Starter  | 10,000       | $10/mån (~110 kr) |
| Growth   | 50,000       | $39/mån (~430 kr) |

**Rekommendation:** Starta med Free tier (1000 emails räcker för 30-40 kunder)

## 🔒 Säkerhet

SMTP2GO API-nyckeln är säkert lagrad i Supabase Vault och exponeras aldrig till klienten.

## 🐛 Felsökning

### "SMTP2GO_API_KEY saknas"

→ Kontrollera att du lagt till nyckeln i Supabase Vault (Settings → Vault)

### "Invalid API key"

→ Kolla att du kopierat hela nyckeln (börjar med `api-`)

### Email kommer inte fram

→ Kolla SMTP2GO Dashboard → Activity Log för status

### Behöver skicka från egen domän (dogplanner.se)

1. Gå till SMTP2GO Dashboard → Settings → Sending Domains
2. Lägg till `dogplanner.se`
3. Verifiera med DNS-record (SPF/DKIM)
4. Uppdatera sender i `send_invoice_email/index.ts`:
   ```typescript
   sender: `${invoice.orgs.name} <faktura@dogplanner.se>`
   ```

## 🎯 Nästa steg

Efter första testet:

1. ✅ Verifiera att email kom fram
2. ✅ Kolla att företagsnamn ser bra ut
3. ✅ Testa betalningsinformation (OCR, bankgiro, swish)
4. 🔄 (Valfritt) Verifiera egen domän för bättre deliverability

## 💰 Jämförelse med alternativ

| Tjänst      | Setup | Kostnad/mån | Domänverifiering       |
| ----------- | ----- | ----------- | ---------------------- |
| **SMTP2GO** | 5 min | **0 kr**    | ❌ Nej                 |
| Resend      | 5 min | 0 kr        | ✅ Ja (kan inte testa) |
| Fortnox     | 2h    | 5000 kr     | N/A                    |
| Billecta    | 2h    | 9490 kr     | N/A                    |

**Vinnare:** SMTP2GO - Fungerar direkt utan domänverifiering! 🏆
