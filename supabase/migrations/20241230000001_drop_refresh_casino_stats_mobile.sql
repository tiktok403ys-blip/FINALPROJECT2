-- Migration: Drop refresh_casino_stats_mobile function if it exists
-- This migration removes any remaining refresh_casino_stats_mobile function
-- that might have been used to refresh the casino_stats_mobile materialized view

-- Check if function exists and drop it
DROP FUNCTION IF EXISTS public.refresh_casino_stats_mobile();
DROP FUNCTION IF EXISTS public.refresh_casino_stats_mobile(text);
DROP FUNCTION IF EXISTS public.refresh_casino_stats_mobile(integer);

-- Add comment for documentation
COMMENT ON SCHEMA public IS 'Removed refresh_casino_stats_mobile function - no longer needed after casino_stats_mobile materialized view removal';