# Refaktoreringsplan: Pensionat Nybokning

## Nuvarande Problem

- ❌ Ägare/hund-fält i början (men inte används ännu)
- ❌ "Välj kundtyp" i mitten av formuläret
- ❌ AssistedRegistrationModal frågar efter samma uppgifter igen
- ❌ Förvirrande: när ska jag använda vilka fält?

## Ny Struktur

```
┌─────────────────────────────────────────────────┐
│ STEG 1: Välj kundtyp                            │
│ ┌─────────────┐  ┌─────────────┐               │
│ │ Befintlig   │  │ 🆕 Ny kund  │               │
│ │ kund        │  │             │               │
│ └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    [Dropdown]          [Modal öppnas]
    Välj hund           Assisterad reg.
         │                    │
         │                    │ (Success)
         │                    │
         ▼                    ▼
    Auto-fyller         Laddar om → väljer ny hund

┌─────────────────────────────────────────────────┐
│ VALD HUND & ÄGARE (Readonly info-kort)         │
│ ┌───────────────────────────────────────────┐  │
│ │ 🐕 Bella (Beagle, 43 cm)                  │  │
│ │ 👤 Malin Olsson                           │  │
│ │ 📞 070-123 45 67                          │  │
│ │                                            │  │
│ │ [Lägg till hund till denna kund]          │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEG 2: Bokningsdetaljer                        │
│ • Startdatum + tid                              │
│ • Slutdatum + tid                               │
│ • Rum (frivilligt)                              │
│ • Tilläggstjänster                              │
│ • Rabatt                                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEG 3: Anteckningar                            │
│ • Medtagna tillhörigheter                       │
│ • Säng/rumstilldelning                          │
│ • Journalanteckningar                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Beräkna pris] [Spara bokning]                  │
└─────────────────────────────────────────────────┘
```

## Ändringar i koden

### State som tas bort

```typescript
// ❌ TA BORT - inte längre behövs
const [ownerData, setOwnerData] = useState({...});
const [contact2Data, setContact2Data] = useState({...});
const [dogData, setDogData] = useState({...});
const [healthData, setHealthData] = useState({...});
```

### State som behålls

```typescript
// ✅ BEHÅLL
const [selectedDog, setSelectedDog] = useState("");
const [showAssistedRegistration, setShowAssistedRegistration] = useState(false);
const [showNewDogModal, setShowNewDogModal] = useState(false);
// ... booking-relaterad state
```

### Ny state

```typescript
// ✅ LÄGG TILL
const [customerType, setCustomerType] = useState<"existing" | "new" | null>(
  null
);
```

### Komponenter

#### 1. CustomerTypeSelector (toppen)

```tsx
{
  !selectedDog && (
    <div className="grid grid-cols-2 gap-4">
      <button onClick={() => setCustomerType("existing")}>
        Befintlig kund
      </button>
      <button onClick={() => setShowAssistedRegistration(true)}>
        🆕 Ny kund
      </button>
    </div>
  );
}
```

#### 2. DogSelector (visas om customerType === 'existing')

```tsx
{customerType === 'existing' && !selectedDog && (
  <select value={selectedDog} onChange={handleDogSelect}>
    <option>Välj hund...</option>
    {dogs.map(...)}
  </select>
)}
```

#### 3. SelectedDogInfo (visas när selectedDog är satt)

```tsx
{
  selectedDog && selectedDogData && (
    <div className="bg-green-50 p-6 rounded-lg">
      <h3>Vald hund & ägare</h3>
      <p>
        🐕 {selectedDogData.name} ({selectedDogData.breed})
      </p>
      <p>👤 {selectedDogData.owners?.full_name}</p>
      <button onClick={() => setShowNewDogModal(true)}>
        Lägg till hund till denna kund
      </button>
      <button onClick={() => setSelectedDog("")}>Byt hund</button>
    </div>
  );
}
```

#### 4. BookingForm (endast när selectedDog finns)

```tsx
{
  selectedDog && (
    <form onSubmit={handleSubmit}>
      {/* Datum, tid, rum, tjänster, anteckningar */}
    </form>
  );
}
```

### AssistedRegistrationModal integration

```tsx
<AssistedRegistrationModal
  isOpen={showAssistedRegistration}
  onClose={() => setShowAssistedRegistration(false)}
  onSuccess={async (ownerId: string) => {
    // 1. Ladda om hundar
    await loadInitialData();

    // 2. Hitta hundar för denna ägare
    const ownerDogs = dogs.filter((d) => d.owner_id === ownerId);

    // 3. Auto-välj första hunden
    if (ownerDogs.length > 0) {
      setSelectedDog(ownerDogs[0].id);
    }

    // 4. Stäng modal
    setShowAssistedRegistration(false);

    alert("✅ Kund registrerad! Fortsätt med bokningen nedan.");
  }}
  orgId={currentOrgId}
/>
```

## Fördelar med ny struktur

1. ✅ **Ingen dubbelinmatning** - Assisterad registrering hanterar ALLT
2. ✅ **Tydligt flöde** - Val först, sedan bokning
3. ✅ **Readonly info** - Inga förvirrande tomma fält
4. ✅ **Modulärt** - Komponenter kan återanvändas
5. ✅ **Långsiktigt hållbart** - Lätt att underhålla och utöka
6. ✅ **Användartest OK** - Logiskt för användaren

## Bakåtkompatibilitet

- ✅ Alla databasanrop samma
- ✅ Booking-logik oförändrad
- ✅ AssistedRegistrationModal behöver inga ändringar
- ✅ loadInitialData() fungerar som förut

## Testplan

1. **Befintlig kund:** Välj från dropdown → fortsätt bokning
2. **Ny kund (email):** Modal → skicka email → (simulera success) → fortsätt
3. **Ny kund (blankett):** Modal → ladda upp → success → fortsätt
4. **Lägg till hund:** Vald kund → klicka knapp → ny hund-modal → success
5. **Komplett bokning:** Välj hund → fyll i detaljer → beräkna → spara
