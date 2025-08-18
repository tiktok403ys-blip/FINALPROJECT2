-- Fix public RLS policies and schema for 400/500 errors
-- This migration addresses all public table access issues

-- 1. Fix news table: add published column and RLS policy
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Update existing news records to set published=true where appropriate
UPDATE public.news 
SET published = true 
WHERE coalesce(published, false) = false 
  AND (published_at IS NOT NULL OR coalesce(is_published, false) = true);

-- Enable RLS and create policy for news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS news_select_published ON public.news;
CREATE POLICY news_select_published ON public.news 
  FOR SELECT TO anon, authenticated 
  USING (published = true);

-- 2. Fix partners table: ensure columns exist and create public policy
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partners_select_public ON public.partners;
CREATE POLICY partners_select_public ON public.partners 
  FOR SELECT TO anon, authenticated 
  USING (coalesce(is_active, true) = true);

-- 3. Fix casinos table: create public SELECT policy
ALTER TABLE public.casinos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS casinos_public_read ON public.casinos;
CREATE POLICY casinos_public_read ON public.casinos 
  FOR SELECT TO anon, authenticated 
  USING (coalesce(is_active, true) = true);

-- 4. Fix bonuses table: create public SELECT policy with is_active filter
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bonuses_public_read ON public.bonuses;
CREATE POLICY bonuses_public_read ON public.bonuses 
  FOR SELECT TO anon, authenticated 
  USING (coalesce(is_active, true) = true);

-- 5. Fix player_reviews table: public can only see approved reviews
ALTER TABLE public.player_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_reviews_select_public ON public.player_reviews;
CREATE POLICY player_reviews_select_public ON public.player_reviews 
  FOR SELECT TO anon, authenticated 
  USING (is_approved = true);

-- 6. Fix profiles RLS to avoid infinite recursion
-- Remove any existing policies that might cause recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS profiles_view_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_view ON public.profiles;

-- Create safe policies that reference admin_users instead of profiles
CREATE POLICY profiles_view_own ON public.profiles 
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_admin_view ON public.profiles 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY profiles_admin_update ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin')
    )
  );

-- Ensure admin_users policies are also safe
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_users_view_own ON public.admin_users;
DROP POLICY IF EXISTS admin_users_admin_access ON public.admin_users;

CREATE POLICY admin_users_view_own ON public.admin_users 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY admin_users_admin_access ON public.admin_users 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role = 'super_admin'
    )
  );

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON public.news TO anon, authenticated;
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT SELECT ON public.casinos TO anon, authenticated;
GRANT SELECT ON public.bonuses TO anon, authenticated;
GRANT SELECT ON public.player_reviews TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- Comment explaining the fix
COMMENT ON TABLE public.news IS 'Public access enabled with published filter';
COMMENT ON TABLE public.partners IS 'Public access enabled with is_active filter';
COMMENT ON TABLE public.casinos IS 'Public access enabled with is_active filter';
COMMENT ON TABLE public.bonuses IS 'Public access enabled with is_active filter';
COMMENT ON TABLE public.player_reviews IS 'Public access enabled with is_approved filter';
COMMENT ON TABLE public.profiles IS 'RLS policies updated to avoid infinite recursion';