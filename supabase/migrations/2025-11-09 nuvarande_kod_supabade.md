| trigger_name                             | table_name      | function_name        | function_definition                                      | trigger_definition |
| ---------------------------------------- | --------------- | -------------------- | -------------------------------------------------------- | ------------------ |
| on_insert_set_org_id_for_boarding_prices | boarding_prices | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms() |

RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_boarding_prices BEFORE INSERT ON public.boarding_prices FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| on_insert_set_org_id_for_boarding_seasons | boarding_seasons | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons BEFORE INSERT ON public.boarding_seasons FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| on_insert_set_org_id_for_bookings | bookings | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| trg_create_invoice_on_checkout | bookings | create_invoice_on_checkout | CREATE OR REPLACE FUNCTION public.create_invoice_on_checkout()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
v_invoice_id UUID;
v_owner_id UUID;
v_afterpayment_amount NUMERIC := 0;
v_service RECORD;
BEGIN
-- Skapa faktura endast när status ändras till 'checked_out'
IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN

    -- Hämta owner_id
    SELECT owner_id INTO v_owner_id
    FROM dogs
    WHERE id = NEW.dog_id;

    -- Beräkna efterskottsbelopp (endast afterpayment-tjänster)
    IF NEW.extra_service_ids IS NOT NULL THEN
      SELECT COALESCE(SUM(price), 0) INTO v_afterpayment_amount
      FROM extra_service
      WHERE id = ANY(NEW.extra_service_ids)
        AND payment_type = 'afterpayment';
    END IF;

    -- Skapa endast efterskottsfaktura om det finns tjänster att fakturera
    IF v_afterpayment_amount > 0 THEN
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
        CURRENT_DATE, -- Betalas direkt vid utcheckning
        v_afterpayment_amount,
        'draft',
        'afterpayment',
        (SELECT full_name FROM owners WHERE id = v_owner_id),
        (SELECT email FROM owners WHERE id = v_owner_id)
      )
      RETURNING id INTO v_invoice_id;

      -- Lägg till fakturarad för varje efterskottstjänst
      FOR v_service IN
        SELECT id, price FROM extra_service
        WHERE id = ANY(NEW.extra_service_ids)
          AND payment_type = 'afterpayment'
      LOOP
        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_amount
        )
        VALUES (
          v_invoice_id,
          format('Tilläggstjänst (ID: %s)', v_service.id),
          1,
          v_service.price,
          v_service.price
        );
      END LOOP;

      -- Uppdatera bokningen med efterskottsfaktura-ID
      UPDATE bookings
      SET afterpayment_invoice_id = v_invoice_id
      WHERE id = NEW.id;

      RAISE NOTICE '✅ Efterskottsfaktura skapad: % för bokning %', v_invoice_id, NEW.id;
    END IF;

END IF;

RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_create_invoice_on_checkout AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'checked_out'::text) AND (old.status <> 'checked_out'::text))) EXECUTE FUNCTION create_invoice_on_checkout() |
| trg_create_prepayment_invoice | bookings | create_prepayment_invoice | CREATE OR REPLACE FUNCTION public.create_prepayment_invoice()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$
| CREATE TRIGGER trg_create_prepayment_invoice BEFORE UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'confirmed'::text) AND (old.status = 'pending'::text))) EXECUTE FUNCTION create_prepayment_invoice() |
| trg_set_org_id_on_bookings | bookings | set_org_id_from_dog | CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;
end if;
return new;
end$function$
| CREATE TRIGGER trg_set_org_id_on_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog() |
| trg_touch_bookings | bookings | touch_bookings_updated_at | CREATE OR REPLACE FUNCTION public.touch_bookings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.updated_at := now();
return new;
end$function$
| CREATE TRIGGER trg_touch_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION touch_bookings_updated_at() |
| update_bookings_updated_at | bookings | update_updated_at_column | CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$function$
| CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column() |
| enforce_bucket_name_length_trigger | buckets | enforce_bucket_name_length | CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if length(new.name) > 100 then
raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
end if;
return new;
end;
$function$
| CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length() |
| trg_set_org_id_for_dog_journal | dog_journal | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_for_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_set_org_user_dog_journal | dog_journal | set_org_id_for_dogs | CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_user_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs() |
| on_insert_set_org_id_for_dogs | dogs | set_org_id_for_dogs | CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs() |
| on_insert_set_user_id | dogs | set_user_id | CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
new.user_id := auth.uid();
return new;
end;
$function$
| CREATE TRIGGER on_insert_set_user_id BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_user_id() |
| set_last_updated | dogs | update_last_updated | CREATE OR REPLACE FUNCTION public.update_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.last_updated = now();
return new;
end;
$function$
| CREATE TRIGGER set_last_updated BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated() |
| set_org_for_dogs | dogs | set_org_id | CREATE OR REPLACE FUNCTION public.set_org_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
select org_id into new.org_id from profiles where id = auth.uid();
end if;
return new;
end;
$function$
| CREATE TRIGGER set_org_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id() |
| set_org_id_trigger | dogs | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_auto_match_owner | dogs | auto_match_owner_trigger | CREATE OR REPLACE FUNCTION public.auto_match_owner_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
perform public.match_owners_to_dogs();
return new;
end;
$function$
| CREATE TRIGGER trg_auto_match_owner AFTER INSERT ON public.dogs FOR EACH ROW WHEN ((new.owner_id IS NULL)) EXECUTE FUNCTION auto_match_owner_trigger() |
| trg_create_journal_on_new_dog | dogs | create_dog_journal_on_new_dog | CREATE OR REPLACE FUNCTION public.create_dog_journal_on_new_dog()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
INSERT INTO public.dog_journal (dog_id, text, org_id)
VALUES (
NEW.id,
'Ny hund registrerad i systemet.',
NEW.org_id
);
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog() |
| trg_set_org_id_dogs | dogs | set_org_id_for_dogs | CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs() |
| trg_set_org_id_on_dogs | dogs | set_org_id_for_dogs | CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_on_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs() |
| trg_set_org_user_dogs | dogs | set_org_and_user | CREATE OR REPLACE FUNCTION public.set_org_and_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
new.org_id := public.current_org_id();
end if;
if new.user_id is null then
new.user_id := auth.uid();
end if;
return new;
end;
$function$
| CREATE TRIGGER trg_set_org_user_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_and_user() |
| trg_update_dogs_updated_at | dogs | update_last_updated | CREATE OR REPLACE FUNCTION public.update_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.last_updated = now();
return new;
end;
$function$
| CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated() |
| set_org_id_trigger | extra_service | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_set_org_id_extra_service | extra_service | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_set_org_user_extra_service | extra_service | set_org_and_user | CREATE OR REPLACE FUNCTION public.set_org_and_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
new.org_id := public.current_org_id();
end if;
if new.user_id is null then
new.user_id := auth.uid();
end if;
return new;
end;
$function$
| CREATE TRIGGER trg_set_org_user_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_and_user() |
| trg_set_org_id_extra_services | extra_services | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_extra_services BEFORE INSERT ON public.extra_services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| on_insert_set_org_id_for_grooming | grooming_logs | set_org_id_for_grooming | CREATE OR REPLACE FUNCTION public.set_org_id_for_grooming()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
-- Hämtar organisationens ID från hunden automatiskt
if new.org_id is null then
select org_id into new.org_id
from dogs
where id = new.dog_id;
end if;
return new;
end;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_grooming BEFORE INSERT ON public.grooming_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_grooming() |
| cron_job_cache_invalidate | job | job_cache_invalidate | CREATE OR REPLACE FUNCTION cron.job_cache_invalidate()
RETURNS trigger
LANGUAGE c
AS '$libdir/pg_cron', $function$cron_job_cache_invalidate$function$
| CREATE TRIGGER cron_job_cache_invalidate AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION cron.job_cache_invalidate() |
| objects_delete_delete_prefix | objects | delete_prefix_hierarchy_trigger | CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
prefix text;
BEGIN
prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;

END;
$function$
| CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger() |
| objects_insert_create_prefix | objects | objects_insert_prefix_trigger | CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;

END;
$function$
| CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger() |
| objects_update_create_prefix | objects | objects_update_prefix_trigger | CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
old_prefixes TEXT[];
BEGIN
-- Ensure this is an update operation and the name has changed
IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
-- Retrieve old prefixes
old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;

END;
$function$
| CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger() |
| update_objects_updated_at | objects | update_updated_at_column | CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
| CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column() |
| on_insert_set_trial_end_for_org | orgs | set_trial_end_for_org | CREATE OR REPLACE FUNCTION public.set_trial_end_for_org()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
-- Sätt gratisperiod till 3 månader från registrering
NEW.trial_ends_at := (now() + interval '3 months');
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_trial_end_for_org BEFORE INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION set_trial_end_for_org() |
| on_org_locked_email | orgs | notify_admin_on_lock | CREATE OR REPLACE FUNCTION public.notify_admin_on_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$
| CREATE TRIGGER on_org_locked_email AFTER UPDATE ON public.orgs FOR EACH ROW WHEN (((new.status = 'locked'::text) AND (old.status IS DISTINCT FROM 'locked'::text))) EXECUTE FUNCTION notify_admin_on_lock() |
| on_insert_set_org_id_for_owners | owners | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| owners_set_org_id | owners | set_owner_org_id | CREATE OR REPLACE FUNCTION public.set_owner_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
if new.org_id is null then
new.org_id := (select org_id from profiles where id = auth.uid());
end if;
return new;
end;
$function$
| CREATE TRIGGER owners_set_org_id BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_owner_org_id() |
| set_org_id_trigger | owners | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_set_org_id_owners | owners | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| trg_set_org_user_owners | owners | set_org_and_user | CREATE OR REPLACE FUNCTION public.set_org_and_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
new.org_id := public.current_org_id();
end if;
if new.user_id is null then
new.user_id := auth.uid();
end if;
return new;
end;
$function$
| CREATE TRIGGER trg_set_org_user_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_and_user() |
| on_insert_set_org_id_for_pension_stays | pension_stays | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| set_timestamp_pension_stays | pension_stays | update_last_updated | CREATE OR REPLACE FUNCTION public.update_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.last_updated = now();
return new;
end;
$function$
| CREATE TRIGGER set_timestamp_pension_stays BEFORE UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION update_last_updated() |
| trg_calc_total_amount | pension_stays | calc_total_amount | CREATE OR REPLACE FUNCTION public.calc_total_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$
| CREATE TRIGGER trg_calc_total_amount BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION calc_total_amount() |
| trg_set_org_id_for_pension_stays | pension_stays | set_org_id_for_pension_stays | CREATE OR REPLACE FUNCTION public.set_org_id_for_pension_stays()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
select org_id into new.org_id from dogs where id = new.dog_id;
end if;
return new;
end;
$function$
| CREATE TRIGGER trg_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_pension_stays() |
| trg_set_org_id_on_pension_stays | pension_stays | set_org_id_from_dog | CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.org_id is null then
select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;
end if;
return new;
end$function$
| CREATE TRIGGER trg_set_org_id_on_pension_stays BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog() |
| prefixes_create_hierarchy | prefixes | prefixes_insert_trigger | CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
RETURN NEW;
END;
$function$
| CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger() |
| prefixes_delete_hierarchy | prefixes | delete_prefix_hierarchy_trigger | CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
prefix text;
BEGIN
prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;

END;
$function$
| CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger() |
| on_profile_insert | profiles | set_default_role | CREATE OR REPLACE FUNCTION public.set_default_role()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.role is null then
new.role := 'staff';
end if;
return new;
end;
$function$
| CREATE TRIGGER on_profile_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_default_role() |
| trg_delete_org_if_no_admins | profiles | delete_org_if_no_admins | CREATE OR REPLACE FUNCTION public.delete_org_if_no_admins()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
declare
v_org_id uuid;
v_admin_count int;
begin
v_org_id := old.org_id;

-- Räkna kvarvarande admins i organisationen
select count(\*) into v_admin_count
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
$function$
| CREATE TRIGGER trg_delete_org_if_no_admins AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_org_if_no_admins() |
| trg_ensure_org_has_admin | profiles | ensure_org_has_admin | CREATE OR REPLACE FUNCTION public.ensure_org_has_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
declare
v_org_id uuid;
v_admin_count int;
v_new_admin uuid;
begin
-- Identifiera organisationen baserat på den gamla raden
v_org_id := old.org_id;

-- Räkna antalet kvarvarande admins
select count(\*) into v_admin_count
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
$function$
| CREATE TRIGGER trg_ensure_org_has_admin AFTER DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_org_has_admin() |
| on_insert_set_org_id_for_rooms | rooms | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| trg_set_org_id_rooms | rooms | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER trg_set_org_id_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| on_insert_set_org_id_for_services | services | set_org_id_for_rooms | CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms() |
| tr_check_filters | subscription | subscription_check_filters | CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
/_
Validates that the user defined filters for a subscription: - refer to valid columns that the claimed role may access - values are coercable to the correct column type
_/
declare
col_names text[] = coalesce(
array_agg(c.column_name order by c.ordinal_position),
'{}'::text[]
)
from
information_schema.columns c
where
format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
and pg_catalog.has_column_privilege(
(new.claims ->> 'role'),
format('%I.%I', c.table_schema, c.table_name)::regclass,
c.column_name,
'SELECT'
);
filter realtime.user_defined_filter;
col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $function$

| CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters() |
| on_insert_set_org_id_for_subscriptions | subscriptions | set_org_id_for_subscription | CREATE OR REPLACE FUNCTION public.set_org_id_for_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
-- Hämta organisationen kopplad till den användare som skapar abonnemanget
SELECT org_id INTO NEW.org_id
FROM public.profiles
WHERE id = auth.uid();

RETURN NEW;
END;
$function$
| CREATE TRIGGER on_insert_set_org_id_for_subscriptions BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_subscription() |
| set_org_id_trigger | subscriptions | set_org_id_for_owners | CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
IF NEW.org_id IS NULL THEN
SELECT org_id INTO NEW.org_id
FROM profiles
WHERE id = auth.uid();
END IF;
RETURN NEW;
END;
$function$
| CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners() |
| on_auth_user_created | users | handle_new_user | CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
v_org_id uuid;
v_org_name text;
v_full_name text;
v_org_number text;
v_phone text;
v_trial_ends timestamptz;
BEGIN
-- Logga att funktionen körs
RAISE NOTICE 'handle_new_user() körs för användare: %', NEW.id;

-- Hämta metadata från registreringen
v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
v_org_number := NEW.raw_user_meta_data->>'org_number';
v_phone := NEW.raw_user_meta_data->>'phone';

RAISE NOTICE 'Skapar organisation: %', v_org_name;

-- Skapa organisation
INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
VALUES (
v_org_name,
v_org_number,
NEW.email,
true,
25
)
RETURNING id INTO v_org_id;

RAISE NOTICE 'Organisation skapad med ID: %', v_org_id;

-- Skapa profil
INSERT INTO profiles (id, org_id, role, email, full_name, phone)
VALUES (
NEW.id,
v_org_id,
'admin',
NEW.email,
v_full_name,
v_phone
);

RAISE NOTICE 'Profil skapad för användare: %', NEW.id;

-- Skapa 3 månaders gratis prenumeration
v_trial_ends := NOW() + INTERVAL '3 months';

INSERT INTO subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at)
VALUES (
v_org_id,
'basic',
'trialing',
NOW(),
v_trial_ends
);

RAISE NOTICE '3 månaders gratisperiod skapad, slutar: %', v_trial_ends;
RAISE NOTICE '✅ Ny användare fullständigt uppsatt!';

RETURN NEW;
EXCEPTION
WHEN OTHERS THEN
RAISE WARNING 'Fel i handle_new_user(): %, %', SQLERRM, SQLSTATE;
RETURN NEW; -- Returnera ändå så användaren skapas
END;
$function$
| CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user() |
| trg_assign_org_to_new_user | users | assign_org_to_new_user | CREATE OR REPLACE FUNCTION public.assign_org_to_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
v_org_id uuid;
begin
-- Försök hitta en org baserat på e-postdomän (ex: @hunddagis.se)
select id into v_org_id
from public.orgs
where lower(name) = lower(split_part(new.email, '@', 1) || 's Hunddagis')
or lower(name) like '%' || split_part(new.email, '@', 2);

-- Om organisation hittas → koppla användaren till den
if v_org_id is not null then
insert into public.profiles (id, email, org_id, role)
values (new.id, new.email, v_org_id, 'staff');
else
-- Annars skapa ny organisation (första användare blir admin)
insert into public.orgs (name)
values (split_part(new.email, '@', 1) || 's Hunddagis')
returning id into v_org_id;

    insert into public.profiles (id, email, org_id, role)
    values (new.id, new.email, v_org_id, 'admin');

end if;

return new;
end;
$function$
| CREATE TRIGGER trg_assign_org_to_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION assign_org_to_new_user() |
