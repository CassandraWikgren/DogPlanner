# HUNDDAGIS: Intresseanmälan vs Antagen Hund

## � STATUS: PROBLEM LÖST (2025-01-17)

### ✅ Vad som fixats

1. **EditDogModal uppdaterad** → Sätter automatiskt `waitlist=false` när hundar sparas
2. **SQL-script skapat** → `fix_waitlist_legacy_data.sql` fixar befintlig data
3. **Dokumentation uppdaterad** → Detta dokument förklarar systemet

### ⚡ Snabbguide för användning

**Lägg till ny hund:**

- Klicka "Lägg till hund" i hunddagis
- Fyll i formulär och spara
- ✅ Hunden får automatiskt `waitlist=false` (antagen)

**Redigera befintlig hund:**

- Klicka på hund i listan
- Gör ändringar och spara
- ✅ Om hunden hade `waitlist=true` → ändras till `waitlist=false`

**Filtrera hundar:**

- "Våra hundar" → Visar alla med `waitlist != true`
- "Väntelistan" → Visar alla med `waitlist == true`

---

## �🎯 VIKTIGT: Så fungerar systemet

### ✅ Rätt sätt att hantera hundar

Systemet använder **`waitlist`-fältet** i `dogs`-tabellen för att skilja på:

1. **Intresseanmälan** (på väntelista):
   - `waitlist = true`
   - Hunden syns ENDAST under "Väntelistan"
   - Visas INTE i "Våra hundar" eller "Tjänster"

2. **Antagen hund** (aktiv dagishund):
   - `waitlist = false` ELLER `null`
   - Hunden syns under "Våra hundar"
   - Om hunden har abonnemang → visas även under "Tjänster"

## 📋 Workflow: Från Intresse till Antagen

### Steg 1: Kunden skickar intresseanmälan

**Formulär:** `/app/ansokan/hunddagis/page.tsx`

Skapar:

```javascript
// dogs-tabellen
{
  waitlist: true,  // ← VIKTIG! Hunden är på väntelista
  subscription: null,
  startdate: null
}

// interest_applications-tabellen
{
  status: 'pending'
}
```

### Steg 2: Personal ser ansökan

**Sida:** `/app/applications/page.tsx` (eller liknande)

Personal ska kunna:

- ✅ Godkänna ansökan
- ❌ Avslå ansökan

### Steg 3: Godkännande → Antagen hund

När personal godkänner ska systemet uppdatera:

```javascript
// UPDATE dogs SET
await supabase
  .from("dogs")
  .update({
    waitlist: false, // ← TA BORT från väntelista
    startdate: "2025-11-19", // Sätt startdatum
    subscription: "Deltid 3", // Välj abonnemang
  })
  .eq("id", dogId);

// UPDATE interest_applications SET
await supabase
  .from("interest_applications")
  .update({ status: "approved" })
  .eq("id", applicationId);
```

## 🔍 Hur filtren fungerar

### "Våra hundar" (filterSubscription = "all")

```javascript
dog.waitlist !== true; // Visa alla ANTAGNA hundar
```

### "Tjänster" (filterSubscription = "services")

```javascript
dog.subscription && dog.waitlist !== true; // Har abonnemang OCH är antagen
```

### "Väntelistan" (filterSubscription = "vantelista")

```javascript
dog.waitlist === true; // Endast de på väntelista
```

## ⚠️ KRITISKT: Vad som KAN gå fel

### Problem 1: Hund hamnar på båda ställen

**Orsak:** `waitlist` är inte satt korrekt
**Lösning:** Vid godkännande MÅSTE `waitlist = false` sättas

### Problem 2: Antagen hund syns inte

**Orsak:** `waitlist = true` är fortfarande satt
**Lösning:** Kontrollera att UPDATE-query faktiskt körde

### Problem 3: Gammal data saknar waitlist

**Orsak:** Äldre hundar skapades innan waitlist-fältet fanns
**Lösning:** Kör SQL-fix:

```sql
-- Sätt waitlist = false för alla hundar som har startdate
UPDATE dogs
SET waitlist = false
WHERE startdate IS NOT NULL
  AND waitlist IS NULL;

-- Sätt waitlist = true för hundar utan startdate (troligen intresseanmälningar)
UPDATE dogs
SET waitlist = true
WHERE startdate IS NULL
  AND subscription IS NULL
  AND waitlist IS NULL;
```

## 📊 Så kollar du om det fungerar

### Test 1: Kolla en hunds status

```sql
SELECT name, waitlist, startdate, subscription
FROM dogs
WHERE name = 'Bella';
```

### Test 2: Lista alla hundar per kategori

```sql
-- Våra hundar (antagna)
SELECT name, waitlist FROM dogs WHERE waitlist IS NOT TRUE;

-- Väntelistan
SELECT name, waitlist FROM dogs WHERE waitlist = TRUE;
```

## 🔧 Vad som MÅSTE fixas i koden

### 1. Godkänna-knapp måste sätta waitlist = false

Hitta koden där ni godkänner ansökningar och lägg till:

```javascript
// FÖRE (fel):
await supabase
  .from("dogs")
  .update({
    startdate: selectedDate,
    subscription: selectedSubscription,
  })
  .eq("id", dogId);

// EFTER (rätt):
await supabase
  .from("dogs")
  .update({
    waitlist: false, // ← LÄGG TILL DENNA RAD!
    startdate: selectedDate,
    subscription: selectedSubscription,
  })
  .eq("id", dogId);
```

### 2. Manuell registrering måste sätta waitlist = false

När ni lägger till en hund manuellt (inte via formulär):

```javascript
await supabase.from("dogs").insert({
  name: "Bella",
  breed: "Golden Retriever",
  waitlist: false, // ← Redan antagen
  startdate: "2025-11-19",
  subscription: "Deltid 3",
});
```

## 📱 Var i koden ska det fixas?

**Filer att kolla:**

1. `/app/applications/page.tsx` - Godkänna intresseanmälan
2. `/app/hunddagis/page.tsx` - Lista hundarna (redan fixat!)
3. `/components/EditDogModal.tsx` - Redigera hund
4. Alla ställen där `dogs.insert()` eller `dogs.update()` används

## ✅ Checklista för korrekt implementation

- [ ] Vid godkännande av intresseanmälan → sätt `waitlist = false`
- [ ] Vid manuell registrering → sätt `waitlist = false`
- [ ] Vid intresseanmälan från formulär → sätt `waitlist = true`
- [ ] Testa att "Våra hundar" INTE visar väntelistade hundar
- [ ] Testa att "Väntelistan" ENDAST visar väntelistade hundar
- [ ] Kör SQL-fix för gammal data (se ovan)

## 🆘 Om något fortfarande är fel

1. Kolla i Supabase SQL Editor:

   ```sql
   SELECT name, waitlist, startdate, subscription, created_at
   FROM dogs
   WHERE org_id = 'DIN_ORG_ID'
   ORDER BY created_at DESC;
   ```

2. Leta efter hundar där:
   - `waitlist = true` OCH `startdate` finns → Dessa ska vara `false`
   - `waitlist = null` OCH `startdate` finns → Dessa ska vara `false`
   - `waitlist = false` OCH `startdate` saknas → Dessa ska vara `true`

## 💡 Sammanfattning (TL;DR)

**EN REGEL ATT KOMMA IHÅG:**

- `waitlist = true` → Intresseanmälan (väntelista)
- `waitlist = false` ELLER `null` → Antagen hund (våra hundar)

**VID GODKÄNNANDE:**
Glöm ALDRIG att sätta `waitlist = false`!
