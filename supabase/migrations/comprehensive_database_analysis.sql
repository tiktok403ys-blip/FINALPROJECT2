-- Analisis Komprehensif Database Storage dan Performa
-- File ini berisi 5 query utama untuk mengidentifikasi masalah performa database

-- ========================================
-- Query 1: Ukuran total database, skema, dan tabel
-- Menampilkan total ukuran database dan distribusi penyimpanan
-- ========================================
SELECT '=== UKURAN DATABASE DAN DISTRIBUSI PENYIMPANAN ===' as section;

WITH 
table_sizes AS ( 
    SELECT 
        schemaname, 
        tablename, 
        pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') as total_bytes, 
        pg_relation_size('"' || schemaname || '"."' || tablename || '"') as table_bytes, 
        pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') - 
        pg_relation_size('"' || schemaname || '"."' || tablename || '"') as index_bytes 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
), 
schema_sizes AS ( 
    SELECT 
        schemaname, 
        SUM(total_bytes) as schema_size, 
        SUM(table_bytes) as table_size, 
        SUM(index_bytes) as index_size 
    FROM table_sizes 
    GROUP BY schemaname 
) 
SELECT 
    'Total Database Size' as description, 
    pg_size_pretty(pg_database_size(current_database())) as size 
UNION ALL 
SELECT 
    'Total Tables Size' as description, 
    pg_size_pretty(SUM(table_bytes)) as size 
FROM table_sizes 
UNION ALL 
SELECT 
    'Total Indexes Size' as description, 
    pg_size_pretty(SUM(index_bytes)) as size 
FROM table_sizes 
UNION ALL 
SELECT 
    'Schema: ' || schemaname as description, 
    pg_size_pretty(schema_size) as size 
FROM schema_sizes 
ORDER BY description;

-- ========================================
-- Query 2: Tabel dan Indeks Terbesar
-- Menampilkan tabel-tabel yang menghabiskan ruang terbanyak
-- ========================================
SELECT '=== TABEL DAN INDEKS TERBESAR ===' as section;

WITH 
table_sizes AS ( 
    SELECT 
        schemaname, 
        tablename, 
        pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') as total_bytes, 
        pg_relation_size('"' || schemaname || '"."' || tablename || '"') as table_bytes, 
        pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') - 
        pg_relation_size('"' || schemaname || '"."' || tablename || '"') as index_bytes 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
) 
SELECT 
    schemaname as schema_name, 
    tablename as table_name, 
    pg_size_pretty(total_bytes) as total_size, 
    pg_size_pretty(table_bytes) as table_size, 
    pg_size_pretty(index_bytes) as index_size, 
    round(100 * index_bytes::numeric / nullif(total_bytes, 0), 2) as index_ratio 
FROM table_sizes 
ORDER BY total_bytes DESC 
LIMIT 20;

-- ========================================
-- Query 3: Indeks yang Tidak Pernah Digunakan
-- Menampilkan indeks yang tidak pernah dipanggil dan seberapa besar ukurannya
-- ========================================
SELECT '=== INDEKS YANG TIDAK PERNAH DIGUNAKAN ===' as section;

SELECT 
    schemaname, 
    relname as table_name, 
    indexrelname as index_name, 
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size, 
    idx_scan as scan_count 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 -- indeks yang belum pernah digunakan 
  AND schemaname = 'public' 
ORDER BY pg_relation_size(indexrelid::regclass) DESC;

-- ========================================
-- Query 4: Indeks Duplikat yang Menyia-nyiakan Ruang
-- Menampilkan indeks yang memiliki definisi serupa/identik pada tabel yang sama
-- ========================================
SELECT '=== INDEKS DUPLIKAT YANG MENYIA-NYIAKAN RUANG ===' as section;

SELECT 
    indrelid::regclass as table_name, 
    array_agg(indexrelid::regclass) as duplicate_indexes, 
    pg_size_pretty(sum(pg_relation_size(indexrelid))) as total_size 
FROM ( 
    SELECT 
        i.indexrelid, 
        i.indrelid, 
        i.indkey, 
        i.indisclustered, 
        i.indisreplident, 
        i.indisvalid, 
        i.indpred, 
        i.indclass, 
        i.indcollation 
    FROM 
        pg_index i 
        JOIN pg_class c ON i.indrelid = c.oid 
    WHERE 
        c.relnamespace = 'public'::regnamespace 
) as idx 
GROUP BY 
    indrelid, indkey, indisclustered, indisreplident, indisvalid, 
    indpred::text, indclass::text, indcollation::text 
HAVING 
    count(*) > 1 
ORDER BY 
    sum(pg_relation_size(indexrelid)) DESC;

-- ========================================
-- Query 5: Foreign Key Tanpa Indeks
-- Menemukan foreign key yang tidak memiliki indeks pendukung
-- ========================================
SELECT '=== FOREIGN KEY TANPA INDEKS ===' as section;

SELECT 
    conrelid::regclass AS table_name, 
    a.attname AS column_name, 
    confrelid::regclass AS referenced_table, 
    af.attname AS referenced_column, 
    pg_size_pretty(pg_relation_size(conrelid)) as table_size 
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
            AND array_position(i.indkey, a.attnum) = 0 -- Cek kolom pertama indeks (most selective) 
    ) 
    AND c.connamespace = 'public'::regnamespace 
ORDER BY 
    pg_relation_size(conrelid) DESC;

-- ========================================
-- RINGKASAN ANALISIS
-- ========================================
SELECT '=== RINGKASAN ANALISIS ===' as section;

SELECT 
    'Analisis database storage dan performa telah selesai.' as summary,
    'Periksa hasil di atas untuk mengidentifikasi area yang perlu dioptimasi.' as recommendation;