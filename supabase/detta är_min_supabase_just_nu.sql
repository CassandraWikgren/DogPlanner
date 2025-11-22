jag körde precis:
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  pg_get_functiondef(t.tgfoid) AS function_definition,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

och fick svaret som ligger i denna fil. uppdaterat precis nu 2025-11-22 klockan 13:28

[
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_seasons",
    "table_name": "boarding_seasons",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons BEFORE INSERT ON public.boarding_seasons FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "trg_create_invoice_on_checkout",
    "table_name": "bookings",
    "function_name": "create_invoice_on_checkout",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_invoice_on_checkout()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  v_invoice_id UUID;\n  v_owner_id UUID;\n  v_total_amount NUMERIC := 0;\n  v_base_amount NUMERIC := 0;\n  v_extra_service RECORD;\n  v_booking_service RECORD;\n  v_description TEXT;\n  v_nights INTEGER;\n  v_service_price NUMERIC;\nBEGIN\n  -- Skapa faktura endast när status ändras till 'checked_out'\n  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN\n    \n    -- Hämta owner_id från hunden\n    SELECT owner_id INTO v_owner_id \n    FROM dogs \n    WHERE id = NEW.dog_id;\n\n    IF v_owner_id IS NULL THEN\n      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;\n      RETURN NEW;\n    END IF;\n\n    -- Beräkna antal nätter\n    v_nights := (NEW.end_date - NEW.start_date);\n    IF v_nights <= 0 THEN\n      v_nights := 1;\n    END IF;\n\n    -- Använd bokningens totalpris som bas\n    v_base_amount := COALESCE(NEW.total_price, NEW.base_price, 0);\n    v_total_amount := v_base_amount;\n\n    -- Skapa faktura\n    INSERT INTO invoices (\n      org_id,\n      owner_id,\n      invoice_date,\n      due_date,\n      total_amount,\n      status,\n      invoice_type,\n      billed_name,\n      billed_email\n    )\n    VALUES (\n      NEW.org_id,\n      v_owner_id,\n      CURRENT_DATE,\n      CURRENT_DATE + INTERVAL '30 days',\n      0, -- Uppdateras nedan\n      'draft',\n      'afterpayment',\n      (SELECT full_name FROM owners WHERE id = v_owner_id),\n      (SELECT email FROM owners WHERE id = v_owner_id)\n    )\n    RETURNING id INTO v_invoice_id;\n\n    -- ============================================\n    -- RAD 1: Grundpris för bokningen (logi)\n    -- ============================================\n    IF v_base_amount > 0 THEN\n      INSERT INTO invoice_items (\n        invoice_id,\n        description,\n        quantity,\n        unit_price,\n        total_amount\n      )\n      VALUES (\n        v_invoice_id,\n        format('Hundpensionat %s - %s (%s nätter)', \n          NEW.start_date, \n          NEW.end_date, \n          v_nights\n        ),\n        v_nights,\n        v_base_amount / v_nights,\n        v_base_amount\n      );\n    END IF;\n\n    -- ============================================\n    -- RAD 2: Tillval från booking_services\n    -- ============================================\n    BEGIN\n      FOR v_booking_service IN\n        SELECT \n          bs.quantity,\n          bs.unit_price,\n          bs.total_price,\n          bs.staff_notes,\n          COALESCE(ps.label, 'Tilläggstjänst') as service_name\n        FROM booking_services bs\n        LEFT JOIN pensionat_services ps ON bs.service_id = ps.id\n        WHERE bs.booking_id = NEW.id\n      LOOP\n        v_description := v_booking_service.service_name;\n        \n        IF v_booking_service.staff_notes IS NOT NULL THEN\n          v_description := v_description || ' - ' || v_booking_service.staff_notes;\n        END IF;\n\n        INSERT INTO invoice_items (\n          invoice_id,\n          description,\n          quantity,\n          unit_price,\n          total_amount\n        )\n        VALUES (\n          v_invoice_id,\n          v_description,\n          v_booking_service.quantity,\n          v_booking_service.unit_price,\n          v_booking_service.total_price\n        );\n\n        v_total_amount := v_total_amount + v_booking_service.total_price;\n      END LOOP;\n    EXCEPTION \n      WHEN undefined_table THEN\n        RAISE NOTICE 'booking_services tabellen finns inte, hoppar över';\n    END;\n\n    -- ============================================\n    -- RAD 3: Återkommande tillägg från extra_service\n    -- (endast de som är aktiva under bokningsperioden)\n    -- ============================================\n    FOR v_extra_service IN\n      SELECT \n        service_type,\n        frequency,\n        price,\n        notes\n      FROM extra_service\n      WHERE dogs_id = NEW.dog_id\n        AND org_id = NEW.org_id\n        AND COALESCE(is_active, true) = true\n        AND start_date <= NEW.end_date\n        AND (end_date IS NULL OR end_date >= NEW.start_date)\n    LOOP\n      v_description := v_extra_service.service_type;\n      \n      IF v_extra_service.frequency IS NOT NULL THEN\n        v_description := v_description || ' (' || v_extra_service.frequency || ')';\n      END IF;\n\n      IF v_extra_service.notes IS NOT NULL THEN\n        v_description := v_description || ' - ' || v_extra_service.notes;\n      END IF;\n\n      -- Hämta pris från extra_service eller extra_services katalog\n      v_service_price := v_extra_service.price;\n      \n      IF v_service_price IS NULL THEN\n        BEGIN\n          SELECT price INTO v_service_price\n          FROM extra_services\n          WHERE label = v_extra_service.service_type\n            AND org_id = NEW.org_id\n            AND COALESCE(is_active, true) = true\n          LIMIT 1;\n        EXCEPTION \n          WHEN OTHERS THEN\n            v_service_price := 0;\n        END;\n      END IF;\n\n      v_service_price := COALESCE(v_service_price, 0);\n\n      IF v_service_price > 0 THEN\n        INSERT INTO invoice_items (\n          invoice_id,\n          description,\n          quantity,\n          unit_price,\n          total_amount\n        )\n        VALUES (\n          v_invoice_id,\n          v_description,\n          1,\n          v_service_price,\n          v_service_price\n        );\n\n        v_total_amount := v_total_amount + v_service_price;\n      END IF;\n    END LOOP;\n\n    -- ============================================\n    -- RAD 4: Rabatt\n    -- ============================================\n    IF NEW.discount_amount > 0 THEN\n      INSERT INTO invoice_items (\n        invoice_id,\n        description,\n        quantity,\n        unit_price,\n        total_amount\n      )\n      VALUES (\n        v_invoice_id,\n        'Rabatt',\n        1,\n        -NEW.discount_amount,\n        -NEW.discount_amount\n      );\n\n      v_total_amount := v_total_amount - NEW.discount_amount;\n    END IF;\n\n    -- Uppdatera fakturans totalsumma\n    UPDATE invoices\n    SET total_amount = GREATEST(v_total_amount, 0)\n    WHERE id = v_invoice_id;\n\n    -- Uppdatera bokningen med faktura-ID\n    UPDATE bookings \n    SET afterpayment_invoice_id = v_invoice_id\n    WHERE id = NEW.id;\n\n    RAISE NOTICE '✅ Faktura % skapad för bokning % (Total: % kr, inkl % från extra_service)', \n      v_invoice_id, NEW.id, v_total_amount, \n      (SELECT COUNT(*) FROM extra_service WHERE dogs_id = NEW.dog_id);\n\n  END IF;\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_invoice_on_checkout AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'checked_out'::text) AND (old.status <> 'checked_out'::text))) EXECUTE FUNCTION create_invoice_on_checkout()"
  },
  {
    "trigger_name": "trg_create_prepayment_invoice",
    "table_name": "bookings",
    "function_name": "create_prepayment_invoice",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_prepayment_invoice()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  v_invoice_id UUID;\n  v_owner_id UUID;\n  v_prepayment_amount NUMERIC := 0;\n  v_room_price NUMERIC := 0;\n  v_due_date DATE;\nBEGIN\n  -- Kör endast när status ändras till 'confirmed' från 'pending'\n  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN\n    \n    -- Hämta owner_id från hunden\n    SELECT owner_id INTO v_owner_id \n    FROM dogs \n    WHERE id = NEW.dog_id;\n\n    -- Beräkna förskottsbelopp (rumsbokning + prepayment-tjänster)\n    -- Använd total_price minus eventuella afterpayment-tjänster\n    v_prepayment_amount := COALESCE(NEW.total_price, 0);\n    \n    -- Om det finns extra_service_ids, dra bort efterskottstjänster\n    IF NEW.extra_service_ids IS NOT NULL THEN\n      SELECT COALESCE(SUM(price), 0) INTO v_room_price\n      FROM extra_service\n      WHERE id = ANY(NEW.extra_service_ids)\n        AND payment_type = 'afterpayment';\n      \n      v_prepayment_amount := v_prepayment_amount - v_room_price;\n    END IF;\n\n    -- Sätt förfallodatum till 14 dagar från nu (eller innan startdatum)\n    v_due_date := LEAST(\n      CURRENT_DATE + INTERVAL '14 days',\n      NEW.start_date - INTERVAL '3 days'\n    )::DATE;\n\n    -- Skapa förskottsfaktura\n    INSERT INTO invoices (\n      org_id,\n      owner_id,\n      invoice_date,\n      due_date,\n      total_amount,\n      status,\n      invoice_type,\n      billed_name,\n      billed_email\n    )\n    VALUES (\n      NEW.org_id,\n      v_owner_id,\n      CURRENT_DATE,\n      v_due_date,\n      v_prepayment_amount,\n      'draft',\n      'prepayment',\n      (SELECT full_name FROM owners WHERE id = v_owner_id),\n      (SELECT email FROM owners WHERE id = v_owner_id)\n    )\n    RETURNING id INTO v_invoice_id;\n\n    -- Lägg till fakturarad för rumsbokning\n    INSERT INTO invoice_items (\n      invoice_id,\n      description,\n      quantity,\n      unit_price,\n      total_amount\n    )\n    VALUES (\n      v_invoice_id,\n      format('Pensionatvistelse %s till %s', NEW.start_date, NEW.end_date),\n      1,\n      v_prepayment_amount,\n      v_prepayment_amount\n    );\n\n    -- Uppdatera bokningen med faktura-ID\n    NEW.prepayment_invoice_id := v_invoice_id;\n    \n    RAISE NOTICE '✅ Förskottsfaktura skapad: % för bokning %', v_invoice_id, NEW.id;\n  END IF;\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_prepayment_invoice BEFORE UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'confirmed'::text) AND (old.status = 'pending'::text))) EXECUTE FUNCTION create_prepayment_invoice()"
  },
  {
    "trigger_name": "trg_set_booking_org_id",
    "table_name": "bookings",
    "function_name": "set_booking_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_booking_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM dogs \n    WHERE id = NEW.dog_id;\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_booking_org_id BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_booking_org_id()"
  },
  {
    "trigger_name": "trigger_log_booking_changes",
    "table_name": "bookings",
    "function_name": "log_booking_status_change",
    "function_definition": "CREATE OR REPLACE FUNCTION public.log_booking_status_change()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Log när status ändras\n  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN\n    INSERT INTO booking_events (\n      org_id,\n      booking_id,\n      event_type,\n      notes,\n      metadata\n    ) VALUES (\n      NEW.org_id,\n      NEW.id,\n      CASE NEW.status\n        WHEN 'confirmed' THEN 'approved'\n        WHEN 'cancelled' THEN 'cancelled'\n        WHEN 'checked_in' THEN 'checked_in'\n        WHEN 'checked_out' THEN 'checked_out'\n        ELSE 'modified'\n      END,\n      'Status ändrad från ' || COALESCE(OLD.status, 'NULL') || ' till ' || NEW.status,\n      jsonb_build_object(\n        'old_status', OLD.status,\n        'new_status', NEW.status,\n        'old_total_price', OLD.total_price,\n        'new_total_price', NEW.total_price\n      )\n    );\n  END IF;\n\n  -- Log när bokning skapas\n  IF (TG_OP = 'INSERT') THEN\n    INSERT INTO booking_events (\n      org_id,\n      booking_id,\n      event_type,\n      notes,\n      metadata\n    ) VALUES (\n      NEW.org_id,\n      NEW.id,\n      'created',\n      'Bokning skapad',\n      jsonb_build_object(\n        'start_date', NEW.start_date,\n        'end_date', NEW.end_date,\n        'total_price', NEW.total_price\n      )\n    );\n  END IF;\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_log_booking_changes AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION log_booking_status_change()"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "table_name": "buckets",
    "function_name": "enforce_bucket_name_length",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n    if length(new.name) > 100 then\n        raise exception 'bucket name \"%\" is too long (% characters). Max is 100.', new.name, length(new.name);\n    end if;\n    return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()"
  },
  {
    "trigger_name": "trigger_update_owner_consent_status",
    "table_name": "consent_logs",
    "function_name": "update_owner_consent_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_owner_consent_status()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF NEW.consent_given = true AND NEW.withdrawn_at IS NULL THEN\n    UPDATE owners SET consent_status = 'verified', consent_verified_at = NEW.given_at, updated_at = now() WHERE id = NEW.owner_id;\n  ELSIF NEW.consent_given = false THEN\n    UPDATE owners SET consent_status = 'declined', updated_at = now() WHERE id = NEW.owner_id;\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_update_owner_consent_status AFTER INSERT ON public.consent_logs FOR EACH ROW EXECUTE FUNCTION update_owner_consent_status()"
  },
  {
    "trigger_name": "trg_set_dog_journal_org_id",
    "table_name": "dog_journal",
    "function_name": "set_dog_journal_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_dog_journal_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_dog_journal_org_id BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_dog_journal_org_id()"
  },
  {
    "trigger_name": "trg_auto_match_owner",
    "table_name": "dogs",
    "function_name": "auto_match_owner_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_match_owner_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  perform public.match_owners_to_dogs();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_auto_match_owner AFTER INSERT ON public.dogs FOR EACH ROW WHEN ((new.owner_id IS NULL)) EXECUTE FUNCTION auto_match_owner_trigger()"
  },
  {
    "trigger_name": "trg_create_journal_on_new_dog",
    "table_name": "dogs",
    "function_name": "create_dog_journal_on_new_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_dog_journal_on_new_dog()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Only create journal entry if user is logged in\n  -- For public applications (auth.uid() is NULL) skip this\n  IF auth.uid() IS NOT NULL THEN\n    INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)\n    VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog()"
  },
  {
    "trigger_name": "trg_set_dog_org_id",
    "table_name": "dogs",
    "function_name": "set_dog_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_dog_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_dog_org_id BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_dog_org_id()"
  },
  {
    "trigger_name": "trg_update_dogs_updated_at",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "trigger_update_external_customers_updated_at",
    "table_name": "external_customers",
    "function_name": "update_external_customers_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_external_customers_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_update_external_customers_updated_at BEFORE UPDATE ON public.external_customers FOR EACH ROW EXECUTE FUNCTION update_external_customers_updated_at()"
  },
  {
    "trigger_name": "trg_set_extra_service_org_id",
    "table_name": "extra_service",
    "function_name": "set_extra_service_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_extra_service_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_extra_service_org_id BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_extra_service_org_id()"
  },
  {
    "trigger_name": "trg_set_org_id_extra_services",
    "table_name": "extra_services",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_extra_services BEFORE INSERT ON public.extra_services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trigger_auto_create_grooming_journal",
    "table_name": "grooming_bookings",
    "function_name": "auto_create_grooming_journal",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_create_grooming_journal()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  v_dog_id UUID;\n  v_owner_id UUID;\nBEGIN\n  -- Only proceed if status changed TO 'completed'\n  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN\n    \n    -- Check if journal entry already exists for this booking\n    IF EXISTS (\n      SELECT 1 FROM grooming_journal \n      WHERE booking_id = NEW.id\n    ) THEN\n      -- Journal already exists, skip\n      RETURN NEW;\n    END IF;\n\n    -- For existing dogs: Get owner_id from dogs table\n    IF NEW.dog_id IS NOT NULL THEN\n      SELECT owner_id INTO v_owner_id\n      FROM dogs\n      WHERE id = NEW.dog_id;\n      \n      -- Create journal entry with dog_id and owner_id\n      INSERT INTO grooming_journal (\n        org_id,\n        dog_id,\n        owner_id,\n        booking_id,\n        appointment_date,\n        clip_length,\n        shampoo_type,\n        special_treatments,\n        notes,\n        duration_minutes,\n        total_price,\n        groomer_notes,\n        created_at\n      ) VALUES (\n        NEW.org_id,\n        NEW.dog_id,\n        v_owner_id,\n        NEW.id,\n        NEW.appointment_date,\n        COALESCE(NEW.clip_length, ''),\n        COALESCE(NEW.shampoo_type, ''),\n        NEW.service_type,\n        NEW.notes,\n        NULL, -- duration calculated from actual time\n        NEW.estimated_price,\n        'Auto-skapad från bokning',\n        NOW()\n      );\n      \n    -- For walk-in customers: Use external_* fields\n    ELSE\n      INSERT INTO grooming_journal (\n        org_id,\n        booking_id,\n        appointment_date,\n        external_customer_name,\n        external_customer_phone,\n        external_dog_name,\n        external_dog_breed,\n        clip_length,\n        shampoo_type,\n        special_treatments,\n        notes,\n        duration_minutes,\n        total_price,\n        groomer_notes,\n        created_at\n      ) VALUES (\n        NEW.org_id,\n        NEW.id,\n        NEW.appointment_date,\n        NEW.external_customer_name,\n        NEW.external_customer_phone,\n        NEW.external_dog_name,\n        NEW.external_dog_breed,\n        COALESCE(NEW.clip_length, ''),\n        COALESCE(NEW.shampoo_type, ''),\n        NEW.service_type,\n        NEW.notes,\n        NULL,\n        NEW.estimated_price,\n        'Auto-skapad från walk-in bokning',\n        NOW()\n      );\n    END IF;\n    \n    RAISE NOTICE 'Auto-created grooming journal entry for booking %', NEW.id;\n  END IF;\n  \n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_auto_create_grooming_journal AFTER UPDATE OF status ON public.grooming_bookings FOR EACH ROW EXECUTE FUNCTION auto_create_grooming_journal()"
  },
  {
    "trigger_name": "trigger_update_external_customer_stats",
    "table_name": "grooming_bookings",
    "function_name": "update_external_customer_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_external_customer_stats()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  v_customer_id UUID;\nBEGIN\n  -- Only proceed if this is a walk-in booking that was just completed\n  IF NEW.status = 'completed' AND NEW.external_customer_name IS NOT NULL THEN\n    \n    -- Find or create external customer record\n    INSERT INTO external_customers (\n      org_id,\n      customer_name,\n      customer_phone,\n      dog_name,\n      dog_breed,\n      last_visit_date,\n      total_visits\n    ) VALUES (\n      NEW.org_id,\n      NEW.external_customer_name,\n      NEW.external_customer_phone,\n      NEW.external_dog_name,\n      NEW.external_dog_breed,\n      NEW.appointment_date,\n      1\n    )\n    ON CONFLICT (org_id, customer_phone, dog_name)\n    DO UPDATE SET\n      last_visit_date = NEW.appointment_date,\n      total_visits = external_customers.total_visits + 1,\n      updated_at = NOW()\n    RETURNING id INTO v_customer_id;\n    \n    RAISE NOTICE 'Updated external customer stats for customer %', v_customer_id;\n  END IF;\n  \n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_update_external_customer_stats AFTER UPDATE OF status ON public.grooming_bookings FOR EACH ROW EXECUTE FUNCTION update_external_customer_stats()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_grooming",
    "table_name": "grooming_logs",
    "function_name": "set_org_id_for_grooming",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_grooming()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Hämtar organisationens ID från hunden automatiskt\n  if new.org_id is null then\n    select org_id into new.org_id\n    from dogs\n    where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_grooming BEFORE INSERT ON public.grooming_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_grooming()"
  },
  {
    "trigger_name": "trigger_set_invoice_number",
    "table_name": "invoices",
    "function_name": "set_invoice_number",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_invoice_number()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Sätt invoice_number om den inte finns\n  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN\n    NEW.invoice_number := generate_invoice_number(NEW.org_id);\n  END IF;\n  \n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION set_invoice_number()"
  },
  {
    "trigger_name": "cron_job_cache_invalidate",
    "table_name": "job",
    "function_name": "job_cache_invalidate",
    "function_definition": "CREATE OR REPLACE FUNCTION cron.job_cache_invalidate()\n RETURNS trigger\n LANGUAGE c\nAS '$libdir/pg_cron', $function$cron_job_cache_invalidate$function$\n",
    "trigger_definition": "CREATE TRIGGER cron_job_cache_invalidate AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION cron.job_cache_invalidate()"
  },
  {
    "trigger_name": "objects_delete_delete_prefix",
    "table_name": "objects",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "objects_insert_create_prefix",
    "table_name": "objects",
    "function_name": "objects_insert_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    NEW.level := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger()"
  },
  {
    "trigger_name": "objects_update_create_prefix",
    "table_name": "objects",
    "function_name": "objects_update_prefix_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    old_prefixes TEXT[];\nBEGIN\n    -- Ensure this is an update operation and the name has changed\n    IF TG_OP = 'UPDATE' AND (NEW.\"name\" <> OLD.\"name\" OR NEW.\"bucket_id\" <> OLD.\"bucket_id\") THEN\n        -- Retrieve old prefixes\n        old_prefixes := \"storage\".\"get_prefixes\"(OLD.\"name\");\n\n        -- Remove old prefixes that are only used by this object\n        WITH all_prefixes as (\n            SELECT unnest(old_prefixes) as prefix\n        ),\n        can_delete_prefixes as (\n             SELECT prefix\n             FROM all_prefixes\n             WHERE NOT EXISTS (\n                 SELECT 1 FROM \"storage\".\"objects\"\n                 WHERE \"bucket_id\" = OLD.\"bucket_id\"\n                   AND \"name\" <> OLD.\"name\"\n                   AND \"name\" LIKE (prefix || '%')\n             )\n         )\n        DELETE FROM \"storage\".\"prefixes\" WHERE name IN (SELECT prefix FROM can_delete_prefixes);\n\n        -- Add new prefixes\n        PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    END IF;\n    -- Set the new level\n    NEW.\"level\" := \"storage\".\"get_level\"(NEW.\"name\");\n\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger()"
  },
  {
    "trigger_name": "update_objects_updated_at",
    "table_name": "objects",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = now();\n    RETURN NEW; \nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()"
  },
  {
    "trigger_name": "on_insert_set_trial_end_for_org",
    "table_name": "orgs",
    "function_name": "set_trial_end_for_org",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_trial_end_for_org()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Sätt gratisperiod till 3 månader från registrering\n  NEW.trial_ends_at := (now() + interval '3 months');\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_trial_end_for_org BEFORE INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION set_trial_end_for_org()"
  },
  {
    "trigger_name": "on_org_insert_add_special_dates",
    "table_name": "orgs",
    "function_name": "add_default_special_dates_for_org",
    "function_definition": "CREATE OR REPLACE FUNCTION public.add_default_special_dates_for_org()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- 2025 - MINOR\n  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES\n  (NEW.id, '2025-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),\n  (NEW.id, '2025-04-18', 'Långfredagen', 'red_day', 100, 'Påsken startar'),\n  (NEW.id, '2025-04-21', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),\n  (NEW.id, '2025-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),\n  (NEW.id, '2025-05-29', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag vanlig'),\n  (NEW.id, '2025-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),\n  (NEW.id, '2025-11-01', 'Alla helgons dag', 'red_day', 75, 'Höstlov')\n  ON CONFLICT (org_id, date) DO NOTHING;\n\n  -- 2025 - MAJOR\n  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES\n  (NEW.id, '2025-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),\n  (NEW.id, '2025-04-20', 'Påskdagen', 'red_day', 200, 'Påskhelg'),\n  (NEW.id, '2025-06-08', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),\n  (NEW.id, '2025-12-25', 'Juldagen', 'red_day', 200, 'Jul'),\n  (NEW.id, '2025-12-26', 'Annandag jul', 'red_day', 150, 'Jul')\n  ON CONFLICT (org_id, date) DO NOTHING;\n\n  -- 2025 - PEAK\n  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES\n  (NEW.id, '2025-06-20', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),\n  (NEW.id, '2025-06-21', 'Midsommardagen', 'red_day', 350, 'Midsommar'),\n  (NEW.id, '2025-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen börjar'),\n  (NEW.id, '2025-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),\n  (NEW.id, '2025-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),\n  (NEW.id, '2025-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),\n  (NEW.id, '2025-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')\n  ON CONFLICT (org_id, date) DO NOTHING;\n\n  -- 2026 dates (samma struktur)\n  INSERT INTO special_dates (org_id, date, name, category, price_surcharge, notes) VALUES\n  (NEW.id, '2026-01-06', 'Trettondedag jul', 'red_day', 75, 'Vanlig röd dag'),\n  (NEW.id, '2026-04-03', 'Långfredagen', 'red_day', 100, 'Påsken startar'),\n  (NEW.id, '2026-04-06', 'Annandag påsk', 'red_day', 75, 'Påsken slutar'),\n  (NEW.id, '2026-05-01', 'Första maj', 'red_day', 75, 'Arbetsmarknadens dag'),\n  (NEW.id, '2026-05-14', 'Kristi himmelsfärdsdag', 'red_day', 75, 'Klämdag'),\n  (NEW.id, '2026-06-06', 'Sveriges nationaldag', 'red_day', 100, 'Nationaldagen'),\n  (NEW.id, '2026-10-31', 'Alla helgons dag', 'red_day', 75, 'Höstlov'),\n  (NEW.id, '2026-01-01', 'Nyårsdagen', 'red_day', 200, 'Nyår'),\n  (NEW.id, '2026-04-05', 'Påskdagen', 'red_day', 200, 'Påskhelg'),\n  (NEW.id, '2026-05-24', 'Pingstdagen', 'red_day', 150, 'Pinstvecka'),\n  (NEW.id, '2026-12-25', 'Juldagen', 'red_day', 200, 'Jul'),\n  (NEW.id, '2026-12-26', 'Annandag jul', 'red_day', 150, 'Jul'),\n  (NEW.id, '2026-06-19', 'Midsommarafton', 'red_day', 400, 'HÖGSTA efterfrågan'),\n  (NEW.id, '2026-06-20', 'Midsommardagen', 'red_day', 350, 'Midsommar'),\n  (NEW.id, '2026-12-23', 'Dag före julafton', 'red_day', 300, 'Julrushen'),\n  (NEW.id, '2026-12-24', 'Julafton', 'red_day', 400, 'HÖGSTA efterfrågan - jul'),\n  (NEW.id, '2026-12-27', 'Mellandag', 'red_day', 250, 'Julledighet'),\n  (NEW.id, '2026-12-30', 'Dag före nyårsafton', 'red_day', 300, 'Nyårsrushen'),\n  (NEW.id, '2026-12-31', 'Nyårsafton', 'red_day', 400, 'HÖGSTA efterfrågan - nyår')\n  ON CONFLICT (org_id, date) DO NOTHING;\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_org_insert_add_special_dates AFTER INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION add_default_special_dates_for_org()"
  },
  {
    "trigger_name": "on_org_locked_email",
    "table_name": "orgs",
    "function_name": "notify_admin_on_lock",
    "function_definition": "CREATE OR REPLACE FUNCTION public.notify_admin_on_lock()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  org_name text;\nbegin\n  select name into org_name from public.orgs where id = new.id;\n\n  perform\n    net.http_post(\n      url := 'https://api.resend.com/emails',\n      headers := jsonb_build_object(\n        'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),\n        'Content-Type', 'application/json'\n      ),\n      body := jsonb_build_object(\n        'from', 'DogPlanner <support@dogplanner.se>',\n        'to', 'support@dogplanner.se',\n        'subject', 'Konto låst: ' || org_name,\n        'html', '<p>Organisationen <b>' || org_name || '</b> har passerat sin testperiod och låsts.</p>'\n      )\n    );\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_org_locked_email AFTER UPDATE ON public.orgs FOR EACH ROW WHEN (((new.status = 'locked'::text) AND (old.status IS DISTINCT FROM 'locked'::text))) EXECUTE FUNCTION notify_admin_on_lock()"
  },
  {
    "trigger_name": "trigger_auto_customer_number",
    "table_name": "owners",
    "function_name": "auto_generate_customer_number",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_generate_customer_number()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  seq_name TEXT;\n  next_val INTEGER;\nBEGIN\n  -- Om customer_number inte redan är satt\n  IF NEW.customer_number IS NULL THEN\n    -- Försök hitta sekvensen\n    SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;\n    \n    IF seq_name IS NOT NULL THEN\n      -- Sequence finns, använd den\n      EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;\n      NEW.customer_number := next_val;\n      RAISE NOTICE 'Generated customer_number % using sequence %', next_val, seq_name;\n    ELSE\n      -- Ingen sequence, använd MAX+1 som fallback\n      SELECT COALESCE(MAX(customer_number), 0) + 1 \n      INTO NEW.customer_number \n      FROM owners;\n      RAISE WARNING 'No sequence found, using MAX+1 fallback: %', NEW.customer_number;\n    END IF;\n  END IF;\n  \n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_auto_customer_number BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION auto_generate_customer_number()"
  },
  {
    "trigger_name": "set_timestamp_pension_stays",
    "table_name": "pension_stays",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_timestamp_pension_stays BEFORE UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "trg_calc_total_amount",
    "table_name": "pension_stays",
    "function_name": "calc_total_amount",
    "function_definition": "CREATE OR REPLACE FUNCTION public.calc_total_amount()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  addon_sum numeric(10,2) := 0;\nbegin\n  if NEW.addons is not null then\n    select sum((x->>'price')::numeric)\n    into addon_sum\n    from jsonb_array_elements(NEW.addons) as x;\n  end if;\n\n  NEW.total_amount := coalesce(NEW.base_price,0) + coalesce(addon_sum,0);\n  return NEW;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_calc_total_amount BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION calc_total_amount()"
  },
  {
    "trigger_name": "trg_set_pension_stay_org_id",
    "table_name": "pension_stays",
    "function_name": "set_pension_stay_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_pension_stay_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM dogs \n    WHERE id = NEW.dog_id;\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_pension_stay_org_id BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_pension_stay_org_id()"
  },
  {
    "trigger_name": "prefixes_create_hierarchy",
    "table_name": "prefixes",
    "function_name": "prefixes_insert_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    PERFORM \"storage\".\"add_prefixes\"(NEW.\"bucket_id\", NEW.\"name\");\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger()"
  },
  {
    "trigger_name": "prefixes_delete_hierarchy",
    "table_name": "prefixes",
    "function_name": "delete_prefix_hierarchy_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    prefix text;\nBEGIN\n    prefix := \"storage\".\"get_prefix\"(OLD.\"name\");\n\n    IF coalesce(prefix, '') != '' THEN\n        PERFORM \"storage\".\"delete_prefix\"(OLD.\"bucket_id\", prefix);\n    END IF;\n\n    RETURN OLD;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"
  },
  {
    "trigger_name": "on_profile_insert",
    "table_name": "profiles",
    "function_name": "set_default_role",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_default_role()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.role is null then\n    new.role := 'staff';\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_profile_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_default_role()"
  },
  {
    "trigger_name": "trg_delete_org_if_no_admins",
    "table_name": "profiles",
    "function_name": "delete_org_if_no_admins",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_org_if_no_admins()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\nbegin\n  v_org_id := old.org_id;\n\n  -- Räkna kvarvarande admins i organisationen\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → radera hela företaget\n  if v_admin_count = 0 then\n    raise notice '⚠️ Varning: Ingen admin kvar i organisationen %, företaget kommer att tas bort!', v_org_id;\n\n    -- Radera i rätt ordning (för att undvika FK-fel)\n    delete from public.bookings where org_id = v_org_id;\n    delete from public.owners where org_id = v_org_id;\n    delete from public.dogs where org_id = v_org_id;\n    delete from public.invoices where org_id = v_org_id;\n    delete from public.orgs where id = v_org_id;\n\n    raise notice '✅ Organisation % och all tillhörande data har raderats enligt GDPR.', v_org_id;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_delete_org_if_no_admins AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_org_if_no_admins()"
  },
  {
    "trigger_name": "trg_ensure_org_has_admin",
    "table_name": "profiles",
    "function_name": "ensure_org_has_admin",
    "function_definition": "CREATE OR REPLACE FUNCTION public.ensure_org_has_admin()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  v_org_id uuid;\n  v_admin_count int;\n  v_new_admin uuid;\nbegin\n  -- Identifiera organisationen baserat på den gamla raden\n  v_org_id := old.org_id;\n\n  -- Räkna antalet kvarvarande admins\n  select count(*) into v_admin_count\n  from public.profiles\n  where org_id = v_org_id\n    and role = 'admin';\n\n  -- Om inga admins finns kvar → uppgradera en slumpmässig staff till admin\n  if v_admin_count = 0 then\n    select id into v_new_admin\n    from public.profiles\n    where org_id = v_org_id\n    order by created_at asc\n    limit 1;\n\n    if v_new_admin is not null then\n      update public.profiles\n      set role = 'admin'\n      where id = v_new_admin;\n\n      raise notice 'Ingen admin kvar i org %, uppgraderade användare % till admin', v_org_id, v_new_admin;\n    else\n      raise notice 'Ingen kvar att uppgradera i org %, organisationen står utan användare', v_org_id;\n    end if;\n  end if;\n\n  return null;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_ensure_org_has_admin AFTER DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_org_has_admin()"
  },
  {
    "trigger_name": "trg_set_org_id_rooms",
    "table_name": "rooms",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_services",
    "table_name": "services",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_special_dates",
    "table_name": "special_dates",
    "function_name": "set_special_date_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_special_date_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    NEW.org_id := (\n      SELECT org_id \n      FROM profiles \n      WHERE id = auth.uid()\n    );\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_special_dates BEFORE INSERT ON public.special_dates FOR EACH ROW EXECUTE FUNCTION set_special_date_org_id()"
  },
  {
    "trigger_name": "tr_check_filters",
    "table_name": "subscription",
    "function_name": "subscription_check_filters",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n    /*\n    Validates that the user defined filters for a subscription:\n    - refer to valid columns that the claimed role may access\n    - values are coercable to the correct column type\n    */\n    declare\n        col_names text[] = coalesce(\n                array_agg(c.column_name order by c.ordinal_position),\n                '{}'::text[]\n            )\n            from\n                information_schema.columns c\n            where\n                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity\n                and pg_catalog.has_column_privilege(\n                    (new.claims ->> 'role'),\n                    format('%I.%I', c.table_schema, c.table_name)::regclass,\n                    c.column_name,\n                    'SELECT'\n                );\n        filter realtime.user_defined_filter;\n        col_type regtype;\n\n        in_val jsonb;\n    begin\n        for filter in select * from unnest(new.filters) loop\n            -- Filtered column is valid\n            if not filter.column_name = any(col_names) then\n                raise exception 'invalid column for filter %', filter.column_name;\n            end if;\n\n            -- Type is sanitized and safe for string interpolation\n            col_type = (\n                select atttypid::regtype\n                from pg_catalog.pg_attribute\n                where attrelid = new.entity\n                      and attname = filter.column_name\n            );\n            if col_type is null then\n                raise exception 'failed to lookup type for column %', filter.column_name;\n            end if;\n\n            -- Set maximum number of entries for in filter\n            if filter.op = 'in'::realtime.equality_op then\n                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);\n                if coalesce(jsonb_array_length(in_val), 0) > 100 then\n                    raise exception 'too many values for `in` filter. Maximum 100';\n                end if;\n            else\n                -- raises an exception if value is not coercable to type\n                perform realtime.cast(filter.value, col_type);\n            end if;\n\n        end loop;\n\n        -- Apply consistent order to filters so the unique constraint on\n        -- (subscription_id, entity, filters) can't be tricked by a different filter order\n        new.filters = coalesce(\n            array_agg(f order by f.column_name, f.op, f.value),\n            '{}'\n        ) from unnest(new.filters) f;\n\n        return new;\n    end;\n    $function$\n",
    "trigger_definition": "CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_subscriptions",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_subscription",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_subscription()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  -- Hämta organisationen kopplad till den användare som skapar abonnemanget\n  SELECT org_id INTO NEW.org_id\n  FROM public.profiles\n  WHERE id = auth.uid();\n\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_subscriptions BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_subscription()"
  },
  {
    "trigger_name": "on_auth_user_created",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  v_org_name text;\n  v_org_number text;\n  v_full_name text;\n  v_phone text;\n  v_lan text;\n  v_kommun text;\n  v_service_types text[];\n  v_org_id uuid;\nBEGIN\n  -- Extract values from user_metadata (from registration form)\n  v_org_name := COALESCE(\n    NEW.raw_user_meta_data->>'org_name',\n    split_part(NEW.email, '@', 1) || 's Hunddagis'\n  );\n  v_org_number := NEW.raw_user_meta_data->>'org_number';\n  v_full_name := COALESCE(\n    NEW.raw_user_meta_data->>'full_name',\n    split_part(NEW.email, '@', 1)\n  );\n  v_phone := NEW.raw_user_meta_data->>'phone';\n  v_lan := NEW.raw_user_meta_data->>'lan';\n  v_kommun := NEW.raw_user_meta_data->>'kommun';\n  \n  -- Parse service_types array from JSONB\n  IF NEW.raw_user_meta_data ? 'service_types' THEN\n    v_service_types := ARRAY(\n      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'service_types')\n    );\n  END IF;\n\n  -- Create organization with proper values\n  INSERT INTO orgs (\n    name,\n    org_number,\n    email,\n    phone,\n    lan,\n    kommun,\n    service_types,\n    created_at\n  )\n  VALUES (\n    v_org_name,\n    v_org_number,\n    NEW.email,\n    v_phone,\n    v_lan,\n    v_kommun,\n    v_service_types,\n    now()\n  )\n  RETURNING id INTO v_org_id;\n\n  RAISE NOTICE 'Created org for user %: org_id=%', NEW.email, v_org_id;\n\n  -- Create profile with org_id\n  INSERT INTO profiles (\n    id,\n    org_id,\n    role,\n    email,\n    full_name,\n    phone,\n    created_at\n  )\n  VALUES (\n    NEW.id,\n    v_org_id,\n    'admin', -- First user is always admin\n    NEW.email,\n    v_full_name,\n    v_phone,\n    now()\n  );\n\n  RAISE NOTICE 'Created profile for user %: org_id=%', NEW.email, v_org_id;\n\n  -- Create 3-month trial subscription\n  INSERT INTO org_subscriptions (\n    org_id,\n    status,\n    trial_ends_at,\n    created_at\n  )\n  VALUES (\n    v_org_id,\n    'trialing',\n    now() + interval '3 months',\n    now()\n  );\n\n  RAISE NOTICE 'Created trial subscription for org_id=%', v_org_id;\n\n  RETURN NEW;\n\nEXCEPTION\n  WHEN OTHERS THEN\n    -- Don't block registration if trigger fails\n    -- Layer 2 (API) will catch this\n    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  }
]


[
  {
    "schemaname": "cron",
    "tablename": "job",
    "policyname": "cron_job_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(username = CURRENT_USER)",
    "with_check": null
  },
  {
    "schemaname": "cron",
    "tablename": "job_run_details",
    "policyname": "cron_job_run_details_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(username = CURRENT_USER)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Allow read attendance_logs for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "attendance_logs",
    "policyname": "Block changes to attendance_logs for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM ((profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n     JOIN dogs d ON ((d.id = attendance_logs.dogs_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = d.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "boarding_seasons",
    "policyname": "Enable all for authenticated users on boarding_seasons",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Customers can view own booking events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(booking_id IN ( SELECT b.id\n   FROM (bookings b\n     JOIN dogs d ON ((b.dog_id = d.id)))\n  WHERE (d.owner_id IN ( SELECT owners.id\n           FROM owners\n          WHERE (owners.user_id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Only system can create events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "false"
  },
  {
    "schemaname": "public",
    "tablename": "booking_events",
    "policyname": "Staff can view booking events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_public_insert",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_select_by_org_or_owner",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "policyname": "bookings_update_by_org_or_owner",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR ((owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))) AND (status = 'pending'::text)))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR ((owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))) AND (status = 'pending'::text)))"
  },
  {
    "schemaname": "public",
    "tablename": "consent_logs",
    "policyname": "consent_org_select",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "consent_logs",
    "policyname": "consent_public_insert",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "daycare_pricing",
    "policyname": "authenticated_full_access_daycare_pricing",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "Allow org members to manage dog journals",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "Allow org members to view dog journals",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = dog_journal.dog_id) AND (d.org_id = current_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = dog_journal.dog_id) AND (d.org_id = current_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id) AND (p.role = 'admin'::text))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "dog_journal_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.org_id = dog_journal.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "insert_dog_journal_in_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "dog_journal",
    "policyname": "select_dog_journal_in_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id = auth.uid()) OR (org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_public_insert",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_select_by_org_or_owner",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "dogs",
    "policyname": "dogs_update_by_org_or_owner",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (owner_id IN ( SELECT owners.id\n   FROM owners\n  WHERE (owners.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can insert external customers in their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can update external customers in their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "external_customers",
    "policyname": "Users can view external customers in their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Allow read extra_service for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Block changes to extra_service for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = extra_service.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Org members can modify org extra_service",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = extra_service.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "Org members can read org extra_service",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = extra_service.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "allow_select_extra_service",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "delete_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = extra_service.dogs_id) AND (d.org_id = current_org_id()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dogs d\n  WHERE ((d.id = extra_service.dogs_id) AND (d.org_id = current_org_id()))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_select",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "extra_service_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "insert_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((org_id IS NULL) OR (org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "select_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "extra_service",
    "policyname": "update_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "extra_services",
    "policyname": "Allow all for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "function_logs",
    "policyname": "Admins can view function logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.role = 'admin'::text)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_logs",
    "policyname": "Org members can modify org grooming logs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = grooming_logs.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_logs",
    "policyname": "Org members can read org grooming logs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = grooming_logs.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "grooming_services",
    "policyname": "authenticated_full_access_grooming_services",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Allow anonymous insert for public applications",
    "permissive": "PERMISSIVE",
    "roles": "{anon}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can delete their org's interest applications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can insert interest applications for their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can update their org's interest applications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "Users can view their org's interest applications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "interest_applications",
    "policyname": "interest_org_select",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "admin_full_access_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'admin'::text))",
    "with_check": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'admin'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "select_own_org_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE (invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoice_items",
    "policyname": "staff_edit_draft_invoice_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE ((invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))) AND (invoices.status = 'draft'::text)))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'staff'::text))",
    "with_check": "((invoice_id IN ( SELECT invoices.id\n   FROM invoices\n  WHERE ((invoices.org_id = ( SELECT profiles.org_id\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))) AND (invoices.status = 'draft'::text)))) AND (( SELECT profiles.role\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = 'staff'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "insert_invoices_in_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "select_invoices_in_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "invoices",
    "policyname": "update_invoices_in_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "orgs",
    "policyname": "orgs_members_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "orgs",
    "policyname": "orgs_public_select",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_public_insert",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_select_by_org_or_self",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "owners",
    "policyname": "owners_update_by_org_or_self",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))",
    "with_check": "((org_id IN ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))) OR (id = auth.uid()))"
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Allow read price lists for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Block changes to price lists for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.id = price_lists.org_id) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Org members can modify org price_lists",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = price_lists.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "price_lists",
    "policyname": "Org members can read org price_lists",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = price_lists.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can delete pricing for their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can insert pricing for their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))"
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can update pricing for their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pricing",
    "policyname": "Users can view pricing for their org",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(org_id IN ( SELECT orgs.id\n   FROM orgs\n  WHERE (orgs.id = ((auth.jwt() ->> 'org_id'::text))::uuid)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_insert_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_read_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_update_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Allow read responsibilities for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Block changes to responsibilities for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Org members can modify org responsibilities",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = responsibilities.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "responsibilities",
    "policyname": "Org members can read org responsibilities",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = responsibilities.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rooms",
    "policyname": "authenticated_full_access_rooms",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = rooms.org_id))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.org_id = rooms.org_id))))"
  },
  {
    "schemaname": "public",
    "tablename": "special_dates",
    "policyname": "Enable all for authenticated users on special_dates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": "(auth.role() = 'authenticated'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Allow read staff_notes for active or locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status = ANY (ARRAY['active'::text, 'trialing'::text, 'locked'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Block changes to staff_notes for locked orgs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (profiles p\n     JOIN orgs o ON ((o.id = p.org_id)))\n  WHERE ((p.id = auth.uid()) AND (o.status <> 'locked'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Org members can modify org staff_notes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = staff_notes.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "staff_notes",
    "policyname": "Org members can read org staff_notes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.org_id = staff_notes.org_id)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "Users can view subscription for their organization",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.org_id = subscriptions.org_id) AND (profiles.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "allow_select_subscriptions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "delete_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "delete_subscriptions_admin_only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "insert_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((org_id IS NULL) OR (org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "insert_subscriptions_admin_only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "read_subscriptions_admin_only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "select_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "update_own_org",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))",
    "with_check": "(org_id = ( SELECT profiles.org_id\n   FROM profiles\n  WHERE (profiles.id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "subscriptions",
    "policyname": "update_subscriptions_admin_only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.org_id = subscriptions.org_id))))"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "Authenticated users can upload dog photos",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(bucket_id = 'dog-photos'::text)"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "Give users authenticated access to folder flreew_0",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'documents'::text) AND (auth.role() = 'authenticated'::text))",
    "with_check": null
  }
]