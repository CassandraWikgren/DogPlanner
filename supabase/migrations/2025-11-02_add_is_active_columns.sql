-- 2025-11-02
-- Add missing is_active columns to all relevant tables
-- This fixes "column does not exist" errors in production

BEGIN;

-- Lägg till is_active på alla relevanta tabeller
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.price_lists ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.boarding_prices ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Uppdatera alla NULL värden till true
UPDATE public.rooms SET is_active = true WHERE is_active IS NULL;
UPDATE public.dogs SET is_active = true WHERE is_active IS NULL;
UPDATE public.owners SET is_active = true WHERE is_active IS NULL;
UPDATE public.subscriptions SET is_active = true WHERE is_active IS NULL;
UPDATE public.bookings SET is_active = true WHERE is_active IS NULL;
UPDATE public.price_lists SET is_active = true WHERE is_active IS NULL;
UPDATE public.boarding_prices SET is_active = true WHERE is_active IS NULL;

-- OBS: org_subscriptions har redan is_active från tidigare migration

COMMIT;
