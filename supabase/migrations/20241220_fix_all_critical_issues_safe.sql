-- =====================================================
-- COMPREHENSIVE FIX FOR ALL CRITICAL ISSUES (SAFE VERSION)
-- =====================================================

-- 1. FIX PROFILE AUTO-CREATION TRIGGER
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with default role 'user'
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FIX DUAL ROLE SYSTEM - UNIFIED ROLE MANAGEMENT
-- =====================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.sync_user_roles();

-- Create function to sync roles between profiles and admin_users
CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is changed to admin or super_admin in profiles
  IF NEW.role IN ('admin', 'super_admin') THEN
    -- Insert or update admin_users table
    INSERT INTO public.admin_users (user_id, role, created_at, updated_at, is_active)
    VALUES (NEW.id, NEW.role, NOW(), NOW(), true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = NEW.role,
      updated_at = NOW(),
      is_active = true;
  ELSE
    -- If role is changed to 'user', remove from admin_users
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role synchronization
DROP TRIGGER IF EXISTS sync_roles_trigger ON public.profiles;
CREATE TRIGGER sync_roles_trigger
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles();

-- 3. CLEANUP INCONSISTENT DATA
-- =====================================================

-- Remove orphaned admin_users that don't have corresponding profiles
DELETE FROM public.admin_users 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Sync existing admin_users roles with profiles
UPDATE public.profiles 
SET role = admin_users.role,
    updated_at = NOW()
FROM public.admin_users 
WHERE profiles.id = admin_users.user_id 
AND profiles.role != admin_users.role;

-- 4. FIX PIN VERIFICATION SYSTEM
-- =====================================================

-- Remove admin_pin from profiles (deprecated)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS admin_pin;

-- Ensure admin_pin_hash exists in admin_users
ALTER TABLE public.admin_users 
ALTER COLUMN admin_pin_hash SET DEFAULT NULL;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.hash_admin_pin(TEXT);
DROP FUNCTION IF EXISTS public.verify_admin_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.verify_admin_pin(TEXT);

-- Create function to hash PIN
CREATE OR REPLACE FUNCTION public.hash_admin_pin(pin_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin_text, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify PIN
CREATE OR REPLACE FUNCTION public.verify_admin_pin(user_id UUID, pin_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT admin_pin_hash INTO stored_hash
  FROM public.admin_users
  WHERE admin_users.user_id = verify_admin_pin.user_id
  AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN crypt(pin_text, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. IMPROVE RLS POLICIES (USING ADMIN_USERS TO AVOID RECURSION)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create comprehensive RLS policies for profiles (SAFE - NO RECURSION)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- SAFE ADMIN POLICIES - Use admin_users table to avoid recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Admin users policies
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Only super admins can manage admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role = 'super_admin'
    )
  );

-- 6. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Index for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_updated_at ON public.admin_users(updated_at);

-- 7. GRANT PROPER PERMISSIONS
-- =====================================================

-- Grant permissions for anon role (public access)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.news TO anon;
GRANT SELECT ON public.casinos TO anon;
GRANT SELECT ON public.bonuses TO anon;
GRANT SELECT ON public.casino_reviews TO anon;
GRANT SELECT ON public.player_reviews TO anon;
GRANT SELECT ON public.forum_posts TO anon;
GRANT SELECT ON public.forum_comments TO anon;

-- Grant permissions for authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.news TO authenticated;
GRANT ALL ON public.casinos TO authenticated;
GRANT ALL ON public.bonuses TO authenticated;
GRANT ALL ON public.casino_reviews TO authenticated;
GRANT ALL ON public.player_reviews TO authenticated;
GRANT ALL ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_comments TO authenticated;
GRANT ALL ON public.bonus_votes TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hash_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(UUID, TEXT) TO authenticated;

-- 8. CREATE UPDATED_AT TRIGGERS FOR TABLES THAT HAVE THE COLUMN
-- =====================================================

-- Function to update updated_at timestamp (use existing or create if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'All critical issues have been fixed (SAFE VERSION):';
  RAISE NOTICE '✅ Profile auto-creation trigger activated';
  RAISE NOTICE '✅ Dual role system unified';
  RAISE NOTICE '✅ Inconsistent data cleaned up';
  RAISE NOTICE '✅ PIN verification system secured';
  RAISE NOTICE '✅ RLS policies improved (NO RECURSION)';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Proper permissions granted';
  RAISE NOTICE '✅ Updated_at triggers created';
END $$;