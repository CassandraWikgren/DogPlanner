# 🔍 Hundpensionat Bokningssystem - Audit Rapport

**Datum:** 6 December 2025  
**Status:** ⚠️ KRITISKA BUGGAR FUNNA - Kräver åtgärd

---

## 📋 Sammanfattning

Genomgång av hela hundpensionat-bokningssystemet har slutförts. **FLERA KRITISKA BUGGAR hittades** som påverkar prisberäkning och organisationshantering.

### Granskade områden:

1. ✅ Databasschema (`bookings`, `boarding_prices`, `boarding_seasons`, `special_dates`)
2. ✅ API-endpoints (`/api/bookings/approve`, `/api/bookings/cancel`)
3. ⚠️ Frontend-sidor (`hundpensionat/`, `nybokning/`, `ansokningar/`) - **BUGGAR FUNNA**
4. ⚠️ Prisberäkningslogik (`lib/boardingPriceCalculator.ts`) - **ANVÄNDS INTE!**
5. ✅ Faktura-triggers (`create_prepayment_invoice`, `create_invoice_on_checkout`)

---

## 🚨 KRITISKA BUGGAR - MÅSTE FIXAS

### 1. Hårdkodat pris i nybokning (KRITISK)

**Fil:** `app/hundpensionat/nybokning/page.tsx` (rad 188-189)

**Problem:**

```typescript
const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
const basePrice = diffDays * 500; // ⚠️ HÅRDKODAT 500 kr/natt!
```

Prisberäkningen använder ett **hårdkodat pris på 500 kr/dag** istället för att hämta från `boarding_prices`-tabellen. Detta innebär:

- ❌ Ignorer priser som administratör ställt in
- ❌ Ignorer hundstorlek (small/medium/large)
- ❌ Ignorer helgtillägg
- ❌ Ignorer specialdatum
- ❌ Ignorer säsongsmultiplikatorer

**Lösning:** Integrera `lib/boardingPriceCalculator.ts` eller `lib/pricing.ts`

---

### 2. Hårdkodad org_id (KRITISK)

**Fil:** `app/hundpensionat/bokningsformulär/page.tsx` (rad 50-51)

**Problem:**

```typescript
const org = { id: "default-org-uuid", vat_included: true, vat_rate: 0.25 };
const branch = { id: "default-branch-uuid" };
```

Detta är en **hårdkodad org_id** som inte finns i databasen. Sidan kommer inte fungera för någon verklig organisation.

**Lösning:** Använd `useAuth()` hook och `currentOrgId`

---

### 3. Två parallella prisberäkningssystem (FÖRVIRRING)

**Problem:** Det finns två olika prisberäkningsfiler:

| Fil                              | Användning                  | Kvalitet                 |
| -------------------------------- | --------------------------- | ------------------------ |
| `lib/boardingPriceCalculator.ts` | **ANVÄNDS INTE!**           | ✅ Välskriven, typesafe  |
| `lib/pricing.ts`                 | Används av bokningsformulär | ⚠️ Äldre, annan struktur |

`boardingPriceCalculator.ts` är väl dokumenterad och korrekt men används aldrig!

**Lösning:** Konsolidera till EN prisberäkningslösning

---

## ✅ Tidigare Bugg - REDAN FIXAD

### `amount` GENERATED COLUMN

**Problem som FANNS (nu fixat):**
Gamla SQL-filer (`FORCE_UPDATE_TRIGGERS.sql`, `ULTRA_FIX_CHECKOUT.sql`) innehöll INSERT-statements som skrev till `amount`-kolumnen.

**Lösning som REDAN APPLICERATS:**
`FINAL_FIX_GENERATED_COLUMN.sql` kördes 2 Dec 2025 och fixade triggarna.

**Verifiering:**

```json
{
  "status": "KLART!",
  "info": "Funktioner uppdaterade - amount beräknas automatiskt från qty * unit_price"
}
```

---

## ✅ Fungerar Korrekt

### 1. Bokningsflöde (Delvis)

- ⚠️ Nybokning (`/hundpensionat/nybokning`) - **Bugg: Hårdkodat pris**
- ✅ Ansökningar (`/hundpensionat/ansokningar`) - Visar pending bokningar
- ✅ Godkännande via API (`/api/bookings/approve`) - Uppdaterar status, triggar faktura

### 2. Prisberäkning (`lib/boardingPriceCalculator.ts`) - **EJ ANVÄND**

Koden är korrekt men används aldrig:

- ✅ Grundpriser per hundstorlek (small/medium/large)
- ✅ Helgtillägg (fredag-söndag)
- ✅ Specialdatum (högsta prioritet, ersätter helgtillägg)
- ✅ Säsongsmultiplikator (appliceras alltid)
- ✅ Korrekt beräkning per natt

### 3. Databasrelationer

- ✅ `bookings.dog_id` → `dogs.id`
- ✅ `dogs.owner_id` → `owners.id`
- ✅ `bookings.room_id` → `rooms.id`
- ✅ `bookings.org_id` → `orgs.id`

### 4. Status-hantering

- ✅ `pending` - Ny ansökan
- ✅ `confirmed` - Godkänd (triggar förskottsfaktura)
- ✅ `checked_in` - Gäst har anlänt
- ✅ `checked_out` - Gäst utcheckad (triggar slutfaktura)
- ✅ `cancelled` - Avbokad

---

## 📁 Relevanta Filer

### Frontend

```
app/hundpensionat/
├── page.tsx              # Huvudsida med bokningsöversikt
├── nybokning/page.tsx    # Ny bokning
├── ansokningar/page.tsx  # Pending bokningar
├── kalender/page.tsx     # Kalendervy
├── aktiva-gaster/        # Incheckade gäster
└── priser/               # Prishantering
```

### API

```
app/api/bookings/
├── approve/route.ts      # Godkänn bokning
└── cancel/route.ts       # Avboka
```

### Bibliotek

```
lib/
├── boardingPriceCalculator.ts  # Prisberäkning
└── supabase-helpers.ts         # Databas-hjälpfunktioner
```

### SQL

```
FINAL_FIX_GENERATED_COLUMN.sql  # ✅ KÖRD 2 Dec 2025 - Korrekt trigger-kod i produktion
FORCE_UPDATE_TRIGGERS.sql       # ⚠️ DEPRECATED - Innehåller bugg, bör tas bort
ULTRA_FIX_CHECKOUT.sql          # ⚠️ DEPRECATED - Innehåller bugg, bör tas bort
```

---

## ✅ Säkerhet (RLS)

Row Level Security är aktiverat på alla kritiska tabeller:

- `bookings` - Policies: `bookings_select_by_org_or_owner`, `bookings_update_by_org_or_owner`, `bookings_public_insert`
- `dogs` - Policies: `dogs_select_by_org_or_owner`, `dogs_update_by_org_or_owner`
- `owners` - Policies: `owners_select_by_org_or_self`, `owners_update_by_org_or_self`
- `boarding_prices` - RLS aktiverat via `20251203_COMPLETE_RLS_FIX.sql`

---

## 🔧 Rekommenderade Förbättringar

### 🚨 KRITISKT (Måste fixas omedelbart)

1. **Fixa hårdkodat pris i `nybokning/page.tsx`:**
   - Ersätt `diffDays * 500` med anrop till `calculateBookingPrice()` från `boardingPriceCalculator.ts`
   - Eller integrera `lib/pricing.ts` som redan används av andra sidor

2. **Fixa hårdkodad org_id i `bokningsformulär/page.tsx`:**
   - Ersätt `{ id: "default-org-uuid" }` med `currentOrgId` från `useAuth()`

3. **Konsolidera prisberäkning:**
   - Välj EN av `boardingPriceCalculator.ts` eller `pricing.ts`
   - Radera eller deprecera den andra
   - Dokumentera vilken som är "source of truth"

### Kort sikt (bör fixas)

1. ~~**Kör `FIX_INVOICE_TRIGGERS_FINAL.sql`** i Supabase~~ ✅ REDAN KÖRTS (2 Dec 2025)
2. Ta bort eller arkivera de felaktiga SQL-filerna (`FORCE_UPDATE_TRIGGERS.sql`, `ULTRA_FIX_CHECKOUT.sql`)

### Medellång sikt (bra att ha)

1. Lägg till validering i frontend för att säkerställa att hundens mankhöjd finns
2. Lägg till automatisk e-postnotifikation vid statusändringar
3. Implementera beläggningsvy (rumskapacitet vs bokningar)

### Långsiktigt (robusthet)

1. Lägg till database-level constraints för att förhindra dubbelbokningar av rum
2. Implementera audit-logging för alla bokningsändringar
3. Skapa automatiserade tester för prisberäkningslogiken

---

## 📊 Tabellöversikt

### bookings

| Kolumn                  | Typ     | Beskrivning                                        |
| ----------------------- | ------- | -------------------------------------------------- |
| id                      | UUID    | Primärnyckel                                       |
| org_id                  | UUID    | FK → orgs                                          |
| dog_id                  | UUID    | FK → dogs                                          |
| owner_id                | UUID    | FK → owners                                        |
| room_id                 | UUID    | FK → rooms (nullable)                              |
| start_date              | DATE    | Incheckning                                        |
| end_date                | DATE    | Utcheckning                                        |
| status                  | TEXT    | pending/confirmed/checked_in/checked_out/cancelled |
| total_price             | DECIMAL | Totalpris                                          |
| discount_amount         | DECIMAL | Rabattbelopp                                       |
| prepayment_invoice_id   | UUID    | FK → invoices                                      |
| afterpayment_invoice_id | UUID    | FK → invoices                                      |

### boarding_prices

| Kolumn            | Typ     | Beskrivning        |
| ----------------- | ------- | ------------------ |
| id                | UUID    | Primärnyckel       |
| org_id            | UUID    | FK → orgs          |
| dog_size          | TEXT    | small/medium/large |
| base_price        | DECIMAL | Grundpris per natt |
| weekend_surcharge | DECIMAL | Helgtillägg        |
| is_active         | BOOLEAN | Aktiv/inaktiv      |

### boarding_seasons

| Kolumn           | Typ     | Beskrivning                    |
| ---------------- | ------- | ------------------------------ |
| id               | UUID    | Primärnyckel                   |
| org_id           | UUID    | FK → orgs                      |
| name             | TEXT    | Säsongsnamn                    |
| start_date       | DATE    | Startdatum                     |
| end_date         | DATE    | Slutdatum                      |
| price_multiplier | DECIMAL | Multiplikator (ex: 1.3 = +30%) |
| priority         | INTEGER | Prioritet vid överlapp         |
| is_active        | BOOLEAN | Aktiv/inaktiv                  |

### special_dates

| Kolumn          | Typ     | Beskrivning                  |
| --------------- | ------- | ---------------------------- |
| id              | UUID    | Primärnyckel                 |
| org_id          | UUID    | FK → orgs                    |
| date            | DATE    | Datum                        |
| name            | TEXT    | Namn (ex: "Midsommarafton")  |
| category        | TEXT    | red_day/holiday/event/custom |
| price_surcharge | DECIMAL | Pristillägg                  |
| is_active       | BOOLEAN | Aktiv/inaktiv                |

---

**Rapport genererad:** 6 December 2025
