[
{
"table_name": "attendance_logs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "attendance_logs",
"column_name": "status",
"column_default": "'''not_checked_in'''::text"
},
{
"table_name": "attendance_logs",
"column_name": "notes",
"column_default": "''::text"
},
{
"table_name": "attendance_logs",
"column_name": "created_at",
"column_default": "'2025-10-09 16:13:20.322986'::timestamp without time zone"
},
{
"table_name": "attendance_logs",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "boarding_prices",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "boarding_prices",
"column_name": "weekend_surcharge",
"column_default": "0"
},
{
"table_name": "boarding_prices",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "boarding_prices",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "boarding_prices",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "boarding_seasons",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "boarding_seasons",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "boarding_seasons",
"column_name": "type",
"column_default": "'high'::text"
},
{
"table_name": "boarding_seasons",
"column_name": "price_multiplier",
"column_default": "1.0"
},
{
"table_name": "booking_events",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "booking_events",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "booking_services",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "booking_services",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "booking_services",
"column_name": "quantity",
"column_default": "1"
},
{
"table_name": "bookings",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "bookings",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "bookings",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "bookings",
"column_name": "status",
"column_default": "'pending'::text"
},
{
"table_name": "bookings",
"column_name": "deposit_paid",
"column_default": "false"
},
{
"table_name": "bookings",
"column_name": "base_price",
"column_default": "0"
},
{
"table_name": "bookings",
"column_name": "addons",
"column_default": "'[]'::jsonb"
},
{
"table_name": "bookings",
"column_name": "discount_amount",
"column_default": "0"
},
{
"table_name": "bookings",
"column_name": "prepayment_status",
"column_default": "'unpaid'::text"
},
{
"table_name": "bookings",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "bookings",
"column_name": "consent_required",
"column_default": "false"
},
{
"table_name": "consent_logs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "consent_logs",
"column_name": "consent_version",
"column_default": "'1.0'::text"
},
{
"table_name": "consent_logs",
"column_name": "given_at",
"column_default": "now()"
},
{
"table_name": "consent_logs",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "consent_logs",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "daycare_pricing",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "daycare_pricing",
"column_name": "subscription_1day",
"column_default": "1500"
},
{
"table_name": "daycare_pricing",
"column_name": "subscription_2days",
"column_default": "2500"
},
{
"table_name": "daycare_pricing",
"column_name": "subscription_3days",
"column_default": "3300"
},
{
"table_name": "daycare_pricing",
"column_name": "subscription_4days",
"column_default": "4000"
},
{
"table_name": "daycare_pricing",
"column_name": "subscription_5days",
"column_default": "4500"
},
{
"table_name": "daycare_pricing",
"column_name": "single_day_price",
"column_default": "350"
},
{
"table_name": "daycare_pricing",
"column_name": "sibling_discount_percent",
"column_default": "10"
},
{
"table_name": "daycare_pricing",
"column_name": "trial_day_price",
"column_default": "200"
},
{
"table_name": "daycare_pricing",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "daycare_pricing",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "daycare_service_completions",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "daycare_service_completions",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "daycare_service_completions",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "dog_journal",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "dog_journal",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "dog_journal",
"column_name": "content",
"column_default": "''::text"
},
{
"table_name": "dogs",
"column_name": "id",
"column_default": "uuid_generate_v4()"
},
{
"table_name": "dogs",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "dogs",
"column_name": "is_sterilized",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "is_castrated",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "is_escape_artist",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "destroys_things",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "is_house_trained",
"column_default": "true"
},
{
"table_name": "dogs",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "dogs",
"column_name": "can_be_with_other_dogs",
"column_default": "true"
},
{
"table_name": "dogs",
"column_name": "in_heat",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "is_deleted",
"column_default": "false"
},
{
"table_name": "dogs",
"column_name": "waitlist",
"column_default": "false"
},
{
"table_name": "error_logs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "error_logs",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "external_customers",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "external_customers",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "external_customers",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "external_customers",
"column_name": "total_visits",
"column_default": "0"
},
{
"table_name": "extra_service",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "extra_service",
"column_name": "quantity",
"column_default": "1"
},
{
"table_name": "extra_service",
"column_name": "performed_at",
"column_default": "CURRENT_DATE"
},
{
"table_name": "extra_service",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "extra_service",
"column_name": "payment_type",
"column_default": "'afterpayment'::text"
},
{
"table_name": "extra_service",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "extra_services",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "extra_services",
"column_name": "service_type",
"column_default": "'all'::text"
},
{
"table_name": "extra_services",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "extra_services",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "extra_services",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "function_logs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "function_logs",
"column_name": "run_at",
"column_default": "now()"
},
{
"table_name": "gdpr_deletion_log",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "gdpr_deletion_log",
"column_name": "deleted_at",
"column_default": "now()"
},
{
"table_name": "grooming_bookings",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "grooming_bookings",
"column_name": "status",
"column_default": "'confirmed'::text"
},
{
"table_name": "grooming_bookings",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "grooming_journal",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "grooming_journal",
"column_name": "final_price",
"column_default": "0"
},
{
"table_name": "grooming_journal",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "grooming_logs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "grooming_logs",
"column_name": "performed_at",
"column_default": "CURRENT_DATE"
},
{
"table_name": "grooming_logs",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "grooming_logs",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "grooming_prices",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "grooming_prices",
"column_name": "price",
"column_default": "0"
},
{
"table_name": "grooming_prices",
"column_name": "duration_minutes",
"column_default": "60"
},
{
"table_name": "grooming_prices",
"column_name": "active",
"column_default": "true"
},
{
"table_name": "grooming_prices",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "grooming_prices",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "grooming_services",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "grooming_services",
"column_name": "base_price",
"column_default": "0"
},
{
"table_name": "grooming_services",
"column_name": "size_multiplier_enabled",
"column_default": "true"
},
{
"table_name": "grooming_services",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "grooming_services",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "interest_applications",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "interest_applications",
"column_name": "is_neutered",
"column_default": "false"
},
{
"table_name": "interest_applications",
"column_name": "is_escape_artist",
"column_default": "false"
},
{
"table_name": "interest_applications",
"column_name": "destroys_things",
"column_default": "false"
},
{
"table_name": "interest_applications",
"column_name": "not_house_trained",
"column_default": "false"
},
{
"table_name": "interest_applications",
"column_name": "gdpr_consent",
"column_default": "false"
},
{
"table_name": "interest_applications",
"column_name": "status",
"column_default": "'pending'::text"
},
{
"table_name": "interest_applications",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "interest_applications",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "interest_applications",
"column_name": "contact_history",
"column_default": "'[]'::jsonb"
},
{
"table_name": "interest_applications",
"column_name": "priority",
"column_default": "0"
},
{
"table_name": "invoice_counters",
"column_name": "counter",
"column_default": "0"
},
{
"table_name": "invoice_counters",
"column_name": "prefix",
"column_default": "'INV'::text"
},
{
"table_name": "invoice_counters",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "invoice_counters",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "invoice_items",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "invoice_items",
"column_name": "qty",
"column_default": "1"
},
{
"table_name": "invoice_items",
"column_name": "unit_price",
"column_default": "0"
},
{
"table_name": "invoice_runs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "invoice_runs",
"column_name": "invoices_created",
"column_default": "0"
},
{
"table_name": "invoice_runs",
"column_name": "run_at",
"column_default": "now()"
},
{
"table_name": "invoices",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "invoices",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "invoices",
"column_name": "invoice_date",
"column_default": "now()"
},
{
"table_name": "invoices",
"column_name": "status",
"column_default": "'draft'::text"
},
{
"table_name": "invoices",
"column_name": "total_amount",
"column_default": "0"
},
{
"table_name": "invoices",
"column_name": "invoice_type",
"column_default": "'full'::text"
},
{
"table_name": "invoices",
"column_name": "reminder_1_fee",
"column_default": "0"
},
{
"table_name": "invoices",
"column_name": "reminder_2_fee",
"column_default": "0"
},
{
"table_name": "invoices",
"column_name": "collection_fee",
"column_default": "0"
},
{
"table_name": "invoices",
"column_name": "late_interest",
"column_default": "0"
},
{
"table_name": "migrations",
"column_name": "id",
"column_default": "nextval('migrations_id_seq'::regclass)"
},
{
"table_name": "migrations",
"column_name": "executed_at",
"column_default": "now()"
},
{
"table_name": "migrations",
"column_name": "created_by",
"column_default": "CURRENT_USER"
},
{
"table_name": "org_email_history",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "org_email_history",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "org_number_subscription_history",
"column_name": "has_had_subscription",
"column_default": "true"
},
{
"table_name": "org_number_subscription_history",
"column_name": "first_subscription_at",
"column_default": "now()"
},
{
"table_name": "org_number_subscription_history",
"column_name": "last_checked_at",
"column_default": "now()"
},
{
"table_name": "org_subscriptions",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "org_subscriptions",
"column_name": "plan",
"column_default": "'basic'::text"
},
{
"table_name": "org_subscriptions",
"column_name": "status",
"column_default": "'trialing'::text"
},
{
"table_name": "org_subscriptions",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "org_subscriptions",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "org_subscriptions",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "orgs",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "orgs",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "orgs",
"column_name": "subscription_plan",
"column_default": "'basic'::text"
},
{
"table_name": "orgs",
"column_name": "subscription_status",
"column_default": "'trial'::text"
},
{
"table_name": "orgs",
"column_name": "status",
"column_default": "'trialing'::text"
},
{
"table_name": "orgs",
"column_name": "warning_sent",
"column_default": "false"
},
{
"table_name": "orgs",
"column_name": "vat_included",
"column_default": "true"
},
{
"table_name": "orgs",
"column_name": "vat_rate",
"column_default": "25"
},
{
"table_name": "orgs",
"column_name": "pricing_currency",
"column_default": "'SEK'::text"
},
{
"table_name": "orgs",
"column_name": "cancellation_policy",
"column_default": "'{\"days_3_to_7\": 0.5, \"days_7_plus\": 0, \"description\": \"7+ dagar: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: 100% avgift\", \"days_under_3\": 1.0}'::jsonb"
},
{
"table_name": "orgs",
"column_name": "service_types",
"column_default": "ARRAY[]::text[]"
},
{
"table_name": "orgs",
"column_name": "is_visible_to_customers",
"column_default": "true"
},
{
"table_name": "orgs",
"column_name": "bank_name",
"column_default": "'SEB'::text"
},
{
"table_name": "orgs",
"column_name": "payment_terms_days",
"column_default": "14"
},
{
"table_name": "orgs",
"column_name": "late_fee_amount",
"column_default": "60.00"
},
{
"table_name": "orgs",
"column_name": "interest_rate",
"column_default": "8.00"
},
{
"table_name": "orgs",
"column_name": "invoice_prefix",
"column_default": "'INV'::text"
},
{
"table_name": "orgs",
"column_name": "enabled_services",
"column_default": "ARRAY['daycare'::text, 'boarding'::text, 'grooming'::text]"
},
{
"table_name": "orgs",
"column_name": "has_had_subscription",
"column_default": "false"
},
{
"table_name": "orgs",
"column_name": "billing_period",
"column_default": "'monthly'::text"
},
{
"table_name": "owner_discounts",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "owner_discounts",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "owner_discounts",
"column_name": "created_at",
"column_default": "timezone('utc'::text, now())"
},
{
"table_name": "owner_discounts",
"column_name": "updated_at",
"column_default": "timezone('utc'::text, now())"
},
{
"table_name": "owners",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "owners",
"column_name": "created_at",
"column_default": "'2025-10-09 15:51:44.058603+00'::timestamp with time zone"
},
{
"table_name": "owners",
"column_name": "customer_number",
"column_default": "nextval('owners_customer_number_seq'::regclass)"
},
{
"table_name": "owners",
"column_name": "gdpr_consent",
"column_default": "false"
},
{
"table_name": "owners",
"column_name": "marketing_consent",
"column_default": "false"
},
{
"table_name": "owners",
"column_name": "photo_consent",
"column_default": "false"
},
{
"table_name": "owners",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "owners",
"column_name": "consent_status",
"column_default": "'pending'::text"
},
{
"table_name": "owners",
"column_name": "gdpr_marketing_consent",
"column_default": "false"
},
{
"table_name": "owners",
"column_name": "is_anonymized",
"column_default": "false"
},
{
"table_name": "pension_stays",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "pension_stays",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "pension_stays",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "pension_stays",
"column_name": "status",
"column_default": "'booked'::text"
},
{
"table_name": "pension_stays",
"column_name": "base_price",
"column_default": "0"
},
{
"table_name": "pension_stays",
"column_name": "total_amount",
"column_default": "0"
},
{
"table_name": "price_lists",
"column_name": "id",
"column_default": "uuid_generate_v4()"
},
{
"table_name": "price_lists",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "pricing",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "pricing",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "pricing",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "pricing",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "profiles",
"column_name": "role",
"column_default": "'staff'::text"
},
{
"table_name": "profiles",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "responsibilities",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "responsibilities",
"column_name": "staff_id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "rooms",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "rooms",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "rooms",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "rooms",
"column_name": "capacity_m2",
"column_default": "15"
},
{
"table_name": "rooms",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "rooms",
"column_name": "room_type",
"column_default": "'both'::text"
},
{
"table_name": "services",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "services",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "services",
"column_name": "unit",
"column_default": "'per_dog'::text"
},
{
"table_name": "services",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "special_dates",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "special_dates",
"column_name": "category",
"column_default": "'custom'::text"
},
{
"table_name": "special_dates",
"column_name": "price_surcharge",
"column_default": "0"
},
{
"table_name": "special_dates",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "special_dates",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "special_dates",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "subscription_types",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "subscription_types",
"column_name": "height_min",
"column_default": "0"
},
{
"table_name": "subscription_types",
"column_name": "height_max",
"column_default": "999"
},
{
"table_name": "subscription_types",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "subscription_types",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "subscription_types",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "subscriptions",
"column_name": "id",
"column_default": "uuid_generate_v4()"
},
{
"table_name": "subscriptions",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "subscriptions",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "subscriptions",
"column_name": "plan_name",
"column_default": "'basic'::text"
},
{
"table_name": "subscriptions",
"column_name": "price",
"column_default": "99"
},
{
"table_name": "subscriptions",
"column_name": "is_active",
"column_default": "true"
},
{
"table_name": "system_config",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "system_config",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "system_config",
"column_name": "updated_at",
"column_default": "now()"
},
{
"table_name": "trigger_execution_log",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "trigger_execution_log",
"column_name": "success",
"column_default": "true"
},
{
"table_name": "trigger_execution_log",
"column_name": "executed_at",
"column_default": "now()"
},
{
"table_name": "trigger_execution_log",
"column_name": "created_at",
"column_default": "now()"
},
{
"table_name": "user_org_roles",
"column_name": "id",
"column_default": "gen_random_uuid()"
},
{
"table_name": "user_org_roles",
"column_name": "created_at",
"column_default": "now()"
}
]
