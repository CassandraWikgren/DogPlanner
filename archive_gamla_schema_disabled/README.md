# Arkiverade Schema-filer

Dessa filer är gamla schema-snapshots och används inte längre i projektet.

## Flyttade filer (2025-12-01):

1. **hundpensionat.ts** - Gammal types-fil, oanvänd
2. **schema.sql** - Gammal schema-snapshot
3. **detta är_min_supabase_just_nu.sql** - Debugging-snapshot
4. **EXPORT_COMPLETE_SCHEMA.sql** - Gammal schema-export
5. **GET_CURRENT_SCHEMA.sql** - Query-script för att hämta schema

## Varför flyttade vi dem?

För att undvika förvirring och fel. Nu finns bara de aktiva filerna kvar:

### Aktiva schema-filer:

- `types/database.ts` - Nuvarande types (manuellt fixad)
- `types/database_AUTO_GENERATED.ts` - Komplett autogenererad (referens)
- `supabase/migrations/` - Officiella migrations

## Behöver du något från dessa filer?

Om du behöver återställa något:

1. Kolla i denna mapp
2. Kopiera vad du behöver
3. Ta INTE bort denna mapp - den är i .gitignore
