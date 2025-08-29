-- Migration: Verify track_user_login Security Fixes
-- Purpose: Comprehensive verification that all security fixes have been applied correctly
-- Date: 2024-12-30
-- Verifies: search_path, SECURITY DEFINER, permissions, and function integrity

DO $$
DECLARE
    func_exists BOOLEAN := FALSE;
    func_search_path TEXT;
    func_security_type TEXT;
    func_owner TEXT;
    func_language TEXT;
    func_return_type TEXT;
    func_volatility TEXT;
    has_public_access BOOLEAN := FALSE;
    has_authenticated_access BOOLEAN := FALSE;
    has_service_role_access BOOLEAN := FALSE;
    verification_passed BOOLEAN := TRUE;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== VERIFYING track_user_login SECURITY FIXES ===';
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
    ) INTO func_exists;
    
    IF NOT func_exists THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Function public.track_user_login does not exist!';
    END IF;
    
    RAISE NOTICE '✅ Function exists';
    
    -- Get function properties
    SELECT 
        COALESCE(
            (
                SELECT config 
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid,
                unnest(p.proconfig) AS config
                WHERE n.nspname = 'public' 
                AND p.proname = 'track_user_login'
                AND config LIKE 'search_path=%'
                LIMIT 1
            ),
            'MUTABLE (not set)'
        ),
        CASE 
            WHEN p.prosecdef THEN 'SECURITY DEFINER'
            ELSE 'SECURITY INVOKER'
        END,
        pg_get_userbyid(p.proowner),
        l.lanname,
        pg_get_function_result(p.oid),
        CASE p.provolatile
            WHEN 'i' THEN 'IMMUTABLE'
            WHEN 's' THEN 'STABLE'
            WHEN 'v' THEN 'VOLATILE'
        END
    INTO func_search_path, func_security_type, func_owner, func_language, func_return_type, func_volatility
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname = 'public' AND p.proname = 'track_user_login';
    
    -- Check permissions
    SELECT 
        bool_or(grantee = 'PUBLIC') AS has_public,
        bool_or(grantee = 'authenticated') AS has_authenticated,
        bool_or(grantee = 'service_role') AS has_service_role
    FROM information_schema.routine_privileges 
    WHERE routine_schema = 'public' 
    AND routine_name = 'track_user_login'
    AND privilege_type = 'EXECUTE'
    INTO has_public_access, has_authenticated_access, has_service_role_access;
    
    -- Display current status
    RAISE NOTICE 'Function Owner: %', func_owner;
    RAISE NOTICE 'Language: %', func_language;
    RAISE NOTICE 'Return Type: %', func_return_type;
    RAISE NOTICE 'Volatility: %', func_volatility;
    RAISE NOTICE 'Security Type: %', func_security_type;
    RAISE NOTICE 'Search Path: %', func_search_path;
    RAISE NOTICE 'PUBLIC Access: %', COALESCE(has_public_access, FALSE);
    RAISE NOTICE 'Authenticated Access: %', COALESCE(has_authenticated_access, FALSE);
    RAISE NOTICE 'Service Role Access: %', COALESCE(has_service_role_access, FALSE);
    
    RAISE NOTICE '=== SECURITY VERIFICATION CHECKS ===';
    
    -- Verification 1: Search Path
    IF func_search_path LIKE 'search_path=public, pg_catalog' OR func_search_path LIKE 'search_path="public, pg_catalog"' THEN
        RAISE NOTICE '✅ PASS: Search path is explicitly set to "public, pg_catalog"';
    ELSE
        RAISE NOTICE '❌ FAIL: Search path is not properly set. Current: %', func_search_path;
        verification_passed := FALSE;
        error_count := error_count + 1;
    END IF;
    
    -- Verification 2: Security Type
    IF func_security_type = 'SECURITY DEFINER' THEN
        RAISE NOTICE '✅ PASS: Function uses SECURITY DEFINER';
    ELSE
        RAISE NOTICE '❌ FAIL: Function should use SECURITY DEFINER, currently: %', func_security_type;
        verification_passed := FALSE;
        error_count := error_count + 1;
    END IF;
    
    -- Verification 3: PUBLIC Access Revoked
    IF NOT COALESCE(has_public_access, FALSE) THEN
        RAISE NOTICE '✅ PASS: PUBLIC access has been revoked';
    ELSE
        RAISE NOTICE '❌ FAIL: PUBLIC still has access to the function';
        verification_passed := FALSE;
        error_count := error_count + 1;
    END IF;
    
    -- Verification 4: Authenticated Access Granted
    IF COALESCE(has_authenticated_access, FALSE) THEN
        RAISE NOTICE '✅ PASS: Authenticated role has access';
    ELSE
        RAISE NOTICE '❌ FAIL: Authenticated role does not have access';
        verification_passed := FALSE;
        error_count := error_count + 1;
    END IF;
    
    -- Verification 5: Service Role Access Granted
    IF COALESCE(has_service_role_access, FALSE) THEN
        RAISE NOTICE '✅ PASS: Service role has access';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Service role does not have access (may be intentional)';
    END IF;
    
    -- Verification 6: Function Language
    IF func_language = 'plpgsql' THEN
        RAISE NOTICE '✅ PASS: Function uses plpgsql language';
    ELSE
        RAISE NOTICE 'ℹ️  INFO: Function uses % language', func_language;
    END IF;
    
    -- Verification 7: Return Type
    IF func_return_type = 'void' THEN
        RAISE NOTICE '✅ PASS: Function returns void (as expected for tracking function)';
    ELSE
        RAISE NOTICE 'ℹ️  INFO: Function returns %', func_return_type;
    END IF;
    
    RAISE NOTICE '=== VERIFICATION SUMMARY ===';
    
    IF verification_passed THEN
        RAISE NOTICE '🎉 ALL SECURITY VERIFICATIONS PASSED!';
        RAISE NOTICE 'Function public.track_user_login is now secure:';
        RAISE NOTICE '  - Search path is locked to "public, pg_catalog"';
        RAISE NOTICE '  - Uses SECURITY DEFINER for consistent execution';
        RAISE NOTICE '  - PUBLIC access revoked';
        RAISE NOTICE '  - Authenticated users have proper access';
        RAISE NOTICE '  - Protected against schema manipulation attacks';
    ELSE
        RAISE NOTICE '⚠️  VERIFICATION INCOMPLETE: % issues found', error_count;
        RAISE NOTICE 'Please review the failed checks above and apply necessary fixes.';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;