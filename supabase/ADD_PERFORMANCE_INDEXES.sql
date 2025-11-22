-- ============================================================
-- DATABASE INDEXES FOR PERFORMANCE
-- ============================================================
-- Purpose: Lägg till indexes på foreign keys och ofta queried kolumner
-- Run this in Supabase SQL Editor
-- Estimated time: < 1 minut
-- ============================================================

-- Kolla befintliga indexes först
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- FOREIGN KEY INDEXES
-- ============================================

-- bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_org_id ON public.bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dog_id ON public.bookings(dog_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON public.bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_end_date ON public.bookings(end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_org_status ON public.bookings(org_id, status); -- Composite för dashboard queries

-- dogs table
CREATE INDEX IF NOT EXISTS idx_dogs_org_id ON public.dogs(org_id);
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogs_name ON public.dogs(name); -- För sökningar

-- owners table
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON public.owners(org_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON public.owners(email); -- För login/sökning
CREATE INDEX IF NOT EXISTS idx_owners_phone ON public.owners(phone); -- För sökning
CREATE INDEX IF NOT EXISTS idx_owners_customer_number ON public.owners(customer_number); -- Redan PK men explicit

-- invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_id ON public.invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date); -- För påminnelser
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);

-- invoice_items table
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- rooms table
CREATE INDEX IF NOT EXISTS idx_rooms_org_id ON public.rooms(org_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);

-- extra_service table
CREATE INDEX IF NOT EXISTS idx_extra_service_org_id ON public.extra_service(org_id);
CREATE INDEX IF NOT EXISTS idx_extra_service_dogs_id ON public.extra_service(dogs_id);

-- booking_services table (om den finns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON public.booking_services(booking_id);
        CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON public.booking_services(service_id);
    END IF;
END $$;

-- grooming_bookings table (om den finns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grooming_bookings') THEN
        CREATE INDEX IF NOT EXISTS idx_grooming_bookings_org_id ON public.grooming_bookings(org_id);
        CREATE INDEX IF NOT EXISTS idx_grooming_bookings_dog_id ON public.grooming_bookings(dog_id);
        CREATE INDEX IF NOT EXISTS idx_grooming_bookings_status ON public.grooming_bookings(status);
        CREATE INDEX IF NOT EXISTS idx_grooming_bookings_appointment_date ON public.grooming_bookings(appointment_date);
    END IF;
END $$;

-- dog_journal table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dog_journal') THEN
        CREATE INDEX IF NOT EXISTS idx_dog_journal_org_id ON public.dog_journal(org_id);
        CREATE INDEX IF NOT EXISTS idx_dog_journal_dog_id ON public.dog_journal(dog_id);
        CREATE INDEX IF NOT EXISTS idx_dog_journal_created_at ON public.dog_journal(created_at DESC); -- För timeline
    END IF;
END $$;

-- interest_applications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_applications') THEN
        CREATE INDEX IF NOT EXISTS idx_interest_applications_org_id ON public.interest_applications(org_id);
        CREATE INDEX IF NOT EXISTS idx_interest_applications_status ON public.interest_applications(status);
        CREATE INDEX IF NOT EXISTS idx_interest_applications_created_at ON public.interest_applications(created_at DESC);
    END IF;
END $$;

-- ============================================
-- ANALYZE TABLES
-- ============================================
-- Uppdatera statistik för query planner
ANALYZE public.bookings;
ANALYZE public.dogs;
ANALYZE public.owners;
ANALYZE public.invoices;
ANALYZE public.profiles;
ANALYZE public.rooms;

-- ============================================
-- VERIFIERING
-- ============================================
-- Kolla att alla indexes skapades
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- PERFORMANCE TIPS
-- ============================================
-- Composite indexes för vanliga query patterns:
-- 
-- 1. Hämta bokningar för org med status:
--    SELECT * FROM bookings WHERE org_id = ? AND status = 'confirmed'
--    ✅ idx_bookings_org_status täcker denna
--
-- 2. Hämta kommande bokningar:
--    SELECT * FROM bookings WHERE start_date >= CURRENT_DATE ORDER BY start_date
--    ✅ idx_bookings_start_date täcker denna
--
-- 3. Sök hundar för ägare:
--    SELECT * FROM dogs WHERE owner_id = ?
--    ✅ idx_dogs_owner_id täcker denna
--
-- 4. Hitta förfallna fakturor:
--    SELECT * FROM invoices WHERE status = 'unpaid' AND due_date < CURRENT_DATE
--    Kan behöva composite: CREATE INDEX idx_invoices_status_due ON invoices(status, due_date);

-- ============================================
-- MAINTENANCE
-- ============================================
-- Kör REINDEX periodiskt (varje månad) för optimal prestanda:
-- REINDEX TABLE public.bookings;
-- REINDEX TABLE public.dogs;
-- REINDEX TABLE public.owners;
-- REINDEX TABLE public.invoices;
