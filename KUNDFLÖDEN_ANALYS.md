# Kundflöden - Analys och Åtgärdsplan

## 🎯 Övergripande struktur

### Två separata målgrupper:

1. **HUNDÄGARE (B2C)** - Vill boka pensionat/dagis
2. **FÖRETAG (B2B)** - Driver pensionat/dagis

---

## 📊 NULÄGE - Vad som finns

### Huvudsidor

- `/` (page.tsx) - Landingpage för hundägare ✅
- `/foretag` - Landingpage för företag ✅

### Hundägare-sidor

- `/kundportal/login` - Login för hundägare ✅
- `/kundportal/registrera` - Registrering för hundägare ✅
- `/kundportal/dashboard` - Dashboard för inloggad hundägare ✅
- `/kundportal/boka` - Bokning när man är inloggad ✅
- `/ansokan/pensionat` - Bokning UTAN konto ✅
- `/ansokan/hunddagis` - Bokning UTAN konto ✅

### Företags-sidor

- `/login` - Login för FÖRETAG ✅
- `/register` - Registrering för FÖRETAG ✅
- `/dashboard` - Dashboard för inloggat företag ✅

---

## ❌ PROBLEM som behöver fixas

### 1. Förvirring på login/register-sidorna

**Problem:**

- På `/kundportal/login` står det "Har du inget konto? Skapa konto" → går till `/kundportal/registrera` ✅ RÄTT
- Men länken "Skapa konto" kan vara förvirrande - vilken typ av konto?

**Lösning:**

- Tydliggör att `/kundportal/registrera` är för HUNDÄGARE
- Lägg till text: "Registrera dig som hundägare"

### 2. Landingpage bokningsknappar

**Problem:**

- "🏠 Boka pensionat" går direkt till `/ansokan/pensionat` (bokning utan konto)
- Ingen valmöjlighet att logga in eller skapa konto FÖRST

**Lösning:**

- När man klickar "Boka pensionat" → Visa modal/sida med 3 alternativ:
  1. **Boka utan konto** (snabbt, engångsbokning)
  2. **Logga in** (befintlig kund)
  3. **Skapa konto** (ny kund som vill spara info)

### 3. Kundnummer-system saknas

**Problem:**

- Kundnummer finns i `owners` tabellen men används inte konsekvent
- Behöver vara globalt över alla pensionat
- Varje pensionat ska bara se sina egna bokningar

**Lösning:**

- När hundägare skapar konto → Auto-generera customer_number
- customer_number är unikt per ägare (globalt)
- Företag ser bara bookings där `org_id = deras_org`

---

## ✅ MÅLBILD - Hur det SKA fungera

### HUNDÄGARE (Customer Journey)

#### Scenario A: Bokning utan konto (första gången)

1. Hundägare på `/` → Klickar "Boka pensionat"
2. **NY: Modal med val**:
   - "Boka utan konto" → `/ansokan/pensionat`
   - "Logga in" → `/kundportal/login`
   - "Skapa konto först" → `/kundportal/registrera`
3. Väljer "Boka utan konto"
4. Fyller i formulär (ägare + hund + datum)
5. **EFTER framgångsrik bokning**: Erbjud att skapa konto med ifyllda uppgifter
   - "Vill du spara dina uppgifter för framtida bokningar?"
   - **JA** → Skapa konto automatiskt, få kundnummer
   - **NEJ** → Klar

#### Scenario B: Skapa konto direkt

1. Hundägare på `/` → Klickar "Boka pensionat"
2. **NY: Modal med val** → Väljer "Skapa konto först"
3. Går till `/kundportal/registrera`
4. Fyller i ägare + hund + lösenord + GDPR
5. Skapar konto → Får customer_number
6. Redirectas till `/kundportal/dashboard`
7. Kan nu boka från `/kundportal/boka` (ifyllt med sparad info)

#### Scenario C: Återkommande kund (har konto)

1. Hundägare på `/` → Klickar "Boka pensionat"
2. **NY: Modal med val** → Väljer "Logga in"
3. Går till `/kundportal/login`
4. Loggar in → `/kundportal/dashboard`
5. Klickar "Ny bokning" → `/kundportal/boka`
6. Väljer hund (dropdown med sparade hundar)
7. Väljer pensionat
8. Väljer datum
9. Skickar ansökan

---

### FÖRETAG (Business Journey)

#### Scenario: Nytt företag

1. Företagsägare på `/foretag` → Klickar "Prova gratis"
2. Går till `/register` (ENDAST för företag)
3. Fyller i företagsinfo + län + kommun + tjänster
4. Skapar konto → org_id skapas
5. Redirectas till `/dashboard`
6. Ser ansökningar från kunder (status: pending)

#### Scenario: Befintligt företag

1. Företagsägare på `/foretag` → Klickar "Logga in"
2. Går till `/login` (ENDAST för företag)
3. Loggar in → `/dashboard`
4. Ser sina bokningar filtrerade på `org_id`

---

## 🔧 IMPLEMENTATIONSPLAN

### Steg 1: Tydliggör register-sidor ✅

- `/kundportal/registrera` → "Registrera dig som hundägare"
- `/register` → "Registrera ditt företag"

### Steg 2: Skapa bokningsmodal för landingpage

- Ny komponent: `BookingOptionsModal.tsx`
- Visa 3 alternativ när man klickar "Boka pensionat"

### Steg 3: Implementera "Skapa konto efter bokning"

- Efter framgångsrik bokning i `/ansokan/pensionat`
- Visa erbjudande att skapa konto
- Pre-fyll data från bokningen

### Steg 4: Säkerställ customer_number system

- Auto-generera när ägare skapas
- Unikt globalt nummer
- Företag ser bara sina bokningar (org_id filter)

### Steg 5: Uppdatera kundportal/boka

- Hämta sparade hundar från owners.dogs
- Pre-fyll ägaruppgifter
- Enklare bokning för återkommande kunder

---

## 🎨 UI/UX Förbättringar

### På landingpage (/)

```
[Boka pensionat] → Modal:
┌─────────────────────────────────┐
│   Välj hur du vill boka         │
├─────────────────────────────────┤
│ 🚀 Snabboka utan konto          │
│    (För engångsbokning)         │
├─────────────────────────────────┤
│ 🔐 Logga in                     │
│    (Jag har redan ett konto)    │
├─────────────────────────────────┤
│ ✨ Skapa konto först            │
│    (Spara mina uppgifter)       │
└─────────────────────────────────┘
```

### Efter bokning utan konto

```
✅ Din ansökan är skickad!

💡 Vill du spara dina uppgifter?
   Skapa ett gratis konto för att:
   • Boka snabbare nästa gång
   • Se alla dina bokningar
   • Uppdatera hunduppgifter

   [Ja, skapa konto] [Nej tack]
```

---

## 🔒 Säkerhet & Integritet

### För hundägare

- customer_number är unikt per ägare
- Ägare ser bara sina egna hundar och bokningar
- Kan boka på vilket pensionat som helst

### För företag

- org_id filtrerar alla queries
- Ser bara bokningar där `bookings.org_id = sitt_org_id`
- Ser aldrig kundnummer från andra pensionat
- Kan se customer_number för spårbarhet

---

## 📋 Databas-schema

### owners (hundägare)

```sql
- id (primary key)
- customer_number (UNIKT, AUTO-GENERERAT) ← VIKTIGT
- full_name
- email (unikt)
- phone
- address, city, postal_code
- created_at
```

### orgs (företag)

```sql
- id (primary key)
- name
- org_number
- lan, kommun
- service_types
- created_at
```

### bookings

```sql
- id
- owner_id → owners.id
- dog_id → dogs.id
- org_id → orgs.id ← VIKTIGT för filtrering
- start_date
- end_date
- status (pending, confirmed, checked_out)
- total_price
- created_at
```

---

## 🎯 Success Metrics

### För hundägare

- ✅ Kan boka utan konto (låg tröskel)
- ✅ Kan skapa konto när de vill
- ✅ Alla uppgifter sparade för nästa gång
- ✅ Unikt kundnummer som fungerar överallt

### För företag

- ✅ Tydlig separation från hundägare
- ✅ Ser bara sina egna bokningar
- ✅ Kan identifiera återkommande kunder via customer_number
- ✅ Ingen förvirring med login/register
