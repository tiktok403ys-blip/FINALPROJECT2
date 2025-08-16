-- Add logo_url column to casinos table if not exists
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create reviews table
CREATE TABLE IF NOT EXISTS casino_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  pros TEXT[], -- Array of pros
  cons TEXT[], -- Array of cons
  author_name VARCHAR(255),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review sections table for detailed reviews
CREATE TABLE IF NOT EXISTS review_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES casino_reviews(id) ON DELETE CASCADE,
  section_title VARCHAR(255) NOT NULL,
  section_content TEXT NOT NULL,
  section_rating DECIMAL(2,1) CHECK (section_rating >= 0 AND section_rating <= 5),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE casino_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sections ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read published reviews" ON casino_reviews FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read review sections" ON review_sections FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admins can manage reviews" ON casino_reviews FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage review sections" ON review_sections FOR ALL USING (public.is_admin(auth.uid()));

-- Update existing casinos with real logo URLs
UPDATE casinos SET logo_url = CASE 
  WHEN name = 'Royal Casino' THEN '/placeholder.svg?height=80&width=200&text=Royal+Casino&bg=1a1a2e&color=16213e'
  WHEN name = 'Lucky Stars Casino' THEN '/placeholder.svg?height=80&width=200&text=Lucky+Stars&bg=0f3460&color=16537e'
  WHEN name = 'Diamond Palace' THEN '/placeholder.svg?height=80&width=200&text=Diamond+Palace&bg=533483&color=7209b7'
  WHEN name = 'Golden Spin Casino' THEN '/placeholder.svg?height=80&width=200&text=Golden+Spin&bg=f39801&color=f39c12'
  WHEN name = 'Neon Nights Casino' THEN '/placeholder.svg?height=80&width=200&text=Neon+Nights&bg=00ff88&color=000000'
  WHEN name = 'Platinum Elite Casino' THEN '/placeholder.svg?height=80&width=200&text=Platinum+Elite&bg=2c3e50&color=ecf0f1'
  WHEN name = 'Cosmic Casino' THEN '/placeholder.svg?height=80&width=200&text=Cosmic+Casino&bg=8e44ad&color=ffffff'
  WHEN name = 'Thunder Bay Casino' THEN '/placeholder.svg?height=80&width=200&text=Thunder+Bay&bg=e74c3c&color=ffffff'
  ELSE logo_url
END;

-- Insert sample reviews for each casino
INSERT INTO casino_reviews (casino_id, title, content, rating, pros, cons, author_name, is_featured) 
SELECT 
  id,
  'Comprehensive Review: ' || name,
  'After extensive testing and gameplay at ' || name || ', we have conducted a thorough evaluation of this online casino. Our review covers all aspects including game selection, user experience, payment methods, customer support, and overall reliability. This casino has been operational and continues to serve players with various gaming preferences.',
  rating,
  CASE 
    WHEN name = 'Royal Casino' THEN ARRAY['Extensive game library', 'Fast withdrawals', 'VIP program', '24/7 support', 'Mobile optimized']
    WHEN name = 'Lucky Stars Casino' THEN ARRAY['Live dealer games', 'Generous bonuses', 'User-friendly interface', 'Multiple payment methods', 'Regular promotions']
    WHEN name = 'Diamond Palace' THEN ARRAY['Luxury gaming experience', 'High betting limits', 'Exclusive games', 'Personal account manager', 'Premium rewards']
    WHEN name = 'Golden Spin Casino' THEN ARRAY['Quick payouts', 'Excellent customer service', 'Wide game variety', 'Fair bonus terms', 'Secure platform']
    WHEN name = 'Neon Nights Casino' THEN ARRAY['Progressive jackpots', 'Modern design', 'Crypto payments', 'Tournament events', 'Social features']
    ELSE ARRAY['Good game selection', 'Reliable platform', 'Fair gaming', 'Responsive support', 'Regular updates']
  END,
  CASE 
    WHEN name = 'Royal Casino' THEN ARRAY['High wagering requirements', 'Limited live chat hours', 'Geo-restrictions']
    WHEN name = 'Lucky Stars Casino' THEN ARRAY['Withdrawal limits', 'Complex bonus terms', 'Limited cryptocurrency options']
    WHEN name = 'Diamond Palace' THEN ARRAY['High minimum deposits', 'Exclusive to VIP players', 'Limited game providers']
    WHEN name = 'Golden Spin Casino' THEN ARRAY['Slower weekend support', 'Limited table games', 'Regional restrictions']
    WHEN name = 'Neon Nights Casino' THEN ARRAY['New platform', 'Limited payment methods', 'Smaller game library']
    ELSE ARRAY['Standard withdrawal times', 'Basic loyalty program', 'Limited promotions']
  END,
  'Casino Expert Team',
  CASE WHEN rating >= 4.5 THEN true ELSE false END
FROM casinos;

-- Insert detailed review sections
INSERT INTO review_sections (review_id, section_title, section_content, section_rating, display_order)
SELECT 
  cr.id,
  'Game Selection & Software',
  'The casino offers a comprehensive selection of games powered by leading software providers. The game library includes hundreds of slot machines, table games, live dealer options, and specialty games. All games are regularly tested for fairness and use certified random number generators.',
  CASE WHEN c.rating >= 4.5 THEN 4.8 WHEN c.rating >= 4.0 THEN 4.2 ELSE 3.8 END,
  1
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id;

INSERT INTO review_sections (review_id, section_title, section_content, section_rating, display_order)
SELECT 
  cr.id,
  'Bonuses & Promotions',
  'The welcome bonus package is competitive within the industry standards. Regular players can benefit from reload bonuses, free spins, cashback offers, and a comprehensive loyalty program. All bonus terms are clearly stated and fair to players.',
  CASE WHEN c.rating >= 4.5 THEN 4.6 WHEN c.rating >= 4.0 THEN 4.0 ELSE 3.6 END,
  2
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id;

INSERT INTO review_sections (review_id, section_title, section_content, section_rating, display_order)
SELECT 
  cr.id,
  'Payment Methods & Security',
  'The casino supports multiple secure payment methods including credit cards, e-wallets, bank transfers, and cryptocurrency options. All transactions are protected with SSL encryption, and the platform maintains strict security protocols to protect player data.',
  CASE WHEN c.rating >= 4.5 THEN 4.7 WHEN c.rating >= 4.0 THEN 4.3 ELSE 3.9 END,
  3
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id;

INSERT INTO review_sections (review_id, section_title, section_content, section_rating, display_order)
SELECT 
  cr.id,
  'Customer Support',
  'Customer support is available through multiple channels including live chat, email, and phone support. The support team is knowledgeable and responsive, helping players with account issues, technical problems, and general inquiries.',
  CASE WHEN c.rating >= 4.5 THEN 4.5 WHEN c.rating >= 4.0 THEN 4.1 ELSE 3.7 END,
  4
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id;

INSERT INTO review_sections (review_id, section_title, section_content, section_rating, display_order)
SELECT 
  cr.id,
  'Mobile Experience',
  'The mobile platform is fully optimized for smartphones and tablets. Players can access all games and features through mobile browsers or dedicated apps. The mobile experience maintains the same quality and functionality as the desktop version.',
  CASE WHEN c.rating >= 4.5 THEN 4.4 WHEN c.rating >= 4.0 THEN 3.9 ELSE 3.5 END,
  5
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_casino_reviews_casino_id ON casino_reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_published ON casino_reviews(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_featured ON casino_reviews(is_featured, rating DESC);
CREATE INDEX IF NOT EXISTS idx_review_sections_review_id ON review_sections(review_id, display_order);
