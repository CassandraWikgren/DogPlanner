# Landing Page Robustness Audit

**Datum:** 2025-11-16  
**Status:** ⚠️ Funktionell men behöver förbättringar för långsiktig hållbarhet

---

## ✅ VAD SOM FUNGERAR

### 1. **Korrekt separation B2C/B2B**

- `/` → Hundägare (B2C) med bokningsknappar
- `/foretag` → Företag (B2B) med registreringsknappar
- Tydlig målgruppsanpassad copy

### 2. **Auth-redirect fungerar**

```tsx
// Båda pages har denna logik:
useEffect(() => {
  if (!loading && user) {
    router.replace("/dashboard");
  }
}, [user, loading, router]);
```

✅ Inloggade användare ser aldrig landing pages

### 3. **Alla länkar fungerar**

- Bokningslänkar: `/ansokan/hunddagis`, `/ansokan/pensionat`
- Login/register: `/login`, `/register`
- Footer-länkar: `/terms`, `/gdpr`, `/foretag`

### 4. **Inga kompileringsfel**

- TypeScript-validerad
- Korrekt JSX-struktur

---

## ⚠️ KRITISKA BRISTER

### **Problem 1: Duplicerad navigationskod**

**Nuvarande situation:**

- Navigation finns i 3 separata filer:
  1. `app/page.tsx` (70 rader nav-kod)
  2. `app/foretag/page.tsx` (78 rader nav-kod)
  3. `components/Navbar.tsx` (211 rader, bara för inloggade)

**Varför detta är ett problem:**

- Ändra navigation = ändra 3 filer
- Risk för inkonsistens
- Svårt att underhålla

**Lösning:**
Skapa `components/PublicNav.tsx` och `components/AuthenticatedNav.tsx`

```tsx
// components/PublicNav.tsx
export default function PublicNav({ variant = "customer" }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Logo */}
        <Link href="/">
          <Image src="/logo.png" alt="DogPlanner" width={50} height={50} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={
              variant === "customer"
                ? "text-[#2c7a4c] font-semibold"
                : "text-gray-700"
            }
          >
            För hundägare
          </Link>
          <Link
            href="/foretag"
            className={
              variant === "business"
                ? "text-[#2c7a4c] font-semibold"
                : "text-gray-700"
            }
          >
            För företag
          </Link>
          <Link href="/login">Logga in</Link>
          {variant === "business" && (
            <Link href="/register" className="btn-primary">
              Kom igång gratis
            </Link>
          )}
        </div>

        {/* Mobile hamburger menu */}
        <MobileMenu variant={variant} />
      </div>
    </nav>
  );
}
```

**Användning:**

```tsx
// app/page.tsx
<PublicNav variant="customer" />

// app/foretag/page.tsx
<PublicNav variant="business" />
```

---

### **Problem 2: Ingen mobilnavigation på landing pages**

**Nuvarande situation:**
Landing pages har bara desktop-navigation. På mobil blir länkarna för små eller osynliga.

**Lösning:**
Lägg till hamburgermeny i `PublicNav`:

```tsx
const [menuOpen, setMenuOpen] = useState(false);

// Mobile menu button
<button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
  <Menu size={24} />
</button>

// Mobile menu (AnimatePresence från framer-motion)
<AnimatePresence>
  {menuOpen && (
    <motion.div className="fixed inset-0 bg-white z-50">
      <Link href="/">För hundägare</Link>
      <Link href="/foretag">För företag</Link>
      <Link href="/login">Logga in</Link>
    </motion.div>
  )}
</AnimatePresence>
```

---

### **Problem 3: Navbar.tsx är ej återanvändbar**

**Nuvarande situation:**
`components/Navbar.tsx` visar bara intern navigation när `user` finns:

```tsx
{user && (
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/hunddagis">Hunddagis</Link>
  // etc.
)}
```

**Varför detta är ett problem:**

- Om du vill lägga till "För hundägare"/"För företag" länkar någonstans i appen
- Eller visa navigation för ej-inloggade på andra sidor
- Måste du duplicera koden igen

**Lösning:**
Separera i två komponenter:

1. **`PublicNav.tsx`** - För utloggade (landing pages)
2. **`AuthNav.tsx`** - För inloggade (dashboard, hunddagis, etc.)

---

### **Problem 4: Ingen konsistent header-komponenent**

**Nuvarande situation:**
Varje page definierar sin egen header-struktur:

```tsx
// app/page.tsx line 38-72 (34 rader)
<nav className="bg-white border-b...">
  {/* Custom nav */}
</nav>

// app/foretag/page.tsx line 38-78 (40 rader)
<nav className="bg-white border-b...">
  {/* Almost identical nav med små skillnader */}
</nav>
```

**Risker:**

- Ändrar du padding på en sida, måste du ändra på alla
- Lägg till en länk = ändra överallt
- Styling blir inkonsekvent

**Lösning:**
Centraliserad `<PageHeader>` komponent.

---

## 🔧 MINDRE FÖRBÄTTRINGAR

### **1. Hård-kodade färger**

**Problem:**

```tsx
style={{ backgroundColor: "#2c7a4c" }}
className="text-[#2c7a4c]"
className="from-[#2c7a4c] to-[#236139]"
```

Färger finns på 50+ ställen. Om du vill ändra branding = hitta och ersätt överallt.

**Lösning:**

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c7a4c',
          dark: '#236139',
          light: '#3d9960',
        }
      }
    }
  }
}

// Användning:
<div className="bg-primary hover:bg-primary-dark" />
<div className="text-primary" />
```

---

### **2. Inline styles blandat med Tailwind**

**Problem:**

```tsx
<div
  className="bg-white"
  style={{
    backgroundColor: "white", // Duplicerad
    padding: "1rem 2rem",     // Finns i Tailwind
  }}
>
```

**Lösning:**
Använd bara Tailwind:

```tsx
<div className="bg-white px-8 py-4">
```

---

### **3. Saknar SEO-metadata**

**Problem:**
Landing pages saknar:

- `<title>` tags
- Meta descriptions
- Open Graph tags för social sharing

**Lösning:**

```tsx
// app/page.tsx
export const metadata = {
  title: "Boka Hunddagis & Pensionat | DogPlanner",
  description:
    "Trygg omsorg för din hund. Boka hunddagis eller pensionat hos Sveriges modernaste hundverksamheter.",
  openGraph: {
    title: "DogPlanner - För hundägare",
    description: "Boka hunddagis och pensionat enkelt online",
    images: ["/og-image.jpg"],
  },
};
```

---

### **4. Tillgänglighet (a11y)**

**Saknas:**

- `aria-labels` på knappar utan text
- Focus-states på interaktiva element
- Semantic HTML (`<header>`, `<main>`, `<section>`)

**Exempel-fix:**

```tsx
// Före:
<div className="text-4xl mb-4">🐕</div>

// Efter:
<div className="text-4xl mb-4" aria-label="Hunddagis ikon">🐕</div>
```

---

## 📊 PRIORITERAD ÅTGÄRDSLISTA

### **KRITISKT (Gör nu för långsiktig hållbarhet):**

1. ✅ **Skapa PublicNav.tsx komponent**
   - Ersätt duplicerad nav-kod
   - Lägg till mobilmeny
   - Används av både `/` och `/foretag`

2. ✅ **Centralisera färger i Tailwind config**
   - Lägg till `primary`, `primary-dark` etc.
   - Sök-ersätt alla `#2c7a4c` → `primary`

3. ✅ **Lägg till SEO metadata**
   - Title, description, OG-tags på båda landing pages

### **VIKTIGT (Gör inom en vecka):**

4. **Ta bort inline styles**
   - Konvertera alla `style={{}}` till Tailwind classes

5. **Förbättra tillgänglighet**
   - Lägg till aria-labels
   - Testa med tangentbordsnavigation
   - Kontrollera kontrast

6. **Skapa layout-komponent**
   - `<LandingLayout>` wrapper för båda sidor
   - Dela header, footer, meta-tags

### **BRA ATT HA (Gör när tid finns):**

7. **Responsiv text-sizing**
   - Använd `clamp()` för flytande typografi
   - Bättre mobil-upplevelse

8. **Loading skeletons**
   - Visa placeholder medan bilder laddas
   - Bättre UX

9. **Analytics tracking**
   - Spåra vilka CTA-knappar som klickas
   - Konverteringsmätning

---

## 🎯 SLUTSATS

**Är det robust?**

- ✅ Funktionellt: JA
- ⚠️ Underhållbart: NEJ, inte långsiktigt
- ⚠️ Skalbart: NEJ, för mycket duplicering

**Är det långsiktigt hållbart?**

- ❌ **NEJ** i nuvarande form
- ✅ **JA** efter att du implementerat åtgärd 1-3 ovan

**Estimerad tid för att fixa kritiska problem:**

- PublicNav.tsx: 2-3 timmar
- Färger i Tailwind: 1 timme
- SEO metadata: 30 minuter
- **TOTALT: ~4 timmar arbete**

**Rekommendation:**
Prioritera att skapa `PublicNav.tsx` INNAN du lägger till fler publika sidor. Det sparar massor av tid framåt.

---

## 📝 KODEXEMPEL FÖR SNABB FIX

### **Steg 1: Skapa PublicNav.tsx**

```tsx
// components/PublicNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicNavProps {
  currentPage: "customer" | "business";
}

export default function PublicNav({ currentPage }: PublicNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 lg:px-32 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition"
          >
            <Image
              src="/logo.png"
              alt="DogPlanner"
              width={50}
              height={50}
              priority
              className="rounded-lg"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={
                currentPage === "customer"
                  ? "text-primary font-semibold"
                  : "text-gray-700 hover:text-primary transition"
              }
            >
              För hundägare
            </Link>
            <Link
              href="/foretag"
              className={
                currentPage === "business"
                  ? "text-primary font-semibold"
                  : "text-gray-700 hover:text-primary transition"
              }
            >
              För företag
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <Link
              href="/login"
              className="text-gray-700 hover:text-primary font-medium transition"
            >
              Logga in
            </Link>
            {currentPage === "business" && (
              <Link
                href="/register"
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition shadow-sm hover:shadow-md"
              >
                Kom igång gratis
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <Link
                href="/"
                className="block py-2 text-gray-700 hover:text-primary font-medium"
                onClick={() => setMenuOpen(false)}
              >
                För hundägare
              </Link>
              <Link
                href="/foretag"
                className="block py-2 text-gray-700 hover:text-primary font-medium"
                onClick={() => setMenuOpen(false)}
              >
                För företag
              </Link>
              <Link
                href="/login"
                className="block py-2 text-gray-700 hover:text-primary font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Logga in
              </Link>
              {currentPage === "business" && (
                <Link
                  href="/register"
                  className="block w-full px-6 py-3 bg-primary text-white rounded-lg text-center font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Kom igång gratis
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

### **Steg 2: Uppdatera landing pages**

```tsx
// app/page.tsx
import PublicNav from "@/components/PublicNav";

export default function HomePage() {
  // ... auth logic ...

  return (
    <div className="min-h-screen bg-white">
      <PublicNav currentPage="customer" />
      {/* Rest av sidan */}
    </div>
  );
}

// app/foretag/page.tsx
import PublicNav from "@/components/PublicNav";

export default function ForetagPage() {
  // ... auth logic ...

  return (
    <div className="min-h-screen bg-white">
      <PublicNav currentPage="business" />
      {/* Rest av sidan */}
    </div>
  );
}
```

### **Steg 3: Uppdatera Tailwind config**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2c7a4c",
          dark: "#236139",
          light: "#3d9960",
        },
      },
    },
  },
};
```

---

## ✅ EFTER DESSA ÄNDRINGAR

**Fördelar:**

- ✅ En fil att underhålla för navigation
- ✅ Konsistent branding via Tailwind
- ✅ Mobilanpassad från början
- ✅ Enklare att lägga till nya publika sidor
- ✅ Mindre kod totalt (70+78 rader → 80 rader komponent)

**Framtidssäkert:**
Om du ska lägga till `/pricing`, `/om-oss`, `/kontakt` etc. använder alla bara:

```tsx
<PublicNav currentPage="other" />
```

Ingen duplicering!
