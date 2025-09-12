-- Seed data for page sections
-- Insert initial content for all pages that have been modified to use DynamicPageHero

INSERT INTO page_sections (page_name, section_type, heading, content, display_order, is_active) VALUES
-- Reports page
('reports', 'hero', 'Casino Reports & Analysis - December 2025', 'Get comprehensive insights into the online casino industry with our detailed reports and analysis. Our expert team provides in-depth reviews, market trends, and regulatory updates to help you make informed decisions about online gambling in Singapore.', 1, true),

-- Fair Gambling Codex page
('fair-gambling-codex', 'hero', 'Fair Gambling Codex', 'Our commitment to promoting fair, transparent, and responsible online gambling practices', 1, true),

-- Reviews page
('reviews', 'hero', 'Casino Reviews - Expert Analysis & Player Insights', 'Discover honest and comprehensive casino reviews from our expert team and verified players. We test every aspect of online casinos to provide you with unbiased insights, helping you choose the best platforms for your gaming experience in Singapore.', 1, true),

-- Expert Reviews page
('expert-reviews', 'hero', 'Expert Casino Reviews - Professional Analysis & Ratings', 'Get comprehensive expert reviews of online casinos with detailed analysis, ratings, and professional insights. Our expert team evaluates every aspect of casinos to help you make informed decisions.', 1, true),

-- News page
('news', 'hero', 'Latest Casino News & Industry Updates', 'Stay informed with the latest news from the online casino industry. Our team covers regulatory changes, new casino launches, game releases, and important updates that affect players in Singapore and beyond.', 1, true),

-- Casinos page
('casinos', 'hero', 'Best Online Casinos in Singapore - December 2025', 'Discover the top-rated online casinos for Singapore players. Our expert team has tested and reviewed hundreds of casinos to bring you only the most trustworthy, secure, and entertaining platforms with the best games and bonuses.', 1, true),

-- Bonuses page
('bonuses', 'hero', 'Best Casino Bonuses for December 2025 - Exclusive Offers', 'Discover the most generous casino bonuses and exclusive promotional offers available this month. Our team verifies every bonus to ensure you get the best value and fair terms. From welcome bonuses to free spins, find the perfect offer for your gaming style.', 1, true);

-- Grant permissions to authenticated users
GRANT SELECT ON page_sections TO anon;
GRANT ALL PRIVILEGES ON page_sections TO authenticated;
