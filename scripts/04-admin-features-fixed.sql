-- Add admin role function (simplified version)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user email contains 'admin' or is in admin list
  -- You can customize this logic based on your needs
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND (
      email ILIKE '%admin%' 
      OR email IN ('admin@casinoguide.com', 'owner@casinoguide.com')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for CRUD operations
CREATE POLICY "Admins can manage casinos" ON casinos
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage bonuses" ON bonuses
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage news" ON news
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage leaderboard" ON leaderboard
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage reports" ON reports
  FOR ALL USING (public.is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_casinos_rating ON casinos(rating DESC);
CREATE INDEX IF NOT EXISTS idx_casinos_created_at ON casinos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_bonuses_expiry_date ON bonuses(expiry_date);

-- Enable realtime (if available)
-- Note: This might not work in all Supabase instances
-- ALTER PUBLICATION supabase_realtime ADD TABLE casinos;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bonuses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE news;
-- ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
-- ALTER PUBLICATION supabase_realtime ADD TABLE reports;
