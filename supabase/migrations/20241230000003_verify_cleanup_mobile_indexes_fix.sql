-- Migration: Verify cleanup_mobile_indexes function has been fixed
-- This migration verifies that the cleanup_mobile_indexes function
-- now has a proper search_path setting to prevent security issues

-- Check if cleanup_mobile_indexes function exists and has proper search_path
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'cleanup_mobile_indexes'
    ) THEN
        RAISE NOTICE 'Function public.cleanup_mobile_indexes exists';
        
        -- Check if it has proper search_path setting
        IF EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'cleanup_mobile_indexes'
            AND p.proconfig IS NOT NULL
            AND 'search_path=public,pg_temp' = ANY(p.proconfig)
        ) THEN
            RAISE NOTICE 'Function public.cleanup_mobile_indexes has proper search_path setting';
        ELSE
            RAISE WARNING 'Function public.cleanup_mobile_indexes does not have proper search_path setting';
        END IF;
    ELSE
        RAISE NOTICE 'Function public.cleanup_mobile_indexes does not exist';
    END IF;
END
$$;

-- Query to show all functions with mutable search_path (should be empty after fix)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NO search_path SET (MUTABLE)'
        WHEN 'search_path=public,pg_temp' = ANY(p.proconfig) THEN 'FIXED'
        ELSE 'OTHER search_path: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'private')
AND p.prosecdef = true  -- Only SECURITY DEFINER functions
ORDER BY n.nspname, p.proname;

-- Show specific details for cleanup_mobile_indexes if it exists
SELECT 
    'cleanup_mobile_indexes function details:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    p.proconfig as config_settings,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'cleanup_mobile_indexes';