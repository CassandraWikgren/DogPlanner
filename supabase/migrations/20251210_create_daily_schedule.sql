-- =====================================================
-- Migration: Create daily_schedule table for Hunddagis
-- Datum: 2025-12-10
-- Beskrivning: Dagligt schema för aktiviteter med hundar
-- =====================================================

-- Skapa daily_schedule tabell
CREATE TABLE IF NOT EXISTS daily_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  activity_type TEXT CHECK (activity_type IN ('walk', 'play', 'feeding', 'rest', 'grooming', 'training', 'other')) NOT NULL,
  activity_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  dogs TEXT[] NOT NULL DEFAULT '{}', -- Array of dog IDs
  staff_member TEXT,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabbare queries
CREATE INDEX IF NOT EXISTS idx_daily_schedule_org_id ON daily_schedule(org_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON daily_schedule(date);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_org_date ON daily_schedule(org_id, date);

-- Enable RLS
ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their org's schedule
CREATE POLICY "Users can view their org's daily schedule"
  ON daily_schedule FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create schedule entries for their org
CREATE POLICY "Users can create daily schedule entries"
  ON daily_schedule FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their org's schedule
CREATE POLICY "Users can update daily schedule entries"
  ON daily_schedule FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can delete their org's schedule
CREATE POLICY "Users can delete daily schedule entries"
  ON daily_schedule FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_daily_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_schedule_updated_at
  BEFORE UPDATE ON daily_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_schedule_updated_at();

-- Kommentar
COMMENT ON TABLE daily_schedule IS 'Dagligt schema för hunddagis-aktiviteter';
COMMENT ON COLUMN daily_schedule.activity_type IS 'Typ av aktivitet: walk, play, feeding, rest, grooming, training, other';
COMMENT ON COLUMN daily_schedule.dogs IS 'Array med dog IDs som deltar i aktiviteten';
COMMENT ON COLUMN daily_schedule.completed IS 'Om aktiviteten är genomförd';
