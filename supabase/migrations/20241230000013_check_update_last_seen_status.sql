-- Migration: Check public.update_last_seen Function Status
-- Purpose: Analyze current status of update_last_seen function and its search_path configuration
-- Date: 2024-12-30

DO $$
DECLARE
    func_exists boolean;
    func_config text[];
    func_security text;
    func_source text;
BEGIN
    RAISE NOTICE '=== CHECKING public.update_last_seen FUNCTION STATUS ===';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Function public.update_last_seen EXISTS';
        
        -- Get function configuration
        SELECT 
            p.proconfig,
            CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END,
            p.prosrc
        INTO func_config, func_security, func_source
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
        LIMIT 1;
        
        RAISE NOTICE 'Security Type: %', func_security;
        
        -- Check search_path configuration
        IF func_config IS NULL THEN
            RAISE NOTICE 'search_path: NOT SET (MUTABLE - SECURITY RISK!)';
        ELSE
            RAISE NOTICE 'search_path: % (CONFIGURED)', array_to_string(func_config, ', ');
        END IF;
        
        RAISE NOTICE 'Function Source Code:';
        RAISE NOTICE '%', func_source;
        
    ELSE
        RAISE NOTICE 'Function public.update_last_seen DOES NOT EXIST';
        RAISE NOTICE 'This function needs to be created with proper search_path configuration';
    END IF;
    
    -- Security recommendations
    RAISE NOTICE '=== SECURITY RECOMMENDATIONS ===';
    RAISE NOTICE '1. Function should have: SET search_path = ''public, pg_catalog''';
    RAISE NOTICE '2. Consider SECURITY DEFINER if function needs elevated privileges';
    RAISE NOTICE '3. REVOKE EXECUTE FROM PUBLIC if not needed by anonymous users';
    RAISE NOTICE '4. GRANT EXECUTE TO authenticated role only';
    RAISE NOTICE '5. Ensure RLS policies cover any table operations';
    
END $$;

-- Show function permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
AND routine_name = 'update_last_seen'
ORDER BY grantee, privilege_type;

-- Audit all functions with mutable search_path
DO $$
BEGIN
    RAISE NOTICE '=== AUDIT: ALL FUNCTIONS WITH MUTABLE SEARCH_PATH ===';
END $$;

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTABLE (RISK!)'
        ELSE 'CONFIGURED'
    END as search_path_status,
    COALESCE(array_to_string(p.proconfig, ', '), 'NOT SET') as current_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proconfig IS NULL
ORDER BY p.proname;

DO $$
BEGIN
    RAISE NOTICE 'Migration check completed. Review the output above for security issues.';
END $$;