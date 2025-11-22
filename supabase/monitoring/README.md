# Supabase Monitoring System

## Översikt

System för att övervaka Supabase triggers, RLS policies, och databasintegritet.

## Komponenter

### 1. Trigger Logging (`setup_trigger_logging.sql`)

**Vad det gör:**

- Loggar alla trigger-exekveringar i `trigger_execution_log` tabell
- Sparar framgång/misslyckande, execution time, och error messages
- Uppdaterar `handle_new_user()` trigger med logging

**Tables:**

- `trigger_execution_log` - Alla trigger-exekveringar
- `trigger_health_summary` VIEW - Sammanfattning senaste 24h
- `recent_trigger_failures` VIEW - Senaste fel (7 dagar)

**Användning:**

```sql
-- Se trigger health
SELECT * FROM trigger_health_summary;

-- Se senaste fel
SELECT * FROM recent_trigger_failures;

-- Se specifik trigger
SELECT * FROM trigger_execution_log
WHERE trigger_name = 'on_auth_user_created'
ORDER BY executed_at DESC
LIMIT 10;
```

### 2. System Health Check (`check_system_health.sql`)

**Vad det gör:**

- Kontrollerar alla triggers och deras status
- Kontrollerar RLS policies
- Hittar orphaned records (records utan kopplingar)
- Hittar missing org_id (kritiskt!)

**Kör i Supabase SQL Editor:**

```sql
-- Kör hela filen för komplett health check
```

**Output:**

- `TRIGGERS` - Antal triggers per tabell
- `ACTIVE_TRIGGERS` - Vilka triggers är enabled/disabled
- `RLS_POLICIES` - Alla RLS policies
- `RLS_STATUS` - Vilket tabeller har RLS aktiverat
- `FUNCTIONS` - Alla custom functions
- `ORPHANED_DOGS` - Hundar utan ägare
- `ORPHANED_BOOKINGS` - Bokningar utan hund/ägare
- `PROFILES_MISSING_ORG` - Profiler utan organisation (KRITISKT!)
- `OWNERS_MISSING_ORG` - Ägare utan organisation

### 3. API Endpoint (`/api/monitoring/supabase`)

**Endpoints:**

- `GET /api/monitoring/supabase` - Hämta system health data

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-11-22T...",
  "data": {
    "triggerHealth": [...],
    "recentFailures": [...],
    "rlsStatus": [...],
    "orphanedRecords": [...]
  }
}
```

## Installation

### Steg 1: Kör SQL-filer i Supabase

```sql
-- 1. Sätt upp trigger logging
-- Kör: supabase/monitoring/setup_trigger_logging.sql
-- Detta skapar tabeller och views

-- 2. Testa system health
-- Kör: supabase/monitoring/check_system_health.sql
-- Se output för att förstå nuvarande status
```

### Steg 2: Testa API endpoint

```bash
# Lokalt
curl http://localhost:3000/api/monitoring/supabase

# Production (kräver inloggning)
# Gå till /api/monitoring/supabase i browser
```

### Steg 3: Skapa monitoring dashboard (framtida)

```typescript
// app/admin/monitoring/page.tsx
// TODO: Skapa UI för att visa trigger health
```

## Användningsfall

### 1. Debugging trigger-problem

```sql
-- Hitta varför user registration failar
SELECT * FROM trigger_execution_log
WHERE trigger_name = 'on_auth_user_created'
  AND success = false
ORDER BY executed_at DESC;
```

### 2. Performance monitoring

```sql
-- Vilka triggers är långsamma?
SELECT
  trigger_name,
  AVG(execution_time_ms) as avg_ms,
  MAX(execution_time_ms) as max_ms
FROM trigger_execution_log
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY trigger_name
ORDER BY avg_ms DESC;
```

### 3. Data integrity check

```sql
-- Kör health check varje dag
-- Se om det finns orphaned records eller missing org_id
```

## Alerts (TODO - Integration med Sentry)

Vi kan skicka alerts till Sentry när:

- Trigger failure rate > 10%
- Orphaned records hittas
- Missing org_id upptäcks
- Trigger execution time > 1000ms

```typescript
// I API endpoint:
if (failureRate > 0.1) {
  Sentry.captureMessage("High trigger failure rate", {
    level: "warning",
    extra: { triggerHealth },
  });
}
```

## Maintenance

### Auto-cleanup

```sql
-- Kör varje vecka (manuellt eller via cron)
SELECT cleanup_old_trigger_logs();
```

### Manual cleanup

```sql
-- Ta bort gamla loggar (>30 dagar)
DELETE FROM trigger_execution_log
WHERE executed_at < NOW() - INTERVAL '30 days';
```

## Prestanda

**Index:**

- `idx_trigger_log_trigger_name` - Snabb filtrering per trigger
- `idx_trigger_log_executed_at` - Snabb sortering på tid
- `idx_trigger_log_success` - Snabb filtrering på failures

**Storage:**

- ~1KB per log entry
- ~1000 triggers/dag = ~30MB/månad
- Med 30-dagars retention = ~1GB/år

## Framtida förbättringar

### 1. Slack/Discord Notifications

```typescript
// När trigger failar, skicka webhook till Slack
async function notifySlackOnFailure(error: TriggerError) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Trigger failure: ${error.trigger_name}`,
      blocks: [...]
    })
  });
}
```

### 2. Grafana Dashboard

- Visualisera trigger success rate över tid
- Visa execution time trends
- Alert på anomalier

### 3. Automated Healing

- Om missing org_id upptäcks, kör `heal_user_missing_org()` automatiskt
- Om orphaned records hittas, skicka notifikation till admin

### 4. Supabase Edge Function

```typescript
// supabase/functions/monitor-health/index.ts
// Kör health check varje timme och skicka resultat till Sentry
```

## Troubleshooting

### Problem: trigger_execution_log saknas

**Lösning:** Kör `setup_trigger_logging.sql` igen

### Problem: Inga loggar skapas

**Lösning:**

1. Kontrollera att trigger är enabled
2. Se till att `log_trigger_execution()` anropas i trigger
3. Kolla RLS policies

### Problem: För många loggar

**Lösning:**

1. Kör cleanup: `SELECT cleanup_old_trigger_logs();`
2. Minska retention period
3. Logga endast failures

## Relaterade filer

- `supabase/migrations/PERMANENT_FIX_org_assignment.sql` - Org assignment triggers
- `app/api/bookings/approve/route.ts` - Exempel på service role användning
- `DESIGN_IMPROVEMENTS_2025-11-22.md` - Design system

## Kontakt

Om något är oklart, se:

- `SYSTEM_HELHETSANALYS_2025-11-17.md`
- `BUGFIX_DESIGN_SESSION_2025-11-22.md`
