-- =====================================================
-- EMERGENCY RLS FIX
-- Aktiverar RLS på alla kritiska tabeller som Supabase flaggar
-- =====================================================

-- 1. AKTIVERA RLS PÅ ALLA KRITISKA TABELLER
-- =====================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_deletion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 2. LÄGG TILL GRUNDLÄGGANDE POLICIES FÖR BOOKINGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view bookings in their org" ON bookings;
CREATE POLICY "Users can view bookings in their org"
    ON bookings FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage bookings in their org" ON bookings;
CREATE POLICY "Users can manage bookings in their org"
    ON bookings FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 3. LÄGG TILL GRUNDLÄGGANDE POLICIES FÖR DOGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view dogs in their org" ON dogs;
CREATE POLICY "Users can view dogs in their org"
    ON dogs FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage dogs in their org" ON dogs;
CREATE POLICY "Users can manage dogs in their org"
    ON dogs FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 4. POLICIES FÖR CONSENT_LOGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view consent logs" ON consent_logs;
CREATE POLICY "Users can view consent logs"
    ON consent_logs FOR SELECT
    USING (true); -- Alla inloggade kan läsa consent logs

DROP POLICY IF EXISTS "Users can insert consent logs" ON consent_logs;
CREATE POLICY "Users can insert consent logs"
    ON consent_logs FOR INSERT
    WITH CHECK (true); -- Alla kan logga samtycke

-- 5. POLICIES FÖR GDPR_DELETION_LOG
-- =====================================================
DROP POLICY IF EXISTS "Admins can view deletion log" ON gdpr_deletion_log;
CREATE POLICY "Admins can view deletion log"
    ON gdpr_deletion_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. POLICIES FÖR GROOMING_BOOKINGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view grooming bookings in their org" ON grooming_bookings;
CREATE POLICY "Users can view grooming bookings in their org"
    ON grooming_bookings FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage grooming bookings in their org" ON grooming_bookings;
CREATE POLICY "Users can manage grooming bookings in their org"
    ON grooming_bookings FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 7. POLICIES FÖR SYSTEM_CONFIG
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage system config" ON system_config;
CREATE POLICY "Admins can manage system config"
    ON system_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. POLICIES FÖR ORG_SUBSCRIPTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their org subscription" ON org_subscriptions;
CREATE POLICY "Users can view their org subscription"
    ON org_subscriptions FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 9. POLICIES FÖR INVOICE_COUNTERS
-- =====================================================
DROP POLICY IF EXISTS "Users can view invoice counters for their org" ON invoice_counters;
CREATE POLICY "Users can view invoice counters for their org"
    ON invoice_counters FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage invoice counters" ON invoice_counters;
CREATE POLICY "System can manage invoice counters"
    ON invoice_counters FOR ALL
    USING (true); -- Service role kan alltid uppdatera

-- 10. POLICIES FÖR BOARDING_PRICES
-- =====================================================
DROP POLICY IF EXISTS "Users can view boarding prices for their org" ON boarding_prices;
CREATE POLICY "Users can view boarding prices for their org"
    ON boarding_prices FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage boarding prices" ON boarding_prices;
CREATE POLICY "Admins can manage boarding prices"
    ON boarding_prices FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- VERIFIERING
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Kolla vilka tabeller som har RLS aktiverat
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
