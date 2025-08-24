-- Fix Database Schema untuk Mobile Optimization
-- Mengatasi masalah schema yang tidak match

-- ===========================================
-- STEP 1: CHECK ACTUAL SCHEMA
-- ===========================================

-- Check tables yang ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check columns di player_reviews
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'player_reviews'
ORDER BY ordinal_position;

-- Check columns di casinos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'casinos'
ORDER BY ordinal_position;

-- ===========================================
-- STEP 2: CREATE MISSING TABLE user_favorites
-- ===========================================

-- Create user_favorites table jika belum ada
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  casino_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, casino_id)
);

-- Add foreign key constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_favorites_user_id_fkey'
  ) THEN
    ALTER TABLE user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_favorites_casino_id_fkey'
  ) THEN
    ALTER TABLE user_favorites
    ADD CONSTRAINT user_favorites_casino_id_fkey
    FOREIGN KEY (casino_id) REFERENCES casinos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ===========================================
-- STEP 3: FIX COLUMN NAMES
-- ===========================================

-- Add status column ke player_reviews jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'player_reviews' AND column_name = 'status') THEN
    ALTER TABLE player_reviews ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Update status berdasarkan is_approved
UPDATE player_reviews
SET status = CASE
  WHEN is_approved = true THEN 'approved'
  WHEN is_approved = false THEN 'rejected'
  ELSE 'pending'
END;

-- ===========================================
-- STEP 4: CREATE FIXED MATERIALIZED VIEW
-- ===========================================

-- Drop materialized view jika ada
DROP MATERIALIZED VIEW IF EXISTS casino_stats_mobile;

-- Create materialized view dengan column yang benar
CREATE MATERIALIZED VIEW casino_stats_mobile AS
SELECT
  c.id,
  c.name,
  c.rating,
  COUNT(pr.id) as review_count,
  AVG(pr.rating) as average_rating,
  MAX(pr.created_at) as last_review_date,
  COUNT(CASE WHEN pr.status = 'approved' THEN 1 END) as approved_reviews
FROM casinos c
LEFT JOIN player_reviews pr ON c.id = pr.casino_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.rating;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_casino_stats_mobile_rating
ON casino_stats_mobile (average_rating DESC);

-- ===========================================
-- STEP 5: RECREATE FUNCTIONS WITH FIXED SCHEMA
-- ===========================================

-- Recreate search function
CREATE OR REPLACE FUNCTION search_casinos_mobile(
  search_query TEXT DEFAULT '',
  filter_type TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 12,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  rating DECIMAL,
  description TEXT,
  bonus_info TEXT,
  review_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  query_tsquery TSQUERY;
BEGIN
  IF search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.logo_url,
    c.rating,
    c.description,
    c.bonus_info,
    COALESCE(csm.review_count, 0) as review_count,
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

-- Recreate dashboard function
CREATE OR REPLACE FUNCTION get_mobile_dashboard(limit_count INTEGER DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  featured_data JSON[];
  high_rated_data JSON[];
  new_casinos_data JSON[];
  result JSON;
BEGIN
  SELECT array_agg(row_to_json(t)) INTO featured_data
  FROM (
    SELECT id, name, logo_url, rating, description
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

  SELECT array_agg(row_to_json(t)) INTO high_rated_data
  FROM (
    SELECT id, name, logo_url, rating, description
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

  SELECT array_agg(row_to_json(t)) INTO new_casinos_data
  FROM (
    SELECT id, name, logo_url, rating, description
    FROM (
      SELECT
        c.id, c.name, c.logo_url, c.rating, c.description
      FROM casinos c
      WHERE c.is_active = true AND c.created_at >= NOW() - INTERVAL '3 months'
    ) sub
    ORDER BY created_at DESC
    LIMIT limit_count
  ) t;

  result := json_build_object(
    'featured', COALESCE(featured_data, '{}'),
    'highRated', COALESCE(high_rated_data, '{}'),
    'newCasinos', COALESCE(new_casinos_data, '{}'),
    'totalCount', (SELECT COUNT(*) FROM casinos WHERE is_active = true)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate sync function
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
  -- Create user_favorites table if not exists
  CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    casino_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, casino_id)
  );

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
-- STEP 6: GRANT PERMISSIONS
-- ===========================================

GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_user_favorites_mobile TO authenticated;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT EXECUTE ON FUNCTION sync_mobile_data TO authenticated;
GRANT SELECT ON casino_stats_mobile TO public;

-- ===========================================
-- STEP 7: CREATE MAINTENANCE FUNCTIONS
-- ===========================================

CREATE OR REPLACE FUNCTION refresh_casino_stats_mobile()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW casino_stats_mobile;
  RETURN 'Materialized view refreshed successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_mobile_indexes()
RETURNS TEXT AS $$
BEGIN
  -- Reindex mobile-optimized indexes
  REINDEX INDEX idx_casinos_mobile_search;
  REINDEX INDEX idx_casinos_mobile_filtering;
  REINDEX INDEX idx_casinos_mobile_featured;
  REINDEX INDEX idx_user_favorites_mobile;
  REINDEX INDEX idx_user_favorites_casino_lookup;
  REINDEX INDEX idx_player_reviews_mobile;
  REINDEX INDEX idx_player_reviews_user_mobile;

  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW casino_stats_mobile;

  RETURN 'Mobile indexes cleaned up and refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 8: CREATE MISSING INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_user_favorites_mobile
ON user_favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_favorites_casino_lookup
ON user_favorites (casino_id, user_id);

CREATE INDEX IF NOT EXISTS idx_player_reviews_mobile
ON player_reviews (casino_id, status, created_at DESC);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- 1. Check all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Check all indexes
-- SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- 3. Check materialized view
-- SELECT * FROM casino_stats_mobile LIMIT 5;

-- 4. Test functions
-- SELECT * FROM search_casinos_mobile('casino', 'all', 3, 0);
-- SELECT get_mobile_dashboard(5);

-- 5. Check user_favorites table
-- SELECT * FROM user_favorites LIMIT 5;
