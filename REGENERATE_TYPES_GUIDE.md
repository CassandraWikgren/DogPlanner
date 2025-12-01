# Guide: Regenerera TypeScript Types från Supabase

## Varför behövs detta?

När du lägger till nya tabeller, kolumner eller ändrar schema i Supabase så behöver `types/database.ts` uppdateras för att TypeScript ska förstå vad som finns i databasen.

## Metod 1: Automatiskt med Supabase CLI (Rekommenderad)

### Förutsättningar

1. Supabase CLI installerat: `brew install supabase/tap/supabase`
2. `.env.local` med `NEXT_PUBLIC_SUPABASE_URL`

### Steg 1: Generera nya types

```bash
# Extrahera project-id från URL (allt före .supabase.co)
# Exempel: https://fhdkkkujnhteetllxypg.supabase.co
#          project-id = fhdkkkujnhteetllxypg

supabase gen types typescript --project-id DITT_PROJECT_ID --schema public > types/database_NEW.ts
```

### Steg 2: Jämför med nuvarande fil

```bash
# Kolla storleken
wc -l types/database.ts types/database_NEW.ts

# Kolla specifika tabeller
grep "boarding_prices:" types/database_NEW.ts
grep "dog_journal:" types/database_NEW.ts
```

### Steg 3: Backup och ersätt

```bash
# Backup gamla filen
cp types/database.ts types/database_BACKUP_$(date +%Y%m%d).ts

# Ersätt med nya
mv types/database_NEW.ts types/database.ts
```

### Steg 4: Fixa TypeScript-fel

```bash
npm run build
```

**Viktigt:** Den autogenererade filen är MYCKET mer strikt med nullable fields. Du kommer troligtvis få många fel som:

- `Type 'string | null' is not assignable to type 'string'`
- `Property 'xyz' is missing in type...`

Detta är **BRA** - det betyder att typerna nu stämmer exakt med databasen!

## Metod 2: Manuellt (för små ändringar)

Om du bara lagt till en eller två tabeller kan du manuellt lägga till dem i `types/database.ts`:

### Exempel: Lägga till boarding_prices

```typescript
boarding_prices: {
  Row: {
    id: string;
    org_id: string;
    dog_size: string; // "small", "medium", "large"
    base_price: number;
    weekend_surcharge: number | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    org_id: string;
    dog_size: string;
    base_price: number;
    weekend_surcharge?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    org_id?: string;
    dog_size?: string;
    base_price?: number;
    weekend_surcharge?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "boarding_prices_org_id_fkey";
      columns: ["org_id"];
      referencedRelation: "orgs";
      referencedColumns: ["id"];
    },
  ];
};
```

## Metod 3: Direkt från Supabase Dashboard

1. Gå till Supabase Dashboard → Project Settings → API
2. Scrolla ner till "Database TypeScript Types"
3. Kopiera koden
4. Klistra in i `types/database.ts`

## Vanliga problem och lösningar

### Problem 1: "Table X does not exist on type never"

**Orsak:** Tabellen saknas helt i types-filen  
**Lösning:** Kör Metod 1 eller lägg till manuellt

### Problem 2: "Property 'column_name' does not exist"

**Orsak:** Kolumnnamnet i koden matchar inte databasen  
**Lösning:**

1. Kolla i Supabase Table Editor vad kolumnen faktiskt heter
2. Uppdatera koden för att använda rätt kolumnnamn
3. Eller lägg till kolumnen i databasen om den saknas

### Problem 3: "Type 'string | null' is not assignable to 'string'"

**Orsak:** Databasen tillåter NULL men din interface inte  
**Lösning:** Uppdatera din lokala interface:

```typescript
// Före
interface MyType {
  name: string;
  email: string;
}

// Efter
interface MyType {
  name: string | null;
  email: string | null;
}
```

## Best Practices

### ✅ DO:

- Regenerera types efter varje större schema-ändring
- Commita både gamla och nya types-filen först gången för att kunna jämföra
- Kör `npm run build` lokalt innan du pushar
- Använd nullable types (`string | null`) för fält som kan vara NULL i databasen

### ❌ DON'T:

- Redigera types-filen manuellt för ofta (använd automatisk generering)
- Ignorera TypeScript-fel med @ts-ignore utan att kommentera varför
- Anta att types-filen är uppdaterad - verifiera alltid

## Automatisering (Framtida förbättring)

Du kan lägga till ett npm-script i `package.json`:

```json
{
  "scripts": {
    "types:generate": "supabase gen types typescript --project-id fhdkkkujnhteetllxypg --schema public > types/database.ts",
    "types:check": "npm run types:generate && npm run build"
  }
}
```

Då kan du köra:

```bash
npm run types:generate  # Generera nya types
npm run types:check     # Generera och verifiera
```

## När ska du regenerera?

Regenerera types när du:

- ✅ Lägger till nya tabeller i Supabase
- ✅ Lägger till/tar bort kolumner
- ✅ Ändrar datatyper (t.ex. string → number)
- ✅ Får TypeScript-fel om saknade tabeller
- ✅ Innan du går live med nya features
- ❌ För varje liten ändring (vänta tills du har flera ändringar)

## Nuvarande status (2025-12-01)

**Aktuell fil:** `types/database.ts` (manuellt fixad version)

- Innehåller: De viktigaste tabellerna med manuella fixar
- Saknas: Några mindre tabeller som inte används aktivt
- Status: ✅ Fungerar för nuvarande features

**Autogenererad fil:** `types/database_AUTO_GENERATED.ts` (referens)

- Innehåller: ALLA tabeller från Supabase
- Storleks: 3981 rader (vs 1266 i manuella)
- Status: 📝 Sparad för framtida referens när vi vill bli mer exakta

**Nästa steg:**
När projektet är mer stabilt och du inte gör lika många ändringar, byt till den autogenererade filen och fixa alla TypeScript-fel en gång för alla. Det ger mest robust typning långsiktigt.
