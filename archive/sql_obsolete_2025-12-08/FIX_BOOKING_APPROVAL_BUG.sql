-- ============================================================
-- FIX: Booking Approval Bug
-- ============================================================
-- Problem: Bokningsgodkännande failar med fel:
-- "column 'quantity' of relation 'invoice_items' does not exist"
--
-- Root cause: SQL triggers använder gamla kolumnnamn
-- - quantity → qty
-- - total_amount → amount
--
-- Denna fil uppdaterar båda trigger-funktionerna.
-- ============================================================

-- ============================================================
-- 1. Fix: create_prepayment_invoice()
-- ============================================================
-- Denna trigger skapar en förskottsfaktura när bokning godkänns
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."create_prepayment_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_prepayment_amount NUMERIC;
  v_org_pricing RECORD;
BEGIN
  -- Skapa faktura endast när status ändras till 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    
    -- Hämta owner_id från hunden
    SELECT owner_id INTO v_owner_id 
    FROM dogs 
    WHERE id = NEW.dog_id;

    IF v_owner_id IS NULL THEN
      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;
      RETURN NEW;
    END IF;

    -- Hämta förskottsbelopp från organisationens prissättning
    BEGIN
      SELECT 
        prepayment_fixed,
        prepayment_percentage
      INTO v_org_pricing
      FROM pensionat_org_pricing
      WHERE org_id = NEW.org_id
      LIMIT 1;

      IF v_org_pricing.prepayment_fixed IS NOT NULL AND v_org_pricing.prepayment_fixed > 0 THEN
        v_prepayment_amount := v_org_pricing.prepayment_fixed;
      ELSIF v_org_pricing.prepayment_percentage IS NOT NULL AND v_org_pricing.prepayment_percentage > 0 THEN
        v_prepayment_amount := (NEW.total_price * v_org_pricing.prepayment_percentage / 100);
      ELSE
        v_prepayment_amount := NEW.total_price * 0.50; -- Fallback: 50%
      END IF;

    EXCEPTION 
      WHEN undefined_table THEN
        v_prepayment_amount := NEW.total_price * 0.50;
      WHEN OTHERS THEN
        v_prepayment_amount := NEW.total_price * 0.50;
    END;

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
      CURRENT_DATE + INTERVAL '14 days',
      v_prepayment_amount,
      'draft',
      'prepayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- Lägg till fakturarad (✅ FIXED: använder 'qty' och 'amount')
    INSERT INTO invoice_items (
      invoice_id,
      description,
      qty,
      unit_price,
      amount
    )
    VALUES (
      v_invoice_id,
      format('Förskottsbetalning - Hundpensionat %s till %s', NEW.start_date, NEW.end_date),
      1,
      v_prepayment_amount,
      v_prepayment_amount
    );

    -- Uppdatera bokningen med faktura-ID
    UPDATE bookings 
    SET prepayment_invoice_id = v_invoice_id
    WHERE id = NEW.id;

    RAISE NOTICE '✅ Förskottsfaktura % skapad för bokning % (Belopp: % kr)', 
      v_invoice_id, NEW.id, v_prepayment_amount;

  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 2. Fix: create_invoice_on_checkout()
-- ============================================================
-- Denna trigger skapar slutfaktura när gäst checkar ut
-- ============================================================

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
        qty,
        unit_price,
        amount
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
          qty,
          unit_price,
          amount
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
          qty,
          unit_price,
          amount
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
        qty,
        unit_price,
        amount
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


-- ============================================================
-- 3. Verifiering
-- ============================================================
-- Kör detta för att verifiera att funktionerna är uppdaterade
-- ============================================================

-- Detaljerad verifiering - kontrollera INSERT-satserna
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%INSERT INTO invoice_items%qty%' as insert_uses_qty,
  pg_get_functiondef(oid) LIKE '%INSERT INTO invoice_items%quantity%' as insert_uses_quantity,
  pg_get_functiondef(oid) LIKE '%INSERT INTO invoice_items%amount%' as insert_uses_amount,
  pg_get_functiondef(oid) LIKE '%INSERT INTO invoice_items%total_amount%' as insert_uses_total_amount
FROM pg_proc 
WHERE proname IN ('create_prepayment_invoice', 'create_invoice_on_checkout');

-- ✅ KORREKT om:
--    insert_uses_qty = true
--    insert_uses_quantity = false  
--    insert_uses_amount = true
--    insert_uses_total_amount = false

-- OBS: Det är OK om funktionen läser 'bs.quantity' från booking_services!
-- Det viktiga är att INSERT INTO invoice_items använder 'qty' och 'amount'!
