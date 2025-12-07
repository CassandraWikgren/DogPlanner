# Cleanup Plan - Gamla Schema-filer

## 📁 Status nu:

### Types-mappen (`types/`)

- ✅ **BEHÅLL:** `database.ts` - Aktiv types-fil (manuellt fixad)
- ✅ **BEHÅLL:** `database_AUTO_GENERATED.ts` - Referens (komplett från Supabase)
- ❓ **KOLLA:** `hundpensionat.ts` - Gammal? Används den?

### Supabase-mappen (`supabase/`)

**SQL-filer:**

- ✅ **BEHÅLL:** `migrations/20251122160200_remote_schema.sql` - Migration (viktig!)
- ❓ **KOLLA:** `schema.sql` - Gammal kopia?
- ❓ **KOLLA:** `detta är_min_supabase_just_nu.sql` - Snapshot? Ta bort?
- ❓ **KOLLA:** `EXPORT_COMPLETE_SCHEMA.sql` - Gammal export?
- ❓ **KOLLA:** `GET_CURRENT_SCHEMA.sql` - Query-script? Behövs?
- ✅ **BEHÅLL:** `enable_rls_and_realtime.sql` - Setup-script
- ✅ **BEHÅLL:** `ADD_PERFORMANCE_INDEXES.sql` - Setup-script
- ✅ **BEHÅLL:** `ADD_GDPR_DELETE_POLICIES.sql` - Setup-script
- ✅ **BEHÅLL:** `function_update_waitlist_status.sql` - Function
- ✅ **BEHÅLL:** `add_visit_booked_time.sql` - Migration

## 🗑️ Förslag på cleanup:

### Ta bort:

1. `types/hundpensionat.ts` - Om den inte används
2. `supabase/schema.sql` - Om det är en gammal snapshot
3. `supabase/detta är_min_supabase_just_nu.sql` - Verkar vara debugging-snapshot
4. `supabase/EXPORT_COMPLETE_SCHEMA.sql` - Gammal export
5. `supabase/GET_CURRENT_SCHEMA.sql` - Query för att hämta schema (behövs ej längre)

Vill du att jag kollar vad filerna innehåller först?
