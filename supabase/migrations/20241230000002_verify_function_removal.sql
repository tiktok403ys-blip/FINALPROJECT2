-- Verification: Check if refresh_casino_stats_mobile function still exists
-- This query will show any functions with 'refresh_casino_stats' in the name
-- If the function was successfully removed, this should return no results

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%refresh_casino_stats%';

-- Also check for any remaining references in pg_proc
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND proname LIKE '%refresh_casino_stats%';

-- If no results are returned from both queries above,
-- then refresh_casino_stats_mobile function has