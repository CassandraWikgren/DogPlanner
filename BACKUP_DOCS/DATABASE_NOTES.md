# 💾 DATABASE NOTES - DogPlanner

## 🚨 VIKTIGA DATABASPROBLEM

### Row Level Security (RLS) Problem

**Problem:** Supabase RLS blockerar dataåtkomst för anonymous/test users
**Lösning:** `ALTER TABLE [table] DISABLE ROW LEVEL SECURITY;`

### Triggers som orsakar problem

```sql
-- Dessa triggers måste tas bort:
DROP TRIGGER IF EXISTS set_org_user_dogs ON public.dogs;
DROP TRIGGER IF EXISTS set_org_user_owners ON public.owners;
DROP TRIGGER IF EXISTS set_org_user_rooms ON public.rooms;
DROP TRIGGER IF EXISTS trg_auto_anonymize_owner ON public.owners;
DROP TRIGGER IF EXISTS trigger_anonymize_owner ON public.owners;
```

### Funktioner som kraschar

```sql
-- Ta bort dessa funktioner:
DROP FUNCTION IF EXISTS set_org_user();
DROP FUNCTION IF EXISTS trigger_anonymize_owner();
DROP FUNCTION IF EXISTS anonymize_owner(uuid);
```

## 📊 TABELLSTRUKTUR

### `orgs` - Organisationer

```sql
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_number TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `owners` - Hundägare

```sql
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    org_id UUID REFERENCES orgs(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `dogs` - Hundar

```sql
CREATE TABLE dogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    breed TEXT,
    subscription TEXT,
    owner_id UUID REFERENCES owners(id),
    org_id UUID REFERENCES orgs(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `rooms` - Rum (för pensionat)

```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    capacity_m2 DECIMAL,
    room_type TEXT CHECK (room_type IN ('daycare', 'boarding', 'both')),
    max_dogs INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    org_id UUID REFERENCES orgs(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `bookings` - Bokningar (hundpensionat)

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id UUID REFERENCES dogs(id),
    room_id UUID REFERENCES rooms(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    total_price DECIMAL,
    deposit_paid BOOLEAN DEFAULT false,
    org_id UUID REFERENCES orgs(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 VANLIGA SQL-KOMMANDON

### Kolla databasinnehåll

```sql
-- Räkna rader i alla tabeller
SELECT 'dogs' as table_name, COUNT(*) FROM dogs
UNION ALL SELECT 'owners', COUNT(*) FROM owners
UNION ALL SELECT 'orgs', COUNT(*) FROM orgs
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings;
```

### Kolla tabellstruktur

```sql
-- PostgreSQL kommando för att se kolumner
\d dogs
\d owners
\d orgs
\d rooms
\d bookings
```

### Rensa allt (FARLIGT!)

```sql
-- VARNING: Tar bort ALL data
TRUNCATE dogs CASCADE;
TRUNCATE owners CASCADE;
TRUNCATE orgs CASCADE;
TRUNCATE rooms CASCADE;
TRUNCATE bookings CASCADE;
```

## 🎯 TESTDATA SOM FUNGERAR

### Från complete_testdata.sql

```sql
-- Organisation
INSERT INTO orgs (name, org_number) VALUES ('Test Hunddagis', '556123456');

-- Ägare
INSERT INTO owners (full_name, email, phone, org_id)
SELECT 'Anna Andersson', 'anna@test.se', '070-111111', id
FROM orgs WHERE name = 'Test Hunddagis';

-- Hund
INSERT INTO dogs (name, breed, subscription, owner_id, org_id)
SELECT 'Bella', 'Golden Retriever', 'Heltid', o.id, g.id
FROM owners o, orgs g
WHERE o.full_name = 'Anna Andersson' AND g.name = 'Test Hunddagis';
```

## 🚨 AKUT FELSÖKNING

### Problem: "ERR-42703 column does not exist"

**Orsak:** Fel i SQL-query, oftast JOIN-problem
**Lösning:** Kontrollera att alla tabeller/kolumner finns i queryn

### Problem: "No data" / Tom sida

**Orsak:** RLS blockerar, eller inga data i databasen
**Lösning:** Kör `complete_testdata.sql`

### Problem: Triggers error

**Orsak:** Komplexa triggers som försöker sätta org_id automatiskt
**Lösning:** Ta bort alla triggers med `DROP TRIGGER`

### Problem: Function does not exist

**Orsak:** Funktioner som triggers anropar saknas
**Lösning:** Ta bort funktionerna med `DROP FUNCTION`

## 🔄 DATABAS ÅTERSTÄLLNING

### Snabb fix (rekommenderas)

```sql
-- Kör complete_testdata.sql i Supabase SQL Editor
-- Den fixar allt automatiskt
```

### Manuell återställning

```sql
-- 1. Ta bort triggers
DROP TRIGGER IF EXISTS set_org_user_dogs ON public.dogs;
-- (se complete_testdata.sql för alla)

-- 2. Inaktivera RLS
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- 3. Lägg till testdata
-- (se testdata-sektion ovan)
```

---

**Uppdaterad:** Oktober 2025  
**Baserat på:** Framgångsrik lösning av hunddagis-problem  
**Viktigt:** complete_testdata.sql är den säkraste lösningen
