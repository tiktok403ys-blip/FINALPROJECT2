-- Setup minimum RLS policies for public access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published news" ON news;
DROP POLICY IF EXISTS "Public can view casinos" ON casinos;
DROP POLICY IF EXISTS "Public can view bonuses" ON bonuses;
DROP POLICY IF EXISTS "Public can view approved player reviews" ON player_reviews;

-- News table: Allow public read for published news
CREATE POLICY "Public can view published news" ON news
  FOR SELECT USING (is_published = true);

-- Casinos table: Allow public read access
CREATE POLICY "Public can view casinos" ON casinos
  FOR SELECT USING (true);

-- Bonuses table: Allow public read access
CREATE POLICY "Public can view bonuses" ON bonuses
  FOR SELECT USING (true);

-- Player reviews table: Allow public read for approved reviews
CREATE POLICY "Public can view approved player reviews" ON player_reviews
  FOR SELECT USING (is_approved = true);

-- Grant SELECT permissions to anon role for these tables
GRANT SELECT ON news TO anon;
GRANT SELECT ON casinos TO anon;
GRANT SELECT ON bonuses TO anon;
GRANT SELECT ON player_reviews TO anon;

-- Also grant to authenticated users
GRANT SELECT ON news TO authenticated;
GRANT SELECT ON casinos TO authenticated;
GRANT SELECT ON bonuses TO authenticated;
GRANT SELECT ON player_reviews TO authenticated;