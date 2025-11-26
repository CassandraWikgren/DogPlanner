[
  {
    "json_agg": [
      {
        "table_name": "attendance_logs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "dogs_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "date",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "check_in",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "check_out",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'''not_checked_in'''::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "notes",
        "data_type": "text",
        "column_default": "''::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "created_at",
        "data_type": "timestamp without time zone",
        "column_default": "'2025-10-09 16:13:20.322986'::timestamp without time zone",
        "is_nullable": "YES"
      },
      {
        "table_name": "attendance_logs",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "dog_size",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "base_price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "weekend_surcharge",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_prices",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "type",
        "data_type": "text",
        "column_default": "'high'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "boarding_seasons",
        "column_name": "price_multiplier",
        "data_type": "numeric",
        "column_default": "1.0",
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "booking_events",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "booking_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "event_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "booking_events",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "metadata",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "performed_by_user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_events",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_services",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "booking_services",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_services",
        "column_name": "booking_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_services",
        "column_name": "service_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_services",
        "column_name": "quantity",
        "data_type": "integer",
        "column_default": "1",
        "is_nullable": "YES"
      },
      {
        "table_name": "booking_services",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "bookings",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "bookings",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "bookings",
        "column_name": "checkin_time",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "checkout_time",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'pending'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "total_price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "deposit_amount",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "deposit_paid",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "base_price",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "addons",
        "data_type": "jsonb",
        "column_default": "'[]'::jsonb",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "discount_amount",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "extra_service_ids",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "prepayment_status",
        "data_type": "text",
        "column_default": "'unpaid'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "prepayment_invoice_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "afterpayment_invoice_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "belongings",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "bed_location",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "consent_required",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "consent_pending_until",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "cancellation_reason",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "cancelled_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "bookings",
        "column_name": "cancelled_by_user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "consent_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "consent_given",
        "data_type": "boolean",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "consent_text",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "consent_version",
        "data_type": "text",
        "column_default": "'1.0'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "ip_address",
        "data_type": "inet",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "user_agent",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "signed_document_url",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "witness_staff_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "witness_notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "given_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "consent_logs",
        "column_name": "withdrawn_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "expires_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "created_by",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "consent_logs",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "subscription_1day",
        "data_type": "integer",
        "column_default": "1500",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "subscription_2days",
        "data_type": "integer",
        "column_default": "2500",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "subscription_3days",
        "data_type": "integer",
        "column_default": "3300",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "subscription_4days",
        "data_type": "integer",
        "column_default": "4000",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "subscription_5days",
        "data_type": "integer",
        "column_default": "4500",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "single_day_price",
        "data_type": "integer",
        "column_default": "350",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "sibling_discount_percent",
        "data_type": "integer",
        "column_default": "10",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "trial_day_price",
        "data_type": "integer",
        "column_default": "200",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_pricing",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "scheduled_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "completed_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "completed_by",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "daycare_service_completions",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "dog_journal",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "dog_journal",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "dog_journal",
        "column_name": "text",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dog_journal",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "dog_journal",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dog_journal",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dog_journal",
        "column_name": "content",
        "data_type": "text",
        "column_default": "''::text",
        "is_nullable": "NO"
      },
      {
        "table_name": "dogs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "uuid_generate_v4()",
        "is_nullable": "NO"
      },
      {
        "table_name": "dogs",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "dogs",
        "column_name": "breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "birth",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "heightcm",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "subscription",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "days",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "addons",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "vaccdhp",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "vaccpi",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "owner",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "roomid",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "startdate",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "enddate",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "events",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "checked_in",
        "data_type": "boolean",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "note",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "last_updated",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "checkin_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "checkout_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "dogs",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "photo_url",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "gender",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "birth_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_sterilized",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "medical_notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "personality_traits",
        "data_type": "ARRAY",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "insurance_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "insurance_company",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_castrated",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_escape_artist",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "destroys_things",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_house_trained",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "special_needs",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "allergies",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "medications",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "behavior_notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "food_info",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "can_be_with_other_dogs",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "in_heat",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "heat_start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "is_deleted",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "deleted_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "deleted_reason",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "dogs",
        "column_name": "waitlist",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "error_logs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "error_logs",
        "column_name": "date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "error_logs",
        "column_name": "message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "error_logs",
        "column_name": "function",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "error_logs",
        "column_name": "created_at",
        "data_type": "timestamp without time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "external_customers",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "external_customers",
        "column_name": "customer_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "external_customers",
        "column_name": "customer_phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "external_customers",
        "column_name": "dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "external_customers",
        "column_name": "dog_breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "last_visit_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "external_customers",
        "column_name": "total_visits",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_service",
        "column_name": "dogs_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_service",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "quantity",
        "data_type": "integer",
        "column_default": "1",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "performed_at",
        "data_type": "date",
        "column_default": "CURRENT_DATE",
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_service",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "payment_type",
        "data_type": "text",
        "column_default": "'afterpayment'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_service",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_services",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "branch_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "label",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_services",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_services",
        "column_name": "unit",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "extra_services",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": "'all'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "extra_services",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "function_logs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "function_logs",
        "column_name": "function_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "function_logs",
        "column_name": "run_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "function_logs",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "function_logs",
        "column_name": "message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "function_logs",
        "column_name": "records_created",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "function_logs",
        "column_name": "error",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "deleted_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "dog_count",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "booking_count",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "gdpr_deletion_log",
        "column_name": "invoice_count",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "appointment_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "appointment_time",
        "data_type": "time without time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "estimated_price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'confirmed'::text",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "external_customer_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "external_customer_phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "external_dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "external_dog_breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "clip_length",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_bookings",
        "column_name": "shampoo_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "appointment_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "clip_length",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "shampoo_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "special_treatments",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "final_price",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "duration_minutes",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "before_photos",
        "data_type": "ARRAY",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "after_photos",
        "data_type": "ARRAY",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "next_appointment_recommended",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "external_customer_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "external_dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "external_dog_breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_journal",
        "column_name": "booking_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "performed_at",
        "data_type": "date",
        "column_default": "CURRENT_DATE",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "stylist_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "clip_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "products",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_logs",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "service_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "dog_size",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "coat_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "duration_minutes",
        "data_type": "integer",
        "column_default": "60",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_prices",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_services",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "service_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "base_price",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "size_multiplier_enabled",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_services",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_services",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "grooming_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "performed_at",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "extra_service_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "grooming_with_invoice",
        "column_name": "invoiced_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "parent_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "parent_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "parent_phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "owner_city",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "owner_address",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_birth",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_age",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_gender",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_size",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "dog_height_cm",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "subscription_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "preferred_start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "preferred_days",
        "data_type": "ARRAY",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "special_needs",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "special_care_needs",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "is_neutered",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "is_escape_artist",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "destroys_things",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "not_house_trained",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "previous_daycare_experience",
        "data_type": "boolean",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "gdpr_consent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'pending'::text",
        "is_nullable": "NO"
      },
      {
        "table_name": "interest_applications",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "first_contact_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "first_contact_notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "visit_booked_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "visit_status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "visit_completed_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "visit_result",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "contact_history",
        "data_type": "jsonb",
        "column_default": "'[]'::jsonb",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "priority",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "expected_start_month",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "interest_applications",
        "column_name": "visit_booked_time",
        "data_type": "time without time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "current_year",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "counter",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "prefix",
        "data_type": "text",
        "column_default": "'INV'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_counters",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_items",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_items",
        "column_name": "invoice_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_items",
        "column_name": "booking_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_items",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_items",
        "column_name": "qty",
        "data_type": "numeric",
        "column_default": "1",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_items",
        "column_name": "unit_price",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_items",
        "column_name": "amount",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "month_id",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "invoices_created",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "run_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "error_message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs",
        "column_name": "metadata",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "month_id",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "total_runs",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "successful_runs",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "failed_runs",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "total_invoices_created",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoice_runs_summary",
        "column_name": "last_run_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "invoices",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "invoices",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "invoice_date",
        "data_type": "date",
        "column_default": "now()",
        "is_nullable": "NO"
      },
      {
        "table_name": "invoices",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'draft'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "total_amount",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "billed_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "billed_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "billed_address",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "deleted_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "invoice_type",
        "data_type": "text",
        "column_default": "'full'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "due_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "invoice_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "sent_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "paid_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "payment_method",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "reminder_1_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "reminder_2_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "reminder_1_fee",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "reminder_2_fee",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "collection_fee",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "late_interest",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "ocr_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "invoices",
        "column_name": "payment_reference",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "function_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "run_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "records_created",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "latest_function_logs",
        "column_name": "error",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "migrations",
        "column_name": "id",
        "data_type": "integer",
        "column_default": "nextval('migrations_id_seq'::regclass)",
        "is_nullable": "NO"
      },
      {
        "table_name": "migrations",
        "column_name": "version",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "migrations",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "migrations",
        "column_name": "executed_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "migrations",
        "column_name": "execution_time_ms",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "migrations",
        "column_name": "created_by",
        "data_type": "text",
        "column_default": "CURRENT_USER",
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "trial_ends_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "days_left",
        "data_type": "double precision",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_status_view",
        "column_name": "readable_status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "plan",
        "data_type": "text",
        "column_default": "'basic'::text",
        "is_nullable": "NO"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'trialing'::text",
        "is_nullable": "NO"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "trial_starts_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "trial_ends_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "current_period_end",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "NO"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "org_subscriptions",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "subscription_plan",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "trial_ends_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "trial_status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "organization_subscription_overview",
        "column_name": "user_count",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "orgs",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "orgs",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "subscription_plan",
        "data_type": "text",
        "column_default": "'basic'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "trial_ends_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "subscription_status",
        "data_type": "text",
        "column_default": "'trial'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "org_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'trialing'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "warning_sent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "pending_plan_change",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "address",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "vat_included",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "vat_rate",
        "data_type": "numeric",
        "column_default": "25",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "pricing_currency",
        "data_type": "text",
        "column_default": "'SEK'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "contact_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "invoice_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "reply_to_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "email_sender_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "slug",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "cancellation_policy",
        "data_type": "jsonb",
        "column_default": "'{\"days_3_to_7\": 0.5, \"days_7_plus\": 0, \"description\": \"7+ dagar: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: 100% avgift\", \"days_under_3\": 1.0}'::jsonb",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "lan",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "kommun",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "service_types",
        "data_type": "ARRAY",
        "column_default": "ARRAY[]::text[]",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "is_visible_to_customers",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "bankgiro",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "plusgiro",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "swish_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "bank_name",
        "data_type": "text",
        "column_default": "'SEB'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "iban",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "bic_swift",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "payment_terms_days",
        "data_type": "integer",
        "column_default": "14",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "late_fee_amount",
        "data_type": "numeric",
        "column_default": "60.00",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "interest_rate",
        "data_type": "numeric",
        "column_default": "8.00",
        "is_nullable": "YES"
      },
      {
        "table_name": "orgs",
        "column_name": "invoice_prefix",
        "data_type": "text",
        "column_default": "'INV'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "discount_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "discount_value",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "reason",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "valid_from",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "valid_until",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "timezone('utc'::text, now())",
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "timezone('utc'::text, now())",
        "is_nullable": "YES"
      },
      {
        "table_name": "owner_discounts",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "owners",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "owners",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "full_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "postal_code",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "city",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "contact_person_2",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "contact_phone_2",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "'2025-10-09 15:51:44.058603+00'::timestamp with time zone",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "customer_number",
        "data_type": "integer",
        "column_default": "nextval('owners_customer_number_seq'::regclass)",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "profile_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "personnummer",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "address",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "gdpr_consent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "marketing_consent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "photo_consent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "consent_status",
        "data_type": "text",
        "column_default": "'pending'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "consent_verified_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "gdpr_marketing_consent",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "is_anonymized",
        "data_type": "boolean",
        "column_default": "false",
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "anonymized_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "anonymization_reason",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "owners",
        "column_name": "data_retention_until",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "stay_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "heightcm",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "subscription",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "owner_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "owner_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "room_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "base_price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "total_amount",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "addons",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_full_view",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "stay_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "dog_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "breed",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "height_cm",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "owner_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "owner_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "room_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "capacity",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "base_price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "addons",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "total_amount",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_calendar_view",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "owner_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "owner_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "owner_email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "owner_phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "city",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "postal_code",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "total_dogs",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "total_stays",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "total_spent",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_owner_summary_view",
        "column_name": "month_period",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "room_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "capacity",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "dog_org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "dogs_booked",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "total_area_used",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_room_occupancy_view",
        "column_name": "remaining_area",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "pension_stays",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "pension_stays",
        "column_name": "room_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "pension_stays",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "pension_stays",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "pension_stays",
        "column_name": "status",
        "data_type": "text",
        "column_default": "'booked'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "base_price",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "addons",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "total_amount",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "YES"
      },
      {
        "table_name": "pension_stays",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "price_lists",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "uuid_generate_v4()",
        "is_nullable": "NO"
      },
      {
        "table_name": "price_lists",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "price_lists",
        "column_name": "effective_from",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "price_lists",
        "column_name": "items",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "price_lists",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "price_lists",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "pricing",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "service_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "pricing",
        "column_name": "price_per_day",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "price_per_hour",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "pricing",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "profiles",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "profiles",
        "column_name": "role",
        "data_type": "text",
        "column_default": "'staff'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "full_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "email",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "phone",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "profiles",
        "column_name": "last_sign_in_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "trigger_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "table_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "operation",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "row_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "error_message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "new_data",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "recent_trigger_failures",
        "column_name": "executed_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "responsibilities",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "responsibilities",
        "column_name": "staff_id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "responsibilities",
        "column_name": "task",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "responsibilities",
        "column_name": "done",
        "data_type": "boolean",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "responsibilities",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "rooms",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "capacity",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "capacity_m2",
        "data_type": "numeric",
        "column_default": "15",
        "is_nullable": "NO"
      },
      {
        "table_name": "rooms",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "rooms",
        "column_name": "room_type",
        "data_type": "text",
        "column_default": "'both'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "services",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "services",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "services",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "services",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "services",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "services",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "services",
        "column_name": "unit",
        "data_type": "text",
        "column_default": "'per_dog'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "services",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "special_dates",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "special_dates",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "special_dates",
        "column_name": "date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "special_dates",
        "column_name": "name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "special_dates",
        "column_name": "category",
        "data_type": "text",
        "column_default": "'custom'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "special_dates",
        "column_name": "price_surcharge",
        "data_type": "numeric",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "special_dates",
        "column_name": "notes",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "special_dates",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "special_dates",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "special_dates",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "staff_notes",
        "column_name": "id",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "staff_notes",
        "column_name": "note",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "staff_notes",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscription_types",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "subscription_types",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscription_types",
        "column_name": "subscription_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "subscription_types",
        "column_name": "height_min",
        "data_type": "integer",
        "column_default": "0",
        "is_nullable": "NO"
      },
      {
        "table_name": "subscription_types",
        "column_name": "height_max",
        "data_type": "integer",
        "column_default": "999",
        "is_nullable": "NO"
      },
      {
        "table_name": "subscription_types",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "subscription_types",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscription_types",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscription_types",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "uuid_generate_v4()",
        "is_nullable": "NO"
      },
      {
        "table_name": "subscriptions",
        "column_name": "dog_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "status",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "customer_number",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "abon_type",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "price_per_month",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "start_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "end_date",
        "data_type": "date",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "weekdays",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "trial_ends_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "plan_name",
        "data_type": "text",
        "column_default": "'basic'::text",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "renews_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "price",
        "data_type": "numeric",
        "column_default": "99",
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "next_billing_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "subscriptions",
        "column_name": "is_active",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "YES"
      },
      {
        "table_name": "system_config",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "system_config",
        "column_name": "config_key",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "system_config",
        "column_name": "config_value",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "system_config",
        "column_name": "description",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "system_config",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "system_config",
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "trigger_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "table_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "operation",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "NO"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "row_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "old_data",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "new_data",
        "data_type": "jsonb",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "success",
        "data_type": "boolean",
        "column_default": "true",
        "is_nullable": "NO"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "error_message",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "execution_time_ms",
        "data_type": "integer",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "executed_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_execution_log",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "trigger_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "table_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "total_executions",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "successful",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "failed",
        "data_type": "bigint",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "avg_execution_ms",
        "data_type": "numeric",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "trigger_health_summary",
        "column_name": "last_execution",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "user_org_roles",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": "gen_random_uuid()",
        "is_nullable": "NO"
      },
      {
        "table_name": "user_org_roles",
        "column_name": "user_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "user_org_roles",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "user_org_roles",
        "column_name": "role",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "user_org_roles",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": "now()",
        "is_nullable": "YES"
      },
      {
        "table_name": "users_without_org",
        "column_name": "id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "users_without_org",
        "column_name": "email",
        "data_type": "character varying",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "users_without_org",
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "users_without_org",
        "column_name": "intended_org_name",
        "data_type": "text",
        "column_default": null,
        "is_nullable": "YES"
      },
      {
        "table_name": "users_without_org",
        "column_name": "org_id",
        "data_type": "uuid",
        "column_default": null,
        "is_nullable": "YES"
      }
    ]
  }
]