# Daily Schedule Migration - Kör Denna SQL

## Problem

Sidan `app/hunddagis/dagens-schema/page.tsx` kräver tabellen `daily_schedule` som inte finns i databasen.

## Lösning

Kör SQL-migrationen: `supabase/migrations/20251210_create_daily_schedule.sql`

## Steg-för-steg:

### 1. Öppna Supabase Dashboard

- Gå till: https://supabase.com/dashboard/project/fhdkkkujnhteetllxypg

### 2. Öppna SQL Editor

- Klicka på "SQL Editor" i vänstermenyn

### 3. Kör migrationen

Kopiera och klistra in innehållet från `supabase/migrations/20251210_create_daily_schedule.sql`

Eller kör direkt med kommando:

```bash
# Om du har Supabase CLI installerat:
supabase db push
```

### 4. Verifiera att tabellen skapades

Kör i SQL Editor:

```sql
SELECT * FROM daily_schedule LIMIT 1;
```

### 5. Regenerera TypeScript types

```bash
npx supabase gen types typescript --project-id fhdkkkujnhteetllxypg > types/database.ts
```

### 6. Bygg om projektet

```bash
npm run build
```

## Vad tabellen innehåller

- **Dagligt schema** för hunddagis-aktiviteter
- **Aktivitetstyper**: Promenad, Lek, Matning, Vila, Grooming, Träning
- **Hundkoppling**: Array med dog IDs som deltar
- **Personal**: Vem som är ansvarig
- **Status**: Om aktiviteten är genomförd
- **RLS**: Säkerhetsregler så varje org bara ser sitt schema

## Efter migrationen

Sidan kommer att fungera fullt ut med:

- ✅ Skapa dagliga aktiviteter
- ✅ Tilldela hundar till aktiviteter
- ✅ Markera aktiviteter som genomförda
- ✅ Filtrera per datum
- ✅ Redigera och ta bort aktiviteter
