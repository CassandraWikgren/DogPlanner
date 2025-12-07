# 🗄️ Database Quick Reference - DogPlanner

**Uppdaterad:** 2 Dec 2025  
**Syfte:** Snabb referens för korrekt tabellnamn och kolumnnamn

---

## ⚠️ VIKTIGA TABELLNAMN (Använd dessa!)

| ❌ Fel namn     | ✅ Rätt namn             | Kommentar                          |
| --------------- | ------------------------ | ---------------------------------- |
| `organisations` | `orgs`                   | Organisationstabellen              |
| `owners_id`     | `owner_id`               | Kolumn i dogs (singular!)          |
| `quantity`      | `qty`                    | Kolumn i invoice_items             |
| `total_amount`  | `amount`                 | Kolumn i invoice_items (GENERATED) |
| `created_at`    | `metadata->>'timestamp'` | invoice_runs har JSONB             |

---

## 📊 Viktiga tabeller och kolumner

### **orgs** - Organisationer

```sql
id UUID PRIMARY KEY
name TEXT
org_number TEXT
email TEXT
phone TEXT
enabled_services TEXT[]  -- ['daycare', 'boarding', 'grooming']
```

### **dogs** - Hundar

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
owner_id UUID REFERENCES owners(id)  -- ⚠️ SINGULAR!
subscription TEXT  -- 'Heltid', 'Deltid 3', 'Dagshund'
startdate DATE
enddate DATE
```

### **owners** - Ägare

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
full_name TEXT
customer_number TEXT
phone TEXT
email TEXT
```

### **daycare_pricing** - Dagispris per organisation

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)  -- ⚠️ En rad per org!
subscription_5days DECIMAL(10,2)  -- Heltid
subscription_3days DECIMAL(10,2)  -- Deltid 3
subscription_2days DECIMAL(10,2)  -- Deltid 2
subscription_1day DECIMAL(10,2)   -- Deltid 1
single_day_price DECIMAL(10,2)    -- Dagshund
sibling_discount_percent INTEGER
```

### **invoices** - Fakturor

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
owner_id UUID REFERENCES owners(id)
invoice_number TEXT UNIQUE
invoice_date DATE
due_date DATE
total_amount DECIMAL(10,2)
status TEXT  -- 'draft', 'sent', 'paid', 'overdue'
```

### **invoice_items** - Fakturarader

```sql
id UUID PRIMARY KEY
invoice_id UUID REFERENCES invoices(id)
description TEXT
qty DECIMAL(10,2)     -- ⚠️ INTE quantity!
unit_price DECIMAL(10,2)
amount DECIMAL(10,2)  -- ⚠️ GENERATED COLUMN = qty * unit_price
```

⚠️ **VIKTIGT:** `amount` är en **GENERATED COLUMN**!  
Du får INTE skriva till den i INSERT eller UPDATE.  
PostgreSQL beräknar den automatiskt: `amount = qty * unit_price`

```sql
-- ✅ RÄTT
INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
VALUES (invoice_id, 'Hundpensionat', 10, 500);
-- amount blir automatiskt 5000

-- ❌ FEL
INSERT INTO invoice_items (invoice_id, description, qty, unit_price, amount)
VALUES (invoice_id, 'Hundpensionat', 10, 500, 5000);
-- ERROR: cannot insert into generated column
```

### **invoice_runs** - Cron execution logs

```sql
id UUID PRIMARY KEY
month_id TEXT         -- '2025-11'
status TEXT           -- 'success', 'failed'
invoices_created INTEGER
metadata JSONB        -- {"timestamp": "...", "total_amount": 123}
```

⚠️ **OBS:** `invoice_runs` har INGEN `created_at` kolumn!  
Använd: `metadata->>'timestamp'` istället

### **extra_service** - Extra tjänster

```sql
id UUID PRIMARY KEY
dogs_id UUID REFERENCES dogs(id)
org_id UUID REFERENCES orgs(id)
service_type TEXT
price DECIMAL(10,2)
is_active BOOLEAN
frequency TEXT  -- 'daily', 'weekly', 'monthly'
```

### **grooming_bookings** - Frisörbokningar

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
dog_id UUID REFERENCES dogs(id)
appointment_date DATE
appointment_time TIME
service_type TEXT  -- 'bath', 'bath_trim', 'full_groom', etc.
estimated_price DECIMAL(10,2)
status TEXT  -- 'confirmed', 'completed', 'cancelled', 'no_show'
notes TEXT
external_customer_name TEXT  -- För utomstående kunder
external_dog_name TEXT
clip_length TEXT
shampoo_type TEXT
```

### **grooming_journal** - Frisörjournal

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
dog_id UUID REFERENCES dogs(id)
appointment_date DATE
service_type TEXT
clip_length TEXT
shampoo_type TEXT
coat_condition TEXT
before_photos JSONB
after_photos JSONB
notes TEXT
price_charged DECIMAL(10,2)
external_customer_name TEXT
external_dog_name TEXT
```

### **grooming_prices** - Frisörpriser

```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES orgs(id)
service_label TEXT  -- 'Badning', 'Trimning', etc.
dog_size TEXT  -- 'Liten', 'Mellan', 'Stor'
base_price DECIMAL(10,2)
is_active BOOLEAN
UNIQUE(org_id, service_label, dog_size)
```

---

## 🔍 Vanliga SQL-queries

### Hämta organisation med priser

```sql
SELECT
  o.id,
  o.name,
  dp.subscription_5days,
  dp.subscription_3days
FROM orgs o
LEFT JOIN daycare_pricing dp ON dp.org_id = o.id
WHERE o.id = 'din-org-id';
```

### Hundar med aktiva abonnemang

```sql
SELECT
  d.name,
  d.subscription,
  o.full_name as owner_name
FROM dogs d
JOIN owners o ON o.id = d.owner_id  -- ⚠️ owner_id (singular)
WHERE d.org_id = 'din-org-id'
AND d.subscription IS NOT NULL
AND d.subscription != 'Dagshund';
```

### Senaste fakturor med items

```sql
SELECT
  i.invoice_number,
  i.billed_name,
  i.total_amount,
  ii.description,
  ii.qty,           -- ⚠️ qty (inte quantity)
  ii.amount         -- ⚠️ amount (inte total_amount)
FROM invoices i
JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.org_id = 'din-org-id'
ORDER BY i.created_at DESC;
```

### Invoice runs (cron logs)

```sql
SELECT
  month_id,
  status,
  invoices_created,
  metadata->>'timestamp' as run_time  -- ⚠️ JSONB-kolumn!
FROM invoice_runs
ORDER BY month_id DESC;
```

---

## 🎯 TypeScript Types

När du använder Supabase client:

```typescript
// ✅ RÄTT
const { data: orgs } = await supabase.from("orgs").select("*");
const { data: dogs } = await supabase
  .from("dogs")
  .select("*, owners(full_name)") // owner_id relation
  .eq("org_id", orgId);

// ✅ RÄTT - invoice_items
const { data: items } = await supabase
  .from("invoice_items")
  .select("description, qty, amount"); // qty och amount!

// ❌ FEL
const { data } = await supabase.from("organisations").select("*"); // Tabellen heter 'orgs'!
```

---

## 📝 Viktiga påminnelser

1. **Tabellen heter `orgs`** - INTE `organisations` eller `organizations`
2. **`owner_id` är singular** - INTE `owners_id`
3. **`invoice_items` använder `qty` och `amount`** - INTE `quantity` och `total_amount`
4. **`amount` är GENERATED COLUMN** - Får INTE skrivas till manuellt! Beräknas som `qty * unit_price`
5. **`invoice_runs` har JSONB** - Använd `metadata->>'timestamp'` för tidsstämpel
6. **Multi-tenant:** ALLA queries måste filtrera på `org_id` (eller använd RLS)
7. **Grooming-tabeller:** RLS är avstängt för dev (aktivera i prod!)
8. **SQL Triggers:**
   - `create_prepayment_invoice()` - Skapar förskottsfaktura när booking godkänns
   - `create_invoice_on_checkout()` - Skapar slutfaktura när gäst checkar ut
   - Båda använder `qty` och `unit_price` (INTE `amount`!)

---

**För fullständig dokumentation, se:**

- `SUPABASE_DATABAS_STRUKTUR_KOMPLETT.NY.md` - Komplett schema
- `KÖR_DETTA_I_SUPABASE.sql` - Verifieringsqueries
- `types/database.ts` - TypeScript types
