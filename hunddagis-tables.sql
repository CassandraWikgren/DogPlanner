-- Lägg till tabeller för hunddagis-funktionalitet
-- Interest applications table för ansökningar om hunddagisplats
CREATE TABLE IF NOT EXISTS interest_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    dog_name VARCHAR(255) NOT NULL,
    dog_breed VARCHAR(100),
    dog_age INTEGER,
    dog_size VARCHAR(20) NOT NULL CHECK (dog_size IN ('small', 'medium', 'large')),
    preferred_start_date DATE,
    preferred_days TEXT[], -- Array of preferred days
    special_needs TEXT,
    previous_daycare_experience BOOLEAN,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily schedule table för dagliga aktiviteter
CREATE TABLE IF NOT EXISTS daily_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('walk', 'play', 'feeding', 'rest', 'grooming', 'training', 'other')),
    activity_name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    dogs UUID[] NOT NULL DEFAULT '{}', -- Array of dog IDs
    staff_member VARCHAR(255),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_interest_applications_org_id ON interest_applications(org_id);
CREATE INDEX IF NOT EXISTS idx_interest_applications_status ON interest_applications(status);
CREATE INDEX IF NOT EXISTS idx_interest_applications_created_at ON interest_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_schedule_org_id ON daily_schedule(org_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON daily_schedule(date);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_time_slot ON daily_schedule(time_slot);

-- RLS policies för interest_applications
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interest_applications for their organization" ON interest_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = interest_applications.org_id
        )
    );

CREATE POLICY "Users can insert interest_applications for their organization" ON interest_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = interest_applications.org_id
        )
    );

CREATE POLICY "Users can update interest_applications for their organization" ON interest_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = interest_applications.org_id
        )
    );

-- RLS policies för daily_schedule
ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily_schedule for their organization" ON daily_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = daily_schedule.org_id
        )
    );

CREATE POLICY "Users can insert daily_schedule for their organization" ON daily_schedule
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = daily_schedule.org_id
        )
    );

CREATE POLICY "Users can update daily_schedule for their organization" ON daily_schedule
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = daily_schedule.org_id
        )
    );

CREATE POLICY "Users can delete daily_schedule for their organization" ON daily_schedule
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.org_id = daily_schedule.org_id
        )
    );

-- Lägg till triggers för automatisk uppdatering av updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interest_applications_updated_at ON interest_applications;
CREATE TRIGGER update_interest_applications_updated_at
    BEFORE UPDATE ON interest_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_schedule_updated_at ON daily_schedule;
CREATE TRIGGER update_daily_schedule_updated_at
    BEFORE UPDATE ON daily_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Lägg till org_id automatiskt via trigger för nya rader
CREATE OR REPLACE FUNCTION set_org_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_id IS NULL THEN
        NEW.org_id := (
            SELECT org_id FROM user_profiles 
            WHERE user_id = auth.uid() 
            LIMIT 1
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_interest_applications_org_id ON interest_applications;
CREATE TRIGGER set_interest_applications_org_id
    BEFORE INSERT ON interest_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_org_id_from_user();

DROP TRIGGER IF EXISTS set_daily_schedule_org_id ON daily_schedule;
CREATE TRIGGER set_daily_schedule_org_id
    BEFORE INSERT ON daily_schedule
    FOR EACH ROW
    EXECUTE FUNCTION set_org_id_from_user();

-- Lägg till testdata för intresseanmälningar
INSERT INTO interest_applications (
    org_id, parent_name, parent_email, parent_phone, dog_name, dog_breed, 
    dog_age, dog_size, preferred_start_date, preferred_days, 
    special_needs, previous_daycare_experience, status
) VALUES 
(
    (SELECT id FROM organizations LIMIT 1),
    'Anna Andersson', 'anna@example.com', '070-123-4567', 'Bella', 'Golden Retriever',
    3, 'large', '2024-12-01', ARRAY['monday', 'tuesday', 'wednesday'],
    'Behöver extra motion', true, 'pending'
),
(
    (SELECT id FROM organizations LIMIT 1),
    'Lars Larsson', 'lars@example.com', '070-987-6543', 'Zorro', 'Border Collie',
    2, 'medium', '2024-11-15', ARRAY['monday', 'wednesday', 'friday'],
    'Mycket energisk, behöver mental stimulans', true, 'contacted'
),
(
    (SELECT id FROM organizations LIMIT 1),
    'Maria Nilsson', 'maria@example.com', '070-555-1234', 'Pixie', 'Chihuahua',
    5, 'small', '2024-11-20', ARRAY['tuesday', 'thursday'],
    'Lite blyg med andra hundar', false, 'pending'
);

-- Lägg till testdata för dagligt schema
INSERT INTO daily_schedule (
    org_id, date, time_slot, activity_type, activity_name, description,
    location, dogs, staff_member, completed
) VALUES 
(
    (SELECT id FROM organizations LIMIT 1),
    CURRENT_DATE, '08:00', 'walk', 'Morgonpromenad', 'Kort promenad för att börja dagen',
    'Närområdet', ARRAY[]::UUID[], 'Anna', false
),
(
    (SELECT id FROM organizations LIMIT 1),
    CURRENT_DATE, '10:30', 'play', 'Lekstund', 'Fri lek i hunddagishallen',
    'Inomhus', ARRAY[]::UUID[], 'Erik', false
),
(
    (SELECT id FROM organizations LIMIT 1),
    CURRENT_DATE, '12:00', 'feeding', 'Lunch', 'Lunch för alla hundar',
    'Matsal', ARRAY[]::UUID[], 'Anna', true
),
(
    (SELECT id FROM organizations LIMIT 1),
    CURRENT_DATE, '14:00', 'rest', 'Vila', 'Lugn vilostund efter lunch',
    'Vilorum', ARRAY[]::UUID[], NULL, true
),
(
    (SELECT id FROM organizations LIMIT 1),
    CURRENT_DATE, '15:30', 'walk', 'Eftermiddagspromenad', 'Längre promenad i skogen',
    'Skogen', ARRAY[]::UUID[], 'Erik', false
);

COMMIT;