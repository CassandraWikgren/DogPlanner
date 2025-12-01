# 🔄 MIGRATION GUIDE: @supabase/ssr Implementation

**Status:** IN PROGRESS  
**Datum:** 30 november 2025  
**Syfte:** Proper långsiktig implementation av Supabase SSR

---

## ✅ SLUTFÖRDA STEG

### 1. Nya Supabase Client Utilities Skapade

✅ **`lib/supabase/client.ts`**

- Använder `createBrowserClient()` från `@supabase/ssr`
- För alla Client Components ("use client")
- Automatisk cookie-hantering i browser

✅ **`lib/supabase/server.ts`**

- Använder `createServerClient()` från `@supabase/ssr`
- För Server Components och Server Actions
- Async function (måste awaitas)
- Automatisk cookie-synk mellan server/client

✅ **`lib/supabase/middleware.ts`**

- `updateSession()` för middleware
- Automatisk session refresh
- Cookie-hantering mellan requests

### 2. Middleware Uppdaterad

✅ **`middleware.ts`**

- Importerar `updateSession` från `lib/supabase/middleware`
- Anropar `await updateSession(request)` efter rate limiting
- Refreshar automatiskt user sessions

### 3. AuthContext Migrerad

✅ **`app/context/AuthContext.tsx`**

- Använder `createClient()` från `lib/supabase/client`
- Alla supabase-referenser uppdaterade
- Ingen global singleton längre
- Ny instance skapas där det behövs

---

## 🔄 PÅGÅENDE: Migrera Client Components

### Filer som behöver uppdateras (27 st)

**Faktureringssystem:**

- [ ] `app/admin/faktura/page.tsx`

**Kundportal:**

- [ ] `app/kundportal/dashboard/page.tsx`
- [ ] `app/kundportal/boka/page.tsx`
- [ ] `app/kundportal/login/page.tsx`
- [ ] `app/kundportal/registrera/page.tsx`

**Hunddagis:**

- [ ] `app/hunddagis/[id]/page.tsx`
- [ ] `app/hunddagis/priser/page.tsx`
- [ ] `app/hunddagis/intresseanmalningar/page.tsx`

**Hundpensionat:**

- [ ] `app/hundpensionat/ansokningar/page.tsx`
- [ ] `app/hundpensionat/aktiva-gaster/page.tsx`
- [ ] `app/hundpensionat/bokningsformulär/page.tsx`

**Admin:**

- [ ] `app/admin/abonnemang/page.tsx`
- [ ] `app/admin/tjanster/page.tsx`
- [ ] `app/admin/users/page.tsx`
- [ ] `app/admin/rapporter/page.tsx`
- [ ] `app/admin/priser/dagis/page.tsx`
- [ ] `app/admin/priser/pensionat/page.tsx`
- [ ] `app/admin/hundfrisor/priser/page.tsx` (redan fixad)

**Hundfrisör:**

- [ ] `app/frisor/ny-bokning/page.tsx`
- [ ] `app/frisor/kalender/page.tsx`

**Övriga:**

- [ ] `app/ekonomi/page.tsx`
- [ ] `app/faktura/page.tsx`
- [ ] `app/foretagsinformation/page.tsx`
- [ ] `app/applications/page.tsx`
- [ ] `app/owners/[id]/page.tsx`
- [ ] `app/kundrabatter/page.tsx`
- [ ] `app/profile-check/page.tsx`
- [ ] `app/consent/verify/page.tsx`
- [ ] `app/ansokan/hunddagis/page.tsx`
- [ ] `app/ansokan/pensionat/page.tsx`

### Migration Pattern för Client Components

**FÖR:**

```typescript
// ❌ GAMMALT (lib/supabase.ts singleton)
import { supabase } from "@/lib/supabase";

function MyComponent() {
  useEffect(() => {
    supabase.from("table").select(); // Global instance
  }, []);
}
```

**TILL:**

```typescript
// ✅ NYTT (@supabase/ssr)
import { createClient } from "@/lib/supabase/client";

function MyComponent() {
  const supabase = createClient(); // ← Ny instance per component

  useEffect(() => {
    supabase.from("table").select(); // Använd local instance
  }, []);
}
```

### Steg för varje fil:

1. **Ersätt import:**

   ```typescript
   // Från:
   import { supabase } from "@/lib/supabase";

   // Till:
   import { createClient } from "@/lib/supabase/client";
   ```

2. **Lägg till const i komponent:**

   ```typescript
   function ComponentName() {
     const supabase = createClient(); // ← Lägg till i början

     // ... resten av koden
   }
   ```

3. **Uppdatera nested functions:**
   ```typescript
   // Om supabase används i nested functions:
   async function handleSubmit() {
     const supabase = createClient(); // ← Lägg till här också
     await supabase.from("table").insert(data);
   }
   ```

---

## 🔍 Identifiera Server Components

### Potentiella Server Components

Server Components är filer som:

- INTE har `"use client"` directive
- Exporterar `async function` som default
- Används för initial data fetching
- Inte har event handlers eller state

**Hitta kandidater:**

```bash
# Hitta filer utan "use client" som kan vara server components
find app/ -name "*.tsx" -type f -exec grep -L '"use client"' {} \;
```

### Migration Pattern för Server Components

**FÖR:**

```typescript
// ❌ GAMMALT
import { supabase } from "@/lib/supabase";

function MyServerComponent() {
  const { data } = await supabase.from("table").select();
}
```

**TILL:**

```typescript
// ✅ NYTT
import { createClient } from "@/lib/supabase/server";

async function MyServerComponent() {
  // ← async!
  const supabase = await createClient(); // ← await!
  const { data } = await supabase.from("table").select();
}
```

---

## 📁 API Routes och Server Actions

### Migration Pattern för API Routes

**`app/api/*/route.ts`:**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Använd supabase...
  const { data } = await supabase.from("table").select();

  return NextResponse.json({ data });
}
```

### Migration Pattern för Server Actions

**`app/actions/*.ts`:**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function myAction(formData: FormData) {
  const supabase = await createClient();

  // Använd supabase...
  await supabase.from("table").insert(data);
}
```

---

## 🧪 TESTING CHECKLIST

Efter migration, testa:

### Auth Flöden

- [ ] Registrering ny användare
- [ ] Login
- [ ] Logout
- [ ] Session refresh (vänta 5 min, verifiera fortfarande inloggad)
- [ ] Auth redirect till login om ej inloggad

### Data Fetching

- [ ] Hunddagis bokningar laddas
- [ ] Pensionat ansökningar laddas
- [ ] Frisörpriser laddas (det här var ju problemet!)
- [ ] Fakturor laddas
- [ ] Kundportal dashboard laddas

### Data Mutations

- [ ] Skapa ny bokning
- [ ] Uppdatera bokning
- [ ] Ta bort bokning
- [ ] Lägga till frisörpriser
- [ ] Skapa faktura

### RLS Säkerhet

- [ ] Användare ser bara sin org's data
- [ ] Kan inte läsa annan org's data
- [ ] Kan inte uppdatera annan org's data

---

## 🗑️ CLEANUP EFTER MIGRATION

### Ta bort gamla filer:

```bash
# 1. Ta bort gamla lib/supabase.ts
rm lib/supabase.ts

# 2. Avinstallera deprecated paket
npm uninstall @supabase/auth-helpers-nextjs

# 3. Ta bort backup-filer
find app/ -name "*.ssr_backup" -delete
```

### Verifiera dependencies:

**`package.json` ska ha:**

```json
{
  "@supabase/ssr": "^0.7.0",
  "@supabase/supabase-js": "^2.45.0"
}
```

**INTE ha:**

```json
{
  "@supabase/auth-helpers-nextjs": "..." // ← Ta bort denna!
}
```

---

## 📊 PROGRESS TRACKING

**Totalt att göra:** 32 filer

- ✅ Utilities skapade: 3/3
- ✅ Middleware uppdaterad: 1/1
- ✅ AuthContext migrerad: 1/1
- ⏳ Client Components: 0/27 (alla har rätt import, behöver lägga till const supabase = createClient())
- ❓ Server Components: Okänt antal
- ❓ API Routes: Okänt antal

**Estimerad tid kvar:** 3-4 timmar

---

## 🚀 NÄSTA STEG

### PRIO 1: Migrera Client Components (3-4 timmar)

För varje av de 27 filerna:

1. Öppna filen
2. Hitta komponenten/funktionen
3. Lägg till `const supabase = createClient()` i början
4. Uppdatera nested functions
5. Testa att sidan fungerar
6. Markera som klar i checklistan

### PRIO 2: Identifiera Server Components (30 min)

Hitta filer som kan bli server components:

```bash
find app/ -name "page.tsx" -type f -exec grep -L '"use client"' {} \;
```

Analysera om de kan använda server components för bättre performance.

### PRIO 3: Migrera API Routes (1 timme)

Hitta alla API routes:

```bash
find app/api -name "route.ts" -type f
```

Uppdatera varje att använda `createClient()` från `lib/supabase/server`.

### PRIO 4: End-to-End Testing (2 timmar)

Gå igenom hela testchecklistan ovan.

### PRIO 5: Cleanup (15 min)

Ta bort gamla filer och dependencies.

---

## 📝 NOTES

**Varför denna approach är bättre:**

1. **Säkerhet:** Ingen risk för auth-läckage mellan användare
2. **Cookie-synk:** Automatisk hantering av auth state
3. **Best Practice:** Följer Supabase officiella guidelines
4. **Framtidssäkert:** `@supabase/ssr` är aktivt maintained
5. **Server/Client Separation:** Rätt verktyg för rätt kontext
6. **Performance:** Server components kan fetcha data server-side

**Varför inte global singleton:**

- ❌ Delas mellan requests på server
- ❌ Potentiell security risk
- ❌ Cookie-state kan bli inkonsekvent
- ❌ Inte recommended av Supabase team

---

**Skapad:** 2025-11-30  
**Status:** 🟡 MIGRATION PÅGÅR  
**Nästa: ** Migrera de 27 client components
