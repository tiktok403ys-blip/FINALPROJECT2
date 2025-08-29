-- Migration: Add Security Policies Only (Production)
-- Created: 2024-12-20
-- Description: Add security policies for production without modifying existing functions

-- =====================================================
-- ADD MISSING HELPER FUNCTION (SUPER ADMIN)
-- =====================================================

-- Function to check if current user is super admin (new function)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is super admin in admin_users table
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADMIN_PINS TABLE POLICIES
-- =====================================================

-- Drop any existing admin_pins policies
DROP POLICY IF EXISTS "admin_pins_admin_access" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_owner_access" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_select_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_insert_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_update_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_delete_policy" ON public.admin_pins;

-- Policy: Only admins and pin owners can access their pins
CREATE POLICY "admin_pins_admin_owner_access" ON public.admin_pins
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR 
    public.is_owner(user_id)
  )
  WITH CHECK (
    public.is_admin() OR 
    public.is_owner(user_id)
  );

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Drop any existing audit_logs policies
DROP POLICY IF EXISTS "audit_logs_admin_read_only" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_system_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

-- Policy: Only admins can read audit logs
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: System can insert audit logs (for triggers and system operations)
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system inserts

-- =====================================================
-- ADMIN_USERS TABLE POLICIES
-- =====================================================

-- Drop any existing admin_users policies
DROP POLICY IF EXISTS "admin_users_super_admin_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- Policy: Only super admins can manage admin users
CREATE POLICY "admin_users_super_admin_manage" ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Policy: Admins can read their own record
CREATE POLICY "admin_users_self_read" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_owner(user_id));

-- =====================================================
-- ADD ADMIN READ POLICIES FOR EXISTING TABLES
-- =====================================================

-- Add admin read policy for user_favorites (existing policies for users are kept)
DROP POLICY IF EXISTS "user_favorites_admin_read" ON public.user_favorites;
CREATE POLICY "user_favorites_admin_read" ON public.user_favorites
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add admin read policy for profiles (existing policies for users are kept)
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add public read policy for profiles (basic info only)
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Adjust based on privacy requirements

-- =====================================================
-- GRANT ADDITIONAL PERMISSIONS
-- =====================================================

-- Grant execute permission on new function
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Ensure proper permissions are granted
GRANT ALL PRIVILEGES ON public.admin_pins TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- CREATE PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_active_role 
  ON public.admin_users(user_id, is_active, role) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_pins_user_id 
  ON public.admin_pins(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON public.audit_logs(timestamp DESC);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.is_super_admin() IS 'Helper function to check if user has super admin privileges';

COMMENT ON POLICY "admin_pins_admin_owner_access" ON public.admin_pins IS 'Admins and pin owners can access pins';
COMMENT ON POLICY "audit_logs_admin_read" ON public.audit_logs IS 'Only admins can read audit logs';
COMMENT ON POLICY "audit_logs_system_insert" ON public.audit_logs IS 'System can insert audit logs';
COMMENT ON POLICY "admin_users_super_admin_manage" ON public.admin_users IS 'Only super admins can manage admin users';
COMMENT ON POLICY "admin_users_self_read" ON public.admin_users IS 'Admins can read their own record';
COMMENT ON POLICY "user_favorites_admin_read" ON public.user_favorites IS 'Admins can read all user favorites';
COMMENT ON POLICY "profiles_admin_read" ON public.profiles IS 'Admins can read all profiles';
COMMENT ON POLICY "profiles_public_read" ON public.profiles IS 'Public can read basic profile info';

-- =====================================================
-- VALIDATION NOTES
-- =====================================================

-- Test queries for validation:
-- SELECT public.is_admin(); -- Should work for admin users
-- SELECT public.is_super_admin(); -- Should work for super admin users
-- SELECT * FROM public.admin_pins; -- Should show based on access level
-- SELECT * FROM public.audit_logs; -- Should only work for admins
-- SELECT * FROM public.admin_users; -- Should show based on access level
-- SELECT * FROM public.user_favorites; -- Should show user's own + admin access
-- SELECT * FROM public.profiles; -- Should show based on access level

-- End of migration