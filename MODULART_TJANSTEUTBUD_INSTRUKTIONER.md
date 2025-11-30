# 🚀 VIKTIGT: Kör denna SQL för att aktivera Modulärt Tjänsteutbud

## Steg 1: Kör SQL-migrationen

Gå till Supabase SQL Editor och kör filen:

```
supabase/migrations/ADD_ENABLED_SERVICES.sql
```

**Eller kopiera och kör direkt:**

```sql
-- Lägg till kolumn för enabled_services
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS enabled_services TEXT[]
DEFAULT ARRAY['daycare', 'boarding', 'grooming'];

-- Index för snabbare queries
CREATE INDEX IF NOT EXISTS idx_organisations_enabled_services
ON organisations USING GIN (enabled_services);

-- Sätt alla befintliga organisationer till "alla tjänster"
UPDATE organisations
SET enabled_services = ARRAY['daycare', 'boarding', 'grooming']
WHERE enabled_services IS NULL;
```

## Steg 2: Verifiera

Kör denna query för att verifiera att det fungerade:

```sql
SELECT
    id,
    org_name,
    enabled_services
FROM organisations;
```

Du ska se att alla organisationer har `['daycare', 'boarding', 'grooming']` som default.

## Steg 3: Testa på hemsidan

1. Logga in på `/admin`
2. Du ska nu se ett nytt grönt kort högst upp: **"Tjänsteinställningar"**
3. Klicka på det för att välja vilka tjänster ditt företag erbjuder
4. Testa att avaktivera t.ex. Dagis och Pensionat → endast Frisör ska synas

## Hur det fungerar:

### För rena frisörföretag:

- Välj endast "Hundfrisör" i Tjänsteinställningar
- Navigation visar bara: Frisör, Admin, Ekonomi
- Ingen förvirring med Dagis/Pensionat

### För fullserviceföretag (som ditt):

- Behåll alla tre tjänster aktiverade
- Allt fungerar precis som idag

## Prissättning (för framtida fakturalogik):

| Tjänster   | Pris/månad |
| ---------- | ---------- |
| 1 tjänst   | 299-399 kr |
| 2 tjänster | 599 kr     |
| Alla 3     | 799 kr     |

## Tekniska detaljer:

**Nya filer:**

- ✅ `/lib/hooks/useEnabledServices.ts` - Hook för att läsa enabled_services
- ✅ `/components/ServiceGuard.tsx` - Komponent som döljer innehåll baserat på tjänster
- ✅ `/app/admin/tjanster/page.tsx` - Sida för att välja tjänster
- ✅ `/supabase/migrations/ADD_ENABLED_SERVICES.sql` - Databasmigrering

**Uppdaterade filer:**

- ✅ `/app/admin/page.tsx` - Använder nu ServiceGuards för att dölja prissidor

**Nästa steg (ej implementerat än):**

- [ ] Uppdatera Navbar/Sidebar med ServiceGuards
- [ ] Dashboard-routing (redirect till rätt tjänst vid inloggning)
- [ ] Uppdatera startsidan efter inloggning

---

## 🔒 Säkerhet:

- Default är ALLA tjänster → befintliga kunder påverkas inte
- Om något går fel i laddning → fallback till alla tjänster
- Ingen data tas bort, endast UI döljs
- Admin kan alltid ändra tjänster

**Status:** ✅ Klart att testa!
