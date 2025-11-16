-- Check current enum values in the database
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'item_condition'::regtype 
ORDER BY enumsortorder;
