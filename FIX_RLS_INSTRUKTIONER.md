# 🔧 ÅTGÄRD FÖR RLS-FEL (2025-11-13)

## Problem som visas i konsolen

```
❌ new row violates row-level security policy for table "boarding_prices"
❌ new row violates row-level security policy for table "boarding_seasons"
❌ Error: Rooms: column rooms.room_type does not exist
❌ [ERR-1001] ROOMS_FETCH_ERROR / ROOMS_SAVE_ERROR
```

## Orsak

RLS policies (Row Level Security) i Supabase är **aktiverade** men **inte korrekt konfigurerade**. Detta blockerar alla INSERT/UPDATE operationer även för inloggade admin-användare.

## Lösning (KÖR DETTA I SUPABASE)

### Steg 1: Öppna Supabase Dashboard

1. Gå till https://supabase.com/dashboard
2. Välj ditt DogPlanner projekt
3. Navigera till **SQL Editor** (vänster meny)

### Steg 2: Kör fix-scriptet

1. Öppna filen: `fix_rls_policies_20251113.sql`
2. Kopiera **hela innehållet**
3. Klistra in i SQL Editor
4. Klicka **RUN** (eller Ctrl+Enter)

### Steg 3: Verifiera

Du ska se en tabell med 3 rader som visar:

```
boarding_prices  | Enable all for authenticated users on boarding_prices  | * | {authenticated}
boarding_seasons | Enable all for authenticated users on boarding_seasons | * | {authenticated}
rooms           | Enable all for authenticated users on rooms           | * | {authenticated}
```

## Vad scriptet gör

1. **Tar bort gamla policies** som har fel syntax
2. **Skapar nya policies** med korrekt syntax som tillåter:
   - SELECT (läsa)
   - INSERT (skapa)
   - UPDATE (uppdatera)
   - DELETE (ta bort)

   För alla **authenticated users** (inloggade användare)

3. **Aktiverar RLS** på alla tre tabellerna
4. **Verifierar** att policies är korrekt skapade

## Varför detta händer

- **Supabase har RLS aktiverat som standard** för säkerhet
- **Policies måste vara exakt rätt** – även små fel i syntax blockerar allt
- **Gamla policies** i `schema.sql` hade felaktig syntax ("Allow all" fungerar inte)
- **Nya policies** använder "Enable all" med FOR ALL + USING + WITH CHECK

## Efter fix

✅ Ska kunna spara priser i `app/hundpensionat/priser/page.tsx`  
✅ Ska kunna spara säsonger i `app/hundpensionat/priser/page.tsx`  
✅ Ska kunna spara rum i `app/rooms/page.tsx`  
✅ Inga RLS-fel i konsolen

## Teknisk bakgrund

### RLS Policy syntax (korrekt)

```sql
CREATE POLICY "Enable all for authenticated users on [table]"
ON [table]
FOR ALL                    -- Alla operationer (SELECT, INSERT, UPDATE, DELETE)
TO authenticated           -- För inloggade användare
USING (true)              -- Tillåt läsa alla rader
WITH CHECK (true);        -- Tillåt skapa/uppdatera alla rader
```

### Fel syntax (fungerar INTE)

```sql
CREATE POLICY "Allow all for authenticated users" ON [table]
FOR ALL USING (true);     -- Saknar WITH CHECK → INSERT/UPDATE blockeras!
```

## Relaterade filer

- `/fix_rls_policies_20251113.sql` - Fixscript (kör i Supabase)
- `/supabase/schema.sql` - Huvudschema (uppdateras separat)
- `/app/hundpensionat/priser/page.tsx` - Använder boarding_prices & boarding_seasons
- `/app/rooms/page.tsx` - Använder rooms
- `/types/database.ts` - TypeScript types (redan fixad)

## Om felen kvarstår efter fix

1. **Kolla browser console** - se exakt Supabase-felmeddelande
2. **Verifiera policies** - kör detta i SQL Editor:
   ```sql
   SELECT tablename, policyname, cmd, roles, qual, with_check
   FROM pg_policies
   WHERE tablename IN ('boarding_prices', 'boarding_seasons', 'rooms');
   ```
3. **Kontrollera org_id** - se att currentOrgId används i queries
4. **Testa manuell insert** - för att isolera RLS vs annan bugg:
   ```sql
   INSERT INTO boarding_prices (org_id, dog_size, base_price)
   VALUES ('[din-org-uuid]', 'medium', 300);
   ```

## Viktigt att förstå

- **RLS skyddar din data** mellan olika organisationer
- **Development kan köra utan RLS** (sätts i complete_testdata.sql)
- **Production MÅSTE ha RLS** för GDPR/säkerhet
- **Policies måste vara generösa** för admin-användare men kan senare skärpas per org

## Nästa steg efter fix

1. ✅ Testa spara ett pris i Hundpensionat → Priser
2. ✅ Testa spara en säsong i Hundpensionat → Priser
3. ✅ Testa spara ett rum i Rum-sidan
4. ✅ Verifiera att ingen RLS-fel visas i console
5. 🎯 Fortsätt med Feature parity (Hunddagis ny-bokning, stats, PDF)

---

**Skapad:** 2025-11-13  
**Problem:** RLS policies blockerar INSERT/UPDATE  
**Lösning:** Kör fix_rls_policies_20251113.sql i Supabase SQL Editor
