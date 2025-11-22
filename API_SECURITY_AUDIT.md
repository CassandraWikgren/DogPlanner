# 🔒 API SÄKERHETSANALYS OCH REKOMMENDATIONER

**Datum:** 2025-11-22  
**Omfattning:** Alla API routes under `app/api/`

---

## 📊 ÖVERSIKT

### API Routes Inventering

```
Total antal API routes: 50+
Kritiska endpoints: ~15
Publika endpoints: ~8
Autentiserade endpoints: ~40
```

### Säkerhetsnivåer

- 🟢 **BRA** - Korrekt auth, validation, error handling
- 🟡 **OK** - Auth finns men kan förbättras
- 🔴 **RISK** - Saknar auth eller validation

---

## ✅ BRA EXEMPEL

### 1. `/api/gdpr/delete-account` - Exemplarisk säkerhet

```typescript
// ✅ Korrekt auth check
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ✅ Input validation
const body = await request.json();
if (body.confirm !== true) {
  return NextResponse.json({ error: "Bekräftelse krävs" }, { status: 400 });
}

// ✅ Logging för audit trail
console.log(`[GDPR] User ${user.id} begär radering`);

// ✅ Error handling
if (error) {
  console.error("[GDPR] Fel:", error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

**Rating:** 🟢🟢🟢🟢🟢 (5/5)

---

### 2. `/api/onboarding/auto` - Bra men kan förbättras

```typescript
// ✅ Service role client (korrekt för server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Token validation
const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
if (!token) {
  return NextResponse.json({ error: "Ingen token" }, { status: 401 });
}

// ✅ User verification
const { data: userData, error: userErr } = await supabase.auth.getUser(token);
if (userErr || !userData?.user) {
  return NextResponse.json({ error: "Ogiltig användare" }, { status: 401 });
}

// ⚠️ FÖRBÄTTRING: Lägg till rate limiting
```

**Rating:** 🟢🟢🟢🟢 (4/5) - Saknar rate limiting

---

## ⚠️ KRITISKA ENDPOINTS ATT GRANSKA

### Prioriterade för säkerhetsgranskning

1. **`/api/invoices/[id]/pdf`** - PDF-generering
   - Verifiera: Endast org-medlemmar kan se sina fakturor
   - Risk: Information disclosure

2. **`/api/bookings/approve`** - Godkänn bokningar
   - Verifiera: Endast staff/admin kan godkänna
   - Risk: Unauthorized booking approval

3. **`/api/bookings/cancel`** - Avboka
   - Verifiera: Ägare kan bara avboka sina egna
   - Risk: Denial of service

4. **`/api/subscription/checkout`** - Betalningar
   - Verifiera: Stripe webhook signature
   - Risk: Payment manipulation

5. **`/api/applications/pension`** - Ansökningar
   - Verifiera: Input sanitization
   - Risk: SQL injection / XSS

---

## 🎯 SÄKERHETSÅTGÄRDER (Prioriterad lista)

### 1. Implementera Rate Limiting (KRITISKT)

**Problem:** Inga API routes har rate limiting, risk för brute force och DoS.

**Lösning:** Lägg till middleware

```typescript
// middleware-rate-limit.ts (finns redan i root!)
// Uppdatera den för att inkludera alla känsliga endpoints

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: NextRequest, limit: number = 10, window: number = 60000) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}-${req.nextUrl.pathname}`;
  const now = Date.now();

  const record = rateLimits.get(key);

  if (record && record.resetAt > now) {
    if (record.count >= limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    record.count++;
  } else {
    rateLimits.set(key, { count: 1, resetAt: now + window });
  }

  return null;
}

// Använd i varje route:
// const rateLimitResponse = rateLimit(request, 5, 60000);
// if (rateLimitResponse) return rateLimitResponse;
```

**Endpoints som MÅSTE ha rate limiting:**

- `/api/onboarding/*` - Max 3/minut
- `/api/gdpr/delete-account` - Max 1/timme
- `/api/bookings/approve` - Max 10/minut
- `/api/bookings/cancel` - Max 5/minut
- `/api/invoices/*/pdf` - Max 20/minut

---

### 2. Input Validation Schema (VIKTIGT)

**Problem:** Inkonsistent input validation.

**Lösning:** Använd Zod för alla inputs

```typescript
// lib/validation/api-schemas.ts
import { z } from 'zod';

export const BookingApprovalSchema = z.object({
  bookingId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const DeleteAccountSchema = z.object({
  confirm: z.literal(true),
  password: z.string().min(1), // Lägg till extra verifiering
});

// Använd i routes:
import { BookingApprovalSchema } from '@/lib/validation/api-schemas';

export async function POST(req: Request) {
  const body = await req.json();

  // Validera input
  const validation = BookingApprovalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error },
      { status: 400 }
    );
  }

  const { bookingId, notes } = validation.data;
  // ... fortsätt med validerad data
}
```

---

### 3. Centraliserad Auth Helper (REKOMMENDERAT)

**Problem:** Auth-logik upprepas i varje route.

**Lösning:** Skapa auth helper

```typescript
// lib/api/auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
      supabase
    };
  }

  return { error: null, user, supabase };
}

export async function requireAdmin(request: Request) {
  const { error, user, supabase } = await requireAuth(request);
  if (error) return { error, user: null, supabase };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      ),
      user: null,
      supabase
    };
  }

  return { error: null, user, supabase, profile };
}

// Använd i routes:
export async function POST(req: Request) {
  const { error, user, supabase } = await requireAuth(req);
  if (error) return error;

  // Fortsätt med autentiserad user
}
```

---

### 4. CORS och Security Headers

**Problem:** Saknas explicit CORS-konfiguration.

**Lösning:** Lägg till i next.config.ts

```typescript
// next.config.ts
const nextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          },
        ],
      },
    ];
  },
};
```

---

### 5. Error Handling Best Practices

**Standard error response format:**

```typescript
// lib/api/error-handler.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    );
  }

  // Never leak internal errors to client
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Använd:
try {
  // ... kod
  if (!bookingId) {
    throw new ApiError(400, 'Booking ID required', 'MISSING_BOOKING_ID');
  }
} catch (error) {
  return handleApiError(error);
}
```

---

## 🔍 ENDPOINTS ATT GRANSKA NU

### Högprioriterade (Vecka 1)

```bash
# Granska dessa filer manuellt:
app/api/bookings/approve/route.ts
app/api/bookings/cancel/route.ts
app/api/invoices/[id]/pdf/route.ts
app/api/subscription/checkout/route.ts
app/api/gdpr/delete-account/route.ts
```

**Checklista för varje endpoint:**

- [ ] Auth check finns och är korrekt
- [ ] Input validation med Zod
- [ ] Rate limiting implementerat
- [ ] Error handling utan info leak
- [ ] Logging för audit trail
- [ ] RLS policies i databasen matchar

---

### Medelprioriterade (Vecka 2)

```bash
app/api/applications/*/route.ts
app/api/consent/*/route.ts
app/api/pdf/route.ts
app/api/pension/*/route.ts
```

---

## 📝 AUDIT TRAIL

**Vad ska loggas:**

```typescript
// För varje kritisk operation:
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  action: 'DELETE_ACCOUNT',
  userId: user.id,
  userEmail: user.email,
  ip: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent'),
  success: true
}));
```

**Använd Sentry för produktionslogging:**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage('User deleted account', {
  level: 'info',
  user: { id: user.id, email: user.email },
  extra: { deletedRecords: data.deleted }
});
```

---

## 🚀 IMPLEMENTATIONSPLAN

### Vecka 1 (KRITISKT)

1. ✅ Implementera rate limiting middleware
2. ✅ Skapa centraliserad auth helper
3. ✅ Granska och fixa högprioriterade endpoints
4. ✅ Lägg till security headers

### Vecka 2 (VIKTIGT)

5. ✅ Skapa Zod validation schemas
6. ✅ Implementera standardiserad error handling
7. ✅ Granska medelprioriterade endpoints
8. ✅ Lägg till audit trail logging

### Vecka 3 (FÖRBÄTTRINGAR)

9. ✅ Skriv integrationstester för kritiska endpoints
10. ✅ Dokumentera alla API routes
11. ✅ Sätt upp Sentry alerts för säkerhetsfel

---

## 📚 RESURSER

- **Rate Limiting:** `middleware-rate-limit.ts` (finns i root)
- **Zod Documentation:** https://zod.dev
- **Sentry Setup:** `sentry.*.config.ts` (redan konfigurerad)
- **OWASP API Security:** https://owasp.org/www-project-api-security/

---

## ✅ SLUTSATS

**Nuvarande status:** 🟡 OK - Grundläggande säkerhet finns, men behöver förbättras

**Kritiska åtgärder:**

1. Lägg till rate limiting på alla känsliga endpoints
2. Implementera konsistent input validation
3. Granska permission checks i alla booking/invoice endpoints

**Efter implementering:** 🟢 BRA - Produktionsklar säkerhet

**Next Step:** Börja med att implementera rate limiting middleware i alla kritiska routes.
