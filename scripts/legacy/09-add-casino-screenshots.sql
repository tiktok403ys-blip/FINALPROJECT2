-- Add casino screenshots table
CREATE TABLE IF NOT EXISTS casino_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- 'lobby', 'games', 'mobile', 'promotions'
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add casino banner images table
CREATE TABLE IF NOT EXISTS casino_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  subtitle TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE casino_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON casino_screenshots FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users only" ON casino_screenshots FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON casino_banners FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users only" ON casino_banners FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO casino_banners (casino_id, image_url, title, subtitle, is_primary, display_order) 
SELECT 
  id,
  '/placeholder.svg?height=400&width=1200&text=' || REPLACE(name, ' ', '+') || '+Casino+Banner&bg=1a1a2e&color=00ff88',
  name || ' Casino',
  'Experience the ultimate gaming adventure',
  true,
  1
FROM casinos 
LIMIT 5;

INSERT INTO casino_screenshots (casino_id, image_url, title, category, display_order)
SELECT 
  c.id,
  '/placeholder.svg?height=600&width=800&text=' || REPLACE(c.name, ' ', '+') || '+' || 
  CASE 
    WHEN gs.category = 'lobby' THEN 'Lobby'
    WHEN gs.category = 'games' THEN 'Games'
    WHEN gs.category = 'mobile' THEN 'Mobile'
    ELSE 'Promotions'
  END || '&bg=' || gs.bg_color || '&color=ffffff',
  CASE 
    WHEN gs.category = 'lobby' THEN 'Casino Lobby'
    WHEN gs.category = 'games' THEN 'Game Selection'
    WHEN gs.category = 'mobile' THEN 'Mobile Experience'
    ELSE 'Promotions & Bonuses'
  END,
  gs.category,
  gs.display_order
FROM casinos c
CROSS JOIN (
  VALUES 
    ('lobby', '2c3e50', 1),
    ('games', '8e44ad', 2),
    ('mobile', '27ae60', 3),
    ('promotions', 'e74c3c', 4),
    ('lobby', '34495e', 5),
    ('games', '9b59b6', 6)
) AS gs(category, bg_color, display_order)
LIMIT 30;
