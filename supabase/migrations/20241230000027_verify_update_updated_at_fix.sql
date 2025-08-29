-- Migration: Verify fix for public.update_updated_at_column function
-- Purpose: Confirm that search_path security fix was applied correctly
-- Date: 2024-12-30
-- Verification: Check that function now has explicit search_path

-- Comprehensive verification of the function fix
DO $$
DECLARE
    func_def TEXT;
    func_exists BOOLEAN := FALSE;
    has_search_path BOOLEAN := FALSE;
    is_secure BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== VERIFICATION: public.update_updated_at_column FIX ===';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    ) INTO func_exists;
    
    IF NOT func_exists THEN
        RAISE NOTICE 'ERROR: Function public.update_updated_at_column does not exist!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Function exists';
    
    -- Get function definition
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    INTO func_def;
    
    -- Check for explicit search_path
    IF func_def ILIKE '%SET search_path%' THEN
        has_search_path := TRUE;
        RAISE NOTICE 'SUCCESS: Function has explicit search_path';
        
        -- Check for specific secure search_path
        IF func_def ILIKE '%SET search_path = ''public, pg_catalog''%' OR 
           func_def ILIKE '%SET search_path = public, pg_catalog%' THEN
            is_secure := TRUE;
            RAISE NOTICE 'SUCCESS: Function uses secure search_path (public, pg_catalog)';
        ELSE
            RAISE NOTICE 'WARNING: Function has search_path but may not be optimal';
        END IF;
    ELSE
        RAISE NOTICE 'ERROR: Function still missing explicit search_path!';
    END IF;
    
    -- Check function return type and language
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
        AND p.prorettype = 'trigger'::regtype
        AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    ) THEN
        RAISE NOTICE 'SUCCESS: Function has correct return type (trigger) and language (plpgsql)';
    ELSE
        RAISE NOTICE 'WARNING: Function may have incorrect return type or language';
    END IF;
    
    -- Final verification summary
    IF func_exists AND has_search_path AND is_secure THEN
        RAISE NOTICE '=== VERIFICATION RESULT: PASSED ===';
        RAISE NOTICE 'Function public.update_updated_at_column is now secure';
    ELSE
        RAISE NOTICE '=== VERIFICATION RESULT: FAILED ===';
        RAISE NOTICE 'Function may still have security issues';
    END IF;
    
END $$;