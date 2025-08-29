-- Migration: Audit all functions with mutable search_path
-- Purpose: Identify all functions that need search_path security fixes
-- Date: 2024-12-30
-- Issue: Find functions without explicit search_path that may have security vulnerabilities

-- Simple audit without aggregate functions
DO $$
DECLARE
    func_name TEXT;
    has_mutable BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== AUDIT: FUNCTIONS SEARCH_PATH STATUS ===';
    
    -- Check each function individually
    FOR func_name IN (
        SELECT p.proname
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public'
        ORDER BY p.proname
    ) LOOP
        -- Check if this specific function has search_path set
        IF EXISTS (
            SELECT 1
            FROM pg_proc p 
            JOIN pg_namespace n ON n.oid = p.pronamespace 
            WHERE n.nspname = 'public'
            AND p.proname = func_name
            AND pg_get_functiondef(p.oid) ILIKE '%SET search_path%'
        ) THEN
            RAISE NOTICE 'SECURE: public.% - has explicit search_path', func_name;
        ELSE
            RAISE NOTICE 'NEEDS FIX: public.% - mutable search_path', func_name;
            has_mutable := TRUE;
        END IF;
    END LOOP;
    
    IF has_mutable THEN
        RAISE NOTICE 'WARNING: Some functions need search_path fixes';
    ELSE
        RAISE NOTICE 'SUCCESS: All functions have explicit search_path';
    END IF;
    
    RAISE NOTICE '=== AUDIT COMPLETED ===';
    
END $$;