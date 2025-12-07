# 🎨 DogPlanner Design Standard - Implementation Guide

**Senast uppdaterad:** 6 december 2025  
**Status:** ✅ GÄLLER FÖR ALLA SIDOR  
**Baserat på:** Hunddagis-sidan + Frisörtjänster-sidan

## ⚠️ VIKTIGT: Använd CSS-klasser från globals.css

**ALLA sidor ska använda de fördefinierade klasserna från `app/globals.css`.**

### Tillgängliga klasser:

| Kategori      | Klass                  | Användning                                     |
| ------------- | ---------------------- | ---------------------------------------------- |
| **Layout**    | `.page-wrapper`        | Yttersta wrapper (min-h-screen bg-gray-50)     |
|               | `.page-header`         | Header-sektion (border-b, bg-white, shadow-sm) |
|               | `.page-header-content` | Header inre container (max-w-7xl, px-6, py-4)  |
|               | `.page-main`           | Main content (max-w-7xl, px-6, py-6)           |
| **Typografi** | `.page-title`          | H1 rubrik (32px, bold, #2c7a4c)                |
|               | `.page-subtitle`       | Beskrivning under rubrik (text-base, gray-600) |
| **Stats**     | `.stats-box`           | Statistik-box container                        |
|               | `.stats-number`        | Siffra i stats (text-2xl, bold, grön)          |
|               | `.stats-label`         | Label i stats (text-xs, gray-600)              |
| **Knappar**   | `.btn-primary`         | Primär knapp (grön bakgrund, vit text)         |
|               | `.btn-secondary`       | Sekundär knapp (vit bakgrund, grön border)     |
|               | `.btn-outline`         | Outline-knapp (grå border)                     |
|               | `.action-btn`          | Åtgärdsknappar i tabeller (diskreta ikoner)    |
| **Tabeller**  | `.table-wrapper`       | Tabell-container (rounded, shadow, border)     |
|               | `.table-header`        | Thead (bg-[#2c7a4c])                           |
|               | `.table-row-even`      | Jämna rader (bg-white)                         |
|               | `.table-row-odd`       | Udda rader (bg-gray-50)                        |
|               | `.table-cell`          | Td (py-2.5, px-4, text-sm)                     |
| **Formulär**  | `.input-field`         | Input-fält (h-10, rounded, border)             |
|               | `.input-with-icon`     | Input med ikon (extra padding-left)            |
|               | `.select-field`        | Select dropdown                                |

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

- **Data-sidor (Hunddagis, Frisör, Owners, Ekonomi, etc):** `max-w-7xl` (1280px)
- **Admin-sidor:** `max-w-6xl` (1152px)
- **Form-sidor:** `max-w-3xl` (768px)

### Main wrapper:

- **Bakgrund:** `bg-gray-50` (ljusgrå, inte helt vit)
- **Padding:** `px-6 py-6` (24px horisontellt, 24px vertikalt)
- **Min-height:** `min-h-screen`

### ⚠️ KRITISKT - Container-alignment:

**ALLT innehåll måste börja vid EXAKT samma X-position:**

```tsx
// ✅ KORREKT struktur:
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <div className="border-b border-gray-200 bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Rubrik, undertext, stats */}
    </div>
  </div>

  {/* Main content */}
  <main className="max-w-7xl mx-auto px-6 py-6">
    {/* Knappar, filter, innehåll */}
    {/* INGET får ha extra wrapper med padding! */}
  </main>
</div>
```

**❌ FEL - Lägg INTE till extra padding-lager:**

```tsx
// ❌ FEL: Denna wrapper förskjuter innehållet
<main className="max-w-7xl mx-auto px-6 py-6">
  <div className="bg-white p-4">  {/* ❌ Extra padding! */}
    <input ... />
  </div>
</main>

// ✅ RÄTT: Inga extra lager
<main className="max-w-7xl mx-auto px-6 py-6">
  <input className="bg-white ..." />  {/* ✅ Direkt i main */}
</main>
```

---

## 🎨 Färgschema

### Primär grön (DogPlanner brand):

```
Namn:           #2c7a4c (rgb(44, 122, 76))
Hover/Darker:   #236139 (rgb(35, 97, 57))
Ljus bakgrund:  #E6F4EA (rgb(230, 244, 234))
```

### Använd i:

- ✅ Rubriker (h1, h2)
- ✅ Primära knappar
- ✅ Tabell-headers
- ✅ Active-states
- ✅ Links
- ✅ Accent-linjer

### Grå-skala:

```
Text mörk:      #333333 (rgb(51, 51, 51))
Text ljus:      #666666 (rgb(102, 102, 102))
Text help:      #999999 (rgb(153, 153, 153))
Disabled:       #CCCCCC (rgb(204, 204, 204))
Border:         #E0E0E0 (rgb(224, 224, 224)) / border-gray-200
```

### Secondary färger:

```
Orange (badges): #FF9800 (rgb(255, 152, 0)) / bg-orange-100 text-orange-600
Röd (error):     #F44336 (rgb(244, 67, 54)) / bg-red-600
Grön (success):  #4CAF50 (rgb(76, 175, 80)) / text-green-600
Blå (links):     text-blue-600 hover:underline
```

### Bakgrunder:

```
Main bg:        #F5F5F5 (bg-gray-50) - ljusgrå sidebakgrund
Component bg:   #FFFFFF (bg-white) - vita kort/komponenter
Border:         border-gray-200 - ljusgrå ramar
Hover:          hover:bg-gray-100 - diskret hover-effekt
Hover (rows):   hover:bg-gray-100 - tabellrader
```

---

## 📝 Typografi

### Rubriker

#### H1 (Sidtitel)

```tsx
className = "text-[32px] font-bold text-[#2c7a4c] leading-tight";
```

- **Size:** 32px (exakt, ej text-3xl)
- **Weight:** font-bold (700)
- **Color:** #2c7a4c (grön)
- **Line-height:** leading-tight (1.25)
- **Margin:** Ingen top-margin

**Exempel:**

```tsx
<h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
  Hunddagis
</h1>
```

#### H1 Undertext (beskrivning under rubrik)

```tsx
className = "mt-1 text-base text-gray-600";
```

- **Size:** text-base (16px)
- **Weight:** normal (400)
- **Color:** text-gray-600 (#666666)
- **Margin-top:** mt-1 (4px)

**Exempel:**

```tsx
<p className="mt-1 text-base text-gray-600">
  Översikt över fakturor, betalningar och ekonomisk status
</p>
```

#### H2 (Sektionsrubrik)

```tsx
className = "text-lg font-semibold text-[#2c7a4c]";
```

- **Size:** text-lg (18px)
- **Weight:** font-semibold (600)
- **Color:** #2c7a4c (grön)

#### H3 (Underrubrik)

```tsx
className = "text-base font-semibold text-gray-900";
```

- **Size:** text-base (16px)
- **Weight:** font-semibold (600)
- **Color:** text-gray-900 (#111111)

### Body text

#### Primär text (brödtext)

```tsx
className = "text-base text-gray-600";
```

- **Size:** 16px
- **Weight:** normal (400)
- **Color:** #666666

#### Sekundär text (labels, metadata)

```tsx
className = "text-sm text-gray-600";
```

- **Size:** 14px
- **Weight:** normal (400)
- **Color:** #666666

#### Small text (hjälptext, badges)

```tsx
className = "text-xs text-gray-600";
```

- **Size:** 12px
- **Weight:** normal (400)
- **Color:** #666666

#### Table header text

```tsx
className = "text-sm font-semibold text-white";
```

- **Size:** 14px
- **Weight:** font-semibold (600)
- **Color:** text-white (på grön bakgrund)

#### Table cell text

```tsx
className = "text-sm text-[#333333]";
```

- **Size:** 14px
- **Weight:** normal (400)
- **Color:** #333333 (mörkgrå, ej text-gray-900!)

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
  <main className="max-w-7xl mx-auto px-6 py-6">{/* Content */}</main>
</div>
```

### Key spacing values (exakta mått):

**Container padding:**

```
px-6        = 24px (horisontell padding, ALLTID samma)
py-4        = 16px (header vertikal padding)
py-6        = 24px (main content vertikal padding)
```

**Element spacing:**

```
gap-2       = 8px  (mellan små element)
gap-3       = 12px (mellan knappar/badges)
gap-4       = 16px (mellan större element)
gap-6       = 24px (mellan sektioner)

mb-4        = 16px (bottom margin mellan komponenter)
mb-6        = 24px (bottom margin mellan stora sektioner)

mt-1        = 4px  (mellan rubrik och undertext)
mt-2        = 8px  (mellan närliggande element)
```

**Component padding (exakta mått):**

```
Buttons:     px-4 py-2.5     = 16px x 10px
Inputs:      px-4 (höjd h-10) = 16px x 40px total höjd
Table cells: px-4 py-2.5     = 16px x 10px (VIKTIGT: py-2.5, ej py-4!)
Cards:       p-4 / p-5       = 16px / 20px all around
```

**Element heights (exakta mått):**

```
h-10        = 40px  (buttons, inputs, selects - STANDARD)
h-9         = 36px  (kompakta knappar)
```

### Borders:

```
border              = 1px (ALDRIG border-2 på inputs/selects!)
border-gray-200     = #E5E7EB (ljusgrå)
border-gray-300     = #D1D5DB (lite mörkare för inputs)
rounded-md          = 6px border radius
rounded-lg          = 8px border radius (kort, modaler)
```

### Shadows:

```
shadow-sm           = Subtil skugga för kort
shadow-xl           = Djupare skugga för modaler
hover:shadow-xl     = Hover-effekt på kort
```

---

## 🧩 Komponenter

### 1. HEADER (Sidrubrik-sektion)

**Struktur:**

```tsx
<div className="border-b border-gray-200 bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {/* Rubrik */}
        <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
          Sidans titel
        </h1>
        {/* Undertext */}
        <p className="mt-1 text-base text-gray-600">Beskrivning av sidan</p>
      </div>

      {/* Statistik-boxar (valfritt) */}
      <div className="flex items-center gap-4 ml-8">
        <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-[#2c7a4c]">42</p>
          <p className="text-xs text-gray-600 mt-0.5">Label</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Mått:**

- Container: `max-w-7xl mx-auto px-6 py-4`
- Rubrik: `text-[32px]` (32px, exakt!)
- Undertext: `mt-1 text-base` (4px margin, 16px text)
- Stats-boxar: `px-4 py-2` padding
- Gap mellan stats: `gap-4` (16px)

---

### 2. PRIMARY BUTTON (Primär knapp)

```tsx
<button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2">
  <Plus className="h-4 w-4 mr-2" />
  Knapptext
</button>
```

**Mått:**

- Padding: `px-4 py-2.5` (16px x 10px)
- Text: `text-[15px] font-semibold` (15px, semibold)
- Border-radius: `rounded-md` (6px)
- Icon: `h-4 w-4 mr-2` (16px icon, 8px margin)
- **Focus ring:** `focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2`

---

### 3. SECONDARY BUTTON (Sekundär knapp)

```tsx
<button className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2">
  Knapptext
</button>
```

**Mått:** Samma som primary, men annan färgschema.

---

### 4. INPUT FIELD (Textfält)

```tsx
<input
  type="text"
  placeholder="Placeholder..."
  className="w-full h-10 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white"
/>
```

**Mått:**

- Höjd: `h-10` (40px - STANDARD)
- Padding: `px-4` (16px horisontellt)
- Text: `text-base` (16px)
- Border: `border` (1px, ALDRIG border-2!)
- Border-color: `border-gray-300`
- **Focus ring:** `focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent`

---

### 5. SELECT DROPDOWN

```tsx
<select className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 text-base bg-white">
  <option value="all">Alla status</option>
</select>
```

**Mått:**

- Höjd: `h-10` (40px)
- Padding: `px-3` (12px, lite mindre än input)
- Border: `border` (1px, ej border-2!)
- **Focus ring:** `focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2`

---

### 6. TABLE (Datatabell)

**Table structure:**

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-[#2c7a4c]">
      <tr>
        <th className="px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#236139] cursor-pointer transition-colors">
          Kolumnnamn
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr
          key={row.id}
          className={`cursor-pointer transition-colors ${
            index % 2 === 0
              ? "bg-white hover:bg-gray-100"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <td className="px-4 py-2.5 text-sm text-[#333333]">Cellinnehåll</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Mått:**

- **Table header:**
  - Background: `bg-[#2c7a4c]` (grön)
  - Text: `text-sm font-semibold text-white` (14px, semibold, vit)
  - Padding: `px-4 py-2.5` (16px x 10px)
  - Hover: `hover:bg-[#236139]` (mörkare grön)

- **Table cells:**
  - Padding: `px-4 py-2.5` (16px x 10px - VIKTIGT: py-2.5, ej py-4!)
  - Text: `text-sm text-[#333333]` (14px, mörkgrå)
- **Table rows:**
  - Alternerande: `index % 2 === 0 ? "bg-white" : "bg-gray-50"`
  - Hover: `hover:bg-gray-100` (BÅDA radtyper)

- **Table action buttons (Åtgärdskolumn):**

Åtgärdsknappar i tabeller ska vara enkla ikonknappar med outline-stil:

```tsx
{
  /* Redigera-knapp */
}
<button
  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
  title="Redigera"
>
  <Pencil className="h-5 w-5" />
</button>;

{
  /* Ta bort-knapp */
}
<button
  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
  title="Ta bort"
>
  <Trash2 className="h-5 w-5" />
</button>;
```

**Mått för åtgärdsknappar:**

- Padding: `p-2` (8px)
- Icon-storlek: `h-5 w-5` (20px)
- Färg: `text-gray-400` (ljusgrå, diskret)
- Hover: `hover:text-gray-600` (mörkare grå vid hover)
- Stil: **Ingen bakgrund, ingen border** - endast ikon
- Inga färgade ikoner (ej grön/röd) - håll det neutralt och cleant

**Åtgärdskolumn i tabell:**

```tsx
<th className="px-4 py-2.5 text-left text-sm font-semibold text-white">
  Åtgärder
</th>

<td className="px-4 py-2.5">
  <div className="flex items-center gap-1">
    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Redigera">
      <Pencil className="h-5 w-5" />
    </button>
    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Ta bort">
      <Trash2 className="h-5 w-5" />
    </button>
  </div>
</td>
```

---

### 7. CARD (Informationskort)

```tsx
<Card className="hover:shadow-xl transition-all duration-300 border border-gray-200">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg flex items-center gap-2 mb-2">
      <Icon className="h-5 w-5 text-[#2c7a4c]" />
      Titel
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">{/* Innehåll */}</CardContent>
</Card>
```

**Mått:**

- Border: `border border-gray-200`
- Hover: `hover:shadow-xl transition-all duration-300`
- CardHeader padding: `pb-4` (16px bottom)
- CardContent spacing: `space-y-4` (16px mellan barn)

---

### 8. BADGE (Status-badge)

```tsx
<Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
  Status
</Badge>
```

**Mått:**

- Text: `text-xs` (12px)
- Padding: `px-2 py-0.5` (8px x 2px)
- Border-radius: `rounded-full`

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

````

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
````

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
