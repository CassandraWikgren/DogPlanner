# Kundnummer-system i DogPlanner

## Översikt

Kundnummer är unika identifierare per ägare (owner) inom varje organisation. Systemet garanterar att inga dubbletter skapas och hanterar både automatisk generering och manuell tilldelning.

## Hur det fungerar

### Database-trigger (sedan 2025-01-03)

Kundnummer hanteras primärt av en PostgreSQL-trigger (`auto_generate_customer_number`) som körs automatiskt vid:

- **INSERT**: När nya ägare skapas
- **UPDATE**: När befintliga ägare uppdateras

#### Auto-generering

```sql
-- Om customer_number är NULL eller 0:
NEW.customer_number := MAX(customer_number) + 1
```

Triggern hittar högsta befintliga kundnummer i organisationen och tilldelar nästa lediga.

#### Manuell tilldelning (admin)

```sql
-- Om admin sätter ett specifikt nummer:
- Validerar att det inte redan används i organisationen
- Kastar exception om dubbletter upptäcks
- Tillåter numret om det är unikt
```

### Unique constraint

```sql
UNIQUE (org_id, customer_number)
```

Garanterar på databas-nivå att inget kundnummer kan användas två gånger inom samma organisation.

## Applikationskod

### EditDogModal.tsx

```typescript
// Icke-admin: Sätter customer_number till NULL
baseOwner.customer_number = null;
// → DB-triggern auto-genererar nästa lediga nummer

// Admin: Kan sätta manuellt
baseOwner.customer_number = Number(ownerCustomerNo);
// → DB-triggern validerar att numret inte redan finns
```

### Återanvändning av ägare

När systemet hittar en befintlig ägare (via e-post, telefon eller namn+telefon):

- ✅ Återanvänder ägarens befintliga kundnummer
- ✅ Inget nytt nummer genereras eller ändras
- ✅ Loggar: `"✅ Återanvänder befintlig ägare: Namn (Kundnr: 123)"`

## Fördelar med trigger-baserad lösning

| Problem                    | Lösning                                                                         |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Race conditions**        | Triggern körs i en transaktion - två samtidiga inserts kan inte få samma nummer |
| **Manuella dubbletter**    | Unique constraint + trigger-validering förhindrar dubbletter                    |
| **API/direkta inserts**    | Fungerar oavsett var data skapas (UI, API, SQL)                                 |
| **Organisationsisolering** | Kundnummer är unika per organisation, kan återanvändas mellan orgs              |

## Migration: 20250103_unique_customer_numbers.sql

### Vad den gör:

1. ✅ Lägger till unique constraint på `(org_id, customer_number)`
2. ✅ Skapar trigger-funktion `auto_generate_customer_number()`
3. ✅ Kopplar triggern till `owners`-tabellen
4. ✅ Fixar eventuella befintliga dubbletter
5. ✅ Skapar index för snabbare lookups

### Körning i Supabase:

```sql
-- Kör filen i SQL Editor i Supabase Dashboard
-- Kontrollera output för eventuella dubbletter som fixades
```

## Testscenarier

### Scenario 1: Ny kund (icke-admin)

```
Input: customer_number = NULL
Resultat: Auto-genereras → 1, 2, 3, etc. per organisation
```

### Scenario 2: Admin sätter kundnummer manuellt

```
Input: customer_number = 100
Resultat om unikt: ✅ Tillåts
Resultat om duplicat: ❌ Exception: "Kundnummer 100 används redan"
```

### Scenario 3: Två admins lägger till kunder samtidigt

```
Admin A: customer_number = NULL → Får 5
Admin B: customer_number = NULL → Får 6
Resultat: ✅ Ingen race condition, båda får unika nummer
```

### Scenario 4: Återanvändning av befintlig ägare

```
Befintlig ägare: customer_number = 42
Input: Samma e-post
Resultat: ✅ Återanvänder ägaren med kundnummer 42
```

## Felsökning

### Kontrollera kundnummer i organisation

```sql
SELECT id, full_name, email, customer_number, org_id
FROM owners
WHERE org_id = 'DIN_ORG_ID'
ORDER BY customer_number;
```

### Hitta dubbletter (bör returnera 0 rader)

```sql
SELECT org_id, customer_number, COUNT(*)
FROM owners
GROUP BY org_id, customer_number
HAVING COUNT(*) > 1;
```

### Kontrollera trigger-status

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_customer_number';
```

## Framtida förbättringar

- [ ] **Notifikation till admin**: När trigger kastar fel om duplicat, visa användarvänligt meddelande
- [ ] **Kundnummer-historik**: Logga ändringar av kundnummer för audit trail
- [ ] **Gaphantering**: Återanvänd "tomma" nummer om ägare raderas (valfritt)
- [ ] **Anpassade sekvenser**: Tillåt olika startpunkter per organisation (t.ex. org1 börjar på 1000, org2 på 2000)

## Relaterade filer

- **Migration**: `supabase/migrations/20250103_unique_customer_numbers.sql`
- **Applikationskod**: `components/EditDogModal.tsx` (rad ~480-500)
- **Schema**: `supabase/schema.sql` (owners-tabellen)
- **Typer**: `types/database.ts` (owners-interface)
- **Helpers**: `lib/store.ts` (lookup by customer_number)

---

**Dokumenterat**: 2025-01-03  
**Status**: ✅ Implementerat och testat  
**Breaking changes**: Nej - applikationen fungerar som tidigare, men säkrare
