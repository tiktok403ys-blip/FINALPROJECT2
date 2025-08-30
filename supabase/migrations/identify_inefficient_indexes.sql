-- Query untuk mengidentifikasi indeks yang tidak efisien
-- Mencari indeks pada kolom yang jarang dipakai atau tidak optimal

-- 1. Identifikasi indeks dengan rasio penggunaan rendah
SELECT 
    '=== INDEXES WITH LOW USAGE RATIO ===' as section,
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 OR idx_tup_read = 0 THEN 0
        ELSE ROUND((idx_tup_fetch::numeric / idx_tup_read::numeric * 100)::numeric, 2)
    END as fetch_ratio_percent,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes,
    'DROP INDEX IF EXISTS public.' || indexrelname || ';' as drop_command
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan > 0  -- Exclude completely unused (handled separately)
    AND (
        idx_scan < 100 OR  -- Used less than 100 times
        (idx_tup_read > 0 AND idx_tup_fetch > 0 AND (idx_tup_fetch::numeric / idx_tup_read::numeric) < 0.1)  -- Low fetch ratio
    )
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 2. Identifikasi indeks pada kolom boolean (biasanya tidak efisien)
SELECT 
    '=== INDEXES ON BOOLEAN COLUMNS ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    c.column_name,
    c.data_type,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
    CASE 
        WHEN s.idx_scan = 0 THEN 'UNUSED - Drop immediately'
        WHEN s.idx_scan < 50 THEN 'LOW USAGE - Consider dropping'
        ELSE 'REVIEW - May be needed for specific queries'
    END as recommendation,
    'DROP INDEX IF EXISTS public.' || i.indexname || ';' as drop_command
FROM pg_indexes i
JOIN information_schema.columns c ON c.table_name = i.tablename 
    AND c.table_schema = i.schemaname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND c.data_type = 'boolean'
    AND i.indexdef LIKE '%(' || c.column_name || ')%'
    AND i.indexname NOT LIKE '%_pkey'
ORDER BY s.idx_scan ASC;

-- 3. Identifikasi indeks pada kolom dengan kardinalitas rendah
WITH column_stats AS (
    SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        CASE 
            WHEN n_distinct > 0 THEN n_distinct
            WHEN n_distinct < 0 THEN ABS(n_distinct) * reltuples
            ELSE 1
        END as estimated_distinct_values,
        reltuples as table_rows
    FROM pg_stats ps
    JOIN pg_class pc ON pc.relname = ps.tablename
    WHERE schemaname = 'public'
        AND reltuples > 0
)
SELECT 
    '=== INDEXES ON LOW CARDINALITY COLUMNS ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    cs.column_name,
    cs.estimated_distinct_values,
    cs.table_rows,
    CASE 
         WHEN cs.table_rows = 0 THEN 0
         ELSE ROUND((cs.estimated_distinct_values / cs.table_rows * 100)::numeric, 2)
     END as selectivity_percent,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
    CASE 
        WHEN cs.estimated_distinct_values < 10 THEN 'VERY LOW CARDINALITY - Consider dropping'
        WHEN cs.table_rows > 0 AND (cs.estimated_distinct_values / cs.table_rows) < 0.01 THEN 'LOW SELECTIVITY - Review usage'
        ELSE 'ACCEPTABLE'
    END as recommendation,
    'DROP INDEX IF EXISTS public.' || i.indexname || ';' as drop_command
FROM pg_indexes i
JOIN column_stats cs ON cs.tablename = i.tablename 
    AND cs.schemaname = i.schemaname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND i.indexdef LIKE '%(' || cs.column_name || ')%'
    AND i.indexname NOT LIKE '%_pkey'
    AND i.indexdef NOT LIKE '%UNIQUE%'
    AND cs.estimated_distinct_values < 100
ORDER BY cs.estimated_distinct_values ASC, s.idx_scan ASC;

-- 4. Identifikasi indeks pada kolom timestamp/date yang mungkin tidak optimal
SELECT 
    '=== INDEXES ON TIMESTAMP COLUMNS ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    c.column_name,
    c.data_type,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
    CASE 
        WHEN s.idx_scan = 0 THEN 'UNUSED - Drop'
        WHEN s.idx_scan < 10 THEN 'RARELY USED - Review'
        WHEN c.column_name LIKE '%created%' AND s.idx_scan < 100 THEN 'CREATION DATE - Often not queried'
        ELSE 'REVIEW USAGE PATTERN'
    END as recommendation
FROM pg_indexes i
JOIN information_schema.columns c ON c.table_name = i.tablename 
    AND c.table_schema = i.schemaname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND c.data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')
    AND i.indexdef LIKE '%(' || c.column_name || ')%'
    AND i.indexname NOT LIKE '%_pkey'
    AND s.idx_scan < 100
ORDER BY s.idx_scan ASC;

-- 5. Identifikasi indeks pada kolom text/varchar yang mungkin tidak efisien
SELECT 
    '=== INDEXES ON TEXT COLUMNS ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    c.column_name,
    c.data_type,
    COALESCE(c.character_maximum_length, 0) as max_length,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
    CASE 
        WHEN s.idx_scan = 0 THEN 'UNUSED - Drop'
        WHEN c.character_maximum_length > 255 THEN 'LONG TEXT - Consider partial index'
        WHEN c.column_name LIKE '%description%' THEN 'DESCRIPTION FIELD - Rarely indexed efficiently'
        WHEN c.column_name LIKE '%content%' THEN 'CONTENT FIELD - Consider full-text search instead'
        ELSE 'REVIEW'
    END as recommendation,
    'DROP INDEX IF EXISTS public.' || i.indexname || ';' as drop_command
FROM pg_indexes i
JOIN information_schema.columns c ON c.table_name = i.tablename 
    AND c.table_schema = i.schemaname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND c.data_type IN ('text', 'character varying')
    AND i.indexdef LIKE '%(' || c.column_name || ')%'
    AND i.indexname NOT LIKE '%_pkey'
    AND i.indexdef NOT LIKE '%UNIQUE%'
    AND s.idx_scan < 50
ORDER BY s.idx_scan ASC, pg_relation_size(i.indexname::regclass) DESC;

-- 6. Identifikasi indeks yang mungkin tidak diperlukan berdasarkan nama kolom
SELECT 
    '=== POTENTIALLY UNNECESSARY INDEXES BY COLUMN NAME ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
    CASE 
        WHEN i.indexname LIKE '%featured%' THEN 'FEATURED FLAG - Often not selective enough'
        WHEN i.indexname LIKE '%mobile%' THEN 'MOBILE FLAG - Consider if really needed'
        WHEN i.indexname LIKE '%search%' AND s.idx_scan < 10 THEN 'SEARCH FIELD - Low usage'
        WHEN i.indexname LIKE '%status%' AND s.idx_scan < 50 THEN 'STATUS FIELD - Check cardinality'
        ELSE 'REVIEW USAGE'
    END as reason,
    'DROP INDEX IF EXISTS public.' || i.indexname || ';' as drop_command
FROM pg_indexes i
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND (
        i.indexname LIKE '%featured%' OR
        i.indexname LIKE '%mobile%' OR
        i.indexname LIKE '%search%' OR
        (i.indexname LIKE '%status%' AND s.idx_scan < 50)
    )
    AND i.indexname NOT LIKE '%_pkey'
    AND s.idx_scan < 100
ORDER BY s.idx_scan ASC;

-- 7. Summary indeks tidak efisien
WITH inefficient_summary AS (
    SELECT 
        COUNT(CASE WHEN idx_scan = 0 THEN 1 END) as unused_count,
        COUNT(CASE WHEN idx_scan > 0 AND idx_scan < 10 THEN 1 END) as rarely_used_count,
        COUNT(CASE WHEN idx_scan >= 10 AND idx_scan < 100 THEN 1 END) as low_usage_count,
        SUM(CASE WHEN idx_scan < 100 THEN pg_relation_size(indexrelid) ELSE 0 END) as potential_space_saved
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
        AND indexrelname NOT LIKE '%_pkey'
)
SELECT 
    '=== INEFFICIENT INDEXES SUMMARY ===' as section,
    unused_count,
    rarely_used_count,
    low_usage_count,
    (unused_count + rarely_used_count + low_usage_count) as total_candidates_for_removal,
    pg_size_pretty(potential_space_saved) as potential_space_saved
FROM inefficient_summary;