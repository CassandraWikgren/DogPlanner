-- Migration: Add belongings and bed_location to bookings table
-- Date: 2025-11-15
-- Purpose: Track guest belongings and bed assignments for boarding bookings

-- Add new columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS belongings TEXT,
ADD COLUMN IF NOT EXISTS bed_location TEXT;

-- Add comments for documentation
COMMENT ON COLUMN bookings.belongings IS 'Items brought by guest (toys, blankets, food, etc)';
COMMENT ON COLUMN bookings.bed_location IS 'Assigned bed or room location for the dog';

-- Create index for faster queries on bed_location (useful for room management)
CREATE INDEX IF NOT EXISTS idx_bookings_bed_location ON bookings(bed_location);

-- Grant permissions (if needed)
-- RLS policies will inherit from existing bookings table policies
