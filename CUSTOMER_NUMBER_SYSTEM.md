# Customer Number System - Dokumentation

## 🎯 Översikt

Varje hundägare i DogPlanner får ett **unikt kundnummer** (`customer_number`) som följer dem överallt, oavsett vilket pensionat eller dagis de bokar hos.

## 🔢 Hur det fungerar

### Auto-generering

- När en ny ägare skapas i `owners` tabellen, genereras `customer_number` automatiskt
- Startar från 1 och räknas upp för varje ny ägare
- Är **globalt unikt** - inget duplicering mellan olika organisationer

### För hundägare

```
Hundägare registrerar sig
  ↓
owners.customer_number = 1234 (auto-genererat)
  ↓
Kan boka på Pensionat A → org_id: org-a
Kan boka på Pensionat B → org_id: org-b
Kan boka på Dagis C → org_id: org-c
  ↓
Samma kundnummer (1234) i alla bokningar
```

### För företag

```
Företag ser endast sina egna bokningar:

bookings WHERE org_id = 'sitt_org_id'
  ↓
Ser customer_number för spårbarhet
Men ser INTE vad kunden bokat på andra ställen
```

## 📊 Databas-struktur

### owners tabell

```sql
CREATE TABLE owners (
  id uuid PRIMARY KEY,
  customer_number SERIAL UNIQUE,  -- Auto-genereras, globalt unikt
  full_name text,
  email text UNIQUE,
  phone text,
  created_at timestamptz
);
```

### bookings tabell

```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES owners(id),
  org_id uuid REFERENCES orgs(id),  -- VIKTIGT för filtrering
  dog_id uuid REFERENCES dogs(id),
  start_date date,
  end_date date,
  total_price numeric,
  status text
);
```

## 🔒 Säkerhet & Integritet

### Vad hundägare kan se

- Sina egna bokningar (alla org_id)
- Sina hundar
- Sin bokningshistorik över alla pensionat

### Vad företag kan se

```sql
SELECT
  b.*,
  o.customer_number,
  o.full_name,
  d.name as dog_name
FROM bookings b
JOIN owners o ON b.owner_id = o.id
JOIN dogs d ON b.dog_id = d.id
WHERE b.org_id = current_org_id;  -- Endast sina egna bokningar
```

### Vad företag INTE kan se

- Bokningar på andra pensionat/dagis
- Andra organisationers kundregister
- Hundar som inte bokat hos dem

## 🛠️ Implementation

### Vid kundregistrering (CreateAccountOffer.tsx)

```typescript
// 1. Skapa auth user
const { data: authData } = await supabase.auth.signUp({
  email: ownerEmail,
  password: password,
});

// 2. Skapa owner (customer_number genereras automatiskt av trigger)
const { data: ownerData } = await supabase
  .from("owners")
  .insert([
    {
      id: authData.user.id,
      full_name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      // customer_number: INTE SATT - genereras av trigger
    },
  ])
  .select()
  .single();

// Result: ownerData.customer_number = 1234 (automatiskt)
```

### Vid bokning (kundportal/boka eller ansokan/pensionat)

```typescript
// Skapa bokning med org_id för att länka till specifikt företag
const { data: bookingData } = await supabase.from("bookings").insert([
  {
    dog_id: selectedDog,
    owner_id: dogData.owner_id, // Länkar till owner med customer_number
    org_id: pensionatData.org_id, // Länkar till specifikt företag
    start_date: checkinDate,
    end_date: checkoutDate,
    total_price: priceData.totalPrice,
    status: "pending",
  },
]);
```

### Företag hämtar sina bokningar (hundpensionat/page.tsx)

```typescript
const { data: bookings } = await supabase
  .from("bookings")
  .select(
    `
    *,
    dogs (
      name,
      breed,
      owners (
        customer_number,  // Visar kundnummer
        full_name,
        phone,
        email
      )
    )
  `
  )
  .eq("org_id", currentOrgId) // KRITISKT: Filtrerar på företagets ID
  .eq("status", "pending");
```

## ✅ Verifiering

### Test 1: Auto-generering

```sql
-- Skapa en testägare
INSERT INTO owners (id, full_name, email, phone)
VALUES (gen_random_uuid(), 'Test Hundägare', 'test@example.com', '070-1234567')
RETURNING customer_number;

-- Förväntat: customer_number = [auto-genererat nummer, t.ex. 1234]
```

### Test 2: Unikhet

```sql
-- Försök skapa två ägare med samma customer_number (ska misslyckas)
INSERT INTO owners (customer_number, full_name, email)
VALUES (1234, 'Test A', 'testa@example.com');

INSERT INTO owners (customer_number, full_name, email)
VALUES (1234, 'Test B', 'testb@example.com');

-- Förväntat: Andra INSERT misslyckas pga UNIQUE constraint
```

### Test 3: Företag ser endast sina bokningar

```sql
-- Företag A (org_id = 'org-a')
SELECT COUNT(*) FROM bookings WHERE org_id = 'org-a';
-- Förväntat: Endast bokningar för org-a

-- Företag B (org_id = 'org-b')
SELECT COUNT(*) FROM bookings WHERE org_id = 'org-b';
-- Förväntat: Endast bokningar för org-b

-- Samma owner_id kan ha bokningar i båda
SELECT owner_id, COUNT(*)
FROM bookings
WHERE owner_id = 'någon-owner-uuid'
GROUP BY owner_id;
-- Förväntat: Kan ha bokningar på flera org_id
```

## 🚀 Fördelar

### För hundägare

- ✅ Ett kundnummer som fungerar överallt
- ✅ Slipper fylla i uppgifter varje gång
- ✅ Enkel bokningshistorik
- ✅ Kan boka på vilket pensionat som helst

### För företag

- ✅ Kan identifiera återkommande kunder
- ✅ Ser endast sina egna bokningar (säkerhet)
- ✅ Kan ge rabatter baserat på antal besök
- ✅ Enkel kundadministration

### För systemet

- ✅ Global identifiering av kunder
- ✅ Ingen duplicering av kunddata
- ✅ Enkel rapportering och statistik
- ✅ GDPR-compliant (data isolering per org)

## 📝 Migration

Kör migrationen i Supabase SQL Editor:

```bash
supabase/migrations/setup_customer_number_auto_generation.sql
```

Detta skapar:

1. customer_number kolumn (om den inte finns)
2. auto_generate_customer_number() funktion
3. trigger_auto_customer_number trigger
4. Unikt index för customer_number
5. Uppdaterar befintliga owners med kundnummer

## 🔍 Troubleshooting

### Problem: customer_number är NULL

**Lösning**:

```sql
-- Kör trigger-migrationen igen
-- Eller uppdatera manuellt:
UPDATE owners
SET customer_number = nextval('owners_customer_number_seq')
WHERE customer_number IS NULL;
```

### Problem: Duplicerade customer_number

**Lösning**:

```sql
-- Hitta dupliceringar
SELECT customer_number, COUNT(*)
FROM owners
GROUP BY customer_number
HAVING COUNT(*) > 1;

-- Fixa manuellt eller kör migration igen
```

### Problem: Företag ser andras bokningar

**Lösning**:

```typescript
// Kontrollera att ALLA queries har org_id filter
const { data } = await supabase
  .from("bookings")
  .select("*")
  .eq("org_id", currentOrgId); // MÅSTE finnas!
```
