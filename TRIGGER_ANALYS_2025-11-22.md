# 🔍 TRIGGER & FUNCTION ANALYS (Deployed vs Systemanalys)

**Datum:** 2025-11-22 kl 13:28  
**Källa:** Query från deployed Supabase database

---

## ✅ DEPLOYED TRIGGERS (39 totalt)

### 🟢 BOOKSYSTEM (11 triggers)

#### bookings (4 triggers)

1. **trg_create_invoice_on_checkout** ✅ FUNGERAR
   - Trigger: AFTER UPDATE when status='checked_out'
   - Function: `create_invoice_on_checkout()`
   - Skapar efterbetalningsfaktura med alla rader (logi + booking_services + extra_service + rabatt)
   - Status: **BEHÅLL** - Detta är huvudsystemet för fakturering

2. **trg_create_prepayment_invoice** ✅ FUNGERAR
   - Trigger: BEFORE UPDATE when status='confirmed' AND old='pending'
   - Function: `create_prepayment_invoice()`
   - Skapar förskottsfaktura vid bekräftelse
   - Status: **BEHÅLL** - Viktigt för förskottssystem

3. **trg_set_booking_org_id** ✅ FUNGERAR
   - Trigger: BEFORE INSERT
   - Function: `set_booking_org_id()` - sätter org_id från dogs.org_id
   - Status: **BEHÅLL** - Kritiskt för data integrity

4. **trigger_log_booking_changes** ✅ FUNGERAR
   - Trigger: AFTER INSERT OR UPDATE
   - Function: `log_booking_status_change()`
   - Loggar alla statusändringar till booking_events
   - Status: **BEHÅLL** - Viktigt för audit trail

#### boarding_seasons (1 trigger)

5. **on_insert_set_org_id_for_boarding_seasons** ✅ FUNGERAR
   - Function: `set_org_id_for_rooms()` (återanvänder samma funktion)
   - Status: **BEHÅLL**

#### pension_stays (3 triggers)

6. **set_timestamp_pension_stays** ✅
7. **trg_calc_total_amount** ✅ - Beräknar total från base_price + addons
8. **trg_set_pension_stay_org_id** ✅

---

### 🟢 FAKTURA & EKONOMI (2 triggers)

#### invoices (1 trigger)

9. **trigger_set_invoice_number** ✅ FUNGERAR
   - Function: `set_invoice_number()` → anropar `generate_invoice_number(org_id)`
   - Sätter unikt fakturanummer per org
   - Status: **BEHÅLL** - Kritiskt för fakturasystem

#### owners (1 trigger)

10. **trigger_auto_customer_number** ⚠️ FUNGERAR MEN KAN HA KONFLIKTER
    - Function: `auto_generate_customer_number()`
    - Problem från systemanalys: Någon har manuellt satt customer_number = 1
    - Lösning: Köra AUDIT query för att hitta konflikter
    - Status: **BEHÅLL men validera data**

---

### 🟢 HUNDDATA & JOURNAL (5 triggers)

#### dogs (4 triggers)

11. **trg_auto_match_owner** ✅
    - Function: `auto_match_owner_trigger()` → anropar `match_owners_to_dogs()`
    - Kopplar hundar till ägare automatiskt
    - Status: **BEHÅLL**

12. **trg_create_journal_on_new_dog** ✅
    - Function: `create_dog_journal_on_new_dog()`
    - Skapar första journal-entry vid registrering
    - Status: **BEHÅLL**

13. **trg_set_dog_org_id** ✅ KRITISKT
    - Function: `set_dog_org_id()` - hämtar från profiles
    - Status: **BEHÅLL** - Del av org_id assignment system

14. **trg_update_dogs_updated_at** ✅
    - Function: `update_last_updated()`
    - Status: **BEHÅLL**

#### dog_journal (1 trigger)

15. **trg_set_dog_journal_org_id** ✅
    - Function: `set_dog_journal_org_id()`
    - Status: **BEHÅLL**

---

### 🟢 FRISÖR (5 triggers)

#### grooming_bookings (2 triggers)

16. **trigger_auto_create_grooming_journal** ✅ SMART
    - Skapar grooming_journal entry när status='completed'
    - Hanterar både dogs OCH walk-in (external_customer)
    - Status: **BEHÅLL**

17. **trigger_update_external_customer_stats** ✅
    - Uppdaterar external_customers tabell med total_visits, last_visit_date
    - Status: **BEHÅLL** - Viktigt för walk-in tracking

#### grooming_logs (1 trigger)

18. **on_insert_set_org_id_for_grooming** ✅
    - Function: `set_org_id_for_grooming()` - hämtar från dogs.org_id
    - Status: **BEHÅLL**

#### external_customers (1 trigger)

19. **trigger_update_external_customers_updated_at** ✅
    - Status: **BEHÅLL**

---

### 🟢 ORGANISATION & ANVÄNDARE (7 triggers)

#### auth.users (1 trigger) - **KRITISKT SYSTEM**

20. **on_auth_user_created** ✅✅✅ LAYER 1 av org_id assignment
    - Function: `handle_new_user()`
    - Skapar: orgs, profiles (med org_id), org_subscriptions
    - Hämtar från user_metadata: org_name, org_number, phone, full_name, lan, kommun, service_types
    - Status: **BEHÅLL** - Detta är PERMANENT_FIX_org_assignment.sql Layer 1

#### orgs (3 triggers)

21. **on_insert_set_trial_end_for_org** ✅
    - Function: `set_trial_end_for_org()` - sätter trial_ends_at = now() + 3 months
    - Status: **BEHÅLL**

22. **on_org_insert_add_special_dates** ✅ SMART
    - Function: `add_default_special_dates_for_org()`
    - Lägger till alla svenska högtider 2025-2026 med rätt price_surcharge
    - Status: **BEHÅLL** - Sparar jättemycket manuellt arbete

23. **on_org_locked_email** ✅
    - Function: `notify_admin_on_lock()` - skickar email via Resend API
    - Status: **BEHÅLL** - Viktigt för admin notifications

#### profiles (3 triggers)

24. **on_profile_insert** ✅
    - Function: `set_default_role()` - sätter role='staff' om null
    - Status: **BEHÅLL**

25. **trg_ensure_org_has_admin** ⚠️ SMART MEN KAN VA BUGGY
    - Function: `ensure_org_has_admin()`
    - Om sista admin tas bort → uppgradera äldsta staff till admin
    - Status: **BEHÅLL men testa**

26. **trg_delete_org_if_no_admins** ⚠️ FARLIG men GDPR-compliant
    - Function: `delete_org_if_no_admins()`
    - Om sista admin raderas och ingen kan uppgraderas → RADERA HELA ORG + DATA
    - Status: **BEHÅLL men dokumentera tydligt**

#### subscriptions (1 trigger)

27. **on_insert_set_org_id_for_subscriptions** ✅
    - Function: `set_org_id_for_subscription()`
    - Status: **BEHÅLL**

---

### 🟢 ÖVRIGT (6 triggers)

#### consent_logs (1 trigger)

28. **trigger_update_owner_consent_status** ✅
    - Function: `update_owner_consent_status()` - uppdaterar owners.consent_status
    - Status: **BEHÅLL** - GDPR viktigt

#### extra_service (1 trigger)

29. **trg_set_extra_service_org_id** ✅

#### extra_services (1 trigger)

30. **trg_set_org_id_extra_services** ✅
    - Function: `set_org_id_for_owners()` (återanvänder samma funktion)

#### rooms (1 trigger)

31. **trg_set_org_id_rooms** ✅

#### services (1 trigger)

32. **on_insert_set_org_id_for_services** ✅

#### special_dates (1 trigger)

33. **on_insert_set_org_id_for_special_dates** ✅
    - Function: `set_special_date_org_id()`

---

### 🔵 STORAGE & SYSTEM (6 triggers)

#### storage.buckets (1)

34. **enforce_bucket_name_length_trigger**

#### storage.objects (3)

35. **objects_delete_delete_prefix**
36. **objects_insert_create_prefix**
37. **objects_update_create_prefix**
38. **update_objects_updated_at**

#### storage.prefixes (2)

39. **prefixes_create_hierarchy**
40. **prefixes_delete_hierarchy**

#### realtime.subscription (1)

41. **tr_check_filters** - Validerar realtime subscriptions

#### cron.job (1)

42. **cron_job_cache_invalidate**

---

## 🚨 PROBLEM FRÅN SYSTEMANALYS_KOMPLETT

### ❌ Problem #1: "Dubbla triggers för samma funktion"

**FALSKT LARM!** Inga dubbletter finns deployed.

- Systemanalysen hittade dubbla CREATE TRIGGER statements i **SQL-filer** (migrations)
- Men deployed database har **inga dubbletter**
- Alla triggers är unika
- **Lösning:** Ta bort gamla migrationer från repo (de är redan körd)

### ❌ Problem #2: "anonymize triggers finns kvar"

**FALSKT LARM!** Inga anonymize triggers finns deployed.

Query returnerade **0 anonymize triggers**.

- Systemanalysen baserade sig på gamla SQL-filer
- **Lösning:** Ta bort gamla SQL-filer som nämner anonymize

### ⚠️ Problem #3: "lib/pensionatCalculations.ts använder tabeller som inte finns"

**SANT!** Men används fortfarande i kod.

Från grep:

```
app/ansokan/pensionat/page.tsx:import { calculatePensionatPrice } from '@/lib/pensionatCalculations';
app/admin/faktura/page.tsx: (kanske också)
```

**Lösning:**

1. Fixa dessa filer att använda `boardingPriceCalculator.ts` istället
2. Ta bort `lib/pensionatCalculations.ts`

### ⚠️ Problem #4: "customer_number konflikt"

**MÖJLIGT!** Trigger finns men data kan ha konflikter.

Trigger `auto_generate_customer_number` finns deployed och ser bra ut.

**Problem:**

- Den försöker hitta sequence för customer_number
- Om sequence saknas → fallback till MAX+1
- Någon kan ha manuellt satt customer_number=1

**Lösning:** Kör query för att hitta konflikter:

```sql
SELECT customer_number, COUNT(*)
FROM owners
GROUP BY customer_number
HAVING COUNT(*) > 1;
```

### ✅ Problem #5-14: Andra issues

Inte trigger-relaterade, hanteras separat.

---

## 📊 SAMMANFATTNING

| Kategori                     | Antal | Status        |
| ---------------------------- | ----- | ------------- |
| **Totalt triggers**          | 42    | Deployed      |
| **Behåll alla**              | 42    | ✅            |
| **Ta bort**                  | 0     | -             |
| **Falskt larm (dubbletter)** | 0     | ✅ Inga finns |
| **Falskt larm (anonymize)**  | 0     | ✅ Inga finns |

---

## 🎯 NÄSTA STEG

1. ✅ Triggers är OK - inget behöver tas bort
2. ❌ Fix broken price imports (pensionatCalculations → boardingPriceCalculator)
3. ⚠️ Validera customer_number data
4. 🗑️ Ta bort gamla SQL-filer som skapade förvirring
5. 🗑️ Ta bort gamla MD-dokumentationer

---

## 🔐 KRITISKA TRIGGERS (FÅR EJ RADERAS)

1. **on_auth_user_created** - Layer 1 av org_id assignment
2. **trg_create_invoice_on_checkout** - Fakturasystemet
3. **trg_set_booking_org_id** - Data integrity
4. **trigger_set_invoice_number** - Unikt fakturanummer
5. **on_org_insert_add_special_dates** - Sparar timmar av arbete
6. **trg_delete_org_if_no_admins** - GDPR compliance
