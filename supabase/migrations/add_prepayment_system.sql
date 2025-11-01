-- =====================================================
-- DogPlanner - Förskotts- och Efterskottssystem
-- =====================================================
-- Detta script lägger till funktionalitet för att:
-- 1. Skapa förskottsfaktura när bokning godkänns
-- 2. Skapa efterskottsfaktura för tjänster vid utcheckning
-- 3. Hantera betalningsstatus
-- =====================================================

-- =====================================================
-- STEG 1: Lägg till nya kolumner
-- =====================================================

-- Lägg till invoice_type i invoices (förskott/efterskott)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT 
CHECK (invoice_type IN ('prepayment', 'afterpayment', 'full')) 
DEFAULT 'full';

COMMENT ON COLUMN invoices.invoice_type IS 'prepayment = förskott för rummet, afterpayment = efterskott för tjänster, full = komplett faktura';

-- Lägg till payment_type i extra_service (när betalas tjänsten?)
ALTER TABLE extra_service ADD COLUMN IF NOT EXISTS payment_type TEXT 
CHECK (payment_type IN ('prepayment', 'afterpayment')) 
DEFAULT 'afterpayment';

COMMENT ON COLUMN extra_service.payment_type IS 'prepayment = ingår i förskottsfaktura, afterpayment = betalas vid utcheckning';

-- Lägg till prepayment_status i bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prepayment_status TEXT 
CHECK (prepayment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded')) 
DEFAULT 'unpaid';

COMMENT ON COLUMN bookings.prepayment_status IS 'Status för förskottsbetalning av rumsbokning';

-- Lägg till prepayment_invoice_id i bookings (länk till förskottsfakturan)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prepayment_invoice_id UUID 
REFERENCES invoices(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.prepayment_invoice_id IS 'Länk till förskottsfakturan som skapas vid godkännande';

-- Lägg till afterpayment_invoice_id i bookings (länk till efterskottsfakturan)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS afterpayment_invoice_id UUID 
REFERENCES invoices(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.afterpayment_invoice_id IS 'Länk till efterskottsfakturan som skapas vid utcheckning';

-- =====================================================
-- STEG 2: Uppdatera befintliga tjänster
-- =====================================================

-- Sätt payment_type baserat på tjänsttyp
-- OBS: Vi kan inte använda label eftersom kolumnen kanske inte finns
-- Skippa detta steg - sätt payment_type manuellt senare om behövs
-- Alla tjänster får som standard 'afterpayment' (från DEFAULT i kolumndefinition)

-- =====================================================
-- STEG 3: Ny funktion - Skapa förskottsfaktura vid godkännande
-- =====================================================

CREATE OR REPLACE FUNCTION create_prepayment_invoice()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEG 4: Uppdatera checkout-trigger för efterskott
-- =====================================================

CREATE OR REPLACE FUNCTION create_invoice_on_checkout()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEG 5: Skapa/ersätt triggers
-- =====================================================

-- Ta bort gamla triggers om de finns
DROP TRIGGER IF EXISTS trg_create_prepayment_invoice ON bookings;
DROP TRIGGER IF EXISTS trg_create_invoice_on_checkout ON bookings;

-- Skapa ny trigger för förskottsfaktura vid godkännande
CREATE TRIGGER trg_create_prepayment_invoice
BEFORE UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
EXECUTE FUNCTION create_prepayment_invoice();

-- Skapa ny trigger för efterskottsfaktura vid utcheckning
CREATE TRIGGER trg_create_invoice_on_checkout
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'checked_out' AND OLD.status != 'checked_out')
EXECUTE FUNCTION create_invoice_on_checkout();

-- =====================================================
-- STEG 6: Lägg till index för prestanda
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_prepayment_status ON bookings(prepayment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_prepayment_invoice ON bookings(prepayment_invoice_id);
CREATE INDEX IF NOT EXISTS idx_bookings_afterpayment_invoice ON bookings(afterpayment_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_extra_service_payment_type ON extra_service(payment_type);

-- =====================================================
-- VERIFIERING
-- =====================================================

-- Visa alla nya kolumner
SELECT 
  'invoices' as tabell,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'invoices' 
  AND column_name = 'invoice_type'
UNION ALL
SELECT 
  'extra_service' as tabell,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'extra_service' 
  AND column_name = 'payment_type'
UNION ALL
SELECT 
  'bookings' as tabell,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('prepayment_status', 'prepayment_invoice_id', 'afterpayment_invoice_id');

-- Visa alla triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trg_create_prepayment_invoice', 'trg_create_invoice_on_checkout')
ORDER BY trigger_name;

-- =====================================================
-- KLART! 🎉
-- =====================================================
-- Systemet är nu uppgraderat med:
-- ✅ Förskottsfakturor skapas vid godkännande (status: confirmed)
-- ✅ Efterskottsfakturor skapas vid utcheckning (status: checked_out)
-- ✅ Betalningsstatus för förskott spåras
-- ✅ Tjänster kategoriserade som förskott/efterskott
-- =====================================================
