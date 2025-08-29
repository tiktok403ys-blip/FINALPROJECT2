-- Migration: Simple Fix for update_last_seen Function
-- Purpose: Direct approach to fix the search_path issue

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_last_seen(uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.update_last_seen(uuid);
DROP FUNCTION IF EXISTS public.update_last_seen();

-- Create the function with explicit search_path
CREATE FUNCTION public.update_last_seen(
    p_user_id uuid DEFAULT NULL,
    p_seen_at timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
    -- If no user_id provided, try to get from auth context
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    -- Update the last_seen timestamp for the specified user
    UPDATE public.profiles
    SET 
        last_seen = p_seen_at,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Log if user not found (but don't raise error)
    IF NOT FOUND THEN
        RAISE NOTICE 'User with ID % not found in profiles table', p_user_id;
    END IF;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO service_role;

-- Add documentation comment
COMMENT ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) IS 
'Securely updates user last_seen timestamp. Uses SECURITY DEFINER with explicit search_path="public, pg_catalog" for security.';

-- Verify the fix
DO $$
DECLARE
    func_config text[];
    search_path_value text;
    has_search_path boolean := false;
BEGIN
    RAISE NOTICE '=== VERIFYING FUNCTION FIX ===';
    
    -- Get function configuration
    SELECT proconfig INTO func_config
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
    
    RAISE NOTICE 'Function config array: %', COALESCE(array_to_string(func_config, ', '), 'NULL');
    
    -- Check for search_path
    IF func_config IS NOT NULL THEN
        FOR i IN 1..array_length(func_config, 1) LOOP
            IF func_config[i] LIKE 'search_path=%' THEN
                has_search_path := true;
                search_path_value := func_config[i];
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    IF has_search_path THEN
        RAISE NOTICE '✅ SUCCESS: Function has explicit search_path: %', search_path_value;
    ELSE
        RAISE NOTICE '❌ FAILED: Function still lacks explicit search_path';
        RAISE NOTICE 'This may indicate a PostgreSQL version or configuration issue';
    END IF;
    
    -- Show function security type
    SELECT CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
    INTO search_path_value
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
    
    RAISE NOTICE 'Function security type: %', search_path_value;
END;
$$;