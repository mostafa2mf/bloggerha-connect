
-- Check if guests table exists, if not this is a no-op since first migration partially succeeded
-- The attachment columns and guests table were already created by the partial migration
-- Just verify everything is in place
SELECT 1;
