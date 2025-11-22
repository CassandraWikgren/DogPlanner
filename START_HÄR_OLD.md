# 🎯 ÅTGÄRDSPLAN - STARTGUIDE

**Skapad:** 2025-11-22  
**Status:** Redo för implementering  
**Prioritet:** KRITISK

---

## 🚨 GÖR DETTA NU (KRITISKT)

### STEG 1: Kör SQL-fixen i Supabase (5 minuter)

1. Öppna Supabase Dashboard → SQL Editor
2. Öppna filen `FIX_01_ADD_HEALING_FUNCTION.sql`
3. Kopiera hela innehållet
4. Klistra in i SQL Editor
5. Klicka "Run"
6. Verifiera att du får meddelandet "Success"

**Varför:** Funktionen `heal_user_missing_org()` anropas från AuthContext men finns inte i databasen. Detta är Layer 3 i org_id assignment systemet och MÅSTE finnas för att användare ska kunna registrera sig korrekt.

**Verifiering:**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'heal_user_missing_org';
-- Ska returnera 1 rad
```

---

## 📊 DÄREFTER: Kör Health Checks (10 minuter)

### STEG 2: Verifiera databashälsa

1. Öppna `HEALTH_CHECK.sql`
2. Kör alla queries i Supabase SQL Editor
3. Granska resultaten från varje sektion
4. Dokumentera eventuella problem

**Vad att kolla efter:**

- ✅ `users_without_org` ska vara 0
- ✅ `orgs_without_admin` ska vara 0
- ✅ `heal_function_exists` ska säga "YES ✅"
- ✅ Alla triggers ska vara aktiva
- ⚠️ Om något är fel, se SYSTEM_AUDIT_KOMPLETT_2025-11-22.md för lösningar

---

## 🔧 VECKA 1: Säkerhet och stabilitet

### STEG 3: Implementera rate limiting (1-2 timmar)

**Varför:** Skydda mot brute force och DoS-attacker

**Vad:** Se `API_SECURITY_AUDIT.md` → Sektion "Implementera Rate Limiting"

**Prioriterade endpoints:**

- `/api/onboarding/*` - Max 3/minut
- `/api/gdpr/delete-account` - Max 1/timme
- `/api/bookings/approve` - Max 10/minut
- `/api/bookings/cancel` - Max 5/minut

**Kod finns i:** `middleware-rate-limit.ts` (behöver uppdateras)

---

### STEG 4: Granska RLS policies (1 timme)

1. Kör `RLS_POLICY_AUDIT.sql`
2. Identifiera tabeller med >5 policies
3. Hitta duplicerade policies
4. Planera cleanup (GÖR INTE ändringar än - bara dokumentera)

**Fokusera på:**

- `extra_service` (11 policies!)
- `dog_journal` (många policies)
- `subscriptions` (många policies)

---

## 📅 VECKA 2: Förbättringar

### STEG 5: Input validation med Zod

Skapa `lib/validation/api-schemas.ts` enligt exempel i `API_SECURITY_AUDIT.md`

### STEG 6: Centralisera auth

Skapa `lib/api/auth.ts` med `requireAuth()` och `requireAdmin()` helpers

### STEG 7: Lägg till security headers

Uppdatera `next.config.ts` enligt `API_SECURITY_AUDIT.md` → Sektion "CORS och Security Headers"

---

## 📚 DOKUMENTATION (Referens)

### Skapade filer i denna genomgång:

1. **`SYSTEM_AUDIT_KOMPLETT_2025-11-22.md`** 📊
   - Översikt över hela systemet
   - Identifierade problem och prioritering
   - Health check queries
   - Långsiktig förbättringsplan

2. **`FIX_01_ADD_HEALING_FUNCTION.sql`** 🔧
   - KRITISK fix för org_id assignment Layer 3
   - MÅSTE köras i Supabase NU

3. **`HEALTH_CHECK.sql`** 🏥
   - 10 queries för att övervaka systemhälsa
   - Kör dagligen under utveckling
   - Kör veckovis i produktion

4. **`RLS_POLICY_AUDIT.sql`** 🔒
   - Identifiera duplicerade RLS policies
   - Säkerhetsanalys
   - Cleanup-rekommendationer

5. **`API_SECURITY_AUDIT.md`** 🛡️
   - Säkerhetsanalys av alla API routes
   - Rate limiting implementation
   - Input validation patterns
   - Best practices

---

## ✅ CHECKLISTA FÖR LANSERING

Innan deploy till produktion:

- [ ] `FIX_01_ADD_HEALING_FUNCTION.sql` körd i Supabase
- [ ] `HEALTH_CHECK.sql` visar inga kritiska problem
- [ ] Rate limiting implementerat på kritiska endpoints
- [ ] Security headers tillagda i next.config.ts
- [ ] Alla env-variabler satta i Vercel
- [ ] `npm run build` körs utan fel lokalt
- [ ] Registreringsflödet testat end-to-end
- [ ] Sentry error tracking verifierad

---

## 🎯 FRAMGÅNG MÄTS PÅ

### Tekniska mål:

- ✅ 0 användare utan org_id
- ✅ 0 organisationer utan admin
- ✅ Alla triggers aktiva
- ✅ <100ms response time på API endpoints
- ✅ 0 kritiska Sentry-fel per dag

### Användarupplevelse:

- ✅ Ingen användare ser "Ingen organisation tilldelad"
- ✅ Registrering fungerar 100% av tiden
- ✅ Inga "evighets-spinners"
- ✅ Fakturering fungerar automatiskt

---

## 🆘 PROBLEMLÖSNING

### Problem: "Ingen organisation tilldelad"

**Lösning:**

1. Kör `HEALTH_CHECK.sql` → sektion 1 för att hitta användaren
2. Anteckna `user_id`
3. Kör: `SELECT heal_user_missing_org('[user_id]'::uuid);`
4. Verifiera att det returnerar `success: true`

### Problem: Faktura skapas inte vid checkout

**Lösning:**

1. Kör `HEALTH_CHECK.sql` → sektion 4 för att verifiera triggers
2. Kontrollera att `trg_create_invoice_on_checkout` är aktiv
3. Se `SYSTEM_AUDIT_KOMPLETT_2025-11-22.md` för troubleshooting

### Problem: RLS policy fel

**Lösning:**

1. Kör `RLS_POLICY_AUDIT.sql`
2. Identifiera konfliktande policies
3. Se dokumentation i `supabase/detta är_min_supabase_just_nu.sql`

---

## 📞 SUPPORT

- **Databas:** Supabase Dashboard → SQL Editor
- **Hosting:** Vercel Dashboard
- **Error Tracking:** Sentry Dashboard
- **Dokumentation:** Denna mapp + `.github/copilot-instructions.md`

---

## 🎉 SLUTORD

Systemet är i grunden **robust och välbyggt** med:

- 3-lagers org_id assignment system
- Automatisk fakturering
- Omfattande RLS policies
- TypeScript type safety

De identifierade problemen är **specifika och lösliga**:

1. En saknad funktion (fix finns klar)
2. Några duplicerade policies (inventering klar)
3. Rate limiting saknas (implementation guide klar)

**Med dessa fixar är systemet produktionsklart! 🚀**

---

**Nästa steg:** Kör `FIX_01_ADD_HEALING_FUNCTION.sql` NU!
