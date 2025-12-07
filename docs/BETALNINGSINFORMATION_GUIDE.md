# Betalningsinformation för fakturor - Användarguide

## 📋 Översikt

Nu kan du fylla i din betalningsinformation så att kundfakturor (PDF) visar korrekt bankgiro, Swish, OCR-nummer och betalningsvillkor.

---

## ⚙️ Steg 1: Fyll i betalningsinformation

1. Gå till **Företagsinformation** (länk i huvudmenyn)
2. Klicka på fliken **"Fakturering"**
3. Scrolla ner till **"Betalningsinformation för fakturor"**

### Fält att fylla i:

#### 💳 Grundläggande betalningsmetoder

- **Bankgiro:** T.ex. `123-4567`
  - Visas på fakturan med automatiskt OCR-nummer
- **Plusgiro:** T.ex. `12 34 56-7`
  - Alternativt betalningssätt
- **Swish-nummer:** T.ex. `123 456 78 90`
  - Genererar QR-kod på fakturan automatiskt
- **Bank:** T.ex. `SEB`, `Swedbank`, `Nordea`
  - Visas för tydlighet

#### 🌍 Internationella betalningar (valfritt)

- **IBAN:** T.ex. `SE45 5000 0000 0583 9825 7466`
- **BIC/SWIFT:** T.ex. `ESSESESS`

#### 📄 Faktureringsvillkor

- **Betalningsvillkor:** Antal dagar kund har på sig (standard: 14 dagar)
- **Fakturanummer-prefix:** T.ex. `INV`, `DOG`, `HUND`
  - Resultat: `INV-2025-00001`
- **Påminnelseavgift:** Lagstadgad avgift (standard: 60 kr)
- **Dröjsmålsränta:** Årlig ränta vid försenad betalning (standard: 8%)

---

## 📄 Steg 2: Vad visas på fakturan?

När du skapar en kundfaktura kommer PDF:en automatiskt visa:

### ✅ På fakturan syns:

1. **Bankgiro + OCR-nummer**
   - OCR genereras automatiskt från kundnummer + fakturanummer
   - Format: `1234 5678 9012 3456` (16 siffror med Luhn-check)

2. **Plusgiro** (om ifyllt)
   - För kunder som föredrar plusgiro

3. **Swish-nummer + QR-kod**
   - QR-koden innehåller belopp och referens
   - Kunden kan scanna direkt med Swish-appen

4. **Betalningsvillkor**
   - "14 dagar netto" (eller ditt anpassade värde)

5. **Förfallodatum**
   - Beräknas automatiskt från fakturadatum + betalningsvillkor

6. **Information om avgifter**
   - "Vid försenad betalning tillkommer påminnelseavgift (60 kr) samt dröjsmålsränta (8% per år)"

---

## 💡 Tips och best practices

### Rekommenderade inställningar:

- **Bankgiro:** Fyll alltid i (mest populär betalningsmetod)
- **Swish:** Starkt rekommenderat (snabba betalningar)
- **Plusgiro:** Valfritt (alternativ till bankgiro)
- **Betalningsvillkor:** 14 dagar är standard, 30 dagar för större företag

### OCR-nummer:

- Genereras automatiskt baserat på:
  - Kundnummer (6 siffror)
  - Fakturanummer (9 siffror)
  - Check-siffra (1 siffra) med Luhn-algoritm
- Kunden behöver **inte** fylla i något manuellt
- OCR-nummer kopplas automatiskt till rätt faktura när betalning kommer

### Swish QR-kod:

- Innehåller:
  - Mottagarnummer (ditt Swish-nummer)
  - Belopp
  - Referens (fakturanummer)
- Kunden scannar → Swish öppnas → Bekräftar betalning

---

## 🔄 Uppdatera information

Om du ändrar betalningsinformation (t.ex. nytt bankgiro):

1. Ändra i **Företagsinformation → Fakturering**
2. Klicka **"Spara faktureringsinställningar"**
3. **Nya fakturor** kommer använda den uppdaterade informationen
4. **Gamla fakturor** behåller sin ursprungliga information

---

## ❓ Vanliga frågor

### Måste jag fylla i allt?

Nej, men minst **bankgiro ELLER plusgiro** rekommenderas starkt. Swish är också populärt för snabba betalningar.

### Vad är OCR-nummer?

OCR (Optical Character Recognition) är ett unikt nummer som gör att betalningar automatiskt kopplas till rätt faktura när de kommer in på ditt bankkonto. Du behöver inte göra något manuellt - systemet genererar det automatiskt.

### Kan jag ändra fakturanummer-prefix?

Ja! Standard är "INV", men du kan ändra det till något annat (t.ex. "DOG", "HUND", företagsnamn). Max 10 tecken.

### Hur fungerar påminnelser?

När en faktura är förfallen kan du skicka påminnelser. Systemet lägger automatiskt till påminnelseavgift och dröjsmålsränta enligt dina inställningar. Se [FAKTURAHANTERING_GUIDE.md](./FAKTURAHANTERING_GUIDE.md) för mer info.

### Kan kunder betala med kort?

Nej, fakturor är avsedda för bankbetalningar (bankgiro/plusgiro) eller Swish. För kortbetalningar använd er bokningssystem istället.

---

## 📞 Support

Om något inte fungerar:

1. Kontrollera att alla obligatoriska fält är ifyllda
2. Spara inställningarna
3. Testa att skapa en ny faktura
4. Kolla att PDF:en genereras korrekt med betalningsinformationen

**Teknisk dokumentation:**

- [FAKTURAUNDERLAG_IMPLEMENTATION.md](./FAKTURAUNDERLAG_IMPLEMENTATION.md) - Fullständig teknisk spec
- [FAKTURAHANTERING_GUIDE.md](./FAKTURAHANTERING_GUIDE.md) - Guide för faktureringsarbetsflöde

---

**Uppdaterad:** 2025-11-22  
**Version:** 1.0
