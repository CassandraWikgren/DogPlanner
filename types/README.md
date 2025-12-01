# 🎯 DogPlanner Type System

**Skapad:** 2025-12-01  
**Syfte:** Centraliserade typdefinitioner för långsiktig hållbarhet och type safety

---

## 📚 Översikt

Detta type system eliminerar behovet av `as any` casts och säkerställer type safety genom hela applikationen.

### Fil-struktur

```
types/
├── auth.ts          # Autentisering & användartyper
├── entities.ts      # Business entities (hundar, ägare, bokningar etc)
├── database.ts      # Supabase schema (auto-genererad)
└── database_AUTO_GENERATED.ts  # Backup av genererad schema
```

---

## 🔐 Auth Types (`types/auth.ts`)

### Användning

```typescript
import { DogPlannerUser, getOrgIdFromUser, hasOrgId } from "@/types/auth";

// I komponenter
const { user } = useAuth(); // user är DogPlannerUser, inte 'any'

// Säker org_id extraktion
const orgId = getOrgIdFromUser(user);

// Type guards
if (hasOrgId(user)) {
  // TypeScript vet nu att user.user_metadata.org_id existerar
  console.log(user.user_metadata.org_id);
}
```

### Viktiga typer

| Typ              | Beskrivning                              |
| ---------------- | ---------------------------------------- |
| `DogPlannerUser` | Utökad Supabase user med typade metadata |
| `UserMetadata`   | user_metadata struktur                   |
| `AppMetadata`    | app_metadata struktur                    |
| `UserProfile`    | Profile från profiles-tabellen           |
| `AuthSession`    | Session-data för AuthContext             |

### Utility Functions

- `hasUserMetadata(user)` - Type guard för metadata
- `hasOrgId(user)` - Kontrollerar om org_id finns
- `getOrgIdFromUser(user)` - Säker org_id extraktion
- `getRoleFromUser(user)` - Säker roll extraktion

---

## 🐕 Entity Types (`types/entities.ts`)

### Användning

```typescript
import type {
  DogWithOwner,
  DogComplete,
  InvoiceWithDetails,
  getDogSize,
} from "@/types/entities";

// I komponenter
const dogs: DogWithOwner[] = await fetchDogs();

// Utility functions
const size = getDogSize(dog.heightcm); // "small" | "medium" | "large"
```

### Bas-typer från Database

```typescript
// Importeras direkt från database schema
export type DbDog = Database["public"]["Tables"]["dogs"]["Row"];
export type DbOwner = Database["public"]["Tables"]["owners"]["Row"];
export type DbRoom = Database["public"]["Tables"]["rooms"]["Row"];
```

### Utökade typer med relationer

```typescript
// Hund med ägarinformation
interface DogWithOwner extends DbDog {
  owners: DbOwner | null;
}

// Hund med alla relationer
interface DogComplete extends DbDog {
  owners: DbOwner | null;
  room?: DbRoom | null;
  subscriptions?: Subscription[];
  extra_services?: ExtraService[];
}
```

### Type-safe enums

```typescript
// Subscription types
type SubscriptionType = "heltid" | "deltid_2" | "deltid_3" | "dagshund";

// Invoice status
type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

// Dog size
type DogSize = "small" | "medium" | "large";
```

### Utility Functions

- `getDogSize(heightCm)` - Beräkna hundstorlek från mankhöjd
- `isValidSubscriptionType(type)` - Type guard för subscription
- `isValidInvoiceStatus(status)` - Type guard för invoice status
- `formatWeekdays(days)` - Formatera veckodagar till läsbar text
- `calculateAge(birthDate)` - Beräkna ålder från födelsedatum

---

## ✅ Validation (`lib/validation.ts`)

### Användning

```typescript
import {
  validateUUID,
  validateEmail,
  isValidDateRange,
  ValidationError,
} from "@/lib/validation";

// Validera UUID
try {
  validateUUID(dogId, "Dog ID");
  // Fortsätt med säker kod
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.code, error.message);
  }
}

// Validera email
if (isValidEmail(email)) {
  // Email är giltig
}

// Validera datumrange
if (!isValidDateRange(startDate, endDate)) {
  throw new ValidationError("Startdatum måste vara före slutdatum");
}
```

### Validerings-funktioner

| Funktion                       | Beskrivning                           |
| ------------------------------ | ------------------------------------- |
| `isValidUUID(uuid)`            | Kontrollerar UUID format              |
| `validateUUID(uuid, name)`     | Validerar UUID, kastar fel            |
| `isValidEmail(email)`          | Kontrollerar email format             |
| `validateEmail(email)`         | Validerar email, kastar fel           |
| `isValidPhone(phone)`          | Kontrollerar svenskt telefonnummer    |
| `isValidDateString(date)`      | Kontrollerar datum format             |
| `isFutureDate(date)`           | Kontrollerar att datum är i framtiden |
| `isValidDateRange(start, end)` | Kontrollerar att start < end          |
| `isPositiveNumber(value)`      | Kontrollerar positivt nummer          |
| `isValidOrgNumber(orgNr)`      | Validerar svenskt org.nummer (Luhn)   |
| `isValidDogSize(size)`         | Type guard för hundstorlek            |

### Error Classes

```typescript
class ValidationError extends Error {
  constructor(message: string, code: string = "[ERR-4001]");
}

class DatabaseError extends Error {
  constructor(message: string, code: string = "[ERR-1001]");
}

class AuthenticationError extends Error {
  constructor(message: string, code: string = "[ERR-5001]");
}
```

---

## 🎨 Best Practices

### ✅ DO: Använd typade imports

```typescript
// ✅ BRA
import type { DogWithOwner } from "@/types/entities";
import { getDogSize } from "@/types/entities";

const dogs: DogWithOwner[] = data;
const size = getDogSize(dog.heightcm);
```

### ❌ DON'T: Använd 'as any'

```typescript
// ❌ DÅLIGT
const user = someUser as any;
const orgId = (user as any).user_metadata?.org_id;

// ✅ BRA
import { getOrgIdFromUser } from "@/types/auth";
const orgId = getOrgIdFromUser(user);
```

### ✅ DO: Använd type guards

```typescript
// ✅ BRA
import { isValidDogSize } from "@/lib/validation";

if (isValidDogSize(size)) {
  // TypeScript vet nu att size är DogSize
  const price = getPriceForSize(size);
}
```

### ✅ DO: Validera user input

```typescript
// ✅ BRA
import { validateEmail, ValidationError } from "@/lib/validation";

try {
  validateEmail(formData.email);
  await saveOwner(formData);
} catch (error) {
  if (error instanceof ValidationError) {
    setError(`${error.code} ${error.message}`);
  }
}
```

---

## 🔄 Migration Guide

### Byta från 'as any' till typade funktioner

**Före:**

```typescript
const user: any = getCurrentUser();
const orgId = user?.user_metadata?.org_id || null;
```

**Efter:**

```typescript
import { DogPlannerUser, getOrgIdFromUser } from "@/types/auth";

const user = getCurrentUser(); // returnerar DogPlannerUser
const orgId = getOrgIdFromUser(user); // type-safe
```

### Byta från inline types till entities

**Före:**

```typescript
interface Dog {
  id: string;
  name: string;
  owners: any;
}
```

**Efter:**

```typescript
import type { DogWithOwner } from "@/types/entities";

// Använd DogWithOwner direkt
const dogs: DogWithOwner[] = data;
```

---

## 📦 Exempel: Komplett komponent

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { DogWithOwner } from "@/types/entities";
import { getDogSize } from "@/types/entities";
import { validateUUID, ValidationError } from "@/lib/validation";

export default function DogsPage() {
  const { currentOrgId } = useAuth();
  const [dogs, setDogs] = useState<DogWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDogs() {
      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      try {
        // Validera org_id
        validateUUID(currentOrgId, "Organisation ID");

        const supabase = createClient();
        const { data, error: dbError } = await supabase
          .from("dogs")
          .select("*, owners(*)")
          .eq("org_id", currentOrgId);

        if (dbError) throw new DatabaseError(dbError.message);

        setDogs(data as DogWithOwner[]);
      } catch (err) {
        if (err instanceof ValidationError) {
          setError(`${err.code} ${err.message}`);
        } else {
          setError("[ERR-5001] Oväntat fel");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDogs();
  }, [currentOrgId]);

  return (
    <div>
      {dogs.map((dog) => (
        <div key={dog.id}>
          <h3>{dog.name}</h3>
          <p>Storlek: {getDogSize(dog.heightcm)}</p>
          <p>Ägare: {dog.owners?.full_name || "Okänd"}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Fördelar

✅ **Type Safety** - Inga `as any` casts behövs  
✅ **Autocomplete** - IDE ger bättre förslag  
✅ **Refactoring** - Enklare att ändra strukturer  
✅ **Dokumentation** - Typer är self-documenting  
✅ **Fel-prevention** - TypeScript fångar fel vid kompilering  
✅ **Validering** - Konsekventa felmeddelanden med felkoder  
✅ **Maintainability** - Lättare att förstå kod 6 månader senare

---

## 📝 Underhåll

### När database schema ändras:

1. Kör `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts`
2. Uppdatera `types/entities.ts` om nya tabeller/kolumner tillkommit
3. Kör `npm run build` för att verifiera att inga type errors introducerats

### När nya features läggs till:

1. Definiera typer i `types/entities.ts` FÖRST
2. Implementera validation i `lib/validation.ts` om behövs
3. Använd typerna i komponenter/funktioner
4. Testa att TypeScript-kompileringen fungerar

---

**Skapad av:** DogPlanner Development Team  
**Datum:** 2025-12-01  
**Version:** 1.0
