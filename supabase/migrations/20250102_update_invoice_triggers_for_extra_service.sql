-- ================================================================
-- UPPDATERA FAKTURA-TRIGGERS FÖR ATT INKLUDERA EXTRA_SERVICE
-- ================================================================
-- Detta uppdaterar befintliga checkout-triggers för att inkludera
-- hundens återkommande tillägg från extra_service tabellen.
-- ================================================================

-- ================================================================
-- UPPDATERAD FUNKTION: create_invoice_on_checkout
-- ================================================================
-- Nu inkluderar den:
-- 1. Bokningens grundpris (total_price)
-- 2. Tillval från booking_services (om de finns)
-- 3. Återkommande tillägg från extra_service (aktiva under bokningsperioden)
-- 4. Rabatter (discount_amount)

CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_owner_id UUID;
  v_total_amount NUMERIC := 0;
  v_base_amount NUMERIC := 0;
  v_extra_service RECORD;
  v_booking_service RECORD;
  v_description TEXT;
  v_nights INTEGER;
  v_org RECORD;
BEGIN
  -- Skapa faktura endast när status ändras till 'checked_out'
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    
    -- Hämta owner_id från hunden
    SELECT owner_id INTO v_owner_id 
    FROM dogs 
    WHERE id = NEW.dog_id;

    -- Hämta org för moms
    SELECT * INTO v_org FROM orgs WHERE id = NEW.org_id;

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
      billed_email,
      billed_address,
      billed_city,
      billed_postal_code,
      notes
    )
    VALUES (
      NEW.org_id,
      v_owner_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      0, -- Uppdateras nedan
      'draft',
      'full',
      (SELECT full_name FROM owners WHERE id = v_owner_id),
      (SELECT email FROM owners WHERE id = v_owner_id),
      (SELECT address FROM owners WHERE id = v_owner_id),
      (SELECT city FROM owners WHERE id = v_owner_id),
      (SELECT postal_code FROM owners WHERE id = v_owner_id),
      format('Faktura för pensionatvistelse %s - %s', NEW.start_date, NEW.end_date)
    )
    RETURNING id INTO v_invoice_id;

    -- RAD 1: Grundpris för bokningen
    v_description := format('Hundpensionat: %s%sPeriod: %s - %s (%s nätter)',
      (SELECT dog_name FROM dogs WHERE id = NEW.dog_id),
      E'\n',
      NEW.start_date,
      NEW.end_date,
      v_nights
    );

    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      total_amount,
      tax_rate
    )
    VALUES (
      v_invoice_id,
      v_description,
      v_nights,
      v_base_amount / v_nights,
      v_base_amount,
      COALESCE(v_org.vat_rate, 25)
    );

    -- RAD 2: Tillval från booking_services (om de finns)
    FOR v_booking_service IN
      SELECT 
        bs.*,
        ps.label as service_name
      FROM booking_services bs
      LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
      WHERE bs.booking_id = NEW.id
    LOOP
      v_description := COALESCE(v_booking_service.service_name, 'Tilläggstjänst');
      
      IF v_booking_service.staff_notes IS NOT NULL THEN
        v_description := v_description || E'\n' || v_booking_service.staff_notes;
      END IF;

      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount,
        tax_rate
      )
      VALUES (
        v_invoice_id,
        v_description,
        v_booking_service.quantity,
        v_booking_service.unit_price,
        v_booking_service.total_price,
        COALESCE(v_org.vat_rate, 25)
      );

      v_total_amount := v_total_amount + v_booking_service.total_price;
    END LOOP;

    -- RAD 3: Återkommande tillägg från extra_service
    -- (endast de som är aktiva under bokningsperioden)
    FOR v_extra_service IN
      SELECT 
        es.*
      FROM extra_service es
      WHERE es.dogs_id = NEW.dog_id
        AND es.org_id = NEW.org_id
        AND es.is_active = true
        AND es.start_date <= NEW.end_date
        AND (es.end_date IS NULL OR es.end_date >= NEW.start_date)
    LOOP
      v_description := v_extra_service.service_type;
      
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;

      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || E'\n' || v_extra_service.notes;
      END IF;

      -- Hämta pris (från extra_service eller från katalog)
      DECLARE
        v_service_price NUMERIC;
      BEGIN
        IF v_extra_service.price IS NOT NULL THEN
          v_service_price := v_extra_service.price;
        ELSE
          -- Hämta från katalogtabell
          SELECT price INTO v_service_price
          FROM extra_services
          WHERE label = v_extra_service.service_type
            AND org_id = NEW.org_id
            AND is_active = true
          LIMIT 1;
        END IF;

        v_service_price := COALESCE(v_service_price, 0);

        IF v_service_price > 0 THEN
          INSERT INTO invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total_amount,
            tax_rate
          )
          VALUES (
            v_invoice_id,
            v_description,
            1,
            v_service_price,
            v_service_price,
            COALESCE(v_org.vat_rate, 25)
          );

          v_total_amount := v_total_amount + v_service_price;
        END IF;
      END;
    END LOOP;

    -- RAD 4: Rabatt (om det finns)
    IF NEW.discount_amount > 0 THEN
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount,
        tax_rate
      )
      VALUES (
        v_invoice_id,
        'Rabatt',
        1,
        -NEW.discount_amount,
        -NEW.discount_amount,
        0
      );

      v_total_amount := v_total_amount - NEW.discount_amount;
    END IF;

    -- Uppdatera fakturans totalsumma
    UPDATE invoices
    SET total_amount = v_total_amount
    WHERE id = v_invoice_id;

    -- Uppdatera bokningen med faktura-ID
    UPDATE bookings 
    SET afterpayment_invoice_id = v_invoice_id
    WHERE id = NEW.id;

    RAISE NOTICE '✅ Faktura skapad: % för bokning % (Totalt: % kr)', v_invoice_id, NEW.id, v_total_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- UPPDATERA TRIGGER (om den inte redan finns)
-- ================================================================
DROP TRIGGER IF EXISTS trg_create_invoice_on_checkout ON bookings;

CREATE TRIGGER trg_create_invoice_on_checkout
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'checked_out' AND OLD.status != 'checked_out')
EXECUTE FUNCTION create_invoice_on_checkout();

-- ================================================================
-- KOMMENTAR
-- ================================================================
COMMENT ON FUNCTION create_invoice_on_checkout IS 
'Skapar automatiskt komplett faktura när bokning checkas ut. 
Inkluderar: 
1. Grundpris (logi)
2. Tillval från booking_services
3. Återkommande tillägg från extra_service (aktiva under perioden)
4. Rabatter';

-- ================================================================
-- VERIFIERA ATT TRIGGER ÄR AKTIV
-- ================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_create_invoice_on_checkout'
  AND event_object_table = 'bookings';
