-- ================================================================
-- AUTOMATISK FAKTURAGENERERING FÖR PENSIONAT & HUNDAGIS
-- ================================================================
-- Detta script skapar en komplett lösning för att generera fakturor
-- baserat på bokningar och tilläggstjänster (extra_service).
--
-- VIKTIGT: Detta säkerställer att INGENTING missas i faktureringen!
-- ================================================================

-- Lägg till invoice_generated boolean på bookings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'invoice_generated'
  ) THEN
    ALTER TABLE bookings ADD COLUMN invoice_generated boolean DEFAULT false;
  END IF;
END $$;

-- Index för snabbare sökning på bokningar som inte fakturerats
CREATE INDEX IF NOT EXISTS idx_bookings_invoice_generated 
  ON bookings(invoice_generated) WHERE invoice_generated = false;

-- ================================================================
-- FUNKTION: Generera faktura från bokning
-- ================================================================
-- Denna funktion skapar en komplett faktura med alla rader:
-- 1. Grundpris för bokningen (accommodation)
-- 2. Alla tillval/extra tjänster från booking_services
-- 3. Alla hundens återkommande tillägg från extra_service
-- 4. Rabatter från owner_discounts
-- ================================================================

CREATE OR REPLACE FUNCTION generate_invoice_from_booking(
  p_booking_id uuid,
  p_invoice_type text DEFAULT 'full', -- 'prepayment', 'afterpayment', 'full'
  p_prepayment_percent numeric DEFAULT 50 -- % av totalpris för förskott
)
RETURNS uuid -- Returnerar invoice_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id uuid;
  v_booking record;
  v_owner record;
  v_org record;
  v_dog record;
  v_total_amount numeric := 0;
  v_base_amount numeric := 0;
  v_services_amount numeric := 0;
  v_recurring_amount numeric := 0;
  v_discount_amount numeric := 0;
  v_invoice_date date := CURRENT_DATE;
  v_due_date date := CURRENT_DATE + INTERVAL '30 days';
  v_description text;
  v_nights integer;
  v_extra_service record;
  v_booking_service record;
BEGIN
  -- Hämta bokningsinformation
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bokning med ID % hittades inte', p_booking_id;
  END IF;

  -- Hämta relaterad data
  SELECT * INTO v_owner FROM owners WHERE id = v_booking.owner_id;
  SELECT * INTO v_org FROM orgs WHERE id = v_booking.org_id;
  SELECT * INTO v_dog FROM dogs WHERE id = v_booking.dog_id;

  -- Beräkna antal nätter
  v_nights := (v_booking.end_date - v_booking.start_date);
  IF v_nights <= 0 THEN
    v_nights := 1;
  END IF;

  -- Använd bokningens totalpris som bas (redan beräknat med säsong etc)
  v_base_amount := COALESCE(v_booking.total_price, v_booking.base_price, 0);

  -- Skapa faktura
  INSERT INTO invoices (
    org_id,
    owner_id,
    invoice_date,
    due_date,
    total_amount, -- Sätts senare
    status,
    billed_name,
    billed_email,
    billed_address,
    billed_city,
    billed_postal_code,
    notes
  ) VALUES (
    v_booking.org_id,
    v_booking.owner_id,
    v_invoice_date,
    v_due_date,
    0, -- Uppdateras nedan
    'draft',
    v_owner.full_name,
    v_owner.email,
    v_owner.address,
    v_owner.city,
    v_owner.postal_code,
    CASE p_invoice_type
      WHEN 'prepayment' THEN 'Förskottsfaktura - ' || p_prepayment_percent || '% av totalkostnad'
      WHEN 'afterpayment' THEN 'Slutfaktura - resterande belopp'
      ELSE 'Faktura för bokningsperiod'
    END || E'\nBokning: ' || v_booking.start_date::text || ' - ' || v_booking.end_date::text
  )
  RETURNING id INTO v_invoice_id;

  -- ================================================================
  -- RAD 1: Grundpris för bokningen (logi/vistelse)
  -- ================================================================
  v_description := 'Hundpensionat: ' || v_dog.dog_name || E'\n' ||
                   'Period: ' || v_booking.start_date::text || ' - ' || v_booking.end_date::text ||
                   ' (' || v_nights || ' nätter)';

  IF p_invoice_type = 'prepayment' THEN
    v_base_amount := v_base_amount * (p_prepayment_percent / 100.0);
    v_description := v_description || E'\nFörskott (' || p_prepayment_percent || '%)';
  ELSIF p_invoice_type = 'afterpayment' THEN
    -- Subtrahera redan betalt förskott
    IF v_booking.deposit_amount IS NOT NULL THEN
      v_base_amount := v_base_amount - v_booking.deposit_amount;
    END IF;
    v_description := v_description || E'\nSlutbetalning';
  END IF;

  INSERT INTO invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    total_amount,
    tax_rate
  ) VALUES (
    v_invoice_id,
    v_description,
    v_nights,
    v_base_amount / v_nights,
    v_base_amount,
    COALESCE(v_org.vat_rate, 25)
  );

  v_total_amount := v_total_amount + v_base_amount;

  -- ================================================================
  -- RAD 2: Tillval som köpts vid bokningen (booking_services)
  -- ================================================================
  -- Exempel: "Hämtning & lämning: 500 kr", "Veterinärbesök: 800 kr"
  FOR v_booking_service IN
    SELECT 
      bs.*,
      ps.label as service_name,
      ps.unit
    FROM booking_services bs
    LEFT JOIN pensionat_services ps ON bs.service_id = ps.id
    WHERE bs.booking_id = p_booking_id
  LOOP
    v_description := v_booking_service.service_name;
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
    ) VALUES (
      v_invoice_id,
      v_description,
      v_booking_service.quantity,
      v_booking_service.unit_price,
      v_booking_service.total_price,
      COALESCE(v_org.vat_rate, 25)
    );

    v_services_amount := v_services_amount + v_booking_service.total_price;
  END LOOP;

  v_total_amount := v_total_amount + v_services_amount;

  -- ================================================================
  -- RAD 3: Återkommande tillägg från hundens extra_service
  -- ================================================================
  -- Exempel: "Kloklipp 1 ggr/mån: 300 kr", "Fodersäck: 799 kr"
  -- Dessa är hundens fasta tillägg som ska faktureras varje period
  FOR v_extra_service IN
    SELECT 
      es.*
    FROM extra_service es
    WHERE es.dogs_id = v_booking.dog_id
      AND es.org_id = v_booking.org_id
      AND es.is_active = true
      -- Kontrollera att tjänsten är aktiv under bokningsperioden
      AND es.start_date <= v_booking.end_date
      AND (es.end_date IS NULL OR es.end_date >= v_booking.start_date)
  LOOP
    v_description := v_extra_service.service_type;
    
    IF v_extra_service.frequency IS NOT NULL THEN
      v_description := v_description || ' (' || v_extra_service.frequency || ')';
    END IF;

    IF v_extra_service.notes IS NOT NULL THEN
      v_description := v_description || E'\n' || v_extra_service.notes;
    END IF;

    -- Om pris finns i extra_service, använd det, annars hämta från extra_services katalog
    DECLARE
      v_service_price numeric;
    BEGIN
      IF v_extra_service.price IS NOT NULL THEN
        v_service_price := v_extra_service.price;
      ELSE
        -- Hämta pris från katalogtabell
        SELECT price INTO v_service_price
        FROM extra_services
        WHERE label = v_extra_service.service_type
          AND org_id = v_booking.org_id
          AND is_active = true
        LIMIT 1;
      END IF;

      v_service_price := COALESCE(v_service_price, 0);

      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount,
        tax_rate
      ) VALUES (
        v_invoice_id,
        v_description,
        1,
        v_service_price,
        v_service_price,
        COALESCE(v_org.vat_rate, 25)
      );

      v_recurring_amount := v_recurring_amount + v_service_price;
    END;
  END LOOP;

  v_total_amount := v_total_amount + v_recurring_amount;

  -- ================================================================
  -- RAD 4: Rabatter (från owner_discounts eller booking.discount_amount)
  -- ================================================================
  IF v_booking.discount_amount > 0 THEN
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      total_amount,
      tax_rate
    ) VALUES (
      v_invoice_id,
      'Rabatt',
      1,
      -v_booking.discount_amount,
      -v_booking.discount_amount,
      0
    );

    v_total_amount := v_total_amount - v_booking.discount_amount;
  END IF;

  -- Uppdatera fakturans totalsumma
  UPDATE invoices
  SET total_amount = v_total_amount
  WHERE id = v_invoice_id;

  -- Uppdatera bokningen med faktura-referens
  IF p_invoice_type = 'prepayment' THEN
    UPDATE bookings
    SET prepayment_invoice_id = v_invoice_id,
        invoice_generated = true
    WHERE id = p_booking_id;
  ELSIF p_invoice_type = 'afterpayment' THEN
    UPDATE bookings
    SET afterpayment_invoice_id = v_invoice_id,
        invoice_generated = true
    WHERE id = p_booking_id;
  ELSE
    UPDATE bookings
    SET afterpayment_invoice_id = v_invoice_id,
        invoice_generated = true
    WHERE id = p_booking_id;
  END IF;

  RETURN v_invoice_id;
END;
$$;

-- ================================================================
-- FUNKTION: Generera månadsfaktura för alla aktiva tilläggstjänster
-- ================================================================
-- Används för att fakturera återkommande tjänster som inte är kopplade
-- till en specifik bokning (t.ex. hunddagis-abonnemang)

CREATE OR REPLACE FUNCTION generate_monthly_extras_invoice(
  p_owner_id uuid,
  p_org_id uuid,
  p_period_start date DEFAULT CURRENT_DATE,
  p_period_end date DEFAULT CURRENT_DATE + INTERVAL '1 month'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id uuid;
  v_owner record;
  v_org record;
  v_total_amount numeric := 0;
  v_extra_service record;
  v_dog record;
  v_description text;
  v_service_price numeric;
BEGIN
  -- Hämta ägare och org
  SELECT * INTO v_owner FROM owners WHERE id = p_owner_id;
  SELECT * INTO v_org FROM orgs WHERE id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ägare eller organisation hittades inte';
  END IF;

  -- Skapa faktura
  INSERT INTO invoices (
    org_id,
    owner_id,
    invoice_date,
    due_date,
    total_amount,
    status,
    billed_name,
    billed_email,
    billed_address,
    billed_city,
    billed_postal_code,
    notes
  ) VALUES (
    p_org_id,
    p_owner_id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0,
    'draft',
    v_owner.full_name,
    v_owner.email,
    v_owner.address,
    v_owner.city,
    v_owner.postal_code,
    'Månadsfaktura för tilläggstjänster' || E'\nPeriod: ' || p_period_start::text || ' - ' || p_period_end::text
  )
  RETURNING id INTO v_invoice_id;

  -- Gå igenom alla hundar som tillhör ägaren
  FOR v_dog IN
    SELECT * FROM dogs WHERE owner_id = p_owner_id AND org_id = p_org_id
  LOOP
    -- Hämta aktiva tilläggstjänster för denna hund
    FOR v_extra_service IN
      SELECT es.*
      FROM extra_service es
      WHERE es.dogs_id = v_dog.id
        AND es.org_id = p_org_id
        AND es.is_active = true
        AND es.start_date <= p_period_end
        AND (es.end_date IS NULL OR es.end_date >= p_period_start)
    LOOP
      v_description := v_dog.dog_name || ': ' || v_extra_service.service_type;
      
      IF v_extra_service.frequency IS NOT NULL THEN
        v_description := v_description || ' (' || v_extra_service.frequency || ')';
      END IF;

      IF v_extra_service.notes IS NOT NULL THEN
        v_description := v_description || E'\n' || v_extra_service.notes;
      END IF;

      -- Hämta pris
      IF v_extra_service.price IS NOT NULL THEN
        v_service_price := v_extra_service.price;
      ELSE
        SELECT price INTO v_service_price
        FROM extra_services
        WHERE label = v_extra_service.service_type
          AND org_id = p_org_id
          AND is_active = true
        LIMIT 1;
      END IF;

      v_service_price := COALESCE(v_service_price, 0);

      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_amount,
        tax_rate
      ) VALUES (
        v_invoice_id,
        v_description,
        1,
        v_service_price,
        v_service_price,
        COALESCE(v_org.vat_rate, 25)
      );

      v_total_amount := v_total_amount + v_service_price;
    END LOOP;
  END LOOP;

  -- Om inga rader skapades, radera fakturan
  IF v_total_amount = 0 THEN
    DELETE FROM invoices WHERE id = v_invoice_id;
    RETURN NULL;
  END IF;

  -- Uppdatera total
  UPDATE invoices
  SET total_amount = v_total_amount
  WHERE id = v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

-- ================================================================
-- VIEW: Bokningar som behöver faktureras
-- ================================================================
CREATE OR REPLACE VIEW bookings_to_invoice AS
SELECT 
  b.id as booking_id,
  b.org_id,
  b.owner_id,
  b.dog_id,
  b.start_date,
  b.end_date,
  b.status,
  b.total_price,
  b.invoice_generated,
  o.full_name as owner_name,
  o.email as owner_email,
  d.dog_name,
  -- Räkna tilläggstjänster från booking_services
  (SELECT COUNT(*) FROM booking_services bs WHERE bs.booking_id = b.id) as booking_services_count,
  -- Räkna återkommande tillägg från extra_service
  (SELECT COUNT(*) 
   FROM extra_service es 
   WHERE es.dogs_id = b.dog_id 
     AND es.is_active = true
     AND es.start_date <= b.end_date
     AND (es.end_date IS NULL OR es.end_date >= b.start_date)
  ) as recurring_services_count
FROM bookings b
LEFT JOIN owners o ON b.owner_id = o.id
LEFT JOIN dogs d ON b.dog_id = d.id
WHERE b.invoice_generated = false
  AND b.status IN ('checked_out', 'confirmed')
  AND b.end_date <= CURRENT_DATE;

COMMENT ON VIEW bookings_to_invoice IS 
'Visar alla bokningar som är klara för fakturering men som ännu inte har fakturerats. 
Inkluderar antal tillvalstjänster och återkommande tillägg för varje bokning.';

-- ================================================================
-- INDEXES FÖR PRESTANDA
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_extra_service_active_period 
  ON extra_service(dogs_id, is_active, start_date, end_date) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_booking_services_booking 
  ON booking_services(booking_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice 
  ON invoice_items(invoice_id);

COMMENT ON FUNCTION generate_invoice_from_booking IS 
'Genererar komplett faktura från en bokning inklusive:
1. Grundpris (logi)
2. Tillval från booking_services
3. Återkommande tillägg från extra_service
4. Rabatter

Returnerar invoice_id. Kan användas för förskotts-, slutfaktura eller full faktura.';

COMMENT ON FUNCTION generate_monthly_extras_invoice IS 
'Genererar månadsfaktura för alla aktiva tilläggstjänster (extra_service) 
för en ägare. Används för återkommande fakturering av abonnemang/tillägg.';
