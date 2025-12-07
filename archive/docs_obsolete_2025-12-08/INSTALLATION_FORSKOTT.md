# 🐾 DogPlanner - Installation av Förskotts-/Efterskottssystem

## 📋 Översikt

Detta system implementerar följande funktionalitet:

### Vad händer när:

**1. Kund ansöker om bokning (1-16 feb 2026)**

- Status: `pending`
- Bokning skapas med startdatum, slutdatum, hundinfo
- Kund kan vara ny (registrerar sig) eller befintlig (loggar in)

**2. Personal godkänner ansökan** ✅

- Status: `pending` → `confirmed`
- **FÖRSKOTTSFAKTURA SKAPAS AUTOMATISKT** 🎉
  - Innehåller: Rumspris + eventuella prepayment-tjänster
  - Förfallodatum: 14 dagar eller 3 dagar innan ankomst
  - Typ: `invoice_type = 'prepayment'`
- Kunden får faktura att betala

**3. Hund anländer (check-in)**

- Status: `confirmed` → `checked_in`
- Kontrollera att förskott är betalt (`prepayment_status = 'paid'`)

**4. Hund lämnar (check-out)**

- Status: `checked_in` → `checked_out`
- **EFTERSKOTTSFAKTURA SKAPAS AUTOMATISKT** 🎉
  - Innehåller: Endast tjänster markerade som `payment_type = 'afterpayment'`
  - Exempel: Kloklipp, bad, trimning
  - Typ: `invoice_type = 'afterpayment'`
- Kunden betalar efterskott direkt vid utcheckning

---

## 🚀 Installation

### Steg 1: Kör SQL-migreringen

1. Öppna **Supabase Dashboard**
2. Gå till **SQL Editor**
3. Klicka **New Query**
4. Kopiera HELA innehållet från filen:
   ```
   supabase/migrations/add_prepayment_system.sql
   ```
5. Klistra in i SQL Editor
6. Klicka **Run** (eller tryck Ctrl+Enter)

### Steg 2: Verifiera installation

Du borde se output som visar:

```
✅ Nya kolumner tillagda
✅ Triggers skapade
✅ Index tillagda
```

### Steg 3: Testa systemet

1. Gå till `/hundpensionat/ansokningar`
2. Godkänn en pending bokning
3. Du bör se meddelande: "📄 Förskottsfaktura skapad!"
4. Gå till `/ekonomi` - verifiera att fakturan finns där

---

## 📊 Nya Kolumner

### `invoices` tabellen:

- **`invoice_type`** (text):
  - `'prepayment'` = Förskottsfaktura (skapas vid godkännande)
  - `'afterpayment'` = Efterskottsfaktura (skapas vid utcheckning)
  - `'full'` = Komplett faktura (standard, för gamla fakturor)

### `extra_services` tabellen:

- **`payment_type`** (text):
  - `'prepayment'` = Ingår i förskottsfaktura (rumspriser)
  - `'afterpayment'` = Betalas vid utcheckning (kloklipp, bad, etc)

### `bookings` tabellen:

- **`prepayment_status`** (text):
  - `'unpaid'` = Förskott ej betalt (default)
  - `'paid'` = Förskott betalt
  - `'partially_paid'` = Delvis betalt
  - `'refunded'` = Återbetalt
- **`prepayment_invoice_id`** (uuid): Länk till förskottsfakturan
- **`afterpayment_invoice_id`** (uuid): Länk till efterskottsfakturan

---

## 🔧 Manuell Konfiguration (valfritt)

### Markera befintliga tjänster

Om du har befintliga tjänster som behöver kategoriseras:

```sql
-- Sätt rumspriser som förskott
UPDATE extra_services
SET payment_type = 'prepayment'
WHERE label ILIKE '%rum%'
   OR label ILIKE '%bokning%'
   OR label ILIKE '%pensionat%';

-- Sätt tillval som efterskott
UPDATE extra_services
SET payment_type = 'afterpayment'
WHERE label ILIKE '%klipp%'
   OR label ILIKE '%bad%'
   OR label ILIKE '%trim%'
   OR label ILIKE '%klo%';
```

### Uppdatera gamla fakturor

```sql
-- Markera gamla fakturor som 'full' (komplett faktura)
UPDATE invoices
SET invoice_type = 'full'
WHERE invoice_type IS NULL;
```

---

## ✅ Vad som händer automatiskt nu:

### Vid godkännande av bokning:

1. Trigger `trg_create_prepayment_invoice` körs
2. Beräknar förskottsbelopp (rumsbokning - efterskottstjänster)
3. Skapar faktura med:
   - `invoice_type = 'prepayment'`
   - Förfallodatum baserat på startdatum
   - Status `'draft'` (ändra till `'sent'` när ni skickar den)
4. Uppdaterar `bookings.prepayment_invoice_id`

### Vid utcheckning:

1. Trigger `trg_create_invoice_on_checkout` körs
2. Hämtar alla tjänster med `payment_type = 'afterpayment'`
3. Skapar faktura med:
   - `invoice_type = 'afterpayment'`
   - Förfallodatum = idag (betalas direkt)
   - En rad per tjänst
4. Uppdaterar `bookings.afterpayment_invoice_id`

---

## 🧪 Testscenario

**Testa hela flödet:**

1. **Skapa testbokning** (eller använd befintlig pending):

   ```sql
   INSERT INTO bookings (
     org_id, dog_id, owner_id, room_id,
     start_date, end_date,
     total_price, status
   ) VALUES (
     'DIN-ORG-ID',
     'HUND-ID',
     'ÄGARE-ID',
     'RUM-ID',
     '2026-02-01',
     '2026-02-16',
     5250.00,
     'pending'
   );
   ```

2. **Godkänn bokningen** via UI (`/hundpensionat/ansokningar`)
   - Klicka "Godkänn bokning"
   - Verifiera att meddelande visar "📄 Förskottsfaktura skapad!"

3. **Kontrollera faktura**:

   ```sql
   SELECT * FROM invoices
   WHERE invoice_type = 'prepayment'
   ORDER BY invoice_date DESC
   LIMIT 1;
   ```

4. **Testa utcheckning**:

   ```sql
   UPDATE bookings
   SET status = 'checked_in'
   WHERE id = 'BOKNING-ID';

   -- Sedan
   UPDATE bookings
   SET status = 'checked_out'
   WHERE id = 'BOKNING-ID';
   ```

5. **Kontrollera efterskottsfaktura**:
   ```sql
   SELECT * FROM invoices
   WHERE invoice_type = 'afterpayment'
   ORDER BY invoice_date DESC
   LIMIT 1;
   ```

---

## 🔍 Felsökning

### Problem: Ingen faktura skapas vid godkännande

**Lösning:**

```sql
-- Kolla om triggern finns
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trg_create_prepayment_invoice';

-- Kolla funktionen
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'create_prepayment_invoice';
```

### Problem: Fel vid trigger-körning

**Kolla loggar:**

```sql
-- Supabase loggar trigger-meddelanden
-- Gå till Dashboard → Database → Logs
-- Leta efter NOTICE-meddelanden som börjar med ✅
```

### Problem: Gammal trigger körs fortfarande

**Ta bort och återskapa:**

```sql
DROP TRIGGER IF EXISTS trg_create_invoice_on_checkout ON bookings;
DROP FUNCTION IF EXISTS create_invoice_on_checkout();

-- Kör sedan SQL-migreringen igen
```

---

## 📞 Support

Om något inte fungerar:

1. Kolla Supabase-loggar (Dashboard → Logs)
2. Kör verifieringsquery i slutet av SQL-filen
3. Kontrollera att alla kolumner finns: `SELECT * FROM bookings LIMIT 1;`

---

## 🎉 Klart!

Nu har du ett komplett förskotts-/efterskottssystem där:

- ✅ Förskottsfaktura skapas automatiskt vid godkännande
- ✅ Efterskottsfaktura skapas automatiskt vid utcheckning
- ✅ Kunden betalar rumsbokning i förskott
- ✅ Kunden betalar tillval (kloklipp etc) vid utcheckning
- ✅ Alla fakturor länkas till sin bokning

**Nästa steg:**

- Uppdatera ekonomisidan för att visa invoice_type
- Lägg till betalningsknapp för att markera prepayment_status = 'paid'
- Implementera e-postnotifieringar för fakturor
