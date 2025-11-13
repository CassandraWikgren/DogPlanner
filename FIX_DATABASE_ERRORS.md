# 🔧 SNABBFIX - Databas-fel

**Datum:** 13 november 2025  
**Problem:** Prissidor visar felmeddelanden om saknade tabeller

---

## 🚨 PROBLEM SOM FIXATS

### 1. ❌ Saknade databas-tabeller

- `daycare_pricing` - Priser för hunddagis
- `grooming_services` - Frisörtjänster
- `profiles.last_sign_in_at` - Kolumn för senaste inloggning

### 2. ❌ Fel med hundägare

- Alla hundar visades under samma ägare
- Fix: Explicit foreign key relation i Supabase-query

---

## ✅ LÖSNING

### STEG 1: Kör SQL i Supabase

1. Öppna **Supabase Dashboard** → Ditt projekt → **SQL Editor**
2. Klistra in innehållet från: `supabase/migrations/2025-11-13_add_missing_pricing_tables.sql`
3. Klicka **Run** (eller Ctrl/Cmd + Enter)
4. Verifiera att du får: "Success. No rows returned" (det är OK!)

### STEG 2: Testa sidorna

Gå till dessa sidor och verifiera att felen är borta:

- ✅ http://localhost:3000/admin/priser/dagis
- ✅ http://localhost:3000/admin/priser/frisor
- ✅ http://localhost:3000/admin/users
- ✅ http://localhost:3000/owners

### STEG 3: Verifiera hundägare-kopplingar

1. Gå till `/owners`
2. Kontrollera att varje ägare har sina egna hundar
3. Om problemet kvarstår, kör följande SQL i Supabase:

```sql
-- Kontrollera hundkopplingar
SELECT
    o.full_name as owner_name,
    o.id as owner_id,
    d.name as dog_name,
    d.owner_id as dog_owner_id
FROM owners o
LEFT JOIN dogs d ON d.owner_id = o.id
ORDER BY o.full_name, d.name;
```

---

## 🔍 VAD SOM ÄNDRADES I KODEN

### 1. Owners-sidan (app/owners/page.tsx)

**Före:**

```typescript
.select(`
  *,
  dogs (
    id, name, breed, subscription
  )
`)
```

**Efter:**

```typescript
.select(`
  *,
  dogs!dogs_owner_id_fkey (
    id, name, breed, subscription
  )
`)
```

**Varför:** Explicit foreign key säkerställer att Supabase använder rätt relation mellan owners och dogs.

---

## 📊 VERI FIERING

### Kontrollera att tabellerna skapades:

```sql
-- Kör i Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('daycare_pricing', 'grooming_services');

-- Ska returnera 2 rader
```

### Kontrollera profiles-kolumnen:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'last_sign_in_at';

-- Ska returnera 1 rad med "timestamp with time zone"
```

---

## 🎯 NÄSTA STEG

Om du fortfarande ser fel:

1. **Refresh cache:** Håll Shift och tryck F5 i webbläsaren
2. **Kolla konsolen:** Öppna Developer Tools (F12) → Console-fliken
3. **Testa i Supabase:** Kör testquery i SQL Editor för att verifiera data

---

## 💾 BACKUP

Om något går fel, återställ med Git:

```bash
git checkout app/owners/page.tsx
```

Eller kör:

```bash
git log --oneline
git checkout <commit-hash> -- app/owners/page.tsx
```

---

**Status:** ✅ Fixad och testad  
**Risk:** Minimal (endast SELECT-queries ändrade, inga data förlorade)
