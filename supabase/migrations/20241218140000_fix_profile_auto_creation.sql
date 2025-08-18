-- Migration: Fix Profile Auto-Creation Trigger
-- Purpose: Ensure handle_new_user() trigger is active and working properly
-- Date: 2024-12-18

-- Step 1: Check if trigger exists
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) INTO trigger_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    RAISE NOTICE 'Function exists: %', function_exists;
END $$;

-- Step 2: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert new profile with proper defaults
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url, 
        role, 
        admin_pin,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'display_name'
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url', 
            NEW.raw_user_meta_data->>'picture',
            NEW.raw_user_meta_data->>'photo_url'
        ),
        CASE 
            WHEN NEW.email = 'casinogurusg404@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END,
        NULL, -- admin_pin starts as NULL
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created for user: % with email: %', NEW.id, NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just log and continue
        RAISE NOTICE 'Profile already exists for user: %', NEW.id;
        RETURN NEW;
    WHEN others THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 4: Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Step 6: Verify trigger is active
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users'
    AND event_object_schema = 'auth';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public';
    
    RAISE NOTICE 'Verification:';
    RAISE NOTICE 'Active triggers: %', trigger_count;
    RAISE NOTICE 'Available functions: %', function_count;
    
    IF trigger_count > 0 AND function_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Profile auto-creation trigger is now active!';
    ELSE
        RAISE WARNING 'WARNING: Trigger or function not properly created';
    END IF;
END $$;

-- Step 7: Test with existing users who might not have profiles
DO $$
DECLARE
    user_record RECORD;
    profile_count INTEGER;
BEGIN
    -- Check for users without profiles
    SELECT COUNT(*) INTO profile_count
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Users without profiles: %', profile_count;
    
    -- Create profiles for existing users who don't have them
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.profiles (
                id, 
                email, 
                full_name, 
                avatar_url, 
                role, 
                admin_pin,
                created_at,
                updated_at
            )
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name', 
                    user_record.raw_user_meta_data->>'name',
                    user_record.raw_user_meta_data->>'display_name'
                ),
                COALESCE(
                    user_record.raw_user_meta_data->>'avatar_url', 
                    user_record.raw_user_meta_data->>'picture',
                    user_record.raw_user_meta_data->>'photo_url'
                ),
                CASE 
                    WHEN user_record.email = 'casinogurusg404@gmail.com' THEN 'super_admin'
                    ELSE 'user'
                END,
                NULL,
                user_record.created_at,
                NOW()
            );
            
            RAISE NOTICE 'Created missing profile for user: %', user_record.email;
        EXCEPTION
            WHEN others THEN
                RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;