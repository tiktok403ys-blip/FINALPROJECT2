-- Add missing page_sections data for expert-reviews page
-- This migration adds the missing hero section for the expert-reviews page

INSERT INTO page_sections (page_name, section_type, heading, content, display_order, is_active) 
VALUES (
  'expert-reviews', 
  'hero', 
  'Expert Casino Reviews - Professional Analysis & Ratings', 
  'Get comprehensive expert reviews of online casinos with detailed analysis, ratings, and professional insights. Our expert team evaluates every aspect of casinos to help you make informed decisions.', 
  1, 
  true
) ON CONFLICT (page_name, section_type) DO NOTHING;

-- Update existing reviews page section to include player reviews context
UPDATE page_sections 
SET content = 'Discover honest and comprehensive casino reviews from our expert team and verified players. We test every aspect of online casinos to provide you with unbiased insights, helping you choose the best platforms for your gaming experience in Singapore.'
WHERE page_name = 'reviews' AND section_type = 'hero';
