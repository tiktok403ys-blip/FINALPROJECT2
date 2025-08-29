-- Migration: Verify public.update_last_seen Function Fix
-- Purpose: Confirm that the function now has secure search_path configuration
-- Date: 2024-12-30

DO $$
DECLARE
    func_exists boolean;
    func_config text[];
    func_security text;
    func_permissions_count integer;
    has_search_path boolean := false;
    rec record;
BEGIN
    RAISE NOTICE '=== VERIFYING public.update_last_seen FUNCTION FIX ===';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    IF NOT func_exists THEN
        RAISE EXCEPTION 'CRITICAL: Function public.update_last_seen does not exist!';
    END IF;
    
    RAISE NOTICE '✓ Function public.update_last_seen exists';
    
    -- Get function security configuration
    SELECT 
        p.proconfig,
        CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
    INTO func_config, func_security
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    LIMIT 1;
    
    -- Verify search_path configuration
    IF func_config IS NOT NULL THEN
        -- Check if search_path is explicitly set
        FOR i IN 1..array_length(func_config, 1) LOOP
            IF func_config[i] LIKE 'search_path=%' THEN
                has_search_path := true;
                RAISE NOTICE '✓ search_path is configured: %', func_config[i];
                EXIT;
            END IF;
        END LOOP;
        
        IF NOT has_search_path THEN
            RAISE WARNING '⚠ Function has configuration but no explicit search_path!';
        END IF;
    ELSE
        RAISE EXCEPTION 'CRITICAL: Function still has mutable search_path (NOT FIXED)!';
    END IF;
    
    -- Verify security type
    RAISE NOTICE '✓ Security Type: %', func_security;
    
    -- Check function permissions
    SELECT COUNT(*) INTO func_permissions_count
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public' 
    AND routine_name = 'update_last_seen'
    AND grantee = 'PUBLIC';
    
    IF func_permissions_count > 0 THEN
        RAISE WARNING '⚠ Function still has PUBLIC permissions (security risk)';
    ELSE
        RAISE NOTICE '✓ PUBLIC permissions properly revoked';
    END IF;
    
    -- Check authenticated role permissions
    SELECT COUNT(*) INTO func_permissions_count
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public' 
    AND routine_name = 'update_last_seen'
    AND grantee = 'authenticated'
    AND privilege_type = 'EXECUTE';
    
    IF func_permissions_count > 0 THEN
        RAISE NOTICE '✓ authenticated role has EXECUTE permission';
    ELSE
        RAISE WARNING '⚠ authenticated role missing EXECUTE permission';
    END IF;
    
    -- Test function dependencies (triggers)
    RAISE NOTICE 'Checking function dependencies:';
    
    -- Check for triggers that use this function
    FOR rec IN (
        SELECT trigger_schema, trigger_name, event_object_schema, event_object_table
        FROM information_schema.triggers
        WHERE action_statement LIKE '%update_last_seen%'
        ORDER BY event_object_table, trigger_name
    ) LOOP
        RAISE NOTICE '✓ Trigger: %.% on table %.%', 
            rec.trigger_schema, rec.trigger_name, rec.event_object_schema, rec.event_object_table;
    END LOOP;
    
END $$;

-- Display current function definition for review
DO $$
DECLARE
    func_def text;
BEGIN
    RAISE NOTICE '=== CURRENT FUNCTION DEFINITION ===';
    
    SELECT pg_get_functiondef(p.oid) INTO func_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    LIMIT 1;
    
    RAISE NOTICE '%', func_def;
END $$;

-- Final security audit
DO $$
BEGIN
    RAISE NOTICE '=== FINAL SECURITY AUDIT ===';
    RAISE NOTICE 'Checking all functions with mutable search_path in public schema:';
END $$;

SELECT 
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
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
    RAISE NOTICE 'If no functions appear in the audit above, all functions have secure search_path!';
    RAISE NOTICE 'Function public.update_last_seen security fix verification completed.';
END $$;