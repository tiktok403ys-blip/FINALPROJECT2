-- Migration: Fix search_path for public.update_updated_at_column function
-- Purpose: Add explicit SET search_path to prevent security vulnerabilities
-- Date: 2024-12-30
-- Issue: Function has mutable search_path which can lead to security risks

-- Recreate the function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public, pg_catalog'  -- Explicit search_path for security
AS $$
BEGIN
    -- Update the updated_at column with current timestamp
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to automatically update updated_at column. '
'Uses explicit search_path for security to prevent search_path manipulation attacks.';

-- Verify the function was updated correctly
DO $$
DECLARE
    func_def TEXT;
BEGIN
    RAISE NOTICE '=== VERIFYING FUNCTION FIX ===';
    
    -- Get updated function definition
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    INTO func_def;
    
    -- Check if search_path is now set
    IF func_def ILIKE '%SET search_path%' THEN
        RAISE NOTICE 'SUCCESS: Function now has explicit search_path';
    ELSE
        RAISE NOTICE 'ERROR: Function still missing explicit search_path';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETED ===';
END $$;