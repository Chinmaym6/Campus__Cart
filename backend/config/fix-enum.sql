-- Drop and recreate the item_condition enum with correct values
-- First, we need to drop dependent objects temporarily

-- Step 1: Alter the column to use varchar temporarily
ALTER TABLE items ALTER COLUMN condition TYPE varchar(50);

-- Step 2: Drop the old enum
DROP TYPE IF EXISTS item_condition CASCADE;

-- Step 3: Create the enum with correct values
CREATE TYPE item_condition AS ENUM ('brand_new', 'like_new', 'good', 'fair', 'for_parts');

-- Step 4: Convert the column back to the enum type
ALTER TABLE items ALTER COLUMN condition TYPE item_condition USING condition::item_condition;

-- Verify the enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'item_condition'::regtype ORDER BY enumsortorder;
