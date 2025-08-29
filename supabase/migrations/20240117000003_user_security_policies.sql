-- Migration: User Security Policies
-- Created: 2024-01-17
-- Purpose: Create security policies for user tables (user_favorites, profiles)

-- =====================================================
-- USER_FAVORITES POLICIES
-- =====================================================

-- Users can view their own favorites
CREATE POLICY "user_favorites_select_policy" ON user_favorites
  FOR SELECT
  USING (public.is_owner(user_id) OR public.is_admin());

-- Users can add their own favorites
CREATE POLICY "user_favorites_insert_policy" ON user_favorites
  FOR INSERT
  WITH CHECK (public.is_owner(user_id));

-- Users can update their own favorites
CREATE POLICY "user_favorites_update_policy" ON user_favorites
  FOR UPDATE
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

-- Users can delete their own favorites
CREATE POLICY "user_favorites_delete_policy" ON user_favorites
  FOR DELETE
  USING (public.is_owner(user_id));

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile, admins can view all profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (public.is_owner(id) OR public.is_admin());

-- Users can insert their own profile (during registration)
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (public.is_owner(id));

-- Users can update their own profile, admins can update any profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (public.is_owner(id) OR public.is_admin())
  WITH CHECK (public.is_owner(id) OR public.is_admin());

-- Only admins can delete profiles (for moderation purposes)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ADDITIONAL SECURITY MEASURES
-- =====================================================

-- Create function to automatically set user_id on insert for user_favorites
CREATE OR REPLACE FUNCTION set_user_id_on_favorites()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set user_id to current authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON user_favorites;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_favorites();

-- Create function to automatically set profile id on insert
CREATE OR REPLACE FUNCTION set_profile_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set id to current authenticated user
  NEW.id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set profile id
DROP TRIGGER IF EXISTS set_profile_id_trigger ON profiles;
CREATE TRIGGER set_profile_id_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_id_on_insert();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- User tables are now secured with the following rules:
-- 1. user_favorites: Users can only access their own data, admins can view all
-- 2. profiles: Users can manage their own profile, admins have full access
-- 3. Automatic user_id/id setting prevents data manipulation
-- 4. Triggers ensure data integrity and prevent unauthorized access
-- 5. All policies use helper functions for consistent security checks