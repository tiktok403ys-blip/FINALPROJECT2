-- =====================================================
-- CRITICAL SECURITY FIX: Remove Dual Role System
-- =====================================================
-- Purpose: Fix critical security vulnerabilities identified in audit
-- Date: 2024-12-21
-- Issues Fixed:
-- 1. Remove dangerous trigger that syncs profiles.role to admin_users
-- 2. Consolidate role source to admin_users ONLY
-- 3. Prevent privilege escalation via profiles.role update
-- 4. Tighten RLS policies and GRANT permissions
-- 5. Fix handle_new_user() trigger security issues

-- =====================================================
-- 1. REMOVE DANGEROUS TRIGGER SYSTEM
-- =====================================================

-- Drop the dangerous trigger that allows privilege escalation
DROP TRIGGER IF EXISTS sync_roles_trigger ON public.profiles;
DROP TRIGGER IF EXISTS maintain_role_consistency ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_user_roles();

-- =====================================================
-- 2. DISABLE profiles.role COLUMN FOR UPDATES
-- =====================================================

-- Drop existing UPDATE policies that allow role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new UPDATE policy that EXCLUDES role column
CREATE POLICY "Users can update own profile (no role)" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent role changes by ensuring NEW.role = OLD.role
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Only super admins can update profiles including role
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
      AND au.is_active = true
    )
  );

-- Updated RLS policies to prevent role escalation

-- =====================================================
-- 3. TIGHTEN GRANT PERMISSIONS
-- =====================================================

-- Revoke excessive permissions
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;

-- Grant minimal required permissions
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Ensure admin_users table is properly secured
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_users FROM authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- Tightened GRANT permissions

-- =====================================================
-- 4. FIX handle_new_user() TRIGGER SECURITY
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create secure handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Always create profile with 'user' role (no hardcoded admin emails)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user', -- ALWAYS 'user' - no exceptions
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fixed handle_new_user() trigger - always creates user role

-- =====================================================
-- 5. CREATE SECURE profile_rpc_v5 FUNCTION
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.profile_rpc_v5(UUID);

-- Create secure RPC that uses admin_users as single source of truth
CREATE OR REPLACE FUNCTION public.profile_rpc_v5(user_id_input UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_admin BOOLEAN,
  admin_permissions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    -- Role comes from admin_users ONLY, fallback to 'user'
    COALESCE(au.role, 'user') as role,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    -- Admin status from admin_users table only
    CASE WHEN au.user_id IS NOT NULL AND au.is_active = true THEN true ELSE false END as is_admin,
    COALESCE(au.permissions, ARRAY[]::TEXT[]) as admin_permissions
  FROM public.profiles p
  LEFT JOIN public.admin_users au ON p.id = au.user_id AND au.is_active = true
  WHERE p.id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.profile_rpc_v5(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.profile_rpc_v5(UUID) TO authenticated;

-- Created secure profile_rpc_v5 function

-- =====================================================
-- 6. CLEANUP INCONSISTENT DATA
-- =====================================================

-- Set all profiles.role to 'user' except those in admin_users
UPDATE public.profiles 
SET role = 'user', updated_at = NOW()
WHERE id NOT IN (
  SELECT user_id FROM public.admin_users WHERE is_active = true
);

-- Sync profiles.role with admin_users.role for active admins only
UPDATE public.profiles 
SET role = au.role, updated_at = NOW()
FROM public.admin_users au
WHERE profiles.id = au.user_id 
AND au.is_active = true
AND profiles.role != au.role;

-- Cleaned up inconsistent role data

-- =====================================================
-- 7. ADD SECURITY CONSTRAINTS
-- =====================================================

-- Add check constraint to prevent direct role escalation
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_role_values;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_role_values 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Add function to validate role changes
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
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.profiles;
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();

-- Added role change validation

-- =====================================================
-- 8. FINAL SECURITY VERIFICATION
-- =====================================================

-- Verify dangerous triggers are removed
-- Check: SELECT COUNT(*) FROM information_schema.triggers
-- WHERE trigger_name IN ('sync_roles_trigger', 'maintain_role_consistency')
-- AND event_object_table = 'profiles';
-- Should return 0

-- Verify RLS policies are in place
-- Check: SELECT COUNT(*) FROM pg_policies
-- WHERE tablename = 'profiles' AND policyname LIKE '%no role%';
-- Should return > 0

-- Critical security fixes completed successfully
-- Role source is now consolidated to admin_users table only
-- Privilege escalation via profiles.role is now prevented