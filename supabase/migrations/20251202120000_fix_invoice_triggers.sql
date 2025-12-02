-- ============================================================
-- Migration: Fix invoice triggers - use qty instead of quantity
-- ============================================================
-- Date: 2025-12-02
-- Issue: Invoice triggers used old column names (quantity, total_amount)
-- Fix: Updated to use correct names (qty, unit_price) and respect GENERATED COLUMN
-- ============================================================

-- Drop old trigger functions
DROP FUNCTION IF EXISTS public.create_prepayment_invoice() CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_on_checkout() CASCADE;

-- Recreate create_prepayment_invoice with correct column names
CREATE FUNCTION "public"."create_prepayment_invoice"() 
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_prepayment_amount NUMERIC;
  v_org_pricing RECORD;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    
    SELECT owner_id INTO v_owner_id FROM dogs WHERE id = NEW.dog_id;
    IF v_owner_id IS NULL THEN
      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;
      RETURN NEW;
    END IF;

    BEGIN
      SELECT prepayment_fixed, prepayment_percentage INTO v_org_pricing
      FROM pensionat_org_pricing WHERE org_id = NEW.org_id LIMIT 1;

      IF v_org_pricing.prepayment_fixed IS NOT NULL AND v_org_pricing.prepayment_fixed > 0 THEN
        v_prepayment_amount := v_org_pricing.prepayment_fixed;
      ELSIF v_org_pricing.prepayment_percentage IS NOT NULL AND v_org_pricing.prepayment_percentage > 0 THEN
        v_prepayment_amount := (NEW.total_price * v_org_pricing.prepayment_percentage / 100);
      ELSE
        v_prepayment_amount := NEW.total_price * 0.50;
      END IF;
    EXCEPTION 
      WHEN undefined_table THEN v_prepayment_amount := NEW.total_price * 0.50;
      WHEN OTHERS THEN v_prepayment_amount := NEW.total_price * 0.50;
    END;

    INSERT INTO invoices (org_id, owner_id, invoice_date, due_date, total_amount, status, invoice_type, billed_name, billed_email)
    VALUES (
      NEW.org_id, v_owner_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days',
      v_prepayment_amount, 'draft', 'prepayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- IMPORTANT: Only insert qty and unit_price, amount is GENERATED COLUMN
    INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
    VALUES (
      v_invoice_id,
      format('Förskottsbetalning - Hundpensionat %s till %s', NEW.start_date, NEW.end_date),
      1,
      v_prepayment_amount
    );

    UPDATE bookings SET prepayment_invoice_id = v_invoice_id WHERE id = NEW.id;
    RAISE NOTICE '✅ Förskottsfaktura % skapad för bokning % (Belopp: % kr)', v_invoice_id, NEW.id, v_prepayment_amount;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate create_invoice_on_checkout with correct column names
CREATE FUNCTION "public"."create_invoice_on_checkout"() 
RETURNS "trigger"
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
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    
    SELECT owner_id INTO v_owner_id FROM dogs WHERE id = NEW.dog_id;
    IF v_owner_id IS NULL THEN
      RAISE WARNING 'Kunde inte hitta owner_id för dog_id %', NEW.dog_id;
      RETURN NEW;
    END IF;

    v_nights := (NEW.end_date - NEW.start_date);
    IF v_nights <= 0 THEN v_nights := 1; END IF;

    v_base_amount := COALESCE(NEW.total_price, NEW.base_price, 0);
    v_total_amount := v_base_amount;

    INSERT INTO invoices (org_id, owner_id, invoice_date, due_date, total_amount, status, invoice_type, billed_name, billed_email)
    VALUES (
      NEW.org_id, v_owner_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
      0, 'draft', 'afterpayment',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id)
    )
    RETURNING id INTO v_invoice_id;

    -- Base price (amount calculated from qty * unit_price)
    IF v_base_amount > 0 THEN
      INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
      VALUES (
        v_invoice_id,
        format('Hundpensionat %s - %s (%s nätter)', NEW.start_date, NEW.end_date, v_nights),
        v_nights,
        v_base_amount / v_nights
      );
    END IF;

    -- Booking services
    BEGIN
      FOR v_booking_service IN
        SELECT bs.quantity, bs.unit_price, bs.total_price, bs.staff_notes, COALESCE(ps.label, 'Tilläggstjänst') as service_name
        FROM booking_services bs
        LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
        WHERE bs.booking_id = NEW.id
      LOOP
        v_description := v_booking_service.service_name;
        IF v_booking_service.staff_notes IS NOT NULL THEN
          v_description := v_description || ' - ' || v_booking_service.staff_notes;
        END IF;

        INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
        VALUES (
          v_invoice_id,
          v_description,
          v_booking_service.quantity,
          v_booking_service.unit_price
        );

        v_total_amount := v_total_amount + v_booking_service.total_price;
      END LOOP;
    EXCEPTION 
      WHEN undefined_table THEN RAISE NOTICE 'booking_services tabellen finns inte';
    END;

    -- Extra services
    FOR v_extra_service IN
      SELECT service_type, frequency, price, notes
      FROM extra_service
      WHERE dogs_id = NEW.dog_id AND org_id = NEW.org_id AND COALESCE(is_active, true) = true
        AND start_date <= NEW.end_date AND (end_date IS NULL OR end_date >= NEW.start_date)
    LOOP
      v_description := v_extra_service.service_type;
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;
      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || ' - ' || v_extra_service.notes;
      END IF;

      v_service_price := v_extra_service.price;
      IF v_service_price IS NULL THEN
        BEGIN
          SELECT price INTO v_service_price FROM extra_services
          WHERE label = v_extra_service.service_type AND org_id = NEW.org_id AND COALESCE(is_active, true) = true
          LIMIT 1;
        EXCEPTION WHEN OTHERS THEN v_service_price := 0; END;
      END IF;
      v_service_price := COALESCE(v_service_price, 0);

      IF v_service_price > 0 THEN
        INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
        VALUES (v_invoice_id, v_description, 1, v_service_price);
        v_total_amount := v_total_amount + v_service_price;
      END IF;
    END LOOP;

    -- Discount
    IF NEW.discount_amount > 0 THEN
      INSERT INTO invoice_items (invoice_id, description, qty, unit_price)
      VALUES (v_invoice_id, 'Rabatt', 1, -NEW.discount_amount);
      v_total_amount := v_total_amount - NEW.discount_amount;
    END IF;

    UPDATE invoices SET total_amount = GREATEST(v_total_amount, 0) WHERE id = v_invoice_id;
    UPDATE bookings SET afterpayment_invoice_id = v_invoice_id WHERE id = NEW.id;
    RAISE NOTICE '✅ Faktura % skapad för bokning %', v_invoice_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER trg_create_prepayment_invoice
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_prepayment_invoice();

CREATE TRIGGER trg_create_invoice_on_checkout
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_on_checkout();
