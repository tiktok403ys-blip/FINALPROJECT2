-- Enable Row Level Security
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can read casinos" ON casinos FOR SELECT USING (true);
CREATE POLICY "Public can read bonuses" ON bonuses FOR SELECT USING (true);
CREATE POLICY "Public can read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public can read published news" ON news FOR SELECT USING (published = true);
CREATE POLICY "Public can read forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Public can read forum comments" ON forum_comments FOR SELECT USING (true);

-- Anyone can create reports
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read reports" ON reports FOR SELECT USING (true);

-- Authenticated users can create forum posts and comments
CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authenticated users can create comments" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON forum_comments FOR UPDATE USING (auth.uid() = author_id);
