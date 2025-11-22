


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."activate_paid_subscription"("org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.orgs
  set 
    status = 'active',
    warning_sent = false,
    trial_ends_at = null
  where id = org_id;

  insert into public.error_logs (date, message, function)
  values (
    now(),
    format('Abonnemang aktiverat för organisation %s', org_id),
    'activate_paid_subscription'
  );
end;
$$;


ALTER FUNCTION "public"."activate_paid_subscription"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_default_special_dates_for_org"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 2025 - MINOR
  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
  (NEW.id, '2025-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),
  (NEW.id, '2025-04-18', 'Långfredagen', 'red_day', 100, 'Påsken startar'),
  (NEW.id, '2025-04-21', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),
  (NEW.id, '2025-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),
  (NEW.id, '2025-05-29', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag vanlig'),
  (NEW.id, '2025-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),
  (NEW.id, '2025-11-01', 'Alla helgons dag', 'red_day', 75, 'Höstlov')
  ON CONFLICT (org_id, date) DO NOTHING;

  -- 2025 - MAJOR
  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
  (NEW.id, '2025-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),
  (NEW.id, '2025-04-20', 'Påskdagen', 'red_day', 200, 'Påskhelg'),
  (NEW.id, '2025-06-08', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),
  (NEW.id, '2025-12-25', 'Juldagen', 'red_day', 200, 'Jul'),
  (NEW.id, '2025-12-26', 'Annandag jul', 'red_day', 150, 'Jul')
  ON CONFLICT (org_id, date) DO NOTHING;

  -- 2025 - PEAK
  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
  (NEW.id, '2025-06-20', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),
  (NEW.id, '2025-06-21', 'Midsommardagen', 'red_day', 350, 'Midsommar'),
  (NEW.id, '2025-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen börjar'),
  (NEW.id, '2025-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),
  (NEW.id, '2025-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),
  (NEW.id, '2025-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),
  (NEW.id, '2025-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')
  ON CONFLICT (org_id, date) DO NOTHING;

  -- 2026 dates (samma struktur)
  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES
  (NEW.id, '2026-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),
  (NEW.id, '2026-04-03', 'Långfredagen', 'red_day', 100, 'Påsken startar'),
  (NEW.id, '2026-04-06', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),
  (NEW.id, '2026-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),
  (NEW.id, '2026-05-14', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag'),
  (NEW.id, '2026-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),
  (NEW.id, '2026-10-31', 'Alla helgons dag', 'red_day', 75, 'Höstlov'),
  (NEW.id, '2026-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),
  (NEW.id, '2026-04-05', 'Påskdagen', 'red_day', 200, 'Påskhelg'),
  (NEW.id, '2026-05-24', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),
  (NEW.id, '2026-12-25', 'Juldagen', 'red_day', 200, 'Jul'),
  (NEW.id, '2026-12-26', 'Annandag jul', 'red_day', 150, 'Jul'),
  (NEW.id, '2026-06-19', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),
  (NEW.id, '2026-06-20', 'Midsommardagen', 'red_day', 350, 'Midsommar'),
  (NEW.id, '2026-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen'),
  (NEW.id, '2026-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),
  (NEW.id, '2026-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),
  (NEW.id, '2026-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),
  (NEW.id, '2026-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')
  ON CONFLICT (org_id, date) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_default_special_dates_for_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_staff_member"("staff_email" "text", "staff_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_org_id uuid;
  new_user_id uuid;
BEGIN
  -- Hämta organisationen som adminen tillhör
  SELECT org_id INTO admin_org_id
  FROM public.profiles
  WHERE id = auth.uid()
  AND role = 'admin';

  IF admin_org_id IS NULL THEN
    RAISE EXCEPTION 'Du måste vara admin för att kunna lägga till personal.';
  END IF;

  -- Skapa en ny användare i auth.users
  INSERT INTO auth.users (email)
  VALUES (staff_email)
  RETURNING id INTO new_user_id;

  -- Skapa profil kopplad till samma organisation
  INSERT INTO public.profiles (id, org_id, role, full_name)
  VALUES (
    new_user_id,
    admin_org_id,
    'staff',
    staff_name
  );

  RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."add_staff_member"("staff_email" "text", "staff_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text" DEFAULT 'GDPR-begäran'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Uppdatera owner-tabellen
  UPDATE owners SET
    full_name = 'Raderad kund',
    email = NULL,
    phone = NULL,
    address = NULL,
    personal_number = NULL,
    gdpr_marketing_consent = false,
    is_anonymized = true,
    anonymized_at = now(),
    anonymization_reason = p_reason
  WHERE id = p_owner_id;

  -- Uppdatera alla bokningar (ta bort personlig info)
  UPDATE bookings SET
    notes = CASE 
      WHEN notes IS NOT NULL THEN '[ANONYMISERAD]'
      ELSE NULL
    END,
    special_requests = CASE 
      WHEN special_requests IS NOT NULL THEN '[ANONYMISERAD]'
      ELSE NULL
    END
  WHERE owner_id = p_owner_id;

  -- Uppdatera belongings om kolumnen finns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'belongings'
  ) THEN
    UPDATE bookings SET
      belongings = CASE 
        WHEN belongings IS NOT NULL THEN '[ANONYMISERAD]'
        ELSE NULL
      END
    WHERE owner_id = p_owner_id;
  END IF;

  -- Mjuk radering av hundar
  UPDATE dogs SET
    is_deleted = TRUE,
    deleted_at = now(),
    deleted_reason = 'Ägare anonymiserad: ' || p_reason,
    medical_conditions = NULL,
    allergies = NULL,
    special_diet = NULL,
    notes = NULL
  WHERE owner_id = p_owner_id;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text") IS 'GDPR Article 17 - Anonymiserar ägare och relaterad data';



CREATE OR REPLACE FUNCTION "public"."auto_checkout_dogs"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update dogs
  set checked_in = false
  where checkout_date < current_date
  and checked_in = true;
end;
$$;


ALTER FUNCTION "public"."auto_checkout_dogs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_create_grooming_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_dog_id UUID;
  v_owner_id UUID;
BEGIN
  -- Only proceed if status changed TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if journal entry already exists for this booking
    IF EXISTS (
      SELECT 1 FROM grooming_journal 
      WHERE booking_id = NEW.id
    ) THEN
      -- Journal already exists, skip
      RETURN NEW;
    END IF;

    -- For existing dogs: Get owner_id from dogs table
    IF NEW.dog_id IS NOT NULL THEN
      SELECT owner_id INTO v_owner_id
      FROM dogs
      WHERE id = NEW.dog_id;
      
      -- Create journal entry with dog_id and owner_id
      INSERT INTO grooming_journal (
        org_id,
        dog_id,
        owner_id,
        booking_id,
        appointment_date,
        clip_length,
        shampoo_type,
        special_treatments,
        notes,
        duration_minutes,
        total_price,
        groomer_notes,
        created_at
      ) VALUES (
        NEW.org_id,
        NEW.dog_id,
        v_owner_id,
        NEW.id,
        NEW.appointment_date,
        COALESCE(NEW.clip_length, ''),
        COALESCE(NEW.shampoo_type, ''),
        NEW.service_type,
        NEW.notes,
        NULL, -- duration calculated from actual time
        NEW.estimated_price,
        'Auto-skapad från bokning',
        NOW()
      );
      
    -- For walk-in customers: Use external_* fields
    ELSE
      INSERT INTO grooming_journal (
        org_id,
        booking_id,
        appointment_date,
        external_customer_name,
        external_customer_phone,
        external_dog_name,
        external_dog_breed,
        clip_length,
        shampoo_type,
        special_treatments,
        notes,
        duration_minutes,
        total_price,
        groomer_notes,
        created_at
      ) VALUES (
        NEW.org_id,
        NEW.id,
        NEW.appointment_date,
        NEW.external_customer_name,
        NEW.external_customer_phone,
        NEW.external_dog_name,
        NEW.external_dog_breed,
        COALESCE(NEW.clip_length, ''),
        COALESCE(NEW.shampoo_type, ''),
        NEW.service_type,
        NEW.notes,
        NULL,
        NEW.estimated_price,
        'Auto-skapad från walk-in bokning',
        NOW()
      );
    END IF;
    
    RAISE NOTICE 'Auto-created grooming journal entry for booking %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_grooming_journal"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_create_grooming_journal"() IS 'Automatically creates grooming_journal entry when booking status changes to completed. Handles both existing dogs (with dog_id) and walk-in customers (with external_* fields).';



CREATE OR REPLACE FUNCTION "public"."auto_generate_customer_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  seq_name TEXT;
  next_val INTEGER;
BEGIN
  -- Om customer_number inte redan är satt
  IF NEW.customer_number IS NULL THEN
    -- Försök hitta sekvensen
    SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
      -- Sequence finns, använd den
      EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
      NEW.customer_number := next_val;
      RAISE NOTICE 'Generated customer_number % using sequence %', next_val, seq_name;
    ELSE
      -- Ingen sequence, använd MAX+1 som fallback
      SELECT COALESCE(MAX(customer_number), 0) + 1 
      INTO NEW.customer_number 
      FROM owners;
      RAISE WARNING 'No sequence found, using MAX+1 fallback: %', NEW.customer_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_customer_number"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_generate_customer_number"() IS 'Trigger-funktion som auto-genererar ett unikt customer_number för nya owners.';



CREATE OR REPLACE FUNCTION "public"."auto_match_owner_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform public.match_owners_to_dogs();
  return new;
end;
$$;


ALTER FUNCTION "public"."auto_match_owner_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calc_total_amount"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  addon_sum numeric(10,2) := 0;
begin
  if NEW.addons is not null then
    select sum((x->>'price')::numeric)
    into addon_sum
    from jsonb_array_elements(NEW.addons) as x;
  end if;

  NEW.total_amount := coalesce(NEW.base_price,0) + coalesce(addon_sum,0);
  return NEW;
end;
$$;


ALTER FUNCTION "public"."calc_total_amount"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("cancellation_fee" numeric, "refund_amount" numeric, "days_until_start" integer, "policy_applied" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_policy jsonb;
  v_fee_percentage numeric;
  v_days_until integer;
BEGIN
  -- Hämta bokningen
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bokning med ID % hittades inte', p_booking_id;
  END IF;

  -- Hämta organisationens avbokningspolicy
  SELECT cancellation_policy INTO v_policy
  FROM orgs
  WHERE id = v_booking.org_id;

  -- Beräkna dagar kvar till start
  v_days_until := v_booking.start_date - p_cancellation_date::date;

  -- Bestäm avgiftsprocent baserat på policy
  IF v_days_until >= 7 THEN
    v_fee_percentage := (v_policy->>'days_7_plus')::numeric;
    policy_applied := '7+ dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  ELSIF v_days_until >= 3 THEN
    v_fee_percentage := (v_policy->>'days_3_to_7')::numeric;
    policy_applied := '3-7 dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  ELSE
    v_fee_percentage := (v_policy->>'days_under_3')::numeric;
    policy_applied := 'Under 3 dagar: ' || (v_fee_percentage * 100)::text || '% avgift';
  END IF;

  -- Beräkna avgift och återbetalning
  cancellation_fee := v_booking.total_price * v_fee_percentage;
  refund_amount := v_booking.total_price - cancellation_fee;
  days_until_start := v_days_until;

  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone) IS 'Beräknar avbokningsavgift baserat på organisationens policy';



CREATE OR REPLACE FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") RETURNS "date"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_last_invoice_date date;
  v_retention_date date;
BEGIN
  -- Hitta senaste fakturan för ägaren
  SELECT MAX(due_date) INTO v_last_invoice_date
  FROM invoices
  WHERE customer_id = p_owner_id;

  -- Om inga fakturor finns, använd senaste bokningen
  IF v_last_invoice_date IS NULL THEN
    SELECT MAX(end_date) INTO v_last_invoice_date
    FROM bookings b
    WHERE b.owner_id = p_owner_id;
  END IF;

  -- Lägg till 7 år (bokföringskrav)
  v_retention_date := v_last_invoice_date + INTERVAL '7 years';

  RETURN v_retention_date;
END;
$$;


ALTER FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") IS 'Beräknar datum då kunddata kan raderas (7 år efter sista faktura)';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_trigger_logs"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM trigger_execution_log
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up trigger logs older than 30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_trigger_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dog_journal_on_new_dog"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only create journal entry if user is logged in
  -- For public applications (auth.uid() is NULL) skip this
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)
    VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_dog_journal_on_new_dog"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice_on_checkout"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_total_amount NUMERIC := 0;
  v_base_amount NUMERIC := 0;
  v_extra_service RECORD;
  v_booking_service RECORD;
  v_description TEXT;
  v_nights INTEGER;
  v_service_price NUMERIC;
BEGIN
  -- Skapa faktura endast när status ändras till 'checked_out'
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    
    -- Hämta owner_id från hunden
    SELECT owner_id INTO v_owner_id 
    FROM dogs 
    WHERE id = NEW.dog_id;

    IF v_owner_id IS NULL THEN
      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;
      RETURN NEW;
    END IF;

    -- Beräkna antal nätter
    v_nights := (NEW.end_date - NEW.start_date);
    IF v_nights <= 0 THEN
      v_nights := 1;
    END IF;

    -- Använd bokningens totalpris som bas
    v_base_amount := COALESCE(NEW.total_price, NEW.base_price, 0);
    v_total_amount := v_base_amount;

    -- Skapa faktura
    INSERT INTO invoices (
      org_id,
      owner_id,
      invoice_date,
      due_date,
      total_amount,
      status,
      invoice_type,
      billed_name,
      billed_email
    )
    VALUES (
      NEW.org_id,
      v_owner_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      0, -- Uppdateras nedan
      'draft',
      'afterpayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- ============================================
    -- RAD 1: Grundpris för bokningen (logi)
    -- ============================================
    IF v_base_amount > 0 THEN
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount
      )
      VALUES (
        v_invoice_id,
        format('Hundpensionat %s - %s (%s nätter)', 
          NEW.start_date, 
          NEW.end_date, 
          v_nights
        ),
        v_nights,
        v_base_amount / v_nights,
        v_base_amount
      );
    END IF;

    -- ============================================
    -- RAD 2: Tillval från booking_services
    -- ============================================
    BEGIN
      FOR v_booking_service IN
        SELECT 
          bs.quantity,
          bs.unit_price,
          bs.total_price,
          bs.staff_notes,
          COALESCE(ps.label, 'Tilläggstjänst') as service_name
        FROM booking_services bs
        LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
        WHERE bs.booking_id = NEW.id
      LOOP
        v_description := v_booking_service.service_name;
        
        IF v_booking_service.staff_notes IS NOT NULL THEN
          v_description := v_description || ' - ' || v_booking_service.staff_notes;
        END IF;

        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_amount
        )
        VALUES (
          v_invoice_id,
          v_description,
          v_booking_service.quantity,
          v_booking_service.unit_price,
          v_booking_service.total_price
        );

        v_total_amount := v_total_amount + v_booking_service.total_price;
      END LOOP;
    EXCEPTION 
      WHEN undefined_table THEN
        RAISE NOTICE 'booking_services tabellen finns inte, hoppar över';
    END;

    -- ============================================
    -- RAD 3: Återkommande tillägg från extra_service
    -- (endast de som är aktiva under bokningsperioden)
    -- ============================================
    FOR v_extra_service IN
      SELECT 
        service_type,
        frequency,
        price,
        notes
      FROM extra_service
      WHERE dogs_id = NEW.dog_id
        AND org_id = NEW.org_id
        AND COALESCE(is_active, true) = true
        AND start_date <= NEW.end_date
        AND (end_date IS NULL OR end_date >= NEW.start_date)
    LOOP
      v_description := v_extra_service.service_type;
      
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;

      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || ' - ' || v_extra_service.notes;
      END IF;

      -- Hämta pris från extra_service eller extra_services katalog
      v_service_price := v_extra_service.price;
      
      IF v_service_price IS NULL THEN
        BEGIN
          SELECT price INTO v_service_price
          FROM extra_services
          WHERE label = v_extra_service.service_type
            AND org_id = NEW.org_id
            AND COALESCE(is_active, true) = true
          LIMIT 1;
        EXCEPTION 
          WHEN OTHERS THEN
            v_service_price := 0;
        END;
      END IF;

      v_service_price := COALESCE(v_service_price, 0);

      IF v_service_price > 0 THEN
        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_amount
        )
        VALUES (
          v_invoice_id,
          v_description,
          1,
          v_service_price,
          v_service_price
        );

        v_total_amount := v_total_amount + v_service_price;
      END IF;
    END LOOP;

    -- ============================================
    -- RAD 4: Rabatt
    -- ============================================
    IF NEW.discount_amount > 0 THEN
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount
      )
      VALUES (
        v_invoice_id,
        'Rabatt',
        1,
        -NEW.discount_amount,
        -NEW.discount_amount
      );

      v_total_amount := v_total_amount - NEW.discount_amount;
    END IF;

    -- Uppdatera fakturans totalsumma
    UPDATE invoices
    SET total_amount = GREATEST(v_total_amount, 0)
    WHERE id = v_invoice_id;

    -- Uppdatera bokningen med faktura-ID
    UPDATE bookings 
    SET afterpayment_invoice_id = v_invoice_id
    WHERE id = NEW.id;

    RAISE NOTICE '✅ Faktura % skapad för bokning % (Total: % kr, inkl % från extra_service)', 
      v_invoice_id, NEW.id, v_total_amount, 
      (SELECT COUNT(*) FROM extra_service WHERE dogs_id = NEW.dog_id);

  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_invoice_on_checkout"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_org_and_admin"("org_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- 1️⃣ Skapa ny organisation
  INSERT INTO public.orgs (name, subscription_status, subscription_plan, trial_ends_at)
  VALUES (
    org_name,
    'trial',
    'basic',
    now() + interval '3 months'
  )
  RETURNING id INTO new_org_id;

  -- 2️⃣ Skapa användarens profil och koppla till nya org
  INSERT INTO public.profiles (id, org_id, role, full_name)
  VALUES (
    auth.uid(),
    new_org_id,
    'admin',
    split_part(auth.email(), '@', 1)
  );

  -- 3️⃣ Returnera organisationens ID
  RETURN new_org_id;
END;
$$;


ALTER FUNCTION "public"."create_org_and_admin"("org_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_prepayment_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_prepayment_amount NUMERIC := 0;
  v_room_price NUMERIC := 0;
  v_due_date DATE;
BEGIN
  -- Kör endast när status ändras till 'confirmed' från 'pending'
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    
    -- Hämta owner_id från hunden
    SELECT owner_id INTO v_owner_id 
    FROM dogs 
    WHERE id = NEW.dog_id;

    -- Beräkna förskottsbelopp (rumsbokning + prepayment-tjänster)
    -- Använd total_price minus eventuella afterpayment-tjänster
    v_prepayment_amount := COALESCE(NEW.total_price, 0);
    
    -- Om det finns extra_service_ids, dra bort efterskottstjänster
    IF NEW.extra_service_ids IS NOT NULL THEN
      SELECT COALESCE(SUM(price), 0) INTO v_room_price
      FROM extra_service
      WHERE id = ANY(NEW.extra_service_ids)
        AND payment_type = 'afterpayment';
      
      v_prepayment_amount := v_prepayment_amount - v_room_price;
    END IF;

    -- Sätt förfallodatum till 14 dagar från nu (eller innan startdatum)
    v_due_date := LEAST(
      CURRENT_DATE + INTERVAL '14 days',
      NEW.start_date - INTERVAL '3 days'
    )::DATE;

    -- Skapa förskottsfaktura
    INSERT INTO invoices (
      org_id,
      owner_id,
      invoice_date,
      due_date,
      total_amount,
      status,
      invoice_type,
      billed_name,
      billed_email
    )
    VALUES (
      NEW.org_id,
      v_owner_id,
      CURRENT_DATE,
      v_due_date,
      v_prepayment_amount,
      'draft',
      'prepayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- Lägg till fakturarad för rumsbokning
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      total_amount
    )
    VALUES (
      v_invoice_id,
      format('Pensionatvistelse %s till %s', NEW.start_date, NEW.end_date),
      1,
      v_prepayment_amount,
      v_prepayment_amount
    );

    -- Uppdatera bokningen med faktura-ID
    NEW.prepayment_invoice_id := v_invoice_id;
    
    RAISE NOTICE '✅ Förskottsfaktura skapad: % för bokning %', v_invoice_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_prepayment_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select org_id from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."current_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_org_if_no_admins"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_org_id uuid;
  v_admin_count int;
begin
  v_org_id := old.org_id;

  -- Räkna kvarvarande admins i organisationen
  select count(*) into v_admin_count
  from public.profiles
  where org_id = v_org_id
    and role = 'admin';

  -- Om inga admins finns kvar → radera hela företaget
  if v_admin_count = 0 then
    raise notice '⚠️ Varning: Ingen admin kvar i organisationen %, företaget kommer att tas bort!', v_org_id;

    -- Radera i rätt ordning (för att undvika FK-fel)
    delete from public.bookings where org_id = v_org_id;
    delete from public.owners where org_id = v_org_id;
    delete from public.dogs where org_id = v_org_id;
    delete from public.invoices where org_id = v_org_id;
    delete from public.orgs where id = v_org_id;

    raise notice '✅ Organisation % och all tillhörande data har raderats enligt GDPR.', v_org_id;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."delete_org_if_no_admins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_org_has_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_org_id uuid;
  v_admin_count int;
  v_new_admin uuid;
begin
  -- Identifiera organisationen baserat på den gamla raden
  v_org_id := old.org_id;

  -- Räkna antalet kvarvarande admins
  select count(*) into v_admin_count
  from public.profiles
  where org_id = v_org_id
    and role = 'admin';

  -- Om inga admins finns kvar → uppgradera en slumpmässig staff till admin
  if v_admin_count = 0 then
    select id into v_new_admin
    from public.profiles
    where org_id = v_org_id
    order by created_at asc
    limit 1;

    if v_new_admin is not null then
      update public.profiles
      set role = 'admin'
      where id = v_new_admin;

      raise notice 'Ingen admin kvar i org %, uppgraderade användare % till admin', v_org_id, v_new_admin;
    else
      raise notice 'Ingen kvar att uppgradera i org %, organisationen står utan användare', v_org_id;
    end if;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."ensure_org_has_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_owner_id UUID;
  v_dog_ids UUID[];
  v_result jsonb;
BEGIN
  -- Verifiera att användaren äger datan
  SELECT o.id INTO v_owner_id
  FROM public.owners o
  JOIN public.profiles p ON o.email = p.email
  WHERE p.id = p_user_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No owner found for this user'
    );
  END IF;
  
  -- Samla hundar som ska raderas
  SELECT ARRAY_AGG(id) INTO v_dog_ids
  FROM public.dogs
  WHERE owner_id = v_owner_id;
  
  -- Börja radera i rätt ordning (för att undvika FK-fel)
  
  -- 1. Radera bokningar för hundar
  DELETE FROM public.bookings
  WHERE dog_id = ANY(v_dog_ids);
  
  -- 2. Radera extra_service för hundar
  DELETE FROM public.extra_service
  WHERE dogs_id = ANY(v_dog_ids);
  
  -- 3. Radera dog_journal
  DELETE FROM public.dog_journal
  WHERE dog_id = ANY(v_dog_ids);
  
  -- 4. Radera hundar
  DELETE FROM public.dogs
  WHERE owner_id = v_owner_id;
  
  -- 5. Radera fakturor
  DELETE FROM public.invoice_items
  WHERE invoice_id IN (
    SELECT id FROM public.invoices WHERE owner_id = v_owner_id
  );
  
  DELETE FROM public.invoices
  WHERE owner_id = v_owner_id;
  
  -- 6. Markera samtycke som återdraget
  UPDATE public.consent_logs
  SET withdrawn_at = NOW()
  WHERE owner_id = v_owner_id AND withdrawn_at IS NULL;
  
  -- 7. Radera interest_applications (om tabellen och kolumnen finns)
  BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interest_applications' AND column_name = 'email'
    ) THEN
        DELETE FROM public.interest_applications
        WHERE email IN (
          SELECT email FROM public.owners WHERE id = v_owner_id
        );
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Tabellen finns inte, fortsätt
  END;
  
  -- 8. Radera ägare (owner)
  DELETE FROM public.owners
  WHERE id = v_owner_id;
  
  -- 9. Radera profil
  DELETE FROM public.profiles
  WHERE id = p_user_id;
  
  -- 10. Radera auth user
  DELETE FROM auth.users
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'All user data deleted successfully',
    'deleted', jsonb_build_object(
      'owner_id', v_owner_id,
      'dog_count', COALESCE(array_length(v_dog_ids, 1), 0)
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;


ALTER FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") IS 'GDPR compliance: Radera ALL användardata. Anropa från authenticated context.
Exempel: SELECT public.gdpr_delete_user_data(auth.uid());';



CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence integer;
  v_invoice_number text;
BEGIN
  -- Format: YYYY-MM-XXXX (t.ex. 2025-11-0001)
  v_year := to_char(CURRENT_DATE, 'YYYY');
  v_month := to_char(CURRENT_DATE, 'MM');
  
  -- Hitta högsta sequence number för denna månad
  SELECT COALESCE(
    MAX(
      CAST(
        split_part(invoice_number, '-', 3) AS integer
      )
    ), 
    0
  ) + 1
  INTO v_sequence
  FROM invoices
  WHERE org_id = p_org_id
    AND invoice_number LIKE v_year || '-' || v_month || '-%';
  
  -- Generera nummer med 4 siffror (t.ex. 0001)
  v_invoice_number := v_year || '-' || v_month || '-' || 
                      lpad(v_sequence::text, 4, '0');
  
  RETURN v_invoice_number;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_org_number TEXT;
  v_phone TEXT;
  v_full_name TEXT;
  v_start_time TIMESTAMPTZ;
  v_execution_time INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  BEGIN
    -- Extrahera metadata från user
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', 'Mitt Hundföretag');
    v_org_number := NEW.raw_user_meta_data->>'org_number';
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

    -- Skapa organisation
    INSERT INTO orgs (org_name, org_number, phone)
    VALUES (v_org_name, v_org_number, v_phone)
    RETURNING id INTO v_org_id;

    -- Skapa profil
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      org_id, 
      role
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_org_id,
      'admin'
    );

    -- Beräkna execution time
    v_execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

    -- Logga framgång
    PERFORM log_trigger_execution(
      'on_auth_user_created',
      'auth.users',
      'INSERT',
      NEW.id,
      NULL,
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'org_id', v_org_id,
        'org_name', v_org_name
      ),
      true,
      NULL,
      v_execution_time
    );

    RAISE NOTICE '✅ User setup complete - User: %, Org: %', NEW.id, v_org_id;

  EXCEPTION WHEN OTHERS THEN
    -- Logga fel
    v_execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
    
    PERFORM log_trigger_execution(
      'on_auth_user_created',
      'auth.users',
      'INSERT',
      NEW.id,
      NULL,
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email
      ),
      false,
      SQLERRM,
      v_execution_time
    );

    RAISE WARNING '❌ Failed to setup user: % - Error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_valid_consent"("p_owner_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consent_logs
    WHERE owner_id = p_owner_id
      AND consent_given = true
      AND withdrawn_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY given_at DESC
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."has_valid_consent"("p_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."heal_all_users_missing_org"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  healed_count integer := 0;
  failed_count integer := 0;
  result jsonb;
BEGIN
  FOR user_record IN 
    SELECT id, email FROM users_without_org
  LOOP
    BEGIN
      result := heal_user_missing_org(user_record.id);
      
      IF result->>'success' = 'true' THEN
        healed_count := healed_count + 1;
        RAISE NOTICE 'Healed user: %', user_record.email;
      ELSE
        failed_count := failed_count + 1;
        RAISE WARNING 'Failed to heal user %: %', user_record.email, result->>'error';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        failed_count := failed_count + 1;
        RAISE WARNING 'Error healing user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'healed', healed_count,
    'failed', failed_count,
    'total', healed_count + failed_count
  );
END;
$$;


ALTER FUNCTION "public"."heal_all_users_missing_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."heal_user_missing_org"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_email text;
  v_user_metadata jsonb;
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
  v_lan text;
  v_kommun text;
  v_service_types text[];
  v_org_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id)
  INTO v_profile_exists;

  -- Extract metadata
  v_org_name := COALESCE(
    v_user_metadata->>'org_name',
    split_part(v_user_email, '@', 1) || 's Hunddagis'
  );
  v_org_number := v_user_metadata->>'org_number';
  v_full_name := COALESCE(
    v_user_metadata->>'full_name',
    split_part(v_user_email, '@', 1)
  );
  v_phone := v_user_metadata->>'phone';
  v_lan := v_user_metadata->>'lan';
  v_kommun := v_user_metadata->>'kommun';

  IF v_user_metadata ? 'service_types' THEN
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(v_user_metadata->'service_types')
    );
  END IF;

  -- Try to find existing org by email or org_number
  SELECT id INTO v_org_id
  FROM orgs
  WHERE email = v_user_email
     OR (org_number IS NOT NULL AND org_number = v_org_number)
  LIMIT 1;

  -- If no org found, create one
  IF v_org_id IS NULL THEN
    INSERT INTO orgs (
      name,
      org_number,
      email,
      phone,
      lan,
      kommun,
      service_types,
      created_at
    )
    VALUES (
      v_org_name,
      v_org_number,
      v_user_email,
      v_phone,
      v_lan,
      v_kommun,
      v_service_types,
      now()
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Healing: Created new org for user %: org_id=%', v_user_email, v_org_id;
  ELSE
    RAISE NOTICE 'Healing: Found existing org for user %: org_id=%', v_user_email, v_org_id;
  END IF;

  -- Update or create profile
  IF v_profile_exists THEN
    UPDATE profiles
    SET org_id = v_org_id,
        full_name = COALESCE(full_name, v_full_name),
        phone = COALESCE(phone, v_phone),
        updated_at = now()
    WHERE id = p_user_id;

    RAISE NOTICE 'Healing: Updated profile for user %', v_user_email;
  ELSE
    INSERT INTO profiles (
      id,
      org_id,
      role,
      email,
      full_name,
      phone,
      created_at
    )
    VALUES (
      p_user_id,
      v_org_id,
      'admin',
      v_user_email,
      v_full_name,
      v_phone,
      now()
    );

    RAISE NOTICE 'Healing: Created profile for user %', v_user_email;
  END IF;

  -- Ensure trial subscription exists
  IF NOT EXISTS(SELECT 1 FROM org_subscriptions WHERE org_id = v_org_id) THEN
    INSERT INTO org_subscriptions (
      org_id,
      status,
      trial_ends_at,
      created_at
    )
    VALUES (
      v_org_id,
      'trialing',
      now() + interval '3 months',
      now()
    );

    RAISE NOTICE 'Healing: Created trial subscription for org_id=%', v_org_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_org_id,
    'message', 'User healed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."heal_user_missing_org"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."json_text"("j" "jsonb", "key" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select nullif(trim(both from j ->> key), '')
$$;


ALTER FUNCTION "public"."json_text"("j" "jsonb", "key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_expired_trials"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  r record;
begin
  -- Gå igenom alla organisationer vars testperiod har gått ut
  for r in
    select 
      o.id,
      o.name,
      o.trial_ends_at,
      p.full_name,
      u.email
    from public.orgs o
    join public.profiles p on p.org_id = o.id
    join auth.users u on u.id = p.id
    where o.status = 'trialing'
      and o.trial_ends_at::date < current_date
  loop
    -- Lås kontot
    update public.orgs
      set status = 'locked'
      where id = r.id;

    -- Skicka e-post till användaren
    perform net.http_post(
      url := 'https://api.supabase.com/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', r.email,
        'subject', format('Ditt konto %s är nu låst', r.name),
        'body', format(
          'Hej %s!<br><br>Testperioden för <strong>%s</strong> har nu löpt ut (%s).<br>
           Ditt konto har därför låsts tillfälligt. Du kan fortfarande logga in och se din data,<br>
           men inte göra ändringar förrän du aktiverar ett abonnemang.<br><br>
           Klicka här för att uppgradera och låsa upp ditt konto igen:<br>
           <a href="https://dogplanner.vercel.app/pricing">dogplanner.vercel.app/pricing</a><br><br>
           Tack för att du använder DogPlanner!<br><br>
           Med vänliga hälsningar,<br>DogPlanner-teamet',
          coalesce(r.full_name, 'kund'),
          r.name,
          to_char(r.trial_ends_at, 'YYYY-MM-DD')
        )
      )
    );
  end loop;

  -- Logga händelsen i error_logs (för spårbarhet)
  insert into public.error_logs (date, message, function)
  values (now(), 'Automatisk låsning och e-post till utgångna testkonton', 'lock_expired_trials');
end;
$$;


ALTER FUNCTION "public"."lock_expired_trials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_booking_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Log när status ändras
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO booking_events (
      org_id,
      booking_id,
      event_type,
      notes,
      metadata
    ) VALUES (
      NEW.org_id,
      NEW.id,
      CASE NEW.status
        WHEN 'confirmed' THEN 'approved'
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'checked_in' THEN 'checked_in'
        WHEN 'checked_out' THEN 'checked_out'
        ELSE 'modified'
      END,
      'Status ändrad från ' || COALESCE(OLD.status, 'NULL') || ' till ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_total_price', OLD.total_price,
        'new_total_price', NEW.total_price
      )
    );
  END IF;

  -- Log när bokning skapas
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO booking_events (
      org_id,
      booking_id,
      event_type,
      notes,
      metadata
    ) VALUES (
      NEW.org_id,
      NEW.id,
      'created',
      'Bokning skapad',
      jsonb_build_object(
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'total_price', NEW.total_price
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_booking_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_trigger_execution"("p_trigger_name" "text", "p_table_name" "text", "p_operation" "text", "p_row_id" "uuid" DEFAULT NULL::"uuid", "p_old_data" "jsonb" DEFAULT NULL::"jsonb", "p_new_data" "jsonb" DEFAULT NULL::"jsonb", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text", "p_execution_time_ms" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO trigger_execution_log (
    trigger_name,
    table_name,
    operation,
    row_id,
    old_data,
    new_data,
    success,
    error_message,
    execution_time_ms
  )
  VALUES (
    p_trigger_name,
    p_table_name,
    p_operation,
    p_row_id,
    p_old_data,
    p_new_data,
    p_success,
    p_error_message,
    p_execution_time_ms
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_trigger_execution"("p_trigger_name" "text", "p_table_name" "text", "p_operation" "text", "p_row_id" "uuid", "p_old_data" "jsonb", "p_new_data" "jsonb", "p_success" boolean, "p_error_message" "text", "p_execution_time_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_owners_to_dogs"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  email_keys text[] := array['email','owneremail','mail','owner_mail'];
  name_keys  text[] := array['name','fullname','ownername','owner_name'];
  phone_keys text[] := array['phone','ownerphone','mobile','tel'];
  email text;
  full_name text;
  phone text;
begin
  -- Gå igenom alla hundar som saknar koppling
  for email, full_name, phone in
    select 
      lower(coalesce(public.json_text(d.owner, k), '')) as email,
      lower(coalesce(public.json_text(d.owner, n), '')) as full_name,
      regexp_replace(public.json_text(d.owner, p), '\D', '', 'g') as phone
    from public.dogs d,
         unnest(email_keys) k,
         unnest(name_keys) n,
         unnest(phone_keys) p
    where d.owner_id is null
  loop
    -- Koppla baserat på e-post
    update public.dogs d
    set owner_id = o.id
    from public.owners o
    where d.owner_id is null
      and d.org_id = o.org_id
      and o.email is not null
      and lower(o.email) = email;

    -- Koppla baserat på namn + telefon
    update public.dogs d
    set owner_id = o.id
    from public.owners o
    where d.owner_id is null
      and d.org_id = o.org_id
      and lower(trim(o.full_name)) = full_name
      and o.phone is not null
      and regexp_replace(o.phone, '\D', '', 'g') = phone;
  end loop;
end
$$;


ALTER FUNCTION "public"."match_owners_to_dogs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_on_lock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  org_name text;
begin
  select name into org_name from public.orgs where id = new.id;

  perform
    net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'DogPlanner <support@dogplanner.se>',
        'to', 'support@dogplanner.se',
        'subject', 'Konto låst: ' || org_name,
        'html', '<p>Organisationen <b>' || org_name || '</b> har passerat sin testperiod och låsts.</p>'
      )
    );
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_admin_on_lock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_staff_member"("staff_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_org_id uuid;
BEGIN
  -- Kontrollera att den som tar bort är admin
  SELECT org_id INTO admin_org_id
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF admin_org_id IS NULL THEN
    RAISE EXCEPTION 'Endast admin kan ta bort användare.';
  END IF;

  -- Radera profil inom samma organisation
  DELETE FROM public.profiles
  WHERE id = staff_id
  AND org_id = admin_org_id;

  -- Radera även från auth.users
  DELETE FROM auth.users
  WHERE id = staff_id;
END;
$$;


ALTER FUNCTION "public"."remove_staff_member"("staff_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_invoice_email"("p_invoice_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invoice record;
  v_owner record;
  v_org record;
  v_result jsonb;
BEGIN
  -- Hämta faktura med alla relationer
  SELECT i.*, 
         o.full_name, o.email as owner_email,
         org.name as org_name, org.email as org_email
  INTO v_invoice
  FROM invoices i
  LEFT JOIN owners o ON i.owner_id = o.id
  LEFT JOIN orgs org ON i.org_id = org.id
  WHERE i.id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice not found'
    );
  END IF;
  
  -- TODO: Integrera med emailSender.ts (detta är placeholder)
  -- I production: Anropa Resend API eller använd pg_net för HTTP request
  
  -- Logga att email skulle skickas
  INSERT INTO function_logs (function_name, status, message)
  VALUES (
    'send_invoice_email',
    'success',
    format('Email sent for invoice %s to %s', 
           v_invoice.invoice_number, 
           v_invoice.owner_email)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice.invoice_number,
    'sent_to', v_invoice.owner_email
  );
END;
$$;


ALTER FUNCTION "public"."send_invoice_email"("p_invoice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_trial_warning_emails"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  r record;
begin
  -- Hämta alla organisationer vars testperiod går ut om 3 dagar
  for r in
    select 
      o.id,
      o.name,
      o.trial_ends_at,
      p.full_name,
      p.email
    from public.orgs o
    join public.profiles p on p.org_id = o.id
    where o.status = 'trialing'
      and o.trial_ends_at::date = (current_date + interval '3 days')::date
      and (o.warning_sent is false or o.warning_sent is null)
  loop
    -- Skicka e-post till ansvarig användare
    perform net.http_post(
      url := 'https://api.supabase.com/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', r.email,
        'subject', format('Din testperiod för %s går snart ut', r.name),
        'body', format(
          'Hej %s!<br><br>Testperioden för <strong>%s</strong> löper ut om tre dagar (%s).<br>
           För att fortsätta använda DogPlanner utan avbrott behöver du aktivera ett abonnemang.<br><br>
           Logga in på din sida för att uppgradera: <a href="https://dogplanner.vercel.app/pricing">dogplanner.vercel.app/pricing</a><br><br>
           Tack för att du använder DogPlanner!<br><br>
           Med vänliga hälsningar,<br>DogPlanner-teamet',
          coalesce(r.full_name, 'kund'),
          r.name,
          to_char(r.trial_ends_at, 'YYYY-MM-DD')
        )
      )
    );

    -- Markera som varning skickad
    update public.orgs
      set warning_sent = true
      where id = r.id;
  end loop;
end;
$$;


ALTER FUNCTION "public"."send_trial_warning_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_booking_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM dogs 
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_booking_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_number_per_org"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.customer_number is null then
    select coalesce(max(o.customer_number), 0) + 1
      into new.customer_number
      from public.owners o
      where o.org_id = new.org_id;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."set_customer_number_per_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.role is null then
    new.role := 'staff';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_default_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_dog_journal_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_dog_journal_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_dog_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_dog_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_extra_service_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_extra_service_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Sätt invoice_number om den inte finns
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_dogs"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_org_id_for_dogs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_grooming"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Hämtar organisationens ID från hunden automatiskt
  if new.org_id is null then
    select org_id into new.org_id
    from dogs
    where id = new.dog_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_org_id_for_grooming"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_invoices"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Hämta org_id från profilen för den inloggade användaren
  SELECT org_id INTO NEW.org_id
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_org_id_for_invoices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_owners"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_org_id_for_owners"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_pension_stays"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.org_id is null then
    select org_id into new.org_id from dogs where id = new.dog_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_org_id_for_pension_stays"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_rooms"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM profiles 
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_org_id_for_rooms"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_for_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Hämta organisationen kopplad till den användare som skapar abonnemanget
  SELECT org_id INTO NEW.org_id
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_org_id_for_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_id_from_dog"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.org_id is null then
    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."set_org_id_from_dog"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_pension_stay_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id 
    FROM dogs 
    WHERE id = NEW.dog_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_pension_stay_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_special_date_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_special_date_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_trial_end_for_org"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Sätt gratisperiod till 3 månader från registrering
  NEW.trial_ends_at := (now() + interval '3 months');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_trial_end_for_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_bookings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."touch_bookings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_invoice_generation"("p_month" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_month text;
  v_result jsonb;
BEGIN
  -- Om ingen månad angavs, använd aktuell månad
  v_month := COALESCE(
    p_month, 
    to_char(CURRENT_DATE, 'YYYY-MM')
  );
  
  -- Kontrollera om fakturor redan genererats för denna månad
  IF EXISTS (
    SELECT 1 FROM invoice_runs 
    WHERE month_id = v_month 
      AND status = 'success'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invoices already generated for %s', v_month),
      'month', v_month
    );
  END IF;
  
  -- Logga att manuell körning initierades
  INSERT INTO function_logs (function_name, status, message)
  VALUES (
    'trigger_invoice_generation',
    'info',
    format('Manual invoice generation triggered for %s', v_month)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invoice generation triggered',
    'month', v_month,
    'note', 'Edge Function must be called separately via API'
  );
END;
$$;


ALTER FUNCTION "public"."trigger_invoice_generation"("p_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_external_customer_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Only proceed if this is a walk-in booking that was just completed
  IF NEW.status = 'completed' AND NEW.external_customer_name IS NOT NULL THEN
    
    -- Find or create external customer record
    INSERT INTO external_customers (
      org_id,
      customer_name,
      customer_phone,
      dog_name,
      dog_breed,
      last_visit_date,
      total_visits
    ) VALUES (
      NEW.org_id,
      NEW.external_customer_name,
      NEW.external_customer_phone,
      NEW.external_dog_name,
      NEW.external_dog_breed,
      NEW.appointment_date,
      1
    )
    ON CONFLICT (org_id, customer_phone, dog_name)
    DO UPDATE SET
      last_visit_date = NEW.appointment_date,
      total_visits = external_customers.total_visits + 1,
      updated_at = NOW()
    RETURNING id INTO v_customer_id;
    
    RAISE NOTICE 'Updated external customer stats for customer %', v_customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_external_customer_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_external_customers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_external_customers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.last_updated = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_last_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_owner_consent_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.consent_given = true AND NEW.withdrawn_at IS NULL THEN
    UPDATE owners SET consent_status = 'verified', consent_verified_at = NEW.given_at, updated_at = now() WHERE id = NEW.owner_id;
  ELSIF NEW.consent_given = false THEN
    UPDATE owners SET consent_status = 'declined', updated_at = now() WHERE id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_owner_consent_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_waitlist_status"() RETURNS TABLE("updated_to_active" integer, "updated_to_waitlist" integer, "updated_to_ended" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_active integer;
  v_waitlist integer;
  v_ended integer;
BEGIN
  -- 1. Sätt till aktiva (antagna): startdatum passerat, ej avslutat
  UPDATE dogs
  SET waitlist = false, updated_at = NOW()
  WHERE startdate IS NOT NULL
    AND startdate <= CURRENT_DATE
    AND (enddate IS NULL OR enddate >= CURRENT_DATE)
    AND waitlist = true;
  
  GET DIAGNOSTICS v_active = ROW_COUNT;

  -- 2. Sätt till väntelista: framtida startdatum
  UPDATE dogs
  SET waitlist = true, updated_at = NOW()
  WHERE startdate > CURRENT_DATE
    AND waitlist = false;
  
  GET DIAGNOSTICS v_waitlist = ROW_COUNT;

  -- 3. Sätt till avslutade (väntelista): slutdatum passerat
  UPDATE dogs
  SET waitlist = true, updated_at = NOW()
  WHERE enddate IS NOT NULL
    AND enddate < CURRENT_DATE
    AND waitlist = false;
  
  GET DIAGNOSTICS v_ended = ROW_COUNT;

  -- Returnera statistik
  RETURN QUERY SELECT v_active, v_waitlist, v_ended;
END;
$$;


ALTER FUNCTION "public"."update_waitlist_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."withdraw_consent"("p_owner_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE consent_logs
  SET withdrawn_at = now(), updated_at = now()
  WHERE owner_id = p_owner_id AND consent_given = true AND withdrawn_at IS NULL;
  
  UPDATE owners
  SET consent_status = 'withdrawn', updated_at = now()
  WHERE id = p_owner_id;
  
  INSERT INTO consent_logs (owner_id, org_id, consent_type, consent_given, consent_text, given_at)
  SELECT id, org_id, 'digital_email', false, 'Customer withdrew consent (GDPR Art. 7.3)', now()
  FROM owners WHERE id = p_owner_id;
END;
$$;


ALTER FUNCTION "public"."withdraw_consent"("p_owner_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dogs_id" "uuid" NOT NULL,
    "date" timestamp with time zone,
    "check_in" timestamp with time zone,
    "check_out" timestamp with time zone,
    "status" "text" DEFAULT '''not_checked_in'''::"text",
    "notes" "text" DEFAULT ''::"text",
    "created_at" timestamp without time zone DEFAULT '2025-10-09 16:13:20.322986'::timestamp without time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."attendance_logs" IS 'In- och utcheckningar per dag';



CREATE TABLE IF NOT EXISTS "public"."boarding_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "dog_size" "text" NOT NULL,
    "base_price" numeric NOT NULL,
    "weekend_surcharge" numeric DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "boarding_prices_dog_size_check" CHECK (("dog_size" = ANY (ARRAY['small'::"text", 'medium'::"text", 'large'::"text"])))
);


ALTER TABLE "public"."boarding_prices" OWNER TO "postgres";


COMMENT ON TABLE "public"."boarding_prices" IS 'Grundpriser per hundstorlek. Small (<35cm), Medium (35-54cm), Large (>54cm). Pris per påbörjad kalenderdag inkl 25% moms.';



COMMENT ON COLUMN "public"."boarding_prices"."dog_size" IS 'Hundstorlek: small (<35cm), medium (35-54cm), large (>54cm)';



COMMENT ON COLUMN "public"."boarding_prices"."base_price" IS 'Grundpris per natt för vardag (måndag-torsdag), inkl 25% moms';



COMMENT ON COLUMN "public"."boarding_prices"."weekend_surcharge" IS 'Fast påslag för helg (fredag-söndag), inkl 25% moms. Ersätts av special_dates om datum finns där.';



CREATE TABLE IF NOT EXISTS "public"."boarding_seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "name" "text",
    "start_date" "date",
    "end_date" "date",
    "type" "text" DEFAULT 'high'::"text",
    CONSTRAINT "boarding_seasons_type_check" CHECK (("type" = ANY (ARRAY['high'::"text", 'low'::"text", 'holiday'::"text"])))
);


ALTER TABLE "public"."boarding_seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "booking_id" "uuid",
    "event_type" "text" NOT NULL,
    "notes" "text",
    "metadata" "jsonb",
    "performed_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['created'::"text", 'approved'::"text", 'cancelled'::"text", 'checked_in'::"text", 'checked_out'::"text", 'modified'::"text", 'payment_received'::"text", 'refund_issued'::"text"])))
);


ALTER TABLE "public"."booking_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."booking_events" IS 'Audit log för alla bokningsändringar (GDPR Article 30)';



CREATE TABLE IF NOT EXISTS "public"."booking_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "booking_id" "uuid",
    "service_id" "uuid",
    "quantity" integer DEFAULT 1,
    "price" numeric
);


ALTER TABLE "public"."booking_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "dog_id" "uuid",
    "owner_id" "uuid",
    "room_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "checkin_time" timestamp with time zone,
    "checkout_time" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "total_price" numeric,
    "deposit_amount" numeric,
    "deposit_paid" boolean DEFAULT false,
    "notes" "text",
    "base_price" numeric(10,2) DEFAULT 0,
    "addons" "jsonb" DEFAULT '[]'::"jsonb",
    "discount_amount" numeric DEFAULT 0,
    "extra_service_ids" "jsonb",
    "prepayment_status" "text" DEFAULT 'unpaid'::"text",
    "prepayment_invoice_id" "uuid",
    "afterpayment_invoice_id" "uuid",
    "is_active" boolean DEFAULT true,
    "belongings" "text",
    "bed_location" "text",
    "consent_required" boolean DEFAULT false,
    "consent_pending_until" timestamp with time zone,
    "cancellation_reason" "text",
    "cancelled_at" timestamp with time zone,
    "cancelled_by_user_id" "uuid",
    CONSTRAINT "bookings_prepayment_status_check" CHECK (("prepayment_status" = ANY (ARRAY['unpaid'::"text", 'paid'::"text", 'partially_paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'checked_in'::"text", 'checked_out'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."prepayment_status" IS 'Status för förskottsbetalning av rumsbokning';



COMMENT ON COLUMN "public"."bookings"."prepayment_invoice_id" IS 'Länk till förskottsfakturan som skapas vid godkännande';



COMMENT ON COLUMN "public"."bookings"."afterpayment_invoice_id" IS 'Länk till efterskottsfakturan som skapas vid utcheckning';



COMMENT ON COLUMN "public"."bookings"."belongings" IS 'Items brought by guest (toys, blankets, food, etc)';



COMMENT ON COLUMN "public"."bookings"."bed_location" IS 'Assigned bed or room location for the dog';



COMMENT ON COLUMN "public"."bookings"."cancellation_reason" IS 'Anledning till avbokning (text från kund eller personal)';



COMMENT ON COLUMN "public"."bookings"."cancelled_at" IS 'Tidpunkt för avbokning';



COMMENT ON COLUMN "public"."bookings"."cancelled_by_user_id" IS 'Användare som avbokade (kund eller personal)';



CREATE TABLE IF NOT EXISTS "public"."consent_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "org_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "consent_given" boolean NOT NULL,
    "consent_text" "text" NOT NULL,
    "consent_version" "text" DEFAULT '1.0'::"text",
    "ip_address" "inet",
    "user_agent" "text",
    "signed_document_url" "text",
    "witness_staff_id" "uuid",
    "witness_notes" "text",
    "given_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "withdrawn_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consent_logs_consent_type_check" CHECK (("consent_type" = ANY (ARRAY['digital_email'::"text", 'physical_form'::"text", 'phone_verbal'::"text", 'in_person'::"text"])))
);


ALTER TABLE "public"."consent_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daycare_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "subscription_1day" integer DEFAULT 1500 NOT NULL,
    "subscription_2days" integer DEFAULT 2500 NOT NULL,
    "subscription_3days" integer DEFAULT 3300 NOT NULL,
    "subscription_4days" integer DEFAULT 4000 NOT NULL,
    "subscription_5days" integer DEFAULT 4500 NOT NULL,
    "single_day_price" integer DEFAULT 350 NOT NULL,
    "sibling_discount_percent" integer DEFAULT 10 NOT NULL,
    "trial_day_price" integer DEFAULT 200 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daycare_pricing" OWNER TO "postgres";


COMMENT ON TABLE "public"."daycare_pricing" IS 'Priser för hunddagis per organisation';



CREATE TABLE IF NOT EXISTS "public"."daycare_service_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "dog_id" "uuid",
    "service_type" "text" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daycare_service_completions_service_type_check" CHECK (("service_type" = ANY (ARRAY['kloklipp'::"text", 'tassklipp'::"text", 'bad'::"text"])))
);


ALTER TABLE "public"."daycare_service_completions" OWNER TO "postgres";


COMMENT ON TABLE "public"."daycare_service_completions" IS 'Tjänster som utförs på dagishundar (kloklipp, tassklipp, bad)';



CREATE TABLE IF NOT EXISTS "public"."dog_journal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dog_id" "uuid" NOT NULL,
    "text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "user_id" "uuid",
    "content" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."dog_journal" OWNER TO "postgres";


COMMENT ON TABLE "public"."dog_journal" IS 'Hundjournal. Realtime aktiverad för live-uppdateringar.';



COMMENT ON COLUMN "public"."dog_journal"."user_id" IS 'sätts av trigger set_org_and_user()';



CREATE TABLE IF NOT EXISTS "public"."dogs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "breed" "text",
    "birth" "date",
    "heightcm" integer,
    "subscription" "text",
    "days" "text",
    "addons" "jsonb",
    "vaccdhp" "text",
    "vaccpi" "text",
    "owner" "jsonb",
    "roomid" "uuid",
    "startdate" "date",
    "enddate" "date",
    "price" numeric,
    "events" "jsonb",
    "notes" "text",
    "user_id" "uuid",
    "checked_in" boolean,
    "note" "text",
    "last_updated" timestamp with time zone,
    "checkin_date" "date",
    "checkout_date" "date",
    "room_id" "uuid",
    "org_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "owner_id" "uuid",
    "photo_url" "text",
    "gender" "text",
    "birth_date" "date",
    "is_sterilized" boolean DEFAULT false,
    "medical_notes" "text",
    "personality_traits" "text"[],
    "insurance_number" "text",
    "insurance_company" "text",
    "is_castrated" boolean DEFAULT false,
    "is_escape_artist" boolean DEFAULT false,
    "destroys_things" boolean DEFAULT false,
    "is_house_trained" boolean DEFAULT true,
    "special_needs" "text",
    "is_active" boolean DEFAULT true,
    "allergies" "text",
    "medications" "text",
    "behavior_notes" "text",
    "food_info" "text",
    "can_be_with_other_dogs" boolean DEFAULT true,
    "in_heat" boolean DEFAULT false,
    "heat_start_date" "date",
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_reason" "text",
    "waitlist" boolean DEFAULT false
);


ALTER TABLE "public"."dogs" OWNER TO "postgres";


COMMENT ON TABLE "public"."dogs" IS 'Hundregister. Realtime aktiverad för live-uppdateringar i UI.';



COMMENT ON COLUMN "public"."dogs"."user_id" IS 'sätts av trigger set_org_and_user()';



COMMENT ON COLUMN "public"."dogs"."checked_in" IS 'true = inne, false = utcheckad';



COMMENT ON COLUMN "public"."dogs"."note" IS 'personalens anteckning';



COMMENT ON COLUMN "public"."dogs"."last_updated" IS 'auto-uppdateras via trigger';



COMMENT ON COLUMN "public"."dogs"."is_deleted" IS 'Mjuk radering - hund visas inte i UI men finns kvar i DB';



COMMENT ON COLUMN "public"."dogs"."deleted_at" IS 'Tidpunkt för mjuk radering';



COMMENT ON COLUMN "public"."dogs"."deleted_reason" IS 'Anledning till radering (GDPR-begäran, inaktiv, etc)';



CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date",
    "message" "text",
    "function" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_phone" "text" NOT NULL,
    "dog_name" "text" NOT NULL,
    "dog_breed" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_visit_date" "date",
    "total_visits" integer DEFAULT 0
);


ALTER TABLE "public"."external_customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."external_customers" IS 'Stores walk-in grooming customers who can be quickly selected for future bookings without full GDPR registration';



COMMENT ON COLUMN "public"."external_customers"."total_visits" IS 'Auto-incremented when a booking with this customer is marked as completed';



CREATE TABLE IF NOT EXISTS "public"."extra_service" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dogs_id" "uuid" NOT NULL,
    "service_type" "text",
    "quantity" integer DEFAULT 1,
    "price" numeric(10,2),
    "notes" "text",
    "performed_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "payment_type" "text" DEFAULT 'afterpayment'::"text",
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "extra_service_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['prepayment'::"text", 'afterpayment'::"text"])))
);


ALTER TABLE "public"."extra_service" OWNER TO "postgres";


COMMENT ON TABLE "public"."extra_service" IS 'Hundspecifik koppling till tilläggstjänster (singular). Kopplar en specifik hund till en tjänst, t.ex. "Bella har kloklipp 1 ggr/mån".';



COMMENT ON COLUMN "public"."extra_service"."dogs_id" IS 'Referens till hunden som har tjänsten';



COMMENT ON COLUMN "public"."extra_service"."service_type" IS 'Typ av tjänst, t.ex. "kloklipp", "medicin", "specialmat"';



COMMENT ON COLUMN "public"."extra_service"."user_id" IS 'sätts av trigger set_org_and_user()';



COMMENT ON COLUMN "public"."extra_service"."payment_type" IS 'prepayment = ingår i förskottsfaktura, afterpayment = betalas vid utcheckning';



CREATE TABLE IF NOT EXISTS "public"."extra_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "branch_id" "uuid",
    "label" "text" NOT NULL,
    "price" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "service_type" "text" DEFAULT 'all'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "extra_services_service_type_check" CHECK (("service_type" = ANY (ARRAY['boarding'::"text", 'daycare'::"text", 'grooming'::"text", 'both'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."extra_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."extra_services" IS 'Priskatalog för tilläggstjänster (plural). Används i admin-sidor för att definiera vilka tjänster som finns och deras priser.';



COMMENT ON COLUMN "public"."extra_services"."label" IS 'Namn på tjänsten i katalogen';



COMMENT ON COLUMN "public"."extra_services"."price" IS 'Pris för tjänsten';



COMMENT ON COLUMN "public"."extra_services"."unit" IS 'Enhet: "per gång", "per dag", "fast pris"';



COMMENT ON COLUMN "public"."extra_services"."service_type" IS 'Vilken typ av bokning tjänsten gäller för: boarding, daycare, grooming, both, all';



CREATE TABLE IF NOT EXISTS "public"."function_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "message" "text",
    "records_created" integer,
    "error" "text"
);


ALTER TABLE "public"."function_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gdpr_deletion_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone DEFAULT "now"(),
    "owner_id" "uuid",
    "dog_count" integer,
    "booking_count" integer,
    "invoice_count" integer
);


ALTER TABLE "public"."gdpr_deletion_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grooming_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "dog_id" "uuid",
    "appointment_date" "date" NOT NULL,
    "appointment_time" time without time zone,
    "service_type" "text" NOT NULL,
    "estimated_price" numeric,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "external_customer_name" "text",
    "external_customer_phone" "text",
    "external_dog_name" "text",
    "external_dog_breed" "text",
    "clip_length" "text",
    "shampoo_type" "text",
    CONSTRAINT "grooming_bookings_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."grooming_bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."grooming_bookings"."external_customer_name" IS 'Kundnamn för utomstående kunder (ej i systemet)';



COMMENT ON COLUMN "public"."grooming_bookings"."external_customer_phone" IS 'Telefon för utomstående kunder';



COMMENT ON COLUMN "public"."grooming_bookings"."external_dog_name" IS 'Hundnamn för utomstående kunder';



COMMENT ON COLUMN "public"."grooming_bookings"."external_dog_breed" IS 'Hundras för utomstående kunder';



CREATE TABLE IF NOT EXISTS "public"."grooming_journal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "dog_id" "uuid",
    "appointment_date" "date" NOT NULL,
    "service_type" "text" NOT NULL,
    "clip_length" "text",
    "shampoo_type" "text",
    "special_treatments" "text",
    "final_price" numeric DEFAULT 0 NOT NULL,
    "duration_minutes" integer,
    "notes" "text",
    "before_photos" "text"[],
    "after_photos" "text"[],
    "next_appointment_recommended" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "external_customer_name" "text",
    "external_dog_name" "text",
    "external_dog_breed" "text",
    "booking_id" "uuid"
);


ALTER TABLE "public"."grooming_journal" OWNER TO "postgres";


COMMENT ON COLUMN "public"."grooming_journal"."external_customer_name" IS 'Kundnamn för utomstående kunder (från journal)';



COMMENT ON COLUMN "public"."grooming_journal"."external_dog_name" IS 'Hundnamn för utomstående kunder (från journal)';



COMMENT ON COLUMN "public"."grooming_journal"."external_dog_breed" IS 'Hundras för utomstående kunder (från journal)';



COMMENT ON COLUMN "public"."grooming_journal"."booking_id" IS 'Reference to the grooming_booking that created this journal entry. NULL if manually created.';



CREATE TABLE IF NOT EXISTS "public"."grooming_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dog_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "performed_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "stylist_name" "text",
    "clip_type" "text",
    "products" "text",
    "notes" "text",
    "price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grooming_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grooming_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "service_name" "text" NOT NULL,
    "base_price" integer DEFAULT 0 NOT NULL,
    "size_multiplier_enabled" boolean DEFAULT true NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."grooming_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."grooming_services" IS 'Frisörtjänster och priser per organisation';



CREATE OR REPLACE VIEW "public"."grooming_with_invoice" WITH ("security_invoker"='on') AS
 SELECT "g"."id" AS "grooming_id",
    "g"."performed_at",
    "g"."dog_id",
    "d"."name" AS "dog_name",
    "g"."price",
    "e"."id" AS "extra_service_id",
    "e"."service_type",
    "e"."created_at" AS "invoiced_at"
   FROM (("public"."grooming_logs" "g"
     LEFT JOIN "public"."dogs" "d" ON (("d"."id" = "g"."dog_id")))
     LEFT JOIN "public"."extra_service" "e" ON ((("e"."dogs_id" = "g"."dog_id") AND ("e"."performed_at" = "g"."performed_at"))))
  WHERE ("g"."org_id" = "d"."org_id");


ALTER VIEW "public"."grooming_with_invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interest_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "parent_name" "text" NOT NULL,
    "parent_email" "text" NOT NULL,
    "parent_phone" "text" NOT NULL,
    "owner_city" "text",
    "owner_address" "text",
    "dog_name" "text" NOT NULL,
    "dog_breed" "text",
    "dog_birth" "date",
    "dog_age" integer,
    "dog_gender" "text",
    "dog_size" "text",
    "dog_height_cm" integer,
    "subscription_type" "text",
    "preferred_start_date" "date",
    "preferred_days" "text"[],
    "special_needs" "text",
    "special_care_needs" "text",
    "is_neutered" boolean DEFAULT false,
    "is_escape_artist" boolean DEFAULT false,
    "destroys_things" boolean DEFAULT false,
    "not_house_trained" boolean DEFAULT false,
    "previous_daycare_experience" boolean,
    "gdpr_consent" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_contact_date" "date",
    "first_contact_notes" "text",
    "visit_booked_date" "date",
    "visit_status" "text",
    "visit_completed_date" "date",
    "visit_result" "text",
    "contact_history" "jsonb" DEFAULT '[]'::"jsonb",
    "priority" integer DEFAULT 0,
    "expected_start_month" "text",
    "visit_booked_time" time without time zone,
    CONSTRAINT "interest_applications_dog_gender_check" CHECK (("dog_gender" = ANY (ARRAY['hane'::"text", 'tik'::"text"]))),
    CONSTRAINT "interest_applications_dog_size_check" CHECK (("dog_size" = ANY (ARRAY['small'::"text", 'medium'::"text", 'large'::"text"]))),
    CONSTRAINT "interest_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'accepted'::"text", 'declined'::"text"]))),
    CONSTRAINT "interest_applications_visit_result_check" CHECK (("visit_result" = ANY (ARRAY['approved'::"text", 'declined'::"text", 'waiting'::"text", 'not_suitable'::"text"]))),
    CONSTRAINT "interest_applications_visit_status_check" CHECK (("visit_status" = ANY (ARRAY['booked'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."interest_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."interest_applications" IS 'Ansökningar från hundägare som vill ha dagisplats';



COMMENT ON COLUMN "public"."interest_applications"."status" IS 'pending = ny ansökan, contacted = kontaktad, accepted = godkänd (redo att överföra), declined = avböjd';



COMMENT ON COLUMN "public"."interest_applications"."visit_booked_time" IS 'Tid för bokat besök (kompletterar visit_booked_date)';



CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "description" "text",
    "qty" numeric(10,2) DEFAULT 1,
    "unit_price" numeric(12,2) DEFAULT 0,
    "amount" numeric(12,2) GENERATED ALWAYS AS (("qty" * "unit_price")) STORED
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "month_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "invoices_created" integer DEFAULT 0,
    "run_at" timestamp with time zone DEFAULT "now"(),
    "error_message" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."invoice_runs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."invoice_runs_summary" AS
 SELECT "month_id",
    "count"(*) AS "total_runs",
    "count"(*) FILTER (WHERE ("status" = 'success'::"text")) AS "successful_runs",
    "count"(*) FILTER (WHERE ("status" = 'failed'::"text")) AS "failed_runs",
    "sum"("invoices_created") AS "total_invoices_created",
    "max"("run_at") AS "last_run_at"
   FROM "public"."invoice_runs"
  GROUP BY "month_id"
  ORDER BY "month_id" DESC;


ALTER VIEW "public"."invoice_runs_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "invoice_date" "date" DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "total_amount" numeric(12,2) DEFAULT 0,
    "billed_name" "text",
    "billed_email" "text",
    "billed_address" "text",
    "deleted_at" timestamp with time zone,
    "invoice_type" "text" DEFAULT 'full'::"text",
    "due_date" "date",
    "invoice_number" "text",
    "sent_at" timestamp with time zone,
    CONSTRAINT "invoices_invoice_type_check" CHECK (("invoice_type" = ANY (ARRAY['prepayment'::"text", 'afterpayment'::"text", 'full'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invoices"."invoice_type" IS 'prepayment = förskott för rummet, afterpayment = efterskott för tjänster, full = komplett faktura';



COMMENT ON COLUMN "public"."invoices"."due_date" IS 'Förfallodatum för fakturan';



CREATE OR REPLACE VIEW "public"."latest_function_logs" WITH ("security_invoker"='on') AS
 SELECT DISTINCT ON ("function_name") "function_name",
    "run_at",
    "status",
    "message",
    "records_created",
    "error"
   FROM "public"."function_logs"
  ORDER BY "function_name", "run_at" DESC;


ALTER VIEW "public"."latest_function_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migrations" (
    "id" integer NOT NULL,
    "version" "text" NOT NULL,
    "description" "text",
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "execution_time_ms" integer,
    "created_by" "text" DEFAULT CURRENT_USER
);


ALTER TABLE "public"."migrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."migrations" IS 'Spårar alla körda databas-migrationer för långsiktig hållbarhet';



COMMENT ON COLUMN "public"."migrations"."version" IS 'Unikt versions-ID för migrationen (t.ex. 20251116_add_cancellation)';



COMMENT ON COLUMN "public"."migrations"."description" IS 'Beskrivning av vad migrationen gör';



COMMENT ON COLUMN "public"."migrations"."executed_at" IS 'Tidpunkt när migrationen kördes';



COMMENT ON COLUMN "public"."migrations"."execution_time_ms" IS 'Körtid i millisekunder (frivillig)';



CREATE SEQUENCE IF NOT EXISTS "public"."migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."migrations_id_seq" OWNED BY "public"."migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subscription_plan" "text" DEFAULT 'basic'::"text",
    "trial_ends_at" timestamp with time zone,
    "subscription_status" "text" DEFAULT 'trial'::"text",
    "org_number" "text",
    "status" "text" DEFAULT 'trialing'::"text",
    "warning_sent" boolean DEFAULT false,
    "pending_plan_change" "text",
    "user_id" "uuid",
    "email" "text",
    "phone" "text",
    "address" "text",
    "vat_included" boolean DEFAULT true,
    "vat_rate" numeric DEFAULT 25,
    "pricing_currency" "text" DEFAULT 'SEK'::"text",
    "contact_email" "text",
    "invoice_email" "text",
    "reply_to_email" "text",
    "email_sender_name" "text",
    "slug" "text",
    "cancellation_policy" "jsonb" DEFAULT '{"days_3_to_7": 0.5, "days_7_plus": 0, "description": "7+ dagar: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: 100% avgift", "days_under_3": 1.0}'::"jsonb",
    "lan" "text",
    "kommun" "text",
    "service_types" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_visible_to_customers" boolean DEFAULT true
);


ALTER TABLE "public"."orgs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orgs"."cancellation_policy" IS 'Avbokningspolicy i JSON-format med olika avgifter baserat på dagar kvar';



COMMENT ON COLUMN "public"."orgs"."lan" IS 'Län där organisationen är verksam (t.ex. "Stockholm", "Västra Götaland")';



COMMENT ON COLUMN "public"."orgs"."kommun" IS 'Kommun där organisationen är verksam (t.ex. "Stockholm", "Göteborg")';



COMMENT ON COLUMN "public"."orgs"."service_types" IS 'Array av tjänster: ["hunddagis", "hundpensionat", "hundfrisor"]';



COMMENT ON COLUMN "public"."orgs"."is_visible_to_customers" IS 'Om organisationen ska synas i public organisation selector (false = privat/test-organisation)';



CREATE OR REPLACE VIEW "public"."org_status_view" WITH ("security_invoker"='on') AS
 SELECT "id" AS "org_id",
    "name",
    "status",
    "trial_ends_at",
    GREATEST("date_part"('day'::"text", ("trial_ends_at" - "now"())), (0)::double precision) AS "days_left",
        CASE
            WHEN ("status" = 'locked'::"text") THEN '🔒 Låst'::"text"
            WHEN (("status" = 'trialing'::"text") AND ("trial_ends_at" < ("now"() + '3 days'::interval))) THEN '⚠️ Snart låst'::"text"
            WHEN ("status" = 'active'::"text") THEN '✅ Aktiv'::"text"
            ELSE 'ℹ️ Okänd'::"text"
        END AS "readable_status"
   FROM "public"."orgs" "o";


ALTER VIEW "public"."org_status_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'basic'::"text" NOT NULL,
    "status" "text" DEFAULT 'trialing'::"text" NOT NULL,
    "trial_starts_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."org_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "phone" "text",
    "last_sign_in_at" timestamp with time zone,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."last_sign_in_at" IS 'Senaste inloggning för användaren';



CREATE OR REPLACE VIEW "public"."organization_subscription_overview" WITH ("security_invoker"='on') AS
 SELECT "id",
    "name",
    "subscription_plan",
    "status",
    "trial_ends_at",
        CASE
            WHEN ("trial_ends_at" IS NULL) THEN 'Ingen testperiod'::"text"
            WHEN ("trial_ends_at" > "now"()) THEN "concat"(("trial_ends_at" - "now"()), ' kvar')
            ELSE 'Utgått'::"text"
        END AS "trial_status",
    ( SELECT "count"(*) AS "count"
           FROM "public"."profiles" "p"
          WHERE ("p"."org_id" = "o"."id")) AS "user_count"
   FROM "public"."orgs" "o"
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."organization_subscription_overview" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."owners_customer_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."owners_customer_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "full_name" "text",
    "phone" "text",
    "email" "text",
    "postal_code" "text",
    "city" "text",
    "contact_person_2" "text",
    "contact_phone_2" "text",
    "created_at" timestamp with time zone DEFAULT '2025-10-09 15:51:44.058603+00'::timestamp with time zone,
    "customer_number" integer DEFAULT "nextval"('"public"."owners_customer_number_seq"'::"regclass"),
    "profile_id" "uuid",
    "personnummer" "text",
    "user_id" "uuid",
    "address" "text",
    "gdpr_consent" boolean DEFAULT false,
    "marketing_consent" boolean DEFAULT false,
    "photo_consent" boolean DEFAULT false,
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "consent_status" "text" DEFAULT 'pending'::"text",
    "consent_verified_at" timestamp with time zone,
    "gdpr_marketing_consent" boolean DEFAULT false,
    "is_anonymized" boolean DEFAULT false,
    "anonymized_at" timestamp with time zone,
    "anonymization_reason" "text",
    "data_retention_until" "date",
    CONSTRAINT "owners_consent_status_check" CHECK (("consent_status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'declined'::"text", 'expired'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


COMMENT ON TABLE "public"."owners" IS 'Hundägare (kopplad till dogs.owner_id)';



COMMENT ON COLUMN "public"."owners"."customer_number" IS 'Globalt unikt kundnummer som följer hundägaren över alla pensionat/dagis. Auto-genereras vid INSERT.';



COMMENT ON COLUMN "public"."owners"."is_anonymized" IS 'GDPR - ägare har anonymiserats (personuppgifter raderade)';



COMMENT ON COLUMN "public"."owners"."anonymized_at" IS 'Tidpunkt för anonymisering';



COMMENT ON COLUMN "public"."owners"."anonymization_reason" IS 'Anledning till anonymisering';



COMMENT ON COLUMN "public"."owners"."data_retention_until" IS 'Datum då data kan raderas (7 år efter sista faktura)';



CREATE TABLE IF NOT EXISTS "public"."pension_stays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "dog_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'booked'::"text",
    "base_price" numeric(10,2) DEFAULT 0,
    "addons" "jsonb",
    "total_amount" numeric(10,2) DEFAULT 0,
    "notes" "text",
    CONSTRAINT "pension_stays_status_check" CHECK (("status" = ANY (ARRAY['booked'::"text", 'checked_in'::"text", 'checked_out'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."pension_stays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "notes" "text",
    "capacity" integer,
    "capacity_m2" numeric DEFAULT 15 NOT NULL,
    "is_active" boolean DEFAULT true,
    "room_type" "text" DEFAULT 'both'::"text",
    CONSTRAINT "rooms_room_type_check" CHECK (("room_type" = ANY (ARRAY['daycare'::"text", 'boarding'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rooms"."room_type" IS 'Typ av rum: daycare (dagis), boarding (pensionat), both (båda)';



CREATE OR REPLACE VIEW "public"."pension_calendar_full_view" WITH ("security_invoker"='on') AS
 SELECT "ps"."id" AS "stay_id",
    "ps"."org_id",
    "ps"."dog_id",
    "d"."name" AS "dog_name",
    "d"."breed",
    "d"."heightcm",
    "d"."subscription",
    "o"."full_name" AS "owner_name",
    "o"."email" AS "owner_email",
    "r"."id" AS "room_id",
    "r"."name" AS "room_name",
    "ps"."start_date",
    "ps"."end_date",
    "ps"."status",
    "ps"."base_price",
    "ps"."total_amount",
    "ps"."addons",
    "ps"."notes",
    "ps"."created_at",
    "ps"."updated_at"
   FROM ((("public"."pension_stays" "ps"
     JOIN "public"."dogs" "d" ON (("ps"."dog_id" = "d"."id")))
     JOIN "public"."rooms" "r" ON (("ps"."room_id" = "r"."id")))
     LEFT JOIN "public"."owners" "o" ON (("d"."owner_id" = "o"."id")))
  WHERE ("ps"."status" = ANY (ARRAY['booked'::"text", 'checked_in'::"text", 'checked_out'::"text"]))
  ORDER BY "ps"."start_date";


ALTER VIEW "public"."pension_calendar_full_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pension_calendar_view" WITH ("security_invoker"='on') AS
 SELECT "ps"."id" AS "stay_id",
    "ps"."org_id",
    "ps"."dog_id",
    "d"."name" AS "dog_name",
    "d"."breed",
    "d"."heightcm" AS "height_cm",
    "o"."full_name" AS "owner_name",
    "o"."email" AS "owner_email",
    "ps"."room_id",
    "r"."name" AS "room_name",
    "r"."capacity",
    "ps"."start_date",
    "ps"."end_date",
    "ps"."status",
    "ps"."base_price",
    "ps"."addons",
    "ps"."total_amount",
    "ps"."notes",
    "ps"."created_at",
    "ps"."updated_at"
   FROM ((("public"."pension_stays" "ps"
     JOIN "public"."dogs" "d" ON (("ps"."dog_id" = "d"."id")))
     JOIN "public"."rooms" "r" ON (("ps"."room_id" = "r"."id")))
     LEFT JOIN "public"."owners" "o" ON (("d"."owner_id" = "o"."id")));


ALTER VIEW "public"."pension_calendar_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pension_owner_summary_view" WITH ("security_invoker"='on') AS
 SELECT "o"."id" AS "owner_id",
    "o"."full_name" AS "owner_name",
    "o"."email" AS "owner_email",
    "o"."phone" AS "owner_phone",
    "o"."city",
    "o"."postal_code",
    "d"."org_id",
    "count"(DISTINCT "d"."id") AS "total_dogs",
    "count"(DISTINCT "ps"."id") AS "total_stays",
    "sum"("ps"."total_amount") AS "total_spent",
    "date_trunc"('month'::"text", ("ps"."start_date")::timestamp with time zone) AS "month_period"
   FROM (("public"."owners" "o"
     JOIN "public"."dogs" "d" ON (("d"."owner_id" = "o"."id")))
     LEFT JOIN "public"."pension_stays" "ps" ON (("ps"."dog_id" = "d"."id")))
  WHERE ("ps"."status" = ANY (ARRAY['booked'::"text", 'checked_in'::"text", 'checked_out'::"text"]))
  GROUP BY "o"."id", "o"."full_name", "o"."email", "o"."phone", "o"."city", "o"."postal_code", "d"."org_id", ("date_trunc"('month'::"text", ("ps"."start_date")::timestamp with time zone))
  ORDER BY ("date_trunc"('month'::"text", ("ps"."start_date")::timestamp with time zone)) DESC, "o"."full_name";


ALTER VIEW "public"."pension_owner_summary_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pension_room_occupancy_view" WITH ("security_invoker"='on') AS
 SELECT "r"."id" AS "room_id",
    "r"."name" AS "room_name",
    "r"."capacity",
    "r"."org_id",
    "d"."org_id" AS "dog_org_id",
    "ps"."start_date",
    "ps"."end_date",
    "ps"."status",
    "count"("ps"."id") AS "dogs_booked",
    "sum"(
        CASE
            WHEN ("d"."heightcm" <= 25) THEN (2)::numeric
            WHEN (("d"."heightcm" >= 26) AND ("d"."heightcm" <= 35)) THEN (2)::numeric
            WHEN (("d"."heightcm" >= 36) AND ("d"."heightcm" <= 45)) THEN 2.5
            WHEN (("d"."heightcm" >= 46) AND ("d"."heightcm" <= 55)) THEN 3.5
            WHEN (("d"."heightcm" >= 56) AND ("d"."heightcm" <= 65)) THEN 4.5
            ELSE 5.5
        END) AS "total_area_used",
    (("r"."capacity")::numeric - "sum"(
        CASE
            WHEN ("d"."heightcm" <= 25) THEN (2)::numeric
            WHEN (("d"."heightcm" >= 26) AND ("d"."heightcm" <= 35)) THEN (2)::numeric
            WHEN (("d"."heightcm" >= 36) AND ("d"."heightcm" <= 45)) THEN 2.5
            WHEN (("d"."heightcm" >= 46) AND ("d"."heightcm" <= 55)) THEN 3.5
            WHEN (("d"."heightcm" >= 56) AND ("d"."heightcm" <= 65)) THEN 4.5
            ELSE 5.5
        END)) AS "remaining_area"
   FROM (("public"."pension_stays" "ps"
     JOIN "public"."dogs" "d" ON (("ps"."dog_id" = "d"."id")))
     JOIN "public"."rooms" "r" ON (("ps"."room_id" = "r"."id")))
  WHERE ("ps"."status" = ANY (ARRAY['booked'::"text", 'checked_in'::"text"]))
  GROUP BY "r"."id", "r"."name", "r"."capacity", "r"."org_id", "d"."org_id", "ps"."start_date", "ps"."end_date", "ps"."status"
  ORDER BY "r"."name", "ps"."start_date";


ALTER VIEW "public"."pension_room_occupancy_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "effective_from" "date",
    "items" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."price_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "service_type" "text" NOT NULL,
    "price_per_day" numeric(10,2),
    "price_per_hour" numeric(10,2),
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trigger_execution_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trigger_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "row_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "success" boolean DEFAULT true NOT NULL,
    "error_message" "text",
    "execution_time_ms" integer,
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trigger_execution_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."trigger_execution_log" IS 'Loggar alla trigger-exekveringar för debugging och monitoring';



CREATE OR REPLACE VIEW "public"."recent_trigger_failures" AS
 SELECT "id",
    "trigger_name",
    "table_name",
    "operation",
    "row_id",
    "error_message",
    "new_data",
    "executed_at"
   FROM "public"."trigger_execution_log"
  WHERE (("success" = false) AND ("executed_at" > ("now"() - '7 days'::interval)))
  ORDER BY "executed_at" DESC
 LIMIT 100;


ALTER VIEW "public"."recent_trigger_failures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."responsibilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task" "text",
    "done" boolean,
    "org_id" "uuid"
);


ALTER TABLE "public"."responsibilities" OWNER TO "postgres";


COMMENT ON TABLE "public"."responsibilities" IS 'Ansvarsfördelning. Realtime aktiverad för schemaändringar.';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "unit" "text" DEFAULT 'per_dog'::"text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."special_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" DEFAULT 'custom'::"text",
    "price_surcharge" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "special_dates_category_check" CHECK (("category" = ANY (ARRAY['red_day'::"text", 'holiday'::"text", 'event'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."special_dates" OWNER TO "postgres";


COMMENT ON TABLE "public"."special_dates" IS '
ANVÄNDNING:
1. Röda dagar: Importera automatiskt via UI eller manuellt INSERT
2. Lokala event: Lägg till manuellt när behov uppstår
3. Högtider: Kan ha olika påslag beroende på betydelse
4. Prioritet: Specialdatum har HÖGSTA prioritet i prisberäkning (före helg, före säsong)

PRISBERÄKNING:
- Om datum finns i special_dates → använd price_surcharge
- Annars om helg (fre-sön) → använd weekend_surcharge från boarding_prices
- Alltid applicera säsong från boarding_seasons (multiplikator)
';



COMMENT ON COLUMN "public"."special_dates"."category" IS 'red_day=svenska röda dagar, holiday=lov/semester, event=lokala event, custom=anpassat';



COMMENT ON COLUMN "public"."special_dates"."price_surcharge" IS 'Fast påslag i kronor för detta datum (t.ex. 400 kr för midsommar, 75 kr för mindre röd dag)';



CREATE TABLE IF NOT EXISTS "public"."staff_notes" (
    "id" bigint NOT NULL,
    "note" "text" NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."staff_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."staff_notes" IS 'Personalanteckningar. Realtime aktiverad för samarbete.';



ALTER TABLE "public"."staff_notes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."staff_notes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."subscription_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "subscription_type" "text" NOT NULL,
    "height_min" integer DEFAULT 0 NOT NULL,
    "height_max" integer DEFAULT 999 NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_types_subscription_type_check" CHECK (("subscription_type" = ANY (ARRAY['heltid'::"text", 'deltid_3'::"text", 'deltid_2'::"text", 'timdagis'::"text"])))
);


ALTER TABLE "public"."subscription_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_types" IS 'Prissättning per abonnemangstyp och mankhöjd';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "dog_id" "uuid",
    "status" "text",
    "customer_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "abon_type" "text",
    "price_per_month" numeric,
    "start_date" "date",
    "end_date" "date",
    "weekdays" "jsonb",
    "org_id" "uuid",
    "trial_ends_at" timestamp with time zone,
    "plan_name" "text" DEFAULT 'basic'::"text",
    "renews_at" timestamp with time zone,
    "price" numeric DEFAULT 99,
    "next_billing_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'locked'::"text", 'canceled'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_key" "text" NOT NULL,
    "config_value" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_config" IS 'System-nivå konfiguration för DogPlanner-plattformen';



CREATE OR REPLACE VIEW "public"."trigger_health_summary" AS
 SELECT "trigger_name",
    "table_name",
    "count"(*) AS "total_executions",
    "count"(*) FILTER (WHERE ("success" = true)) AS "successful",
    "count"(*) FILTER (WHERE ("success" = false)) AS "failed",
    "round"("avg"("execution_time_ms"), 2) AS "avg_execution_ms",
    "max"("executed_at") AS "last_execution"
   FROM "public"."trigger_execution_log"
  WHERE ("executed_at" > ("now"() - '24:00:00'::interval))
  GROUP BY "trigger_name", "table_name"
  ORDER BY ("count"(*) FILTER (WHERE ("success" = false))) DESC, ("count"(*)) DESC;


ALTER VIEW "public"."trigger_health_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_org_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_org_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'personal'::"text", 'kund'::"text"])))
);


ALTER TABLE "public"."user_org_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."users_without_org" AS
 SELECT "u"."id",
    "u"."email",
    "u"."created_at",
    ("u"."raw_user_meta_data" ->> 'org_name'::"text") AS "intended_org_name",
    "p"."org_id"
   FROM ("auth"."users" "u"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "u"."id")))
  WHERE ("p"."org_id" IS NULL)
  ORDER BY "u"."created_at" DESC;


ALTER VIEW "public"."users_without_org" OWNER TO "postgres";


ALTER TABLE ONLY "public"."migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."boarding_prices"
    ADD CONSTRAINT "boarding_prices_org_id_dog_size_key" UNIQUE ("org_id", "dog_size");



ALTER TABLE ONLY "public"."boarding_prices"
    ADD CONSTRAINT "boarding_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."boarding_seasons"
    ADD CONSTRAINT "boarding_seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daycare_pricing"
    ADD CONSTRAINT "daycare_pricing_org_id_key" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."daycare_pricing"
    ADD CONSTRAINT "daycare_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daycare_service_completions"
    ADD CONSTRAINT "daycare_service_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dog_journal"
    ADD CONSTRAINT "dog_journal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_customers"
    ADD CONSTRAINT "external_customers_org_id_customer_phone_dog_name_key" UNIQUE ("org_id", "customer_phone", "dog_name");



ALTER TABLE ONLY "public"."external_customers"
    ADD CONSTRAINT "external_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extra_service"
    ADD CONSTRAINT "extra_service_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extra_services"
    ADD CONSTRAINT "extra_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."function_logs"
    ADD CONSTRAINT "function_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdpr_deletion_log"
    ADD CONSTRAINT "gdpr_deletion_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grooming_bookings"
    ADD CONSTRAINT "grooming_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grooming_journal"
    ADD CONSTRAINT "grooming_journal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grooming_logs"
    ADD CONSTRAINT "grooming_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grooming_services"
    ADD CONSTRAINT "grooming_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interest_applications"
    ADD CONSTRAINT "interest_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_runs"
    ADD CONSTRAINT "invoice_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_org_unique" UNIQUE ("org_id", "invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migrations_version_key" UNIQUE ("version");



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_org_customer_unique" UNIQUE ("org_id", "customer_number");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pension_stays"
    ADD CONSTRAINT "pension_stays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_lists"
    ADD CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responsibilities"
    ADD CONSTRAINT "responsibilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."special_dates"
    ADD CONSTRAINT "special_dates_org_id_date_key" UNIQUE ("org_id", "date");



ALTER TABLE ONLY "public"."special_dates"
    ADD CONSTRAINT "special_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_notes"
    ADD CONSTRAINT "staff_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_types"
    ADD CONSTRAINT "subscription_types_org_id_subscription_type_height_min_heig_key" UNIQUE ("org_id", "subscription_type", "height_min", "height_max");



ALTER TABLE ONLY "public"."subscription_types"
    ADD CONSTRAINT "subscription_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_org_id_unique" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_config_key_key" UNIQUE ("config_key");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trigger_execution_log"
    ADD CONSTRAINT "trigger_execution_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_org_roles"
    ADD CONSTRAINT "user_org_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "bookings_date_idx" ON "public"."bookings" USING "btree" ("start_date", "end_date");



CREATE INDEX "bookings_dog_idx" ON "public"."bookings" USING "btree" ("dog_id");



CREATE INDEX "bookings_org_idx" ON "public"."bookings" USING "btree" ("org_id");



CREATE INDEX "bookings_period_idx" ON "public"."bookings" USING "btree" ("start_date", "end_date");



CREATE INDEX "bookings_room_idx" ON "public"."bookings" USING "btree" ("room_id");



CREATE INDEX "dog_journal_dog_id_idx" ON "public"."dog_journal" USING "btree" ("dog_id");



CREATE INDEX "dogs_name_idx" ON "public"."dogs" USING "btree" ("lower"("name"));



CREATE INDEX "dogs_org_id_idx" ON "public"."dogs" USING "btree" ("org_id");



CREATE INDEX "dogs_owner_id_idx" ON "public"."dogs" USING "btree" ("owner_id");



CREATE INDEX "idx_boarding_prices_active" ON "public"."boarding_prices" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_boarding_prices_dog_size" ON "public"."boarding_prices" USING "btree" ("dog_size");



CREATE INDEX "idx_boarding_prices_org_id" ON "public"."boarding_prices" USING "btree" ("org_id");



CREATE INDEX "idx_booking_events_booking_id" ON "public"."booking_events" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_events_event_type" ON "public"."booking_events" USING "btree" ("event_type");



CREATE INDEX "idx_booking_events_org_id" ON "public"."booking_events" USING "btree" ("org_id");



CREATE INDEX "idx_booking_services_booking_id" ON "public"."booking_services" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_services_service_id" ON "public"."booking_services" USING "btree" ("service_id");



CREATE INDEX "idx_bookings_afterpayment_invoice" ON "public"."bookings" USING "btree" ("afterpayment_invoice_id");



CREATE INDEX "idx_bookings_bed_location" ON "public"."bookings" USING "btree" ("bed_location");



CREATE INDEX "idx_bookings_cancelled_at" ON "public"."bookings" USING "btree" ("cancelled_at");



CREATE INDEX "idx_bookings_dog_id" ON "public"."bookings" USING "btree" ("dog_id");



CREATE INDEX "idx_bookings_end_date" ON "public"."bookings" USING "btree" ("end_date");



CREATE INDEX "idx_bookings_org_id" ON "public"."bookings" USING "btree" ("org_id");



CREATE INDEX "idx_bookings_org_status" ON "public"."bookings" USING "btree" ("org_id", "status");



CREATE INDEX "idx_bookings_prepayment_invoice" ON "public"."bookings" USING "btree" ("prepayment_invoice_id");



CREATE INDEX "idx_bookings_prepayment_status" ON "public"."bookings" USING "btree" ("prepayment_status");



CREATE INDEX "idx_bookings_room_id" ON "public"."bookings" USING "btree" ("room_id");



CREATE INDEX "idx_bookings_start_date" ON "public"."bookings" USING "btree" ("start_date");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_status_start_date" ON "public"."bookings" USING "btree" ("status", "start_date");



CREATE INDEX "idx_consent_logs_active" ON "public"."consent_logs" USING "btree" ("owner_id") WHERE (("consent_given" = true) AND ("withdrawn_at" IS NULL));



CREATE INDEX "idx_consent_logs_org" ON "public"."consent_logs" USING "btree" ("org_id");



CREATE INDEX "idx_consent_logs_owner" ON "public"."consent_logs" USING "btree" ("owner_id");



CREATE INDEX "idx_dog_journal_created_at" ON "public"."dog_journal" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_dog_journal_dog_id" ON "public"."dog_journal" USING "btree" ("dog_id");



CREATE INDEX "idx_dog_journal_org_id" ON "public"."dog_journal" USING "btree" ("org_id");



CREATE INDEX "idx_dogs_is_deleted" ON "public"."dogs" USING "btree" ("is_deleted");



CREATE INDEX "idx_dogs_name" ON "public"."dogs" USING "btree" ("name");



CREATE INDEX "idx_dogs_org_id" ON "public"."dogs" USING "btree" ("org_id");



CREATE INDEX "idx_dogs_owner_id" ON "public"."dogs" USING "btree" ("owner_id");



CREATE INDEX "idx_external_customers_dog_name" ON "public"."external_customers" USING "btree" ("dog_name");



CREATE INDEX "idx_external_customers_name" ON "public"."external_customers" USING "btree" ("customer_name");



CREATE INDEX "idx_external_customers_org_id" ON "public"."external_customers" USING "btree" ("org_id");



CREATE INDEX "idx_external_customers_phone" ON "public"."external_customers" USING "btree" ("customer_phone");



CREATE INDEX "idx_extra_service_dogs_id" ON "public"."extra_service" USING "btree" ("dogs_id");



CREATE INDEX "idx_extra_service_org_id" ON "public"."extra_service" USING "btree" ("org_id");



CREATE INDEX "idx_extra_service_payment_type" ON "public"."extra_service" USING "btree" ("payment_type");



CREATE INDEX "idx_extra_services_branch_id" ON "public"."extra_services" USING "btree" ("branch_id");



CREATE INDEX "idx_extra_services_org_id" ON "public"."extra_services" USING "btree" ("org_id");



CREATE INDEX "idx_extra_services_service_type" ON "public"."extra_services" USING "btree" ("service_type");



CREATE INDEX "idx_grooming_bookings_appointment_date" ON "public"."grooming_bookings" USING "btree" ("appointment_date");



CREATE INDEX "idx_grooming_bookings_dog_id" ON "public"."grooming_bookings" USING "btree" ("dog_id");



CREATE INDEX "idx_grooming_bookings_org_date" ON "public"."grooming_bookings" USING "btree" ("org_id", "appointment_date");



CREATE INDEX "idx_grooming_bookings_org_id" ON "public"."grooming_bookings" USING "btree" ("org_id");



CREATE INDEX "idx_grooming_bookings_status" ON "public"."grooming_bookings" USING "btree" ("status");



CREATE INDEX "idx_grooming_journal_booking_id" ON "public"."grooming_journal" USING "btree" ("booking_id");



CREATE INDEX "idx_grooming_journal_org_date" ON "public"."grooming_journal" USING "btree" ("org_id", "appointment_date");



CREATE INDEX "idx_grooming_services_org" ON "public"."grooming_services" USING "btree" ("org_id");



CREATE INDEX "idx_interest_applications_created_at" ON "public"."interest_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_interest_applications_org_id" ON "public"."interest_applications" USING "btree" ("org_id");



CREATE INDEX "idx_interest_applications_status" ON "public"."interest_applications" USING "btree" ("status");



CREATE INDEX "idx_interest_priority" ON "public"."interest_applications" USING "btree" ("priority");



CREATE INDEX "idx_interest_status" ON "public"."interest_applications" USING "btree" ("status");



CREATE INDEX "idx_interest_visit_booked" ON "public"."interest_applications" USING "btree" ("visit_booked_date") WHERE ("visit_booked_date" IS NOT NULL);



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_runs_month" ON "public"."invoice_runs" USING "btree" ("month_id");



CREATE INDEX "idx_invoice_runs_run_at" ON "public"."invoice_runs" USING "btree" ("run_at" DESC);



CREATE INDEX "idx_invoice_runs_status" ON "public"."invoice_runs" USING "btree" ("status");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_invoice_date" ON "public"."invoices" USING "btree" ("invoice_date");



CREATE INDEX "idx_invoices_org_id" ON "public"."invoices" USING "btree" ("org_id");



CREATE INDEX "idx_invoices_owner_id" ON "public"."invoices" USING "btree" ("owner_id");



CREATE INDEX "idx_invoices_sent_at" ON "public"."invoices" USING "btree" ("sent_at" DESC) WHERE ("sent_at" IS NOT NULL);



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_type" ON "public"."invoices" USING "btree" ("invoice_type");



CREATE INDEX "idx_migrations_executed_at" ON "public"."migrations" USING "btree" ("executed_at");



CREATE INDEX "idx_migrations_version" ON "public"."migrations" USING "btree" ("version");



CREATE INDEX "idx_org_subscriptions_org_active" ON "public"."org_subscriptions" USING "btree" ("org_id") WHERE ("is_active" = true);



CREATE INDEX "idx_orgs_kommun" ON "public"."orgs" USING "btree" ("kommun");



CREATE INDEX "idx_orgs_lan" ON "public"."orgs" USING "btree" ("lan");



CREATE INDEX "idx_orgs_service_types" ON "public"."orgs" USING "gin" ("service_types");



CREATE INDEX "idx_orgs_visible" ON "public"."orgs" USING "btree" ("is_visible_to_customers") WHERE ("is_visible_to_customers" = true);



CREATE INDEX "idx_owners_customer_number" ON "public"."owners" USING "btree" ("customer_number");



CREATE INDEX "idx_owners_data_retention" ON "public"."owners" USING "btree" ("data_retention_until");



CREATE INDEX "idx_owners_email" ON "public"."owners" USING "btree" ("email");



CREATE INDEX "idx_owners_is_anonymized" ON "public"."owners" USING "btree" ("is_anonymized");



CREATE INDEX "idx_owners_org_customer" ON "public"."owners" USING "btree" ("org_id", "customer_number");



CREATE INDEX "idx_owners_org_id" ON "public"."owners" USING "btree" ("org_id");



CREATE INDEX "idx_owners_phone" ON "public"."owners" USING "btree" ("phone");



CREATE INDEX "idx_pricing_org_id" ON "public"."pricing" USING "btree" ("org_id");



CREATE INDEX "idx_pricing_service_type" ON "public"."pricing" USING "btree" ("service_type");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_org_id" ON "public"."profiles" USING "btree" ("org_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_rooms_is_active" ON "public"."rooms" USING "btree" ("is_active");



CREATE INDEX "idx_rooms_org_id" ON "public"."rooms" USING "btree" ("org_id");



CREATE INDEX "idx_trigger_log_executed_at" ON "public"."trigger_execution_log" USING "btree" ("executed_at" DESC);



CREATE INDEX "idx_trigger_log_success" ON "public"."trigger_execution_log" USING "btree" ("success") WHERE ("success" = false);



CREATE INDEX "idx_trigger_log_table_name" ON "public"."trigger_execution_log" USING "btree" ("table_name");



CREATE INDEX "idx_trigger_log_trigger_name" ON "public"."trigger_execution_log" USING "btree" ("trigger_name");



CREATE INDEX "inv_owner_idx" ON "public"."invoices" USING "btree" ("owner_id", "invoice_date");



CREATE UNIQUE INDEX "owners_customer_number_key" ON "public"."owners" USING "btree" ("customer_number");



CREATE INDEX "owners_name_idx" ON "public"."owners" USING "btree" ("lower"("full_name"));



CREATE UNIQUE INDEX "owners_org_customer_uid" ON "public"."owners" USING "btree" ("org_id", "customer_number");



CREATE UNIQUE INDEX "owners_org_personnummer_key" ON "public"."owners" USING "btree" ("org_id", "personnummer") WHERE ("personnummer" IS NOT NULL);



CREATE OR REPLACE TRIGGER "on_insert_set_org_id_for_boarding_seasons" BEFORE INSERT ON "public"."boarding_seasons" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_rooms"();



CREATE OR REPLACE TRIGGER "on_insert_set_org_id_for_grooming" BEFORE INSERT ON "public"."grooming_logs" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_grooming"();



CREATE OR REPLACE TRIGGER "on_insert_set_org_id_for_services" BEFORE INSERT ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_rooms"();



CREATE OR REPLACE TRIGGER "on_insert_set_org_id_for_special_dates" BEFORE INSERT ON "public"."special_dates" FOR EACH ROW EXECUTE FUNCTION "public"."set_special_date_org_id"();



CREATE OR REPLACE TRIGGER "on_insert_set_org_id_for_subscriptions" BEFORE INSERT ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_subscription"();



CREATE OR REPLACE TRIGGER "on_insert_set_trial_end_for_org" BEFORE INSERT ON "public"."orgs" FOR EACH ROW EXECUTE FUNCTION "public"."set_trial_end_for_org"();



CREATE OR REPLACE TRIGGER "on_org_insert_add_special_dates" AFTER INSERT ON "public"."orgs" FOR EACH ROW EXECUTE FUNCTION "public"."add_default_special_dates_for_org"();



CREATE OR REPLACE TRIGGER "on_org_locked_email" AFTER UPDATE ON "public"."orgs" FOR EACH ROW WHEN ((("new"."status" = 'locked'::"text") AND ("old"."status" IS DISTINCT FROM 'locked'::"text"))) EXECUTE FUNCTION "public"."notify_admin_on_lock"();



CREATE OR REPLACE TRIGGER "on_profile_insert" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_role"();



CREATE OR REPLACE TRIGGER "set_timestamp_pension_stays" BEFORE UPDATE ON "public"."pension_stays" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated"();



CREATE OR REPLACE TRIGGER "trg_auto_match_owner" AFTER INSERT ON "public"."dogs" FOR EACH ROW WHEN (("new"."owner_id" IS NULL)) EXECUTE FUNCTION "public"."auto_match_owner_trigger"();



CREATE OR REPLACE TRIGGER "trg_calc_total_amount" BEFORE INSERT OR UPDATE ON "public"."pension_stays" FOR EACH ROW EXECUTE FUNCTION "public"."calc_total_amount"();



CREATE OR REPLACE TRIGGER "trg_create_invoice_on_checkout" AFTER UPDATE ON "public"."bookings" FOR EACH ROW WHEN ((("new"."status" = 'checked_out'::"text") AND ("old"."status" <> 'checked_out'::"text"))) EXECUTE FUNCTION "public"."create_invoice_on_checkout"();



CREATE OR REPLACE TRIGGER "trg_create_journal_on_new_dog" AFTER INSERT ON "public"."dogs" FOR EACH ROW EXECUTE FUNCTION "public"."create_dog_journal_on_new_dog"();



CREATE OR REPLACE TRIGGER "trg_create_prepayment_invoice" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW WHEN ((("new"."status" = 'confirmed'::"text") AND ("old"."status" = 'pending'::"text"))) EXECUTE FUNCTION "public"."create_prepayment_invoice"();



CREATE OR REPLACE TRIGGER "trg_delete_org_if_no_admins" AFTER DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."delete_org_if_no_admins"();



CREATE OR REPLACE TRIGGER "trg_ensure_org_has_admin" AFTER DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_org_has_admin"();



CREATE OR REPLACE TRIGGER "trg_set_booking_org_id" BEFORE INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_booking_org_id"();



CREATE OR REPLACE TRIGGER "trg_set_dog_journal_org_id" BEFORE INSERT ON "public"."dog_journal" FOR EACH ROW EXECUTE FUNCTION "public"."set_dog_journal_org_id"();



CREATE OR REPLACE TRIGGER "trg_set_dog_org_id" BEFORE INSERT ON "public"."dogs" FOR EACH ROW EXECUTE FUNCTION "public"."set_dog_org_id"();



CREATE OR REPLACE TRIGGER "trg_set_extra_service_org_id" BEFORE INSERT ON "public"."extra_service" FOR EACH ROW EXECUTE FUNCTION "public"."set_extra_service_org_id"();



CREATE OR REPLACE TRIGGER "trg_set_org_id_extra_services" BEFORE INSERT ON "public"."extra_services" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_owners"();



COMMENT ON TRIGGER "trg_set_org_id_extra_services" ON "public"."extra_services" IS 'Sätter org_id automatiskt från användarens profil vid INSERT';



CREATE OR REPLACE TRIGGER "trg_set_org_id_rooms" BEFORE INSERT ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_id_for_rooms"();



CREATE OR REPLACE TRIGGER "trg_set_pension_stay_org_id" BEFORE INSERT OR UPDATE ON "public"."pension_stays" FOR EACH ROW EXECUTE FUNCTION "public"."set_pension_stay_org_id"();



CREATE OR REPLACE TRIGGER "trg_update_dogs_updated_at" BEFORE UPDATE ON "public"."dogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated"();



CREATE OR REPLACE TRIGGER "trigger_auto_create_grooming_journal" AFTER UPDATE OF "status" ON "public"."grooming_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_grooming_journal"();



CREATE OR REPLACE TRIGGER "trigger_auto_customer_number" BEFORE INSERT ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_customer_number"();



CREATE OR REPLACE TRIGGER "trigger_log_booking_changes" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."log_booking_status_change"();



CREATE OR REPLACE TRIGGER "trigger_set_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_number"();



CREATE OR REPLACE TRIGGER "trigger_update_external_customer_stats" AFTER UPDATE OF "status" ON "public"."grooming_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_external_customer_stats"();



CREATE OR REPLACE TRIGGER "trigger_update_external_customers_updated_at" BEFORE UPDATE ON "public"."external_customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_external_customers_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_owner_consent_status" AFTER INSERT ON "public"."consent_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_owner_consent_status"();



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boarding_prices"
    ADD CONSTRAINT "boarding_prices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boarding_seasons"
    ADD CONSTRAINT "boarding_seasons_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_afterpayment_invoice_id_fkey" FOREIGN KEY ("afterpayment_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_prepayment_invoice_id_fkey" FOREIGN KEY ("prepayment_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_witness_staff_id_fkey" FOREIGN KEY ("witness_staff_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daycare_pricing"
    ADD CONSTRAINT "daycare_pricing_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daycare_service_completions"
    ADD CONSTRAINT "daycare_service_completions_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daycare_service_completions"
    ADD CONSTRAINT "daycare_service_completions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dog_journal"
    ADD CONSTRAINT "dog_journal_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."external_customers"
    ADD CONSTRAINT "external_customers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."extra_service"
    ADD CONSTRAINT "extra_service_dogs_id_fkey" FOREIGN KEY ("dogs_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."extra_service"
    ADD CONSTRAINT "extra_service_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."extra_services"
    ADD CONSTRAINT "extra_services_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_bookings"
    ADD CONSTRAINT "grooming_bookings_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_bookings"
    ADD CONSTRAINT "grooming_bookings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_journal"
    ADD CONSTRAINT "grooming_journal_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."grooming_bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grooming_journal"
    ADD CONSTRAINT "grooming_journal_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_journal"
    ADD CONSTRAINT "grooming_journal_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_logs"
    ADD CONSTRAINT "grooming_logs_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_logs"
    ADD CONSTRAINT "grooming_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grooming_services"
    ADD CONSTRAINT "grooming_services_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interest_applications"
    ADD CONSTRAINT "interest_applications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pension_stays"
    ADD CONSTRAINT "pension_stays_dog_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pension_stays"
    ADD CONSTRAINT "pension_stays_org_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pension_stays"
    ADD CONSTRAINT "pension_stays_room_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_lists"
    ADD CONSTRAINT "price_lists_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_lists"
    ADD CONSTRAINT "price_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."responsibilities"
    ADD CONSTRAINT "responsibilities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_org_id_fkey1" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."special_dates"
    ADD CONSTRAINT "special_dates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_notes"
    ADD CONSTRAINT "staff_notes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id");



ALTER TABLE ONLY "public"."subscription_types"
    ADD CONSTRAINT "subscription_types_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_org_roles"
    ADD CONSTRAINT "user_org_roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_org_roles"
    ADD CONSTRAINT "user_org_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view function logs" ON "public"."function_logs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Allow all for authenticated users" ON "public"."extra_services" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow anonymous insert for public applications" ON "public"."interest_applications" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow org members to manage dog journals" ON "public"."dog_journal" TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Allow org members to view dog journals" ON "public"."dog_journal" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Allow read attendance_logs for active or locked orgs" ON "public"."attendance_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
     JOIN "public"."dogs" "d" ON (("d"."id" = "attendance_logs"."dogs_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "d"."org_id") AND ("o"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'locked'::"text"]))))));



CREATE POLICY "Allow read extra_service for active or locked orgs" ON "public"."extra_service" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "extra_service"."org_id") AND ("o"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'locked'::"text"]))))));



CREATE POLICY "Allow read price lists for active or locked orgs" ON "public"."price_lists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "price_lists"."org_id") AND ("o"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'locked'::"text"]))))));



CREATE POLICY "Allow read responsibilities for active or locked orgs" ON "public"."responsibilities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'locked'::"text"]))))));



CREATE POLICY "Allow read staff_notes for active or locked orgs" ON "public"."staff_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'locked'::"text"]))))));



CREATE POLICY "Authenticated users can view trigger logs from their org" ON "public"."trigger_execution_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Block changes to attendance_logs for locked orgs" ON "public"."attendance_logs" USING ((EXISTS ( SELECT 1
   FROM (("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
     JOIN "public"."dogs" "d" ON (("d"."id" = "attendance_logs"."dogs_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "d"."org_id") AND ("o"."status" <> 'locked'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
     JOIN "public"."dogs" "d" ON (("d"."id" = "attendance_logs"."dogs_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "d"."org_id") AND ("o"."status" <> 'locked'::"text")))));



CREATE POLICY "Block changes to extra_service for locked orgs" ON "public"."extra_service" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "extra_service"."org_id") AND ("o"."status" <> 'locked'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "extra_service"."org_id") AND ("o"."status" <> 'locked'::"text")))));



CREATE POLICY "Block changes to price lists for locked orgs" ON "public"."price_lists" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "price_lists"."org_id") AND ("o"."status" <> 'locked'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."id" = "price_lists"."org_id") AND ("o"."status" <> 'locked'::"text")))));



CREATE POLICY "Block changes to responsibilities for locked orgs" ON "public"."responsibilities" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" <> 'locked'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" <> 'locked'::"text")))));



CREATE POLICY "Block changes to staff_notes for locked orgs" ON "public"."staff_notes" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" <> 'locked'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."orgs" "o" ON (("o"."id" = "p"."org_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("o"."status" <> 'locked'::"text")))));



CREATE POLICY "Customers can view own booking events" ON "public"."booking_events" FOR SELECT USING (("booking_id" IN ( SELECT "b"."id"
   FROM ("public"."bookings" "b"
     JOIN "public"."dogs" "d" ON (("b"."dog_id" = "d"."id")))
  WHERE ("d"."owner_id" IN ( SELECT "owners"."id"
           FROM "public"."owners"
          WHERE ("owners"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Enable all for authenticated users on boarding_seasons" ON "public"."boarding_seasons" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for authenticated users on special_dates" ON "public"."special_dates" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Only system can create events" ON "public"."booking_events" FOR INSERT WITH CHECK (false);



CREATE POLICY "Org members can modify org extra_service" ON "public"."extra_service" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "extra_service"."org_id"))));



CREATE POLICY "Org members can modify org grooming logs" ON "public"."grooming_logs" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "grooming_logs"."org_id"))));



CREATE POLICY "Org members can modify org price_lists" ON "public"."price_lists" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "price_lists"."org_id"))));



CREATE POLICY "Org members can modify org responsibilities" ON "public"."responsibilities" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "responsibilities"."org_id"))));



CREATE POLICY "Org members can modify org staff_notes" ON "public"."staff_notes" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "staff_notes"."org_id"))));



CREATE POLICY "Org members can read org extra_service" ON "public"."extra_service" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "extra_service"."org_id"))));



CREATE POLICY "Org members can read org grooming logs" ON "public"."grooming_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "grooming_logs"."org_id"))));



CREATE POLICY "Org members can read org price_lists" ON "public"."price_lists" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "price_lists"."org_id"))));



CREATE POLICY "Org members can read org responsibilities" ON "public"."responsibilities" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "responsibilities"."org_id"))));



CREATE POLICY "Org members can read org staff_notes" ON "public"."staff_notes" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."org_id" = "staff_notes"."org_id"))));



CREATE POLICY "Owners can delete their own dogs" ON "public"."dogs" FOR DELETE TO "authenticated" USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."email" IN ( SELECT "profiles"."email"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));



CREATE POLICY "Owners can delete their own pending bookings" ON "public"."bookings" FOR DELETE TO "authenticated" USING ((("status" = ANY (ARRAY['pending'::"text", 'cancelled'::"text"])) AND ("dog_id" IN ( SELECT "d"."id"
   FROM (("public"."dogs" "d"
     JOIN "public"."owners" "o" ON (("d"."owner_id" = "o"."id")))
     JOIN "public"."profiles" "p" ON (("o"."email" = "p"."email")))
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "Owners can delete themselves" ON "public"."owners" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."email" = "owners"."email"))));



CREATE POLICY "Service role can manage trigger logs" ON "public"."trigger_execution_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Staff can view booking events" ON "public"."booking_events" FOR SELECT USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can delete pricing for their org" ON "public"."pricing" FOR DELETE USING (("org_id" IN ( SELECT "orgs"."id"
   FROM "public"."orgs"
  WHERE ("orgs"."id" = (("auth"."jwt"() ->> 'org_id'::"text"))::"uuid"))));



CREATE POLICY "Users can delete their org's interest applications" ON "public"."interest_applications" FOR DELETE USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert external customers in their org" ON "public"."external_customers" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert interest applications for their org" ON "public"."interest_applications" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert pricing for their org" ON "public"."pricing" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "orgs"."id"
   FROM "public"."orgs"
  WHERE ("orgs"."id" = (("auth"."jwt"() ->> 'org_id'::"text"))::"uuid"))));



CREATE POLICY "Users can update external customers in their org" ON "public"."external_customers" FOR UPDATE USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can update pricing for their org" ON "public"."pricing" FOR UPDATE USING (("org_id" IN ( SELECT "orgs"."id"
   FROM "public"."orgs"
  WHERE ("orgs"."id" = (("auth"."jwt"() ->> 'org_id'::"text"))::"uuid"))));



CREATE POLICY "Users can update their org's interest applications" ON "public"."interest_applications" FOR UPDATE USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view external customers in their org" ON "public"."external_customers" FOR SELECT USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view pricing for their org" ON "public"."pricing" FOR SELECT USING (("org_id" IN ( SELECT "orgs"."id"
   FROM "public"."orgs"
  WHERE ("orgs"."id" = (("auth"."jwt"() ->> 'org_id'::"text"))::"uuid"))));



CREATE POLICY "Users can view subscription for their organization" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."org_id" = "subscriptions"."org_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their org's interest applications" ON "public"."interest_applications" FOR SELECT USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can withdraw their own consent" ON "public"."consent_logs" FOR UPDATE TO "authenticated" USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."email" IN ( SELECT "profiles"."email"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())))))) WITH CHECK (("withdrawn_at" IS NOT NULL));



CREATE POLICY "admin_full_access_invoice_items" ON "public"."invoice_items" USING ((("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE ("invoices"."org_id" = ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"))) WITH CHECK ((("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE ("invoices"."org_id" = ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "allow_select_extra_service" ON "public"."extra_service" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_full_access_daycare_pricing" ON "public"."daycare_pricing" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_grooming_services" ON "public"."grooming_services" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_rooms" ON "public"."rooms" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."org_id" = "rooms"."org_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."org_id" = "rooms"."org_id")))));



ALTER TABLE "public"."boarding_seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_public_insert" ON "public"."bookings" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "bookings_select_by_org_or_owner" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"())))));



CREATE POLICY "bookings_update_by_org_or_owner" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"()))) AND ("status" = 'pending'::"text")))) WITH CHECK ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"()))) AND ("status" = 'pending'::"text"))));



CREATE POLICY "consent_org_select" ON "public"."consent_logs" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "consent_public_insert" ON "public"."consent_logs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."daycare_pricing" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_org" ON "public"."extra_service" FOR DELETE TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "delete_own_org" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "delete_subscriptions_admin_only" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("p"."org_id" = "subscriptions"."org_id")))));



ALTER TABLE "public"."dog_journal" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dog_journal insert" ON "public"."dog_journal" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "dog_journal select" ON "public"."dog_journal" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."org_id" = "dog_journal"."org_id")))));



CREATE POLICY "dog_journal_all" ON "public"."dog_journal" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_journal"."dog_id") AND ("d"."org_id" = "public"."current_org_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_journal"."dog_id") AND ("d"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "dog_journal_delete" ON "public"."dog_journal" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."org_id" = "dog_journal"."org_id") AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "dog_journal_insert" ON "public"."dog_journal" FOR INSERT WITH CHECK (true);



CREATE POLICY "dog_journal_select" ON "public"."dog_journal" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."org_id" = "dog_journal"."org_id")))));



CREATE POLICY "dog_journal_update" ON "public"."dog_journal" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."org_id" = "dog_journal"."org_id")))));



CREATE POLICY "dogs_public_insert" ON "public"."dogs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "dogs_select_by_org_or_owner" ON "public"."dogs" FOR SELECT TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"())))));



CREATE POLICY "dogs_update_by_org_or_owner" ON "public"."dogs" FOR UPDATE TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"()))))) WITH CHECK ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."id" = "auth"."uid"())))));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extra_service" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "extra_service_all" ON "public"."extra_service" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "extra_service"."dogs_id") AND ("d"."org_id" = "public"."current_org_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "extra_service"."dogs_id") AND ("d"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "extra_service_delete" ON "public"."extra_service" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "extra_service_insert" ON "public"."extra_service" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "extra_service_select" ON "public"."extra_service" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "extra_service_update" ON "public"."extra_service" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."extra_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."function_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grooming_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grooming_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_dog_journal_in_org" ON "public"."dog_journal" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "insert_invoices_in_org" ON "public"."invoices" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "insert_own_org" ON "public"."extra_service" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NULL) OR ("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "insert_own_org" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NULL) OR ("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "insert_subscriptions_admin_only" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("p"."org_id" = "subscriptions"."org_id")))));



ALTER TABLE "public"."interest_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interest_org_select" ON "public"."interest_applications" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orgs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgs_members_all" ON "public"."orgs" TO "authenticated" USING (("id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "orgs_public_select" ON "public"."orgs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "owners_public_insert" ON "public"."owners" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "owners_select_by_org_or_self" ON "public"."owners" FOR SELECT TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("id" = "auth"."uid"())));



CREATE POLICY "owners_update_by_org_or_self" ON "public"."owners" FOR UPDATE TO "authenticated" USING ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("id" = "auth"."uid"()))) WITH CHECK ((("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR ("id" = "auth"."uid"())));



ALTER TABLE "public"."pension_stays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_read_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "read_subscriptions_admin_only" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("p"."org_id" = "subscriptions"."org_id")))));



ALTER TABLE "public"."responsibilities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_dog_journal_in_org" ON "public"."dog_journal" FOR SELECT TO "authenticated" USING ((("org_id" = "auth"."uid"()) OR ("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "select_invoices_in_org" ON "public"."invoices" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "select_own_org" ON "public"."extra_service" FOR SELECT TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "select_own_org" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "select_own_org_invoice_items" ON "public"."invoice_items" FOR SELECT USING (("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE ("invoices"."org_id" = ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."special_dates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_edit_draft_invoice_items" ON "public"."invoice_items" USING ((("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE (("invoices"."org_id" = ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))) AND ("invoices"."status" = 'draft'::"text")))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'staff'::"text"))) WITH CHECK ((("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE (("invoices"."org_id" = ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))) AND ("invoices"."status" = 'draft'::"text")))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'staff'::"text")));



ALTER TABLE "public"."staff_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trigger_execution_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_invoices_in_org" ON "public"."invoices" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "update_own_org" ON "public"."extra_service" FOR UPDATE TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "update_own_org" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("org_id" = ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "update_subscriptions_admin_only" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("p"."org_id" = "subscriptions"."org_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("p"."org_id" = "subscriptions"."org_id")))));



ALTER TABLE "public"."user_org_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."attendance_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."boarding_prices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."boarding_seasons";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."booking_services";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dog_journal";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dogs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."error_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."extra_service";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."function_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grooming_bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grooming_journal";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grooming_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."interest_applications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoice_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."org_subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orgs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."owners";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pension_stays";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."price_lists";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."responsibilities";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rooms";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."services";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."staff_notes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."subscriptions";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."activate_paid_subscription"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_paid_subscription"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_paid_subscription"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_default_special_dates_for_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_default_special_dates_for_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_default_special_dates_for_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_staff_member"("staff_email" "text", "staff_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_staff_member"("staff_email" "text", "staff_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_staff_member"("staff_email" "text", "staff_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_owner"("p_owner_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_checkout_dogs"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_checkout_dogs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_checkout_dogs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_create_grooming_journal"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_grooming_journal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_grooming_journal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_customer_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_match_owner_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_match_owner_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_match_owner_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calc_total_amount"() TO "anon";
GRANT ALL ON FUNCTION "public"."calc_total_amount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calc_total_amount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_cancellation_fee"("p_booking_id" "uuid", "p_cancellation_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_data_retention_date"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_trigger_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_trigger_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_trigger_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dog_journal_on_new_dog"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_dog_journal_on_new_dog"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dog_journal_on_new_dog"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_on_checkout"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_on_checkout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_on_checkout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_org_and_admin"("org_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_org_and_admin"("org_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_org_and_admin"("org_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_prepayment_invoice"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_prepayment_invoice"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_prepayment_invoice"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_org_if_no_admins"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_org_if_no_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_org_if_no_admins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_org_has_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_org_has_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_org_has_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gdpr_delete_user_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_valid_consent"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_valid_consent"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_valid_consent"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."heal_all_users_missing_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."heal_all_users_missing_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."heal_all_users_missing_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."heal_user_missing_org"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."heal_user_missing_org"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."heal_user_missing_org"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."json_text"("j" "jsonb", "key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."json_text"("j" "jsonb", "key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."json_text"("j" "jsonb", "key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_expired_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."lock_expired_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_expired_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_booking_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_booking_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_booking_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_trigger_execution"("p_trigger_name" "text", "p_table_name" "text", "p_operation" "text", "p_row_id" "uuid", "p_old_data" "jsonb", "p_new_data" "jsonb", "p_success" boolean, "p_error_message" "text", "p_execution_time_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_trigger_execution"("p_trigger_name" "text", "p_table_name" "text", "p_operation" "text", "p_row_id" "uuid", "p_old_data" "jsonb", "p_new_data" "jsonb", "p_success" boolean, "p_error_message" "text", "p_execution_time_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_trigger_execution"("p_trigger_name" "text", "p_table_name" "text", "p_operation" "text", "p_row_id" "uuid", "p_old_data" "jsonb", "p_new_data" "jsonb", "p_success" boolean, "p_error_message" "text", "p_execution_time_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_owners_to_dogs"() TO "anon";
GRANT ALL ON FUNCTION "public"."match_owners_to_dogs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_owners_to_dogs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_on_lock"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_on_lock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_on_lock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_staff_member"("staff_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_staff_member"("staff_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_staff_member"("staff_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_invoice_email"("p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_invoice_email"("p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_invoice_email"("p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_trial_warning_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_trial_warning_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_trial_warning_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_booking_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_booking_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_booking_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_number_per_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_number_per_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_number_per_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_dog_journal_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_dog_journal_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_dog_journal_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_dog_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_dog_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_dog_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_extra_service_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_extra_service_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_extra_service_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_dogs"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_dogs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_dogs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_grooming"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_grooming"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_grooming"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_invoices"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_invoices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_invoices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_owners"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_owners"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_owners"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_pension_stays"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_pension_stays"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_pension_stays"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_rooms"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_rooms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_rooms"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_for_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_for_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_for_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_id_from_dog"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_id_from_dog"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_id_from_dog"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_pension_stay_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_pension_stay_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_pension_stay_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_special_date_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_special_date_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_special_date_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_trial_end_for_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_trial_end_for_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_trial_end_for_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_bookings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_bookings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_bookings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_invoice_generation"("p_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_invoice_generation"("p_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_invoice_generation"("p_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_external_customer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_external_customer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_external_customer_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_external_customers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_external_customers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_external_customers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_owner_consent_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_owner_consent_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_owner_consent_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_waitlist_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_waitlist_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_waitlist_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."withdraw_consent"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."withdraw_consent"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."withdraw_consent"("p_owner_id" "uuid") TO "service_role";
























GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."boarding_prices" TO "anon";
GRANT ALL ON TABLE "public"."boarding_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."boarding_prices" TO "service_role";



GRANT ALL ON TABLE "public"."boarding_seasons" TO "anon";
GRANT ALL ON TABLE "public"."boarding_seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."boarding_seasons" TO "service_role";



GRANT ALL ON TABLE "public"."booking_events" TO "anon";
GRANT ALL ON TABLE "public"."booking_events" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_events" TO "service_role";



GRANT ALL ON TABLE "public"."booking_services" TO "anon";
GRANT ALL ON TABLE "public"."booking_services" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_services" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."consent_logs" TO "anon";
GRANT ALL ON TABLE "public"."consent_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_logs" TO "service_role";



GRANT ALL ON TABLE "public"."daycare_pricing" TO "anon";
GRANT ALL ON TABLE "public"."daycare_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."daycare_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."daycare_service_completions" TO "anon";
GRANT ALL ON TABLE "public"."daycare_service_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."daycare_service_completions" TO "service_role";



GRANT ALL ON TABLE "public"."dog_journal" TO "anon";
GRANT ALL ON TABLE "public"."dog_journal" TO "authenticated";
GRANT ALL ON TABLE "public"."dog_journal" TO "service_role";



GRANT ALL ON TABLE "public"."dogs" TO "anon";
GRANT ALL ON TABLE "public"."dogs" TO "authenticated";
GRANT ALL ON TABLE "public"."dogs" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."external_customers" TO "anon";
GRANT ALL ON TABLE "public"."external_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."external_customers" TO "service_role";



GRANT ALL ON TABLE "public"."extra_service" TO "anon";
GRANT ALL ON TABLE "public"."extra_service" TO "authenticated";
GRANT ALL ON TABLE "public"."extra_service" TO "service_role";



GRANT ALL ON TABLE "public"."extra_services" TO "anon";
GRANT ALL ON TABLE "public"."extra_services" TO "authenticated";
GRANT ALL ON TABLE "public"."extra_services" TO "service_role";



GRANT ALL ON TABLE "public"."function_logs" TO "service_role";



GRANT ALL ON TABLE "public"."gdpr_deletion_log" TO "anon";
GRANT ALL ON TABLE "public"."gdpr_deletion_log" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_deletion_log" TO "service_role";



GRANT ALL ON TABLE "public"."grooming_bookings" TO "anon";
GRANT ALL ON TABLE "public"."grooming_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."grooming_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."grooming_journal" TO "anon";
GRANT ALL ON TABLE "public"."grooming_journal" TO "authenticated";
GRANT ALL ON TABLE "public"."grooming_journal" TO "service_role";



GRANT ALL ON TABLE "public"."grooming_logs" TO "anon";
GRANT ALL ON TABLE "public"."grooming_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."grooming_logs" TO "service_role";



GRANT ALL ON TABLE "public"."grooming_services" TO "anon";
GRANT ALL ON TABLE "public"."grooming_services" TO "authenticated";
GRANT ALL ON TABLE "public"."grooming_services" TO "service_role";



GRANT ALL ON TABLE "public"."grooming_with_invoice" TO "anon";
GRANT ALL ON TABLE "public"."grooming_with_invoice" TO "authenticated";
GRANT ALL ON TABLE "public"."grooming_with_invoice" TO "service_role";



GRANT ALL ON TABLE "public"."interest_applications" TO "anon";
GRANT ALL ON TABLE "public"."interest_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."interest_applications" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_runs" TO "anon";
GRANT ALL ON TABLE "public"."invoice_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_runs" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_runs_summary" TO "anon";
GRANT ALL ON TABLE "public"."invoice_runs_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_runs_summary" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."latest_function_logs" TO "anon";
GRANT ALL ON TABLE "public"."latest_function_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_function_logs" TO "service_role";



GRANT ALL ON TABLE "public"."migrations" TO "anon";
GRANT ALL ON TABLE "public"."migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."migrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."migrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."migrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."migrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orgs" TO "anon";
GRANT ALL ON TABLE "public"."orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."orgs" TO "service_role";



GRANT ALL ON TABLE "public"."org_status_view" TO "anon";
GRANT ALL ON TABLE "public"."org_status_view" TO "authenticated";
GRANT ALL ON TABLE "public"."org_status_view" TO "service_role";



GRANT ALL ON TABLE "public"."org_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."organization_subscription_overview" TO "anon";
GRANT ALL ON TABLE "public"."organization_subscription_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_subscription_overview" TO "service_role";



GRANT ALL ON SEQUENCE "public"."owners_customer_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."owners_customer_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."owners_customer_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."pension_stays" TO "anon";
GRANT ALL ON TABLE "public"."pension_stays" TO "authenticated";
GRANT ALL ON TABLE "public"."pension_stays" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."pension_calendar_full_view" TO "anon";
GRANT ALL ON TABLE "public"."pension_calendar_full_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pension_calendar_full_view" TO "service_role";



GRANT ALL ON TABLE "public"."pension_calendar_view" TO "anon";
GRANT ALL ON TABLE "public"."pension_calendar_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pension_calendar_view" TO "service_role";



GRANT ALL ON TABLE "public"."pension_owner_summary_view" TO "anon";
GRANT ALL ON TABLE "public"."pension_owner_summary_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pension_owner_summary_view" TO "service_role";



GRANT ALL ON TABLE "public"."pension_room_occupancy_view" TO "anon";
GRANT ALL ON TABLE "public"."pension_room_occupancy_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pension_room_occupancy_view" TO "service_role";



GRANT ALL ON TABLE "public"."price_lists" TO "anon";
GRANT ALL ON TABLE "public"."price_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."price_lists" TO "service_role";



GRANT ALL ON TABLE "public"."pricing" TO "anon";
GRANT ALL ON TABLE "public"."pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing" TO "service_role";



GRANT ALL ON TABLE "public"."trigger_execution_log" TO "anon";
GRANT ALL ON TABLE "public"."trigger_execution_log" TO "authenticated";
GRANT ALL ON TABLE "public"."trigger_execution_log" TO "service_role";



GRANT ALL ON TABLE "public"."recent_trigger_failures" TO "anon";
GRANT ALL ON TABLE "public"."recent_trigger_failures" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_trigger_failures" TO "service_role";



GRANT ALL ON TABLE "public"."responsibilities" TO "anon";
GRANT ALL ON TABLE "public"."responsibilities" TO "authenticated";
GRANT ALL ON TABLE "public"."responsibilities" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."special_dates" TO "anon";
GRANT ALL ON TABLE "public"."special_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."special_dates" TO "service_role";



GRANT ALL ON TABLE "public"."staff_notes" TO "anon";
GRANT ALL ON TABLE "public"."staff_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."staff_notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."staff_notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."staff_notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_types" TO "anon";
GRANT ALL ON TABLE "public"."subscription_types" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_types" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."trigger_health_summary" TO "anon";
GRANT ALL ON TABLE "public"."trigger_health_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."trigger_health_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_org_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_org_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_org_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users_without_org" TO "anon";
GRANT ALL ON TABLE "public"."users_without_org" TO "authenticated";
GRANT ALL ON TABLE "public"."users_without_org" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































