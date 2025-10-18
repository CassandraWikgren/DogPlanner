# 🧩 COMPONENT BACKUP - DogPlanner

## 🐕 HUNDDAGIS KOMPONENTER (fungerande)

### app/hunddagis/page.tsx - HUVUDKOMPONENT

```tsx
// Status: ✅ FULLT FUNGERANDE
// Funktioner: CRUD, filter, sök, PDF-export
// Problem: Inga kända
// Senast testad: Oktober 2025

// Viktiga delar:
- SQL query: KORREKT (ingen orgs JOIN)
- State management: useState för dogs, search, filters
- Modal system: För add/edit
- PDF export: jsPDF + autoTable
- Real-time updates: Automatisk refresh
```

### SQL Query som FUNGERAR

```tsx
const { data: dogsData, error } = await supabase
  .from("dogs")
  .select(
    `
    *,
    owners (
      id,
      full_name,
      phone,
      email
    )
  `
  )
  .eq("org_id", userOrgId);
```

### PDF Export kod (fungerande)

```tsx
const generatePDF = () => {
  const doc = new jsPDF();
  // Använder svenska tecken korrekt
  // Snygg tabellformatering
  // Alla hundar inkluderade
};
```

## 📊 DASHBOARD KOMPONENTER

### app/dashboard/page.tsx - MODULSYSTEM

```tsx
// Status: 🔄 Kodad men inte testad med riktig data
// Funktioner: Expanderbara moduler, navigation
// Problem: Behöver integration med riktiga data

// Modulsystem:
const modules = {
  hunddagis: {
    /* grön färg, PawPrint ikon */
  },
  hundpensionat: {
    /* blå färg, Building ikon */
  },
  frisor: {
    /* rosa färg, Scissors ikon */
  },
};
```

## 🏠 HUNDPENSIONAT KOMPONENTER

### app/hundpensionat/page.tsx - BOKNINGSSYSTEM

```tsx
// Status: 🔄 Avancerad kod, inte testad
// Funktioner: Bokningar, månadsfilter, PDF
// Problem: Behöver testdata för bookings-tabellen

// SQL query struktur:
const { data: bookings } = await supabase.from("bookings").select(`
    *,
    dogs (name, breed, owners (full_name)),
    rooms (name, capacity)
  `);
```

## 🏠 ROOMS KOMPONENTER

### app/rooms/page.tsx - RUMSHANTERING

```tsx
// Status: 🔄 Komplex implementation
// Funktioner: Jordbruksverkets beräkningar, kapacitet
// Problem: Behöver rooms testdata

// Viktiga imports:
import { calculateAllRoomsOccupancy } from "@/lib/roomCalculator";

// Room interface:
interface Room {
  id: string;
  name: string;
  capacity_m2: number;
  room_type: "daycare" | "boarding" | "both";
  max_dogs?: number;
  is_active: boolean;
}
```

## 👥 OWNERS KOMPONENTER

### app/owners/page.tsx - ÄGARHANTERING

```tsx
// Status: 🔄 Enkel implementation
// Funktioner: Lista ägare, kundnummer
// Problem: Begränsad funktionalitet

// Behöver utökas med:
- Lägg till ny ägare
- Redigera ägare
- Koppla till hundar
```

## 💰 EKONOMI KOMPONENTER

### app/ekonomi/page.tsx - FAKTURAHANTERING

```tsx
// Status: 🔄 Komplex kod
// Funktioner: Fakturor, betalningar, status
// Problem: Behöver invoice testdata

// Invoice interface:
interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  invoice_lines?: InvoiceLine[];
}
```

## 🔧 VIKTIGA LIB-FILER

### lib/supabase.ts - DATABASE CONNECTION

```tsx
// Status: ✅ FUNGERAR
// Konfiguration för Supabase client
// Används av alla komponenter
```

### lib/roomCalculator.ts - JORDBRUKSVERKET

```tsx
// Status: ✅ AVANCERAD IMPLEMENTATION
// Funktioner: Beräknar rumskapacitet enligt SJVFS 2019:2
// Jordbruksverkets regler implementerade

// Exempel:
export function calculateRequiredArea(heightCm: number): number {
  if (heightCm < 25) return 2.0;
  if (heightCm <= 35) return 2.0;
  if (heightCm <= 45) return 2.5;
  // osv...
}
```

### lib/pricing.ts - PRISBERÄKNINGAR

```tsx
// Status: 🔄 Implementerat men ej testat
// Funktioner: Abonnemangspriser, rabatter
```

## 🎨 UI KOMPONENTER

### components/ui/\* - SHADCN KOMPONENTER

```tsx
// Status: ✅ INSTALLERADE OCH FUNGERANDE
// Komponenter: Card, Button, Input, Modal, Badge
// Styling: Tailwind CSS integration
```

### components/DashboardHeader.tsx

```tsx
// Status: ✅ FUNGERAR
// Funktioner: Navigation, användarinfo, logout
```

### components/EditDogModal.tsx

```tsx
// Status: ✅ FUNGERAR PERFEKT
// Funktioner: Formulär för add/edit hundar
// Validering: Inkluderad
```

## 🔐 AUTH KOMPONENTER

### app/context/AuthContext.tsx

```tsx
// Status: ✅ FULLT FUNGERANDE
// Funktioner: Login state, user management
// Provider: Wraps hela appen

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: false,
  signOut: async () => {},
});
```

## 📱 LAYOUT KOMPONENTER

### app/layout.tsx - ROOT LAYOUT

```tsx
// Status: ✅ FUNGERAR
// Funktioner: AuthContext Provider, global styles
// Metadata: SEO och favicon
```

### components/Navbar.tsx

```tsx
// Status: ✅ FUNGERAR
// Funktioner: Huvudnavigation mellan sidor
```

## 🎯 TESTADE VS OTESTADE

### ✅ TESTADE OCH FUNGERANDE

- Hunddagis page.tsx
- EditDogModal.tsx
- AuthContext.tsx
- Supabase connection
- PDF export
- Navbar navigation

### 🔄 KODADE MEN OTESTADE

- Hundpensionat bokningar
- Rooms management
- Ekonomi/faktura system
- Dashboard moduler
- Owners utökad funktionalitet

### ⚠️ POTENTIELLA PROBLEM

- Alla otestade komponenter kan ha samma databasproblem som hunddagis hade
- Behöver troligen `complete_testdata.sql` för andra tabeller
- TypeScript types kan behöva justeras

## 🔄 NÄSTA STEG FÖR KOMPONENTER

### 1. Hundpensionat

```sql
-- Behöver testdata:
INSERT INTO rooms (name, capacity_m2, room_type)
VALUES ('Rum 1', 10.0, 'boarding');

INSERT INTO bookings (dog_id, room_id, start_date, end_date)
VALUES (dog_id, room_id, '2025-10-20', '2025-10-25');
```

### 2. Dashboard

- Testa modulnavigation
- Koppla till riktiga sidor
- Lägg till statistik

### 3. Owners

- Utöka med CRUD-funktionalitet
- Lägg till validering
- Koppla till hundar

---

**Sammanfattning:** Hunddagis-komponenter är beprövade och fungerar. Andra komponenter har kod men behöver testning och databasfix.

**Uppdaterad:** Oktober 2025  
**Status:** Hunddagis = ✅, Resten = 🔄
