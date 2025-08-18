-- ============================================================================
-- COMPLETE DATABASE SCHEMA: RLS POLICIES & FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This migration completes missing RLS policies and foreign key constraints
-- for all tables to ensure data integrity and proper access control.
-- ============================================================================

-- Enable RLS on all tables that don't have it yet
ALTER TABLE IF EXISTS casino_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS casino_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bonus_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS page_sections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PUBLIC ACCESS TABLES
-- ============================================================================

-- Casinos: Public read, admin write
DROP POLICY IF EXISTS "Public can view casinos" ON casinos;
CREATE POLICY "Public can view casinos" ON casinos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage casinos" ON casinos;
CREATE POLICY "Admins can manage casinos" ON casinos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Bonuses: Public read, admin write
DROP POLICY IF EXISTS "Public can view bonuses" ON bonuses;
CREATE POLICY "Public can view bonuses" ON bonuses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage bonuses" ON bonuses;
CREATE POLICY "Admins can manage bonuses" ON bonuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- News: Public read, admin write
DROP POLICY IF EXISTS "Public can view news" ON news;
CREATE POLICY "Public can view news" ON news
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage news" ON news;
CREATE POLICY "Admins can manage news" ON news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Casino Screenshots: Public read, admin write
DROP POLICY IF EXISTS "Public can view casino screenshots" ON casino_screenshots;
CREATE POLICY "Public can view casino screenshots" ON casino_screenshots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage casino screenshots" ON casino_screenshots;
CREATE POLICY "Admins can manage casino screenshots" ON casino_screenshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Content Sections: Public read, admin write
DROP POLICY IF EXISTS "Public can view content sections" ON content_sections;
CREATE POLICY "Public can view content sections" ON content_sections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage content sections" ON content_sections;
CREATE POLICY "Admins can manage content sections" ON content_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Page Sections: Public read, admin write
DROP POLICY IF EXISTS "Public can view page sections" ON page_sections;
CREATE POLICY "Public can view page sections" ON page_sections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage page sections" ON page_sections;
CREATE POLICY "Admins can manage page sections" ON page_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Footer Content: Public read, admin write
DROP POLICY IF EXISTS "Public can view footer content" ON footer_content;
CREATE POLICY "Public can view footer content" ON footer_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage footer content" ON footer_content;
CREATE POLICY "Admins can manage footer content" ON footer_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Partners: Public read, admin write
DROP POLICY IF EXISTS "Public can view partners" ON partners;
CREATE POLICY "Public can view partners" ON partners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR USER-SPECIFIC TABLES
-- ============================================================================

-- Casino Reviews: Users can manage their own, public can read
DROP POLICY IF EXISTS "Public can view casino reviews" ON casino_reviews;
CREATE POLICY "Public can view casino reviews" ON casino_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their casino reviews" ON casino_reviews;
CREATE POLICY "Users can manage their casino reviews" ON casino_reviews
  FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all casino reviews" ON casino_reviews;
CREATE POLICY "Admins can manage all casino reviews" ON casino_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Player Reviews: Users can manage their own, public can read
DROP POLICY IF EXISTS "Public can view player reviews" ON player_reviews;
CREATE POLICY "Public can view player reviews" ON player_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their player reviews" ON player_reviews;
CREATE POLICY "Users can manage their player reviews" ON player_reviews
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all player reviews" ON player_reviews;
CREATE POLICY "Admins can manage all player reviews" ON player_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Forum Posts: Users can manage their own, public can read
DROP POLICY IF EXISTS "Public can view forum posts" ON forum_posts;
CREATE POLICY "Public can view forum posts" ON forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their forum posts" ON forum_posts;
CREATE POLICY "Users can manage their forum posts" ON forum_posts
  FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all forum posts" ON forum_posts;
CREATE POLICY "Admins can manage all forum posts" ON forum_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Forum Comments: Users can manage their own, public can read
DROP POLICY IF EXISTS "Public can view forum comments" ON forum_comments;
CREATE POLICY "Public can view forum comments" ON forum_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their forum comments" ON forum_comments;
CREATE POLICY "Users can manage their forum comments" ON forum_comments
  FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all forum comments" ON forum_comments;
CREATE POLICY "Admins can manage all forum comments" ON forum_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Bonus Votes: Users can manage their own, public can read
DROP POLICY IF EXISTS "Public can view bonus votes" ON bonus_votes;
CREATE POLICY "Public can view bonus votes" ON bonus_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their bonus votes" ON bonus_votes;
CREATE POLICY "Users can manage their bonus votes" ON bonus_votes
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all bonus votes" ON bonus_votes;
CREATE POLICY "Admins can manage all bonus votes" ON bonus_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Leaderboard: Public read, admin write
DROP POLICY IF EXISTS "Public can view leaderboard" ON leaderboard;
CREATE POLICY "Public can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage leaderboard" ON leaderboard;
CREATE POLICY "Admins can manage leaderboard" ON leaderboard
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR ADMIN-ONLY TABLES
-- ============================================================================

-- Reports: Admin only
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Audit Logs: Admin only
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints where missing (check if they don't exist first)
DO $$
BEGIN
  -- Casino Reviews -> Casinos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'casino_reviews_casino_id_fkey'
  ) THEN
    ALTER TABLE casino_reviews 
    ADD CONSTRAINT casino_reviews_casino_id_fkey 
    FOREIGN KEY (casino_id) REFERENCES casinos(id) ON DELETE CASCADE;
  END IF;

  -- Casino Reviews -> Profiles (already exists)
  -- Foreign key constraint casino_reviews_user_id_fkey already handled

  -- Player Reviews -> Profiles (already exists)
  -- Foreign key constraint player_reviews_user_id_fkey already handled

  -- Forum Posts -> Profiles (already exists)
  -- Foreign key constraint forum_posts_user_id_fkey already handled

  -- Forum Comments -> Forum Posts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'forum_comments_post_id_fkey'
  ) THEN
    ALTER TABLE forum_comments 
    ADD CONSTRAINT forum_comments_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
  END IF;

  -- Forum Comments -> Profiles (already exists)
  -- Foreign key constraint forum_comments_user_id_fkey already handled

  -- Bonus Votes -> Bonuses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bonus_votes_bonus_id_fkey'
  ) THEN
    ALTER TABLE bonus_votes 
    ADD CONSTRAINT bonus_votes_bonus_id_fkey 
    FOREIGN KEY (bonus_id) REFERENCES bonuses(id) ON DELETE CASCADE;
  END IF;

  -- Bonus Votes -> Profiles (already exists)
  -- Foreign key constraint bonus_votes_user_id_fkey already handled

  -- Casino Screenshots -> Casinos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'casino_screenshots_casino_id_fkey'
  ) THEN
    ALTER TABLE casino_screenshots 
    ADD CONSTRAINT casino_screenshots_casino_id_fkey 
    FOREIGN KEY (casino_id) REFERENCES casinos(id) ON DELETE CASCADE;
  END IF;

  -- Bonuses -> Casinos (if casino_id exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bonuses' AND column_name = 'casino_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bonuses_casino_id_fkey'
  ) THEN
    ALTER TABLE bonuses 
    ADD CONSTRAINT bonuses_casino_id_fkey 
    FOREIGN KEY (casino_id) REFERENCES casinos(id) ON DELETE SET NULL;
  END IF;

  -- Leaderboard -> Profiles (if user_id exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leaderboard_user_id_fkey'
  ) THEN
    ALTER TABLE leaderboard 
    ADD CONSTRAINT leaderboard_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS TO ROLES
-- ============================================================================

-- Grant SELECT permissions to anon role for public tables
GRANT SELECT ON casinos TO anon;
GRANT SELECT ON bonuses TO anon;
GRANT SELECT ON news TO anon;
GRANT SELECT ON casino_screenshots TO anon;
GRANT SELECT ON content_sections TO anon;
GRANT SELECT ON page_sections TO anon;
GRANT SELECT ON footer_content TO anon;
GRANT SELECT ON partners TO anon;
GRANT SELECT ON casino_reviews TO anon;
GRANT SELECT ON player_reviews TO anon;
GRANT SELECT ON forum_posts TO anon;
GRANT SELECT ON forum_comments TO anon;
GRANT SELECT ON bonus_votes TO anon;
GRANT SELECT ON leaderboard TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Database schema completion migration applied successfully';
  RAISE LOG 'RLS policies and foreign key constraints have been added to all tables';
END;
$$;

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = table_record.schemaname
      AND c.relname = table_record.tablename
      AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'RLS not enabled on table: %.%', table_record.schemaname, table_record.tablename;
    END IF;
  END LOOP;
  
  RAISE LOG 'RLS verification completed';
END;
$$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================