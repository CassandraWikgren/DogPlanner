-- =====================================================
-- ÅRSABONNEMANG + AVBOKNINGSSYSTEM
-- =====================================================
-- Datum: 2025-11-30
-- Beskrivning: Lägger till stöd för årliga abonnemang 
--              med pro-rata återbetalning vid avbrott
-- =====================================================

BEGIN;

-- 1. Lägg till kolumner för att spåra abonnemang
ALTER TABLE public.orgs 
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;

COMMENT ON COLUMN public.orgs.subscription_start_date IS 'När betalat abonnemang startade (används för pro-rata återbetalning)';
COMMENT ON COLUMN public.orgs.billing_period IS 'monthly eller yearly - avgör vilka Price IDs som används';
COMMENT ON COLUMN public.orgs.stripe_subscription_id IS 'Stripe Subscription ID för att kunna avbryta/återbetala';
COMMENT ON COLUMN public.orgs.stripe_customer_id IS 'Stripe Customer ID för återbetalningar';
COMMENT ON COLUMN public.orgs.subscription_cancelled_at IS 'När abonnemanget avbröts (NULL = aktivt)';

-- 2. Funktion för att beräkna återbetalning vid avbrott av årsabonnemang
CREATE OR REPLACE FUNCTION calculate_yearly_refund(
  p_org_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_org record;
  v_months_used integer;
  v_monthly_price numeric;
  v_yearly_price numeric;
  v_amount_used numeric;
  v_refund_amount numeric;
BEGIN
  -- Hämta organisation
  SELECT * INTO v_org
  FROM orgs
  WHERE id = p_org_id;

  -- Kolla att det är ett årsabonnemang
  IF v_org.billing_period != 'yearly' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Endast årsabonnemang kan återbetalas pro-rata',
      'refund_amount', 0
    );
  END IF;

  -- Kolla att det finns ett startdatum
  IF v_org.subscription_start_date IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Inget startdatum hittades',
      'refund_amount', 0
    );
  END IF;

  -- Beräkna antal månader sedan start (avrundat uppåt)
  v_months_used := CEIL(
    EXTRACT(EPOCH FROM (NOW() - v_org.subscription_start_date)) / (30 * 24 * 60 * 60)
  );

  -- Bestäm månadspris och årspris baserat på service_types
  -- OBS: Dessa behöver matchas mot faktiska Stripe-priser
  CASE
    -- Endast hundfrisör
    WHEN v_org.service_types = ARRAY['hundfrisor'] THEN
      v_monthly_price := 199;
      v_yearly_price := 1788;
    
    -- Endast hunddagis
    WHEN v_org.service_types = ARRAY['hunddagis'] THEN
      v_monthly_price := 399;
      v_yearly_price := 4188;
    
    -- Endast hundpensionat
    WHEN v_org.service_types = ARRAY['hundpensionat'] THEN
      v_monthly_price := 399;
      v_yearly_price := 4188;
    
    -- 2 tjänster (alla kombinationer)
    WHEN array_length(v_org.service_types, 1) = 2 THEN
      v_monthly_price := 599;
      v_yearly_price := 6588;
    
    -- Alla 3 tjänster
    WHEN array_length(v_org.service_types, 1) = 3 THEN
      v_monthly_price := 799;
      v_yearly_price := 8988;
    
    ELSE
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'Kunde inte bestämma prisplan',
        'refund_amount', 0
      );
  END CASE;

  -- Beräkna använt belopp (månader × månadspris)
  v_amount_used := v_months_used * v_monthly_price;

  -- Beräkna återbetalning (får ej vara negativt)
  v_refund_amount := GREATEST(0, v_yearly_price - v_amount_used);

  -- Returnera resultat
  RETURN jsonb_build_object(
    'eligible', true,
    'months_used', v_months_used,
    'monthly_price', v_monthly_price,
    'yearly_price', v_yearly_price,
    'amount_used', v_amount_used,
    'refund_amount', v_refund_amount,
    'calculation', format(
      '%s kr (årspris) - (%s mån × %s kr) = %s kr återbetalning',
      v_yearly_price, v_months_used, v_monthly_price, v_refund_amount
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_yearly_refund IS 
  'Beräknar pro-rata återbetalning för årsabonnemang baserat på använd tid i månadspris';

-- 3. Index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_subscription_id 
  ON public.orgs(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_orgs_stripe_customer_id 
  ON public.orgs(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_orgs_billing_period 
  ON public.orgs(billing_period);

-- 4. Sätt default-värden för befintliga orgs
UPDATE public.orgs 
SET billing_period = 'monthly'
WHERE billing_period IS NULL;

COMMIT;

-- =====================================================
-- VERIFIERING
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration klar: ADD_YEARLY_SUBSCRIPTIONS';
  RAISE NOTICE '   - Kolumner tillagda: subscription_start_date, billing_period, stripe_subscription_id, stripe_customer_id, subscription_cancelled_at';
  RAISE NOTICE '   - Funktion skapad: calculate_yearly_refund()';
  RAISE NOTICE '   - Index skapade för Stripe lookups';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Nästa steg:';
  RAISE NOTICE '   1. Skapa årliga priser i Stripe Dashboard';
  RAISE NOTICE '   2. Uppdatera .env.local med STRIPE_PRICE_ID_*_YEARLY';
  RAISE NOTICE '   3. Testa: SELECT calculate_yearly_refund(''<org_id>'');';
END $$;
