-- Enable realtime for critical tables
-- This migration enables Supabase realtime functionality for tables that need real-time updates

-- Enable realtime for tables (safely handle if already exists)
DO $$
BEGIN
  -- Enable realtime for profiles table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table profiles already in realtime publication';
  END;

  -- Enable realtime for admin_users table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table admin_users already in realtime publication';
  END;

  -- Enable realtime for news table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE news;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table news already in realtime publication';
  END;

  -- Enable realtime for casinos table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE casinos;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table casinos already in realtime publication';
  END;

  -- Enable realtime for bonuses table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bonuses;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table bonuses already in realtime publication';
  END;

  -- Enable realtime for forum_posts table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table forum_posts already in realtime publication';
  END;

  -- Enable realtime for forum_comments table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table forum_comments already in realtime publication';
  END;

  -- Enable realtime for casino_reviews table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE casino_reviews;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table casino_reviews already in realtime publication';
  END;

  -- Enable realtime for player_reviews table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE player_reviews;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table player_reviews already in realtime publication';
  END;

  -- Enable realtime for bonus_votes table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bonus_votes;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table bonus_votes already in realtime publication';
  END;
END $$;

-- Note: Realtime policies are handled by existing RLS policies
-- No need to create duplicate policies for realtime functionality

-- Log the realtime enablement
DO $$
BEGIN
  RAISE LOG 'Realtime enabled for tables: profiles, admin_users, news, casinos, bonuses, forum_posts, forum_comments, casino_reviews, player_reviews, bonus_votes';
END $$;

-- Grant necessary permissions for realtime functionality
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON news TO anon, authenticated;
GRANT SELECT ON casinos TO anon, authenticated;
GRANT SELECT ON bonuses TO anon, authenticated;
GRANT SELECT ON forum_posts TO anon, authenticated;
GRANT SELECT ON forum_comments TO anon, authenticated;
GRANT SELECT ON casino_reviews TO anon, authenticated;
GRANT SELECT ON player_reviews TO anon, authenticated;
GRANT SELECT ON bonus_votes TO anon, authenticated;

-- Create indexes for better realtime performance
CREATE INDEX IF NOT EXISTS idx_profiles_realtime ON profiles(id, updated_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_realtime ON admin_users(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_news_realtime ON news(id, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_casinos_realtime ON casinos(id, updated_at);
CREATE INDEX IF NOT EXISTS idx_bonuses_realtime ON bonuses(id, updated_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_realtime ON forum_posts(id, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_forum_comments_realtime ON forum_comments(id, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_realtime ON casino_reviews(id, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_player_reviews_realtime ON player_reviews(id, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_bonus_votes_realtime ON bonus_votes(id, created_at, updated_at);

-- Verify realtime is enabled
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('profiles', 'admin_users', 'news', 'casinos', 'bonuses', 'forum_posts', 'forum_comments', 'casino_reviews', 'player_reviews', 'bonus_votes');
  
  RAISE LOG 'Realtime enabled for % tables', table_count;
  
  IF table_count < 10 THEN
    RAISE WARNING 'Expected 10 tables to have realtime enabled, but only % were found', table_count;
  END IF;
END $$;