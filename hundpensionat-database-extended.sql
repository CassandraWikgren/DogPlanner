-- Utöka hundpensionat med komplett databas-struktur
-- Fas 1: Databas & Prislogik för hundpensionat

-- Utöka dogs-tabellen med alla nya fält för hundpensionat
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS height_cm INTEGER; -- Mankhöjd för storlekskategorisering
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS allergies TEXT; -- Allergier/intoleranser  
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_type VARCHAR(100); -- Typ av foder (egen/pensionatets)
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS food_amount_per_day NUMERIC(5,2); -- Mängd foder per dag
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS feeding_times_per_day INTEGER; -- Antal utfodringar per dag
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS feeding_instructions TEXT; -- Särskilda utfodrings-instruktioner
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS medication TEXT; -- Mediciner och instruktioner
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS behavior_notes TEXT; -- Beteendeinformation
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS destroys_things BOOLEAN DEFAULT FALSE; -- Biter sönder saker
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_be_with_other_dogs BOOLEAN DEFAULT TRUE; -- Kan vara med andra hundar
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS previous_stays TEXT; -- Tidigare vistelser hos pensionatet
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS vaccination_dhp DATE; -- DHP-vaccination (3 år)
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS vaccination_pi DATE; -- PI/kennelhosta (1 år)
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_in_heat BOOLEAN DEFAULT FALSE; -- Hunden löper
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_afraid_of_noise BOOLEAN DEFAULT FALSE; -- Skott-/åskrädd
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS can_play_with_friends BOOLEAN DEFAULT TRUE; -- Får leka med hundkompisar
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS photo_consent BOOLEAN DEFAULT FALSE; -- Godkänner publicering av foto
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS special_needs TEXT; -- Övriga anteckningar/särskilda behov
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS photo_url TEXT; -- URL till hundens bild

-- Funktion för automatisk storlekskategorisering baserat på mankhöjd
CREATE OR REPLACE FUNCTION get_dog_size_category(height_cm INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF height_cm IS NULL THEN
        RETURN 'medium'; -- Default om ingen höjd angiven
    ELSIF height_cm <= 35 THEN
        RETURN 'small';
    ELSIF height_cm <= 55 THEN
        RETURN 'medium'; 
    ELSE
        RETURN 'large';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att beräkna erforderlig yta enligt Jordbruksverket
CREATE OR REPLACE FUNCTION calculate_required_area(height_cm INTEGER)
RETURNS NUMERIC(4,1) AS $$
BEGIN
    IF height_cm IS NULL THEN
        RETURN 2.0; -- Default för okänd storlek
    ELSIF height_cm < 25 THEN
        RETURN 2.0;
    ELSIF height_cm <= 35 THEN
        RETURN 2.0;
    ELSIF height_cm <= 45 THEN
        RETURN 2.5;
    ELSIF height_cm <= 55 THEN
        RETURN 3.5;
    ELSIF height_cm <= 65 THEN
        RETURN 4.5;
    ELSE
        RETURN 5.5;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Säsongspriser och pristeman
CREATE TABLE IF NOT EXISTS pricing_seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    season_name VARCHAR(100) NOT NULL,
    season_type VARCHAR(20) NOT NULL CHECK (season_type IN ('high', 'low', 'normal')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_multiplier NUMERIC(3,2) DEFAULT 1.00, -- Multiplikator för grundpris
    price_addition NUMERIC(8,2) DEFAULT 0.00, -- Fast tillägg per natt
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helgdagar och högtider
CREATE TABLE IF NOT EXISTS special_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date_name VARCHAR(100) NOT NULL,
    date_value DATE NOT NULL,
    date_type VARCHAR(20) NOT NULL CHECK (date_type IN ('holiday', 'weekend', 'special')),
    price_multiplier NUMERIC(3,2) DEFAULT 1.00,
    price_addition NUMERIC(8,2) DEFAULT 0.00,
    recurring_yearly BOOLEAN DEFAULT FALSE, -- Återkommer varje år
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prislistor för pensionat (ersätter/utökar befintlig prices-tabell)
CREATE TABLE IF NOT EXISTS pensionat_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dog_size VARCHAR(20) NOT NULL CHECK (dog_size IN ('small', 'medium', 'large')),
    price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('weekday', 'weekend', 'holiday')),
    price_per_night NUMERIC(8,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, dog_size, price_type)
);

-- Tillvalstjänster för pensionat  
CREATE TABLE IF NOT EXISTS pensionat_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL, -- 'grooming', 'care', 'exercise', 'food', 'special'
    description TEXT,
    price_small NUMERIC(8,2), -- Pris för små hundar
    price_medium NUMERIC(8,2), -- Pris för medelstora hundar  
    price_large NUMERIC(8,2), -- Pris för stora hundar
    price_flat NUMERIC(8,2), -- Fast pris oavsett storlek
    is_per_day BOOLEAN DEFAULT FALSE, -- Om tjänsten är per dag eller engångs
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kundrabatter (permanenta och tillfälliga)
CREATE TABLE IF NOT EXISTS customer_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    discount_type VARCHAR(30) NOT NULL CHECK (discount_type IN ('loyalty', 'multi_dog', 'long_stay', 'custom')),
    discount_name VARCHAR(100) NOT NULL,
    discount_percentage NUMERIC(5,2), -- Procentuell rabatt
    discount_amount NUMERIC(8,2), -- Fast rabatt-belopp
    is_permanent BOOLEAN DEFAULT TRUE, -- Permanent rabatt på konto
    valid_from DATE,
    valid_until DATE,
    min_nights INTEGER, -- Minimum antal nätter för långtidsrabatt
    min_dogs INTEGER, -- Minimum antal hundar för flerhundsrabatt
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utöka bookings-tabellen för pensionat-specifika fält
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(8,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_calculated_price NUMERIC(8,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_breakdown JSONB; -- Detaljerad prisuppdelning
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- Bokning-tillval koppling (många-till-många)
CREATE TABLE IF NOT EXISTS booking_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES pensionat_services(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(8,2) NOT NULL, -- Pris när tjänsten bokades (för historik)
    total_price NUMERIC(8,2) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utöka rooms-tabellen för pensionat-specifika behov
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(6,2); -- Yta i kvadratmeter
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_dogs_override INTEGER; -- Manuell gräns för antal hundar
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_amenities TEXT[]; -- Bekvämligheter i rummet
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_notes TEXT;

-- Journal/anteckningar för hundvistelser
CREATE TABLE IF NOT EXISTS stay_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    staff_member VARCHAR(100),
    journal_type VARCHAR(30) NOT NULL CHECK (journal_type IN ('checkin', 'checkout', 'feeding', 'exercise', 'behavior', 'health', 'service', 'general')),
    title VARCHAR(200),
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexer för prestanda
CREATE INDEX IF NOT EXISTS idx_dogs_height_cm ON dogs(height_cm);
CREATE INDEX IF NOT EXISTS idx_dogs_allergies ON dogs USING gin(to_tsvector('swedish', allergies));
CREATE INDEX IF NOT EXISTS idx_pricing_seasons_org_dates ON pricing_seasons(org_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_special_dates_org_date ON special_dates(org_id, date_value);
CREATE INDEX IF NOT EXISTS idx_pensionat_prices_org_size_type ON pensionat_prices(org_id, dog_size, price_type);
CREATE INDEX IF NOT EXISTS idx_pensionat_services_org_category ON pensionat_services(org_id, service_category);
CREATE INDEX IF NOT EXISTS idx_customer_discounts_owner ON customer_discounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_stay_journals_booking_date ON stay_journals(booking_id, entry_date);

-- RLS policies för nya tabeller
ALTER TABLE pricing_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pensionat_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pensionat_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_journals ENABLE ROW LEVEL SECURITY;

-- RLS policies (samma mönster för alla nya tabeller)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN VALUES 
        ('pricing_seasons'), ('special_dates'), ('pensionat_prices'), 
        ('pensionat_services'), ('customer_discounts'), ('booking_services'), ('stay_journals')
    LOOP
        EXECUTE format('
            CREATE POLICY "Users can view %I for their organization" ON %I
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.user_id = auth.uid() 
                        AND user_profiles.org_id = %I.org_id
                    )
                );
        ', table_name, table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can insert %I for their organization" ON %I
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.user_id = auth.uid() 
                        AND user_profiles.org_id = %I.org_id
                    )
                );
        ', table_name, table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can update %I for their organization" ON %I
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.user_id = auth.uid() 
                        AND user_profiles.org_id = %I.org_id
                    )
                );
        ', table_name, table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can delete %I for their organization" ON %I
                FOR DELETE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.user_id = auth.uid() 
                        AND user_profiles.org_id = %I.org_id
                    )
                );
        ', table_name, table_name, table_name);
    END LOOP;
END $$;

-- Triggers för automatisk org_id och updated_at
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN VALUES 
        ('pricing_seasons'), ('special_dates'), ('pensionat_prices'), 
        ('pensionat_services'), ('customer_discounts'), ('stay_journals')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_%I_org_id ON %I;
            CREATE TRIGGER set_%I_org_id
                BEFORE INSERT ON %I
                FOR EACH ROW
                EXECUTE FUNCTION set_org_id_from_user();
        ', table_name, table_name, table_name, table_name);
        
        -- Updated_at trigger för tabeller som har det fältet
        IF table_name IN ('pricing_seasons', 'pensionat_prices', 'pensionat_services', 'customer_discounts') THEN
            EXECUTE format('
                DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
                CREATE TRIGGER update_%I_updated_at
                    BEFORE UPDATE ON %I
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            ', table_name, table_name, table_name, table_name);
        END IF;
    END LOOP;
END $$;

-- Funktion för automatisk prisberäkning
CREATE OR REPLACE FUNCTION calculate_pensionat_price(
    p_org_id UUID,
    p_dog_id UUID,
    p_checkin_date DATE,
    p_checkout_date DATE,
    p_service_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB AS $$
DECLARE
    v_dog_height INTEGER;
    v_dog_size VARCHAR(20);
    v_owner_id UUID;
    v_total_price NUMERIC(8,2) := 0;
    v_total_nights INTEGER;
    v_base_price NUMERIC(8,2);
    v_current_date DATE;
    v_night_price NUMERIC(8,2);
    v_season_multiplier NUMERIC(3,2);
    v_season_addition NUMERIC(8,2);
    v_special_multiplier NUMERIC(3,2);
    v_special_addition NUMERIC(8,2);
    v_price_breakdown JSONB := '{}';
    v_night_details JSONB := '[]';
    v_service_price NUMERIC(8,2);
    v_discount_total NUMERIC(8,2) := 0;
    v_result JSONB;
BEGIN
    -- Hämta hundens information
    SELECT height_cm, owner_id INTO v_dog_height, v_owner_id
    FROM dogs WHERE id = p_dog_id;
    
    -- Bestäm hundens storlekskategori
    v_dog_size := get_dog_size_category(v_dog_height);
    
    -- Beräkna antal nätter
    v_total_nights := p_checkout_date - p_checkin_date;
    
    -- Gå igenom varje natt och beräkna pris
    FOR i IN 0..(v_total_nights - 1) LOOP
        v_current_date := p_checkin_date + i;
        
        -- Grundpris baserat på veckodag
        SELECT price_per_night INTO v_base_price
        FROM pensionat_prices 
        WHERE org_id = p_org_id 
        AND dog_size = v_dog_size 
        AND price_type = CASE 
            WHEN EXTRACT(dow FROM v_current_date) IN (0, 6) THEN 'weekend'
            ELSE 'weekday'
        END
        AND active = TRUE;
        
        v_night_price := COALESCE(v_base_price, 0);
        
        -- Kontrollera säsongstillägg
        SELECT price_multiplier, price_addition INTO v_season_multiplier, v_season_addition
        FROM pricing_seasons
        WHERE org_id = p_org_id
        AND v_current_date BETWEEN start_date AND end_date
        AND active = TRUE
        ORDER BY price_multiplier DESC
        LIMIT 1;
        
        -- Kontrollera specialdagar
        SELECT price_multiplier, price_addition INTO v_special_multiplier, v_special_addition
        FROM special_dates
        WHERE org_id = p_org_id
        AND (date_value = v_current_date OR 
             (recurring_yearly = TRUE AND 
              EXTRACT(month FROM date_value) = EXTRACT(month FROM v_current_date) AND
              EXTRACT(day FROM date_value) = EXTRACT(day FROM v_current_date)))
        AND active = TRUE
        ORDER BY price_multiplier DESC
        LIMIT 1;
        
        -- Applicera tillägg och multiplikationer
        v_night_price := v_night_price * COALESCE(v_season_multiplier, 1.0) * COALESCE(v_special_multiplier, 1.0);
        v_night_price := v_night_price + COALESCE(v_season_addition, 0) + COALESCE(v_special_addition, 0);
        
        v_total_price := v_total_price + v_night_price;
        
        -- Spara detaljer för denna natt
        v_night_details := v_night_details || jsonb_build_object(
            'date', v_current_date,
            'base_price', v_base_price,
            'season_multiplier', COALESCE(v_season_multiplier, 1.0),
            'season_addition', COALESCE(v_season_addition, 0),
            'special_multiplier', COALESCE(v_special_multiplier, 1.0),
            'special_addition', COALESCE(v_special_addition, 0),
            'final_price', v_night_price
        );
    END LOOP;
    
    -- Beräkna tillvalstjänster
    v_service_price := 0;
    IF array_length(p_service_ids, 1) > 0 THEN
        SELECT SUM(
            CASE 
                WHEN v_dog_size = 'small' THEN COALESCE(price_small, price_flat)
                WHEN v_dog_size = 'medium' THEN COALESCE(price_medium, price_flat)
                WHEN v_dog_size = 'large' THEN COALESCE(price_large, price_flat)
                ELSE price_flat
            END
        ) INTO v_service_price
        FROM pensionat_services
        WHERE id = ANY(p_service_ids) AND org_id = p_org_id AND active = TRUE;
    END IF;
    
    -- Beräkna rabatter
    SELECT SUM(
        CASE 
            WHEN discount_percentage IS NOT NULL THEN (v_total_price + v_service_price) * (discount_percentage / 100)
            ELSE COALESCE(discount_amount, 0)
        END
    ) INTO v_discount_total
    FROM customer_discounts
    WHERE owner_id = v_owner_id 
    AND org_id = p_org_id
    AND active = TRUE
    AND (valid_from IS NULL OR v_current_date >= valid_from)
    AND (valid_until IS NULL OR v_current_date <= valid_until)
    AND (min_nights IS NULL OR v_total_nights >= min_nights);
    
    -- Bygg resultat
    v_result := jsonb_build_object(
        'dog_size', v_dog_size,
        'total_nights', v_total_nights,
        'accommodation_price', v_total_price,
        'services_price', COALESCE(v_service_price, 0),
        'discount_total', COALESCE(v_discount_total, 0),
        'final_price', v_total_price + COALESCE(v_service_price, 0) - COALESCE(v_discount_total, 0),
        'night_details', v_night_details,
        'calculation_date', CURRENT_TIMESTAMP
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Testdata för olika pristyper och säsonger
INSERT INTO pensionat_prices (org_id, dog_size, price_type, price_per_night) VALUES 
((SELECT id FROM organizations LIMIT 1), 'small', 'weekday', 280.00),
((SELECT id FROM organizations LIMIT 1), 'small', 'weekend', 320.00),
((SELECT id FROM organizations LIMIT 1), 'small', 'holiday', 380.00),
((SELECT id FROM organizations LIMIT 1), 'medium', 'weekday', 320.00),
((SELECT id FROM organizations LIMIT 1), 'medium', 'weekend', 370.00),
((SELECT id FROM organizations LIMIT 1), 'medium', 'holiday', 420.00),
((SELECT id FROM organizations LIMIT 1), 'large', 'weekday', 380.00),
((SELECT id FROM organizations LIMIT 1), 'large', 'weekend', 430.00),
((SELECT id FROM organizations LIMIT 1), 'large', 'holiday', 480.00);

-- Testdata för säsonger
INSERT INTO pricing_seasons (org_id, season_name, season_type, start_date, end_date, price_multiplier) VALUES
((SELECT id FROM organizations LIMIT 1), 'Sommarsäsong', 'high', '2024-06-15', '2024-08-15', 1.25),
((SELECT id FROM organizations LIMIT 1), 'Vintersäsong', 'low', '2024-11-01', '2024-03-31', 0.90),
((SELECT id FROM organizations LIMIT 1), 'Sportlov', 'high', '2024-02-19', '2024-02-25', 1.15);

-- Testdata för specialdagar  
INSERT INTO special_dates (org_id, date_name, date_value, date_type, price_addition, recurring_yearly) VALUES
((SELECT id FROM organizations LIMIT 1), 'Julafton', '2024-12-24', 'holiday', 100.00, TRUE),
((SELECT id FROM organizations LIMIT 1), 'Nyårsafton', '2024-12-31', 'holiday', 150.00, TRUE),
((SELECT id FROM organizations LIMIT 1), 'Midsommarafton', '2024-06-21', 'holiday', 75.00, TRUE),
((SELECT id FROM organizations LIMIT 1), 'Valborgsmässoafton', '2024-04-30', 'holiday', 50.00, TRUE);

-- Testdata för tillvalstjänster
INSERT INTO pensionat_services (org_id, service_name, service_category, description, price_small, price_medium, price_large) VALUES
((SELECT id FROM organizations LIMIT 1), 'Hundbad', 'grooming', 'Tvättning och torkning av hund', 150.00, 200.00, 250.00),
((SELECT id FROM organizations LIMIT 1), 'Kloklippning', 'grooming', 'Klippning av klor', 100.00, 100.00, 120.00),
((SELECT id FROM organizations LIMIT 1), 'Öronrengöring', 'grooming', 'Rengöring av öron', 80.00, 80.00, 80.00),
((SELECT id FROM organizations LIMIT 1), 'Tasstrim', 'grooming', 'Trimning av tassar', 120.00, 140.00, 160.00),
((SELECT id FROM organizations LIMIT 1), 'Spapaket', 'grooming', 'Bad, kloklipp, öronrengöring och tasstrim', 300.00, 400.00, 500.00),
((SELECT id FROM organizations LIMIT 1), 'Extra mattillfälle', 'food', 'Ytterligare måltid under dagen', 50.00, 60.00, 70.00),
((SELECT id FROM organizations LIMIT 1), 'Löptillägg', 'special', 'Extra tillsyn för tikар i löp', 25.00, 25.00, 25.00),
((SELECT id FROM organizations LIMIT 1), 'Valptillägg', 'special', 'Extra tillsyn för valpar under 1 år', 30.00, 30.00, 30.00),
((SELECT id FROM organizations LIMIT 1), 'Hämtning/lämning utanför tid', 'special', 'Transport utanför ordinarie reception', NULL, NULL, NULL);

-- Uppdatera tillvalstjänst med fast pris
UPDATE pensionat_services 
SET price_flat = 200.00 
WHERE service_name = 'Hämtning/lämning utanför tid';

-- Testdata för kundrabatter
INSERT INTO customer_discounts (org_id, owner_id, discount_type, discount_name, discount_percentage, min_nights, min_dogs) VALUES
((SELECT id FROM organizations LIMIT 1), (SELECT id FROM owners LIMIT 1), 'long_stay', 'Långtidsrabatt 10+ nätter', 10.00, 10, NULL),
((SELECT id FROM organizations LIMIT 1), (SELECT id FROM owners LIMIT 1), 'multi_dog', 'Flerhundsrabatt', 15.00, NULL, 2);

COMMIT;