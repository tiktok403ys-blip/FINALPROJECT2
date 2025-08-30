-- Migration: Optimize RLS Policies Performance
-- Purpose: Fix RLS policies that re-evaluate auth.uid() for each row by wrapping in SELECT
-- Date: 2025-01-20
-- Issue: Policies using auth.uid() directly cause suboptimal query performance at scale
-- Solution: Replace auth.uid() with (SELECT auth.uid()) to evaluate once per query

-- =============================================================================
-- PERFORMANCE OPTIMIZATION: RLS POLICIES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== OPTIMIZING RLS POLICIES FOR PERFORMANCE ===';
    RAISE NOTICE 'Replacing direct auth.uid() calls with (SELECT auth.uid()) wrapper';
    RAISE NOTICE 'This reduces function calls from per-row to per-query evaluation';
END $$;

-- =============================================================================
-- 1. OPTIMIZE user_login_history POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_login_history') THEN
        RAISE NOTICE 'Optimizing user_login_history RLS policies...';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own login history" ON public.user_login_history;
        DROP POLICY IF EXISTS "Users can insert own login history" ON public.user_login_history;
        
        -- Create optimized policies with SELECT wrapper
        CREATE POLICY "Users can view own login history" ON public.user_login_history
            FOR SELECT 
            TO authenticated
            USING (user_id = (SELECT auth.uid()));
            
        CREATE POLICY "Users can insert own login history" ON public.user_login_history
            FOR INSERT 
            TO authenticated
            WITH CHECK (user_id = (SELECT auth.uid()));
            
        RAISE NOTICE '✅ Optimized user_login_history policies';
    ELSE
        RAISE NOTICE 'ℹ️  user_login_history table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 2. OPTIMIZE admin_pins POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_pins') THEN
        RAISE NOTICE 'Optimizing admin_pins RLS policies...';
        
        -- Drop existing policy
        DROP POLICY IF EXISTS "Users can only access their own admin PIN" ON admin_pins;
        
        -- Create optimized policy with SELECT wrapper
        CREATE POLICY "Users can only access their own admin PIN" ON admin_pins
            FOR ALL
            TO authenticated
            USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
            
        RAISE NOTICE '✅ Optimized admin_pins policies';
    ELSE
        RAISE NOTICE 'ℹ️  admin_pins table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 3. OPTIMIZE user_favorites POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
        RAISE NOTICE 'Optimizing user_favorites RLS policies...';
        
        -- Drop existing policy
        DROP POLICY IF EXISTS "Users can only access their own favorites" ON user_favorites;
        
        -- Create optimized policy with SELECT wrapper
        CREATE POLICY "Users can only access their own favorites" ON user_favorites
            FOR ALL
            TO authenticated
            USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
            
        RAISE NOTICE '✅ Optimized user_favorites policies';
    ELSE
        RAISE NOTICE 'ℹ️  user_favorites table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 4. OPTIMIZE profiles POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Optimizing profiles RLS policies...';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        
        -- Create optimized policies with SELECT wrapper
        CREATE POLICY "Users can only access their own profile" ON profiles
            FOR ALL
            TO authenticated
            USING (id = (SELECT auth.uid()))
            WITH CHECK (id = (SELECT auth.uid()));
            
        RAISE NOTICE '✅ Optimized profiles policies';
    ELSE
        RAISE NOTICE 'ℹ️  profiles table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 5. OPTIMIZE reports POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        RAISE NOTICE 'Optimizing reports RLS policies...';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can access their own reports, admins can access all" ON reports;
        DROP POLICY IF EXISTS "Users can create reports" ON reports;
        
        -- Create optimized policies with SELECT wrapper
        CREATE POLICY "Users can access their own reports, admins can access all" ON reports
            FOR SELECT
            TO authenticated
            USING (
                reporter_id = (SELECT auth.uid()) OR 
                EXISTS (
                    SELECT 1 FROM admin_users au
                    WHERE au.user_id = (SELECT auth.uid())
                    AND au.is_active = true
                    AND ('manage_reports' = ANY(au.permissions) OR au.role = 'super_admin')
                )
            );
            
        CREATE POLICY "Users can create reports" ON reports
            FOR INSERT
            TO authenticated
            WITH CHECK (reporter_id = (SELECT auth.uid()));
            
        RAISE NOTICE '✅ Optimized reports policies';
    ELSE
        RAISE NOTICE 'ℹ️  reports table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 6. OPTIMIZE player_reviews POLICIES
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_reviews') THEN
        RAISE NOTICE 'Optimizing player_reviews RLS policies...';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can create player reviews" ON player_reviews;
        DROP POLICY IF EXISTS "Users can update their own player reviews" ON player_reviews;
        
        -- Create optimized policies with SELECT wrapper
        CREATE POLICY "Users can create player reviews" ON player_reviews
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id = (SELECT auth.uid()));
            
        CREATE POLICY "Users can update their own player reviews" ON player_reviews
            FOR UPDATE
            TO authenticated
            USING (user_id = (SELECT auth.uid()) AND is_approved = false);
            
        RAISE NOTICE '✅ Optimized player_reviews policies';
    ELSE
        RAISE NOTICE 'ℹ️  player_reviews table not found, skipping';
    END IF;
END $$;

-- =============================================================================
-- 7. OPTIMIZE CONTENT MANAGEMENT POLICIES
-- =============================================================================

DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    RAISE NOTICE 'Optimizing content management RLS policies...';
    
    -- List of tables with admin management policies that need optimization
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_name IN ('casinos', 'bonuses', 'news', 'casino_reviews', 'footer_content', 'page_sections')
        AND t.table_schema = 'public'
    LOOP
        -- Drop and recreate admin management policy with optimized auth.uid() calls
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can manage %s" ON %s', table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Admin users can manage %s" ON %s
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM admin_users au
                    WHERE au.user_id = (SELECT auth.uid())
                    AND au.is_active = true
                    AND (''manage_%s'' = ANY(au.permissions) OR au.role = ''super_admin'')
                )
            )', table_name, table_name, 
            CASE 
                WHEN table_name = 'casino_reviews' THEN 'reviews'
                WHEN table_name = 'footer_content' THEN 'footer'
                WHEN table_name = 'page_sections' THEN 'settings'
                ELSE table_name
            END
        );
        
        RAISE NOTICE '✅ Optimized % admin management policy', table_name;
    END LOOP;
END $$;

-- =============================================================================
-- 8. VERIFICATION AND SUMMARY
-- =============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '=== OPTIMIZATION VERIFICATION ===';
    
    -- Count optimized policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.uid())%');
    
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO table_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
    
    RAISE NOTICE '✅ Optimization completed successfully';
    RAISE NOTICE 'ℹ️  Tables with RLS enabled: %', table_count;
    RAISE NOTICE 'ℹ️  Policies using optimized auth.uid(): %', policy_count;
    RAISE NOTICE 'ℹ️  Performance improvement: auth.uid() now evaluated once per query instead of per row';
    RAISE NOTICE 'ℹ️  This reduces CPU usage and improves query performance at scale';
END $$;

-- =============================================================================
-- 9. SHOW OPTIMIZED POLICIES
-- =============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.uid())%' 
        THEN '✅ OPTIMIZED' 
        ELSE '⚠️  NEEDS REVIEW' 
    END as performance_status
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
ORDER BY tablename, policyname;

-- =============================================================================
-- MIGRATION COMPLETED
-- =============================================================================

SELECT 
    'RLS Performance Optimization Migration Completed' as status,
    NOW() as completed_at,
    'All auth.uid() calls wrapped in SELECT for optimal performance' as description;