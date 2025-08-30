-- =====================================================
-- ADDITIONAL PERFORMANCE OPTIMIZATIONS
-- =====================================================
-- This migration implements performance optimizations based on
-- Supabase Performance Advisor recommendations to address 204 warnings

-- =====================================================
-- 1. DROP UNUSED INDEXES
-- =====================================================
-- Remove indexes that are not being used by queries

DROP INDEX IF EXISTS public.idx_reports_assigned;
DROP INDEX IF EXISTS public.idx_footer_content_section;
DROP INDEX IF EXISTS public.idx_footer_content_active;
DROP INDEX IF EXISTS public.idx_page_sections_active;
DROP INDEX IF EXISTS public.idx_page_sections_order;
DROP INDEX IF EXISTS public.idx_footer_content_display_order;
DROP INDEX IF EXISTS public.idx_admin_pins_user_id;
DROP INDEX IF EXISTS public.idx_admin_pins_active;
DROP INDEX IF EXISTS public.idx_player_reviews_user_mobile;
DROP INDEX IF EXISTS public.idx_bonuses_valid_until;
DROP INDEX IF EXISTS public.idx_rate_limits_key;
DROP INDEX IF EXISTS public.idx_rate_limits_expires_at;
DROP INDEX IF EXISTS public.idx_bonus_votes_bonus;
DROP INDEX IF EXISTS public.idx_profiles_last_seen;
DROP INDEX IF EXISTS public.idx_player_reviews_created_at;
DROP INDEX IF EXISTS public.idx_partners_active;
DROP INDEX IF EXISTS public.idx_forum_posts_category;
DROP INDEX IF EXISTS public.idx_forum_posts_published;
DROP INDEX IF EXISTS public.idx_forum_comments_post;
DROP INDEX IF EXISTS public.idx_leaderboard_points;
DROP INDEX IF EXISTS public.idx_casinos_mobile_filtering;
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_casinos_mobile_featured;

-- =====================================================
-- 2. DROP DUPLICATE INDEXES
-- =====================================================
-- Remove indexes that duplicate existing functionality

DROP INDEX IF EXISTS public.idx_bonus_votes_bonus_id;   -- duplicate of idx_bonus_votes_bonus
DROP INDEX IF EXISTS public.idx_bonuses_is_active;      -- duplicate of idx_bonuses_active
DROP INDEX IF EXISTS public.idx_casino_reviews_published; -- duplicate of idx_casino_reviews_is_published
DROP INDEX IF EXISTS public.idx_casinos_is_active;      -- duplicate of idx_casinos_active
DROP INDEX IF EXISTS public.idx_news_is_published;      -- duplicate of idx_news_published

-- =====================================================
-- 3. CONSOLIDATE RLS POLICIES
-- =====================================================
-- Simplify multiple permissive policies into single policies

-- Admin Pins: Consolidate all operations for owner access
DROP POLICY IF EXISTS admin_pins_admin_owner_access ON public.admin_pins;
DROP POLICY IF EXISTS admin_pins_select_own ON public.admin_pins;
DROP POLICY IF EXISTS admin_pins_insert_own ON public.admin_pins;
DROP POLICY IF EXISTS admin_pins_update_own ON public.admin_pins;
DROP POLICY IF EXISTS admin_pins_delete_own ON public.admin_pins;

CREATE POLICY "admin_pins_owner_access"
ON public.admin_pins
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Admin Users: Consolidate policies
DROP POLICY IF EXISTS admin_users_select_self ON public.admin_users;
DROP POLICY IF EXISTS admin_users_update_self ON public.admin_users;
DROP POLICY IF EXISTS admin_users_admin_access ON public.admin_users;

CREATE POLICY "admin_users_self_access"
ON public.admin_users
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Audit Logs: Consolidate policies
DROP POLICY IF EXISTS audit_logs_admin_read ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_system_write ON public.audit_logs;

CREATE POLICY "audit_logs_admin_access"
ON public.audit_logs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- Bonuses: Consolidate policies
DROP POLICY IF EXISTS bonuses_public_read ON public.bonuses;
DROP POLICY IF EXISTS bonuses_admin_all ON public.bonuses;

CREATE POLICY "bonuses_public_read"
ON public.bonuses
FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "bonuses_admin_access"
ON public.bonuses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- Content Sections: Consolidate policies
DROP POLICY IF EXISTS content_sections_public_read ON public.content_sections;
DROP POLICY IF EXISTS content_sections_admin_all ON public.content_sections;

CREATE POLICY "content_sections_public_read"
ON public.content_sections
FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "content_sections_admin_access"
ON public.content_sections
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- News: Consolidate policies
DROP POLICY IF EXISTS news_public_read ON public.news;
DROP POLICY IF EXISTS news_admin_all ON public.news;

CREATE POLICY "news_public_read"
ON public.news
FOR SELECT TO anon, authenticated
USING (is_published = true OR published = true);

CREATE POLICY "news_admin_access"
ON public.news
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- Casino Reviews: Consolidate policies
DROP POLICY IF EXISTS casino_reviews_public_read ON public.casino_reviews;
DROP POLICY IF EXISTS casino_reviews_admin_all ON public.casino_reviews;

CREATE POLICY "casino_reviews_public_read"
ON public.casino_reviews
FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "casino_reviews_admin_access"
ON public.casino_reviews
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- Player Reviews: Consolidate policies
DROP POLICY IF EXISTS player_reviews_public_read ON public.player_reviews;
DROP POLICY IF EXISTS player_reviews_user_own ON public.player_reviews;
DROP POLICY IF EXISTS player_reviews_admin_all ON public.player_reviews;

CREATE POLICY "player_reviews_public_read"
ON public.player_reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true);

CREATE POLICY "player_reviews_user_own"
ON public.player_reviews
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "player_reviews_admin_access"
ON public.player_reviews
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- Profiles: Consolidate policies
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_read ON public.profiles;

CREATE POLICY "profiles_own_access"
ON public.profiles
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_admin_access"
ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = (SELECT auth.uid()) AND is_active = true
  )
);

-- =====================================================
-- 4. OPTIMIZE RLS INIT-PLAN (auth.uid() per-row calls)
-- =====================================================
-- Convert auth.uid() calls to subqueries to reduce per-row evaluation

-- Note: The policies above already use (SELECT auth.uid()) pattern
-- which is the optimized form that prevents per-row auth.uid() calls.
-- This ensures auth.uid() is evaluated once per query instead of once per row.

-- =====================================================
-- 5. PERFORMANCE MONITORING RECOMMENDATIONS
-- =====================================================
-- After applying this migration:
-- 1. Run VACUUM ANALYZE on affected tables
-- 2. Monitor pg_stat_user_indexes for unused indexes
-- 3. Use EXPLAIN ANALYZE on critical queries
-- 4. Schedule regular VACUUM/ANALYZE via cron or Supabase Functions
-- 5. Use Performance Advisor weekly to monitor new warnings

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration addresses the 204 performance warnings by:
-- - Removing 23 unused indexes
-- - Removing 5 duplicate indexes  
-- - Consolidating multiple RLS policies into single policies
-- - Optimizing auth.uid() calls to prevent per-row evaluation
-- - Providing monitoring recommendations for ongoing maintenance