-- Minimal Working Setup - Focus on What Works

-- ===========================================
-- CURRENT STATUS
-- ===========================================

-- ✅ WORKING: search_casinos_mobile, get_casino_details_mobile
-- ❌ ISSUES: Type mismatch in get_mobile_dashboard, missing functions

-- ===========================================
-- STEP 1: FIX DASHBOARD FUNCTION TYPE ISSUE
-- ===========================================

-- Drop and recreate with correct types
DROP FUNCTION IF EXISTS get_mobile_dashboard(integer);

CREATE OR REPLACE FUNCTION get_mobile_dashboard(
  limit_count INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  featured_data JSON;
  high_rated_data JSON;
  new_casinos_data JSON;
  result JSON;
BEGIN
  -- Get featured casinos
  SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]'::json) INTO featured_data
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
  SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]'::json) INTO high_rated_data
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
  SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]'::json) INTO new_casinos_data
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

  -- Build result
  result := json_build_object(
    'featured', featured_data,
    'highRated', high_rated_data,
    'newCasinos', new_casinos_data,
    'totalCount', (SELECT COUNT(*) FROM casinos WHERE is_active = true)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 2: GRANT WORKING PERMISSIONS
-- ===========================================

-- Grant permissions for working functions
GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT SELECT ON casino_stats_mobile TO public;

-- ===========================================
-- STEP 3: CREATE OPTIONAL FUNCTIONS (IF NEEDED)
-- ===========================================

-- Simple favorites function (optional)
CREATE OR REPLACE FUNCTION get_user_favorites_mobile_simple(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Ensure table exists
  CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    casino_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, casino_id)
  );

  -- Get favorites as JSON
  SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]'::json) INTO result
  FROM (
    SELECT
      uf.casino_id,
      c.name::VARCHAR(255) as casino_name,
      c.logo_url as casino_logo_url,
      c.rating as casino_rating,
      uf.created_at as favorited_at
    FROM user_favorites uf
    JOIN casinos c ON uf.casino_id = c.id
    WHERE uf.user_id = user_uuid AND c.is_active = true
    ORDER BY uf.created_at DESC
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 4: FINAL VERIFICATION
-- ===========================================

-- Test working functions
-- SELECT * FROM search_casinos_mobile('casino', 'all', 3, 0);
-- SELECT * FROM get_casino_details_mobile('7761d56d-493a-4172-bb72-f6e4d3ca7922');
-- SELECT get_mobile_dashboard(5);

-- Check function status
-- SELECT proname as function_name, prosecdef as security_definer
-- FROM pg_proc WHERE proname LIKE '%mobile%' ORDER BY proname;
