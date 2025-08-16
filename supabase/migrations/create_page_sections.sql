-- Create page_sections table for managing dynamic top section content
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name VARCHAR(100) NOT NULL,
  section_type VARCHAR(50) NOT NULL DEFAULT 'hero',
  heading TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for page_name and section_type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_sections_unique 
ON page_sections(page_name, section_type, display_order);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_sections_active 
ON page_sections(page_name, is_active);

-- Enable Row Level Security
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for page_sections
-- Allow public read access for active sections
CREATE POLICY "Allow public read access for active page sections" 
ON page_sections FOR SELECT 
USING (is_active = true);

-- Allow authenticated users to read all sections
CREATE POLICY "Allow authenticated read access for all page sections" 
ON page_sections FOR SELECT 
TO authenticated 
USING (true);

-- Allow admin users to manage page sections
CREATE POLICY "Allow admin full access to page sections" 
ON page_sections FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Grant permissions to roles
GRANT SELECT ON page_sections TO anon;
GRANT ALL PRIVILEGES ON page_sections TO authenticated;

-- Insert default data for existing pages
INSERT INTO page_sections (page_name, section_type, heading, description, display_order, is_active) VALUES
('reports', 'hero', 'Casino Reports & Analysis', 'Comprehensive reports and detailed analysis of online casinos, helping you make informed decisions about where to play safely.', 1, true),
('reviews', 'hero', 'Casino Reviews', 'In-depth reviews of online casinos by our expert team, covering safety, games, bonuses, and player experience.', 1, true),
('news', 'hero', 'Latest Casino News', 'Stay updated with the latest news, trends, and developments in the online gambling industry.', 1, true),
('casinos', 'hero', 'Best Online Casinos', 'Discover the top-rated online casinos with the highest safety ratings, best games, and most generous bonuses.', 1, true),
('bonuses', 'hero', 'Casino Bonuses', 'Find the best casino bonuses, free spins, and promotional offers from trusted online casinos.', 1, true),
('fair-gambling-codex', 'hero', 'Fair Gambling Codex', 'Our comprehensive guide to fair and responsible gambling practices, ensuring a safe gaming experience for all players.', 1, true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_page_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_page_sections_updated_at();