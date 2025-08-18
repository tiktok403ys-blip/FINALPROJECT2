-- =====================================================
-- BYPASS ROLE VALIDATION FOR MIGRATION
-- =====================================================

-- Temporarily disable role validation trigger
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.profiles;

-- =====================================================
-- COMPREHENSIVE FIX FOR ALL CRITICAL ISSUES (BYPASS VERSION)
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

-- 2. FIX PIN VERIFICATION SYSTEM
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

-- 3. IMPROVE RLS POLICIES (USING ADMIN_USERS TO AVOID RECURSION)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users cannot change their role" ON public.profiles;

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

-- 4. CREATE PERFORMANCE INDEXES
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

-- 5. GRANT PROPER PERMISSIONS
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
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
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
GRANT EXECUTE ON FUNCTION public.hash_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(UUID, TEXT) TO authenticated;

-- 6. CREATE UPDATED_AT TRIGGERS FOR TABLES THAT HAVE THE COLUMN
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

-- 7. RE-ENABLE ROLE VALIDATION TRIGGER
-- =====================================================

-- Re-create the role validation function and trigger
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes by super admins or system
  IF OLD.role != NEW.role THEN
    -- Check if current user is super admin
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
      AND au.is_active = true
    ) THEN
      RAISE EXCEPTION 'Only super admins can change user roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role validation
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'All critical issues have been fixed (BYPASS VERSION):';
  RAISE NOTICE '✅ Profile auto-creation trigger activated';
  RAISE NOTICE '✅ PIN verification system secured';
  RAISE NOTICE '✅ RLS policies improved (NO RECURSION)';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Proper permissions granted';
  RAISE NOTICE '✅ Updated_at triggers created';
  RAISE NOTICE '✅ Role validation trigger re-enabled';
END $$;