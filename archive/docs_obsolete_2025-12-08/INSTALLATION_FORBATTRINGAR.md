# 🚨 INSTALLATION - Säker migration av förbättringar

**VIKTIGT:** Läs HELA denna guide innan du kör något!

---

## ⚠️ Före du börjar

### 1. Backup FÖRST!

```bash
# Kör backup-verify scriptet
./scripts/backup-verify.sh

# Eller manuellt i Supabase Dashboard:
# Settings → Database → Backup → Create Backup
```

**Vänta tills backup är klar innan du fortsätter!**

### 2. Verifiera nuvarande databas

```sql
-- I Supabase SQL Editor, kör:
SELECT * FROM verify_database_integrity();

-- Förväntat: Alla checks ska vara "OK"
-- Om något är "ERROR" - fixa det FÖRST!
```

### 3. Kolla om förbättringarna redan är installerade

```sql
-- Check 1: Nya kolumner finns redan?
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'interest_applications'
  AND column_name IN ('created_dog_id', 'created_owner_id');

-- Om du ser 2 rader: ✅ Redan installerat!
-- Om du ser 0 rader: ⏩ Fortsätt med installation

-- Check 2: Gamla kolumnen borttagen redan?
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'dog_journal'
  AND column_name = 'text';

-- Om du ser 0 rader: ✅ Redan borttaget!
-- Om du ser 1 rad: ⏩ Fortsätt med installation
```

---

## 🎯 Installation (steg-för-steg)

### STEG 1: Öppna Supabase Dashboard

1. Gå till [https://app.supabase.com](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till **SQL Editor** (i vänstermenyn)

### STEG 2: Öppna migration-filen

1. Öppna filen: `supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql`
2. Kopiera **HELA** innehållet (Cmd+A, Cmd+C)

### STEG 3: Klistra in i SQL Editor

1. I Supabase SQL Editor, klistra in koden (Cmd+V)
2. **GRANSKA** koden innan du kör!
3. Särskilt viktigt:
   - ✅ `ALTER TABLE interest_applications ADD COLUMN`
   - ✅ `ALTER TABLE dog_journal DROP COLUMN text`
   - ✅ `CREATE FUNCTION enforce_journal_retention()`
   - ✅ `CREATE VIEW analytics_*`

### STEG 4: Kör migrationen

1. Klicka på **"Run"** (eller Cmd+Enter)
2. Vänta tills den är klar (kan ta 10-30 sekunder)
3. Kolla output:

```
Success: Query completed successfully
```

**Om du ser fel:**

- Läs felmeddelandet noggrant
- Oftast: "column already exists" = redan installerat ✅
- Om annat fel: STOPPA och kontakta support!

### STEG 5: Verifiera installation

Kör dessa queries en efter en:

```sql
-- ✅ Check 1: Nya kolumner finns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'interest_applications'
  AND column_name IN ('created_dog_id', 'created_owner_id');

-- Förväntat: 2 rader
-- created_dog_id
-- created_owner_id

-- ✅ Check 2: Gamla kolumnen borta
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'dog_journal'
  AND column_name = 'text';

-- Förväntat: 0 rader (kolumnen ska INTE finnas)

-- ✅ Check 3: Cron job finns
SELECT * FROM cron.job WHERE jobname = 'monthly-journal-retention';

-- Förväntat: 1 rad med schedule = '0 2 1 * *'

-- ✅ Check 4: Analytics views finns
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'analytics_%'
ORDER BY table_name;

-- Förväntat: 5 rader
-- analytics_boarding_occupancy
-- analytics_conversion_rate
-- analytics_daycare_occupancy
-- analytics_popular_breeds
-- analytics_revenue_by_service

-- ✅ Check 5: Functions finns
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('enforce_journal_retention', 'verify_database_integrity', 'get_table_counts');

-- Förväntat: 3 rader
-- enforce_journal_retention
-- get_table_counts
-- verify_database_integrity

-- ✅ Check 6: Databasintegritet efter migration
SELECT * FROM verify_database_integrity();

-- Förväntat: Alla checks = "OK"
```

---

## 📊 Test av nya funktioner

### Test 1: Analytics Views

```sql
-- Kör varje view för att se att de fungerar
SELECT * FROM analytics_daycare_occupancy LIMIT 5;
SELECT * FROM analytics_boarding_occupancy LIMIT 5;
SELECT * FROM analytics_revenue_by_service LIMIT 5;
SELECT * FROM analytics_popular_breeds LIMIT 5;
SELECT * FROM analytics_conversion_rate LIMIT 5;

-- Om du ser data: ✅ Fungerar!
-- Om du ser 0 rader: Det är OK, kan vara tom data ännu
-- Om du ser FEL: Kontrollera migration
```

### Test 2: Integritetskontroll

```sql
SELECT * FROM verify_database_integrity();

-- Alla checks ska vara "OK"
-- Om "ERROR": ⚠️ Något är fel, fixa omedelbart!
```

### Test 3: Tabellräkningar

```sql
SELECT * FROM get_table_counts()
ORDER BY row_count DESC
LIMIT 10;

-- Ska visa de 10 största tabellerna med antal rader
```

### Test 4: Journal Retention (KÖR EJ I PRODUKTION!)

```sql
-- Endast för test i development:
-- SELECT enforce_journal_retention();

-- I produktion: Vänta på automatisk cron (1:a varje månad kl 02:00 UTC)
```

---

## 🔄 Uppdatera Next.js kod

### 1. dog_journal queries

**FÖRE (gammal kod):**

```typescript
// ❌ Använder 'text' (finns inte längre!)
await supabase.from("dog_journal").insert({
  dog_id,
  org_id,
  text: "Anteckning...", // ❌ FEL!
  user_id,
});
```

**EFTER (ny kod):**

```typescript
// ✅ Använder 'content'
await supabase.from("dog_journal").insert({
  dog_id,
  org_id,
  content: "Anteckning...", // ✅ RÄTT!
  user_id,
});
```

**Hitta alla ställen:**

```bash
# Sök efter gamla användningar:
grep -r "from('dog_journal')" app/ --include="*.tsx" --include="*.ts"
grep -r "\.text" app/ --include="*.tsx" --include="*.ts" | grep journal

# Ändra alla:
# text: → content:
```

### 2. Intresseanmälan-flow

**Lägg till efter att du skapat hund/ägare:**

```typescript
// I filen där du godkänner intresseanmälningar
// (t.ex. app/admin/intresseanmalan/[id]/page.tsx)

async function approveApplication(applicationId: string) {
  // 1. Skapa ägare
  const { data: newOwner } = await supabase
    .from("owners")
    .insert({
      org_id: currentOrgId,
      full_name: application.owner_name,
      email: application.owner_email,
      phone: application.owner_phone,
      // ... andra fält
    })
    .select()
    .single();

  // 2. Skapa hund
  const { data: newDog } = await supabase
    .from("dogs")
    .insert({
      org_id: currentOrgId,
      owner_id: newOwner.id,
      name: application.dog_name,
      breed: application.dog_breed,
      // ... andra fält
    })
    .select()
    .single();

  // 3. 🆕 Länka tillbaka till intresseanmälan (NYTT!)
  await supabase
    .from("interest_applications")
    .update({
      status: "approved",
      created_dog_id: newDog.id, // 🆕 LÄGG TILL!
      created_owner_id: newOwner.id, // 🆕 LÄGG TILL!
      processed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  // Nu kan du analysera konverteringsgrad! 📊
}
```

### 3. Bygg Analytics Dashboard

Skapa ny fil: `app/admin/analytics/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Hämta analytics
  const { data: occupancy } = await supabase
    .from('analytics_daycare_occupancy')
    .select('*')
    .order('month', { ascending: false })
    .limit(12);

  const { data: conversion } = await supabase
    .from('analytics_conversion_rate')
    .select('*');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* Beläggningsgrad */}
      <Card>
        <CardHeader>Beläggningsgrad (senaste 12 månaderna)</CardHeader>
        <CardContent>
          <div className="space-y-2">
            {occupancy?.map(row => (
              <div key={row.month} className="flex justify-between">
                <span>{row.month}</span>
                <span>{row.unique_dogs} hundar</span>
                <span>{row.total_visits} besök</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Konverteringsgrad */}
      <Card>
        <CardHeader>Konverteringsgrad</CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversion?.map(row => (
              <div key={row.service_type} className="flex justify-between">
                <span>{row.service_type}</span>
                <span>{row.total_applications} ansökningar</span>
                <span className="font-bold">{row.conversion_rate_percent}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🛡️ Säkerhet och rollback

### Om något går fel

**1. Identifiera problemet:**

```sql
-- Kör integritetskontroll
SELECT * FROM verify_database_integrity();

-- Kolla vilket check som är ERROR
```

**2. Rollback-plan:**

```sql
-- Om du vill ta bort nya kolumner (GÖR EJ om data redan finns!)
ALTER TABLE interest_applications
  DROP COLUMN IF EXISTS created_dog_id,
  DROP COLUMN IF EXISTS created_owner_id;

-- Om du vill återställa 'text' kolumn (GÖR EJ om data redan migrerat!)
ALTER TABLE dog_journal
  ADD COLUMN text TEXT;

-- Om du vill ta bort cron job
SELECT cron.unschedule('monthly-journal-retention');

-- Om du vill ta bort views
DROP VIEW IF EXISTS analytics_daycare_occupancy;
DROP VIEW IF EXISTS analytics_boarding_occupancy;
DROP VIEW IF EXISTS analytics_revenue_by_service;
DROP VIEW IF EXISTS analytics_popular_breeds;
DROP VIEW IF EXISTS analytics_conversion_rate;

-- Om du vill ta bort functions
DROP FUNCTION IF EXISTS enforce_journal_retention();
DROP FUNCTION IF EXISTS verify_database_integrity();
DROP FUNCTION IF EXISTS get_table_counts();
```

**3. Återställ från backup:**

I Supabase Dashboard:

- Settings → Database → Backups
- Välj backup från före migrationen
- Klicka "Restore"

**⚠️ VIKTIGT:** Restoration tar 5-15 minuter och alla ändringar sedan backup försvinner!

---

## ✅ Post-installation Checklist

- [ ] Backup skapad FÖRE migration
- [ ] Migration körd i Supabase SQL Editor
- [ ] Alla verifieringar gröna (6 st checks)
- [ ] Analytics views fungerar (5 st)
- [ ] Integritetskontroll = alla "OK"
- [ ] Next.js kod uppdaterad (dog_journal queries)
- [ ] Intresseanmälan-flow uppdaterat (spårbarhet)
- [ ] Analytics Dashboard byggt
- [ ] Backup-script schemalagt (backup-verify.sh)
- [ ] Dokumentation läst och förstådd

---

## 📞 Support

**Om du stöter på problem:**

1. **Kör integritetskontroll:**

   ```sql
   SELECT * FROM verify_database_integrity();
   ```

2. **Läs dokumentation:**
   - `FORBATTRINGAR_2025-12-03_README.md` - Komplett guide
   - `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` - Databasstruktur

3. **Kolla migration-filen:**
   - `supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql`

4. **Kontrollera loggar:**
   - Supabase Dashboard → Logs → Database

---

## 🎉 Grattis!

Om alla checks är gröna och allt fungerar:

**🚀 Du har nu:**

- ✅ Spårbar konvertering från intresseanmälan till kund
- ✅ Renare databasschema (ingen redundant kolumn)
- ✅ GDPR-compliant automatisk journal-rensning
- ✅ 5 analytics views för business intelligence
- ✅ Automatisk backup-verifiering

**Systemet är nu mer robust, spårbart och analytiskt!** 🎊

---

**Skapad:** 3 December 2025  
**Version:** 1.0  
**Status:** Produktionsklar

**Nästa steg:** Övervaka systemet i 24h, bygg sedan Analytics Dashboard i Next.js
