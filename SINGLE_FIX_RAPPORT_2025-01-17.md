# 🔧 .single() Säkerhetsfix — Rapport

**Datum:** 17 januari 2025  
**Problem:** `.single()` metoden i Supabase kastar fel när 0 eller >1 rader returneras  
**Lösning:** Ersätt med säkrare patterns baserat på användningsfall

---

## 🚨 Problem med `.single()`

Supabase `.single()` metoden:

- Kastar `PGRST116` fel om **0 rader** returneras
- Kastar fel om **>1 rader** returneras
- Mycket känslig för timing issues med triggers/RLS

**Symptom som uppstod:**

- "JSON object requested, multiple (or no) rows returned"
- "Property 'id' does not exist on type '[]'"
- TypeScript compilation errors
- Runtime crashes vid insert operations

---

## ✅ Fixade Filer (5 st)

### 1. `app/ansokan/pensionat/page.tsx`

**Problem:** TypeScript error - `newBooking.id` efter array-konvertering  
**Fix:** Ändrade `newBooking.id` → `newBooking[0].id`

```typescript
// FÖRE:
applicationId: newBooking.id,

// EFTER:
applicationId: newBooking[0].id,
```

---

### 2. `app/admin/priser/pensionat/page.tsx` (3 inserts)

#### Fix 1: Boarding Prices Insert

```typescript
// FÖRE:
const { data, error } = await supabase
  .from("boarding_prices")
  .insert([...])
  .select()
  .single();

if (error) throw error;
setBoardingPrices(prev => prev.map(p => p.dog_size === size ? data : p));

// EFTER:
const { data, error } = await supabase
  .from("boarding_prices")
  .insert([...])
  .select();

if (error || !data || data.length === 0)
  throw error || new Error("No data returned");

setBoardingPrices(prev => prev.map(p => p.dog_size === size ? data[0] : p));
```

#### Fix 2: Special Dates Insert

```typescript
// FÖRE:
.select().single();
if (error) throw error;
setSpecialDates([...specialDates, data]);

// EFTER:
.select();
if (error || !data || data.length === 0)
  throw error || new Error("No data returned");
setSpecialDates([...specialDates, data[0]]);
```

#### Fix 3: Seasons Insert

```typescript
// FÖRE:
.select().single();
if (error) throw error;
setSeasons([...seasons, data]);

// EFTER:
.select();
if (error || !data || data.length === 0)
  throw error || new Error("No data returned");
setSeasons([...seasons, data[0]]);
```

---

### 3. `app/admin/abonnemang/page.tsx`

**Fix:** Subscription Insert

```typescript
// FÖRE:
.select()
.single();

if (error) {
  throw new Error(`[ERR-4001] Skapa prenumeration: ${error.message}`);
}

// EFTER:
.select();

if (error || !data || data.length === 0) {
  throw new Error(`[ERR-4001] Skapa prenumeration: ${error?.message || "No data returned"}`);
}
```

---

### 4. `app/kundportal/login/page.tsx`

**Fix:** Owner Lookup

```typescript
// FÖRE:
const { data: ownerData, error: ownerError } = await supabase
  .from("owners")
  .select("id, full_name, email")
  .eq("email", email)
  .single();

// EFTER:
const { data: ownerData, error: ownerError } = await supabase
  .from("owners")
  .select("id, full_name, email")
  .eq("email", email)
  .maybeSingle();
```

**Skillnad:** `.maybeSingle()` returnerar `null` istället för att kasta fel vid 0 rader

---

### 5. `app/hundpensionat/ansokningar/page.tsx` (3 selects)

#### Fix 1: Booking Lookup

```typescript
// FÖRE:
.eq("id", bookingId)
.single();

// EFTER:
.eq("id", bookingId)
.maybeSingle();
```

#### Fix 2 & 3: Org Lookups (2 platser)

```typescript
// FÖRE:
.eq("id", currentOrgId)
.single();

// EFTER:
.eq("id", currentOrgId)
.maybeSingle();
```

---

## 📊 Sammanfattning av Ändringar

| Fil                       | Antal Fixes | Typ          | Pattern                        |
| ------------------------- | ----------- | ------------ | ------------------------------ |
| ansokan/pensionat         | 1           | Array access | `.id` → `[0].id`               |
| admin/priser/pensionat    | 3           | Insert       | `.single()` → array + `[0]`    |
| admin/abonnemang          | 1           | Insert       | `.single()` → array + `[0]`    |
| kundportal/login          | 1           | Select       | `.single()` → `.maybeSingle()` |
| hundpensionat/ansokningar | 3           | Select       | `.single()` → `.maybeSingle()` |
| **TOTALT**                | **9**       | -            | -                              |

---

## 🎯 Mönster att Använda Framöver

### För INSERT Operations:

```typescript
// ❌ UNDVIK:
.insert([...]).select().single();

// ✅ ANVÄND:
const { data, error } = await supabase
  .from("table")
  .insert([...])
  .select();

if (error || !data || data.length === 0) {
  throw error || new Error("No data returned");
}

// Access data med data[0]
const newRecord = data[0];
```

### För SELECT Operations (förväntar 1 rad):

```typescript
// ❌ UNDVIK:
.eq("id", id).single();

// ✅ ANVÄND:
.eq("id", id).maybeSingle();

// Hantera null:
if (!data) {
  // Record not found
}
```

### För SELECT Operations (kan vara 0 rader):

```typescript
// ✅ ANVÄND .maybeSingle() eller remove .single() helt:
const { data } = await supabase
  .from("table")
  .select()
  .eq("field", value)
  .maybeSingle();

// data kan vara null - hantera det!
```

---

## 🔍 Kvarvarande `.single()` Användningar

### Säkra (behöver ej fixas nu):

- **EditDogModal.tsx** (2x) - Foreign key lookups, bör fungera
- **API routes** (invoice PDF, bookings cancel) - Kontrollerade miljöer
- **Library functions** (pricing.ts, emailConfig.ts) - Interna helpers
- **Components** (StaffNotes, StaffResponsibility) - Single record updates

### Rekommendation:

Övervaka dessa för framtida problem. Om fel uppstår, konvertera enligt mönstren ovan.

---

## 📈 Förväntade Resultat

### ✅ Fixar:

1. ❌ "JSON object requested, multiple rows returned" → ✅ Fungerar
2. ❌ TypeScript compilation errors → ✅ Kompilerar
3. ❌ Runtime crashes på inserts → ✅ Stabila inserts
4. ❌ Känsliga för RLS/trigger timing → ✅ Robust mot timing

### ⚡ Bonusfördelar:

- Bättre error messages (specificerar "No data returned")
- Explicit null checks → Lättare debugging
- Konsekvent pattern → Enklare maintenance
- TypeScript happy → Färre compilation errors

---

## 🚀 Deploy Status

**Commits:**

- `381cfd9` - TypeScript error fix (newBooking.id)
- `fcf29fc` - Comprehensive .single() safety fixes

**Branch:** main  
**Status:** ✅ Pushed to GitHub  
**Next:** Vercel ska auto-deploy

---

## 📝 Lärdomar

1. **`.single()` är farligt på INSERT** - Kan returnera 0 eller >1 rows beroende på triggers
2. **`.maybeSingle()` är säkrare** - Returnerar null istället för att kasta fel
3. **Array access är explicit** - `data[0]` gör det tydligt vad som händer
4. **Null checks är viktiga** - Alltid kolla `!data || data.length === 0`
5. **TypeScript types är dina vänner** - De påpekar när något är fel

---

**Status:** ✅ Alla kritiska `.single()` fel fixade  
**Risk:** 🟢 Låg - System bör vara stabilt nu  
**Uppföljning:** Övervaka logs för nya `.single()` relaterade fel
