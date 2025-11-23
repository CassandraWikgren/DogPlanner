# API Error Handling - Migration Guide

## Översikt

Vi har standardiserat all API error handling i DogPlanner med en central modul: `lib/apiErrors.ts`

## Fördelar

✅ **Konsistent error format** - Alla endpoints returnerar samma struktur  
✅ **Mindre kod** - validateAuth() ersätter 50+ rader boilerplate  
✅ **Bättre felmeddelanden** - Standardiserade error codes  
✅ **Type-safe** - Full TypeScript-stöd  
✅ **Enklare maintenance** - Ändra authentication-logik på ett ställe

## Migration: Före vs Efter

### FÖRE (195 rader)

```typescript
export async function POST(request: NextRequest) {
  try {
    // 50+ rader för att få access token från cookies
    const cookies = request.cookies;
    let accessToken: string | undefined;
    const authCookie = cookies.get('sb-...-auth-token');
    // ... massa parsing ...

    if (!accessToken) {
      return NextResponse.json({
        error: "Unauthorized",
        details: "No authentication token found"
      }, { status: 401 });
    }

    // 20+ rader för att verifiera user
    const supabase = createClient(url, key, { headers: ... });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: ... }, { status: 401 });
    }

    // 20+ rader för att hämta org_id
    const { data: profile, error: profileError } = await supabase...
    if (profileError || !profile) {
      return NextResponse.json({ error: ... }, { status: 403 });
    }

    // Äntligen kan vi börja med business logic!
    const body = await request.json();
    // ...
  } catch (error) {
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
```

### EFTER (95 rader)

```typescript
import { validateAuth, errorResponse, successResponse } from "@/lib/apiErrors";

export async function POST(request: NextRequest) {
  try {
    // 1 rad för auth + org_id! 🎉
    const { user, orgId } = await validateAuth();

    // Business logic direkt!
    const body = await request.json();
    validateRequired(body, ["bookingId", "totalPrice"]);
    validateUUID(body.bookingId);

    // ... business logic ...

    return successResponse(data, "Success!");
  } catch (error) {
    return errorResponse(error); // Hanterar alla error types automatiskt
  }
}
```

## API Error Module

### Funktioner

#### `validateAuth()`

Ersätter all authentication boilerplate.

```typescript
const { user, orgId } = await validateAuth();
// Kastar ApiError(401) om user saknas
// Kastar ApiError(403) om org_id saknas
```

#### `validateRequired()`

Validerar required fields i request body.

```typescript
validateRequired(body, ["name", "email", "phone"]);
// Kastar ApiError(400) om något saknas
```

#### `validateEmail()` & `validateUUID()`

Format-validering.

```typescript
validateEmail(body.email);
validateUUID(body.userId);
```

#### `errorResponse()`

Standardiserar alla error responses.

```typescript
catch (error) {
  return errorResponse(error);
}
```

Returnerar alltid:

```json
{
  "error": "Error message",
  "details": "Additional context",
  "code": "[ERR-XXXX]"
}
```

#### `successResponse()`

Standardiserar success responses.

```typescript
return successResponse(data, "Operation successful");
```

Returnerar:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Codes

| Code         | Betydelse             |
| ------------ | --------------------- |
| `[ERR-1001]` | Database error        |
| `[ERR-2001]` | PDF export error      |
| `[ERR-3001]` | Realtime error        |
| `[ERR-4001]` | Unauthorized          |
| `[ERR-4002]` | Forbidden             |
| `[ERR-4003]` | No org assigned       |
| `[ERR-4004]` | Validation error      |
| `[ERR-4005]` | Invalid email         |
| `[ERR-4006]` | Invalid UUID          |
| `[ERR-4007]` | Not found             |
| `[ERR-4008]` | Bad request           |
| `[ERR-4009]` | Rate limit            |
| `[ERR-5000]` | Internal server error |
| `[ERR-5001]` | Unknown error         |

## Migration Plan

### Fas 1: Nya endpoints (DONE ✅)

- `lib/apiErrors.ts` skapad
- Exempel: `route_REFACTORED.ts` skapad

### Fas 2: Gradvis migration

Prioriterade endpoints att migrera:

1. **Auth-relaterade** (högsta prioritet)
   - `/api/onboarding/auto/route.ts`
   - `/api/gdpr/delete-account/route.ts`

2. **Bokningar**
   - `/api/bookings/approve/route.ts` ✅ (exempel finns)
   - `/api/bookings/*/route.ts`

3. **Fakturor**
   - `/api/invoices/*/route.ts`

4. **PDF-export**
   - `/api/generate-pdf/*/route.ts`

### Fas 3: Verifiera

- Testa alla endpoints efter migration
- Kolla Sentry för nya error patterns
- Uppdatera frontend error handling om behövs

## Best Practices

### DO ✅

```typescript
// Använd validateAuth() först
const { user, orgId } = await validateAuth();

// Validera input
validateRequired(body, ["field1", "field2"]);
validateUUID(body.userId);

// Använd specifika errors
throw new ApiError(404, "Not Found", "Booking not found");

// Returnera standardiserade responses
return successResponse(data);
return errorResponse(error);
```

### DON'T ❌

```typescript
// Skapa inte egna auth-checks
if (!session) return NextResponse.json(...)  // ❌

// Skapa inte custom error formats
return NextResponse.json({ msg: "error" })   // ❌

// Glöm inte error handling
// catch-block måste finnas!                  // ❌
```

## Exempel: Full Migration

Se `app/api/bookings/approve/route_REFACTORED.ts` för komplett exempel.

**Resultat:**

- 195 rader → 95 rader (51% mindre kod)
- Konsistent error handling
- Lättare att underhålla
- Samma funktionalitet

## Frågor?

Se kommentarer i `lib/apiErrors.ts` för fullständig dokumentation.
