-- Fix missing location columns in items table
-- Run this to add the meetup_location and meetup_location_text columns

-- Add meetup_location column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='items' AND column_name='meetup_location') THEN
        ALTER TABLE items ADD COLUMN meetup_location GEOGRAPHY(POINT, 4326);
    END IF;
END $$;

-- Add meetup_location_text column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='items' AND column_name='meetup_location_text') THEN
        ALTER TABLE items ADD COLUMN meetup_location_text VARCHAR(255);
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND column_name IN ('location', 'location_text', 'meetup_location', 'meetup_location_text')
ORDER BY column_name;
