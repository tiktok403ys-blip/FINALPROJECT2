-- Fix missing expert-reviews page section data
-- This script adds the missing hero section for the expert-reviews page

-- First, check if the page_sections table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'page_sections') THEN
        RAISE EXCEPTION 'Table page_sections does not exist. Please run the migrations first.';
    END IF;
END $$;

-- Add missing page_sections data for expert-reviews page
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

-- Verify the data was inserted
SELECT 
  page_name, 
  section_type, 
  heading, 
  LEFT(content, 50) || '...' as content_preview,
  is_active
FROM page_sections 
WHERE page_name IN ('expert-reviews', 'reviews')
ORDER BY page_name, section_type;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Expert reviews page section has been added successfully!';
    RAISE NOTICE 'You can now refresh the /expert-reviews page to see the content.';
END $$;
