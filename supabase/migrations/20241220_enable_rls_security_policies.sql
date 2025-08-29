-- Migration: Enable Row Level Security and Security Policies for Production
-- Created: 2024-12-20
-- Description: Comprehensive RLS setup with security policies for sensitive tables

-- Note: public.is_admin() function already exists from previous migration
-- Updating existing function to include role checking
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if no user is authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists in admin_users table with active status
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = $1 
    AND au.is_active = true
    AND au.role IN ('admin', 'super_admin')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if no user is authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is super admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = $1 
    AND au.is_active = true
    AND au.role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Note: public.is_owner(uuid) function already exists from previous migration
-- Adding overloaded version with two parameters for flexibility
CREATE OR REPLACE FUNCTION public.is_owner_extended(record_user_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if no user is authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the authenticated user owns the record
  RETURN record_user_id = user_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- =====================================================
-- ADMIN_PINS TABLE POLICIES
-- =====================================================

-- Ensure RLS is enabled for admin_pins
ALTER TABLE public.admin_pins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_pins_admin_access" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_owner_access" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_select_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_insert_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_update_policy" ON public.admin_pins;
DROP POLICY IF EXISTS "admin_pins_delete_policy" ON public.admin_pins;

-- Policy: Only admins and pin owners can access their pins
CREATE POLICY "admin_pins_admin_access" ON public.admin_pins
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
-- USER_FAVORITES TABLE POLICIES
-- =====================================================

-- Ensure RLS is enabled for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (keep existing ones that work)
-- Note: Existing policies using is_owner(uuid) will be kept
-- Only adding new admin read policy
DROP POLICY IF EXISTS "user_favorites_admin_read" ON public.user_favorites;

-- Note: Existing user_favorites policies using is_owner(user_id) are kept
-- They already provide proper access control for users

-- Policy: Admins can read all favorites for moderation
CREATE POLICY "user_favorites_admin_read" ON public.user_favorites
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Ensure RLS is enabled for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_logs_admin_read_only" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_system_insert" ON public.audit_logs;

-- Policy: Only admins can read audit logs
CREATE POLICY "audit_logs_admin_read_only" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: System can insert audit logs (for triggers)
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system inserts from triggers

-- =====================================================
-- ADMIN_USERS TABLE POLICIES
-- =====================================================

-- Ensure RLS is enabled for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_users_super_admin_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;

-- Policy: Only super admins can manage admin users
CREATE POLICY "admin_users_super_admin_access" ON public.admin_users
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
-- PROFILES TABLE POLICIES
-- =====================================================

-- Ensure RLS is enabled for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (keep existing ones that work)
-- Note: Existing policies using is_owner(id) will be kept
-- Only adding new admin and public policies
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Note: Existing profiles policies using is_owner(id) are kept
-- They already provide proper access control for profile owners

-- Policy: Admins can read all profiles
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Public read access for basic profile info (if needed)
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Adjust this based on your privacy requirements

-- =====================================================
-- GRANT PERMISSIONS TO ROLES
-- =====================================================

-- Grant basic permissions to anon role for public tables
GRANT SELECT ON public.profiles TO anon;

-- Grant permissions to authenticated role
GRANT ALL PRIVILEGES ON public.admin_pins TO authenticated;
GRANT ALL PRIVILEGES ON public.user_favorites TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid, uuid) TO authenticated;

-- =====================================================
-- SECURITY INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better performance on RLS queries
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_active 
  ON public.admin_users(user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_users_role_active 
  ON public.admin_users(role, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id 
  ON public.user_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_pins_user_id 
  ON public.admin_pins(user_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.is_admin(uuid) IS 'Helper function to check if user has admin privileges';
COMMENT ON FUNCTION public.is_super_admin(uuid) IS 'Helper function to check if user has super admin privileges';
COMMENT ON FUNCTION public.is_owner(uuid, uuid) IS 'Helper function to check if user owns a specific record';

COMMENT ON TABLE public.admin_pins IS 'Admin PIN management with RLS - only admins and owners can access';
COMMENT ON TABLE public.user_favorites IS 'User favorites with RLS - users can only access their own data';
COMMENT ON TABLE public.audit_logs IS 'Audit logs with RLS - read-only for admins, insert for system';
COMMENT ON TABLE public.admin_users IS 'Admin users with RLS - super admins manage, users read own';
COMMENT ON TABLE public.profiles IS 'User profiles with RLS - owners manage, admins read, public basic access';

-- =====================================================
-- VALIDATION QUERIES (for testing)
-- =====================================================

-- These queries can be used to test the policies
-- SELECT public.is_admin(); -- Should return true for admin users
-- SELECT public.is_super_admin(); -- Should return true for super admin users
-- SELECT * FROM public.admin_pins; -- Should only show user's own pins or all if admin
-- SELECT * FROM public.user_favorites; -- Should only show user's own favorites
-- SELECT * FROM public.audit_logs; -- Should only work for admins
-- SELECT * FROM public.admin_users; -- Should show own record or all if super admin
-- SELECT * FROM public.profiles; -- Should show based on access level

-- End of migration