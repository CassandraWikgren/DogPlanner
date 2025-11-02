-- Migration: Rätta till skillnaden mellan extra_services (katalog) och extra_service (hundkoppling)
-- Datum: 2025-01-02

-- =======================================
-- 1. Säkerställ att extra_services (katalog) existerar
-- =======================================
CREATE TABLE IF NOT EXISTS extra_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  branch_id uuid,
  label text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL,
  service_type text CHECK (service_type IN ('boarding', 'daycare', 'grooming', 'both', 'all')) DEFAULT 'all',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;

-- RLS policy för development
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extra_services' 
    AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON extra_services
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Lägg till comment
COMMENT ON TABLE extra_services IS 
'Priskatalog för tilläggstjänster (plural). Används i admin-sidor för att definiera vilka tjänster som finns och deras priser.';

-- =======================================
-- 2. Uppdatera extra_service (singular) om nödvändigt
-- =======================================
-- Kontrollera om tabellen har fel struktur (label istället för dogs_id)
-- Om ja, skapa om den med rätt struktur

DO $$ 
BEGIN
  -- Kolla om extra_service har kolumnen 'label' (fel struktur)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_service' AND column_name = 'label'
  ) THEN
    -- Byt namn på gamla tabellen
    ALTER TABLE extra_service RENAME TO extra_service_old_catalog;
    
    -- Skapa ny korrekt tabell
    CREATE TABLE extra_service (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      dogs_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
      service_type text NOT NULL,
      frequency text DEFAULT '1',
      price numeric(10, 2),
      notes text,
      start_date date NOT NULL DEFAULT CURRENT_DATE,
      org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
      branch_id uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE extra_service ENABLE ROW LEVEL SECURITY;
    
    -- RLS policy
    CREATE POLICY "Allow all for authenticated users" ON extra_service
      FOR ALL USING (auth.role() = 'authenticated');
    
    RAISE NOTICE 'Extra_service har omskapats med korrekt struktur. Gamla data finns i extra_service_old_catalog om migration behövs.';
  ELSE
    RAISE NOTICE 'Extra_service har redan korrekt struktur (dogs_id-koppling).';
  END IF;
END $$;

-- =======================================
-- 3. Säkerställ indexes (endast för kolumner som finns)
-- =======================================
CREATE INDEX IF NOT EXISTS idx_extra_services_org_id ON extra_services(org_id);
CREATE INDEX IF NOT EXISTS idx_extra_services_service_type ON extra_services(service_type);

CREATE INDEX IF NOT EXISTS idx_extra_service_dogs_id ON extra_service(dogs_id);
CREATE INDEX IF NOT EXISTS idx_extra_service_org_id ON extra_service(org_id);

-- Skapa branch_id index endast om kolumnen finns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_services' AND column_name = 'branch_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_extra_services_branch_id ON extra_services(branch_id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extra_service' AND column_name = 'branch_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_extra_service_branch_id ON extra_service(branch_id);
  END IF;
END $$;

-- =======================================
-- 4. Lägg till comments (endast för kolumner som finns)
-- =======================================
COMMENT ON TABLE extra_service IS 
'Hundspecifik koppling till tilläggstjänster (singular). Kopplar en specifik hund till en tjänst, t.ex. "Bella har kloklipp 1 ggr/mån".';

COMMENT ON TABLE extra_services IS 
'Priskatalog för tilläggstjänster (plural). Används i admin-sidor för att definiera vilka tjänster som finns och deras priser.';

-- Säkra kommentarer endast om kolumnen finns
DO $$
BEGIN
  -- Comments för extra_service
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_service' AND column_name = 'dogs_id') THEN
    COMMENT ON COLUMN extra_service.dogs_id IS 'Referens till hunden som har tjänsten';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_service' AND column_name = 'service_type') THEN
    COMMENT ON COLUMN extra_service.service_type IS 'Typ av tjänst, t.ex. "kloklipp", "medicin", "specialmat"';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_service' AND column_name = 'frequency') THEN
    COMMENT ON COLUMN extra_service.frequency IS 'Frekvens, t.ex. "1" (en gång), "2" (två gånger per dag)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_service' AND column_name = 'start_date') THEN
    COMMENT ON COLUMN extra_service.start_date IS 'Startdatum för tjänsten';
  END IF;

  -- Comments för extra_services
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_services' AND column_name = 'label') THEN
    COMMENT ON COLUMN extra_services.label IS 'Namn på tjänsten i katalogen';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_services' AND column_name = 'price') THEN
    COMMENT ON COLUMN extra_services.price IS 'Pris för tjänsten';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_services' AND column_name = 'unit') THEN
    COMMENT ON COLUMN extra_services.unit IS 'Enhet: "per gång", "per dag", "fast pris"';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extra_services' AND column_name = 'service_type') THEN
    COMMENT ON COLUMN extra_services.service_type IS 'Vilken typ av bokning tjänsten gäller för: boarding, daycare, grooming, both, all';
  END IF;
END $$;
