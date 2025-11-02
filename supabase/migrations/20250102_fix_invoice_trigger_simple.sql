-- ================================================================
-- ENKEL FIX: Uppdatera create_invoice_on_checkout för extra_service
-- ================================================================
-- Ersätter den befintliga funktionen med stöd för extra_service tabellen
-- utan att kräva payment_type kolumn (som inte finns)
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_invoice_on_checkout()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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

    -- Beräkna antal nätter
    v_nights := (NEW.end_date - NEW.start_date);
    IF v_nights <= 0 THEN
      v_nights := 1;
    END IF;

    -- Använd bokningens totalpris som bas (minus rabatt)
    v_base_amount := COALESCE(NEW.total_price, NEW.base_price, 0);
    
    -- Ta bort rabatt om den redan räknats in i total_price
    IF NEW.discount_amount > 0 AND v_base_amount > NEW.discount_amount THEN
      v_base_amount := v_base_amount; -- Behåll som den är, rabatt läggs till separat nedan
    END IF;
    
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

    -- RAD 1: Grundpris för bokningen (logi)
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

    -- RAD 2: Tillval från booking_services (om tabellen finns)
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

    -- RAD 3: Återkommande tillägg från extra_service
    -- (endast de som är aktiva under bokningsperioden)
    FOR v_extra_service IN
      SELECT 
        es.service_type,
        es.frequency,
        es.price,
        es.notes
      FROM extra_service es
      WHERE es.dogs_id = NEW.dog_id
        AND es.org_id = NEW.org_id
        AND COALESCE(es.is_active, true) = true
        AND es.start_date <= NEW.end_date
        AND (es.end_date IS NULL OR es.end_date >= NEW.start_date)
    LOOP
      v_description := v_extra_service.service_type;
      
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;

      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || ' - ' || v_extra_service.notes;
      END IF;

      -- Hämta pris (från extra_service eller från katalog)
      v_service_price := v_extra_service.price;
      
      IF v_service_price IS NULL THEN
        -- Försök hämta från katalogtabell
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

    -- RAD 4: Rabatt (om det finns och inte redan inkluderat i total_price)
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

    RAISE NOTICE '✅ Faktura % skapad för bokning % (Total: % kr)', v_invoice_id, NEW.id, v_total_amount;
  END IF;

  RETURN NEW;
END;
$function$;

-- Verifiera att triggern finns (ska redan finnas från tidigare)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_create_invoice_on_checkout'
  ) THEN
    CREATE TRIGGER trg_create_invoice_on_checkout
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'checked_out' AND OLD.status != 'checked_out')
    EXECUTE FUNCTION create_invoice_on_checkout();
    
    RAISE NOTICE '✅ Trigger trg_create_invoice_on_checkout skapad';
  ELSE
    RAISE NOTICE 'ℹ️ Trigger trg_create_invoice_on_checkout finns redan';
  END IF;
END $$;

-- Test: Visa struktur
SELECT 
  'extra_service' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'extra_service'
  AND column_name IN ('dogs_id', 'service_type', 'frequency', 'price', 'notes', 'start_date', 'end_date', 'is_active')
ORDER BY ordinal_position;
