# 🎨 DogPlanner Design System V2

**Skapad: 15 november 2025**  
**Syfte: Komplett, genomtänkt designspecifikation för enhetligt och professionellt utseende**

---

## 🎯 DESIGNFILOSOFI

DogPlanner ska kännas som ett **nordiskt kontorssystem för hundar** - tänk Fortnox/Visma men för hunddagis.

### Kärnvärden:

- ✅ **Professionellt men vänligt** - Inte stelt, men inte lekfullt
- ✅ **Informationstätt men luftigt** - Mycket data, men det ska andas
- ✅ **Tydlig hierarki** - Man ser direkt vad som är viktigast
- ✅ **Minimalistiskt** - Ingen onödig dekoration
- ✅ **Grön som accent** - Inte dominant, används strategiskt

### Design-principer:

1. **Symmetri**: Allt ska vara välbalanserat och centrerat där det passar
2. **Kompakthet**: Minimal scrollning - viktiga saker "above the fold"
3. **Användarvänlighet**: Rätt sak på rätt plats, ingen jakt efter funktioner
4. **Tillförlitlighet**: Ser genomtänkt och stabil ut
5. **Smart kreativitet**: Innovativt men inte experimentellt

---

## 🎨 FÄRGPALETT

**UPPDATERAD 2 DECEMBER 2025** - Migrering från grön till professionell slate-färgpalett

### Primärfärger (SLATE):

```css
--primary-slate: #475569; /* slate-700 - knappar, rubriker, accenter */
--primary-hover: #334155; /* slate-800 - hover-state */
--light-slate: #f1f5f9; /* slate-50 - subtil bakgrund, hover */
```

### Neutraler:

```css
--white: #ffffff; /* Kort, tabeller, modaler */
--background: #f8fafc; /* slate-50 - Sidbackground */
--gray-50: #f9fafb; /* Alternerande rader */
--gray-100: #f3f4f6; /* Hover på rader */
--gray-200: #e5e7eb; /* Borders */
--gray-300: #d1d5db; /* Input borders */
--gray-600: #4b5563; /* Sekundär text */
--text-primary: #1e293b; /* slate-800 - Huvudtext */
--text-secondary: #64748b; /* slate-500 - Mindre viktig text */
```

### Status-färger:

```css
--success: #10b981; /* Grön framgång */
--warning: #f59e0b; /* Orange varning */
--error: #d9534f; /* Röd fel */
--info: #3b82f6; /* Blå information */
```

### Användning:

- **Primär slate (#475569 / slate-700)**: Knappar, rubriker (H1/H2/H3), viktig accent
- **Hover slate (#334155 / slate-800)**: Hover-states på knappar och interaktiva element
- **Ljus slate (#f1f5f9 / slate-50)**: Subtila bakgrunder, hover på outline-knappar
- **Bakgrunder**: Sidor #f8fafc (slate-50), kort #FFFFFF
- **Text**: Mörkgrå (#1e293b / slate-800) huvudtext, slate-500 (#64748b) sekundär

**MIGRATION NOTES (2 Dec 2025):**

- Alla instanser av `#2c7a4c` → `slate-700` (#475569)
- Alla instanser av `#236139` / `#245c3a` → `slate-800` (#334155)
- Alla instanser av `#e6f4ea` → `slate-50` (#f1f5f9)
- Systemet har nu en professionell, neutral färgpalett istället för "plåttig" grön

---

## ✍️ TYPOGRAFI

### Font-stack:

```css
font-family: "Inter", "Roboto", "Segoe UI", system-ui, sans-serif;
```

### Storlekar och vikter:

```css
/* Rubriker */
H1: 32px (2rem), font-weight: 700 (bold), color: #475569 (slate-700), line-height: 1.6
H2: 24px (1.5rem), font-weight: 600 (semibold), color: #475569 (slate-700), line-height: 1.6
H3: 18px (1.125rem), font-weight: 500 (medium), color: #475569 (slate-700), line-height: 1.6

/* Brödtext */
Body: 16px (1rem), font-weight: 400 (normal), color: #1e293b (slate-800), line-height: 1.6
Small: 14px (0.875rem), font-weight: 400, color: #64748b (slate-500)
Tiny: 12px (0.75rem), font-weight: 400, color: #64748b (slate-500)

/* UI-element */
Button: 15px (0.9375rem), font-weight: 600 (semibold)
Input label: 15px, font-weight: 600, color: #475569 (slate-700)
Table header: 14px (0.875rem), font-weight: 600
```

### Hero-rubriker (endast på publika sidor):

```css
Hero H1: 36-40px, font-weight: 700, color: #FFFFFF, text-align: center
Hero H2: 18-20px, font-weight: 600, color: #FFFFFF, opacity: 0.9
Text shadow: 0 2px 4px rgba(0,0,0,0.25)
```

---

## 📐 SPACING & LAYOUT

### Container-bredder:

```css
--max-width-sm: 672px (42rem) /* Formulär, smala sidor */ --max-width-md: 896px
  (56rem) /* Innehållssidor */ --max-width-lg: 1152px (72rem) /* Breda sidor */
  --max-width-xl: 1280px (80rem) /* Data-sidor, tabeller (≈1200px) */;
```

### Standard padding:

```css
--padding-page: px-6 py-8 /* 24px horisontell, 32px vertikal */
  --padding-card: p-6 /* 24px alla håll */ --padding-compact: p-4
  /* 16px för kompakta kort */ --padding-tight: p-3
  /* 12px för mycket kompakt */;
```

### Spacing-scale:

```css
--space-1: 4px (0.25rem) --space-2: 8px (0.5rem) --space-3: 12px (0.75rem)
  --space-4: 16px (1rem) --space-5: 20px (1.25rem) --space-6: 24px (1.5rem)
  --space-8: 32px (2rem) --space-10: 40px (2.5rem) --space-12: 48px (3rem);
```

### Gap mellan element:

- **Grid av kort**: `gap-5` (20px)
- **Mellan sektioner**: `mb-8` (32px)
- **Mellan form-fält**: `gap-4` (16px)
- **Mellan knappar**: `space-x-3` (12px)

---

## 🧱 KOMPONENTSPECIFIKATIONER

### Knappar:

```css
/* Primary (slate) */
height: 40px (h-10)
padding: 0 16px (px-4)
border-radius: 6px (rounded-md)
font-size: 15px, font-weight: 600
color: #FFFFFF
background: #475569 (bg-slate-700)
hover:background: #334155 (hover:bg-slate-800)
box-shadow: 0 1px 2px rgba(0,0,0,0.05)
focus: ring-2 ring-slate-700 ring-offset-2

/* Secondary (mörkare grå) */
Same as primary but:
background: #4B5563 (bg-gray-600)
hover:background: #374151 (hover:bg-gray-700)

/* Outline (vit med slate kant) */
Same as primary but:
background: #FFFFFF
color: #475569 (text-slate-700)
border: 1px solid #475569 (border-slate-700)
hover:background: #f1f5f9 (hover:bg-slate-50)

/* Ghost (transparent) */
background: transparent
color: #475569 (text-slate-700)
hover:background: #f1f5f9 (hover:bg-slate-50)
```

### Kort (Cards):

```css
background: #FFFFFF
border: 1px solid #E5E7EB
border-radius: 8px (rounded-lg)
box-shadow: 0 1px 3px rgba(0,0,0,0.05)
padding: 24px (p-6) standard, 16px (p-4) kompakt
hover: shadow-md, border-color: #475569 (slate-700) (på klickbara kort)
```

### Inputs:

```css
height: 40px (h-10)
border-radius: 6px (rounded-md)
border: 1px solid #D1D5DB
padding: 0 12px (px-3)
font-size: 16px
background: #FFFFFF
focus:
  outline: none
  ring: 2px #475569 (slate-700)
  border-color: transparent
```

### Select/Dropdown:

```css
Same as Input but:
padding-right: 32px (för pil-ikon)
```

### Textarea:

```css
Same as Input but:
height: auto
min-height: 80px
padding: 12px (p-3)
```

### Tabeller:

```css
/* Container */
background: #FFFFFF
border-radius: 8px
box-shadow: 0 1px 3px rgba(0,0,0,0.05)
overflow: hidden

/* Header */
background: #475569 (bg-slate-700)
color: #FFFFFF
height: 44px
font-size: 14px, font-weight: 600
padding: 12px 16px (px-4 py-3)
text-align: left

/* Rows */
background: alternating #FFFFFF / #F9FAFB
hover: #F3F4F6
padding: 12px 16px (px-4 py-3)
font-size: 16px
color: #1e293b (slate-800)
border-bottom: none (använd alternating colors istället)

/* Empty state */
padding: 48px (py-12)
text-align: center
color: #64748b (slate-500)
font-size: 16px
```

### ⚠️ KRITISK REGEL: TEXT PÅ GRÖN BAKGRUND

**ALLTID när du använder grön bakgrund (#2C7A4C eller bg-[#2c7a4c]):**

```css
background: #2C7A4C
color: #FFFFFF /* ALLTID VIT TEXT */
```

**Exempel på RÄTT användning:**

```tsx
{
  /* Grön bakgrund = VIT text */
}
<div className="bg-[#2c7a4c] text-white">
  <p className="text-white">Detta läses bra!</p>
  <Icon className="text-white" />
</div>;

{
  /* Vit/ljus bakgrund = MÖRK text */
}
<div className="bg-white">
  <p className="text-gray-900">Detta läses bra!</p>
  <Icon className="text-gray-600" />
</div>;
```

**Exempel på FEL (använd ALDRIG):**

```tsx
{
  /* ❌ DÅLIG KONTRAST */
}
<div className="bg-[#2c7a4c]">
  <p className="text-gray-600">Går inte att läsa!</p>
</div>;

{
  /* ❌ DÅLIG KONTRAST */
}
<div className="bg-[#e6f4ea]">
  <p className="text-gray-400">För ljus!</p>
</div>;
```

**Rekommenderade färgkombinationer:**

- Slate bakgrund (#475569 / bg-slate-700) → VIT text (#FFFFFF)
- Vit bakgrund (#FFFFFF) → Slate-800 text (#1e293b)
- Ljus slate bakgrund (#f1f5f9 / bg-slate-50) → Slate-800 text (#1e293b)
- Grå bakgrund (#F8FAFC) → Slate-800 text (#1e293b)

---

## 📄 PAGE-TYPOLOGI

### TYP 1: LANDING/DASHBOARD (efter inloggning)

**Exempel**: Dashboard  
**Syfte**: Snabb överblick, navigera till arbetsområden

**Layout**:

```tsx
<div className="min-h-screen bg-gray-50">
  {/* INGEN HERO - Användaren är redan inloggad */}

  <div className="bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-[32px] font-bold text-slate-700">Dashboard</h1>
      <p className="text-base text-gray-600 mt-1">
        Välkommen tillbaka, här är en snabb överblick
      </p>
    </div>
  </div>

  {/* Stats (om relevant) */}
  <div className="max-w-7xl mx-auto px-6 py-8">
    <DashboardWidgets /> {/* Max 6 kompakta stats-boxar */}
  </div>

  {/* Huvudkort - 4 moduler */}
  <div className="max-w-7xl mx-auto px-6 pb-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Kompakta modulkort med emoji, rubrik, beskrivning */}
    </div>
  </div>
</div>
```

**Designprinciper**:

- ❌ INGEN hero-sektion
- ✅ Kompakt header med titel + beskrivning
- ✅ Stats (om det finns något relevant att visa)
- ✅ Max 4-6 modulkort för navigation
- ✅ Emojis: max 32px (text-3xl), centrerade
- ✅ Kort: kompakt padding (p-4 eller p-5)

---

### TYP 2: DATA-SIDOR (huvudarbete)

**Exempel**: Hunddagis, Hundpensionat, Ekonomi, Rum, Ägare  
**Syfte**: Visa och hantera data (listor, tabeller, statistik)

**Layout**:

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Kompakt header med stats */}
  <div className="bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Vänster: Rubrik + beskrivning */}
        <div>
          <h1 className="text-[32px] font-bold text-slate-700">Hunddagis</h1>
          <p className="text-base text-gray-600 mt-1">
            Hantera dagishundar, schema och verksamhet
          </p>
        </div>

        {/* Höger: Kompakta stats (om relevanta) */}
        <div className="flex items-center gap-6">
          <StatBox number={47} label="Antagna" />
          <StatBox number={8} label="Väntelista" color="orange" />
        </div>
      </div>
    </div>
  </div>

  {/* Action buttons */}
  <div className="max-w-7xl mx-auto px-6 py-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button variant="primary">Ny hund</Button>
        <Button variant="secondary">PDF-export</Button>
        <Button variant="outline">Ladda om</Button>
      </div>
    </div>

    {/* Sök och filter */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      {/* Search + filters i en rad */}
    </div>

    {/* Huvudinnehåll - tabell eller grid */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Table />
    </div>
  </div>
</div>
```

**Designprinciper**:

- ❌ INGEN hero-sektion
- ✅ Kompakt header: titel + beskrivning vänster, stats höger
- ✅ Stats: Max 2-3 små boxar inline, inte egen rad
- ✅ Action buttons: Tydlig rad överst
- ✅ Sök/filter: Egen sektion med vit bakgrund
- ✅ Tabell: Grön header, alternating rows, hover-state

---

### TYP 3: FORMULÄR/UNDERSIDOR

**Exempel**: Ny hund, Ny bokning, Prissättning, Företagsinformation  
**Syfte**: Skapa eller redigera specifik data

**Layout**:

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Minimal header */}
  <div className="bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-3xl mx-auto px-6 py-6">
      <BackButton />
      <h1 className="text-[32px] font-bold text-slate-700 mt-4">Ny hund</h1>
      <p className="text-base text-gray-600 mt-1">
        Fyll i hundens information nedan
      </p>
    </div>
  </div>

  {/* Formulär - smalare layout */}
  <div className="max-w-3xl mx-auto px-6 py-8">
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <form>{/* Formulärfält */}</form>
    </div>
  </div>
</div>
```

**Designprinciper**:

- ✅ Smalare layout: max-w-3xl (768px)
- ✅ Tillbaka-knapp överst
- ✅ Kompakt header
- ✅ Ett vitt kort med formulär
- ✅ Mer luft runt inputs (gap-6)
- ✅ Tydliga labels (bold grön)
- ✅ Action-knappar längst ner

---

## 🎭 EMOJI-ANVÄNDNING

Emojis används sparsamt och strategiskt:

### Storlekar:

```css
text-3xl (30px)  /* Modulkort på dashboard */
text-2xl (24px)  /* Sidhuvuden, mindre kort */
text-xl (20px)   /* Inline i text, stats */
```

### Placering:

- ✅ Centrerat ovanför rubrik på modulkort
- ✅ Inline framför sidhuvud (små sidor)
- ✅ I stats-boxar (liten storlek)
- ❌ INTE i tabellrader
- ❌ INTE som huvudfokus - text alltid viktigare

### Exempel:

```tsx
{
  /* Dashboard modulkort - emoji centrerad ovanför */
}
<div className="flex flex-col items-center text-center">
  <div className="text-3xl mb-3">🐕</div>
  <h2 className="text-lg font-semibold text-slate-700">Hunddagis</h2>
  <p className="text-sm text-gray-600">Beskrivning...</p>
</div>;

{
  /* Sidhuvud - emoji inline */
}
<h1 className="text-[32px] font-bold text-slate-700">
  <span className="text-2xl mr-2">🏨</span>
  Hundpensionat
</h1>;
```

---

## 📊 STATS-BOXAR

Två varianter beroende på kontext:

### Variant A: Inline (datasidor header)

```tsx
<div className="flex items-center gap-6">
  <div className="text-center bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
    <p className="text-2xl font-bold text-slate-700">47</p>
    <p className="text-sm text-gray-600 mt-1">Antagna</p>
  </div>
</div>
```

- Små, kompakta
- Max 2-3 per sida
- Inline i headern

### Variant B: Grid (dashboard overview)

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
  <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-blue-50">
        <Users className="w-5 h-5 text-blue-600" />
      </div>
    </div>
    <p className="text-xs font-medium text-gray-500 uppercase">Registrerade</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">47</p>
    <p className="text-xs text-gray-500 mt-1">+3 denna vecka</p>
  </div>
</div>
```

- Större, mer info
- Max 6 per dashboard
- Egen sektion under header

---

## 🔄 NAVBAR

Behåll som den är men gör lite kompaktare:

```css
height: 60px (istället för 80px)
padding: px-6 py-3
logo-height: 48px (istället för 60px+)
background: #475569 (bg-slate-700)
```

**Innehåll**:

- Logotyp vänster (länkar till dashboard)
- Notifikations-ikon (om implementerad)
- Användarnamn + "Logga ut"-knapp höger

**Inga navigeringslänkar** - navigation sker via dashboard/sidor

---

## ✅ IMPLEMENTATION-CHECKLISTA

För att implementera denna design på alla sidor:

### Steg 1: Uppdatera alla DATA-SIDOR

- [ ] Hunddag is
- [ ] Hundpensionat
- [ ] Ekonomi
- [ ] Rum
- [ ] Ägare
- [ ] Frisör
- [ ] Ansökningar

**För varje sida**:

1. Ta bort hero-sektion
2. Skapa kompakt header (titel + beskrivning + inline stats)
3. Action buttons i egen rad
4. Sök/filter i vit box
5. Tabell med standardiserad styling

### Steg 2: Uppdatera FORMULÄR-SIDOR

- [ ] Ny hund
- [ ] Ny bokning
- [ ] Prissättning
- [ ] Företagsinformation

**För varje sida**:

1. Smal layout (max-w-3xl)
2. Tillbaka-knapp överst
3. Ett vitt kort med formulär
4. Standardiserade inputs

### Steg 3: Uppdatera DASHBOARD

- [ ] Ta bort hero eller gör mycket kompaktare
- [ ] Visa stats (om användbara)
- [ ] 4 modulkort med kompakt design

### Steg 4: Uppdatera ADMIN

- [ ] Konsekvent kortlayout
- [ ] Stats-översikt (om relevant)
- [ ] Grid av admin-funktioner

### Steg 5: Standardisera KOMPONENTER

- [ ] Ersätt alla ShadCN Cards med StandardCard
- [ ] Ersätt alla buttons med StandardButton
- [ ] Ersätt alla inputs med StandardInput
- [ ] Ersätt alla tabeller med StandardTable

---

## 🎨 FÄRG-BESLUT PER ELEMENT

**UPPDATERAD 2 DECEMBER 2025** - Nya slate-färger

För att undvika förvirring, här är exakt när varje färg används:

| Element               | Färg                                                      | Användning                        |
| --------------------- | --------------------------------------------------------- | --------------------------------- |
| **Rubriker H1/H2/H3** | `#475569 (slate-700)`                                     | Alla rubriker                     |
| **Primär knapp**      | Background `slate-700`, Text `#FFFFFF`                    | Huvudåtgärder                     |
| **Sekundär knapp**    | Background `gray-600`, Text `#FFFFFF`                     | Mindre viktiga åtgärder           |
| **Outline knapp**     | Border `slate-700`, Text `slate-700`, Hover bg `slate-50` | Återställ, Avbryt                 |
| **Sidbackgrund**      | `#F8FAFC (slate-50)`                                      | Alla sidor                        |
| **Kort background**   | `#FFFFFF`                                                 | Alla kort, tabeller               |
| **Kort border**       | `#E5E7EB`                                                 | Standard border                   |
| **Kort hover border** | `#475569 (slate-700)`                                     | Klickbara kort                    |
| **Input border**      | `#D1D5DB`                                                 | Normal state                      |
| **Input focus ring**  | `#475569 (slate-700)`                                     | Focus state                       |
| **Tabell header**     | Background `slate-700`, Text `#FFFFFF`                    | Alla tabeller                     |
| **Tabell rader**      | Alternating `#FFFFFF` / `#F9FAFB`                         | Datavisning                       |
| **Tabell hover**      | `#F3F4F6`                                                 | Hover på rad                      |
| **Text primary**      | `#1e293b (slate-800)`                                     | Huvudtext                         |
| **Text secondary**    | `#64748b (slate-500)`                                     | Beskrivningar, mindre viktig text |

---

## 📝 SAMMANFATTNING

**Denna design ger**:

- ✅ Enhetligt utseende över hela systemet
- ✅ Professionellt och tillförlitligt intryck
- ✅ Kompakt men luftig känsla
- ✅ Tydlig hierarki och användarvänlighet
- ✅ Minimalt med scrollning
- ✅ Smart användning av grön accent-färg
- ✅ Perfekt balans mellan "kontorssystem" och "hundvänlig"

**Nästa steg**:

1. Implementera på Hunddagis (färdigt som proof of concept)
2. Applicera på Hundpensionat, Ekonomi, Rum
3. Uppdatera formulärsidor
4. Finjustera Dashboard
5. Uppdatera alla mindre sidor

**Resultat**: Ett system som känns som det är byggt av EN person med EN vision - professionellt, genomtänkt och tillförlitligt.
