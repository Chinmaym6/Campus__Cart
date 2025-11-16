-- Add description columns for locations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='items' AND column_name='location_description') THEN
        ALTER TABLE items ADD COLUMN location_description TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='items' AND column_name='meetup_description') THEN
        ALTER TABLE items ADD COLUMN meetup_description TEXT;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND column_name IN ('location_description', 'meetup_description', 'location_text', 'meetup_location_text')
ORDER BY column_name;
