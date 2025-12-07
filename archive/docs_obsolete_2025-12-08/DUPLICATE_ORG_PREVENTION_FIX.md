# Duplicate Organization Prevention Fix

**Datum:** 7 december 2025  
**Status:** ✅ Implementerad

## Problem

~130 tomma organisationer med namn "Mitt Hunddagis" och "Min Organisation" skapades på grund av race condition mellan:

1. **Layer 1 (Trigger):** `on_auth_user_created` → `handle_new_user()` - körs vid signup
2. **Layer 2 (API fallback):** `/api/onboarding/auto` - anropas från AuthContext

När båda kördes inom millisekunder av varandra skapades två organisationer för samma användare.

## Lösning

### 1. API-fix (`/app/api/onboarding/auto/route.ts`)

Lade till dupliceringsskydd som kollar om det redan finns en org för användarens email:

```typescript
// 🔒 RACE CONDITION PREVENTION
const { data: existingOrg } = await supabase
  .from("orgs")
  .select("id")
  .eq("email", user.email)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (existingOrg) {
  // Koppla till befintlig org istället för att skapa ny
  await supabase.from("profiles").upsert({
    id: userId,
    org_id: existingOrg.id,
    // ...
  });
}
```

### 2. Trigger-fix (`handle_new_user()`)

Uppdaterade triggern med tre skyddslager:

1. **Check 1:** Om profil redan har org_id → avbryt
2. **Check 2:** Om org med samma email finns → koppla till befintlig
3. **Upsert:** Profiler skapas med ON CONFLICT för att förhindra duplicering

Se: `supabase/migrations/20251207_prevent_duplicate_orgs.sql`

## Rensning av befintliga dubbletter

Kör följande i Supabase SQL Editor för att ta bort tomma dubbletter:

```sql
-- Ta bort "Min Organisation" utan data
DELETE FROM orgs
WHERE name = 'Min Organisation'
  AND org_number IS NULL
  AND email IS NULL;

-- Ta bort "Mitt Hunddagis" utan kopplad data
DELETE FROM orgs o
WHERE o.name = 'Mitt Hunddagis'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = o.id)
  AND NOT EXISTS (SELECT 1 FROM dogs d WHERE d.org_id = o.id)
  AND NOT EXISTS (SELECT 1 FROM owners ow WHERE ow.org_id = o.id);
```

## Filer som ändrades

| Fil                                                       | Ändring                     |
| --------------------------------------------------------- | --------------------------- |
| `app/api/onboarding/auto/route.ts`                        | Lade till existingOrg-check |
| `supabase/migrations/20251207_prevent_duplicate_orgs.sql` | Ny trigger med skydd        |

## Testning

Efter att ha kört SQL-migrationen:

1. Registrera en ny testanvändare
2. Verifiera i Supabase att endast EN org skapas
3. Kontrollera att profilen är kopplad till rätt org

```sql
-- Verifiera att ingen dubblett skapades
SELECT o.name, o.email, p.email as profile_email, o.created_at
FROM orgs o
LEFT JOIN profiles p ON p.org_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

## Framtida förbättring (optional)

För extra säkerhet kan ett unikt index läggas till på `orgs.email`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS orgs_email_unique
ON orgs (email)
WHERE email IS NOT NULL;
```

⚠️ **OBS:** Kör först efter att alla dubbletter är borttagna!
