# 🔧 Triggers och Automatisering

## Översikt

DogPlanner använder **database triggers** för att automatiskt sätta `org_id` på nya poster. Detta säkerställer att data isoleras per organisation.

## Status

### ✅ **Production (Vercel/Supabase)**

- Triggers är **AKTIVA**
- `org_id` sätts automatiskt från `auth.uid()` → `profiles.org_id`
- Fungerar perfekt för riktiga användare

### ⚠️ **Development (Localhost)**

- Triggers är **DISABLED** av `complete_testdata.sql`
- `org_id` måste sättas **manuellt i koden**
- Detta ger enklare debugging och undviker RLS-problem

## Hur det fungerar

### Med Triggers (Production)

```sql
-- Användare loggar in
-- Skapar ny ägare via EditDogModal
INSERT INTO owners (full_name, email, phone)
VALUES ('Anna Andersson', 'anna@mail.com', '0701234567');

-- Trigger körs automatiskt:
-- NEW.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
-- Ägare sparas med rätt org_id ✅
```

### Utan Triggers (Development)

```typescript
// I EditDogModal.tsx
const baseOwner = {
  full_name: "Anna Andersson",
  email: "anna@mail.com",
  phone: "0701234567",
  org_id: currentOrgId, // ✅ Sätts manuellt från AuthContext
};

await supabase.from("owners").insert([baseOwner]);
```

## Nuvarande Implementation

Koden i `EditDogModal.tsx` sätter **ALLTID** `org_id` manuellt:

```typescript
// Rad 430 - För ägare
(baseOwner as any).org_id = currentOrgId;

// Rad 508 - För hundar
const dogPayload = {
  // ... andra fält
  org_id: currentOrgId,
};
```

**Resultat:** Fungerar **både med och utan triggers aktiverade!**

## Aktivera Triggers (Frivilligt)

Om du vill testa production-liknande miljö lokalt:

1. Öppna Supabase SQL Editor
2. Kör `enable_triggers_for_production.sql`
3. Triggers aktiveras för `owners`, `dogs`, `rooms`, `dog_journal`

**OBS:** Detta är **inte nödvändigt** - koden fungerar redan!

## Filer

- `complete_testdata.sql` - Disabled triggers för development (rad 9-27)
- `enable_triggers_for_production.sql` - Aktivera triggers (frivilligt)
- `supabase/schema.sql` - Innehåller alla trigger-definitioner

## Varför Disabled i Development?

✅ **Enklare debugging** - Du ser exakt vad som händer  
✅ **Inga RLS-problem** - Kan läsa/skriva all data fritt  
✅ **Snabbare utveckling** - Ingen väntan på trigger-execution  
✅ **Testdata fungerar** - Kan sätta vilken `org_id` som helst

## Varför Aktiva i Production?

✅ **Säkerhet** - Användare kan inte sätta andras `org_id`  
✅ **Automatik** - Ingen risk att glömma sätta `org_id`  
✅ **RLS fungerar** - Row Level Security filtrerar korrekt  
✅ **GDPR-compliance** - Data isoleras strikt per organisation

## Best Practices

1. **Development:** Använd `complete_testdata.sql` (triggers disabled)
2. **Production:** Låt triggers vara aktiva (default i Supabase)
3. **Kod:** Sätt alltid `org_id` manuellt (fungerar överallt)
4. **Testing:** Använd `enable_triggers_for_production.sql` för att testa production-liknande beteende

## Felsökning

### Problem: "org_id är null i databasen"

**Development:**

```typescript
// Kolla att AuthContext ger org_id
const { currentOrgId } = useAuth();
console.log("Current org_id:", currentOrgId); // Ska inte vara null
```

**Production:**

```sql
-- Kolla att trigger finns
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trg_set_org_id_owners';

-- Kolla att användare har org_id i profile
SELECT id, org_id FROM profiles WHERE id = auth.uid();
```

### Problem: "Kan inte spara data trots inloggad"

**Kolla RLS:**

```sql
-- Inaktivera RLS temporärt för debugging
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE dogs DISABLE ROW LEVEL SECURITY;
```

## Sammanfattning

✅ Triggers finns i production och fungerar automatiskt  
✅ Development har triggers disabled för enklare utveckling  
✅ Koden sätter `org_id` manuellt och fungerar överallt  
✅ Ingen åtgärd krävs - systemet fungerar som det ska!
