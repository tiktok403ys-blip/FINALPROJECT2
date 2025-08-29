-- Migration: Verify fix for public.update_updated_at_column function
-- Purpose: Confirm that the function now has immutable search_path
-- Date: 2024-12-30

DO $verify_fix$
DECLARE
    func_exists BOOLEAN := FALSE;
    func_security_definer BOOLEAN := FALSE;
    func_has_search_path BOOLEAN := FALSE;
    func_search_path_value TEXT;
    func_definition TEXT;
    all_vulnerable_count INTEGER := 0;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Verification: public.update_updated_at_column Security Fix';
    RAISE NOTICE '=======================================================';
    
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
        RAISE NOTICE 'Status: Function not found - security warning was a false positive';
    ELSE
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
            RAISE WARNING '🚨 SECURITY ISSUE STILL EXISTS: Function is SECURITY DEFINER but has mutable search_path!';
            RAISE WARNING 'The fix_mutable_search_path.sql migration did not fix this function';
        ELSIF func_security_definer AND func_has_search_path THEN
            RAISE NOTICE '✅ SECURITY FIXED: Function is SECURITY DEFINER with immutable search_path';
            RAISE NOTICE 'search_path is set to: %', func_search_path_value;
            RAISE NOTICE '✅ SUCCESS: Security vulnerability has been resolved!';
        ELSIF NOT func_security_definer THEN
            RAISE NOTICE '✅ SECURE: Function is SECURITY INVOKER (no privilege escalation risk)';
        END IF;
    END IF;
    
    -- Check overall security status
    RAISE NOTICE ' ';
    RAISE NOTICE 'Overall Security Status Check';
    RAISE NOTICE '==============================';
    
    -- Count remaining vulnerable functions
    SELECT COUNT(*) INTO all_vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    IF all_vulnerable_count = 0 THEN
        RAISE NOTICE '✅ EXCELLENT: All SECURITY DEFINER functions are now secure!';
        RAISE NOTICE 'All mutable search_path security warnings should be resolved.';
    ELSE
        RAISE WARNING '⚠️  WARNING: % SECURITY DEFINER functions still have mutable search_path', all_vulnerable_count;
        RAISE WARNING 'Additional security fixes may be needed.';
    END IF;
    
    -- Final recommendation
    RAISE NOTICE ' ';
    RAISE NOTICE 'Recommendations:';
    RAISE NOTICE '=================';
    
    IF func_exists AND func_security_definer AND func_has_search_path THEN
        RAISE NOTICE '✅ public.update_updated_at_column is now secure';
        RAISE NOTICE '✅ Re-run Supabase Security Advisor to verify warnings are cleared';
    ELSIF func_exists AND func_security_definer AND NOT func_has_search_path THEN
        RAISE NOTICE '❌ Manual fix required for public.update_updated_at_column';
        RAISE NOTICE '❌ Consider running: ALTER FUNCTION public.update_updated_at_column() SET search_path = public;';
    ELSIF func_exists AND NOT func_security_definer THEN
        RAISE NOTICE '✅ public.update_updated_at_column is secure (SECURITY INVOKER)';
        RAISE NOTICE '✅ No further action needed for this function';
    ELSE
        RAISE NOTICE '✅ public.update_updated_at_column does not exist';
        RAISE NOTICE '✅ Security warning was likely a false positive';
    END IF;
    
END $verify_fix$ LANGUAGE plpgsql;

-- Additional check: List all functions and their security status
DO $list_all_functions$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE 'Complete Function Security Report';
    RAISE NOTICE '==================================';
    
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
            EXISTS (
                SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                WHERE config LIKE 'search_path=%'
            ) as has_search_path,
            COALESCE(
                (SELECT config FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                 WHERE config LIKE 'search_path=%' LIMIT 1),
                'NOT SET'
            ) as search_path_value,
            CASE 
                WHEN p.prosecdef AND NOT EXISTS (
                    SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                    WHERE config LIKE 'search_path=%'
                ) THEN '🚨 VULNERABLE'
                WHEN p.prosecdef THEN '✅ SECURE'
                ELSE '✅ SAFE'
            END as status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY 
            CASE 
                WHEN p.prosecdef AND NOT EXISTS (
                    SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                    WHERE config LIKE 'search_path=%'
                ) THEN 1  -- Vulnerable functions first
                WHEN p.prosecdef THEN 2  -- Secure DEFINER functions
                ELSE 3  -- INVOKER functions
            END,
            p.proname
    LOOP
        RAISE NOTICE '% %(%): % - %', 
            func_record.status,
            func_record.function_name, 
            func_record.args,
            func_record.security_type,
            func_record.search_path_value;
    END LOOP;
    
END $list_all_functions$ LANGUAGE plpgsql;