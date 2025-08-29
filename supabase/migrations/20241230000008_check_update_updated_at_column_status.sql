-- Migration: Check status of public.update_updated_at_column function
-- Purpose: Verify if the function has been fixed for mutable search_path security issue
-- Date: 2024-12-30

DO $check_function$
DECLARE
    func_exists BOOLEAN := FALSE;
    func_security_definer BOOLEAN := FALSE;
    func_has_search_path BOOLEAN := FALSE;
    func_search_path_value TEXT;
    func_definition TEXT;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Checking public.update_updated_at_column Function Status';
    RAISE NOTICE '=====================================================';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_updated_at_column'
    ) INTO func_exists;
    
    IF NOT func_exists THEN
        RAISE NOTICE '❌ Function public.update_updated_at_column does NOT exist';
        RAISE NOTICE 'Status: Function not found - security warning may be a false positive';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Function public.update_updated_at_column EXISTS';
    
    -- Get function details
    SELECT 
        p.prosecdef,
        EXISTS (
            SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
            WHERE config LIKE 'search_path=%'
        ),
        COALESCE(
            (SELECT config FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
             WHERE config LIKE 'search_path=%' LIMIT 1),
            'NOT SET'
        ),
        pg_get_functiondef(p.oid)
    INTO 
        func_security_definer,
        func_has_search_path,
        func_search_path_value,
        func_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'update_updated_at_column';
    
    -- Display function details
    RAISE NOTICE ' ';
    RAISE NOTICE 'Function Details:';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Security Type: %', CASE WHEN func_security_definer THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END;
    RAISE NOTICE 'Has search_path: %', func_has_search_path;
    RAISE NOTICE 'search_path value: %', func_search_path_value;
    
    -- Security assessment
    RAISE NOTICE ' ';
    RAISE NOTICE 'Security Assessment:';
    RAISE NOTICE '====================';
    
    IF func_security_definer AND NOT func_has_search_path THEN
        RAISE WARNING '🚨 SECURITY ISSUE: Function is SECURITY DEFINER but has mutable search_path!';
        RAISE WARNING 'Recommendation: Add SET search_path = public to function definition';
        RAISE NOTICE ' ';
        RAISE NOTICE 'Current function definition:';
        RAISE NOTICE '%', func_definition;
    ELSIF func_security_definer AND func_has_search_path THEN
        RAISE NOTICE '✅ SECURE: Function is SECURITY DEFINER with immutable search_path';
        RAISE NOTICE 'search_path is set to: %', func_search_path_value;
    ELSIF NOT func_security_definer THEN
        RAISE NOTICE '✅ SECURE: Function is SECURITY INVOKER (no privilege escalation)';
        RAISE NOTICE 'Note: SECURITY INVOKER functions inherit caller search_path but this is safe';
    END IF;
    
END $check_function$ LANGUAGE plpgsql;

-- Also check all SECURITY DEFINER functions for comprehensive security status
DO $check_all_security_definer$
DECLARE
    vulnerable_count INTEGER := 0;
    secure_count INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Comprehensive SECURITY DEFINER Functions Check';
    RAISE NOTICE '==============================================';
    
    -- Count vulnerable functions
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    -- Count secure functions
    SELECT COUNT(*) INTO secure_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    );
    
    RAISE NOTICE 'Secure SECURITY DEFINER functions: %', secure_count;
    RAISE NOTICE 'Vulnerable SECURITY DEFINER functions: %', vulnerable_count;
    
    IF vulnerable_count > 0 THEN
        RAISE NOTICE ' ';
        RAISE NOTICE 'Vulnerable functions that need fixing:';
        RAISE NOTICE '======================================';
        
        FOR func_record IN
            SELECT 
                p.proname as function_name,
                pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.prosecdef = true
            AND (p.proconfig IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(p.proconfig) AS config
                WHERE config LIKE 'search_path=%'
            ))
            ORDER BY p.proname
        LOOP
            RAISE NOTICE '🚨 %(%)', func_record.function_name, func_record.args;
        END LOOP;
        
        RAISE NOTICE ' ';
        RAISE WARNING 'ACTION REQUIRED: Run fix_mutable_search_path.sql migration to secure these functions';
    ELSE
        RAISE NOTICE ' ';
        RAISE NOTICE '✅ SUCCESS: All SECURITY DEFINER functions are secure!';
    END IF;
    
END $check_all_security_definer$ LANGUAGE plpgsql;