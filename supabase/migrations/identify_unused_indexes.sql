-- Query untuk mengidentifikasi indeks yang tidak terpakai
-- Berdasarkan Performance Advisor Supabase

-- 1. Tampilkan semua indeks dengan statistik penggunaan
SELECT 
    '=== ALL INDEXES WITH USAGE STATS ===' as section,
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 2. Identifikasi indeks yang tidak pernah digunakan (idx_scan = 0)
SELECT 
    '=== UNUSED INDEXES (idx_scan = 0) ===' as section,
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes,
    'DROP INDEX IF EXISTS public.' || indexrelname || ';' as drop_command
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Hitung total ukuran indeks yang tidak terpakai
SELECT 
    '=== UNUSED INDEXES SUMMARY ===' as section,
    COUNT(*) as total_unused_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_wasted_space,
    SUM(pg_relation_size(indexrelid)) as total_bytes_wasted
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0;

-- 4. Identifikasi indeks yang jarang digunakan (idx_scan < 10)
SELECT 
    '=== RARELY USED INDEXES (idx_scan < 10) ===' as section,
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    'DROP INDEX IF EXISTS public.' || indexrelname || ';' as drop_command
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan > 0
    AND idx_scan < 10
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 5. Tampilkan definisi indeks yang tidak terpakai untuk review
SELECT 
    '=== UNUSED INDEX DEFINITIONS ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    pg_size_pretty(pg_relation_size(c.oid)) as index_size
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND s.idx_scan = 0
ORDER BY pg_relation_size(c.oid) DESC;

-- 6. Identifikasi indeks pada kolom yang mungkin tidak diperlukan
SELECT 
    '=== POTENTIALLY UNNECESSARY INDEXES ===' as section,
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(c.oid)) as index_size,
    CASE 
        WHEN i.indexdef LIKE '%UNIQUE%' THEN 'UNIQUE - Keep for constraint'
        WHEN i.indexdef LIKE '%PRIMARY KEY%' THEN 'PRIMARY KEY - Keep'
        WHEN i.indexname LIKE '%_pkey' THEN 'PRIMARY KEY - Keep'
        WHEN s.idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN s.idx_scan < 5 THEN 'RARELY USED - Review'
        ELSE 'REVIEW USAGE'
    END as recommendation
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
WHERE i.schemaname = 'public'
    AND s.idx_scan < 10
ORDER BY s.idx_scan ASC, pg_relation_size(c.oid) DESC;

-- 7. Statistik reset terakhir (untuk memahami periode pengumpulan data)
SELECT 
    '=== STATISTICS INFO ===' as section,
    'Last stats reset: ' || COALESCE(stats_reset::text, 'Never') as info
FROM pg_stat_database 
WHERE datname = current_database();