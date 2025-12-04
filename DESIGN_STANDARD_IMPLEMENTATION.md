# 🎨 DogPlanner Design Standard - Implementation Guide

**Senast uppdaterad:** 4 december 2025  
**Status:** ✅ GÄLLER FÖR ALLA SIDOR  
**Baserat på:** Hunddagis-sidan + Frisörtjänster-sidan

---

## 📋 Innehållsförteckning

1. [Övergripande struktur](#övergripande-struktur)
2. [Färgschema](#färgschema)
3. [Typografi](#typografi)
4. [Spacing & Layout](#spacing--layout)
5. [Komponenter](#komponenter)
6. [Exempel-implementation](#exempel-implementation)

---

## 🏗️ Övergripande struktur

Alla sidor måste följa denna struktur:

```
┌─────────────────────────────────────────┐
│        HEADER (White Background)        │
│  Titel + Undertext + Stats-boxar (opt)  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│     ACTION BUTTONS (under header)       │
│ [Primary] [Secondary] [Tertiary]        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  SEARCH/FILTER BAR (White, shadowed)    │
│ [Search input] [Dropdowns] [Buttons]    │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│     MAIN CONTENT (Table/Cards/etc)      │
│ White background, green headers, rows   │
└─────────────────────────────────────────┘

Det är otroligt viktigt att allt ska vara symetriskt, cleant och användarvänligt.
```

### Container widths:

- **Data-sidor (Hunddagis, Frisör, etc):** `max-w-7xl` (BRED)
- **Admin-sidor:** `max-w-6xl` (normalt)
- **Form-sidor:** `max-w-3xl` (smal)

### Main wrapper:

- **Bakgrund:** `bg-gray-50` (ljusgrå, inte helt vit)
- **Padding:** `px-6 py-6` (symmetrisk)
- **Min-height:** `min-h-screen`

---

## 🎨 Färgschema

### Primär grön (DogPlanner brand):

```
Namn:           #2c7a4c
Hover/Darker:   #236139
Ljus bakgrund:  #E6F4EA
```

### Använd i:

- ✅ Rubriker (h1, h2)
- ✅ Primära knappar
- ✅ Tabell-headers
- ✅ Active-states
- ✅ Links
- ✅ Accent-linjer

### Gra-skala:

```
Text mörk:      #333333
Text ljus:      #666666
Text help:      #999999
Disabled:       #CCCCCC
```

### Secondary färger:

```
Orange (badges): #FF9800 / bg-orange-100 text-orange-600
Röd (error):     #F44336
Grön (success):  #4CAF50 / text-green-600
```

### Bakgrunder:

```
Main bg:        #F5F5F5 (bg-gray-50)
Component bg:   #FFFFFF (bg-white)
Border:         #E0E0E0 (border-gray-200)
Hover:          #FAFAFA (hover:bg-gray-100)
```

---

## 📝 Typografi

### Rubriker

#### H1 (Sidtitel)

```tsx
className = "text-[32px] font-bold text-[#2c7a4c] leading-tight";
```

- Size: 32px
- Weight: bold (700)
- Color: #2c7a4c
- Line-height: tight (1.25)

#### H2 (Sektionsrubrik)

```tsx
className = "text-lg font-semibold text-[#2c7a4c]";
```

- Size: 18px
- Weight: semibold (600)
- Color: #2c7a4c

#### H3 (Underrubrik)

```tsx
className = "text-base font-semibold text-gray-900";
```

- Size: 16px
- Weight: semibold (600)
- Color: gray-900

### Body text

#### Primär text

```tsx
className = "text-base text-gray-600";
```

- Size: 16px
- Weight: normal (400)
- Color: #666666

#### Sekundär text (labels, help)

```tsx
className = "text-sm text-gray-600 mt-1";
```

- Size: 14px
- Weight: normal
- Color: #666666

#### Small text (metadata, badges)

```tsx
className = "text-xs text-gray-600";
```

- Size: 12px
- Weight: normal
- Color: #666666

#### Table cells

```tsx
className = "text-sm text-[#333333]";
```

- Size: 14px
- Color: #333333

---

## 📏 Spacing & Layout

### Page structure:

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <div className="border-b border-gray-200 bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4">{/* Content */}</div>
  </div>

  {/* Main content */}
  <div className="max-w-7xl mx-auto px-6 py-6">{/* Content */}</div>
</div>
```

### Key spacing values:

```
px: px-6 (24px)          ← Standard horizontal padding
py: py-4 (16px)         ← Header vertical padding
py: py-6 (24px)         ← Main content vertical padding
gap: gap-3 / gap-4      ← Between elements
mb: mb-4 / mb-6         ← Bottom margin between sections
```

### Component padding:

```
Buttons:     px-4 py-2.5    (16px x 10px)
Inputs:      px-4 py-2.5    (16px x 10px)
Cards:       p-4            (16px all around)
Table cells: px-4 py-2.5    (16px x 10px)
```

---

## 🧩 Komponenter

### 1. HEADER

```tsx
<div className="border-b border-gray-200 bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {/* Rubrik */}
        <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
          Sidtitel
        </h1>

        {/* Undertext */}
        <p className="mt-1 text-base text-gray-600">Beskrivning av sidan</p>
      </div>

      {/* Stats-boxar (optional, höger) */}
      <div className="flex items-center gap-4 ml-8">
        <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-[#2c7a4c]">6</p>
          <p className="text-xs text-gray-600 mt-0.5">Label</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. ACTION BUTTONS ROW

```tsx
<div className="flex justify-between items-center mb-6">
  <div className="flex items-center space-x-3">
    {/* Primary button */}
    <button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2">
      <Plus className="h-4 w-4 mr-2" />
      Primär åtgärd
    </button>

    {/* Secondary button (Outline) */}
    <button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2">
      <RefreshCcw className="h-4 w-4 mr-2" />
      Sekundär åtgärd
    </button>

    {/* Tertiary button (Gray) */}
    <button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-gray-500 hover:bg-gray-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
      <Download className="h-4 w-4 mr-2" />
      Tredje åtgärd
    </button>
  </div>
</div>
```

**Button variants:**

- **Primary:** Green (#2c7a4c) - Huvudåtgärd
- **Secondary/Outline:** White + green border - Sekundär åtgärd
- **Tertiary/Gray:** Gray - Mindre viktig åtgärd

### 3. SEARCH & FILTER BAR

```tsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
  <div className="flex flex-row items-center space-x-4">
    {/* Search input */}
    <div className="flex-1 min-w-[400px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Sök..."
          className="w-full h-10 pl-10 pr-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
        />
      </div>
    </div>

    {/* Filter dropdowns */}
    <div className="flex space-x-3 items-center">
      <select className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-base whitespace-nowrap">
        <option>Filter 1</option>
        <option>Filter 2</option>
      </select>

      {/* Settings button */}
      <button className="inline-flex items-center h-10 px-4 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors">
        <Settings2 className="h-4 w-4 mr-2" />
        Inställningar
      </button>
    </div>
  </div>
</div>
```

### 4. TABLE

```tsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <table className="min-w-full">
    {/* Table header */}
    <thead className="bg-[#2c7a4c] text-white">
      <tr>
        <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
          Kolumn 1
        </th>
        <th
          scope="col"
          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139]"
        >
          Kolumn 2
        </th>
      </tr>
    </thead>

    {/* Table body */}
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr
          key={row.id}
          className={`cursor-pointer transition-colors ${index % 2 === 0 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
        >
          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
            {row.value}
          </td>
          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
            {row.value2}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Table styling:**

- Header: `bg-[#2c7a4c] text-white` + `hover:bg-[#236139]`
- Rows: Alternerar `bg-white` och `bg-gray-50`
- Hover: `hover:bg-gray-100`
- Cells: `px-4 py-2.5`

### 5. INPUT FIELD

```tsx
<div>
  <label className="block text-sm font-semibold text-gray-900 mb-2">
    Label
  </label>
  <input
    type="text"
    placeholder="Placeholder"
    className="w-full h-10 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
  />
</div>
```

### 6. SELECT/DROPDOWN

```tsx
<select className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-base">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### 7. BADGE/LABEL

```tsx
{
  /* Success badge */
}
<span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
  Aktiv
</span>;

{
  /* Warning badge */
}
<span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
  Väntelista
</span>;

{
  /* Info badge */
}
<span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
  Ny
</span>;
```

### 8. CARD (For admin-style sections)

```tsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
  <div className="flex-1 w-full">
    <div className="flex items-center justify-center gap-2 mb-2">
      <span className="text-2xl">🐕</span>
      <h3 className="text-sm font-semibold text-[#2c7a4c] group-hover:text-[#236139] text-center">
        Card Title
      </h3>
    </div>
    <p className="text-xs text-gray-600 text-center leading-snug">
      Description text
    </p>
  </div>
</div>
```

---

## 📌 Exempel-implementation

### Admin-sidan (max-w-6xl)

```tsx
"use client";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Administration
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Hantera alla aspekter av DogPlanner
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Kort-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card example */}
          <Link href="/admin/rapporter">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-sm font-semibold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                    Rapporter
                  </h3>
                </div>
                <p className="text-xs text-gray-600 text-center leading-snug">
                  Se statistik och rapporter
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Data-sidan (max-w-7xl) - Hunddagis pattern

```tsx
"use client";

export default function HunddagisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Hunddagis
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Dagens sammanställning – Sök, filtrera och hantera dina hundar
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">6</p>
                <p className="text-xs text-gray-600 mt-0.5">Antagna hundar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Ny hund
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-row items-center space-x-4">
            <input
              type="text"
              placeholder="Sök..."
              className="flex-1 h-10 px-4 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c]"
            />
            <select className="h-10 px-3 border border-gray-300 rounded-md text-base">
              <option>Filter</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-[#2c7a4c] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Hund
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Ägare
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">{/* Rows */}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Checkpoints innan publicering

- [ ] Header med titel + undertext + stats (om relevant)
- [ ] Action buttons (primär/sekundär/tertiär)
- [ ] Search/filter bar med inputs + dropdowns
- [ ] Main content (table/cards/list)
- [ ] Alla färger använder #2c7a4c för primär
- [ ] Padding: px-6 py-4 (header), px-6 py-6 (content)
- [ ] Container width: max-w-7xl (data), max-w-6xl (admin), max-w-3xl (forms)
- [ ] All fokus-state använder focus:ring-2 focus:ring-[#2c7a4c]
- [ ] Hover-effekter på buttons och rows
- [ ] Table headers: bg-[#2c7a4c] text-white
- [ ] Alternerad radtyp i tabeller (vit/grå)

---

## 🎯 Nästa steg

1. Uppdatera admin-sidan enligt denna standard
2. Säkerställ att alla datasidor (hunddagis, frisör, ekonomi, etc) följer denna
3. Uppdatera alla formular-sidor
4. Standardisera alla komponenter (Button, Input, Select, etc)
5. Testa på flera skärmstorlekar (responsiveness)
