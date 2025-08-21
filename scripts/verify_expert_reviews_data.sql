-- Verify expert reviews data exists and is properly configured
-- This script checks the current state of expert reviews data

-- Check if casino_reviews table exists and has data
DO $$
DECLARE
    review_count INTEGER;
    published_count INTEGER;
    featured_count INTEGER;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'casino_reviews') THEN
        RAISE EXCEPTION 'Table casino_reviews does not exist. Please run the migrations first.';
    END IF;
    
    -- Count total reviews
    SELECT COUNT(*) INTO review_count FROM casino_reviews;
    
    -- Count published reviews
    SELECT COUNT(*) INTO published_count FROM casino_reviews WHERE is_published = true;
    
    -- Count featured reviews
    SELECT COUNT(*) INTO featured_count FROM casino_reviews WHERE is_featured = true;
    
    RAISE NOTICE 'Expert Reviews Data Summary:';
    RAISE NOTICE 'Total Reviews: %', review_count;
    RAISE NOTICE 'Published Reviews: %', published_count;
    RAISE NOTICE 'Featured Reviews: %', featured_count;
    
    IF review_count = 0 THEN
        RAISE WARNING 'No expert reviews found. The page will show "No Expert Reviews Yet" message.';
    ELSIF published_count = 0 THEN
        RAISE WARNING 'No published expert reviews found. Check is_published flag.';
    ELSE
        RAISE NOTICE 'Expert reviews data is available and ready to display.';
    END IF;
END $$;

-- Show sample of available reviews
SELECT 
    cr.id,
    c.name as casino_name,
    cr.title,
    cr.rating,
    cr.is_published,
    cr.is_featured,
    cr.created_at
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id
ORDER BY cr.created_at DESC
LIMIT 5;

-- Check if there are any reviews with missing casino data
SELECT 
    cr.id,
    cr.casino_id,
    cr.title,
    cr.rating
FROM casino_reviews cr
LEFT JOIN casinos c ON cr.casino_id = c.id
WHERE c.id IS NULL;

-- Check page_sections for expert-reviews
SELECT 
    page_name,
    section_type,
    heading,
    LEFT(content, 100) || '...' as content_preview,
    is_active
FROM page_sections 
WHERE page_name = 'expert-reviews';

-- Show recommendations
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    RAISE NOTICE '1. If no reviews found: Run the seed data scripts first';
    RAISE NOTICE '2. If reviews exist but not published: Check is_published flag';
    RAISE NOTICE '3. If page_sections missing: Run the fix_expert_reviews_page_section.sql script';
    RAISE NOTICE '4. Refresh the /expert-reviews page after fixing data';
END $$;
