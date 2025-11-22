# 💰 SÅ HÄR FUNGERAR FAKTURORNA I DOGPLANNER

**För företagskunder - Läs detta noga!**

---

## 🎯 VIKTIGT ATT FÖRSTÅ

**DogPlanner skapar bara UNDERLAG för fakturor.**  
**Du måste själv skicka fakturor och bevaka betalningar!**

---

## ⚙️ Automatisk fakturaskapande

### När skapas fakturor automatiskt?

1. **Hundpensionat - Förskott** 📅
   - När du godkänner en bokning (status: "pending" → "confirmed")
   - Faktura med 100% av priset skapas direkt
   - Förfallodatum: 14 dagar (eller 3 dagar innan incheckning)

2. **Hundpensionat - Efterskott** 🏁
   - När du checkar ut en hund (status: "checked_out")
   - Faktura med alla tillval och rabatter
   - Förfallodatum: 30 dagar

3. **Hunddagis - Månadsvis** 📊
   - Skapas automatiskt vid månadsskifte
   - Baserat på antal dagisdagar under månaden

---

## 📋 DITT ANSVAR SOM FÖRETAGARE

### ✅ Du MÅSTE göra detta:

#### 1. **Skicka fakturan till kunden**

```
Ekonomi → Fakturor → Välj faktura → Ladda ner PDF → Skicka e-post
```

Systemet skickar **INTE** automatiska e-post!

#### 2. **Bevaka betalningar i din bank**

- Logga in på din nätbank dagligen/veckovis
- Kolla inkommande betalningar
- Matcha OCR-nummer med fakturor

#### 3. **Markera fakturor som betalda**

```
När du ser betalning i banken:
1. Gå till Ekonomi → Fakturor
2. Hitta fakturan (använd OCR för att matcha)
3. Klicka "Markera som betald"
4. Välj betalningsmetod (Bankgiro/Swish/Kort)
```

#### 4. **Hantera försenade betalningar**

```
Dag 1-7 efter förfallodatum:
  → Vänta lite

Dag 8-14:
  → Skicka vänlig påminnelse via e-post
  → Markera "Påminnelse 1 skickad"

Dag 15-30:
  → Skicka strängare påminnelse
  → Lägg till påminnelseavgift 60 kr
  → Markera "Påminnelse 2 skickad"

Dag 31+:
  → Exportera faktura
  → Kontakta inkassobolag (Intrum/Collectors)
```

---

## 🤖 VAD SYSTEMET GÖR AUTOMATISKT

### ✅ Automatiskt:

- Skapar fakturor när bokningar godkänns/checkas ut
- Genererar löpande fakturanummer (INV-2025-00001)
- Skapar OCR-nummer för betalningar
- Markerar fakturor som "Förfallen" efter förfallodatum
- Beräknar dröjsmålsränta (8% per år)

### ❌ Gör INTE automatiskt:

- Skickar e-post till kunder
- Ser betalningar i din bank
- Markerar fakturor som betalda
- Skickar påminnelser
- Driver in pengar
- Kontaktar inkasso

---

## 💳 SÅ HÄR BETALAR KUNDERNA

### 1. Kunden får PDF-faktura från dig (via e-post)

### 2. Fakturan innehåller:

```
Fakturanummer: INV-2025-00001
OCR-nummer: 0001 2320 2500 0018
Bankgiro: 123-4567
Swish: 123 456 78 90 (+ QR-kod)
Belopp: 2 000 kr
Förfallodatum: 2025-12-06
```

### 3. Kunden betalar via:

- **Bankgiro** (med OCR) ← Rekommenderat!
- **Swish** (scannar QR-koden)
- **Kort** (om du har kortbetalning)

### 4. Pengarna går DIREKT till ditt företagskonto

- DogPlanner hanterar INGA pengar
- Vi ser INTE betalningar
- Du måste själv kolla din bank

---

## 🔍 SÅ HÄR MATCHAR DU BETALNINGAR

### När betalning kommer in i banken:

#### **Med OCR-nummer** (Bankgiro):

```
1. Din bank visar: "Betalning 2000 kr - OCR: 0001232025000018"
2. Gå till Ekonomi → Fakturor
3. Sök på OCR: "0001232025000018"
4. Hitta fakturan → "Markera som betald"
```

#### **Utan OCR** (Swish/Kort):

```
1. Din bank visar: "Swish 2000 kr från Anna Andersson"
2. Gå till Ekonomi → Fakturor
3. Filtrera "Obetalda"
4. Leta efter Anna Andersson, 2000 kr
5. Markera som betald
```

---

## 📊 EXPORTERA TILL BOKFÖRINGSSYSTEM

### Varför exportera?

- För att få fakturor i Fortnox/Bokio/Visma
- För att slippa dubbelt arbete
- För korrekt bokföring och årsredovisning

### Hur gör jag?

```
1. Gå till Ekonomi → Fakturor → Exportera
2. Välj datumintervall (t.ex. "November 2025")
3. Välj format:
   - CSV (för Excel)
   - SIE (för Fortnox/Bokio/Visma)
4. Ladda ner
5. Importera i ditt bokföringssystem
```

### Rekommendation:

- Exportera **månadsvis**
- Samma dag som du gör bokföring
- Spara exportfilen i säker mapp

---

## ⚠️ VANLIGA MISSTAG

### ❌ "Jag trodde fakturorna skickades automatiskt"

**NEJ!** Du måste ladda ner PDF och skicka själv via e-post.

### ❌ "Varför står fakturan som obetald när kunden har betalat?"

Systemet ser inte din bank. Du måste markera den som betald manuellt.

### ❌ "Skickas påminnelser automatiskt efter 14 dagar?"

NEJ! Du måste själv skicka påminnelser när du vill.

### ❌ "Vad händer om kunden inte betalar?"

Ingenting automatiskt. DU måste agera: skicka påminnelse → inkasso.

---

## 📞 CHECKLISTA: DAGLIG RUTIN

### Morgon (5 min):

```
□ Kolla nya bokningar
□ Kontrollera att förskottsfakturor skapats
□ Ladda ner PDF för nya fakturor
□ Skicka fakturor via e-post till kunder
```

### Varje vecka (10 min):

```
□ Logga in på nätbanken
□ Kolla inkommande betalningar
□ Matcha OCR-nummer med fakturor
□ Markera betalda fakturor i DogPlanner
□ Kolla "Förfallna" fakturor
□ Skicka påminnelser vid behov
```

### Varje månad (15 min):

```
□ Exportera fakturor (CSV/SIE)
□ Importera i bokföringssystem
□ Stäm av mot bankkonto
□ Rapportera moms (om momsregistrerad)
```

---

## 🎓 EXEMPEL-SCENARIO

### Anna bokar pensionat 10-15 november

**Dag 1 (8 november) - Ansökan kommer in:**

```
→ Anna fyller i bokningsformulär
→ Status: "pending"
→ Ingen faktura ännu
```

**Dag 2 (9 november) - Du godkänner:**

```
→ Du klickar "Godkänn bokning"
→ Status: "confirmed"
→ ✅ FÖRSKOTTSFAKTURA SKAPAS AUTOMATISKT
→ Fakturanummer: INV-2025-00123
→ Belopp: 2 000 kr
→ Förfallodatum: 23 november (14 dagar)
```

**Dag 2 (samma dag) - Du skickar fakturan:**

```
→ Gå till Ekonomi → Fakturor
→ Hitta INV-2025-00123
→ Ladda ner PDF
→ Skicka e-post till anna@example.com:
  "Hej Anna! Tack för din bokning. Här är fakturan..."
→ Klicka "Markera som skickad" i DogPlanner
```

**Dag 5 (12 november) - Anna betalar:**

```
→ Anna betalar 2000 kr via bankgiro
→ OCR: 0001232025001238
→ Pengarna kommer in på DITT företagskonto
```

**Dag 5 (samma dag) - Du ser betalningen:**

```
→ Loggar in på nätbanken
→ Ser: "2000 kr - OCR: 0001232025001238"
→ Går till DogPlanner → Ekonomi → Fakturor
→ Söker på OCR: "0001232025001238"
→ Hittar INV-2025-00123
→ Klickar "Markera som betald"
→ Väljer "Bankgiro"
→ ✅ Status: "paid"
```

**Dag 10 (17 november) - Anna checkar in:**

```
→ Anna kommer med hunden
→ Status: "checked_in"
→ Ingen ny faktura (redan betald förskott)
```

**Dag 15 (22 november) - Anna checkar ut:**

```
→ Hunden hämtas
→ Status: "checked_out"
→ ✅ EFTERSKOTTSFAKTURA SKAPAS (för tillval)
→ INV-2025-00145
→ Belopp: 300 kr (för hundmat och leksaker)
→ Du skickar denna faktura också
```

---

## ❓ VANLIGA FRÅGOR

### "Kan jag automatisera e-postutskicket?"

Inte just nu, men vi jobbar på det. Tills dess: ladda ner PDF → skicka manuellt.

### "Kan systemet hämta betalningar från min bank?"

Inte automatiskt. Men i framtiden kan vi integrera med Fortnox API som synkar betalningar.

### "Vad händer om jag glömmer markera som betald?"

Systemet tror fakturan är obetald → markeras som "Förfallen" → fel statistik.

### "Måste jag använda OCR?"

Rekommenderat men inte obligatoriskt. OCR gör det MYCKET lättare att matcha betalningar.

### "Vad är skillnaden mellan 'draft' och 'sent'?"

- `draft` = Faktura skapad men inte skickad till kund
- `sent` = Du har skickat fakturan (klicka "Markera som skickad")

---

## 🚀 SAMMANFATTNING

### ✅ DogPlanner GÖR:

- Skapar fakturor automatiskt
- Genererar fakturanummer och OCR
- Markerar förfallna fakturor
- Beräknar dröjsmålsränta

### 👤 DU MÅSTE:

- Skicka fakturor via e-post
- Bevaka din bank
- Markera betalda fakturor
- Skicka påminnelser
- Hantera inkasso

### 💡 VIKTIGAST:

**Kolla banken varje vecka och markera betalda fakturor!**

---

**Behöver du hjälp?**  
Kontakta support: support@dogplanner.se

_Uppdaterad: 2025-11-22_
