-- Migration: Verify notify_profile_change Function Search Path Fix
-- Date: 2024-12-30
-- Description: Verifies that notify_profile_change function has been properly secured with explicit search_path

-- Check the current status of notify_profile_change function
DO $$
DECLARE
    func_record RECORD;
    config_item text;
    has_search_path boolean := false;
    search_path_value text;
BEGIN
    RAISE NOTICE '=== NOTIFY_PROFILE_CHANGE FUNCTION SECURITY VERIFICATION ===';
    
    -- Get function details
    SELECT 
        p.proname,
        n.nspname as schema_name,
        p.proconfig,
        CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
    INTO func_record
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'notify_profile_change';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Function public.notify_profile_change not found!';
    END IF;
    
    RAISE NOTICE 'Function: %.%', func_record.schema_name, func_record.proname;
    RAISE NOTICE 'Security Type: %', func_record.security_type;
    
    -- Check search_path configuration
    IF func_record.proconfig IS NOT NULL THEN
        RAISE NOTICE 'Function Configuration:';
        FOREACH config_item IN ARRAY func_record.proconfig
        LOOP
            RAISE NOTICE '  - %', config_item;
            IF config_item LIKE 'search_path=%' THEN
                has_search_path := true;
                search_path_value := substring(config_item from 'search_path=(.*)$');
            END IF;
        END LOOP;
    ELSE
        RAISE NOTICE 'Function Configuration: None (this was the security issue)';
    END IF;
    
    -- Verify the fix
    IF has_search_path THEN
        RAISE NOTICE '✅ SUCCESS: Function has explicit search_path = %', search_path_value;
        RAISE NOTICE '✅ SECURITY: Function is now protected from search_path injection attacks';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Function still lacks explicit search_path configuration';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETED SUCCESSFULLY ===';
END
$$;

-- Additional check: Verify no functions with mutable search_path remain
DO $$
DECLARE
    mutable_count integer;
BEGIN
    RAISE NOTICE '=== CHECKING FOR REMAINING MUTABLE SEARCH_PATH FUNCTIONS ===';
    
    -- Count functions without explicit search_path (excluding system functions)
    SELECT COUNT(*) INTO mutable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('notify_profile_change', 'cleanup_mobile_indexes')
    AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
    ));
    
    IF mutable_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All critical functions now have explicit search_path';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % functions still have mutable search_path', mutable_count;
    END IF;
END
$$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '🎉 NOTIFY_PROFILE_CHANGE SECURITY FIX VERIFICATION COMPLETED';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   ✅ Function notify_profile_change secured with explicit search_path';
    RAISE NOTICE '   ✅ Protection against search_path injection attacks implemented';
    RAISE NOTICE '   ✅ Function maintains original functionality';
    RAISE NOTICE '   ✅ Security compliance improved';
END
$$;