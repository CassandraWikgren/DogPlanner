-- ============================================================
-- SNABB FIX: Frisörsidan fungerar inte
-- ============================================================
-- Fel: "TypeError: Load failed (fhdkkkujnhteetllxypg.supabase.co)"
--
-- Troliga orsaker:
-- 1. Grooming-tabellerna finns inte i databasen
-- 2. RLS är aktiverad utan policies
-- 3. Du saknar behörighet
--
-- Kör detta script i Supabase SQL Editor!
-- ============================================================

-- STEG 1: Kontrollera om tabellerna finns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'grooming_bookings') THEN
    RAISE NOTICE '❌ grooming_bookings SAKNAS - skapar nu...';
    
    -- Skapa grooming_bookings
    CREATE TABLE IF NOT EXISTS public.grooming_bookings (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      org_id uuid REFERENCES public.orgs(id),
      dog_id uuid REFERENCES public.dogs(id),
      appointment_date date NOT NULL,
      appointment_time time without time zone,
      service_type text NOT NULL,
      estimated_price numeric,
      status text DEFAULT 'confirmed'::text NOT NULL,
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      external_customer_name text,
      external_customer_phone text,
      external_dog_name text,
      external_dog_breed text,
      clip_length text,
      shampoo_type text,
      CONSTRAINT grooming_bookings_status_check CHECK (
        status = ANY (ARRAY['confirmed'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])
      )
    );
    
    CREATE INDEX idx_grooming_bookings_org_date ON public.grooming_bookings(org_id, appointment_date);
    CREATE INDEX idx_grooming_bookings_dog_id ON public.grooming_bookings(dog_id);
    
    RAISE NOTICE '✅ grooming_bookings skapad!';
  ELSE
    RAISE NOTICE '✅ grooming_bookings finns redan';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'grooming_journal') THEN
    RAISE NOTICE '❌ grooming_journal SAKNAS - skapar nu...';
    
    -- Skapa grooming_journal
    CREATE TABLE IF NOT EXISTS public.grooming_journal (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      org_id uuid REFERENCES public.orgs(id),
      dog_id uuid REFERENCES public.dogs(id),
      appointment_date date NOT NULL,
      service_type text NOT NULL,
      clip_length text,
      shampoo_type text,
      coat_condition text,
      before_photos jsonb,
      after_photos jsonb,
      notes text,
      price_charged numeric,
      created_at timestamp with time zone DEFAULT now(),
      external_customer_name text,
      external_dog_name text
    );
    
    CREATE INDEX idx_grooming_journal_org_date ON public.grooming_journal(org_id, appointment_date);
    CREATE INDEX idx_grooming_journal_dog_id ON public.grooming_journal(dog_id);
    
    RAISE NOTICE '✅ grooming_journal skapad!';
  ELSE
    RAISE NOTICE '✅ grooming_journal finns redan';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'grooming_prices') THEN
    RAISE NOTICE '❌ grooming_prices SAKNAS - skapar nu...';
    
    -- Skapa grooming_prices
    CREATE TABLE IF NOT EXISTS public.grooming_prices (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      org_id uuid REFERENCES public.orgs(id),
      service_label text NOT NULL,
      dog_size text,
      base_price numeric NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      UNIQUE(org_id, service_label, dog_size)
    );
    
    CREATE INDEX idx_grooming_prices_org_id ON public.grooming_prices(org_id);
    
    RAISE NOTICE '✅ grooming_prices skapad!';
  ELSE
    RAISE NOTICE '✅ grooming_prices finns redan';
  END IF;
END $$;


-- STEG 2: Stäng av RLS (enklaste lösningen för dev)
-- ============================================================
ALTER TABLE grooming_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_journal DISABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_prices DISABLE ROW LEVEL SECURITY;

-- ✅ Nu ska RLS vara avstängt för alla grooming-tabeller


-- STEG 3: Verifiera att allt fungerar
-- ============================================================
SELECT 
  'grooming_bookings' as tabell,
  (SELECT COUNT(*) FROM grooming_bookings) as antal_rader,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'grooming_bookings') as rls_aktiv
UNION ALL
SELECT 
  'grooming_journal' as tabell,
  (SELECT COUNT(*) FROM grooming_journal) as antal_rader,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'grooming_journal') as rls_aktiv
UNION ALL
SELECT 
  'grooming_prices' as tabell,
  (SELECT COUNT(*) FROM grooming_prices) as antal_rader,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'grooming_prices') as rls_aktiv;

-- Förväntat resultat:
-- grooming_bookings | 0 (eller mer) | false
-- grooming_journal  | 0 (eller mer) | false
-- grooming_prices   | 0 (eller mer) | false


-- STEG 4: Lägg till testdata (valfritt)
-- ============================================================
-- Om du vill ha lite testdata att visa på frisörsidan:

-- INSERT INTO grooming_prices (org_id, service_label, dog_size, base_price)
-- SELECT 
--   org_id,
--   'Badning' as service_label,
--   'Liten' as dog_size,
--   300 as base_price
-- FROM orgs
-- LIMIT 1
-- ON CONFLICT (org_id, service_label, dog_size) DO NOTHING;

-- ✅ Klart! Nu ska frisörsidan fungera!
