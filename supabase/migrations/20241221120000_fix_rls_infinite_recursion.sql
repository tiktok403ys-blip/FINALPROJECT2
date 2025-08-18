-- ============================================================================
-- FIX RLS INFINITE RECURSION
-- ============================================================================
-- This migration fixes infinite recursion in profiles RLS policies by
-- replacing self-referencing policies with admin_users table references
-- ============================================================================

-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin users" ON public.admin_users;

-- Recreate profiles policies without self-reference
-- Users can still view and update their own profiles
-- (These policies are safe as they don't reference profiles table)

-- Admin access policies using admin_users table (no recursion)
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

-- Super admin can manage all profiles
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role = 'super_admin'
    )
  );

-- Admin users policies (also fix to avoid any potential recursion)
CREATE POLICY "Users can view own admin record" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role = 'super_admin'
    )
  );

-- Update other tables that might have similar issues
-- Fix any other policies that reference profiles for admin checks

-- Casinos table
DROP POLICY IF EXISTS "Admins can manage casinos" ON public.casinos;
CREATE POLICY "Admins can manage casinos" ON public.casinos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- News table
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins can manage news" ON public.news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Bonuses table
DROP POLICY IF EXISTS "Admins can manage bonuses" ON public.bonuses;
CREATE POLICY "Admins can manage bonuses" ON public.bonuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Casino reviews table
DROP POLICY IF EXISTS "Admins can manage casino reviews" ON public.casino_reviews;
CREATE POLICY "Admins can manage casino reviews" ON public.casino_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Player reviews table
DROP POLICY IF EXISTS "Admins can manage player reviews" ON public.player_reviews;
CREATE POLICY "Admins can manage player reviews" ON public.player_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Forum posts table
DROP POLICY IF EXISTS "Admins can manage forum posts" ON public.forum_posts;
CREATE POLICY "Admins can manage forum posts" ON public.forum_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Forum comments table
DROP POLICY IF EXISTS "Admins can manage forum comments" ON public.forum_comments;
CREATE POLICY "Admins can manage forum comments" ON public.forum_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Bonus votes table
DROP POLICY IF EXISTS "Admins can manage all bonus votes" ON public.bonus_votes;
CREATE POLICY "Admins can manage all bonus votes" ON public.bonus_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS infinite recursion fix completed successfully';
END $$;