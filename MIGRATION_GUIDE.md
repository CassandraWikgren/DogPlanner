# 🚀 DogPlanner - Komplett Supabase Strukturförbättring

## 📋 Översikt av problem och lösningar

### 🔍 Identifierade problem:

1. **Inkonsistent fältnamn**: `heightcm` vs `heightCm` vs `height`
2. **Förväxling av relationer**: Arrays vs objekt för `owners`, `rooms`
3. **Saknade tabeller**: `boarding_prices`, `boarding_seasons`, `owner_discounts`
4. **Inkonsistent namngivning**: `dog_id` vs `dogs_id`, `capacity` vs `capacity_m2`
5. **Bristfällig typning**: Saknade TypeScript-definitioner

### ✅ Implementerade lösningar:

1. **Standardiserad schema** (`/supabase/schema.sql`)
2. **TypeScript-typer** (`/types/database.ts`)
3. **Hjälpfunktioner** (`/lib/supabase-helpers.ts`)
4. **Uppdaterad Supabase-klient** (`/lib/supabase.ts`)
5. **Refaktorerad komponent** (`/app/hundpensionat/bokningsformulär/page.tsx`)

## 🗂️ Nya filer och strukturer

### 1. `/types/database.ts`

- Kompletta TypeScript-typer för alla tabeller
- Standardiserade interface för relationer
- Type-safe databas-operationer

### 2. `/supabase/schema.sql`

- Komplett SQL-schema för alla tabeller
- Triggers för `updated_at`
- Row Level Security (RLS) policies
- Exempeldata

### 3. `/lib/supabase-helpers.ts`

- Standardiserade fetch-funktioner
- Datanormalisering
- Beräkningsfunktioner (rumsbeläggning, hundstorlek)
- Valideringsfunktioner

## 🛠️ Migreringsplan

### Steg 1: Kör SQL-schemat

```sql
-- Kör innehållet i /supabase/schema.sql i din Supabase SQL Editor
-- Detta skapar/uppdaterar alla tabeller med korrekt struktur
```

### Steg 2: Uppdatera befintliga komponenter

#### Exempel: Uppdatera `/app/hunddagis/page.tsx`

```tsx
// Gammal kod:
const { data, error } = await supabase
  .from("dogs")
  .select("*, owners(full_name), rooms(name)");

// Ny kod:
import { fetchDogsWithRelations } from "@/lib/supabase-helpers";

const dogs = await fetchDogsWithRelations(supabase, orgId, {
  includeCheckedOut: false,
});
```

#### Exempel: Uppdatera `/app/rooms/page.tsx`

```tsx
// Gammal kod:
const { data: rooms } = await supabase.from("rooms").select("*");
const { data: dogs } = await supabase.from("dogs").select("*, rooms(id, name)");

// Ny kod:
import { fetchRoomsWithOccupancy } from "@/lib/supabase-helpers";

const roomsWithOccupancy = await fetchRoomsWithOccupancy(supabase, orgId);
```

### Steg 3: Standardisera fältnamn

#### Uppdatera alla referenser till:

- `heightCm` → `heightcm`
- `room_id` (använd konsekvent)
- `capacity_m2` (använd konsekvent)
- `owners` (singular objekt efter normalisering)

### Steg 4: Implementera ny prisberäkning

Ditt befintliga `/lib/pricing.ts` är redan bra strukturerat! Behöver bara mindre justeringar:

```tsx
// I bokningsformulär eller prisberäkning:
import { getDogSizeCategory } from "@/lib/supabase-helpers";
import { calculatePrice } from "@/lib/pricing";

const sizeCategory = getDogSizeCategory(selectedHund.heightcm);
const priceResult = await calculatePrice({
  supabase,
  dog: selectedHund,
  booking: bookingData,
  org,
});
```

## 📊 Viktiga databasfält som ska standardiseras

### Tabell: `dogs`

```sql
-- STANDARDISERAT
heightcm INTEGER          -- Inte heightCm eller height
room_id UUID              -- Inte roomid eller roomId
owner_id UUID             -- Inte ownerId
checked_in BOOLEAN        -- För dagens in/utcheckning
checkin_date DATE         -- Planerad incheckning
checkout_date DATE        -- Planerad utcheckning
```

### Tabell: `rooms`

```sql
-- STANDARDISERAT
capacity_m2 NUMERIC       -- Inte capacity
room_type TEXT            -- 'daycare', 'boarding', 'both'
```

### Tabell: `bookings`

```sql
-- NY STRUKTUR
extra_service_ids JSONB   -- Array med ID:n
discount_amount NUMERIC   -- Inte rabatt
status TEXT               -- 'pending', 'confirmed', etc.
```

## 🔧 Refaktoreringsplan för befintliga filer

### 1. `/app/hunddagis/page.tsx`

```tsx
// Ersätt fetch-logik med:
import { fetchDogsWithRelations } from "@/lib/supabase-helpers";

const dogs = await fetchDogsWithRelations(supabase, orgId);
// Nu är dogs[0].owners redan ett objekt, inte array
```

### 2. `/app/hundpensionat/page.tsx`

```tsx
// Ersätt fetch-logik med:
import { fetchBookingsWithRelations } from "@/lib/supabase-helpers";

const bookings = await fetchBookingsWithRelations(supabase, orgId, {
  status: ["confirmed", "checked_in"],
});
```

### 3. `/app/rooms/page.tsx`

```tsx
// Ersätt beräkningslogik med:
import { fetchRoomsWithOccupancy } from "@/lib/supabase-helpers";

const rooms = await fetchRoomsWithOccupancy(supabase, orgId);
// rooms[0].occupancy innehåller all beräkningsdata
```

### 4. `/app/dagens/page.tsx`

```tsx
// Förbättra select med:
import { fetchDogsWithRelations } from "@/lib/supabase-helpers";

const dogs = await fetchDogsWithRelations(supabase, orgId);
// Använd validateBookingData för konsistens
```

## 🧪 Testplan

### 1. Testa bokningsflödet

```bash
# Starta dev-servern
npm run dev

# Navigera till /hundpensionat/bokningsformulär
# Testa:
# - Välj hund (ska visa ägare korrekt)
# - Välj rum (ska visa kapacitet)
# - Beräkna pris (ska fungera med nya pricing.ts)
# - Spara bokning (ska spara med nya fältnamn)
```

### 2. Testa datavisning

```bash
# Testa varje sida:
# - /hunddagis (ska visa normaliserade relationer)
# - /rooms (ska visa korrekt beläggning)
# - /dagens (ska fungera med nya strukturen)
# - /hundpensionat (ska visa bokningar korrekt)
```

## 📋 Checklista för fullständig migrering

### Databas

- [ ] Kör `/supabase/schema.sql`
- [ ] Verifiera att alla tabeller finns
- [ ] Kontrollera RLS-policies
- [ ] Lägg till exempeldata

### Kod

- [ ] Uppdatera `/lib/supabase.ts` med typning
- [ ] Integrera `/lib/supabase-helpers.ts`
- [ ] Refaktorera `/app/hunddagis/page.tsx`
- [ ] Refaktorera `/app/hundpensionat/page.tsx`
- [ ] Refaktorera `/app/rooms/page.tsx`
- [ ] Refaktorera `/app/dagens/page.tsx`
- [ ] Uppdatera alla komponenter som använder `owners` som array

### Tester

- [ ] Alla sidor laddar utan fel
- [ ] CRUD-operationer fungerar
- [ ] Relationer visas korrekt (ej arrays)
- [ ] Prisberäkning fungerar
- [ ] Toast-meddelanden fungerar

## 🚨 Potentiella problem och lösningar

### Problem: "owners is an array"

```tsx
// Fel:
dog.owners[0].full_name;

// Rätt (efter normalisering):
dog.owners?.full_name;
```

### Problem: "heightCm vs heightcm"

```tsx
// Fel:
dog.heightCm;

// Rätt:
dog.heightcm;
```

### Problem: "capacity vs capacity_m2"

```tsx
// Fel:
room.capacity;

// Rätt:
room.capacity_m2;
```

### Problem: "Toast fungerar inte"

```tsx
// Fel:
toast({ title: "Sparat", description: "Data sparad" });

// Rätt:
toast("Data sparad", "success");
```

## 📈 Fördelar med nya strukturen

1. **Type Safety**: TypeScript-typning förhindrar fel
2. **Konsistens**: Alla komponenter använder samma mönster
3. **Prestanda**: Optimerade queries med korrekt select
4. **Underhåll**: Centraliserade hjälpfunktioner
5. **Skalbarhet**: Lätt att lägga till nya funktioner
6. **Felsökning**: Bättre error handling och logging

Denna struktur ger dig en solid grund för framtida utveckling och gör koden mycket mer underhållbar!
