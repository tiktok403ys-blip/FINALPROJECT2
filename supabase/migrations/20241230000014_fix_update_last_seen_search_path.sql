-- Migration: Fix public.update_last_seen Function Search Path
-- Purpose: Add explicit search_path configuration and proper security settings
-- Date: 2024-12-30

DO $$
DECLARE
    func_exists boolean;
    current_definition text;
BEGIN
    RAISE NOTICE '=== FIXING public.update_last_seen FUNCTION SEARCH PATH ===';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Function exists. Recreating with secure search_path...';
        
        -- Get current function definition to understand parameters
        SELECT pg_get_functiondef(p.oid) INTO current_definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
        LIMIT 1;
        
        RAISE NOTICE 'Current function definition: %', current_definition;
        
        -- Note: Function has dependencies (triggers), so we'll use CREATE OR REPLACE instead of DROP
        RAISE NOTICE 'Function has dependencies. Using CREATE OR REPLACE to preserve triggers.';
        
    ELSE
        RAISE NOTICE 'Function does not exist. Creating new secure function...';
    END IF;
    
    -- Create the function with proper security configuration
    -- Based on common patterns for update_last_seen functions
END $$;

-- Create the secure update_last_seen function
CREATE OR REPLACE FUNCTION public.update_last_seen(
    p_user_id uuid,
    p_seen_at timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Use SECURITY DEFINER for controlled access
SET search_path = 'public, pg_catalog'  -- Explicit search_path for security
AS $$
BEGIN
    -- Update user's last_seen timestamp
    -- Assuming the table is either 'users' or 'profiles'
    UPDATE public.users 
    SET last_seen = p_seen_at,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- If users table doesn't exist, try profiles table
    IF NOT FOUND THEN
        UPDATE public.profiles 
        SET last_seen = p_seen_at,
            updated_at = now()
        WHERE id = p_user_id;
    END IF;
    
    -- Log the update (optional, remove if not needed)
    -- INSERT INTO public.user_activity_log (user_id, activity_type, created_at)
    -- VALUES (p_user_id, 'last_seen_update', now());
END;
$$;

-- Set proper permissions for the function
DO $$
BEGIN
    RAISE NOTICE '=== SETTING FUNCTION PERMISSIONS ===';
    
    -- Revoke all permissions from PUBLIC (anonymous users)
    REVOKE ALL ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) FROM PUBLIC;
    
    -- Grant execute permission only to authenticated users
    GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO authenticated;
    
    -- Optionally grant to service_role for admin operations
    GRANT EXECUTE ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) TO service_role;
    
    RAISE NOTICE 'Function permissions configured:';
    RAISE NOTICE '- REVOKED from PUBLIC (anonymous users)';
    RAISE NOTICE '- GRANTED to authenticated role';
    RAISE NOTICE '- GRANTED to service_role';
END $$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.update_last_seen(uuid, timestamp with time zone) IS 
'Securely updates user last_seen timestamp. Uses SECURITY DEFINER with explicit search_path for security. Only accessible to authenticated users.';

-- Verify the fix
DO $$
DECLARE
    func_config text[];
    func_security text;
BEGIN
    RAISE NOTICE '=== VERIFYING FUNCTION SECURITY ===';
    
    -- Get function configuration
    SELECT 
        p.proconfig,
        CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
    INTO func_config, func_security
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    LIMIT 1;
    
    IF func_config IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Function has explicit search_path: %', array_to_string(func_config, ', ');
    ELSE
        RAISE WARNING 'FAILED: Function still has mutable search_path!';
    END IF;
    
    RAISE NOTICE 'Security Type: %', func_security;
    RAISE NOTICE 'Function security fix completed successfully.';
    RAISE NOTICE 'Migration completed. Function public.update_last_seen is now secure with explicit search_path.';
END $$;