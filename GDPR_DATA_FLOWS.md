# GDPR Dataflöden i DogPlanner

Skapad: 2025-12-06

## Översikt

DogPlanner har tre olika verksamhetstyper med olika GDPR-krav baserat på vilken typ av data som lagras:

---

## 🐕 Hunddagis

### Datalager

- **Full kunddata** lagras i `owners` och `dogs` tabeller
- Personnummer, adress, kontaktuppgifter, betalningsinformation
- Journalanteckningar och hälsoinformation

### GDPR-krav

- ✅ **Kräver aktivt samtycke**
- Kunder måste ansöka om dagisplats genom formulär
- Formuläret innehåller GDPR-godkännande
- Ingen manuell kundregistrering utan samtycke

### Flöde

1. Kund fyller i ansökningsformulär (med GDPR-checkbox)
2. Systemet skapar `owner` och `dog` poster
3. Admin godkänner/nekar ansökan
4. Vid godkännande skapas fullständigt kundkonto

---

## 🏠 Hundpensionat

### Datalager

- **Full kunddata** lagras i `owners`, `dogs`, `bookings`
- Personnummer, adress, kontaktuppgifter
- Bokningshistorik och betalningar

### GDPR-krav

- ✅ **Kräver aktivt samtycke**
- Kunder måste göra bokningsförfrågan
- Bokningsformuläret innehåller GDPR-godkännande
- Ingen manuell kundregistrering utan samtycke

### Flöde

1. Kund gör bokningsförfrågan (med GDPR-checkbox)
2. Systemet skapar `owner`, `dog`, `booking` poster
3. Admin godkänner/nekar bokningen
4. Vid godkännande aktiveras fullständigt kundkonto

---

## ✂️ Hundfrisör

### Datalager

- **Minimal kunddata** - två olika spårningar:

#### Befintlig kund (från dagis/pensionat)

- Refererar till `dogs.id` i `grooming_bookings.dog_id`
- Använder redan godkänd kunddata

#### Walk-in kund (telefonbokning)

- Data lagras ENDAST i `grooming_bookings`:
  - `external_customer_name` - Kundens namn
  - `external_customer_phone` - Telefonnummer
  - `external_dog_name` - Hundens namn
  - `external_dog_breed` - Ras
- Ingen personnummer, ingen adress
- Data raderas inte automatiskt, men är minimal

### GDPR-krav

- ⚠️ **Inget formellt samtycke krävs**
- Endast minimal data lagras (namn, telefon, hundinfo)
- Betalning sker i kassan (ej fakturering)
- Journal lagras för tjänstekvalitet

### Flöde - Befintlig kund

1. Personal söker efter hund i registret
2. Bokning kopplas till befintlig `dog_id`
3. Använder redan godkänd kunddata

### Flöde - Walk-in kund (telefonbokning)

1. Personal väljer "Walk-in Kund"
2. Anger: kundnamn, telefon, hundnamn, ras
3. Bokning sparas med `external_*` fält
4. Kunden kan sökas upp vid nästa besök
5. Ingen data i `owners`/`dogs` tabeller

---

## Databasstruktur för frisör-bokningar

```sql
-- grooming_bookings tabell stödjer båda flödena:

-- Befintlig kund:
dog_id UUID REFERENCES dogs(id)  -- Koppling till befintlig hund

-- Walk-in kund:
external_customer_name TEXT      -- Kundens namn
external_customer_phone TEXT     -- Telefonnummer
external_dog_name TEXT           -- Hundens namn
external_dog_breed TEXT          -- Ras
```

---

## Sammanfattning

| Verksamhet | GDPR-samtycke | Datalagring                   | Personnummer |
| ---------- | ------------- | ----------------------------- | ------------ |
| Hunddagis  | ✅ Krävs      | Full (owners, dogs)           | ✅ Ja        |
| Pensionat  | ✅ Krävs      | Full (owners, dogs, bookings) | ✅ Ja        |
| Hundfrisör | ⚠️ Ej krävt   | Minimal (grooming_bookings)   | ❌ Nej       |

---

## Tekniska implementationer

### Hunddagis ansökningsformulär

- Fil: `app/kundportal/ansokan/page.tsx`
- GDPR-checkbox måste vara ifylld

### Pensionat bokningsformulär

- Fil: `app/hundpensionat/nybokning/page.tsx`
- GDPR-checkbox måste vara ifylld

### Hundfrisör bokningsformulär

- Fil: `app/frisor/ny-bokning/page.tsx`
- Två lägen: "Befintlig Hund" och "Walk-in Kund"
- Walk-in sparar endast i `grooming_bookings` (inte owners/dogs)
