-- Migration: Check track_user_login Function Status and Search Path Configuration
-- Purpose: Analyze current status of public.track_user_login function before applying security fixes
-- Date: 2024-12-30
-- Issue: Function has mutable search_path which poses security and stability risks

DO $$
DECLARE
    func_exists BOOLEAN := FALSE;
    func_definition TEXT;
    func_search_path TEXT;
    func_security_type TEXT;
    func_owner TEXT;
    func_language TEXT;
    func_return_type TEXT;
    func_volatility TEXT;
BEGIN
    RAISE NOTICE '=== CHECKING public.track_user_login FUNCTION STATUS ===';
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Function public.track_user_login EXISTS';
        
        -- Get function definition
        SELECT pg_get_functiondef(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_definition;
        
        -- Get function search_path setting
        SELECT COALESCE(
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
        ) INTO func_search_path;
        
        -- Get security type (DEFINER vs INVOKER)
        SELECT CASE 
            WHEN p.prosecdef THEN 'SECURITY DEFINER'
            ELSE 'SECURITY INVOKER'
        END
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_security_type;
        
        -- Get function owner
        SELECT pg_get_userbyid(p.proowner)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_owner;
        
        -- Get function language
        SELECT l.lanname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_language;
        
        -- Get return type
        SELECT pg_get_function_result(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_return_type;
        
        -- Get volatility
        SELECT CASE p.provolatile
            WHEN 'i' THEN 'IMMUTABLE'
            WHEN 's' THEN 'STABLE'
            WHEN 'v' THEN 'VOLATILE'
        END
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'track_user_login'
        INTO func_volatility;
        
        -- Display function information
        RAISE NOTICE 'Function Owner: %', func_owner;
        RAISE NOTICE 'Function Language: %', func_language;
        RAISE NOTICE 'Return Type: %', func_return_type;
        RAISE NOTICE 'Volatility: %', func_volatility;
        RAISE NOTICE 'Security Type: %', func_security_type;
        RAISE NOTICE 'Search Path Setting: %', func_search_path;
        
        -- Security analysis
        IF func_search_path = 'MUTABLE (not set)' THEN
            RAISE NOTICE '⚠️  SECURITY ISSUE: Function has mutable search_path!';
            RAISE NOTICE '   This allows potential schema manipulation attacks';
            RAISE NOTICE '   Recommendation: Set explicit search_path';
        ELSE
            RAISE NOTICE '✅ Function has explicit search_path configuration';
        END IF;
        
        IF func_security_type = 'SECURITY INVOKER' THEN
            RAISE NOTICE 'ℹ️  Function runs with caller privileges (SECURITY INVOKER)';
        ELSE
            RAISE NOTICE 'ℹ️  Function runs with owner privileges (SECURITY DEFINER)';
        END IF;
        
        -- Display function definition
        RAISE NOTICE '=== FUNCTION DEFINITION ===';
        RAISE NOTICE '%', func_definition;
        
    ELSE
        RAISE NOTICE '❌ Function public.track_user_login NOT FOUND';
        RAISE NOTICE 'Cannot proceed with security analysis';
    END IF;
    
    RAISE NOTICE '=== ANALYSIS COMPLETE ===';
END $$;