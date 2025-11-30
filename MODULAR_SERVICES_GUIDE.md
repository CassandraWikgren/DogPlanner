# 📋 Modulärt Tjänstesystem - Komplett Guide

## 🎯 Översikt

DogPlanner har nu ett fullt fungerande modulärt tjänstesystem som låter företag välja vilka tjänster de vill erbjuda:

- **🐕 Hunddagis** (daycare)
- **🏨 Hundpensionat** (boarding)
- **✂️ Hundfrisör** (grooming)

Ett hundtrim som bara erbjuder grooming behöver inte se dagis- eller pensionatsfunktioner alls.

---

## 🏗️ Systemarkitektur

### 1. Databas (Supabase)

**Tabell:** `orgs`  
**Kolumn:** `enabled_services TEXT[]`  
**Default:** `['daycare', 'boarding', 'grooming']`  
**Index:** GIN index för snabba array-queries

**Migration:** `/supabase/migrations/ADD_ENABLED_SERVICES.sql`

```sql
ALTER TABLE orgs
ADD COLUMN IF NOT EXISTS enabled_services TEXT[]
DEFAULT ARRAY['daycare', 'boarding', 'grooming'];

CREATE INDEX IF NOT EXISTS idx_orgs_enabled_services
ON orgs USING GIN (enabled_services);
```

---

### 2. Hook - useEnabledServices

**Fil:** `/lib/hooks/useEnabledServices.ts`

**Funktionalitet:**

- Läser `enabled_services` från `orgs`-tabellen baserat på `currentOrgId`
- Returnerar boolean-flaggor: `hasDaycare`, `hasBoarding`, `hasGrooming`
- Har loading-state och refresh-funktion
- Fallback till alla tjänster vid fel (för bakåtkompatibilitet)

**Användning:**

```tsx
import { useEnabledServices } from "@/lib/hooks/useEnabledServices";

const { hasDaycare, hasBoarding, hasGrooming, loading } = useEnabledServices();
```

---

### 3. Guard-komponenter

**Fil:** `/components/ServiceGuard.tsx`

Tre varianter av guards för konditionell rendering:

#### a) ServiceGuard - Kräver EN specifik tjänst

```tsx
<ServiceGuard service="grooming">
  <Link href="/frisor">Hundfrisör</Link>
</ServiceGuard>
```

#### b) AnyServiceGuard - Kräver MINST EN av flera tjänster

```tsx
<AnyServiceGuard services={["daycare", "boarding"]}>
  <Link href="/admin/rum">Rumhantering</Link>
</AnyServiceGuard>
```

#### c) AllServicesGuard - Kräver ALLA angivna tjänster

```tsx
<AllServicesGuard services={["daycare", "boarding", "grooming"]}>
  <div>Premium-funktion för alla tre tjänster</div>
</AllServicesGuard>
```

---

### 4. Inställningssida

**Fil:** `/app/admin/tjanster/page.tsx`

**URL:** `/admin/tjanster`

**Funktioner:**

- Visuell toggle för varje tjänst
- Priskalkylator som visar månadskostnad baserat på val
- Automatisk siduppdatering efter sparande (refresh-funktion)
- Sparar direkt till `orgs.enabled_services`

**Prissättning:**

- Frisör: 299 kr/mån
- Dagis: 399 kr/mån
- Pensionat: 399 kr/mån
- 2 tjänster: 599 kr/mån (rabatt)
- Alla 3: 799 kr/mån (maxrabatt)

---

## 🧭 Smart Routing

### Dashboard Auto-redirect

**Fil:** `/app/dashboard/page.tsx`

**Logik:**
När användaren har **endast EN aktiverad tjänst**, redirectas de automatiskt till den tjänstens huvudsida:

```tsx
useEffect(() => {
  const enabledCount = [hasDaycare, hasBoarding, hasGrooming].filter(
    Boolean
  ).length;

  if (enabledCount === 1) {
    if (hasGrooming) router.replace("/frisor");
    else if (hasDaycare) router.replace("/hunddagis");
    else if (hasBoarding) router.replace("/hundpensionat");
  }
}, [hasDaycare, hasBoarding, hasGrooming]);
```

**Resultat:**

- Företag med bara frisör → direkt till `/frisor`
- Företag med alla tre → stannar på dashboard med alla modulkort synliga

---

## 🎨 UI-implementering

### 1. Navbar (Mobilmeny)

**Fil:** `/components/Navbar.tsx`

Länkar döljs konditionellt:

```tsx
{
  hasDaycare && <Link href="/hunddagis">Hunddagis</Link>;
}
{
  hasBoarding && <Link href="/hundpensionat">Hundpensionat</Link>;
}
{
  hasGrooming && <Link href="/frisor">Hundfrisör</Link>;
}
```

### 2. Dashboard Modulkort

**Fil:** `/app/dashboard/page.tsx`

Endast aktiverade tjänster visas som klickbara kort.

### 3. Admin-sidan

**Fil:** `/app/admin/page.tsx`

Priskort för varje tjänst använder `<ServiceGuard>`:

```tsx
<ServiceGuard service="daycare">
  <Link href="/admin/priser/dagis">
    <div>Priser - Hunddagis</div>
  </Link>
</ServiceGuard>
```

### 4. Dashboard Widgets

**Fil:** `/components/DashboardWidgets.tsx`

Statistik-widgets visas konditionellt:

- **Hunddagis-widget** - endast om `hasDaycare === true`
- **Pensionat-widgets** (4 st) - endast om `hasBoarding === true`
- **Viktiga notiser** - visas alltid

### 5. Dagens Hundar Widget

**Fil:** `/components/DagensHundarWidget.tsx`

Visar incheckade pensionatshundar. Döljs helt om `hasBoarding === false`.

---

## 📊 Användningsexempel

### Scenario 1: Hundtrim (endast frisör)

**Inställningar i `/admin/tjanster`:**

- ❌ Hunddagis
- ❌ Hundpensionat
- ✅ Hundfrisör

**Resultat:**

1. Vid inloggning → automatisk redirect till `/frisor`
2. Navbar: Visar bara "Dashboard", "Hundfrisör", "Admin"
3. Admin-sidan: Endast "Priser - Frisör" syns
4. Dashboard widgets: Endast viktiga notiser (allergier/mediciner)
5. Dagens hundar-widget: Dold

**Pris:** 299 kr/mån

---

### Scenario 2: Dagis + Pensionat

**Inställningar:**

- ✅ Hunddagis
- ✅ Hundpensionat
- ❌ Hundfrisör

**Resultat:**

1. Vid inloggning → stannar på dashboard (två tjänster = ingen auto-redirect)
2. Navbar: "Dashboard", "Hunddagis", "Hundpensionat", "Admin"
3. Dashboard: Två modulkort synliga
4. Admin-sidan: "Priser - Dagis" och "Priser - Pensionat"
5. Dashboard widgets: Hunddagis-stats + pensionat-stats

**Pris:** 599 kr/mån

---

### Scenario 3: Full service (alla tre)

**Inställningar:**

- ✅ Hunddagis
- ✅ Hundpensionat
- ✅ Hundfrisör

**Resultat:**

1. Dashboard visar alla tre modulkort
2. Navbar: Alla fyra länkar
3. Admin: Alla priskort synliga
4. Full funktionalitet

**Pris:** 799 kr/mån

---

## 🔧 Underhåll och utvidgning

### Lägga till en ny tjänst

1. **Databas:** Lägg till ny servicenyckel i `enabled_services`-arrayen
2. **Hook:** Uppdatera `useEnabledServices` med ny boolean
3. **Guards:** Lägg till ny service-typ i type definition
4. **UI:** Lägg till kort i `/admin/tjanster`
5. **Prissättning:** Uppdatera priskalkylatorn

### Rensa cache efter ändring

Om en användare ändrar sina tjänsteinställningar:

```tsx
const { refresh } = useEnabledServices();
await refresh(); // Hämtar nya inställningar från DB
```

Detta görs automatiskt i `/admin/tjanster` efter save.

---

## ✅ Checklista för testning

- [ ] Skapa testkonto och sätt endast "grooming"
- [ ] Verifiera auto-redirect till `/frisor`
- [ ] Kontrollera att navbar inte visar dagis/pensionat
- [ ] Öppna `/admin` och kolla att bara frisör-priskort syns
- [ ] Gå till `/admin/tjanster` och aktivera pensionat
- [ ] Verifiera att sidan refreshas automatiskt
- [ ] Kontrollera att pensionat-kort nu syns
- [ ] Testa med alla tre tjänster aktiverade
- [ ] Verifiera priskalkulator visar rätt belopp

---

## 🎯 Framtida förbättringar

1. **Stripe-integration:** Dynamisk prissättning baserat på `enabled_services`
2. **Onboarding:** Tjänsteval vid registrering
3. **Analytics:** Spåra vilka tjänster som är populärast
4. **Migrations:** Auto-migration för gamla konton till new default
5. **Email-notiser:** Vid tjänsteändring

---

## 📝 Tekniska detaljer

**Bakåtkompatibilitet:** ✅  
Gamla konton utan `enabled_services` får automatiskt default-värdet (alla tre tjänster).

**Performance:**  
GIN index på `enabled_services` gör queries snabba även med tusentals organisationer.

**Type safety:**  
Full TypeScript-support genom hela kedjan från DB till UI.

**Testing:**  
Manuell testning genomförd. Automatiserade tester kan läggas till med Playwright.

---

## 🚀 Deployment

Systemet är live efter:

1. SQL-migration körts i Supabase (`ADD_ENABLED_SERVICES.sql`)
2. Kod pushad till GitHub
3. Vercel auto-deploy slutförd

**Status:** ✅ Deployed och produktionsklar

---

**Skapad:** 2025-11-30  
**Senast uppdaterad:** 2025-11-30  
**Version:** 1.0
