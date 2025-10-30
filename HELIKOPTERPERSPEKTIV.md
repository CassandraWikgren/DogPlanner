# 🚁 HELIKOPTERPERSPEKTIV - DogPlanner

_Skapad: 31 oktober 2025_

## 📊 NUVARANDE STATUS

### ✅ VAD SOM FINNS OCH FUNGERAR BRA

#### **Struktur & Navigation**

- ✅ **Landing page** (app/page.tsx) - Proffsig, tydlig, med Hero-bild och CTA
- ✅ **Dashboard** (app/dashboard/page.tsx) - Central nav-hub med 4 huvudkort
- ✅ **Navbar** - Konsekvent design, mobil-meny, notifikationer
- ✅ **Auth-system** - Inloggning, registrering, lösenordsåterställning
- ✅ **Subscription-sida** - Nyligen omgjord, ser proffsig ut

#### **Huvudfunktioner (3 tjänster)**

1. **Hunddagis** (/hunddagis) - ✅ Komplett med:

   - Hundlista med filter/sök
   - Rumshantering och beläggningsöversikt
   - Jordbruksverket-beräkningar
   - PDF-export
   - Incheckning/utcheckning

2. **Hundpensionat** (/hundpensionat) - ✅ Komplett med:

   - Bokningsöversikt
   - Status-hantering (bekräftad/väntande/avslutad)
   - Statistik
   - Filter och sök

3. **Hundfrisör** (/frisor) - ✅ Komplett med:
   - Bokningar
   - Journal för klippningar
   - Prishantering

#### **Admin & Stödfunktioner**

- ✅ **Admin-hub** (/admin) - Navigering till alla admin-funktioner
- ✅ **Ekonomi** (/ekonomi) - Fakturering och betalningar
- ✅ **Kundregister** (/owners) - Hundägare med sök/filter/export
- ✅ **Företagsinformation** (/foretagsinformation) - Företagsdata och inställningar
- ✅ **Abonnemang** (/subscription) - Hantera DogPlanner-abonnemang

---

## ⚠️ VAD SOM SAKNAS ELLER INTE FUNGERAR

### 🔴 KRITISKA PROBLEM

#### 1. **BRUTNA LÄNKAR - Dashboard länkar till sidor som inte finns!**

- ❌ `/admin/priser/dagis` - Finns INTE
- ❌ `/admin/priser/pensionat` - Finns INTE
- ❌ `/admin/priser/frisor` - Finns INTE
- ❌ `/admin/users` - Finns INTE (användarhantering)

**Konsekvens:** Användare klickar på Admin-sidan och får 404-fel → dålig UX!

#### 2. **SAKNADE SIDOR FÖR PRIS-HANTERING**

Admin-sidan har länkar till 3 prissidor som inte existerar:

- `/admin/priser/dagis` - Ska hantera dagisabonnemang-priser
- `/admin/priser/pensionat` - Ska hantera pensionatspriser
- `/admin/priser/frisor` - Ska hantera frisörpriser

**Nuläge:** Priserna finns hårdkodade i lib/pricing.ts men ingen UI för att ändra dem!

#### 3. **SAKNAD ANVÄNDARHANTERING**

- ❌ `/admin/users` finns inte
- Ingen möjlighet att lägga till personal (staff, groomer)
- Ingen rollhantering i UI
- Admin kan inte bjuda in kollegor

#### 4. **INKONSEKVENT NAVIGATION**

- Dashboard har 4 kort men Admin-sidan har 7 kort
- Vissa funktioner (Owners, Ekonomi) nås från BÅDE Dashboard och Admin
- Oklart var man ska klicka för att hitta saker
- Ingen "Tillbaka till Dashboard"-knapp på alla sidor

---

### 🟡 FÖRBÄTTRINGSOMRÅDEN

#### **Navigation & UX**

1. **Dashboard borde ha ALLA funktioner synliga**

   - Nu: Owners, Ekonomi, Subscription är "gömda" i Admin
   - Bättre: Lägg ut ALLA funktioner direkt på Dashboard
   - Eller: Gör en sidomeny (sidebar) med allt synligt

2. **Breadcrumbs saknas**

   - Svårt att veta var man är i hierarkin
   - Exempel: Dashboard > Admin > Priser > Hunddagis
   - Lägg till breadcrumbs överst på alla sidor

3. **Snabbnavigering saknas**

   - Ingen "Dagens vy" eller "Snabbåtkomst"
   - Inget dashboard med dagens incheckning/bokningar på framsidan

4. **Mobil-navigation kan förbättras**
   - Hamburgermenyn är bra men innehåller inga nav-länkar till sidor
   - Den visar bara användarinfo och "logga ut"
   - Borde ha länkar till alla huvudfunktioner

#### **Design & Layout**

1. **Navbar tar för mycket plats** (80px med logo + padding)

   - Mindre logo (50px istället för 70px)?
   - Eller sticky navbar som krymper vid scroll?

2. **Inconsistent spacing**

   - Dashboard: py-12 (48px)
   - Hunddagis: kompakt layout med lite spacing
   - Hundpensionat: generöst med luft
   - → Standardisera spacing mellan sidor

3. **Hero-section på Dashboard är onödig**

   - Tar 220px vertikal plats
   - Användaren är redan inloggad, behöver inte "Välkommen"-text
   - Bättre: Kompakt header med dagens statistik

4. **Färgschema inte 100% konsekvent**
   - Landing page: Modern grön (#2c7a4c) ✅
   - Dashboard: Gradient grön-till-vit ✅
   - Navbar: Grön (#2c7a4c) ✅
   - Men vissa sidor använder Radix/ShadCN default-färger

#### **Funktionalitet**

1. **Rum-hantering finns INTE i UI**

   - Det finns `/rooms` men ingen länk till den!
   - Användaren kan inte skapa/redigera rum
   - Rummen används i Hunddagis men hur lägger man till nya?

2. **Kundrabatter-sida saknas funktion**

   - `/kundrabatter` finns men verkar inte göra något
   - Ingen prisstruktur för rabatter

3. **PDF-export finns men kunde vara bättre**

   - Funkar på Hunddagis och Owners
   - Men design på PDF kunde vara snyggrare
   - Saknar företagets logo i PDF

4. **Notifikationer finns men ingen historik**

   - NotificationDropdown visar live-notiser
   - Men ingen sida för att se gamla notifikationer

5. **Statistik/Dashboard-widgets saknas**
   - Ingen översikt med "Dagens läge"
   - Ingen graf över bokningar/intäkter över tid
   - Ingen "Kommande 7 dagar"-vy

#### **Tekniska förbättringar**

1. **Prishantering är hårdkodad**

   - lib/pricing.ts har alla priser
   - Men ingen databas-tabell för priser
   - Om man vill ändra pris måste man ändra kod!

2. **Roller fungerar i backend men inte i UI**

   - AuthContext har `role` men den används inte mycket
   - Admin-sidor saknar rollkontroll
   - Personal borde ha begränsad åtkomst

3. **Test-sidor finns kvar**
   - `/test-vercel`, `/test-simple`, `/auth-debug`
   - Borde tas bort eller göras privata

---

## 🎯 PRIORITERAD ÅTGÄRDSLISTA

### **🔥 AKUT (gör först)**

1. ✅ **Skapa saknade prissidor**

   - `/admin/priser/dagis/page.tsx`
   - `/admin/priser/pensionat/page.tsx`
   - `/admin/priser/frisor/page.tsx`
   - Möjlighet att redigera priser i UI

2. ✅ **Skapa användarhantering**

   - `/admin/users/page.tsx`
   - Lista användare, bjud in nya, hantera roller

3. ✅ **Länka Rum-hantering**
   - Lägg till länk till `/rooms` från Dashboard eller Admin
   - Eller integrera rumhantering direkt i Hunddagis-sidan

### **🟢 VIKTIGT (nästa steg)**

4. ✅ **Förbättra Dashboard**

   - Ta bort stor Hero-section
   - Lägg till "Dagens läge"-widget med statistik
   - Visa dagens incheckning/bokningar direkt på Dashboard

5. ✅ **Lägg till breadcrumbs**

   - Överst på varje sida utom landing page
   - Dashboard > Admin > Ekonomi osv

6. ✅ **Förbättra mobilmeny**

   - Lägg till navigeringslänkar i hamburgermenyn
   - Hunddagis, Pensionat, Frisör, Admin osv

7. ✅ **Standardisera layout och spacing**
   - Alla sidor ska ha samma header-struktur
   - Samma spacing (max-w-7xl, px-6, py-8)
   - Samma kort-design (rounded-xl, shadow-sm, hover:shadow-md)

### **🔵 BRA ATT HA (senare)**

8. ⏳ **Skapa Dagens-vy**

   - `/dagens` - Dagens incheckning, bokningar, uppgifter
   - Snabb överblick för daglig användning

9. ⏳ **Förbättra Statistik**

   - Graf över bokningar/intäkter
   - "Kommande vecka"-översikt
   - Export av rapporter

10. ⏳ **Kundportal-integration**

    - Det finns `/kundportal` men är det klart?
    - Kolla om kunderna kan logga in och boka själva

11. ⏳ **Förbättra PDF-design**

    - Lägg till företagets logo
    - Bättre typografi och spacing
    - Färgschema från DogPlanner

12. ⏳ **Rensa test-sidor**
    - Ta bort `/test-*` och `/auth-debug`
    - Eller gör dem tillgängliga endast för admins

---

## 🗺️ SITEMAP - Fullständig översikt

```
/ (Landing page - endast utloggade)
├── /login
├── /register
└── /reset-password

/dashboard (Inloggad startsida)
├── /hunddagis (Dagishantering)
├── /hundpensionat (Pensionatshantering)
├── /frisor (Frisörhantering)
└── /admin (Admin-hub)
    ├── /ekonomi (Fakturor)
    ├── /admin/priser/dagis ❌ SAKNAS
    ├── /admin/priser/pensionat ❌ SAKNAS
    ├── /admin/priser/frisor ❌ SAKNAS
    ├── /foretagsinformation (Företagsdata)
    ├── /owners (Kundregister)
    ├── /admin/users ❌ SAKNAS
    └── /subscription (DogPlanner-abonnemang)

/rooms ⚠️ INGEN LÄNK TILL DEN
/kundrabatter ⚠️ OKLART SYFTE
/kundportal ⚠️ KOLLA STATUS
```

---

## 💡 DESIGN-PRINCIPER SOM FÖLJS

### ✅ Vad som är bra:

- **Grön färg (#2c7a4c)** - Konsekvent varumärke
- **Enkel typografi** - Bra läsbarhet
- **Kort-baserad layout** - Tydliga sektioner
- **Ikoner** - Visuellt tydligt (🐕, 🏨, ✂️)
- **Responsiv design** - Fungerar på mobil
- **Hover-effekter** - Bra feedback

### ⚠️ Kan förbättras:

- **Spacing** - Variera för mycket mellan sidor
- **Hero-sections** - Tar för mycket plats när inloggad
- **Navigationsstruktur** - Lite rörig, svårt hitta saker
- **Färgkonsistens** - Vissa komponenter använder default Radix-färger

---

## 🎨 DESIGNFÖRSLAG

### Alternativ 1: **Sidebar Navigation** (Mest proffsigt)

```
┌─────────────────────────────────────┐
│ [Logo] DogPlanner     👤 [User] →  │ ← Sticky Navbar (mindre)
├────────┬────────────────────────────┤
│ 🏠 Hem │                            │
│ 🐕 Dagis│   MAIN CONTENT            │
│ 🏨 Pens.│   (Dagens läge, stats)    │
│ ✂️ Frisör│                           │
│ 👥 Kunder│                           │
│ 💰 Ekonomi│                          │
│ ⚙️ Admin│                            │
└────────┴────────────────────────────┘
```

**Fördelar:**

- Allt synligt hela tiden
- Mindre klick för att navigera
- Modernare design
- Mer utrymme för innehåll

### Alternativ 2: **Förbättrad kort-baserad Dashboard** (Enklare att implementera)

```
┌─────────────────────────────────────┐
│ [Big Logo] DogPlanner  👤 [User] →  │ ← Navbar
├─────────────────────────────────────┤
│ 📊 DAGENS LÄGE                      │ ← Widget-sektion
│ 5 incheckning · 3 utcheckning · 2  │
│ pensionsbokningar idag              │
├─────────────────────────────────────┤
│ [Hunddagis] [Pensionat] [Frisör]   │ ← 3 huvudkort
│                                     │
│ [Kunder] [Ekonomi] [Admin]          │ ← 3 stödkort
└─────────────────────────────────────┘
```

**Fördelar:**

- Snabbare att bygga
- Känns igen (nuvarande struktur)
- Kan lägga till statistik-widget enkelt

---

## 🚀 SAMMANFATTNING - VAD SOM BÖR GÖRAS NU

### Omedelbart (1-2 timmar):

1. ✅ Skapa 3 prissidor (`/admin/priser/*/page.tsx`)
2. ✅ Skapa användarhantering (`/admin/users/page.tsx`)
3. ✅ Länka Rum-hantering på Admin eller Dashboard

### Kort sikt (3-5 timmar):

4. ✅ Förbättra Dashboard med statistik-widget
5. ✅ Lägg till breadcrumbs på alla sidor
6. ✅ Förbättra mobilmeny med navigationslänkar
7. ✅ Standardisera spacing och layout

### Medellång sikt (1-2 dagar):

8. ⏳ Skapa "Dagens vy" med dagens läge
9. ⏳ Implementera sidebar-navigation (om ni vill)
10. ⏳ Förbättra statistik med grafer

---

## ✨ SLUTSATS

**DogPlanner har en solid grund!** 🎉

- ✅ Tekniken fungerar (Next.js, Supabase, Auth)
- ✅ Design är proffsig och konsekvent
- ✅ De 3 huvudfunktionerna (Dagis, Pensionat, Frisör) är kompletta

**Men det saknas:**

- 🔴 4 viktiga sidor (3 prissidor + användarhantering)
- 🟡 Navigation kunde vara tydligare
- 🟡 Dashboard kunde vara mer informativ

**Rekommendation:** Börja med att fixa de 3-4 saknade sidorna (kritiska 404-fel), sedan förbättra Dashboard och navigation för bättre användarupplevelse.

---

_🐕 Gjord med kärlek för DogPlanner - låt oss göra denna app world-class!_
