-- Create footer content table
CREATE TABLE IF NOT EXISTS footer_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  link_url TEXT,
  link_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partners/sponsors table for logo slider
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  partner_type VARCHAR(50) DEFAULT 'sponsor', -- sponsor, affiliate, partner
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read footer content" ON footer_content FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read partners" ON partners FOR SELECT USING (is_active = true);

-- Admin policies
CREATE POLICY "Admins can manage footer content" ON footer_content FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage partners" ON partners FOR ALL USING (public.is_admin(auth.uid()));

-- Insert footer content
INSERT INTO footer_content (section, title, content, link_url, link_text, display_order) VALUES
-- About section
('about', 'About Casino Guide', 'Your trusted source for online casino reviews, bonuses, and gaming insights. We provide comprehensive guides to help you make informed decisions in the world of online gambling.', '/about', 'Learn More', 1),

-- Quick Links
('quick_links', 'Top Casinos', NULL, '/casinos', 'Browse Casinos', 1),
('quick_links', 'Best Bonuses', NULL, '/bonuses', 'View Bonuses', 2),
('quick_links', 'Player Reviews', NULL, '/forum', 'Read Reviews', 3),
('quick_links', 'Latest News', NULL, '/news', 'Casino News', 4),
('quick_links', 'Leaderboard', NULL, '/leaderboard', 'Top Players', 5),

-- Support section
('support', 'Help Center', NULL, '/help', 'Get Help', 1),
('support', 'Contact Us', NULL, '/contact', 'Contact', 2),
('support', 'Report Issue', NULL, '/reports', 'Report Problem', 3),
('support', 'FAQ', NULL, '/faq', 'Frequently Asked Questions', 4),

-- Legal section
('legal', 'Terms of Service', NULL, '/terms', 'Terms & Conditions', 1),
('legal', 'Privacy Policy', NULL, '/privacy', 'Privacy Policy', 2),
('legal', 'Responsible Gaming', NULL, '/responsible-gaming', 'Play Responsibly', 3),
('legal', 'Cookie Policy', NULL, '/cookies', 'Cookie Policy', 4),

-- Social section
('social', 'Follow Us', 'Stay connected for the latest updates and exclusive offers', NULL, NULL, 1),

-- Contact info
('contact', 'Email', 'support@casinoguide.com', 'mailto:support@casinoguide.com', 'Email Us', 1),
('contact', 'Address', '123 Gaming Street, Casino City, CC 12345', NULL, NULL, 2),
('contact', 'Phone', '+1 (555) 123-4567', 'tel:+15551234567', 'Call Us', 3);

-- Insert partner/sponsor data for logo slider
INSERT INTO partners (name, logo_url, website_url, description, partner_type, display_order) VALUES
('Evolution Gaming', '/placeholder.svg?height=60&width=120&text=Evolution', 'https://evolution.com', 'Leading live casino game provider', 'partner', 1),
('NetEnt', '/placeholder.svg?height=60&width=120&text=NetEnt', 'https://netent.com', 'Premium slot game developer', 'partner', 2),
('Microgaming', '/placeholder.svg?height=60&width=120&text=Microgaming', 'https://microgaming.com', 'Pioneer in online gaming software', 'partner', 3),
('Pragmatic Play', '/placeholder.svg?height=60&width=120&text=Pragmatic', 'https://pragmaticplay.com', 'Multi-product content provider', 'partner', 4),
('Play\'n GO', '/placeholder.svg?height=60&width=120&text=PlaynGO', 'https://playngo.com', 'Mobile-first game developer', 'partner', 5),
('Red Tiger Gaming', '/placeholder.svg?height=60&width=120&text=RedTiger', 'https://redtiger.com', 'Innovative slot game creator', 'partner', 6),
('Big Time Gaming', '/placeholder.svg?height=60&width=120&text=BigTime', 'https://bigtimegaming.com', 'Megaways slot innovator', 'partner', 7),
('Yggdrasil Gaming', '/placeholder.svg?height=60&width=120&text=Yggdrasil', 'https://yggdrasilgaming.com', 'Superior gaming experiences', 'partner', 8),
('Quickspin', '/placeholder.svg?height=60&width=120&text=Quickspin', 'https://quickspin.com', 'Swedish slot game studio', 'partner', 9),
('Thunderkick', '/placeholder.svg?height=60&width=120&text=Thunder', 'https://thunderkick.com', 'Unique and quirky slot games', 'partner', 10);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section, display_order);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active, display_order);
