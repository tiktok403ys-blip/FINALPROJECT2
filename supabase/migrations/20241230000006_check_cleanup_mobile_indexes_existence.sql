-- Migration: Check if cleanup_mobile_indexes function exists
-- This migration checks whether the cleanup_mobile_indexes function actually exists in the database
-- or if it's a false positive in the security scan

-- Check if cleanup_mobile_indexes function exists
DO $$
DECLARE
    func_exists BOOLEAN := false;
    func_details RECORD;
BEGIN
    RAISE NOTICE 'Checking for cleanup_mobile_indexes function...';
    
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'cleanup_mobile_indexes'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Function public.cleanup_mobile_indexes EXISTS';
        
        -- Get function details
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            CASE 
                WHEN p.prosecdef THEN 'SECURITY DEFINER'
                ELSE 'SECURITY INVOKER'
            END as security_type,
            CASE 
                WHEN p.proconfig IS NULL THEN 'NO search_path SET (MUTABLE)'
                WHEN 'search_path=public,pg_temp' = ANY(p.proconfig) THEN 'FIXED'
                ELSE 'OTHER search_path: ' || array_to_string(p.proconfig, ', ')
            END as search_path_status,
            p.proconfig as config_array
        INTO func_details
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'cleanup_mobile_indexes';
        
        RAISE NOTICE 'Function Details:';
        RAISE NOTICE '  Name: %', func_details.function_name;
        RAISE NOTICE '  Arguments: %', func_details.args;
        RAISE NOTICE '  Security Type: %', func_details.security_type;
        RAISE NOTICE '  Search Path Status: %', func_details.search_path_status;
        RAISE NOTICE '  Config Array: %', func_details.config_array;
        
        -- Check if it needs fixing
        IF func_details.security_type = 'SECURITY DEFINER' AND func_details.search_path_status = 'NO search_path SET (MUTABLE)' THEN
            RAISE WARNING 'SECURITY ISSUE: Function cleanup_mobile_indexes has mutable search_path and needs fixing!';
        ELSIF func_details.security_type = 'SECURITY DEFINER' AND func_details.search_path_status = 'FIXED' THEN
            RAISE NOTICE 'SECURE: Function cleanup_mobile_indexes has proper search_path setting';
        ELSE
            RAISE NOTICE 'INFO: Function cleanup_mobile_indexes is not SECURITY DEFINER, no search_path fix needed';
        END IF;
        
    ELSE
        RAISE NOTICE 'Function public.cleanup_mobile_indexes DOES NOT EXIST';
        RAISE NOTICE 'This might be a false positive in the security scan or the function was already removed';
    END IF;
    
END
$$;

-- Show all functions that contain 'cleanup' or 'mobile' in their name
SELECT 
    'Functions containing cleanup or mobile:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NO search_path SET'
        ELSE array_to_string(p.proconfig, ', ')
    END as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proname ILIKE '%cleanup%' OR p.proname ILIKE '%mobile%')
ORDER BY p.proname;

-- Show all SECURITY DEFINER functions with mutable search_path
SELECT 
    'SECURITY DEFINER functions with mutable search_path:' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTABLE (NO search_path SET)'
        WHEN 'search_path=public,pg_temp' = ANY(p.proconfig) THEN 'FIXED'
        ELSE 'OTHER: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only SECURITY DEFINER functions
AND (p.proconfig IS NULL OR NOT EXISTS (
    SELECT 1 FROM unnest(p.proconfig) AS config
    WHERE config LIKE 'search_path=%'
))
ORDER BY p.proname;