-- Migration: Check status of public.update_updated_at_column function
-- Purpose: Analyze current search_path configuration and function definition
-- Date: 2024-12-30

-- Check if function exists and get its definition
DO $$
DECLARE
    func_def TEXT;
    func_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== CHECKING public.update_updated_at_column FUNCTION ===';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Function public.update_updated_at_column EXISTS';
        
        -- Get function definition
        SELECT pg_get_functiondef(p.oid)
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
        INTO func_def;
        
        RAISE NOTICE 'Function definition:';
        RAISE NOTICE '%', func_def;
        
        -- Check search_path configuration
        IF func_def ILIKE '%SET search_path%' THEN
            RAISE NOTICE 'Search path status: HAS EXPLICIT search_path';
        ELSE
            RAISE NOTICE 'Search path status: NO EXPLICIT search_path (MUTABLE) - NEEDS FIX';
        END IF;
        
        -- Check function security type
        IF EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON n.oid = p.pronamespace 
            WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
            AND p.prosecdef = true
        ) THEN
            RAISE NOTICE 'Security type: SECURITY DEFINER';
        ELSE
            RAISE NOTICE 'Security type: SECURITY INVOKER';
        END IF;
        
    ELSE
        RAISE NOTICE 'Function public.update_updated_at_column DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '=== CHECK COMPLETED ===';
    
END $$;