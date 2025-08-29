-- Fix handle_new_user dependencies for blue-green deployment
-- Purpose: Handle trigger dependencies when switching functions
-- Strategy: Drop and recreate trigger with new function

-- =====================================================
-- HANDLE TRIGGER DEPENDENCIES
-- =====================================================

-- First, check if trigger exists and drop it
DO $$
BEGIN
    -- Drop the trigger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE LOG 'Dropped trigger on_auth_user_created';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error dropping trigger: %', SQLERRM;
END $$;

-- Now we can safely switch the function
CREATE OR REPLACE FUNCTION public.switch_handle_new_user_to_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deployment_id integer;
    result jsonb;
BEGIN
    -- Record deployment start
    INSERT INTO public.deployment_status (
        deployment_name,
        status,
        started_at,
        metadata
    ) VALUES (
        'handle_new_user_v2_switch',
        'preparing',
        NOW(),
        jsonb_build_object(
            'function', 'handle_new_user',
            'strategy', 'trigger_safe_switch'
        )
    ) RETURNING id INTO deployment_id;
    
    -- Step 1: Drop the old function (trigger already dropped)
    DROP FUNCTION IF EXISTS public.handle_new_user();
    
    -- Step 2: Rename v2 function to main function
    ALTER FUNCTION public.handle_new_user_v2() RENAME TO handle_new_user;
    
    -- Step 3: Recreate the trigger with the new function
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    
    -- Update deployment status
    UPDATE public.deployment_status 
    SET 
        status = 'completed',
        completed_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'switched_at', NOW(),
            'trigger_recreated', true,
            'success', true
        )
    WHERE id = deployment_id;
    
    result := jsonb_build_object(
        'success', true,
        'deployment_id', deployment_id,
        'message', 'handle_new_user successfully switched to v2 with trigger recreated'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Update deployment status with error
        UPDATE public.deployment_status 
        SET 
            status = 'rolled_back',
            completed_at = NOW(),
            error_message = SQLERRM,
            metadata = metadata || jsonb_build_object(
                'error_at', NOW(),
                'success', false
            )
        WHERE id = deployment_id;
        
        result := jsonb_build_object(
            'success', false,
            'deployment_id', deployment_id,
            'error', SQLERRM
        );
        
        RETURN result;
END;
$$;

-- Function to switch verify_admin_pin and hash_admin_pin safely
CREATE OR REPLACE FUNCTION public.switch_remaining_tier2_functions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deployment_id integer;
    result jsonb;
BEGIN
    -- Record deployment start
    INSERT INTO public.deployment_status (
        deployment_name,
        status,
        started_at,
        metadata
    ) VALUES (
        'remaining_tier2_functions_switch',
        'preparing',
        NOW(),
        jsonb_build_object(
            'functions', ARRAY['verify_admin_pin', 'hash_admin_pin'],
            'strategy', 'safe_switch'
        )
    ) RETURNING id INTO deployment_id;
    
    -- Switch verify_admin_pin to v2
    DROP FUNCTION IF EXISTS public.verify_admin_pin(text);
    ALTER FUNCTION public.verify_admin_pin_v2(text) RENAME TO verify_admin_pin;
    
    -- Switch hash_admin_pin to v2
    DROP FUNCTION IF EXISTS public.hash_admin_pin(text);
    ALTER FUNCTION public.hash_admin_pin_v2(text) RENAME TO hash_admin_pin;
    
    -- Update deployment status
    UPDATE public.deployment_status 
    SET 
        status = 'completed',
        completed_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'switched_at', NOW(),
            'functions_switched', ARRAY['verify_admin_pin', 'hash_admin_pin'],
            'success', true
        )
    WHERE id = deployment_id;
    
    result := jsonb_build_object(
        'success', true,
        'deployment_id', deployment_id,
        'message', 'verify_admin_pin and hash_admin_pin successfully switched to v2',
        'functions_switched', ARRAY['verify_admin_pin', 'hash_admin_pin']
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Update deployment status with error
        UPDATE public.deployment_status 
        SET 
            status = 'rolled_back',
            completed_at = NOW(),
            error_message = SQLERRM,
            metadata = metadata || jsonb_build_object(
                'error_at', NOW(),
                'success', false
            )
        WHERE id = deployment_id;
        
        result := jsonb_build_object(
            'success', false,
            'deployment_id', deployment_id,
            'error', SQLERRM
        );
        
        RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.switch_handle_new_user_to_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_remaining_tier2_functions() TO authenticated;

-- Record this deployment
INSERT INTO public.deployment_status (
    deployment_name,
    status,
    started_at,
    completed_at,
    metadata
) VALUES (
    'tier2_dependency_fix_deployed',
    'completed',
    NOW(),
    NOW(),
    jsonb_build_object(
        'tier', 2,
        'fix_type', 'trigger_dependencies',
        'functions_created', ARRAY['switch_handle_new_user_to_v2', 'switch_remaining_tier2_functions'],
        'next_step', 'call switch functions to complete deployment'
    )
);