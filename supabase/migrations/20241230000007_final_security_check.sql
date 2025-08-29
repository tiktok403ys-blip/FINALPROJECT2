-- Migration: Final Security Check for Mutable Search Path Functions
-- This migration provides a comprehensive check of all functions to determine
-- if cleanup_mobile_indexes or any other functions still have mutable search_path issues

-- Check current status of all SECURITY DEFINER functions
DO $$
DECLARE
    func_record RECORD;
    total_functions INTEGER := 0;
    secure_functions INTEGER := 0;
    vulnerable_functions INTEGER := 0;
    cleanup_mobile_exists BOOLEAN := false;
    cleanup_mobile_secure BOOLEAN := false;
BEGIN
    RAISE NOTICE 'Final Security Assessment for Mutable Search Path Functions';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    
    -- Check if cleanup_mobile_indexes exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'cleanup_mobile_indexes'
    ) INTO cleanup_mobile_exists;
    
    IF cleanup_mobile_exists THEN
        RAISE NOTICE 'Function cleanup_mobile_indexes EXISTS in database';
        
        -- Check if it's secure
        SELECT EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'cleanup_mobile_indexes'
            AND p.prosecdef = true
            AND p.proconfig IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM unnest(p.proconfig) AS config
                WHERE config LIKE 'search_path=%'
            )
        ) INTO cleanup_mobile_secure;
        
        IF cleanup_mobile_secure THEN
            RAISE NOTICE 'Function cleanup_mobile_indexes is SECURE (has search_path set)';
        ELSE
            RAISE WARNING 'Function cleanup_mobile_indexes is VULNERABLE (mutable search_path)';
        END IF;
    ELSE
        RAISE NOTICE 'Function cleanup_mobile_indexes DOES NOT EXIST in database';
        RAISE NOTICE 'This suggests the security warning may be a false positive or outdated';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Checking all SECURITY DEFINER functions...';
    RAISE NOTICE '';
    
    -- Count and analyze all SECURITY DEFINER functions
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            CASE 
                WHEN p.proconfig IS NULL THEN 'VULNERABLE'
                WHEN EXISTS (
                    SELECT 1 FROM unnest(p.proconfig) AS config
                    WHERE config LIKE 'search_path=%'
                ) THEN 'SECURE'
                ELSE 'VULNERABLE'
            END as security_status,
            COALESCE(
                (SELECT config FROM unnest(p.proconfig) AS config
                 WHERE config LIKE 'search_path=%' LIMIT 1),
                'NOT SET'
            ) as search_path_config
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- Only SECURITY DEFINER functions
        ORDER BY p.proname
    LOOP
        total_functions := total_functions + 1;
        
        IF func_record.security_status = 'SECURE' THEN
            secure_functions := secure_functions + 1;
            RAISE NOTICE '✓ SECURE: %(%) - %', func_record.function_name, func_record.args, func_record.search_path_config;
        ELSE
            vulnerable_functions := vulnerable_functions + 1;
            RAISE WARNING '✗ VULNERABLE: %(%) - %', func_record.function_name, func_record.args, func_record.search_path_config;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Security Summary:';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', total_functions;
    RAISE NOTICE 'Secure functions: %', secure_functions;
    RAISE NOTICE 'Vulnerable functions: %', vulnerable_functions;
    
    IF vulnerable_functions = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions are secure!';
        RAISE NOTICE 'No mutable search_path vulnerabilities found.';
        
        IF NOT cleanup_mobile_exists THEN
            RAISE NOTICE '';
            RAISE NOTICE 'CONCLUSION: cleanup_mobile_indexes function does not exist.';
            RAISE NOTICE 'The security warning about this function appears to be outdated or a false positive.';
            RAISE NOTICE 'No action is required for this specific function.';
        END IF;
    ELSE
        RAISE WARNING '';
        RAISE WARNING 'SECURITY RISK: % functions still have mutable search_path!', vulnerable_functions;
        RAISE WARNING 'These functions need immediate attention to prevent security vulnerabilities.';
    END IF;
    
END
$$;

-- Show detailed function information for manual verification
SELECT 
    'Detailed Function Analysis:' as section,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTABLE (NO search_path)'
        WHEN EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config
            WHERE config LIKE 'search_path=%'
        ) THEN 'IMMUTABLE (search_path set)'
        ELSE 'OTHER CONFIG'
    END as search_path_status,
    array_to_string(COALESCE(p.proconfig, ARRAY[]::text[]), ', ') as config_details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only SECURITY DEFINER functions
ORDER BY 
    CASE 
        WHEN p.proconfig IS NULL THEN 1  -- Vulnerable functions first
        ELSE 2
    END,
    p.proname;