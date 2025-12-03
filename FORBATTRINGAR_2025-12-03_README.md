# 🚀 Förbättringar 3 December 2025

**Status:** ✅ Implementerade och dokumenterade  
**Migration:** `supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql`  
**Dokumentation:** `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` uppdaterad

---

## 📋 Översikt

Fem viktiga förbättringar har implementerats för att göra systemet mer robust, spårbart och analytiskt:

1. ✅ **Intresseanmälningar - Spårbarhet**
2. ✅ **Hundjournal - Redundant kolumn borttagen**
3. ✅ **Journal - Specifik 2-års retention (GDPR)**
4. ✅ **Analytics Dashboard - 5 nya views**
5. ✅ **Automatisk Backup-verifiering**

---

## 1️⃣ Intresseanmälningar - Spårbarhet

### Problem

När en intresseanmälan konverterades till hund/ägare fanns ingen koppling tillbaka. Detta gjorde det omöjligt att analysera konverteringsgrad.

### Lösning

Två nya kolumner i `interest_applications`:

```sql
ALTER TABLE interest_applications
ADD COLUMN created_dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
ADD COLUMN created_owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;
```

### Användning

**När du godkänner en intresseanmälan:**

```typescript
// 1. Skapa ägare
const { data: newOwner } = await supabase
  .from("owners")
  .insert({
    org_id: currentOrgId,
    full_name: application.owner_name,
    email: application.owner_email,
    // ...
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
    // ...
  })
  .select()
  .single();

// 3. 👉 Länka tillbaka till intresseanmälan (NYTT!)
await supabase
  .from("interest_applications")
  .update({
    created_dog_id: newDog.id,
    created_owner_id: newOwner.id,
    status: "approved",
    processed_at: new Date().toISOString(),
  })
  .eq("id", application.id);
```

### Nytta

**Konverteringsanalys:**

```sql
-- Se konverteringsgrad per tjänst
SELECT * FROM analytics_conversion_rate;

-- Output:
-- service_type | total_applications | converted_dogs | conversion_rate_percent
-- daycare      | 42                | 28            | 66.7%
-- boarding     | 18                | 12            | 66.7%
-- grooming     | 15                | 10            | 66.7%
```

**Business insights:**

- Vilka tjänster har högst konvertering?
- Vilka månader har flest konverteringar?
- Hur lång tid tar det från ansökan till godkännande?

---

## 2️⃣ Hundjournal - Redundant kolumn borttagen

### Problem

Tabellen `dog_journal` hade både `text` och `content` kolumner. Koden använder bara `content`, vilket skapade förvirring.

### Lösning

```sql
-- Först: Kopiera över data om det finns något i 'text'
UPDATE dog_journal
SET content = COALESCE(NULLIF(content, ''), text)
WHERE content IS NULL OR content = '';

-- Ta bort redundant kolumn
ALTER TABLE dog_journal
DROP COLUMN IF EXISTS text;
```

### Viktigt

**✅ RÄTT (efter migration):**

```typescript
await supabase.from("dog_journal").insert({
  dog_id: dogId,
  org_id: currentOrgId,
  content: "Bella hade lite ont i tassen idag", // 👈 content
  user_id: currentUserId,
});
```

**❌ FEL (kolumnen finns inte längre):**

```typescript
await supabase.from("dog_journal").insert({
  text: "...", // ❌ Finns inte!
});
```

### Nytta

- Renare datamodell
- Mindre förvirring för utvecklare
- Inga fler frågor om "vilken kolumn ska jag använda?"

---

## 3️⃣ Journal - Specifik 2-års retention (GDPR)

### Problem

Journaler raderades via CASCADE när hunden raderades, men ingen explicit 2-års policy enligt GDPR.

### Lösning

**Function:**

```sql
CREATE OR REPLACE FUNCTION enforce_journal_retention()
RETURNS void AS $$
BEGIN
  -- Radera journalanteckningar äldre än 2 år
  DELETE FROM dog_journal
  WHERE created_at < NOW() - INTERVAL '2 years';

  -- Radera frisörjournaler äldre än 2 år
  DELETE FROM grooming_journal
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$;
```

**Automatisk cron:**

```sql
-- Körs kl 02:00 UTC den 1:a varje månad
SELECT cron.schedule(
  'monthly-journal-retention',
  '0 2 1 * *',
  $$ SELECT enforce_journal_retention(); $$
);
```

### Verifiera

**Kolla att cron-jobbet finns:**

```sql
SELECT * FROM cron.job WHERE jobname = 'monthly-journal-retention';

-- Förväntat output:
-- jobname                    | schedule  | active | database
-- monthly-journal-retention  | 0 2 1 * * | true   | postgres
```

**Manuellt köra (för test):**

```sql
SELECT enforce_journal_retention();
-- Output: NOTICE: Journal retention: Raderade journaler äldre än 2 år
```

### Nytta

- GDPR-compliant automatisk datarensning
- Ingen manuell hantering behövs
- Transparent och loggad
- 2 år = lagstadgad lagringstid för medicinska journaler

---

## 4️⃣ Analytics Dashboard - 5 nya views

### Översikt

Fem nya views för rapportering och affärsanalys:

| View                           | Syfte                                   |
| ------------------------------ | --------------------------------------- |
| `analytics_daycare_occupancy`  | Beläggningsgrad hunddagis per månad     |
| `analytics_boarding_occupancy` | Beläggningsgrad hundpensionat per månad |
| `analytics_revenue_by_service` | Intäkter per tjänst per månad           |
| `analytics_popular_breeds`     | Populäraste hundraser per organisation  |
| `analytics_conversion_rate`    | Konverteringsgrad från intresseanmälan  |

### 4.1 Beläggningsgrad Hunddagis

```sql
SELECT * FROM analytics_daycare_occupancy
WHERE org_id = 'din-org-id'
ORDER BY month DESC
LIMIT 12;
```

**Kolumner:**

- `org_name` - Organisationens namn
- `month` - Månad (2025-11-01)
- `unique_dogs` - Antal unika hundar
- `total_visits` - Totalt antal besök
- `avg_hours_per_visit` - Genomsnittlig tid per besök

**Användning i Next.js:**

```typescript
const { data: occupancy } = await supabase
  .from("analytics_daycare_occupancy")
  .select("*")
  .eq("org_id", currentOrgId)
  .order("month", { ascending: false })
  .limit(12);

// Bygg graf med occupancy-data
```

### 4.2 Beläggningsgrad Hundpensionat

```sql
SELECT * FROM analytics_boarding_occupancy
WHERE org_id = 'din-org-id'
ORDER BY month DESC;
```

**Kolumner:**

- `unique_dogs` - Antal unika hundar
- `total_bookings` - Totalt antal bokningar
- `total_nights` - Totalt antal nätter
- `avg_booking_value` - Genomsnittligt värde per bokning

### 4.3 Intäkter per Tjänst

```sql
SELECT * FROM analytics_revenue_by_service
WHERE org_id = 'din-org-id'
AND month >= '2025-01-01'
ORDER BY month DESC, invoice_type;
```

**Kolumner:**

- `invoice_type` - 'prepayment', 'afterpayment', 'full'
- `invoice_count` - Antal fakturor
- `total_revenue` - Total intäkt
- `avg_invoice_amount` - Genomsnittligt fakturabelopp

**Användning:**

```typescript
// Hämta intäkter för senaste 6 månaderna
const { data: revenue } = await supabase
  .from("analytics_revenue_by_service")
  .select("*")
  .eq("org_id", currentOrgId)
  .gte("month", sixMonthsAgo)
  .order("month", { ascending: false });

// Bygg stapeldiagram: prepayment vs afterpayment vs full
```

### 4.4 Populäraste Hundraser

```sql
SELECT * FROM analytics_popular_breeds
WHERE org_id = 'din-org-id'
ORDER BY dog_count DESC
LIMIT 10;
```

**Kolumner:**

- `breed` - Hundras
- `dog_count` - Antal hundar av denna ras
- `avg_height_cm` - Genomsnittlig mankhöjd

**Business insight:**

- Vilka raser är populärast?
- Behöver vi specialisera oss på vissa raser?
- Prissättning baserat på ras-popularitet

### 4.5 Konverteringsgrad

```sql
SELECT * FROM analytics_conversion_rate
WHERE org_id = 'din-org-id';
```

**Kolumner:**

- `service_type` - 'daycare', 'boarding', 'grooming'
- `total_applications` - Totalt antal ansökningar
- `converted_dogs` - Antal som blev kunder
- `conversion_rate_percent` - Konverteringsgrad i %

**Business insight:**

- Vilken tjänst har högst konvertering?
- Var behöver vi förbättra marknadsföring?
- Hur lång tid tar det från ansökan till godkännande?

### RLS-säkerhet

**ALLA views respekterar automatiskt org_id-isolering!**

```sql
-- Användare ser ENDAST sin egen orgs data
-- RLS policies appliceras automatiskt på underliggande tabeller
```

---

## 5️⃣ Automatisk Backup-verifiering

### Översikt

Två nya functions för att verifiera databasintegritet:

1. **`verify_database_integrity()`** - Kontrollerar kritiska fält
2. **`get_table_counts()`** - Räknar rader per tabell

### 5.1 Databasintegritet

```sql
SELECT * FROM verify_database_integrity();
```

**Kontrollerar:**

1. ✅ Alla profiler har `org_id`
2. ✅ Alla owners har `customer_number`
3. ✅ Alla invoices har `invoice_number`
4. ✅ Alla dogs har `owner_id`
5. ✅ Alla bookings har `dog_id` och `owner_id`
6. ✅ Invoice items har `amount` (inte 0 kr)
7. ✅ Triggers finns (minst 30)
8. ✅ RLS är aktiverat (minst 50 tabeller)

**Output-exempel:**

```
check_name              | status  | details
-----------------------|---------|----------------------------------
profiles_org_id        | OK      | 0 profiler saknar org_id
owners_customer_number | OK      | 0 ägare saknar customer_number
invoices_invoice_number| OK      | 0 fakturor saknar invoice_number
dogs_owner_id          | OK      | 0 hundar saknar owner_id
bookings_required_ids  | OK      | 0 bokningar saknar dog_id eller owner_id
invoice_items_amount   | OK      | 0 fakturarader med 0 kr amount
critical_triggers      | OK      | Antal triggers: 38
rls_enabled            | OK      | Antal tabeller med RLS: 67
```

**Om något är fel:**

```
check_name              | status  | details
-----------------------|---------|----------------------------------
profiles_org_id        | ERROR   | 3 profiler saknar org_id
```

👉 Fixa omedelbart om status = ERROR!

### 5.2 Tabellräknare

```sql
SELECT * FROM get_table_counts()
ORDER BY row_count DESC;
```

**Output:**

```
table_name              | row_count
-----------------------|----------
special_dates          | 7030
dogs                   | 245
owners                 | 167
invoices               | 432
invoice_items          | 1284
bookings               | 89
...
```

**Användning:**

- Verifiera att backup innehåller data
- Jämför före/efter migrering
- Upptäck oväntade dataraderingar

### Backup-script exempel

```bash
#!/bin/bash
# backup-verify.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# 1. Kör backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > $BACKUP_FILE

# 2. Verifiera integritet FÖRE backup
echo "Verifierar integritet..."
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT * FROM verify_database_integrity();" > integrity_check.txt

# 3. Kolla om några checks = ERROR
if grep -q "ERROR" integrity_check.txt; then
  echo "❌ Integritetsproblem funna! Se integrity_check.txt"
  exit 1
fi

echo "✅ Backup klar och verifierad: $BACKUP_FILE"

# 4. Spara tabellräkningar för jämförelse
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT * FROM get_table_counts();" > table_counts_${DATE}.txt
```

---

## 📦 Installation

### 1. Kör migration

**I Supabase Dashboard → SQL Editor:**

```sql
-- Kopiera innehållet från:
-- supabase/migrations/20251203_forbattringar_spårbarhet_och_optimering.sql

-- Klistra in och kör
```

### 2. Verifiera installation

```sql
-- Check 1: Nya kolumner finns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'interest_applications'
  AND column_name IN ('created_dog_id', 'created_owner_id');

-- Check 2: Gamla kolumner borta
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'dog_journal'
  AND column_name = 'text';
-- Förväntat: TOM (kolumnen ska INTE finnas)

-- Check 3: Cron job finns
SELECT * FROM cron.job WHERE jobname = 'monthly-journal-retention';

-- Check 4: Analytics views finns
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'analytics_%';

-- Check 5: Backup functions finns
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('verify_database_integrity', 'get_table_counts');
```

### 3. Testa funktionalitet

```sql
-- Test 1: Konverteringsanalys
SELECT * FROM analytics_conversion_rate LIMIT 5;

-- Test 2: Beläggningsgrad
SELECT * FROM analytics_daycare_occupancy
ORDER BY month DESC
LIMIT 3;

-- Test 3: Integritetskontroll
SELECT * FROM verify_database_integrity();

-- Test 4: Tabellräkningar
SELECT * FROM get_table_counts()
ORDER BY row_count DESC
LIMIT 10;

-- Test 5: Journal retention (kör INTE i produktion utan backup!)
-- SELECT enforce_journal_retention();
```

---

## 🔄 Uppdatera befintlig kod

### Hundjournal

**FÖRE (gammal kod):**

```typescript
// ❌ Använder 'text' (finns inte längre!)
await supabase.from("dog_journal").insert({
  text: "Anteckning...",
  // ...
});
```

**EFTER (ny kod):**

```typescript
// ✅ Använder 'content'
await supabase.from("dog_journal").insert({
  content: "Anteckning...",
  // ...
});
```

### Intresseanmälningar

**FÖRE (gammal kod):**

```typescript
// Godkänn ansökan - skapar hund/ägare
const newOwner = await createOwner(...);
const newDog = await createDog(...);

// Status uppdateras
await supabase.from('interest_applications')
  .update({ status: 'approved' })
  .eq('id', applicationId);

// ❌ Ingen länkning tillbaka!
```

**EFTER (ny kod):**

```typescript
// Godkänn ansökan - skapar hund/ägare
const newOwner = await createOwner(...);
const newDog = await createDog(...);

// ✅ Länka tillbaka för spårbarhet!
await supabase.from('interest_applications')
  .update({
    status: 'approved',
    created_dog_id: newDog.id,      // 🆕
    created_owner_id: newOwner.id,  // 🆕
    processed_at: new Date().toISOString()
  })
  .eq('id', applicationId);
```

---

## 📊 Dashboard-exempel

### Analytics Dashboard (React)

```typescript
// app/admin/analytics/page.tsx

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Hämta alla analytics
  const [occupancy, revenue, breeds, conversion] = await Promise.all([
    supabase.from('analytics_daycare_occupancy')
      .select('*')
      .order('month', { ascending: false })
      .limit(12),
    supabase.from('analytics_revenue_by_service')
      .select('*')
      .order('month', { ascending: false })
      .limit(12),
    supabase.from('analytics_popular_breeds')
      .select('*')
      .order('dog_count', { ascending: false })
      .limit(10),
    supabase.from('analytics_conversion_rate')
      .select('*')
  ]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* Beläggningsgrad */}
      <Card>
        <CardHeader>Beläggningsgrad (senaste 12 månaderna)</CardHeader>
        <CardContent>
          <LineChart data={occupancy.data} />
        </CardContent>
      </Card>

      {/* Intäkter */}
      <Card>
        <CardHeader>Intäkter per tjänst</CardHeader>
        <CardContent>
          <BarChart data={revenue.data} />
        </CardContent>
      </Card>

      {/* Populära raser */}
      <Card>
        <CardHeader>Populäraste hundraser</CardHeader>
        <CardContent>
          <PieChart data={breeds.data} />
        </CardContent>
      </Card>

      {/* Konvertering */}
      <Card>
        <CardHeader>Konverteringsgrad</CardHeader>
        <CardContent>
          <Table>
            {conversion.data?.map(row => (
              <TableRow key={row.service_type}>
                <TableCell>{row.service_type}</TableCell>
                <TableCell>{row.total_applications}</TableCell>
                <TableCell>{row.converted_dogs}</TableCell>
                <TableCell>{row.conversion_rate_percent}%</TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Migration körd i Supabase
- [ ] Nya kolumner verifierade (`created_dog_id`, `created_owner_id`)
- [ ] Gamla kolumner borta (`dog_journal.text`)
- [ ] Cron job aktiverat (`monthly-journal-retention`)
- [ ] Analytics views fungerar (5 st)
- [ ] Backup functions fungerar (2 st)
- [ ] Befintlig kod uppdaterad (dog_journal queries)
- [ ] Ny kod för intresseanmälan länkning implementerad
- [ ] Dashboard-sida skapad för analytics
- [ ] Backup-script uppdaterat med integritetskontroll
- [ ] Dokumentation uppdaterad

---

## 🎯 Förväntade resultat

### Innan migration:

- ❌ Ingen spårbarhet från intresseanmälan till kund
- ❌ Förvirring kring `dog_journal.text` vs `content`
- ❌ Ingen automatisk journal-rensning
- ❌ Ingen analytics/rapportering
- ❌ Ingen backup-verifiering

### Efter migration:

- ✅ Full spårbarhet: intresseanmälan → kund/hund
- ✅ Tydlig schema: endast `content` kolumn
- ✅ GDPR-compliant: automatisk 2-års retention
- ✅ 5 analytics views för business insights
- ✅ Automatisk backup-integritetskontroll

---

## 📞 Support

**Frågor om förbättringarna?**

1. Läs `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` (uppdaterad med alla detaljer)
2. Kör `verify_database_integrity()` för att kontrollera din databas
3. Kontrollera migration-filen för exakt SQL-syntax

**Om något går fel:**

```sql
-- Rollback (kör INTE utan backup!)
-- DROP COLUMN created_dog_id, created_owner_id
-- ADD COLUMN text TEXT (om du vill återställa)
-- SELECT cron.unschedule('monthly-journal-retention')
```

---

**Skapad:** 3 December 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

🎉 **Grattis! Ditt system är nu mer robust, spårbart och analytiskt!**
