-- Migration: Check Current Status of public.update_last_seen Function
-- Purpose: Verify if the function exists and check its current search_path configuration

DO $$
DECLARE
    func_exists boolean := false;
    func_source text;
    func_config text[];
    search_path_set boolean := false;
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT STATUS OF public.update_last_seen ===';    
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✓ Function public.update_last_seen EXISTS';
        
        -- Get function source code
        SELECT prosrc INTO func_source
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        -- Get function configuration (including search_path)
        SELECT proconfig INTO func_config
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        -- Check if search_path is explicitly set
        IF func_config IS NOT NULL THEN
            FOR i IN 1..array_length(func_config, 1) LOOP
                IF func_config[i] LIKE 'search_path=%' THEN
                    search_path_set := true;
                    RAISE NOTICE '✓ Function has explicit search_path: %', func_config[i];
                END IF;
            END LOOP;
        END IF;
        
        IF NOT search_path_set THEN
            RAISE NOTICE '⚠ WARNING: Function does NOT have explicit search_path set!';
            RAISE NOTICE 'Current function configuration: %', COALESCE(array_to_string(func_config, ', '), 'NULL');
        END IF;
        
        -- Show function details
        RAISE NOTICE 'Function source (first 200 chars): %', LEFT(func_source, 200);
        
        -- Check function security type
        SELECT CASE 
            WHEN prosecdef THEN 'SECURITY DEFINER'
            ELSE 'SECURITY INVOKER'
        END INTO func_source
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        RAISE NOTICE 'Function security type: %', func_source;
        
    ELSE
        RAISE NOTICE '❌ Function public.update_last_seen DOES NOT EXIST!';
    END IF;
    
    RAISE NOTICE '=== STATUS CHECK COMPLETED ===';
END;
$$;