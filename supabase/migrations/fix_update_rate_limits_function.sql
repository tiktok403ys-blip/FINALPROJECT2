-- Fix Function Search Path Mutable warning for update_rate_limits_updated_at
-- This migration adds SECURITY DEFINER and SET search_path to the function

-- Step 1: Recreate the function with SECURITY DEFINER and immutable search_path
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
/*
 * Function: update_rate_limits_updated_at
 * Purpose: Automatically update the updated_at timestamp on rate_limits table
 * Security: Uses SECURITY DEFINER with immutable search_path to prevent injection attacks
 * Trigger: BEFORE UPDATE on rate_limits table
 */
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Step 2: Add security comment
COMMENT ON FUNCTION update_rate_limits_updated_at() IS 
'Trigger function to update updated_at timestamp. Uses SECURITY DEFINER with immutable search_path for security.';

-- Step 3: Verify the function is now secure
DO $verify_function$
DECLARE
    func_info RECORD;
BEGIN
    RAISE NOTICE 'Verifying update_rate_limits_updated_at function security...';
    
    SELECT 
        p.proname as function_name,
        p.prosecdef as is_security_definer,
        EXISTS (
            SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
            WHERE config LIKE 'search_path=%'
        ) as has_search_path,
        COALESCE(
            (SELECT config FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
             WHERE config LIKE 'search_path=%' LIMIT 1),
            'NOT SET'
        ) as current_search_path
    INTO func_info
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'update_rate_limits_updated_at';
    
    IF func_info.function_name IS NULL THEN
        RAISE WARNING '✗ Function update_rate_limits_updated_at not found!';
    ELSIF func_info.is_security_definer AND func_info.has_search_path THEN
        RAISE NOTICE '✓ SUCCESS: Function update_rate_limits_updated_at is now secure';
        RAISE NOTICE '  - Security Definer: %', func_info.is_security_definer;
        RAISE NOTICE '  - Search Path: %', func_info.current_search_path;
    ELSE
        RAISE WARNING '✗ Function update_rate_limits_updated_at still has security issues:';
        RAISE WARNING '  - Security Definer: %', func_info.is_security_definer;
        RAISE WARNING '  - Has Search Path: %', func_info.has_search_path;
        RAISE WARNING '  - Current Search Path: %', func_info.current_search_path;
    END IF;
END $verify_function$ LANGUAGE plpgsql;

-- Step 4: Final summary
DO $final_summary$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Migration Summary for update_rate_limits_updated_at';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✓ Function recreated with SECURITY DEFINER';
    RAISE NOTICE '✓ Immutable search_path added: public, pg_temp';
    RAISE NOTICE '✓ Security documentation added';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Re-run Supabase Security Advisor to verify warning is resolved';
    RAISE NOTICE '2. Test trigger functionality to ensure no breaking changes';
    RAISE NOTICE '3. Monitor function performance and security';
END $final_summary$ LANGUAGE plpgsql;