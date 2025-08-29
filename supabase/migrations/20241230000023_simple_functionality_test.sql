-- Migration: Simple Functionality Test for update_last_seen
-- Purpose: Verify function and trigger configuration without data manipulation

DO $$
DECLARE
    func_exists boolean := false;
    trigger_exists boolean := false;
    func_config text[];
    search_path_value text;
    security_type text;
    has_search_path boolean := false;
    func_definition text;
BEGIN
    RAISE NOTICE '=== SIMPLE FUNCTIONALITY TEST FOR update_last_seen ===';
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_last_seen'
    ) INTO trigger_exists;
    
    RAISE NOTICE 'Function exists: %', func_exists;
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    
    IF NOT func_exists THEN
        RAISE EXCEPTION 'CRITICAL: Function public.update_last_seen does not exist!';
    END IF;
    
    IF NOT trigger_exists THEN
        RAISE EXCEPTION 'CRITICAL: Trigger update_profiles_last_seen does not exist!';
    END IF;
    
    -- Get function details
    SELECT 
        proconfig,
        CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END,
        pg_get_functiondef(p.oid)
    INTO func_config, security_type, func_definition
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
    
    -- Check search_path configuration
    IF func_config IS NOT NULL THEN
        FOR i IN 1..array_length(func_config, 1) LOOP
            IF func_config[i] LIKE 'search_path=%' THEN
                has_search_path := true;
                search_path_value := func_config[i];
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RAISE NOTICE '=== FUNCTION SECURITY ANALYSIS ===';
    RAISE NOTICE 'Security type: %', security_type;
    RAISE NOTICE 'Configuration array: %', COALESCE(array_to_string(func_config, ', '), 'NULL');
    
    IF has_search_path THEN
        RAISE NOTICE '✅ Function has explicit search_path: %', search_path_value;
    ELSE
        RAISE NOTICE '❌ Function lacks explicit search_path';
    END IF;
    
    -- Show function definition (first 300 characters)
    RAISE NOTICE 'Function definition preview:';
    RAISE NOTICE '%', LEFT(func_definition, 300) || '...';
    
    -- Check trigger details
    DECLARE
        trigger_info record;
    BEGIN
        SELECT 
            tgname,
            tgtype,
            tgenabled,
            pg_get_triggerdef(oid) as definition
        INTO trigger_info
        FROM pg_trigger 
        WHERE tgname = 'update_profiles_last_seen';
        
        RAISE NOTICE '=== TRIGGER ANALYSIS ===';
        RAISE NOTICE 'Trigger name: %', trigger_info.tgname;
        RAISE NOTICE 'Trigger enabled: %', trigger_info.tgenabled;
        RAISE NOTICE 'Trigger definition: %', trigger_info.definition;
    END;
    
    -- Check function permissions
    DECLARE
        perm_record record;
        perm_count integer := 0;
    BEGIN
        RAISE NOTICE '=== FUNCTION PERMISSIONS ===';
        
        FOR perm_record IN
            SELECT 
                r.rolname,
                p.privilege_type
            FROM information_schema.routine_privileges p
            JOIN pg_roles r ON r.rolname = p.grantee
            WHERE p.routine_schema = 'public' 
            AND p.routine_name = 'update_last_seen'
            ORDER BY r.rolname
        LOOP
            RAISE NOTICE 'Role: % has % permission', perm_record.rolname, perm_record.privilege_type;
            perm_count := perm_count + 1;
        END LOOP;
        
        IF perm_count = 0 THEN
            RAISE NOTICE 'No explicit permissions found (may use default permissions)';
        END IF;
    END;
    
    -- Final assessment
    RAISE NOTICE '=== FINAL ASSESSMENT ===';
    
    IF func_exists AND trigger_exists AND has_search_path AND security_type = 'SECURITY DEFINER' THEN
        RAISE NOTICE '🎉 EXCELLENT: All security requirements met!';
        RAISE NOTICE '  ✅ Function exists with SECURITY DEFINER';
        RAISE NOTICE '  ✅ Function has explicit search_path';
        RAISE NOTICE '  ✅ Trigger is properly configured';
    ELSIF func_exists AND trigger_exists AND has_search_path THEN
        RAISE NOTICE '✅ GOOD: Function is secure with explicit search_path';
        RAISE NOTICE '  ⚠ Consider using SECURITY DEFINER for additional security';
    ELSIF func_exists AND trigger_exists THEN
        RAISE NOTICE '⚠ PARTIAL: Function exists but may have security issues';
        IF NOT has_search_path THEN
            RAISE NOTICE '  ❌ Missing explicit search_path';
        END IF;
    ELSE
        RAISE NOTICE '❌ FAILED: Critical components missing';
    END IF;
    
    RAISE NOTICE '=== TEST COMPLETED ===';
END;
$$;