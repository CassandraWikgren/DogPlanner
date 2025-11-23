# FRISÖR-FUNKTIONALITET: Implementation Guide

**Datum:** 2025-11-23  
**Status:** PÅBÖRJAD - Kritiska förbättringar identifierade

## ✅ VaD SOM ÄR FIXAT

### 1. Design-förbättringar (KLART)

- ✅ Kundtyp-rutorna (Befintlig/Walk-in) är nu kompakta och side-by-side
- ✅ Behandlings-rutorna har nu vit bakgrund med mörk text (istället för grå text på grön bakgrund)
- ✅ Bättre läsbarhet och mindre vertikalutrymme

## ⚠️ KRITISKA PROBLEM SOM BEHÖVER FIXAS

### Problem 1: Priser från Admin används inte ❌

**Symptom:**

- Admin fyller i priser under "Admin → Hundfrisör → Priser"
- De priserna syns INTE i bokningsflödet
- Bokningsflödet använder hårdkodade priser i `SERVICE_OPTIONS`

**Root Cause:**

- Tabellen `grooming_prices` finns INTE i databasen än
- Filen `app/frisor/ny-bokning/page.tsx` har hårdkodade priser (rad 63-117)
- Admin-prissidan `/app/admin/priser/page.tsx` försöker läsa från tabell `prices` som inte existerar

**Lösning (steg-för-steg):**

1. **Skapa databas-tabell:**

   ```sql
   -- Kör: supabase/migrations/create_grooming_prices.sql
   ```

   Detta skapar tabellen med stöd för:
   - Olika hundstorlekar (mini/small/medium/large/xlarge)
   - Olika pälstyper (short/medium/long/wire/curly)
   - Beräknad tid per behandling
   - Org-isolering med RLS

2. **Uppdatera Admin-prissidan:**
   - Ändra från generisk `prices` till specifik `grooming_prices`
   - Lägg till väljare för hundstorlek
   - Lägg till väljare för pälstyp
   - Lägg till fält för beräknad tid

3. **Uppdatera bokningsflödet:**
   - Ta bort hårdkodade `SERVICE_OPTIONS`
   - Hämta priser från `grooming_prices` baserat på org_id
   - Lägg till steg där man väljer hundstorlek (om hunden inte har det i profilen)
   - Visa rätt pris baserat på storlek + pälstyp
   - Autofyll duration_minutes i kalendern

### Problem 2: Journal-sidan fungerar inte korrekt ⚠️

**Symptom:**

- När man klickar "Visa Journal" från bokningsdetaljer händer inget/öppnas ingen sida

**Root Cause (behöver verifieras):**

- Sidan `/app/frisor/[dogId]/page.tsx` FINNS
- Men den kanske inte har tillräcklig data
- Eller så finns inte `grooming_journal` tabellen

**Verifieringssteg:**

1. Kolla om `grooming_journal` tabell finns i Supabase
2. Test-navigera till `/frisor/[NÅGOT_DOG_ID]` manuellt
3. Kolla console-errors i DevTools

**Lösning (om tabellen saknas):**

```sql
CREATE TABLE public.grooming_journal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES grooming_bookings(id) ON DELETE SET NULL,

    -- Behandlingsinfo
    appointment_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    service_name TEXT,

    -- Detaljer
    clip_length TEXT,
    shampoo_type TEXT,
    special_treatments TEXT,
    notes TEXT,

    -- Pris & tid
    final_price NUMERIC(10,2),
    duration_minutes INTEGER,

    -- Bilder
    before_photos TEXT[], -- Array av URLs
    after_photos TEXT[],  -- Array av URLs

    -- Nästa besök
    next_appointment_recommended DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grooming_journal_dog_id ON grooming_journal(dog_id);
CREATE INDEX idx_grooming_journal_org_id ON grooming_journal(org_id);

-- RLS
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view journal in their org"
ON grooming_journal FOR SELECT
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users manage journal in their org"
ON grooming_journal FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

### Problem 3: Prisvarianter för storlek/pälstyp saknas ❌

**Symptom:**

- Man kan inte ange olika priser för olika hundstorlekar
- Man kan inte ange olika priser för olika pälstyper
- Man kan inte ange beräknad tid per behandling

**Impact:**

- Företag måste manuellt justera varje pris
- Ingen automatisk kalenderplanering baserat på behandlingstid
- Svårt att maximera bokningseffektivitet

**Lösning:**

#### A) Uppdatera Admin Priser-sidan

Fil: `/app/admin/priser/page.tsx`

Lägg till dropdown för:

```tsx
// Hundstorlekar
const DOG_SIZES = [
  { value: null, label: "Alla storlekar" },
  { value: "mini", label: "Mini (0-5 kg)" },
  { value: "small", label: "Liten (5-10 kg)" },
  { value: "medium", label: "Medel (10-20 kg)" },
  { value: "large", label: "Stor (20-40 kg)" },
  { value: "xlarge", label: "XL (40+ kg)" },
];

// Pälstyper
const COAT_TYPES = [
  { value: null, label: "Alla pälstyper" },
  { value: "short", label: "Korthårig" },
  { value: "medium", label: "Mellanlång" },
  { value: "long", label: "Långhårig" },
  { value: "wire", label: "Strävhårig" },
  { value: "curly", label: "Lockig" },
];
```

#### B) Uppdatera bokningsflödet

Fil: `/app/frisor/ny-bokning/page.tsx`

1. Hämta priser från database:

```tsx
const [groomingPrices, setGroomingPrices] = useState([]);

useEffect(() => {
  if (currentOrgId) {
    loadGroomingPrices();
  }
}, [currentOrgId]);

const loadGroomingPrices = async () => {
  const { data, error } = await supabase
    .from("grooming_prices")
    .select("*")
    .eq("org_id", currentOrgId)
    .eq("active", true);

  if (!error && data) {
    setGroomingPrices(data);
  }
};
```

2. Lägg till steg för att välja hundstorlek (om inte redan finns):

```tsx
{
  selectedDog && !selectedDog.size && (
    <Card>
      <CardHeader>
        <CardTitle>Välj hundstorlek</CardTitle>
      </CardHeader>
      <CardContent>
        {DOG_SIZES.filter((s) => s.value !== null).map((size) => (
          <button onClick={() => setDogSize(size.value)}>{size.label}</button>
        ))}
      </CardContent>
    </Card>
  );
}
```

3. Filtrera tjänster baserat på storlek:

```tsx
const availableServices = groomingPrices.filter((price) => {
  const dogSize = selectedDog?.size || tempDogSize;
  return !price.dog_size || price.dog_size === dogSize;
});
```

## 📋 IMPLEMENTATION CHECKLIST

### Fas 1: Databas (30 min)

- [ ] Kör `create_grooming_prices.sql` i Supabase
- [ ] Verifiera att tabellen skapades
- [ ] Kör testquery: `SELECT * FROM grooming_prices LIMIT 1;`
- [ ] Lägg till några testpriser manuellt

### Fas 2: Admin-prissidan (1-2 tim)

- [ ] Uppdatera från `prices` till `grooming_prices`
- [ ] Lägg till dropdown för hundstorlek
- [ ] Lägg till dropdown för pälstyp
- [ ] Lägg till fält för duration_minutes
- [ ] Uppdatera INSERT/UPDATE queries
- [ ] Testa att lägga till/redigera priser

### Fas 3: Bokningsflödet (2-3 tim)

- [ ] Ta bort hårdkodade SERVICE_OPTIONS
- [ ] Lägg till `loadGroomingPrices()` funktion
- [ ] Lägg till state för hundstorlek/pälstyp
- [ ] Lägg till UI för att välja storlek (om inte finns i profil)
- [ ] Filtrera tjänster baserat på valda kriterier
- [ ] Visa korrekt pris och tid
- [ ] Spara dog_size/coat_type i bookingen

### Fas 4: Journal-fix (30 min - 1 tim)

- [ ] Verifiera att `grooming_journal` finns
- [ ] Skapa tabell om den saknas
- [ ] Test-navigera till journal-sidan
- [ ] Fixa eventuella fel
- [ ] Verifiera att data sparas korrekt

### Fas 5: Testing (1 tim)

- [ ] Skapa nya priser via admin
- [ ] Verifiera att de syns i bokningsflödet
- [ ] Boka en tid som kund
- [ ] Verifiera att rätt pris används
- [ ] Öppna journal och kolla att allt sparas
- [ ] Testa med olika hundstorlekar

## 🎯 PRIORITERING

**HÖGST:**

1. Skapa `grooming_prices` tabell (5 min)
2. Fixa admin-prissidan att läsa från rätt tabell (30 min)
3. Uppdatera bokningsflödet att hämta från DB (1 tim)

**MEDEL:** 4. Lägg till stöd för hundstorlek/pälstyp (1-2 tim) 5. Fixa journal-sidan (30 min)

**LÅG:** 6. Lägg till default-priser vid org-skapande 7. Lägg till bulk-import av priser 8. Lägg till prishistorik

## 📝 TEKNISKA DETALJER

### Databasstruktur

```
grooming_prices
├── id (uuid, primary key)
├── org_id (uuid, foreign key)
├── service_name (text) - "Badning", "Klippning" etc
├── service_type (text) - bath, full_groom, nail_trim etc
├── description (text)
├── dog_size (text, nullable) - mini/small/medium/large/xlarge
├── coat_type (text, nullable) - short/medium/long/wire/curly
├── price (numeric)
├── duration_minutes (integer)
├── active (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### API Endpoints (om behövs)

```typescript
// GET /api/grooming/prices?org_id=XXX
// POST /api/grooming/prices
// PUT /api/grooming/prices/:id
// DELETE /api/grooming/prices/:id
```

### Frontend State Management

```typescript
interface GroomingPrice {
  id: string;
  org_id: string;
  service_name: string;
  service_type: string;
  description?: string;
  dog_size?: "mini" | "small" | "medium" | "large" | "xlarge";
  coat_type?: "short" | "medium" | "long" | "wire" | "curly";
  price: number;
  duration_minutes: number;
  active: boolean;
}
```

## 🚀 NÄSTA STEG

1. **NU:** Kör `create_grooming_prices.sql` för att skapa tabellen
2. **Sedan:** Uppdatera admin-prissidan att använda nya tabellen
3. **Slutligen:** Uppdatera bokningsflödet att hämta från databasen

**Estimated Total Time:** 5-8 timmar för komplett implementation

---

**Frågor att ställa användaren:**

- Vilka hundstorlekar vill ni ha som standard?
- Vilka pälstyper är relevanta för er verksamhet?
- Ska default-priser sättas vid org-skapande, eller manuellt?
- Vill ni ha prishistorik (versionering av priser)?
