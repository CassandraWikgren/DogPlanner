-- ============================================================
-- TEMPORÄR LÖSNING: Stäng av RLS under utveckling
-- ============================================================
-- OBS: Detta är BARA för utveckling!
-- I produktion ska RLS vara aktiverat för säkerhet
-- ============================================================

-- Stäng av RLS på viktiga tabeller
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daycare_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daycare_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_prices DISABLE ROW LEVEL SECURITY;

-- Verifiera att RLS är avstängt
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'bookings', 'owners', 'dogs', 'applications', 
    'invoices', 'invoice_items', 'orgs', 'profiles'
  )
ORDER BY tablename;

-- Du ska nu se rowsecurity = false för alla tabeller ovan
