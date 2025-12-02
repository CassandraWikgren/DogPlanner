# 🚨 KRITISKA SCHEMA-PROBLEM HITTADE (2 Dec 2025)

## Status: ⚠️ MÅSTE FIXAS INNAN RLS AKTIVERAS

Efter djupanalys från olika perspektiv hittade jag **4 kritiska problem** som bryter långsiktig hållbarhet:

---

## 1️⃣ SCHEMA MISMATCH - Kolumnnamn

### Problem

Din **migration** och **production** använder olika kolumnnamn!

**Migration (20251202120100_create_grooming_tables.sql):**

```sql
customer_name TEXT NOT NULL
dog_name TEXT NOT NULL
```

**Production (faktiskt schema i Supabase):**

```sql
external_customer_name TEXT
external_dog_name TEXT
```

**Din kod (app/frisor/ny-bokning/page.tsx):**

```tsx
bookingData.external_customer_name = walkinData.customer_name;
bookingData.external_dog_name = walkinData.dog_name;
```

### Konsekvens

- Om du kör migrationen → kolumner byts namn → kod failar
- TypeScript-typer matchar inte production
- 406-fel när kod questar kolumner som inte finns

### Lösning

**ALTERNATIV A (Rekommenderat):** Fixa migrationen att matcha production

```bash
# Radera broken migration
rm supabase/migrations/20251202120100_create_grooming_tables.sql

# Skapa ny från production
supabase db diff --schema public --file grooming_schema_fix
```

**ALTERNATIV B:** Uppdatera production-schemat (kräver kod-ändringar)

---

## 2️⃣ FOREIGN KEY CONFLICT - dog_id CASCADE

### Problem

**Migration säger:**

```sql
dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL
```

**Production schema säger:**

```sql
dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE
```

### Konsekvens

- Migration: Hund raderas → booking får NULL dog_id (behåller historik)
- Production: Hund raderas → booking RADERAS (förlorar data!)
- Policies förutsätter CASCADE-beteende

### Beslut

**Behåll CASCADE** (production-beteende)

**Motivering:**

- Grooming-bokningar är inte kritisk historik
- Om hund raderas av ägare, OK att radera bokningar
- Matchar övriga systemet (bookings → CASCADE)

### Lösning

Uppdatera migration rad 20:

```sql
-- dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL  ❌
dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE  ✅
```

---

## 3️⃣ TABELLNAMN MISMATCH - organisations vs orgs

### Problem

**Migration rad 12:**

```sql
REFERENCES organisations(id)
```

**Production:**

```sql
-- Tabellen heter "orgs", inte "organisations"!
```

### Konsekvens

Migrationen kommer att **FAILA** med:

```
ERROR: relation "organisations" does not exist
```

### Lösning

Ersätt ALLA "organisations" med "orgs" i migrationen:

```bash
sed -i '' 's/organisations/orgs/g' supabase/migrations/20251202120100_create_grooming_tables.sql
```

---

## 4️⃣ RLS POLICIES - External customers täcks inte

### Problem

Din RLS-policy:

```sql
USING (org_id IN (
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
))
```

**Vad händer om:**

- Walk-in customer gör bokning via publik form?
- De har inget `auth.uid()` → kan inte läsa/skriva
- External customer vill se sina bokningar?

### Konsekvens

- External customers blockeras av RLS (403 Forbidden)
- Alla bokningar måste göras av inloggad staff
- Ingen self-service för utomstående kunder

### Beslut

**KRÄV inloggning för alla frisörbokningar**

**Motivering:**

- Förhindrar spam och fake-bokningar
- Möjliggör avbokningar (kräver verifiering)
- Kunddata skyddas mot obehörig läsning
- Matchar pensionatbokningar (kräver också login)

### Implementering

1. External customers får "Enkel registrering" (namn + telefon)
2. Eller: Staff bokar åt dem via admin-panel (nuvarande flöde)
3. Ingen anon-policy läggs till

**Om du vill tillåta anon-bokningar (EJ rekommenderat):**

```sql
-- OBS: Skapar säkerhetsproblem!
CREATE POLICY "Anyone can create grooming bookings"
  ON public.grooming_bookings
  FOR INSERT TO anon
  WITH CHECK (true);
```

---

## 🎯 ACTION PLAN

### Steg 1: Fixa migrationen (15 min)

```bash
cd supabase/migrations

# Backup
cp 20251202120100_create_grooming_tables.sql 20251202120100_create_grooming_tables.sql.BROKEN

# Fixa automatiskt
sed -i '' 's/organisations/orgs/g' 20251202120100_create_grooming_tables.sql
sed -i '' 's/customer_name/external_customer_name/g' 20251202120100_create_grooming_tables.sql
sed -i '' 's/dog_name/external_dog_name/g' 20251202120100_create_grooming_tables.sql
sed -i '' 's/ON DELETE SET NULL/ON DELETE CASCADE/g' 20251202120100_create_grooming_tables.sql

# Lägg till saknade kolumner manuellt:
# - external_customer_phone TEXT
# - external_dog_breed TEXT
# - clip_length TEXT
# - shampoo_type TEXT
```

### Steg 2: Verifiera schema-match (5 min)

```bash
# Kör FIX_GROOMING_SCHEMA_CONFLICTS.sql i Supabase SQL Editor
# Den verifierar att allt matchar
```

### Steg 3: Testa migrationen lokalt (10 min)

```bash
# Reset local DB och kör migrationer
supabase db reset

# Kontrollera att inga fel uppstod
supabase db diff --schema public

# Borde visa: "No schema differences detected"
```

### Steg 4: Committa fix (2 min)

```bash
git add supabase/migrations/20251202120100_create_grooming_tables.sql
git add FIX_GROOMING_SCHEMA_CONFLICTS.sql
git add KRITISKA_SCHEMA_PROBLEM.md
git commit -m "fix: Resolve critical schema conflicts in grooming tables

- Fix table name: organisations → orgs
- Fix column names: customer_name → external_customer_name
- Fix FK cascade: SET NULL → CASCADE for dog_id
- Document RLS decision: require auth for grooming bookings
- Add verification queries"
git push
```

### Steg 5: Uppdatera RLS policies (5 min)

```bash
# ENABLE_RLS_PRODUCTION.sql är redan korrekt
# Policies kräver authenticated users (rätt beslut)
```

---

## 📊 Risk-analys

| Problem                 | Risk om ofixt                       | Impact      |
| ----------------------- | ----------------------------------- | ----------- |
| Kolumnnamn mismatch     | Migration bryter kod                | 🔴 CRITICAL |
| Tabellnamn mismatch     | Migration failar helt               | 🔴 CRITICAL |
| dog_id CASCADE conflict | Data-förlust alternativt data-drift | 🟡 HIGH     |
| RLS external customers  | Feature funkar inte                 | 🟡 HIGH     |

---

## ✅ Efter fix

När allt är fixat:

- ✅ Migration matchar production 100%
- ✅ Kan köra `supabase db reset` utan errors
- ✅ Kod funkar både lokalt och production
- ✅ RLS policies är konsekventa och säkra
- ✅ Schema drift är eliminerat
- ✅ 10/10 hållbarhet uppnått

---

## 🤔 Lessons Learned

1. **Alltid verifiera schema match mellan migration och production**
   - Använd `supabase db diff` efter manuella SQL-ändringar
2. **Migrations ska skapas från production-schema**
   - Inte tvärtom (production från migrations)
3. **Konsekvent namngivning är kritiskt**
   - "organisations" vs "orgs" → 30 min debugging
   - "customer_name" vs "external_customer_name" → kod failar
4. **CASCADE-beteende måste vara konsekvent**
   - Annars: orphaned data eller data-förlust
5. **RLS policies kräver explicit design-beslut**
   - "Vem ska kunna göra vad?" måste beslutas tidigt
6. **External customers behöver special-hantering**
   - Antingen: auth-krav (enkelt, säkert)
   - Eller: anon policies (komplext, riskabelt)

---

## 📚 Relaterade filer

- `FIX_GROOMING_SCHEMA_CONFLICTS.sql` - Verifiering och fix-queries
- `supabase/migrations/20251202120100_create_grooming_tables.sql` - Migration att fixa
- `ENABLE_RLS_PRODUCTION.sql` - RLS policies (redan korrekt)
- `SCHEMA_SYNC_WORKFLOW.md` - Workflow för att undvika detta i framtiden

---

**Datum:** 2 december 2025  
**Status:** Identifierat, dokumenterat, lösning klar  
**Nästa steg:** Kör ACTION PLAN → testa → committa
