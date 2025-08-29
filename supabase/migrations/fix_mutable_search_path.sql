-- Migration: Fix Function Search Path Mutable Security Warnings
-- Date: 2025-01-28
-- Purpose: Set immutable search_path for all SECURITY DEFINER functions
-- Security Issue: Functions with mutable search_path can be exploited

-- Step 1: Fix cleanup_expired_rate_limits function specifically
ALTER FUNCTION public.cleanup_expired_rate_limits() SET search_path = public, pg_temp;

-- Step 2: Fix all other SECURITY DEFINER functions with mutable search_path
DO $fix_functions$
DECLARE
    func_record RECORD;
    fix_sql TEXT;
    func_count INTEGER := 0;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting Function Search Path Security Fix Migration';
    RAISE NOTICE '==================================================';
    
    -- Count total functions that need fixing
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true  -- SECURITY DEFINER functions
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    RAISE NOTICE 'Found % functions with mutable search_path that need fixing', func_count;
    RAISE NOTICE '';
    
    -- Fix each function by adding SET search_path = public, pg_temp
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER functions only
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config
            WHERE config LIKE 'search_path=%'
        ))
        ORDER BY p.proname
    LOOP
        BEGIN
            RAISE NOTICE 'Fixing function: %(%)', func_record.function_name, func_record.args;
            
            -- Create the ALTER FUNCTION statement to set search_path
            fix_sql := format(
                'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
                func_record.function_name,
                func_record.args
            );
            
            -- Execute the fix
            EXECUTE fix_sql;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE '✓ Fixed: % - search_path set to "public, pg_temp"', func_record.function_name;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '✗ Failed to fix function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE ' ';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Functions found: %', func_count;
    RAISE NOTICE 'Functions fixed: %', fixed_count;
    RAISE NOTICE 'Functions failed: %', func_count - fixed_count;
    
END $fix_functions$ LANGUAGE plpgsql;

-- Step 3: Verify the fixes by checking all functions again
DO $verify_fixes$
DECLARE
    remaining_count INTEGER := 0;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Verification: Checking for remaining mutable search_path functions';
    RAISE NOTICE '==============================================================';
    
    SELECT COUNT(*) INTO remaining_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✓ SUCCESS: All SECURITY DEFINER functions now have immutable search_path';
    ELSE
        RAISE WARNING '✗ WARNING: % functions still have mutable search_path', remaining_count;
    END IF;
    
END $verify_fixes$ LANGUAGE plpgsql;

-- Step 4: Create a verification function for ongoing monitoring
CREATE OR REPLACE FUNCTION public.check_mutable_search_path_functions()
RETURNS TABLE (
    function_name TEXT,
    function_args TEXT,
    has_search_path BOOLEAN,
    current_search_path TEXT,
    security_definer BOOLEAN,
    recommendation TEXT
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
/*
 * Function: check_mutable_search_path_functions
 * Purpose: Monitor functions for mutable search_path security issues
 * Security: Uses immutable search_path to prevent injection attacks
 * Usage: SELECT * FROM check_mutable_search_path_functions();
 */
BEGIN
    RETURN QUERY
    SELECT 
        p.proname::TEXT as function_name,
        pg_get_function_identity_arguments(p.oid)::TEXT as function_args,
        EXISTS (
            SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
            WHERE config LIKE 'search_path=%'
        ) as has_search_path,
        COALESCE(
            (SELECT config FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
             WHERE config LIKE 'search_path=%' LIMIT 1),
            'NOT SET'
        )::TEXT as current_search_path,
        p.prosecdef as security_definer,
        CASE 
            WHEN p.prosecdef AND NOT EXISTS (
                SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                WHERE config LIKE 'search_path=%'
            ) THEN 'CRITICAL: Add SET search_path = public, pg_temp'
            WHEN p.prosecdef THEN 'OK: Has immutable search_path'
            ELSE 'INFO: Not a SECURITY DEFINER function'
        END::TEXT as recommendation
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY 
        p.prosecdef DESC,  -- SECURITY DEFINER functions first
        CASE 
            WHEN p.prosecdef AND NOT EXISTS (
                SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                WHERE config LIKE 'search_path=%'
            ) THEN 1  -- Problematic functions first
            ELSE 2
        END,
        p.proname;
END;
$$;

-- Add comment explaining the security importance
COMMENT ON FUNCTION public.check_mutable_search_path_functions() IS 
'Security monitoring function: Identifies functions with mutable search_path that could be exploited. SECURITY DEFINER functions without SET search_path are vulnerable to search_path injection attacks.';

-- Step 5: Final verification and summary
DO $final_summary$
DECLARE
    total_functions INTEGER;
    secure_functions INTEGER;
    vulnerable_functions INTEGER;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Final Security Assessment';
    RAISE NOTICE '=========================';
    
    -- Count all public functions
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    -- Count secure SECURITY DEFINER functions
    SELECT COUNT(*) INTO secure_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    );
    
    -- Count vulnerable SECURITY DEFINER functions
    SELECT COUNT(*) INTO vulnerable_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    RAISE NOTICE 'Total public functions: %', total_functions;
    RAISE NOTICE 'Secure SECURITY DEFINER functions: %', secure_functions;
    RAISE NOTICE 'Vulnerable SECURITY DEFINER functions: %', vulnerable_functions;
    
    IF vulnerable_functions = 0 THEN
        RAISE NOTICE ' ';
        RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions are now secure!';
        RAISE NOTICE 'Security Advisory warnings for mutable search_path should be resolved.';
    ELSE
        RAISE WARNING ' ';
        RAISE WARNING 'WARNING: % functions still vulnerable to search_path injection!', vulnerable_functions;
        RAISE WARNING 'Run: SELECT * FROM check_mutable_search_path_functions() WHERE recommendation LIKE CRITICAL%%';
    END IF;
    
    RAISE NOTICE ' ';
    RAISE NOTICE 'Monitoring: Use check_mutable_search_path_functions() for ongoing security checks';
    RAISE NOTICE 'Next: Re-run Supabase Security Advisor to verify warnings are resolved';
END $final_summary$ LANGUAGE plpgsql;