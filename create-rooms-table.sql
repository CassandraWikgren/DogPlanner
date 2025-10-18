-- Skapa rooms-tabellen i din riktiga Supabase databas
-- Kör denna SQL-kod i din Supabase SQL editor

-- === SKAPA ENDAST DET SOM BEHÖVS ===

-- === RUM (SUPER MINIMAL) ===
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lägg till index för performance
CREATE INDEX IF NOT EXISTS idx_rooms_org_id ON rooms(org_id);

-- Aktivera Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Lägg till RLS policy (super öppen för nu)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON rooms;
CREATE POLICY "Allow all for authenticated users" ON rooms
  FOR ALL USING (true);

-- Lägg till kommentar
COMMENT ON TABLE rooms IS 'Rum för dagis och pensionat - minimal version';

-- Lägg till testdata
INSERT INTO rooms (name) VALUES 
  ('Stora rummet'),
  ('Lilla rummet'),
  ('Dagisrummet'),
  ('Vardagsrummet'),
  ('Utomhusområdet')
ON CONFLICT DO NOTHING;