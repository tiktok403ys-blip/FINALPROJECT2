-- Migration: Test update_last_seen Function Functionality
-- Purpose: Verify that the fixed function and trigger work correctly

DO $$
DECLARE
    test_user_id uuid;
    initial_last_seen timestamp with time zone;
    updated_last_seen timestamp with time zone;
    profiles_table_exists boolean := false;
BEGIN
    RAISE NOTICE '=== TESTING update_last_seen FUNCTION FUNCTIONALITY ===';
    
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO profiles_table_exists;
    
    IF NOT profiles_table_exists THEN
        RAISE NOTICE '⚠ Profiles table does not exist. Creating test table...';
        
        -- Create a minimal profiles table for testing
        CREATE TABLE IF NOT EXISTS public.profiles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            email text,
            last_seen timestamp with time zone,
            updated_at timestamp with time zone DEFAULT now(),
            created_at timestamp with time zone DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✓ Test profiles table created';
    ELSE
        RAISE NOTICE '✓ Profiles table exists';
    END IF;
    
    -- Insert a test user
    INSERT INTO public.profiles (email, last_seen)
    VALUES ('test@example.com', now() - interval '1 hour')
    RETURNING id, last_seen INTO test_user_id, initial_last_seen;
    
    RAISE NOTICE '✓ Test user created with ID: %', test_user_id;
    RAISE NOTICE '  Initial last_seen: %', initial_last_seen;
    
    -- Wait a moment to ensure timestamp difference
    PERFORM pg_sleep(0.1);
    
    -- Test the trigger by updating the user
    UPDATE public.profiles 
    SET email = 'test-updated@example.com'
    WHERE id = test_user_id;
    
    -- Get the updated last_seen
    SELECT last_seen INTO updated_last_seen
    FROM public.profiles
    WHERE id = test_user_id;
    
    RAISE NOTICE '  Updated last_seen: %', updated_last_seen;
    
    -- Verify the trigger worked
    IF updated_last_seen > initial_last_seen THEN
        RAISE NOTICE '✅ SUCCESS: Trigger updated last_seen timestamp correctly';
        RAISE NOTICE '  Time difference: %', updated_last_seen - initial_last_seen;
    ELSE
        RAISE NOTICE '❌ FAILED: Trigger did not update last_seen timestamp';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.profiles WHERE id = test_user_id;
    RAISE NOTICE '✓ Test data cleaned up';
    
    -- Test function security and configuration
    DECLARE
        func_config text[];
        search_path_value text;
        security_type text;
        has_search_path boolean := false;
    BEGIN
        -- Get function details
        SELECT 
            proconfig,
            CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
        INTO func_config, security_type
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
        
        -- Check search_path
        IF func_config IS NOT NULL THEN
            FOR i IN 1..array_length(func_config, 1) LOOP
                IF func_config[i] LIKE 'search_path=%' THEN
                    has_search_path := true;
                    search_path_value := func_config[i];
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        
        RAISE NOTICE '=== SECURITY VERIFICATION ===';
        RAISE NOTICE 'Function security type: %', security_type;
        
        IF has_search_path THEN
            RAISE NOTICE '✅ Function has explicit search_path: %', search_path_value;
        ELSE
            RAISE NOTICE '❌ Function lacks explicit search_path';
        END IF;
        
        -- Check trigger exists
        IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_last_seen') THEN
            RAISE NOTICE '✅ Trigger update_profiles_last_seen exists';
        ELSE
            RAISE NOTICE '❌ Trigger update_profiles_last_seen missing';
        END IF;
    END;
    
    RAISE NOTICE '=== FUNCTIONALITY TEST COMPLETED ===';
END;
$$;