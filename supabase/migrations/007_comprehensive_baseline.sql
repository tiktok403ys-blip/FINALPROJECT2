-- Comprehensive baseline migration to create all missing tables
-- This is a modified version of baseline.sql that handles existing data properly

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    admin_pin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bonus_votes table
CREATE TABLE IF NOT EXISTS bonus_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bonus_id UUID REFERENCES bonuses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bonus_id, user_id)
);

-- Create casino_screenshots table
CREATE TABLE IF NOT EXISTS casino_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_screenshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can view active partners" ON partners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view published forum posts" ON forum_posts
  FOR SELECT
  USING (published = true);

CREATE POLICY "Public can view forum comments" ON forum_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view leaderboard" ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view casino screenshots" ON casino_screenshots
  FOR SELECT
  USING (is_active = true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON partners TO anon, authenticated;
GRANT SELECT ON forum_posts TO anon, authenticated;
GRANT SELECT ON forum_comments TO anon, authenticated;
GRANT SELECT ON leaderboard TO anon, authenticated;
GRANT SELECT ON bonus_votes TO anon, authenticated;
GRANT SELECT ON casino_screenshots TO anon, authenticated;

GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON partners TO authenticated;
GRANT ALL PRIVILEGES ON forum_posts TO authenticated;
GRANT ALL PRIVILEGES ON forum_comments TO authenticated;
GRANT ALL PRIVILEGES ON leaderboard TO authenticated;
GRANT ALL PRIVILEGES ON bonus_votes TO authenticated;
GRANT ALL PRIVILEGES ON casino_screenshots TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_published ON forum_posts(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(points DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_votes_bonus ON bonus_votes(bonus_id);
CREATE INDEX IF NOT EXISTS idx_casino_screenshots_casino ON casino_screenshots(casino_id, display_order);