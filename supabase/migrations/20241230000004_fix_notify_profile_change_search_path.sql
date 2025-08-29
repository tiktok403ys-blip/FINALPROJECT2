-- Migration: Fix notify_profile_change Function Search Path Mutable Security Warning
-- Date: 2024-12-30
-- Description: Adds explicit search_path setting to notify_profile_change function to prevent search_path injection attacks

-- Drop and recreate the notify_profile_change function with explicit search_path
-- Based on the original definition in 20241218150000_standardize_auth_flow.sql
CREATE OR REPLACE FUNCTION public.notify_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public, pg_temp'
AS $$
BEGIN
  -- Notify profile changes for real-time updates
  PERFORM pg_notify(
    'profile_changes',
    json_build_object(
      'operation', TG_OP,
      'user_id', COALESCE(NEW.id, OLD.id),
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Verify the function has been updated with explicit search_path
DO $$
DECLARE
    config_array text[];
    has_search_path boolean := false;
BEGIN
    -- Get the function configuration
    SELECT p.proconfig INTO config_array
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'notify_profile_change';
    
    -- Check if search_path is configured
    IF config_array IS NOT NULL THEN
        FOR i IN 1..array_length(config_array, 1) LOOP
            IF config_array[i] LIKE 'search_path=%' THEN
                has_search_path := true;
                RAISE NOTICE 'Found search_path configuration: %', config_array[i];
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    IF NOT has_search_path THEN
        RAISE EXCEPTION 'Function notify_profile_change was not properly updated with explicit search_path';
    END IF;
    
    RAISE NOTICE 'Function notify_profile_change successfully updated with explicit search_path';
END
$$;

-- Add comment to document the security fix
COMMENT ON FUNCTION public.notify_profile_change() IS 'Trigger function for profile change notifications. Updated with explicit search_path to prevent search_path injection attacks.';