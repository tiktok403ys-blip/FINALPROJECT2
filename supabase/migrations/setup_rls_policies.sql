-- Setup RLS policies minimum untuk mengatasi 500/404 errors
-- Kebijakan SELECT untuk anon role pada tabel utama

-- News table: hanya published articles (menggunakan is_published)
DROP POLICY IF EXISTS "Public can view published news" ON news;
CREATE POLICY "Public can view published news" ON news
    FOR SELECT USING (is_published = true);

-- Casinos table: public read access
DROP POLICY IF EXISTS "Public can view casinos" ON casinos;
CREATE POLICY "Public can view casinos" ON casinos
    FOR SELECT USING (true);

-- Bonuses table: public read access
DROP POLICY IF EXISTS "Public can view bonuses" ON bonuses;
CREATE POLICY "Public can view bonuses" ON bonuses
    FOR SELECT USING (true);

-- Player reviews table: hanya approved reviews
DROP POLICY IF EXISTS "Public can view approved reviews" ON player_reviews;
CREATE POLICY "Public can view approved reviews" ON player_reviews
    FOR SELECT USING (is_approved = true);

-- Ensure RLS is enabled on all tables
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to anon role
GRANT SELECT ON news TO anon;
GRANT SELECT ON casinos TO anon;
GRANT SELECT ON bonuses TO anon;
GRANT SELECT ON player_reviews TO anon;

-- Grant permissions to authenticated role
GRANT SELECT ON news TO authenticated;
GRANT SELECT ON casinos TO authenticated;
GRANT SELECT ON bonuses TO authenticated;
GRANT SELECT ON player_reviews TO authenticated;