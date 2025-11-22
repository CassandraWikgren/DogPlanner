# 🚀 FAKTURAUNDERLAG IMPLEMENTERAT

**Datum:** 2025-11-22  
**Status:** ✅ KLART FÖR TESTNING

---

## 📦 VAD HAR SKAPATS

### 1. **Databasmigrering**

📄 `supabase/migrations/20251122_invoice_system_improvements.sql`

**Innehåll:**

- ✅ Tabell: `invoice_counters` (löpande fakturanummer per org)
- ✅ Funktion: `generate_invoice_number()` (genererar INV-2025-00001)
- ✅ Trigger: `set_invoice_number()` (auto-genererar vid insert)
- ✅ Nya kolumner i `orgs`: bankgiro, plusgiro, swish, betalningsvillkor, ränta
- ✅ Nya kolumner i `invoices`: OCR, påminnelsedatum, avgifter, ränta
- ✅ Uppdaterade status: overdue, reminder_1, reminder_2, collection
- ✅ Hjälpfunktioner: `calculate_late_interest()`, `update_invoice_with_fees()`

### 2. **OCR-Generator**

📄 `lib/ocrGenerator.ts`

**Funktioner:**

- ✅ `generateOCR()` - Skapar 16-siffrig OCR med Luhn-kontroll
- ✅ `validateOCR()` - Validerar OCR-nummer
- ✅ `formatOCR()` - Formaterar med mellanslag (0001 2320 2500 0018)
- ✅ `generateSwishURL()` - Skapar Swish-URL för QR-kod
- ✅ `generatePaymentReference()` - Alternativ till OCR

### 3. **Uppdaterad PDF-generering**

📄 `app/api/invoices/[id]/pdf/route.ts`

**Nya features:**

- ✅ OCR-nummer visas tydligt
- ✅ Bankgiro + Plusgiro
- ✅ Swish med QR-kod
- ✅ Betalningsvillkor (14 dagar netto)
- ✅ Förfallodatum (rött)
- ✅ Information om dröjsmålsränta och påminnelseavgift
- ✅ Påminnelsenotis (om status = reminder_1 eller reminder_2)

### 4. **Cron-jobb för Övervakning**

📄 `app/api/cron/check-overdue-invoices/route.ts`

**Vad gör den:**

- ✅ Körs varje dag kl. 06:00 (Vercel Cron)
- ✅ Markerar fakturor som "overdue" efter förfallodatum
- ✅ Beräknar dröjsmålsränta (8% per år)
- ❌ Skickar **INGA** automatiska påminnelser
- ❌ DogPlanner tar **INGET** ansvar för inkasso

**OBS:** Företaget hanterar själva sina påminnelser och inkasso!

### 5. **Export-funktionalitet**

📄 `app/api/invoices/export/route.ts`

**Format:**

- ✅ **CSV** (Excel/Google Sheets)
- ✅ **JSON** (API-integration)
- ✅ **SIE** (Svensk bokföringsstandard)

**Kompatibelt med:**

- Fortnox
- Bokio
- Visma eEkonomi
- Speedledger
- Alla CSV/SIE-system

**Endpoints:**

```
GET /api/invoices/export?format=csv&start_date=2025-01-01&end_date=2025-01-31
GET /api/invoices/export?format=json&status=overdue
GET /api/invoices/export?format=sie
```

### 6. **Dokumentation**

📄 `FAKTURAUNDERLAG_BOKFÖRING.md` - Teknisk specifikation  
📄 `FAKTURAUNDERLAG_README.md` - Användarguide för företagskunder

---

## 🔧 INSTALLATION

### Steg 1: Kör databasmigrering

```bash
cd supabase
supabase db push
```

Eller manuellt i Supabase SQL Editor:

1. Öppna Supabase Dashboard
2. Gå till SQL Editor
3. Kör innehållet från `migrations/20251122_invoice_system_improvements.sql`

### Steg 2: Konfigurera Vercel Cron

Lägg till i `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue-invoices",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Steg 3: Sätt environment variable

```bash
# Lägg till i Vercel Dashboard → Settings → Environment Variables
CRON_SECRET=din-hemliga-nyckel-här
```

Generera hemlig nyckel:

```bash
openssl rand -base64 32
```

### Steg 4: Deploy till Vercel

```bash
git add .
git commit -m "Implementera fakturaunderlag för bokföring"
git push origin main
```

### Steg 5: Testa systemet

1. Logga in som företagskund
2. Gå till **Inställningar** → **Organisation**
3. Fyll i:
   - Bankgiro: `123-4567`
   - Swish: `123 456 78 90`
   - Betalningsvillkor: `14`
   - Fakturaprefix: `DP`
4. Skapa en testbokning
5. Ladda ner faktura-PDF
6. Kontrollera att OCR-nummer visas
7. Testa exportera: `/api/invoices/export?format=csv`

---

## ✅ CHECKLISTA FÖRE LANSERING

### Databas:

- [ ] Migrering körd i Supabase
- [ ] Tabell `invoice_counters` finns
- [ ] Kolumner i `orgs` och `invoices` tillagda
- [ ] Triggers fungerar (testa skapa faktura)

### Backend:

- [ ] OCR-generator fungerar (`lib/ocrGenerator.ts`)
- [ ] PDF visar OCR-nummer
- [ ] Cron-jobb aktiverat i Vercel
- [ ] Export-endpoint fungerar (`/api/invoices/export`)
- [ ] QR-kod för Swish visas på PDF

### Frontend (TODO i nästa sprint):

- [ ] Visa OCR i fakturavy
- [ ] Exportknapp i faktura-gränssnittet
- [ ] Filter för "Förfallna" fakturor
- [ ] Knapp: "Skicka påminnelse" (manuell)
- [ ] Inställningar för betalningsinfo

### Testning:

- [ ] Skapa testfaktura
- [ ] Validera OCR-nummer (Luhn-kontroll)
- [ ] Ladda ner PDF - kontrollera layout
- [ ] Exportera CSV och importera i Fortnox/Bokio
- [ ] Testa cron-jobb manuellt: `/api/cron/check-overdue-invoices`
- [ ] Kontrollera att dröjsmålsränta beräknas korrekt

---

## 🎯 VIKTIGT ATT KOMMUNICERA TILL KUNDER

### DogPlanner tillhandahåller ENDAST:

✅ Fakturaunderlag med korrekta belopp  
✅ OCR-nummer för automatisk betalning  
✅ Export till bokföringssystem  
✅ Beräkning av ränta och avgifter

### DogPlanner gör INTE:

❌ Skickar automatiska påminnelser  
❌ Driver in betalningar  
❌ Hanterar inkasso  
❌ Tar juridiskt ansvar

### Företagaren ansvarar själv för:

👉 Skicka fakturor till kunder  
👉 Bevaka förfallodatum  
👉 Skicka påminnelser vid sen betalning  
👉 Kontakta inkassobolag vid behov  
👉 Följa bokföringslagen

---

## 📋 NÄSTA STEG (Framtida Sprint)

### Frontend-uppdateringar:

1. **Fakturavy** (`app/faktura/page.tsx`):
   - Visa OCR-nummer i tabellen
   - Exportknapp (CSV, JSON, SIE)
   - Filter: "Alla", "Betalda", "Obetalda", "Förfallna"
   - Knapp: "Skicka påminnelse" (öppnar e-postmall)

2. **Inställningar** (`app/foretagsinformation/page.tsx`):
   - Sektion: "Betalningsinformation"
   - Fält: Bankgiro, Plusgiro, Swish
   - Fält: Betalningsvillkor (antal dagar)
   - Fält: Dröjsmålsränta (%)
   - Fält: Fakturaprefix

3. **Dashboard-widget**:
   - "Förfallna fakturor: 3 st"
   - "Obetalt belopp: 12 450 kr"
   - Snabblänk till förfallna fakturor

### E-postmallar:

- Mall för första påminnelsen (vänlig)
- Mall för andra påminnelsen (strängare)
- Mall för inkassovarning

### Rapporter:

- Månadsrapport (totalt fakturerat, betalt, obetalt)
- Kundrapport (vilka kunder betalar sent?)
- Exportera årsredovisning (alla fakturor för året)

---

## 📚 DOKUMENTATION

**Teknisk spec:**  
→ `FAKTURAUNDERLAG_BOKFÖRING.md`

**Användarguide:**  
→ `FAKTURAUNDERLAG_README.md`

**Migrering:**  
→ `supabase/migrations/20251122_invoice_system_improvements.sql`

**API-endpoints:**  
→ `/api/invoices/export` - Export till bokföring  
→ `/api/cron/check-overdue-invoices` - Övervakning  
→ `/api/invoices/[id]/pdf` - PDF-generering

---

## 🐛 FELSÖKNING

### Problem: OCR-nummer visas inte

**Lösning:** Kontrollera att bankgiro är ifyllt i org-inställningar

### Problem: Fakturanummer börjar om

**Lösning:** Kontrollera `invoice_counters` tabellen, kör migration igen

### Problem: PDF ser konstig ut

**Lösning:** Kontrollera att `qrcode` npm-paketet är installerat: `npm install qrcode`

### Problem: Export fungerar inte

**Lösning:** Testa API direkt i browser: `/api/invoices/export?format=csv`

### Problem: Cron-jobb körs inte

**Lösning:** Kontrollera att `CRON_SECRET` är satt i Vercel Environment Variables

---

## 🎉 KLART!

Fakturaunderlaget är nu implementerat och redo för testning.

**Nästa steg:**

1. Kör databasmigrering
2. Deploy till Vercel
3. Testa med testorganisation
4. Dokumentera för kunderna
5. Lansera i produktion

**Frågor?**  
Läs dokumentationen i `FAKTURAUNDERLAG_README.md`

---

_Skapad: 2025-11-22_  
_Status: ✅ Redo för testning_  
_Version: 1.0_
