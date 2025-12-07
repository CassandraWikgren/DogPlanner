# 🚀 STEG-FÖR-STEG LANSERING

## Status: NÄSTAN KLAR! ⚡

Allt är implementerat. Följ dessa steg i ordning:

---

## 📋 CHECKLISTA

### ✅ STEG 1: KLART (Implementerat)

- [x] Error Boundaries skapade
- [x] Rate Limiting implementerat
- [x] GDPR API endpoint skapad
- [x] Performance indexes SQL skapad
- [x] GDPR DELETE policies SQL skapad
- [x] Build kompilerar (pågår...)

### ⏳ STEG 2: VÄNTAR PÅ DIG

#### A. Vänta på build (5 min)

```bash
# Build pågår just nu...
# När klar, kommer du se: "✓ Compiled successfully"
```

#### B. Commit alla ändringar (2 min)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
git add -A
git status  # Kolla vad som ändrats
git commit -m "🚀 LAUNCH READINESS: Error Boundaries + Rate Limiting + GDPR

✅ Implementerat:
- Error Boundaries (global, form, dashboard, modal)
- Rate Limiting i middleware (3-60 req/min beroende på endpoint)
- GDPR DELETE API (/api/gdpr/delete-account)
- Performance indexes SQL (ADD_PERFORMANCE_INDEXES.sql)
- GDPR policies SQL (ADD_GDPR_DELETE_POLICIES.sql)
- Sentry setup guide

📋 Nästa steg:
- Vänta på Supabase maintenance
- Kör SQL-scripts
- Installera Sentry
- LANSERA!"

git push origin main
```

#### C. Vänta på Supabase (okänd tid)

- Supabase har maintenance just nu
- Kolla: https://status.supabase.com/
- När uppe: Fortsätt till STEG 3

---

### 🗄️ STEG 3: KÖR SUPABASE SQL-SCRIPTS

#### A. Länka projektet (EN GÅNG)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase link
# Välj ditt projekt från listan
# Eller ange project-ref manuellt
```

#### B. Uppdatera schema (framåt alltid)

```bash
./update-schema.sh
# Detta skapar/uppdaterar supabase/schema.sql från deployed databas
```

#### C. Kör Performance Indexes (2 min)

```bash
# Alternativ 1: Via Supabase Dashboard
# 1. Öppna Supabase Dashboard → SQL Editor
# 2. Öppna ADD_PERFORMANCE_INDEXES.sql från din workspace
# 3. Kopiera allt innehåll
# 4. Klistra in i SQL Editor
# 5. Klicka "Run"
# 6. Förväntat: "Success. No rows returned"

# Alternativ 2: Via CLI (om du länkat projektet)
supabase db push
```

#### D. Kör GDPR Policies (2 min)

```bash
# I Supabase Dashboard → SQL Editor:
# 1. Öppna ADD_GDPR_DELETE_POLICIES.sql
# 2. Kopiera allt innehåll
# 3. Klistra in i SQL Editor
# 4. Klicka "Run"
# 5. Förväntat: Flera "CREATE POLICY" success messages
```

#### E. Verifiera (1 min)

```sql
-- Kör i SQL Editor för att verifiera:

-- 1. Kolla indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename;
-- Förväntat: ~25 rader

-- 2. Kolla GDPR function
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'gdpr_delete_user_data';
-- Förväntat: 1 rad med funktionen

-- 3. Kolla DELETE policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND cmd = 'DELETE';
-- Förväntat: 4-5 rader
```

---

### 📊 STEG 4: INSTALLERA SENTRY (30 min)

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031

# 1. Installera Sentry
npm install @sentry/nextjs

# 2. Kör wizard (följ instruktionerna)
npx @sentry/wizard@latest -i nextjs

# 3. Wizard frågar efter:
#    - Sentry DSN (hämta från sentry.io)
#    - Auth token (genereras automatiskt)
#    - Organization name
#    - Project name: "dogplanner"

# 4. Wizard skapar automatiskt:
#    - sentry.client.config.ts
#    - sentry.server.config.ts
#    - sentry.edge.config.ts
#    - Uppdaterar next.config.ts

# 5. Testa
npm run dev
# Gå till http://localhost:3000
# Klicka någonstans och testa att fel rapporteras till Sentry
```

#### Sentry Setup Checklist:

- [ ] Konto skapat på sentry.io
- [ ] Projekt "DogPlanner" skapat
- [ ] DSN kopierad
- [ ] Wizard körts framgångsrikt
- [ ] .env.local uppdaterad med NEXT_PUBLIC_SENTRY_DSN
- [ ] Test-fel skickat och synligt i Sentry Dashboard

---

### 🧪 STEG 5: TESTNING (1-2h)

#### A. Error Boundaries Test

```typescript
// Lägg till test-knapp i development (t.ex. i layout.tsx):
{process.env.NODE_ENV === 'development' && (
  <button
    onClick={() => { throw new Error("Test Error!"); }}
    className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
  >
    Test Error Boundary
  </button>
)}

// Förväntat:
// 1. Felmeddelande visas (inte vit skärm)
// 2. "Ladda om sidan" knapp fungerar
// 3. Fel syns i Sentry Dashboard
```

#### B. Rate Limiting Test

```bash
# Testa att spamma registrering
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}'
done

# Förväntat:
# - Första 3 requests: 200 OK
# - Request 4-10: 429 Too Many Requests
```

#### C. Funktionella Tester

- [ ] Registrera ny användare → Får org_id automatiskt
- [ ] Logga in → Dashboard laddas
- [ ] Skapa hund → Visas i "Mina hundar"
- [ ] Skapa bokning → Syns i bokningslistan
- [ ] Generera faktura → PDF skapas korrekt
- [ ] Testa GDPR delete → All data raderas

#### D. Performance Test

```bash
# Kolla att indexes hjälper
# I Supabase SQL Editor:
EXPLAIN ANALYZE
SELECT * FROM bookings WHERE org_id = '[din-org-id]' AND status = 'confirmed';

# Förväntat: "Index Scan" (inte "Seq Scan")
```

---

### 🚀 STEG 6: LANSERING!

#### Soft Launch (Beta)

```bash
# 1. Merge till main (redan gjort ovan)
# 2. Deploy till Vercel (automatiskt via GitHub)
# 3. Bjud in 3-5 testanvändare
# 4. Övervaka Sentry för fel
# 5. Samla feedback
```

#### Full Launch (Production)

- [ ] Alla tester passerade
- [ ] Ingen kritiska fel i Sentry
- [ ] Performance acceptabel
- [ ] GDPR-funktionalitet verifierad
- [ ] Backup-strategi på plats

---

## 🆘 TROUBLESHOOTING

### Build fel

```bash
# Rensa allt och bygg om
rm -rf .next node_modules/.cache
npm run build
```

### Supabase link problem

```bash
# Hitta project-ref:
# 1. Öppna Supabase Dashboard
# 2. Settings → General → Reference ID
# 3. Kopiera (t.ex: "abcdefghijklmnop")

# Länka manuellt:
supabase link --project-ref <din-ref>
```

### Sentry errors inte synliga

```bash
# Verifiera DSN:
echo $NEXT_PUBLIC_SENTRY_DSN

# Kolla Sentry config:
cat sentry.client.config.ts

# Test manuellt:
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(new Error("Manual test"));
```

### Rate limiting funkar inte

```bash
# Kolla middleware:
grep -n "checkRateLimit" middleware.ts

# Verifiera att middleware körs:
# Lägg till console.log i middleware och kolla browser console
```

---

## 📞 SUPPORT

**Dokumentation:**

- Error Boundaries: `components/ErrorBoundary.tsx`
- Rate Limiting: `middleware.ts`
- GDPR: `supabase/ADD_GDPR_DELETE_POLICIES.sql`
- Indexes: `supabase/ADD_PERFORMANCE_INDEXES.sql`
- Sentry: `SENTRY_SETUP.md`
- Launch Checklist: `LAUNCH_READINESS_2025-11-22.md`

**Logs att kolla:**

- Browser Console (för frontend errors)
- Sentry Dashboard (för alla errors)
- Supabase Logs (för databas-queries)
- Vercel Logs (för server-side errors)

---

**DU ÄR HÄR:** ⬇️

```
[x] Implementation
[ ] Build klar        ← VÄNTAR (pågår...)
[ ] Commit & Push
[ ] Supabase SQL
[ ] Sentry install
[ ] Testing
[ ] Launch 🚀
```

**NÄSTA STEG:** Vänta på att build blir klar, sedan commit & push! 💪
