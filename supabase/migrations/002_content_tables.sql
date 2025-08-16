-- Content Tables Migration
-- This migration creates all the necessary content tables for the CRUD system

-- Create casinos table
CREATE TABLE IF NOT EXISTS casinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  license_info TEXT,
  established_year INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  bonus_amount DECIMAL(10,2),
  bonus_type VARCHAR(100),
  min_deposit DECIMAL(10,2),
  wagering_requirement INTEGER,
  payment_methods TEXT[],
  game_providers TEXT[],
  languages TEXT[],
  currencies TEXT[],
  restricted_countries TEXT[],
  features JSONB DEFAULT '{}',
  pros TEXT[],
  cons TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create bonuses table
CREATE TABLE IF NOT EXISTS bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  bonus_type VARCHAR(100) NOT NULL,
  bonus_amount DECIMAL(10,2),
  bonus_percentage INTEGER,
  max_bonus DECIMAL(10,2),
  min_deposit DECIMAL(10,2),
  wagering_requirement INTEGER,
  max_cashout DECIMAL(10,2),
  valid_for_days INTEGER,
  bonus_code VARCHAR(50),
  terms_conditions TEXT,
  eligible_games TEXT[],
  restricted_games TEXT[],
  country_restrictions TEXT[],
  is_exclusive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_name VARCHAR(255),
  author_id UUID REFERENCES auth.users(id),
  category VARCHAR(100),
  tags TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create casino_reviews table
CREATE TABLE IF NOT EXISTS casino_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  pros TEXT[],
  cons TEXT[],
  summary TEXT,
  author_name VARCHAR(255),
  author_id UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create player_reviews table
CREATE TABLE IF NOT EXISTS player_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT NOT NULL,
  pros TEXT[],
  cons TEXT[],
  deposit_amount DECIMAL(10,2),
  withdrawal_amount DECIMAL(10,2),
  games_played TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_type VARCHAR(50) NOT NULL,
  reported_content_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create footer_content table
CREATE TABLE IF NOT EXISTS footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  links JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create page_sections table for dynamic content
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name VARCHAR(100) NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  image_url TEXT,
  cta_text VARCHAR(100),
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_casinos_slug ON casinos(slug);
CREATE INDEX IF NOT EXISTS idx_casinos_active ON casinos(is_active);
CREATE INDEX IF NOT EXISTS idx_casinos_featured ON casinos(is_featured);
CREATE INDEX IF NOT EXISTS idx_casinos_rating ON casinos(rating);

CREATE INDEX IF NOT EXISTS idx_bonuses_casino_id ON bonuses(casino_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_slug ON bonuses(slug);
CREATE INDEX IF NOT EXISTS idx_bonuses_active ON bonuses(is_active);
CREATE INDEX IF NOT EXISTS idx_bonuses_type ON bonuses(bonus_type);

CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);

CREATE INDEX IF NOT EXISTS idx_casino_reviews_casino_id ON casino_reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_slug ON casino_reviews(slug);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_published ON casino_reviews(is_published);

CREATE INDEX IF NOT EXISTS idx_player_reviews_casino_id ON player_reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_player_reviews_user_id ON player_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_player_reviews_approved ON player_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_player_reviews_rating ON player_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(reported_content_type, reported_content_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned ON reports(assigned_to);

CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section_name);
CREATE INDEX IF NOT EXISTS idx_footer_content_active ON footer_content(is_active);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_name);
CREATE INDEX IF NOT EXISTS idx_page_sections_active ON page_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_page_sections_order ON page_sections(display_order);

-- Create triggers for updated_at
CREATE TRIGGER update_casinos_updated_at
  BEFORE UPDATE ON casinos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonuses_updated_at
  BEFORE UPDATE ON bonuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casino_reviews_updated_at
  BEFORE UPDATE ON casino_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_reviews_updated_at
  BEFORE UPDATE ON player_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_footer_content_updated_at
  BEFORE UPDATE ON footer_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can view active casinos" ON casinos
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active bonuses" ON bonuses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view published news" ON news
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can view published casino reviews" ON casino_reviews
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can view approved player reviews" ON player_reviews
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Public can view active footer content" ON footer_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active page sections" ON page_sections
  FOR SELECT
  USING (is_active = true);

-- Create RLS policies for admin management
CREATE POLICY "Admin users can manage casinos" ON casinos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_casinos' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage bonuses" ON bonuses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_bonuses' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage news" ON news
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_news' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage casino reviews" ON casino_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reviews' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage player reviews" ON player_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reviews' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage reports" ON reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_reports' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage footer content" ON footer_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_footer' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage page sections" ON page_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND ('manage_settings' = ANY(au.permissions) OR au.role = 'super_admin')
    )
  );

-- Users can create their own player reviews
CREATE POLICY "Users can create player reviews" ON player_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player reviews" ON player_reviews
  FOR UPDATE
  USING (auth.uid() = user_id AND is_approved = false);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Grant permissions
GRANT SELECT ON casinos TO anon, authenticated;
GRANT SELECT ON bonuses TO anon, authenticated;
GRANT SELECT ON news TO anon, authenticated;
GRANT SELECT ON casino_reviews TO anon, authenticated;
GRANT SELECT ON player_reviews TO anon, authenticated;
GRANT SELECT ON footer_content TO anon, authenticated;
GRANT SELECT ON page_sections TO anon, authenticated;

GRANT ALL ON casinos TO authenticated;
GRANT ALL ON bonuses TO authenticated;
GRANT ALL ON news TO authenticated;
GRANT ALL ON casino_reviews TO authenticated;
GRANT ALL ON player_reviews TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON footer_content TO authenticated;
GRANT ALL ON page_sections TO authenticated;