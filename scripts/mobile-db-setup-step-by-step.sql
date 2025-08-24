-- Mobile Database Setup - STEP BY STEP APPROACH
-- Jalankan satu per satu di Supabase SQL Editor

-- ===========================================
-- STEP 1: Enable Extensions
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";

-- ===========================================
-- STEP 2: Create Indexes (Mobile Optimized)
-- ===========================================

-- Index for mobile search
CREATE INDEX IF NOT EXISTS idx_casinos_mobile_search
ON casinos USING GIN (
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(bonus_info, '')
  )
);

-- Index for mobile filtering
CREATE INDEX IF NOT EXISTS idx_casinos_mobile_filtering
ON casinos (is_active, rating, created_at, display_order)
WHERE is_active = true;

-- Index for featured casinos
CREATE INDEX IF NOT EXISTS idx_casinos_mobile_featured
ON casinos (is_featured_home, home_rank, rating)
WHERE is_featured_home = true AND is_active = true;

-- Index for high rated casinos
CREATE INDEX IF NOT EXISTS idx_casinos_high_rated_mobile
ON casinos (rating, display_order, created_at)
WHERE rating >= 7 AND is_active = true;

-- Index for live casinos
CREATE INDEX IF NOT EXISTS idx_casinos_live_mobile
ON casinos (display_order, rating, created_at)
WHERE (
  description ILIKE '%live%' OR
  bonus_info ILIKE '%live%' OR
  name ILIKE '%live%'
) AND is_active = true;

-- Index for user favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_mobile
ON user_favorites (user_id, created_at DESC);

-- Index for favorites lookup
CREATE INDEX IF NOT EXISTS idx_user_favorites_casino_lookup
ON user_favorites (casino_id, user_id);

-- Index for player reviews
CREATE INDEX IF NOT EXISTS idx_player_reviews_mobile
ON player_reviews (casino_id, status, created_at DESC);

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_player_reviews_user_mobile
ON player_reviews (user_id, created_at DESC);

-- ===========================================
-- STEP 3: Add Search Vector Column
-- ===========================================

-- Add search vector column if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'casinos' AND column_name = 'search_vector') THEN
    ALTER TABLE casinos ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- ===========================================
-- STEP 4: Create Search Function
-- ===========================================

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_casino_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bonus_info, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_casino_search_vector ON casinos;
CREATE TRIGGER trigger_update_casino_search_vector
  BEFORE INSERT OR UPDATE ON casinos
  FOR EACH ROW EXECUTE FUNCTION update_casino_search_vector();

-- Update existing records
UPDATE casinos SET search_vector = (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(bonus_info, '')), 'C')
) WHERE search_vector IS NULL OR search_vector = ''::tsvector;

-- ===========================================
-- STEP 5: Create Materialized View
-- ===========================================

-- Drop if exists
DROP MATERIALIZED VIEW IF EXISTS casino_stats_mobile;

-- Create materialized view
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
-- STEP 6: Create Mobile Functions
-- ===========================================

-- Search function
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

-- Details function
CREATE OR REPLACE FUNCTION get_casino_details_mobile(casino_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  rating DECIMAL,
  established_year INTEGER,
  description TEXT,
  bonus_info TEXT,
  website_url TEXT,
  review_count BIGINT,
  average_rating DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.logo_url,
    c.rating,
    c.established_year,
    c.description,
    c.bonus_info,
    c.website_url,
    COALESCE(csm.review_count, 0) as review_count,
    COALESCE(csm.average_rating, c.rating) as average_rating,
    c.created_at
  FROM casinos c
  LEFT JOIN casino_stats_mobile csm ON c.id = csm.id
  WHERE c.id = casino_uuid AND c.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Favorites function
CREATE OR REPLACE FUNCTION get_user_favorites_mobile(user_uuid UUID)
RETURNS TABLE (
  casino_id UUID,
  casino_name TEXT,
  casino_logo_url TEXT,
  casino_rating DECIMAL,
  favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uf.casino_id,
    c.name as casino_name,
    c.logo_url as casino_logo_url,
    c.rating as casino_rating,
    uf.created_at as favorited_at
  FROM user_favorites uf
  JOIN casinos c ON uf.casino_id = c.id
  WHERE uf.user_id = user_uuid AND c.is_active = true
  ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard function
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

-- ===========================================
-- STEP 7: Create Sync Function
-- ===========================================

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
-- STEP 8: Grant Permissions
-- ===========================================

GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_user_favorites_mobile TO authenticated;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT EXECUTE ON FUNCTION sync_mobile_data TO authenticated;

-- ===========================================
-- STEP 9: Create Maintenance Function
-- ===========================================

CREATE OR REPLACE FUNCTION refresh_casino_stats_mobile()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW casino_stats_mobile;
  RETURN 'Materialized view refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if setup is complete
-- Run these after setup:

-- 1. Check indexes
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND (tablename LIKE 'casinos' OR tablename LIKE 'user_favorites' OR tablename LIKE 'player_reviews')
-- ORDER BY tablename;

-- 2. Check functions
-- SELECT proname, proargnames
-- FROM pg_proc
-- WHERE proname LIKE '%mobile%';

-- 3. Check materialized view
-- SELECT * FROM casino_stats_mobile LIMIT 5;

-- 4. Test search function
-- SELECT * FROM search_casinos_mobile('casino', 'all', 5, 0);
