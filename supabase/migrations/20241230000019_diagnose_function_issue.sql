-- Migration: Diagnose Function Issue
-- Purpose: Check what's happening with the function creation

DO $$
DECLARE
    func_exists boolean := false;
    func_def text;
    func_config text[];
BEGIN
    RAISE NOTICE '=== DIAGNOSING FUNCTION ISSUE ===';
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    RAISE NOTICE 'Function exists: %', func_exists;
    
    IF func_exists THEN
        -- Get full function definition
        SELECT pg_get_functiondef(p.oid) INTO func_def
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        RAISE NOTICE 'Function definition:';
        RAISE NOTICE '%', func_def;
        
        -- Get function configuration
        SELECT proconfig INTO func_config
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        RAISE NOTICE 'Function config array: %', func_config;
        
        -- Check each config item
        IF func_config IS NOT NULL THEN
            FOR i IN 1..array_length(func_config, 1) LOOP
                RAISE NOTICE 'Config[%]: %', i, func_config[i];
            END LOOP;
        ELSE
            RAISE NOTICE 'Function config is NULL';
        END IF;
    END IF;
END;
$$;

-- Try to create a simple test function with search_path
CREATE OR REPLACE FUNCTION public.test_search_path_function()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
    RETURN 'test';
END;
$$;

-- Check if the test function has search_path
DO $$
DECLARE
    test_config text[];
BEGIN
    RAISE NOTICE '=== TESTING SEARCH_PATH SETTING ===';
    
    SELECT proconfig INTO test_config
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'test_search_path_function';
    
    RAISE NOTICE 'Test function config: %', test_config;
    
    IF test_config IS NOT NULL THEN
        FOR i IN 1..array_length(test_config, 1) LOOP
            RAISE NOTICE 'Test Config[%]: %', i, test_config[i];
        END LOOP;
    END IF;
END;
$$;

-- Clean up test function
DROP FUNCTION IF EXISTS public.test_search_path_function();