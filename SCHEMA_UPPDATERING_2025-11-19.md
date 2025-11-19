# SCHEMA UPPDATERING 2025-11-19

## Sammanfattning

En omfattande uppdatering av `supabase/schema.sql` för att dokumentera ALLA tabeller som används i DogPlanner-systemet. Pensionatsbokningar och alla relaterade tabeller är nu fullständigt dokumenterade.

## 🆕 Nya tabeller tillagda i schema.sql

### Pensionat-specifika tabeller

1. **`pension_stays`** - Alternativ bokningstabell för pensionat
   - Används i månadsvis fakturering (generate_invoices Edge Function)
   - Huvudsystemet använder `bookings`-tabellen för pensionat
   - Kolumner: dog_id, owner_id, start_date, end_date, base_price, addons (jsonb), total_amount, status

2. **`booking_services`** - Tjänster utförda under vistelse
   - Kopplad till `booking_id` (inte dog_id)
   - Loggar vad som faktiskt utfördes (t.ex. "Kloklipp utförd 2025-11-15")
   - Kolumner: booking_id, service_id, quantity, unit_price, total_price, staff_notes

3. **`pensionat_services`** - Tjänstekatalog för pensionat
   - Skiljer sig från `extra_services` (används specifikt för pensionat)
   - Definierar vilka tjänster som FINNS att välja
   - Kolumner: label, price, description, is_active

4. **`pension_calendar_full_view`** - VIEW för pensionatskalender
   - Komplett vy med alla bokningar + hund + ägare + rum
   - Används i `/app/hundpensionat/[id]/page.tsx`

### GDPR & Samtycken

5. **`consent_logs`** - GDPR Art. 7 samtyckes-loggning
   - Dokumenterar hur och när kund gav samtycke
   - Typer: digital_email, physical_form, phone_verbal, in_person
   - Kolumner: owner_id, consent_type, consent_text, consent_version, ip_address, user_agent, signed_document_url, withdrawn_at

### Rabatter & Priser

6. **`customer_discounts`** - Kundspecifika rabatter
   - Ersätter `position_share`
   - Kolumner: owner_id, discount_type, discount_value, valid_from, valid_to

7. **`owner_discounts`** - Ägarrabatter (synonym till customer_discounts)
   - Används av vissa hundpensionatsidor
   - Samma struktur som `customer_discounts`

8. **`prices`** - Äldre prishantering
   - Används av `/admin/priser` (äldre admin-sida)
   - Nyare kod använder `boarding_prices`, `daycare_pricing`, `grooming_services`

### Loggning & Schema

9. **`function_logs`** - Edge Functions loggning
   - Loggar månadsfakturering och andra Edge Functions
   - Kolumner: function_name, status, execution_time_ms, error_message, metadata (jsonb)

10. **`daily_schedule`** - Dagens schema för hunddagis
    - Närvaroregistrering per dag
    - Kolumner: dog_id, schedule_date, is_present, checkin_time, checkout_time

## 📊 Viktiga Insikter

### Pensionatsbokningar - HUR DET FUNGERAR

**OBSERVERA:** Pensionatsbokningar använder **BOOKINGS-tabellen**, inte en egen tabell!

```
bookings
  ├── status: pending → confirmed → checked_in → checked_out
  ├── room_id (rooms.room_type: 'boarding' eller 'both')
  ├── belongings: "Leksak, filt, mat"
  ├── bed_location: "Rum 3, Säng A"
  ├── extra_service_ids: JSON array
  └── prepayment_invoice_id / afterpayment_invoice_id
```

**Relaterade tabeller:**

- `extra_services` - Tjänstekatalog (admin skapar här)
- `booking_services` - Vad som faktiskt utfördes (personal loggar här)
- `pension_stays` - Alternativ tabell (används i månadsfakturering)

### Ansökningsflöde (Pensionat)

1. Kund fyller i `/app/ansokan/pensionat/page.tsx`
2. Skapar: `owners` → `dogs` → `bookings` (status='pending')
3. Loggar: `consent_logs` (GDPR Art. 7)
4. Personal ser ansökan i `/app/hundpensionat/ansokningar`
5. Godkänner → `bookings.status = 'confirmed'`
6. Trigger skapar förskottsfaktura: `bookings.prepayment_invoice_id`
7. Vid utcheckning: `bookings.status = 'checked_out'`
8. Trigger skapar efterskottsfaktura: `bookings.afterpayment_invoice_id`

## 🔐 RLS Policies tillagda

Alla nya tabeller har nu RLS policies:

- **Public INSERT**: `consent_logs` (för GDPR-loggning i ansökningar)
- **Org-scoped**: Alla andra tabeller (via `profiles.org_id` match)
- **Read-only**: `function_logs` (endast service role kan skriva)

## 📝 Dokumentation

Alla tabeller har nu:

- ✅ CREATE TABLE statements
- ✅ Indexes för vanliga queries
- ✅ COMMENT ON TABLE för beskrivning
- ✅ COMMENT ON COLUMN för viktiga kolumner
- ✅ RLS policies
- ✅ Foreign keys och constraints

## 🚀 Triggers & Funktioner

Inga nya triggers tillades, men följande triggers är relevanta:

- `trg_create_invoice_on_checkout` - Skapar faktura vid pensionatutcheckning
- `trg_set_org_id_on_bookings` - Sätter org_id från hundens org
- `trg_calc_total_amount` - Beräknar total_amount för pension_stays

## 🔧 Migrations

Befintliga migrations som skapar dessa tabeller:

- `20251116_consent_part1_tables.sql` - consent_logs
- `20251116_create_consent_logs.sql` - consent_logs (alternativ)
- `20251115_add_bookings_belongings.sql` - belongings + bed_location
- `2025-11-13_add_missing_pricing_tables.sql` - daycare_pricing, grooming_services

## ✅ Verifiering

För att verifiera att alla tabeller finns i din Supabase-databas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Förväntade tabeller (45 st):

- attendence_logs
- boarding_prices
- boarding_seasons
- booking_events
- booking_services ← NY
- bookings
- consent_logs ← NY
- customer_discounts ← NY
- daily_schedule ← NY
- daycare_pricing
- daycare_service_completions
- dog_journal
- dogs
- error_logs
- extra_service
- extra_services
- function_logs ← NY
- grooming_bookings
- grooming_journal
- grooming_logs
- grooming_services
- interest_applications
- invoice_items
- invoice_logs
- invoices
- migrations
- org_subscriptions
- orgs
- owner_discounts ← NY
- owners
- pension_stays ← NY
- pensionat_services ← NY
- position_share
- price_lists
- prices ← NY
- profiles
- responsibilities
- rooms
- services
- special_dates
- staff_notes
- subscription_types
- subscriptions

Plus VIEW:

- pension_calendar_full_view ← NY

## 📱 Kundportal

Viktigt att veta om kundportalen:

- Använder `owner_id` som primary key (inte `profiles.id`)
- Ett kundkonto fungerar hos ALLA pensionat (Scandic-modellen)
- `customer_number` är UNIK per owner (inte per org)
- `org_id` på bookings visar vilket pensionat bokningen gäller

## 🎯 Nästa steg

Schema.sql är nu komplett och dokumenterar alla tabeller. Om du upptäcker fler tabeller som saknas:

1. Sök efter `.from("tabellnamn")` i app/\*_/_.tsx
2. Lägg till CREATE TABLE i schema.sql
3. Lägg till RLS policy
4. Lägg till COMMENT för dokumentation

## 📞 Support

Om du har frågor om någon tabell eller hur pensionatsbokningar fungerar, kolla:

- `supabase/schema.sql` - Fullständig dokumentation
- `PENSIONAT_BOOKING_FLOW.md` - Detaljerat flödesdiagram (om den finns)
- `SYSTEMDOKUMENTATION.md` - Övergripande systembeskrivning
