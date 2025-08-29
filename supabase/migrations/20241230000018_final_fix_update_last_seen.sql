-- Migration: Final Fix for public.update_last_seen Function
-- Purpose: Ensure the function exists with proper search_path configuration

DO $$
DECLARE
    func_exists boolean := false;
    has_search_path boolean := false;
    func_config text[];
BEGIN
    RAISE NOTICE '=== FINAL FIX FOR public.update_last_seen FUNCTION ===';
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✓ Function public.update_last_seen exists';
        
        -- Check if it has search_path set
        SELECT proconfig INTO func_config
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        IF func_config IS NOT NULL THEN
            FOR i IN 1..array_length(func_config, 1) LOOP
                IF func_config[i] LIKE 'search_path=%' THEN
                    has_search_path := true;
                    RAISE NOTICE '✓ Function already has search_path: %', func_config[i];
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        
        IF NOT has_search_path THEN
            RAISE NOTICE '⚠ Function exists but lacks explicit search_path. Recreating...';
        ELSE
            RAISE NOTICE '✓ Function is properly configured. No action needed.';
            RETURN;
        END IF;
    ELSE
        RAISE NOTICE '❌ Function does not exist. Creating...';
    END IF;
END;
$$;

-- Create or replace the function with proper security settings
CREATE OR REPLACE FUNCTION public.update_last_seen(
    p_user_id uuid,
    p_seen_at timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
    -- Update the last_seen timestamp for the specified user
    -- This assumes there's a profiles table with user tracking
    UPDATE public.profiles
    SET last_seen = p_seen_at,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- If no rows were affected, the user might not exist
    IF NOT FOUND THEN
        RAISE NOTICE 'User with ID % not found in profiles table', p_user_id;
    END IF;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) IS 
'Updates the last_seen timestamp for a user. Uses SECURITY DEFINER with explicit search_path for security.';

-- Final verification
DO $$
DECLARE
    func_config text[];
    search_path_found boolean := false;
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    -- Get function configuration
    SELECT proconfig INTO func_config
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
    
    -- Check search_path
    IF func_config IS NOT NULL THEN
        FOR i IN 1..array_length(func_config, 1) LOOP
            IF func_config[i] LIKE 'search_path=%' THEN
                search_path_found := true;
                RAISE NOTICE '✓ Function has explicit search_path: %', func_config[i];
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    IF search_path_found THEN
        RAISE NOTICE '✅ SUCCESS: Function public.update_last_seen is now secure with explicit search_path!';
    ELSE
        RAISE EXCEPTION 'FAILED: Function still does not have explicit search_path!';
    END IF;
END;
$$;