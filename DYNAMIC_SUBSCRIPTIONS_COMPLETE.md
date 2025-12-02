# ✅ Dynamic Daycare Subscriptions - KOMPLETT

**Datum:** 2 december 2025  
**Status:** Klart för testning  
**Commit:** `2d14ccc`

## 🎯 Vad har ändrats?

### Före (Hårdkodat):

```typescript
// Intresseanmälan
subscription_type: "Heltid" | "Deltid 2" | "Deltid 3" | "Dagshund"

// EditDogModal
<option value="Heltid">Heltid</option>
<option value="Deltid 3">Deltid 3</option>
<option value="Deltid 2">Deltid 2</option>
```

### Efter (Dynamiskt):

```typescript
// Intresseanmälan & EditDogModal
// Hämtar från daycare_pricing där pris > 0:
subscription_1day → "1 dag/vecka"
subscription_2days → "2 dagar/vecka"
subscription_3days → "3 dagar/vecka"
subscription_4days → "4 dagar/vecka"
subscription_5days → "5 dagar/vecka"
single_day_price → "Dagshund"
```

## 📝 Modifierade filer

### 1. **app/ansokan/hunddagis/page.tsx** (Intresseanmälan)

- ✅ Hämtar abonnemangsalternativ från `daycare_pricing`
- ✅ Visar pris med varje alternativ
- ✅ Dynamisk validering baserat på `daysPerWeek`
- ✅ Endast abonnemang med pris > 0 visas

**Ny funktionalitet:**

```typescript
useEffect(() => {
  // Hämtar från daycare_pricing baserat på org_id
  // Genererar alternativ: [{value: "2 dagar/vecka", label: "2 dagar/vecka", desc: "2500 kr/månad", daysPerWeek: 2}]
}, [orgId]);
```

### 2. **components/EditDogModal.tsx**

- ✅ Hämtar abonnemangsalternativ från `daycare_pricing`
- ✅ Dropdown fylls dynamiskt
- ✅ Validering uppdaterad till dynamiska värden

### 3. **components/HundrumView.tsx**

- ✅ Uppdaterad typ-kommentar för `subscription`

### 4. **supabase/migrations/20251202140000_migrate_subscription_values.sql** (NY FIL)

- ✅ Konverterar befintlig data till nya format
- ✅ Uppdaterar både `dogs` och `interest_applications` tabeller

## 🗄️ Databas-migrering

### VIKTIGT: Kör denna SQL i Supabase SQL Editor

```sql
-- Kopiera innehållet från:
supabase/migrations/20251202140000_migrate_subscription_values.sql
```

**Vad gör den:**

1. `Heltid` → `5 dagar/vecka` (i dogs & interest_applications)
2. `Deltid 3` → `3 dagar/vecka`
3. `Deltid 2` → `2 dagar/vecka`
4. `Dagshund` → behåller samma namn

**Output:**

```
✅ Subscription-värden uppdaterade:
   - Dogs: X rader med nya värden
   - Interest applications: Y rader med nya värden
```

## 🧪 Test-checklista

### Innan migrering:

1. ⬜ Backup av databas (om du vill vara försiktig)
2. ⬜ Notera antal hundar med subscription:
   ```sql
   SELECT subscription, COUNT(*) FROM dogs GROUP BY subscription;
   ```

### Efter migrering:

3. ⬜ Verifiera att gamla värden är borta:

   ```sql
   SELECT COUNT(*) FROM dogs WHERE subscription IN ('Heltid', 'Deltid 2', 'Deltid 3');
   -- Ska returnera 0
   ```

4. ⬜ Verifiera nya värden:
   ```sql
   SELECT subscription, COUNT(*) FROM dogs
   WHERE subscription IS NOT NULL
   GROUP BY subscription;
   -- Ska visa: "2 dagar/vecka", "3 dagar/vecka", "5 dagar/vecka", "Dagshund"
   ```

### Frontend-testning:

5. ⬜ Gå till **/admin/priser/dagis**
   - Sätt pris på abonnemang du vill erbjuda (t.ex. 2, 3, 5 dagar)
   - Lämna 1-dag och 4-dagar tomma (0 kr)

6. ⬜ Gå till **/ansokan/hunddagis**
   - Välj organisation
   - Kontrollera att endast abonnemang med pris > 0 visas
   - Verifiera att priset visas korrekt

7. ⬜ Gå till **/hunddagis**
   - Redigera befintlig hund (EditDogModal)
   - Kontrollera att subscription-dropdown visar rätt alternativ
   - Spara och verifiera att värdet behålls

8. ⬜ Testa intresseanmälan från början till slut
   - Skicka in ny ansökan med t.ex. "3 dagar/vecka"
   - Godkänn ansökan
   - Verifiera att hunden får rätt subscription

## 💡 KISS-principen i praktiken

**Före:** Krävde checkboxar + enabled_subscriptions array  
**Efter:** Pris = 0 → abonnemang dolt (helt automatiskt!)

**Exempel:**

```
Organisation A (erbjuder 2, 3, 5 dagar):
- subscription_1day: 0 kr (ej visat)
- subscription_2days: 2000 kr (visas)
- subscription_3days: 2800 kr (visas)
- subscription_4days: 0 kr (ej visat)
- subscription_5days: 3500 kr (visas)
```

## 🔄 Backwards Compatibility

**Gamla värden** (från före migration):

- Automatiskt konverterade via SQL-migrering
- Inga breaking changes

**Nya värden** (från efter migration):

- `"1 dag/vecka"` → 1 dag/vecka
- `"2 dagar/vecka"` → 2 dagar/vecka
- `"3 dagar/vecka"` → 3 dagar/vecka
- `"4 dagar/vecka"` → 4 dagar/vecka
- `"5 dagar/vecka"` → 5 dagar/vecka
- `"Dagshund"` → Dagshund (oförändrat)

## 📊 Teknisk översikt

### Dataflöde:

```
daycare_pricing (organisationens prissättning)
    ↓
subscription_1day, subscription_2days, etc.
    ↓
Filtrering (pris > 0)
    ↓
Dynamiska alternativ i UI
    ↓
Validering baserat på daysPerWeek
    ↓
Spara som "X dagar/vecka" i databas
```

### Felhantering:

- Om `daycare_pricing` saknas → visa bara "Dagshund"
- Om inga priser finns → visa default-alternativ
- Gammal data → automatiskt migrerad vid SQL-körning

## 🚀 Nästa steg

1. **Kör migrering** (kopiera SQL från migration-filen)
2. **Testa checklistan ovan**
3. **Rapportera eventuella buggar**
4. **Stäng issue om allt fungerar!**

---

**Frågor?** Läs `START_HÄR.md` för övergripande systemförståelse.
