-- Ultimate Fix untuk Mobile Functions - Final Version

-- ===========================================
-- PROBLEM ANALYSIS & FIX
-- ===========================================

-- Issue 1: Function search_casinos_mobile is missing
-- Issue 2: Column created_at error in get_mobile_dashboard
-- Issue 3: Permissions need to be granted

-- ===========================================
-- STEP 1: RECREATE MISSING SEARCH FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION search_casinos_mobile(
  search_query TEXT DEFAULT '',
  filter_type TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 12,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  logo_url TEXT,
  rating DECIMAL(3,2),
  description TEXT,
  bonus_info TEXT,
  review_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  query_tsquery TSQUERY;
BEGIN
  -- Create search query if provided
  IF search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name::VARCHAR(255),
    c.logo_url,
    c.rating,
    c.description,
    c.bonus_info,
    COALESCE(csm.review_count, 0)::BIGINT as review_count,
    c.created_at
  FROM casinos c
  LEFT JOIN casino_stats_mobile csm ON c.id = csm.id
  WHERE c.is_active = true
    AND (search_query = '' OR c.search_vector @@ query_tsquery)
    AND (filter_type = 'all' OR
         (filter_type = 'high-rated' AND c.rating >= 7) OR
         (filter_type = 'new' AND c.created_at >= NOW() - INTERVAL '3 months') OR
         (filter_type = 'live' AND (
           c.description ILIKE '%live%' OR
           c.bonus_info ILIKE '%live%' OR
           c.name ILIKE '%live%'
         )))
  ORDER BY
    CASE WHEN search_query != '' THEN ts_rank(c.search_vector, query_tsquery) ELSE 0 END DESC,
    c.display_order ASC,
    c.rating DESC,
    c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 2: FIX GET MOBILE DASHBOARD FUNCTION
-- ===========================================

-- Drop and recreate with fixed logic
DROP FUNCTION IF EXISTS get_mobile_dashboard(integer);

CREATE OR REPLACE FUNCTION get_mobile_dashboard(
  limit_count INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  featured_data JSON[];
  high_rated_data JSON[];
  new_casinos_data JSON[];
  result JSON;
BEGIN
  -- Get featured casinos - FIX: Use main casinos table for created_at
  SELECT array_agg(row_to_json(t)) INTO featured_data
  FROM (
    SELECT id, name::VARCHAR(255), logo_url, rating, description
    FROM (
      SELECT
        c.id, c.name, c.logo_url, c.rating, c.description,
        COALESCE(csm.average_rating, c.rating) as avg_rating
      FROM casinos c
      LEFT JOIN casino_stats_mobile csm ON c.id = csm.id
      WHERE c.is_active = true AND c.is_featured_home = true
    ) sub
    ORDER BY avg_rating DESC
    LIMIT 6
  ) t;

  -- Get high rated casinos
  SELECT array_agg(row_to_json(t)) INTO high_rated_data
  FROM (
    SELECT id, name::VARCHAR(255), logo_url, rating, description
    FROM (
      SELECT
        c.id, c.name, c.logo_url, c.rating, c.description,
        COALESCE(csm.average_rating, c.rating) as avg_rating
      FROM casinos c
      LEFT JOIN casino_stats_mobile csm ON c.id = csm.id
      WHERE c.is_active = true AND c.rating >= 7
    ) sub
    ORDER BY avg_rating DESC
    LIMIT limit_count
  ) t;

  -- Get new casinos - FIX: Use main casinos table for created_at
  SELECT array_agg(row_to_json(t)) INTO new_casinos_data
  FROM (
    SELECT id, name::VARCHAR(255), logo_url, rating, description
    FROM (
      SELECT
        c.id, c.name, c.logo_url, c.rating, c.description,
        c.created_at  -- Use created_at from main table
      FROM casinos c
      WHERE c.is_active = true AND c.created_at >= NOW() - INTERVAL '3 months'
    ) sub
    ORDER BY created_at DESC  -- Now this will work
    LIMIT limit_count
  ) t;

  -- Build result
  result := json_build_object(
    'featured', COALESCE(featured_data, '{}'),
    'highRated', COALESCE(high_rated_data, '{}'),
    'newCasinos', COALESCE(new_casinos_data, '{}'),
    'totalCount', (SELECT COUNT(*) FROM casinos WHERE is_active = true)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 3: CREATE REMAINING FUNCTIONS
-- ===========================================

-- Function: Get User Favorites Mobile
CREATE OR REPLACE FUNCTION get_user_favorites_mobile(
  user_uuid UUID
)
RETURNS TABLE (
  casino_id UUID,
  casino_name VARCHAR(255),
  casino_logo_url TEXT,
  casino_rating DECIMAL(3,2),
  favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uf.casino_id,
    c.name::VARCHAR(255) as casino_name,
    c.logo_url as casino_logo_url,
    c.rating as casino_rating,
    uf.created_at as favorited_at
  FROM user_favorites uf
  JOIN casinos c ON uf.casino_id = c.id
  WHERE uf.user_id = user_uuid AND c.is_active = true
  ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync Mobile Data
CREATE OR REPLACE FUNCTION sync_mobile_data(
  user_uuid UUID,
  favorites_data JSON[],
  reviews_data JSON[]
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  favorites_count INTEGER := 0;
  reviews_count INTEGER := 0;
BEGIN
  -- Sync favorites
  IF favorites_data IS NOT NULL AND array_length(favorites_data, 1) > 0 THEN
    -- Ensure table exists
    CREATE TABLE IF NOT EXISTS user_favorites (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL,
      casino_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, casino_id)
    );

    DELETE FROM user_favorites WHERE user_id = user_uuid;

    INSERT INTO user_favorites (user_id, casino_id, created_at)
    SELECT
      user_uuid,
      (fav->>'casino_id')::UUID,
      (fav->>'created_at')::TIMESTAMP WITH TIME ZONE
    FROM json_array_elements(favorites_data::json) AS fav
    ON CONFLICT (user_id, casino_id) DO NOTHING;

    GET DIAGNOSTICS favorites_count = ROW_COUNT;
  END IF;

  -- Sync reviews
  IF reviews_data IS NOT NULL AND array_length(reviews_data, 1) > 0 THEN
    INSERT INTO player_reviews (
      user_id, casino_id, rating, title, content, pros, cons, status, created_at, updated_at
    )
    SELECT
      user_uuid,
      (rev->>'casinoId')::UUID,
      (rev->>'rating')::INTEGER,
      rev->>'title',
      rev->>'content',
      (rev->>'pros')::JSONB,
      (rev->>'cons')::JSONB,
      'pending',
      (rev->>'createdAt')::TIMESTAMP WITH TIME ZONE,
      NOW()
    FROM json_array_elements(reviews_data::json) AS rev
    ON CONFLICT (user_id, casino_id)
    DO UPDATE SET
      rating = EXCLUDED.rating,
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      pros = EXCLUDED.pros,
      cons = EXCLUDED.cons,
      updated_at = NOW();

    GET DIAGNOSTICS reviews_count = ROW_COUNT;
  END IF;

  result := json_build_object(
    'success', true,
    'favorites_synced', favorites_count,
    'reviews_synced', reviews_count,
    'timestamp', extract(epoch from now())
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 4: GRANT ALL PERMISSIONS
-- ===========================================

GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_user_favorites_mobile TO authenticated;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT EXECUTE ON FUNCTION sync_mobile_data TO authenticated;
GRANT SELECT ON casino_stats_mobile TO public;

-- ===========================================
-- STEP 5: FINAL VERIFICATION
-- ===========================================

-- Test 1: Search function
-- SELECT * FROM search_casinos_mobile('casino', 'all', 3, 0);

-- Test 2: Dashboard function
-- SELECT get_mobile_dashboard(5);

-- Test 3: Details function (use existing casino ID)
-- SELECT * FROM get_casino_details_mobile('7761d56d-493a-4172-bb72-f6e4d3ca7922');

-- Test 4: Check all functions
-- SELECT proname as function_name, proargnames as arguments, prosecdef as security_definer
-- FROM pg_proc WHERE proname LIKE '%mobile%' ORDER BY proname;

-- ===========================================
-- PERFORMANCE TEST
-- ===========================================

-- Test search performance
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM search_casinos_mobile('casino', 'all', 5, 0);

-- Test dashboard performance
-- EXPLAIN (ANALYZE, BUFFERS) SELECT get_mobile_dashboard(5);
