-- Migration: Audit All Functions in Public Schema
-- Purpose: Check all functions for search_path configuration and security issues

DO $$
DECLARE
    func_record record;
    func_count integer := 0;
    mutable_count integer := 0;
BEGIN
    RAISE NOTICE '=== AUDITING ALL FUNCTIONS IN PUBLIC SCHEMA ===';
    
    -- Count total functions
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public';
    
    RAISE NOTICE 'Total functions in public schema: %', func_count;
    RAISE NOTICE '';
    
    -- Check each function
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            p.proconfig as config,
            CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public'
        ORDER BY p.proname
    LOOP
        DECLARE
            has_search_path boolean := false;
            search_path_value text := '';
        BEGIN
            -- Check if function has explicit search_path
            IF func_record.config IS NOT NULL THEN
                FOR i IN 1..array_length(func_record.config, 1) LOOP
                    IF func_record.config[i] LIKE 'search_path=%' THEN
                        has_search_path := true;
                        search_path_value := func_record.config[i];
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Report function status
            RAISE NOTICE 'Function: public.% (%)', func_record.function_name, func_record.arguments;
            RAISE NOTICE '  Security: %', func_record.security_type;
            
            IF has_search_path THEN
                RAISE NOTICE '  ✓ Search Path: %', search_path_value;
            ELSE
                RAISE NOTICE '  ⚠ Search Path: MUTABLE (not set)';
                mutable_count := mutable_count + 1;
            END IF;
            
            -- Show first few lines of function definition for context
            RAISE NOTICE '  Definition preview: %', LEFT(REPLACE(func_record.definition, E'\n', ' '), 100) || '...';
            RAISE NOTICE '';
        END;
    END LOOP;
    
    RAISE NOTICE '=== AUDIT SUMMARY ===';
    RAISE NOTICE 'Total functions: %', func_count;
    RAISE NOTICE 'Functions with mutable search_path: %', mutable_count;
    
    IF mutable_count > 0 THEN
        RAISE NOTICE '⚠ WARNING: % function(s) have mutable search_path and need to be fixed!', mutable_count;
    ELSE
        RAISE NOTICE '✓ All functions have explicit search_path configuration.';
    END IF;
END;
$$;