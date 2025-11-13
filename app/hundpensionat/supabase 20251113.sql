[
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_prices",
    "table_name": "boarding_prices",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_prices BEFORE INSERT ON public.boarding_prices FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_boarding_seasons",
    "table_name": "boarding_seasons",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_boarding_seasons BEFORE INSERT ON public.boarding_seasons FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
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
    "trigger_name": "trg_set_org_id_on_bookings",
    "table_name": "bookings",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
  },
  {
    "trigger_name": "trg_touch_bookings",
    "table_name": "bookings",
    "function_name": "touch_bookings_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.touch_bookings_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.updated_at := now();\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_touch_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION touch_bookings_updated_at()"
  },
  {
    "trigger_name": "update_bookings_updated_at",
    "table_name": "bookings",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "table_name": "buckets",
    "function_name": "enforce_bucket_name_length",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n    if length(new.name) > 100 then\n        raise exception 'bucket name \"%\" is too long (% characters). Max is 100.', new.name, length(new.name);\n    end if;\n    return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()"
  },
  {
    "trigger_name": "trg_set_org_id_for_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_dog_journal",
    "table_name": "dog_journal",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dog_journal BEFORE INSERT ON public.dog_journal FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "on_insert_set_user_id",
    "table_name": "dogs",
    "function_name": "set_user_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_user_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  new.user_id := auth.uid();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_user_id BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_user_id()"
  },
  {
    "trigger_name": "set_last_updated",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_last_updated BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_for_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from profiles where id = auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_for_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "dogs",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
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
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_dog_journal_on_new_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    INSERT INTO public.dog_journal (dog_id, text, org_id)\n    VALUES (\n        NEW.id,\n        'Ny hund registrerad i systemet.',\n        NEW.org_id\n    );\n    RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_create_journal_on_new_dog AFTER INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION create_dog_journal_on_new_dog()"
  },
  {
    "trigger_name": "trg_set_org_id_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "trg_set_org_id_on_dogs",
    "table_name": "dogs",
    "function_name": "set_org_id_for_dogs",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_dogs()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_dogs()"
  },
  {
    "trigger_name": "trg_set_org_user_dogs",
    "table_name": "dogs",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_dogs BEFORE INSERT ON public.dogs FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "trg_update_dogs_updated_at",
    "table_name": "dogs",
    "function_name": "update_last_updated",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_last_updated()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  new.last_updated = now();\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION update_last_updated()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "extra_service",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_id_extra_service",
    "table_name": "extra_service",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_extra_service",
    "table_name": "extra_service",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_extra_service BEFORE INSERT ON public.extra_service FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "trg_set_org_id_extra_services",
    "table_name": "extra_services",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_extra_services BEFORE INSERT ON public.extra_services FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_grooming",
    "table_name": "grooming_logs",
    "function_name": "set_org_id_for_grooming",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_grooming()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  -- Hämtar organisationens ID från hunden automatiskt\n  if new.org_id is null then\n    select org_id into new.org_id\n    from dogs\n    where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_grooming BEFORE INSERT ON public.grooming_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_for_grooming()"
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
    "trigger_name": "on_org_locked_email",
    "table_name": "orgs",
    "function_name": "notify_admin_on_lock",
    "function_definition": "CREATE OR REPLACE FUNCTION public.notify_admin_on_lock()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\ndeclare\n  org_name text;\nbegin\n  select name into org_name from public.orgs where id = new.id;\n\n  perform\n    net.http_post(\n      url := 'https://api.resend.com/emails',\n      headers := jsonb_build_object(\n        'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),\n        'Content-Type', 'application/json'\n      ),\n      body := jsonb_build_object(\n        'from', 'DogPlanner <support@dogplanner.se>',\n        'to', 'support@dogplanner.se',\n        'subject', 'Konto låst: ' || org_name,\n        'html', '<p>Organisationen <b>' || org_name || '</b> har passerat sin testperiod och låsts.</p>'\n      )\n    );\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_org_locked_email AFTER UPDATE ON public.orgs FOR EACH ROW WHEN (((new.status = 'locked'::text) AND (old.status IS DISTINCT FROM 'locked'::text))) EXECUTE FUNCTION notify_admin_on_lock()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_owners",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "owners_set_org_id",
    "table_name": "owners",
    "function_name": "set_owner_org_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_owner_org_id()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := (select org_id from profiles where id = auth.uid());\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER owners_set_org_id BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_owner_org_id()"
  },
  {
    "trigger_name": "set_org_id_trigger",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_id_owners",
    "table_name": "owners",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "trg_set_org_user_owners",
    "table_name": "owners",
    "function_name": "set_org_and_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_and_user()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    new.org_id := public.current_org_id();\n  end if;\n  if new.user_id is null then\n    new.user_id := auth.uid();\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_user_owners BEFORE INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION set_org_and_user()"
  },
  {
    "trigger_name": "trigger_auto_customer_number",
    "table_name": "owners",
    "function_name": "auto_generate_customer_number",
    "function_definition": "CREATE OR REPLACE FUNCTION public.auto_generate_customer_number()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  max_customer_number INTEGER;\nBEGIN\n  -- Kör bara om customer_number är NULL eller 0\n  IF NEW.customer_number IS NULL OR NEW.customer_number = 0 THEN\n    -- Hämta högsta befintliga kundnummer i organisationen\n    SELECT COALESCE(MAX(customer_number), 0) INTO max_customer_number\n    FROM owners\n    WHERE org_id = NEW.org_id;\n    \n    -- Sätt nästa nummer i sekvensen\n    NEW.customer_number := max_customer_number + 1;\n    \n    RAISE NOTICE 'Auto-genererat kundnummer % för org_id %', NEW.customer_number, NEW.org_id;\n  ELSE\n    -- Om admin har satt ett nummer manuellt, verifiera att det inte redan finns\n    -- (unique constraint kommer kasta fel om det är duplicat, men vi ger bättre felmeddelande)\n    IF EXISTS (\n      SELECT 1 FROM owners \n      WHERE org_id = NEW.org_id \n        AND customer_number = NEW.customer_number \n        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)\n    ) THEN\n      RAISE EXCEPTION 'Kundnummer % används redan i denna organisation', NEW.customer_number;\n    END IF;\n    \n    RAISE NOTICE 'Använder manuellt satt kundnummer % för org_id %', NEW.customer_number, NEW.org_id;\n  END IF;\n  \n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trigger_auto_customer_number BEFORE INSERT OR UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION auto_generate_customer_number()"
  },
  {
    "trigger_name": "on_insert_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
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
    "trigger_name": "trg_set_org_id_for_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_for_pension_stays",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_pension_stays()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select org_id into new.org_id from dogs where id = new.dog_id;\n  end if;\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_for_pension_stays BEFORE INSERT ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_for_pension_stays()"
  },
  {
    "trigger_name": "trg_set_org_id_on_pension_stays",
    "table_name": "pension_stays",
    "function_name": "set_org_id_from_dog",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_from_dog()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if new.org_id is null then\n    select d.org_id into new.org_id from public.dogs d where d.id = new.dog_id;\n  end if;\n  return new;\nend$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_set_org_id_on_pension_stays BEFORE INSERT OR UPDATE ON public.pension_stays FOR EACH ROW EXECUTE FUNCTION set_org_id_from_dog()"
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
    "trigger_name": "on_insert_set_org_id_for_rooms",
    "table_name": "rooms",
    "function_name": "set_org_id_for_rooms",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_rooms()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_insert_set_org_id_for_rooms BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_org_id_for_rooms()"
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
    "trigger_name": "set_org_id_trigger",
    "table_name": "subscriptions",
    "function_name": "set_org_id_for_owners",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_org_id_for_owners()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  IF NEW.org_id IS NULL THEN\n    SELECT org_id INTO NEW.org_id \n    FROM profiles \n    WHERE id = auth.uid();\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_org_id_for_owners()"
  },
  {
    "trigger_name": "on_auth_user_created",
    "table_name": "users",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  v_org_id uuid;\n  v_org_name text;\n  v_full_name text;\n  v_org_number text;\n  v_phone text;\n  v_trial_ends timestamptz;\nBEGIN\n  -- Logga att funktionen körs\n  RAISE NOTICE 'handle_new_user() körs för användare: %', NEW.id;\n\n  -- Hämta metadata från registreringen\n  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));\n  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');\n  v_org_number := NEW.raw_user_meta_data->>'org_number';\n  v_phone := NEW.raw_user_meta_data->>'phone';\n\n  RAISE NOTICE 'Skapar organisation: %', v_org_name;\n\n  -- Skapa organisation\n  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)\n  VALUES (\n    v_org_name,\n    v_org_number,\n    NEW.email,\n    true,\n    25\n  )\n  RETURNING id INTO v_org_id;\n\n  RAISE NOTICE 'Organisation skapad med ID: %', v_org_id;\n\n  -- Skapa profil\n  INSERT INTO profiles (id, org_id, role, email, full_name, phone)\n  VALUES (\n    NEW.id,\n    v_org_id,\n    'admin',\n    NEW.email,\n    v_full_name,\n    v_phone\n  );\n\n  RAISE NOTICE 'Profil skapad för användare: %', NEW.id;\n\n  -- Skapa 3 månaders gratis prenumeration\n  v_trial_ends := NOW() + INTERVAL '3 months';\n  \n  INSERT INTO subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at)\n  VALUES (\n    v_org_id,\n    'basic',\n    'trialing',\n    NOW(),\n    v_trial_ends\n  );\n\n  RAISE NOTICE '3 månaders gratisperiod skapad, slutar: %', v_trial_ends;\n  RAISE NOTICE '✅ Ny användare fullständigt uppsatt!';\n\n  RETURN NEW;\nEXCEPTION\n  WHEN OTHERS THEN\n    RAISE WARNING 'Fel i handle_new_user(): %, %', SQLERRM, SQLSTATE;\n    RETURN NEW; -- Returnera ändå så användaren skapas\nEND;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
  },
  {
    "trigger_name": "trg_assign_org_to_new_user",
    "table_name": "users",
    "function_name": "assign_org_to_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.assign_org_to_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\ndeclare\n  v_org_id uuid;\nbegin\n  -- Försök hitta en org baserat på e-postdomän (ex: @hunddagis.se)\n  select id into v_org_id\n  from public.orgs\n  where lower(name) = lower(split_part(new.email, '@', 1) || 's Hunddagis')\n  or lower(name) like '%' || split_part(new.email, '@', 2);\n\n  -- Om organisation hittas → koppla användaren till den\n  if v_org_id is not null then\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'staff');\n  else\n    -- Annars skapa ny organisation (första användare blir admin)\n    insert into public.orgs (name)\n    values (split_part(new.email, '@', 1) || 's Hunddagis')\n    returning id into v_org_id;\n\n    insert into public.profiles (id, email, org_id, role)\n    values (new.id, new.email, v_org_id, 'admin');\n  end if;\n\n  return new;\nend;\n$function$\n",
    "trigger_definition": "CREATE TRIGGER trg_assign_org_to_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION assign_org_to_new_user()"
  }
]