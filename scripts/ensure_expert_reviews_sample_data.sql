-- Ensure sample expert reviews data exists with proper structure
-- This script creates sample data if none exists, using the correct schema

-- First, check if we have any casinos
DO $$
DECLARE
    casino_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO casino_count FROM casinos;
    
    IF casino_count = 0 THEN
        RAISE EXCEPTION 'No casinos found. Please run the casino seed data first.';
    END IF;
    
    RAISE NOTICE 'Found % casinos to create reviews for', casino_count;
END $$;

-- Create sample expert reviews if none exist
INSERT INTO casino_reviews (
    casino_id, 
    title, 
    content, 
    rating, 
    pros, 
    cons, 
    summary,
    slug,
    author_name, 
    is_featured, 
    is_published, 
    published_at
)
SELECT 
    c.id,
    'Comprehensive Expert Review: ' || c.name,
    'Our expert team has conducted a thorough evaluation of ' || c.name || '. After extensive testing and analysis, we can confirm this casino offers a solid gaming experience with a good selection of games, reliable payment methods, and responsive customer support. The platform demonstrates strong security measures and fair gaming practices, making it a trustworthy choice for players seeking quality online casino entertainment.

Key Findings:
• Game Selection: ' || c.name || ' offers a diverse library of games including slots, table games, live dealer options, and specialty games from top-tier providers.
• User Experience: The platform features an intuitive interface that works seamlessly across desktop and mobile devices.
• Payment Processing: Multiple payment methods are supported with reasonable processing times and secure transactions.
• Customer Support: 24/7 customer support is available through live chat, email, and phone with knowledgeable representatives.
• Security: Advanced encryption and security protocols ensure player data and funds are protected.

Our comprehensive testing covered all aspects of the gaming experience, from account registration to withdrawals, ensuring we provide accurate and reliable information to help players make informed decisions.',
    CASE 
        WHEN c.rating >= 4.5 THEN 9.2
        WHEN c.rating >= 4.0 THEN 8.5
        WHEN c.rating >= 3.5 THEN 7.8
        ELSE 7.0
    END,
    CASE 
        WHEN c.name = 'Royal Casino' THEN ARRAY['Extensive game library with 2000+ titles', 'Fast withdrawals within 24 hours', 'VIP program with exclusive benefits', '24/7 multilingual support', 'Mobile optimized platform']
        WHEN c.name = 'Lucky Stars Casino' THEN ARRAY['Live dealer games with HD streaming', 'Generous welcome bonus package', 'User-friendly interface design', 'Multiple payment methods including crypto', 'Regular promotions and tournaments']
        WHEN c.name = 'Diamond Palace' THEN ARRAY['Luxury gaming experience', 'High betting limits for VIP players', 'Exclusive games and tournaments', 'Personal account manager', 'Premium rewards and cashback']
        WHEN c.name = 'Golden Spin Casino' THEN ARRAY['Quick payouts and withdrawals', 'Excellent customer service response', 'Wide variety of game providers', 'Fair and transparent bonus terms', 'Secure and licensed platform']
        WHEN c.name = 'Neon Nights Casino' THEN ARRAY['Progressive jackpot network', 'Modern and sleek design', 'Cryptocurrency payment support', 'Regular tournament events', 'Social gaming features']
        ELSE ARRAY['Good selection of popular games', 'Reliable and stable platform', 'Fair gaming practices', 'Responsive customer support', 'Regular platform updates']
    END,
    CASE 
        WHEN c.name = 'Royal Casino' THEN ARRAY['High wagering requirements on bonuses', 'Limited live chat hours in some regions', 'Geographic restrictions apply']
        WHEN c.name = 'Lucky Stars Casino' THEN ARRAY['Withdrawal limits on large wins', 'Complex bonus terms and conditions', 'Limited cryptocurrency options']
        WHEN c.name = 'Diamond Palace' THEN ARRAY['High minimum deposit requirements', 'Exclusive access for VIP players only', 'Limited game provider selection']
        WHEN c.name = 'Golden Spin Casino' THEN ARRAY['Slower weekend support response', 'Limited selection of table games', 'Regional restrictions on some games']
        WHEN c.name = 'Neon Nights Casino' THEN ARRAY['Newer platform with limited history', 'Limited traditional payment methods', 'Smaller game library compared to competitors']
        ELSE ARRAY['Standard withdrawal processing times', 'Basic loyalty program structure', 'Limited promotional offerings']
    END,
    'Our expert team has thoroughly evaluated ' || c.name || ' and found it to be a solid choice for online casino gaming. With a good game selection, reliable platform, and fair gaming practices, this casino provides a trustworthy gaming experience for players in Singapore.',
    c.name || '-comprehensive-expert-review',
    'GuruSingapore Expert Team',
    CASE WHEN c.rating >= 4.5 THEN true ELSE false END,
    true,
    NOW()
FROM casinos c
WHERE NOT EXISTS (
    SELECT 1 FROM casino_reviews cr WHERE cr.casino_id = c.id
);

-- Show what was created
SELECT 
    cr.id,
    c.name as casino_name,
    cr.title,
    cr.rating,
    cr.is_published,
    cr.is_featured,
    cr.author_name,
    cr.slug
FROM casino_reviews cr
JOIN casinos c ON cr.casino_id = c.id
ORDER BY cr.created_at DESC;

-- Count total reviews now
SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_reviews,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_reviews,
    COUNT(CASE WHEN pros IS NOT NULL AND array_length(pros, 1) > 0 THEN 1 END) as reviews_with_pros,
    COUNT(CASE WHEN cons IS NOT NULL AND array_length(cons, 1) > 0 THEN 1 END) as reviews_with_cons,
    COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) as reviews_with_summary
FROM casino_reviews;

-- Verify data structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'casino_reviews' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EXPERT REVIEWS SAMPLE DATA CREATED ===';
    RAISE NOTICE 'Sample expert reviews have been created for all casinos with:';
    RAISE NOTICE '- Proper title and content structure';
    RAISE NOTICE '- Rating system (0-10 scale)';
    RAISE NOTICE '- Pros and cons arrays';
    RAISE NOTICE '- Summary field';
    RAISE NOTICE '- Unique slug generation';
    RAISE NOTICE '- Author attribution';
    RAISE NOTICE '- Published status';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Refresh the /expert-reviews page to see the content';
    RAISE NOTICE '2. Use the admin panel at /admin/expert-reviews to manage reviews';
    RAISE NOTICE '3. Edit, update, and create new expert reviews';
    RAISE NOTICE '';
    RAISE NOTICE 'The page should display:';
    RAISE NOTICE '- Hero section with title and description';
    RAISE NOTICE '- Statistics section with review counts';
    RAISE NOTICE '- Grid of casino review cards';
    RAISE NOTICE '- Each card showing casino logo, name, rating, and action buttons';
END $$;
