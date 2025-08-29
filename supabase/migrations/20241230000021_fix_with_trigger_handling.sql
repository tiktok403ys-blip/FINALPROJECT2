-- Migration: Fix update_last_seen with Trigger Handling
-- Purpose: Handle trigger dependency when fixing search_path

DO $$
DECLARE
    trigger_exists boolean := false;
    func_exists boolean := false;
BEGIN
    RAISE NOTICE '=== FIXING update_last_seen WITH TRIGGER HANDLING ===';
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_last_seen'
    ) INTO trigger_exists;
    
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_last_seen'
    ) INTO func_exists;
    
    RAISE NOTICE 'Trigger exists: %, Function exists: %', trigger_exists, func_exists;
    
    -- Step 1: Drop trigger if it exists
    IF trigger_exists THEN
        RAISE NOTICE 'Dropping trigger update_profiles_last_seen...';
        DROP TRIGGER IF EXISTS update_profiles_last_seen ON public.profiles;
    END IF;
    
    -- Step 2: Drop function if it exists
    IF func_exists THEN
        RAISE NOTICE 'Dropping function update_last_seen...';
        DROP FUNCTION IF EXISTS public.update_last_seen();
        DROP FUNCTION IF EXISTS public.update_last_seen(uuid);
        DROP FUNCTION IF EXISTS public.update_last_seen(uuid, timestamp with time zone);
    END IF;
END;
$$;

-- Step 3: Create the secure function
CREATE FUNCTION public.update_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
    -- Update last_seen timestamp
    NEW.last_seen = now();
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER update_profiles_last_seen
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_seen();

-- Step 5: Set proper permissions
REVOKE ALL ON FUNCTION public.update_last_seen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_last_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_seen() TO service_role;

-- Step 6: Add documentation
COMMENT ON FUNCTION public.update_last_seen() IS 
'Trigger function to update last_seen timestamp. Uses SECURITY DEFINER with explicit search_path for security.';

-- Step 7: Final verification
DO $$
DECLARE
    func_config text[];
    search_path_value text;
    has_search_path boolean := false;
    trigger_recreated boolean := false;
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    -- Check function configuration
    SELECT proconfig INTO func_config
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_last_seen';
    
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
    
    -- Check trigger recreation
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_last_seen'
    ) INTO trigger_recreated;
    
    -- Report results
    IF has_search_path THEN
        RAISE NOTICE '✅ Function has explicit search_path: %', search_path_value;
    ELSE
        RAISE NOTICE '❌ Function still lacks explicit search_path';
    END IF;
    
    IF trigger_recreated THEN
        RAISE NOTICE '✅ Trigger update_profiles_last_seen recreated successfully';
    ELSE
        RAISE NOTICE '❌ Trigger was not recreated';
    END IF;
    
    IF has_search_path AND trigger_recreated THEN
        RAISE NOTICE '🎉 SUCCESS: Function and trigger are now secure!';
    ELSE
        RAISE NOTICE '⚠ Some issues remain to be resolved';
    END IF;
END;
$$;