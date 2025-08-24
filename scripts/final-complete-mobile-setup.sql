-- Final Complete Mobile Setup - Fix Missing Functions

-- ===========================================
-- ISSUE ANALYSIS
-- ===========================================

-- ✅ Working: search_casinos_mobile, get_casino_details_mobile
-- ❌ Issue: get_mobile_dashboard incomplete (missing return)
-- ❌ Issue: get_user_favorites_mobile missing
-- ❌ Issue: sync_mobile_data missing

-- ===========================================
-- STEP 1: FIX GET_MOBILE_DASHBOARD FUNCTION
-- ===========================================

-- Drop and recreate complete function
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
  -- Get featured casinos
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

  -- Get new casinos
  SELECT array_agg(row_to_json(t)) INTO new_casinos_data
  FROM (
    SELECT id, name::VARCHAR(255), logo_url, rating, description
    FROM (
      SELECT
        c.id, c.name, c.logo_url, c.rating, c.description,
        c.created_at
      FROM casinos c
      WHERE c.is_active = true AND c.created_at >= NOW() - INTERVAL '3 months'
    ) sub
    ORDER BY created_at DESC
    LIMIT limit_count
  ) t;

  -- Build and RETURN result - THIS WAS MISSING
  result := json_build_object(
    'featured', COALESCE(featured_data, '[]'::json),
    'highRated', COALESCE(high_rated_data, '[]'::json),
    'newCasinos', COALESCE(new_casinos_data, '[]'::json),
    'totalCount', (SELECT COUNT(*) FROM casinos WHERE is_active = true)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 2: CREATE MISSING FUNCTIONS
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
  -- Ensure user_favorites table exists
  CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    casino_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, casino_id)
  );

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
  -- Ensure user_favorites table exists
  CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    casino_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, casino_id)
  );

  -- Sync favorites
  IF favorites_data IS NOT NULL AND array_length(favorites_data, 1) > 0 THEN
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

  -- Build result
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
-- STEP 3: GRANT ALL PERMISSIONS
-- ===========================================

GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_user_favorites_mobile TO authenticated;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT EXECUTE ON FUNCTION sync_mobile_data TO authenticated;
GRANT SELECT ON casino_stats_mobile TO public;

-- ===========================================
-- STEP 4: FINAL VERIFICATION
-- ===========================================

-- Test 1: Search function (already working)
-- SELECT * FROM search_casinos_mobile('casino', 'all', 3, 0);

-- Test 2: Dashboard function (should work now)
-- SELECT get_mobile_dashboard(5);

-- Test 3: Check all functions
-- SELECT proname as function_name, proargnames as arguments, prosecdef as security_definer
-- FROM pg_proc WHERE proname LIKE '%mobile%' ORDER BY proname;

-- Test 4: Performance check
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM search_casinos_mobile('casino', 'all', 5, 0);
