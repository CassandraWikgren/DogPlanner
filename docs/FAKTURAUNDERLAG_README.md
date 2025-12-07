# 📊 FAKTURAUNDERLAG - ANVÄNDARGUIDE

**Uppdaterad:** 2025-11-22  
**Version:** 1.0

---

## 🎯 VIKTIGT: DITT ANSVAR SOM FÖRETAGARE

**DogPlanner tillhandahåller ENDAST faktureringsunderlag.**

### ✅ Vad DogPlanner GÖR:

- Beräknar priser för bokningar (dagis, pensionat, frisör)
- Skapar fakturaunderlag med korrekta belopp
- Genererar OCR-nummer för betalningar
- Beräknar dröjsmålsränta på förfallna fakturor
- Exporterar till bokföringssystem (CSV, JSON, SIE)

### ❌ Vad DogPlanner INTE GÖR:

- **Vi skickar INGA automatiska påminnelser**
- **Vi driver INTE in betalningar**
- **Vi hanterar INTE inkassoärenden**
- **Vi tar INGET juridiskt ansvar**

### 👉 DU ansvarar för att:

1. Skicka fakturor till dina kunder
2. Bevaka förfallodatum
3. Skicka påminnelser vid sen betalning
4. Kontakta inkassobolag vid behov
5. Följa bokföringslagen

---

## 📋 VAD ÄR IMPLEMENTERAT

### 1. **Löpande Fakturanumrering**

✅ Format: `{PREFIX}-{ÅR}-{LÖPNR}`  
✅ Exempel: `INV-2025-00001`, `DP-2025-00142`  
✅ Unikt per organisation och år  
✅ Nollställs automatiskt varje nytt år

**Så ändrar du prefix:**

1. Gå till Inställningar → Organisation
2. Ändra "Fakturaprefix" (t.ex. från "INV" till "DP")

### 2. **OCR-nummer (Automatisk betalningskoppling)**

✅ 16-siffrig OCR med Luhn-kontrollsiffra  
✅ Format: `KKKKKKFFFFFFFFC` (Kund + Faktura + Kontroll)  
✅ Visas på alla fakturor och i export  
✅ Fungerar med svenska bankgiro/plusgiro

**Exempel:**

- Kundnummer: 123
- Faktura: INV-2025-00001
- OCR: `0001 2320 2500 0018`

### 3. **Betalningsinformation på Fakturor**

✅ Bankgiro (om angivet i organisationsinställningar)  
✅ Plusgiro (om angivet)  
✅ Swish + QR-kod (om angivet)  
✅ Betalningsvillkor (default: 14 dagar)  
✅ Förfallodatum (tydligt markerat)

**Så fyller du i betalningsuppgifter:**

1. Gå till Inställningar → Organisation → Betalningsinformation
2. Fyll i:
   - Bankgiro: `123-4567`
   - Plusgiro: `12 34 56-7` (frivilligt)
   - Swish: `123 456 78 90` (frivilligt)
   - Betalningsvillkor: `14` dagar (rekommenderat)

### 4. **Förfallna Fakturor (Automatisk övervakning)**

✅ Cron-jobb körs varje dag kl. 06:00  
✅ Markerar fakturor som "Förfallen" efter förfallodatum  
✅ Beräknar dröjsmålsränta (default: 8% per år)  
✅ Skickar **INGA** automatiska påminnelser

**Du ser förfallna fakturor:**

- Gå till Ekonomi → Fakturor
- Filtrera på status: "Förfallen"
- Röd färgmarkering i listan

### 5. **Export till Bokföringssystem**

✅ **CSV-format** (Excel, Google Sheets)  
✅ **JSON-format** (API-integration)  
✅ **SIE-format** (Svensk bokföringsstandard)

**Kompatibelt med:**

- Fortnox
- Bokio
- Visma eEkonomi
- Visma Administration
- Speedledger
- Alla system som stödjer CSV/SIE

---

## 🚀 SÅ HÄR ANVÄNDER DU SYSTEMET

### Steg 1: Konfigurera Organisation (ENGÅNGSINSTÄLLNING)

1. Logga in på DogPlanner
2. Gå till **Inställningar** → **Organisation**
3. Fyll i:
   - ✅ Organisationsnamn
   - ✅ Organisationsnummer
   - ✅ Adress
   - ✅ Telefon
   - ✅ E-post
   - ✅ **Bankgiro** (viktigt för OCR!)
   - ✅ **Swish** (frivilligt)
   - ✅ **Betalningsvillkor** (rekommenderat: 14 eller 30 dagar)
   - ✅ **Fakturaprefix** (t.ex. "DP" för DogPlanner)
4. Spara

### Steg 2: Fakturor Skapas Automatiskt

**Hundpensionat:**

- Faktura skapas automatiskt när bokning blir "Confirmed"
- Förskottsfaktura: 100% av totalpriset

**Hunddagis:**

- Faktura skapas automatiskt vid månadens slut
- Baserat på antal dagar hunden varit på dagis

**Frisör:**

- Faktura skapas när bokning markeras som "Checked out"
- Baserat på vald tjänst och eventuella tillägg

### Steg 3: Granska och Skicka Fakturor

1. Gå till **Ekonomi** → **Fakturor**
2. Välj faktura i listan
3. Klicka "Visa" eller "Ladda ner PDF"
4. Kontrollera:
   - ✅ Kundens namn och adress
   - ✅ Fakturabelopp
   - ✅ Fakturanummer
   - ✅ OCR-nummer visas
   - ✅ Betalningsinformation (bankgiro, swish)
5. **Skicka fakturan till kunden** (via e-post)

### Steg 4: Bevaka Förfallna Fakturor

**Automatisk övervakning:**

- Systemet markerar automatiskt fakturor som förfallna
- Inget händer automatiskt – DU måste agera

**Så hanterar du förfallna fakturor:**

#### **Dag 1-7 efter förfallodatum:**

1. Vänta lite – kunden kanske glömt
2. Ingen åtgärd ännu

#### **Dag 8-14 efter förfallodatum:**

1. Gå till Ekonomi → Fakturor → Filtrera "Förfallen"
2. Välj faktura
3. Skicka **vänlig påminnelse via e-post:**

   ```
   Hej [Kund],

   Vi har inte mottagit betalning för faktura [Fakturanr].
   Förfallodatum var [Datum].

   Om du redan har betalat, bortse från detta meddelande.

   OCR-nummer: [OCR]
   Belopp: [Summa] kr

   Mvh,
   [Företagsnamn]
   ```

4. Markera fakturan som "Påminnelse 1 skickad" (i framtida uppdatering)

#### **Dag 15-30 efter förfallodatum:**

1. Skicka **andra påminnelsen** (strängare ton)
2. Lägg till påminnelseavgift: **60 kr** (lagstadgat belopp)
3. Informera om dröjsmålsränta

#### **Dag 31+ efter förfallodatum:**

1. **Exportera fakturan** (CSV eller JSON)
2. **Kontakta inkassobolag:**
   - [Intrum](https://www.intrum.se)
   - [Collectors](https://www.collectors.se)
   - [Svea Ekonomi](https://www.svea.com)
3. **Lämna över ärendet** – de sköter resten

### Steg 5: Exportera till Bokföringssystem

**Månadsvis rutin (rekommenderas):**

1. Gå till **Ekonomi** → **Fakturor** → **Exportera**
2. Välj datumintervall (t.ex. "Förra månaden")
3. Välj format:
   - **CSV** → För Excel eller Google Sheets
   - **JSON** → För API-integration
   - **SIE** → För svensk bokföring (Fortnox/Bokio/Visma)
4. Ladda ner filen
5. Importera i ditt bokföringssystem:

#### **Fortnox:**

1. Logga in på Fortnox
2. Gå till **Arkiv** → **Importera** → **Verifikationer**
3. Välj nedladdad SIE-fil
4. Klicka "Importera"

#### **Bokio:**

1. Logga in på Bokio
2. Gå till **Bokföring** → **Import** → **Verifikationer**
3. Välj CSV eller SIE
4. Matcha kolumner (görs automatiskt första gången)
5. Klicka "Importera"

#### **Visma eEkonomi:**

1. Logga in på Visma
2. Gå till **Inställningar** → **Import/Export** → **Verifikationer**
3. Välj "DogPlanner-format" (eller skapa egen mall första gången)
4. Ladda upp filen

---

## 📄 FAKTURA-INNEHÅLL (Enligt bokföringslagen)

Alla fakturor innehåller:

### **Säljare (Ditt företag):**

- Företagsnamn
- Organisationsnummer
- Adress
- Telefon
- E-post

### **Köpare (Din kund):**

- Kundnummer (genereras automatiskt)
- Namn
- Adress

### **Fakturan:**

- Fakturanummer (löpande)
- Fakturadatum
- Förfallodatum
- OCR-nummer
- Betalningsvillkor (t.ex. "14 dagar netto")

### **Specifikation:**

- Beskrivning av tjänst
- Antal/Kvantitet
- Enhetspris
- Totalpris per rad
- Delsumma
- Moms (0% - hundtjänster är momsfria)
- **Totalt att betala**

### **Betalningsinformation:**

- Bankgiro + OCR
- Plusgiro (om angivet)
- Swish + QR-kod (om angivet)
- Information om dröjsmålsränta (8% per år)
- Påminnelseavgift (60 kr vid andra påminnelsen)

---

## ⚖️ JURIDISK INFORMATION

### Dröjsmålsränta

- **8% per år** (default, kan ändras i inställningar)
- Baserat på Riksbankens referensränta + 8%
- Beräknas automatiskt för förfallna fakturor
- Du måste själv informera kunden om räntan

### Påminnelseavgift

- **60 kr** enligt Inkassolagen
- Får tas ut vid **andra påminnelsen**
- Första påminnelsen ska vara avgiftsfri
- Kräver att du skickat fakturan i rätt tid

### Inkasso

- Efter 2 påminnelser kan du lämna till inkasso
- Inkassobolag tar inkassoavgift (ca 180 kr)
- Kunden betalar alla avgifter + ränta
- DogPlanner är INTE involverat i inkassoprocessen

### Bokföringslag (1999:1078)

- Fakturor måste sparas i 7 år
- Löpande numrering krävs
- OCR underlättar men är inte obligatoriskt
- Export till bokföringssystem rekommenderas månadsvis

---

## 🛠️ TEKNISK INFORMATION

### Databasstruktur

**Nya tabeller:**

- `invoice_counters` - Räknare för fakturanummer

**Nya kolumner i `orgs`:**

- `plusgiro` - Plusgironummer
- `payment_terms_days` - Antal dagar betalningsvillkor
- `late_fee_amount` - Påminnelseavgift (kr)
- `interest_rate` - Dröjsmålsränta (%)
- `invoice_prefix` - Prefix för fakturanummer

**Nya kolumner i `invoices`:**

- `reminder_1_date` - Datum första påminnelsen
- `reminder_2_date` - Datum andra påminnelsen
- `reminder_1_fee` - Avgift påminnelse 1
- `reminder_2_fee` - Avgift påminnelse 2
- `late_interest` - Beräknad dröjsmålsränta
- `ocr_number` - OCR-nummer
- `payment_reference` - Alternativ referens

### API-endpoints

**Exportera fakturor:**

```
GET /api/invoices/export?format=csv&start_date=2025-01-01&end_date=2025-01-31
```

**Format:**

- `csv` - Excel-kompatibel CSV
- `json` - JSON-format
- `sie` - Svensk bokföringsstandard

**Filtrera:**

- `status=all` - Alla fakturor
- `status=paid` - Endast betalda
- `status=unpaid` - Obetalda (skickade + förfallna)
- `status=overdue` - Endast förfallna

### Cron-jobb (Automatisk övervakning)

**Vercel Cron:**

```
Körs: Varje dag kl. 06:00 (UTC)
Endpoint: /api/cron/check-overdue-invoices
```

**Vad gör jobbet:**

1. Hittar fakturor med passerat förfallodatum
2. Markerar status: `sent` → `overdue`
3. Beräknar dröjsmålsränta
4. Uppdaterar `late_interest` i databasen
5. **Skickar INGA e-postmeddelanden**

---

## 🆘 FELSÖKNING

### "OCR-nummer visas inte på fakturan"

**Lösning:**

1. Kontrollera att du fyllt i **Bankgiro** i organisationsinställningar
2. OCR genereras endast om bankgiro finns
3. Kör migration: `supabase/migrations/20251122_invoice_system_improvements.sql`

### "Fakturanummer börjar om mitt i året"

**Lösning:**

- Kontrollera tabellen `invoice_counters`
- Räknaren ska vara unik per `org_id` + `current_year`
- Kontakta support om problemet kvarstår

### "Export fungerar inte"

**Lösning:**

1. Kontrollera att du har fakturor i valt datumintervall
2. Testa med `status=all` först
3. Kontrollera browser-konsolen för felmeddelanden
4. Testa API direkt: `/api/invoices/export?format=csv`

### "Dröjsmålsränta beräknas fel"

**Lösning:**

- Standard: 8% per år
- Formel: `Belopp × (Ränta/100) × (Dagar/365)`
- Kontrollera `interest_rate` i organisationsinställningar
- Räntan beräknas varje natt via cron-jobb

---

## 📞 SUPPORT

**Tekniska frågor:**

- E-post: support@dogplanner.se
- Dokumentation: `/docs`

**Juridiska frågor:**

- Kontakta din revisor eller bokförare
- DogPlanner ger INGEN juridisk rådgivning

**Inkasso:**

- Kontakta inkassobolag direkt
- Vi tillhandahåller endast fakturaunderlag

---

## ✅ CHECKLISTA: KOM IGÅNG

- [ ] Fyll i organisationsuppgifter
- [ ] Lägg till bankgiro (för OCR)
- [ ] Lägg till swish (frivilligt)
- [ ] Sätt betalningsvillkor (rekommenderat: 14 dagar)
- [ ] Välj fakturaprefix (t.ex. "DP")
- [ ] Testa skapa en faktura
- [ ] Kontrollera att OCR-nummer visas
- [ ] Ladda ner PDF och granska layout
- [ ] Testa exportera till CSV
- [ ] Importera i ditt bokföringssystem
- [ ] Sätt påminnelse i kalendern: "Exportera fakturor" (månadsvis)

---

**Lycka till med din fakturahantering! 🎉**

_Skapad: 2025-11-22_  
_Version: 1.0_  
_DogPlanner AB_
