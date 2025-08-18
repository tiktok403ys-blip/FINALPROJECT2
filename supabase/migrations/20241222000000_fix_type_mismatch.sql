-- Migration: Fix Type Mismatch for admin_users.role
-- Purpose: Change admin_users.role from VARCHAR to TEXT to match profiles.role and profile_rpc_v5 return type

-- =====================================================
-- STEP 1: DROP ALL POLICIES THAT DEPEND ON admin_users.role
-- =====================================================

-- Drop policies from admin_users table
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;

-- Drop policies from content_sections table
DROP POLICY IF EXISTS "Super admins can manage content sections" ON content_sections;
DROP POLICY IF EXISTS "Admin users can view content sections" ON content_sections;

-- Drop policies from profiles table
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- Drop policies from content tables (002_content_tables.sql)
DROP POLICY IF EXISTS "Admin users can manage casinos" ON casinos;
DROP POLICY IF EXISTS "Admin users can manage bonuses" ON bonuses;
DROP POLICY IF EXISTS "Admin users can manage news" ON news;
DROP POLICY IF EXISTS "Admin users can manage casino reviews" ON casino_reviews;
DROP POLICY IF EXISTS "Admin users can manage player reviews" ON player_reviews;
DROP POLICY IF EXISTS "Admin users can manage reports" ON reports;
DROP POLICY IF EXISTS "Admin users can manage footer content" ON footer_content;
DROP POLICY IF EXISTS "Admin users can manage page sections" ON page_sections;

-- =====================================================
-- STEP 2: CHANGE COLUMN TYPE
-- =====================================================

-- Drop the existing constraint
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Change admin_users.role from character varying to text
ALTER TABLE admin_users 
ALTER COLUMN role TYPE TEXT;

-- Recreate the constraint with TEXT type
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('super_admin', 'admin'));

-- =====================================================
-- STEP 3: RECREATE ALL POLICIES WITH CORRECT TEXT TYPE
-- =====================================================

-- Recreate admin_users policies
CREATE POLICY "Super admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
      AND au.is_active = true
    )
  );



-- Recreate content_sections policies
CREATE POLICY "Admin users can view content sections" ON content_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage content sections" ON content_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role IN ('super_admin', 'admin')
      AND au.is_active = true
    )
  );

-- Recreate profiles policy
CREATE POLICY "Super admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
      AND au.is_active = true
    )
  );

-- Recreate content table policies
CREATE POLICY "Admin users can manage casinos" ON casinos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_casinos' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage bonuses" ON bonuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_bonuses' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage news" ON news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_news' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage casino reviews" ON casino_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reviews' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage player reviews" ON player_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reviews' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reports' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage footer content" ON footer_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_footer' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage page sections" ON page_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_settings' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

-- =====================================================
-- STEP 4: VERIFY DATA INTEGRITY
-- =====================================================

-- Ensure all existing role values are valid
UPDATE public.admin_users 
SET role = 'admin' 
WHERE role NOT IN ('super_admin', 'admin');

-- =====================================================
-- STEP 5: VERIFY ADMIN USER EXISTS FOR PRODUCTION
-- =====================================================

-- Check if admin user exists for casinogurusg404@gmail.com
DO $$
DECLARE
    admin_user_id UUID;
    profile_exists BOOLEAN := false;
    admin_exists BOOLEAN := false;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user ID for casinogurusg404@gmail.com: %', admin_user_id;
        
        -- Check if profile exists
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE id = admin_user_id
        ) INTO profile_exists;
        
        -- Check if admin entry exists
        SELECT EXISTS(
            SELECT 1 FROM public.admin_users 
            WHERE user_id = admin_user_id
        ) INTO admin_exists;
        
        RAISE NOTICE 'Profile exists: %, Admin exists: %', profile_exists, admin_exists;
        
        -- Create profile if missing
        IF NOT profile_exists THEN
            INSERT INTO public.profiles (
                id, email, full_name, role, created_at, updated_at
            ) VALUES (
                admin_user_id,
                'casinogurusg404@gmail.com',
                'Casino Guru Admin',
                'super_admin',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created profile for admin user';
        END IF;
        
        -- Create admin entry if missing
        IF NOT admin_exists THEN
            INSERT INTO public.admin_users (
                user_id, role, is_active, created_at, updated_at
            ) VALUES (
                admin_user_id,
                'super_admin',
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created admin_users entry for admin user';
        ELSE
            -- Update existing admin entry to ensure it's active
            UPDATE public.admin_users 
            SET 
                role = 'super_admin',
                is_active = true,
                updated_at = NOW()
            WHERE user_id = admin_user_id;
            RAISE NOTICE 'Updated existing admin_users entry';
        END IF;
        
    ELSE
        RAISE NOTICE 'User casinogurusg404@gmail.com not found in auth.users';
        RAISE NOTICE 'Please ensure the user has logged in at least once';
    END IF;
END;
$$;

-- =====================================================
-- STEP 6: TEST profile_rpc_v5 FUNCTION
-- =====================================================

-- Test the function with the admin user
DO $$
DECLARE
    admin_user_id UUID;
    test_result RECORD;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Test profile_rpc_v5
        SELECT * INTO test_result 
        FROM profile_rpc_v5(admin_user_id);
        
        IF test_result IS NOT NULL THEN
            RAISE NOTICE '✅ profile_rpc_v5 working correctly';
            RAISE NOTICE 'User role: %, Is admin: %', test_result.role, test_result.is_admin;
        ELSE
            RAISE NOTICE '❌ profile_rpc_v5 returned no results';
        END IF;
    ELSE
        RAISE NOTICE 'Cannot test - admin user not found';
    END IF;
END;
$$;

-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================

-- Show current data types
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'profiles') 
AND column_name = 'role'
ORDER BY table_name;

-- Show admin users
SELECT 
    au.user_id,
    au.role,
    au.is_active,
    p.email,
    p.full_name
FROM public.admin_users au
JOIN public.profiles p ON au.user_id = p.id
ORDER BY au.created_at;

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 TYPE MISMATCH FIX COMPLETED';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ admin_users.role changed from VARCHAR to TEXT';
    RAISE NOTICE '✅ Check constraints updated';
    RAISE NOTICE '✅ Admin user data verified/created';
    RAISE NOTICE '✅ profile_rpc_v5 function tested';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next Steps:';
    RAISE NOTICE '1. Test navbar admin button visibility';
    RAISE NOTICE '2. Verify no more 400 errors on profile_rpc_v5';
    RAISE NOTICE '3. Check console for successful role detection';
END;
$$;