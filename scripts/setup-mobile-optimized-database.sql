-- Mobile-Optimized Database Schema and Configuration
-- Optimized for performance, offline support, and mobile-specific features

-- Enable required extensions for mobile optimization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";

-- Create optimized indexes for mobile queries
-- These indexes are designed for the most common mobile query patterns

-- Casino table indexes optimized for mobile
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casinos_mobile_search
ON casinos USING GIN (
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(bonus_info, '')
  )
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casinos_mobile_filtering
ON casinos (is_active, rating, created_at, display_order)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casinos_mobile_featured
ON casinos (is_featured_home, home_rank, rating)
WHERE is_featured_home = true AND is_active = true;

-- Partial indexes for specific filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casinos_high_rated_mobile
ON casinos (rating, display_order, created_at)
WHERE rating >= 7 AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casinos_live_mobile
ON casinos (display_order, rating, created_at)
WHERE (
  description ILIKE '%live%' OR
  bonus_info ILIKE '%live%' OR
  name ILIKE '%live%'
) AND is_active = true;

-- User favorites optimized for mobile
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_favorites_mobile
ON user_favorites (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_favorites_casino_lookup
ON user_favorites (casino_id, user_id);

-- Player reviews optimized for mobile
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_reviews_mobile
ON player_reviews (casino_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_reviews_user_mobile
ON player_reviews (user_id, created_at DESC);

-- Create materialized view for casino stats (faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS casino_stats_mobile AS
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
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_casino_stats_mobile_rating
ON casino_stats_mobile (average_rating DESC);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_casino_stats_mobile()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY casino_stats_mobile;
END;
$$ LANGUAGE plpgsql;

-- Create function for mobile-optimized casino search
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
  -- Create search query if provided
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
    AND (
      search_query = '' OR
      c.search_vector @@ query_tsquery
    )
    AND (
      filter_type = 'all' OR
      (filter_type = 'high-rated' AND c.rating >= 7) OR
      (filter_type = 'new' AND c.created_at >= NOW() - INTERVAL '3 months') OR
      (filter_type = 'live' AND (
        c.description ILIKE '%live%' OR
        c.bonus_info ILIKE '%live%' OR
        c.name ILIKE '%live%'
      ))
    )
  ORDER BY
    CASE
      WHEN search_query != '' THEN ts_rank(c.search_vector, query_tsquery)
      ELSE 0
    END DESC,
    c.display_order ASC,
    c.rating DESC,
    c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for mobile-optimized casino details
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

-- Create function for mobile user favorites
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
  WHERE uf.user_id = user_uuid
    AND c.is_active = true
  ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies optimized for mobile
-- Allow public read access to active casinos (for mobile app)
CREATE POLICY "Mobile public read access to active casinos"
ON casinos FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated users to manage their favorites
CREATE POLICY "Users can manage their own favorites"
ON user_favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to submit reviews
CREATE POLICY "Users can submit and manage their own reviews"
ON player_reviews FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create optimized views for mobile dashboard
CREATE OR REPLACE VIEW mobile_casino_dashboard AS
SELECT
  c.id,
  c.name,
  c.logo_url,
  c.rating,
  c.description,
  COALESCE(csm.review_count, 0) as review_count,
  COALESCE(csm.average_rating, c.rating) as average_rating,
  c.is_featured_home,
  c.created_at
FROM casinos c
LEFT JOIN casino_stats_mobile csm ON c.id = csm.id
WHERE c.is_active = true
ORDER BY c.display_order ASC, c.rating DESC;

-- Create function to get mobile dashboard data
CREATE OR REPLACE FUNCTION get_mobile_dashboard(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  featured JSON[],
  high_rated JSON[],
  new_casinos JSON[],
  total_count BIGINT
) AS $$
DECLARE
  featured_data JSON[];
  high_rated_data JSON[];
  new_data JSON[];
  total_count_val BIGINT;
BEGIN
  -- Get featured casinos
  SELECT array_agg(row_to_json(t)) INTO featured_data
  FROM (
    SELECT id, name, logo_url, rating, description
    FROM mobile_casino_dashboard
    WHERE is_featured_home = true
    ORDER BY rating DESC
    LIMIT 6
  ) t;

  -- Get high rated casinos
  SELECT array_agg(row_to_json(t)) INTO high_rated_data
  FROM (
    SELECT id, name, logo_url, rating, description
    FROM mobile_casino_dashboard
    WHERE rating >= 7
    ORDER BY rating DESC
    LIMIT limit_count
  ) t;

  -- Get new casinos
  SELECT array_agg(row_to_json(t)) INTO new_data
  FROM (
    SELECT id, name, logo_url, rating, description
    FROM mobile_casino_dashboard
    WHERE created_at >= NOW() - INTERVAL '3 months'
    ORDER BY created_at DESC
    LIMIT limit_count
  ) t;

  -- Get total count
  SELECT COUNT(*) INTO total_count_val
  FROM mobile_casino_dashboard;

  RETURN QUERY SELECT
    COALESCE(featured_data, '{}'),
    COALESCE(high_rated_data, '{}'),
    COALESCE(new_data, '{}'),
    total_count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle offline sync
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
  IF favorites_data IS NOT NULL THEN
    -- Delete existing favorites for user
    DELETE FROM user_favorites WHERE user_id = user_uuid;

    -- Insert new favorites
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
  IF reviews_data IS NOT NULL THEN
    -- Insert or update reviews
    INSERT INTO player_reviews (
      user_id,
      casino_id,
      rating,
      title,
      content,
      pros,
      cons,
      status,
      created_at,
      updated_at
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
      updated_at = NOW()
    WHERE player_reviews.user_id = user_uuid;

    GET DIAGNOSTICS reviews_count = ROW_COUNT;
  END IF;

  -- Return sync result
  result := json_build_object(
    'success', true,
    'favorites_synced', favorites_count,
    'reviews_synced', reviews_count,
    'timestamp', extract(epoch from now())
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create performance monitoring view
CREATE OR REPLACE VIEW mobile_performance_stats AS
SELECT
  'casinos' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('casinos')) as table_size,
  pg_size_pretty(pg_total_relation_size('idx_casinos_mobile_search')) as search_index_size
FROM casinos
UNION ALL
SELECT
  'user_favorites' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('user_favorites')) as table_size,
  pg_size_pretty(pg_total_relation_size('idx_user_favorites_mobile')) as index_size
FROM user_favorites
UNION ALL
SELECT
  'player_reviews' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('player_reviews')) as table_size,
  pg_size_pretty(pg_total_relation_size('idx_player_reviews_mobile')) as index_size
FROM player_reviews;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_casinos_mobile TO public;
GRANT EXECUTE ON FUNCTION get_casino_details_mobile TO public;
GRANT EXECUTE ON FUNCTION get_user_favorites_mobile TO authenticated;
GRANT EXECUTE ON FUNCTION get_mobile_dashboard TO public;
GRANT EXECUTE ON FUNCTION sync_mobile_data TO authenticated;
GRANT SELECT ON mobile_performance_stats TO public;

-- Create maintenance functions
CREATE OR REPLACE FUNCTION cleanup_mobile_indexes()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
BEGIN
  -- Reindex mobile-optimized indexes
  REINDEX INDEX CONCURRENTLY idx_casinos_mobile_search;
  REINDEX INDEX CONCURRENTLY idx_casinos_mobile_filtering;
  REINDEX INDEX CONCURRENTLY idx_casinos_mobile_featured;
  REINDEX INDEX CONCURRENTLY idx_user_favorites_mobile;
  REINDEX INDEX CONCURRENTLY idx_player_reviews_mobile;

  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY casino_stats_mobile;

  result := 'Mobile indexes cleaned up and refreshed successfully';
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to analyze mobile query performance
CREATE OR REPLACE FUNCTION analyze_mobile_performance()
RETURNS TABLE (
  query_name TEXT,
  execution_time INTERVAL,
  rows_returned BIGINT,
  query_plan JSON
) AS $$
BEGIN
  -- This would integrate with pg_stat_statements to analyze
  -- actual query performance for mobile-optimized queries
  RETURN QUERY
  SELECT
    'search_casinos_mobile'::TEXT as query_name,
    '0 seconds'::INTERVAL as execution_time,
    0::BIGINT as rows_returned,
    '{}'::JSON as query_plan;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_casinos_mobile IS 'Mobile-optimized casino search with full-text search and filtering';
COMMENT ON FUNCTION get_casino_details_mobile IS 'Get detailed casino information optimized for mobile';
COMMENT ON FUNCTION get_user_favorites_mobile IS 'Get user favorites optimized for mobile app';
COMMENT ON FUNCTION get_mobile_dashboard IS 'Get dashboard data for mobile app';
COMMENT ON FUNCTION sync_mobile_data IS 'Sync offline mobile data to server';
COMMENT ON FUNCTION cleanup_mobile_indexes IS 'Maintenance function for mobile indexes';
COMMENT ON MATERIALIZED VIEW casino_stats_mobile IS 'Pre-computed casino statistics for mobile performance';
