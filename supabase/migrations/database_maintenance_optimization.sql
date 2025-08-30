-- =====================================================
-- DATABASE MAINTENANCE OPTIMIZATION QUERIES
-- =====================================================
-- File ini berisi 2 query optimasi pemeliharaan database:
-- 1. Query untuk menambahkan indeks pada foreign key yang tidak memiliki indeks
-- 2. Query untuk VACUUM dan ANALYZE pemeliharaan database
-- =====================================================

-- =====================================================
-- 4. SOLUSI UNTUK MENAMBAHKAN INDEKS PADA FOREIGN KEY
-- =====================================================
-- Menghasilkan pernyataan CREATE INDEX untuk foreign key yang tidak memiliki indeks
WITH fk_without_index AS (
    SELECT
        c.conrelid::regclass AS table_name,
        c.conname AS constraint_name,
        a.attname AS column_name,
        c.confrelid::regclass AS referenced_table,
        af.attname AS referenced_column,
        pg_relation_size(c.conrelid) as table_size_bytes
    FROM
        pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
    WHERE
        c.contype = 'f'
        AND NOT EXISTS (
            SELECT 1
            FROM pg_index i
            WHERE
                i.indrelid = c.conrelid
                AND a.attnum = ANY(i.indkey)
                AND array_position(i.indkey, a.attnum) = 0
        )
        AND c.connamespace = 'public'::regnamespace
)
SELECT
    'CREATE INDEX idx_' ||
    replace(table_name::text, '.', '_') || '_' ||
    column_name || ' ON ' ||
    table_name || ' (' || column_name || ');' AS create_index_statement,
    table_name,
    column_name,
    referenced_table,
    referenced_column,
    pg_size_pretty(table_size_bytes) as table_size,
    constraint_name
FROM fk_without_index
ORDER BY table_size_bytes DESC;

-- CATATAN:
-- 1. Menambahkan indeks pada foreign key meningkatkan performa saat melakukan JOIN
-- 2. Juga meningkatkan performa saat menghapus baris dari tabel referensi
-- 3. Penamaan indeks mengikuti pola: idx_[nama_tabel]_[nama_kolom]
-- 4. Indeks diurutkan berdasarkan ukuran tabel untuk memprioritaskan tabel besar

-- =====================================================
-- 5. SOLUSI UNTUK VACUUM DAN ANALYZE - PEMELIHARAAN DATABASE
-- =====================================================
-- Mengidentifikasi tabel yang perlu VACUUM atau ANALYZE
SELECT
    schemaname,
    relname as table_name,
    n_dead_tup as dead_tuples,
    n_live_tup as live_tuples,
    round(n_dead_tup::numeric / nullif(n_live_tup, 0) * 100, 2) as dead_tuple_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    'VACUUM ANALYZE ' || quote_ident(schemaname) || '.' || quote_ident(relname) || ';' as maintenance_command
FROM pg_stat_user_tables
WHERE
    -- Tabel yang memiliki >10% dead tuples atau belum pernah di-vacuum dalam 7 hari
    (n_dead_tup > 10000 OR
     n_dead_tup::numeric / nullif(n_live_tup, 0) > 0.1 OR
     (last_vacuum IS NULL AND last_autovacuum IS NULL) OR
     (COALESCE(last_vacuum, last_autovacuum) < NOW() - INTERVAL '7 days'))
    AND schemaname = 'public'
ORDER BY dead_tuple_ratio DESC NULLS LAST;

-- Pernyataan VACUUM ANALYZE untuk semua tabel public
-- VACUUM mengambil kembali ruang dari dead tuples
-- ANALYZE mengupdate statistik untuk query planner
-- VACUUM ANALYZE;

-- CATATAN:
-- 1. VACUUM FULL lebih agresif dan mengharuskan exclusive lock
--    gunakan hanya di periode maintenance terencana
-- 2. Tabel dengan rasio dead tuple tinggi memerlukan vacuum untuk menghindari bloat
-- 3. Tabel yang sering diupdate perlu vacuum lebih sering
-- 4. Setting autovacuum yang baik sangat direkomendasikan

-- =====================================================
-- QUERY VERIFIKASI DAN ANALISIS TAMBAHAN
-- =====================================================

-- Cek status autovacuum dan autoanalyze
SELECT
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_dead_tup as dead_tuples,
    n_live_tup as live_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- Cek ukuran database dan tabel untuk monitoring
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cek bloat estimation untuk tabel
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    CASE
        WHEN pg_stat_get_live_tuples(c.oid) > 0 THEN
            round((pg_stat_get_dead_tuples(c.oid)::numeric / pg_stat_get_live_tuples(c.oid)) * 100, 2)
        ELSE 0
    END as bloat_ratio
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
ORDER BY bloat_ratio DESC;

-- =====================================================
-- REKOMENDASI PEMELIHARAAN DATABASE
-- =====================================================
-- 1. Jalankan VACUUM ANALYZE secara berkala untuk tabel dengan aktivitas tinggi
-- 2. Monitor dead tuple ratio dan jalankan VACUUM jika > 10%
-- 3. Pastikan autovacuum settings optimal untuk workload Anda
-- 4. Pertimbangkan VACUUM FULL untuk tabel dengan bloat tinggi (hanya saat maintenance)
-- 5. Monitor ukuran database dan tabel untuk perencanaan kapasitas
-- 6. Tambahkan indeks pada foreign key yang belum memiliki indeks
-- 7. Gunakan pg_stat_reset() untuk reset statistik jika diperlukan