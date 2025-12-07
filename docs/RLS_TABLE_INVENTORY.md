# RLS Table Inventory - Baserad på database_AUTO_GENERATED.ts

> Genererad: 2025-12-08
> Källa: types/database_AUTO_GENERATED.ts (den ENDA tillförlitliga källan!)

## Kategorisering av tabeller

### KATEGORI A: Tabeller med org_id (Multi-tenant isolering)

Dessa tabeller använder Pattern 3: `org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())`

| Tabell                      | org_id      | is_active      | owner_id    | dog_id       | Speciella kolumner                 |
| --------------------------- | ----------- | -------------- | ----------- | ------------ | ---------------------------------- |
| boarding_prices             | ✅ REQUIRED | ✅             | ❌          | ❌           |                                    |
| boarding_seasons            | ✅ nullable | ❌ NO!         | ❌          | ❌           |                                    |
| booking_events              | ✅ nullable | ❌             | ❌          | ❌           | booking_id                         |
| bookings                    | ✅ nullable | ✅             | ✅          | ✅           | room_id                            |
| consent_logs                | ✅ REQUIRED | ❌             | ✅          | ❌           |                                    |
| daycare_pricing             | ✅ REQUIRED | ❌             | ❌          | ❌           |                                    |
| daycare_service_completions | ✅ nullable | ❌             | ❌          | ✅           |                                    |
| dog_journal                 | ✅ nullable | ❌             | ❌          | ✅ REQUIRED  |                                    |
| dogs                        | ✅ REQUIRED | ✅             | ✅          | N/A          | is_deleted                         |
| external_customers          | ✅ REQUIRED | ❌             | ❌          | ❌           |                                    |
| extra_service               | ✅ nullable | ✅             | ❌          | ✅ (dogs_id) |                                    |
| extra_services              | ✅ nullable | ✅             | ❌          | ❌           |                                    |
| grooming_bookings           | ✅ nullable | ❌             | ❌          | ✅           |                                    |
| grooming_journal            | ✅ nullable | ❌             | ❌          | ✅           | booking_id                         |
| grooming_logs               | ✅ nullable | ❌             | ❌          | ✅ REQUIRED  |                                    |
| grooming_prices             | ✅ REQUIRED | ❌             | ❌          | ❌           | active (inte is_active!)           |
| grooming_services           | ✅ REQUIRED | ❌             | ❌          | ❌           |                                    |
| interest_applications       | ✅ nullable | ❌             | ❌          | ❌           | status                             |
| invoice_counters            | ✅ PK!      | ❌             | ❌          | ❌           |                                    |
| invoices                    | ✅ REQUIRED | ❌             | ✅          | ❌           | status                             |
| org_subscriptions           | ✅ REQUIRED | ✅ (is_active) | ❌          | ❌           |                                    |
| owner_discounts             | ✅ REQUIRED | ✅             | ✅ REQUIRED | ❌           |                                    |
| owners                      | ✅ nullable | ✅             | N/A         | ❌           | is_anonymized, user_id, profile_id |
| pension_stays               | ✅ nullable | ❌             | ❌          | ✅ REQUIRED  | room_id, status                    |
| price_lists                 | ✅ nullable | ❌             | ❌          | ❌           |                                    |
| pricing                     | ✅ nullable | ✅             | ❌          | ❌           |                                    |
| profiles                    | ✅ REQUIRED | ❌             | ❌          | ❌           | id = auth.uid()                    |
| responsibilities            | ✅ nullable | ❌             | ❌          | ❌           | staff_id                           |
| rooms                       | ✅ nullable | ✅             | ❌          | ❌           |                                    |
| services                    | ✅ nullable | ✅             | ❌          | ❌           |                                    |
| special_dates               | ✅ REQUIRED | ✅             | ❌          | ❌           |                                    |
| staff_notes                 | ✅ nullable | ❌             | ❌          | ❌           |                                    |
| subscription_types          | ✅ nullable | ✅             | ❌          | ❌           |                                    |
| subscriptions               | ✅ nullable | ✅             | ❌          | ✅           |                                    |
| user_org_roles              | ✅ nullable | ❌             | ❌          | ❌           | user_id                            |

### KATEGORI B: Systemtabeller (INGA org_id - admin/service_role only)

| Tabell                          | Beskrivning                 | RLS Strategy                        |
| ------------------------------- | --------------------------- | ----------------------------------- |
| attendance_logs                 | Dagis-närvaro               | dogs_id → dogs.org_id (JOIN)        |
| booking_services                | Tilläggstjänster på bokning | booking_id → bookings.org_id (JOIN) |
| error_logs                      | Systemloggar                | service_role only                   |
| function_logs                   | Funktionsloggar             | service_role only                   |
| gdpr_deletion_log               | GDPR audit                  | service_role only                   |
| invoice_items                   | Fakturarader                | invoice_id → invoices.org_id (JOIN) |
| invoice_runs                    | Faktureringskörningar       | ❌ NO org_id - month_id baserad     |
| migrations                      | DB-migrationer              | service_role only                   |
| org_email_history               | Trial abuse prevention      | service_role only                   |
| org_number_subscription_history | Trial abuse prevention      | service_role only                   |
| system_config                   | Systemkonfiguration         | service_role only                   |
| trigger_execution_log           | Trigger audit               | service_role only                   |

### KATEGORI C: Specialtabeller

| Tabell   | Speciallogik                                                      |
| -------- | ----------------------------------------------------------------- |
| orgs     | owner_id = user_id (ägare kan läsa sin org)                       |
| profiles | id = auth.uid() (egen profil)                                     |
| owners   | Kan ha user_id för kundportal (kunder kan se sina egna uppgifter) |

---

## VIKTIGA KOLUMNNAMN (Bekräftade från schema)

### ⚠️ Kolumner som INTE finns (var försiktig!)

- `boarding_seasons.is_active` → FINNS EJ!
- `invoice_runs.org_id` → FINNS EJ! (använd month_id)
- `grooming_prices.is_active` → FINNS EJ! (heter `active`)

### ⚠️ Tabeller som INTE finns

- `applications` → FINNS EJ! (heter `interest_applications`)
- `customer_discounts` → FINNS EJ! (heter `owner_discounts`)
- `branches` → FINNS EJ!
- `daycare_completions` → FINNS EJ! (heter `daycare_service_completions`)

---

## JOIN-baserade policies (för tabeller utan org_id)

### attendance_logs

```sql
-- Via dogs.org_id
org_id = (SELECT d.org_id FROM dogs d WHERE d.id = attendance_logs.dogs_id)
```

### booking_services

```sql
-- Via bookings.org_id
EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_services.booking_id AND b.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
```

### invoice_items

```sql
-- Via invoices.org_id
EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
```

---

## Kundinloggnings-policies (owners med user_id)

Kunder kan logga in via kundportalen. De har:

- `owners.user_id` = `auth.uid()` (koppling till auth)
- ELLER `owners.profile_id` = profil-ID

Policies för kundåtkomst:

```sql
-- Owners: kan se sig själva
user_id = auth.uid() OR profile_id = auth.uid()

-- Bookings: kunder kan se sina egna bokningar
owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())

-- Dogs: kunder kan se sina egna hundar
owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())

-- Invoices: kunder kan se sina egna fakturor
owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
```

---

## RPC-funktioner (bekräftade i database_AUTO_GENERATED.ts)

Alla dessa finns i `database_AUTO_GENERATED.ts` under `Functions`:

| Funktion                    | SECURITY DEFINER | Fil                                  | Anledning                      |
| --------------------------- | ---------------- | ------------------------------------ | ------------------------------ |
| heal_user_missing_org       | ✅ Ja            | PERMANENT_FIX_org_assignment.sql     | Skapar org/profil utan RLS     |
| verify_customer_account     | ✅ Ja            | 20251207_customer_login_rpc.sql      | Verifierar kundkonto vid login |
| approve_application         | ✅ Ja            | 20251205_approve_application_rpc.sql | Skapar owner/dog/subscription  |
| reject_application          | ✅ Ja            | 20251205_approve_application_rpc.sql | Uppdaterar application status  |
| check_trial_eligibility     | ✅ Ja            | ADD_TRIAL_ABUSE_PROTECTION.sql       | Kollar trial-historik          |
| register_subscription_start | ✅ Ja            | ADD_TRIAL_ABUSE_PROTECTION.sql       | Registrerar subscription       |
| gdpr_delete_user_data       | ✅ Ja            | GDPR_USER_DELETE.sql                 | Raderar användardata           |

**VIKTIGT:** Dessa funktioner kräver SECURITY DEFINER för att bypassa RLS!

## Invoice Triggers

| Trigger                            | Tabell     | Funktion                     |
| ---------------------------------- | ---------- | ---------------------------- |
| trigger_create_prepayment_invoice  | bookings   | create_prepayment_invoice()  |
| trigger_create_invoice_on_checkout | bookings   | create_invoice_on_checkout() |
| on_auth_user_created               | auth.users | handle_new_user()            |

---

## Sammanfattning för V3

**46 tabeller totalt** (inklusive views) → **38 faktiska tabeller**

**Behöver RLS policies:**

- 33 tabeller med org_id-baserad isolering
- 3 tabeller med JOIN-baserad isolering
- 5 systemtabeller (service_role only)

**Kundportal-stöd:**

- owners, dogs, bookings, invoices behöver dubbla policies (staff OCH kund)
