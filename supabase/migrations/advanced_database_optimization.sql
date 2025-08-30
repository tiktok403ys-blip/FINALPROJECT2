-- =====================================================
-- ADVANCED DATABASE OPTIMIZATION QUERIES
-- =====================================================
-- File ini berisi 3 query optimasi database lanjutan:
-- 1. Solusi partisi tabel untuk tabel besar
-- 2. Query untuk menghapus indeks yang tidak digunakan
-- 3. Query untuk menghapus indeks duplikat
-- =====================================================

-- =====================================================
-- 1. SOLUSI UNTUK TABEL BESAR - PARTISI TABEL
-- =====================================================
-- Contoh partisi untuk tabel besar berdasarkan tanggal
-- Ganti nama_tabel_besar dengan tabel target Anda
-- Asumsi tabel memiliki kolom created_at dengan tipe timestamp

-- 1. Buat tabel partisi baru
CREATE TABLE nama_tabel_besar_partitioned (
    -- salin semua definisi kolom dari tabel asli
    id bigint,
    -- kolom lainnya...
    created_at timestamp with time zone,
    -- kolom lainnya...
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2. Buat partisi bulanan (contoh untuk 3 bulan)
CREATE TABLE nama_tabel_besar_y2023m01
    PARTITION OF nama_tabel_besar_partitioned
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');

CREATE TABLE nama_tabel_besar_y2023m02
    PARTITION OF nama_tabel_besar_partitioned
    FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');

CREATE TABLE nama_tabel_besar_y2023m03
    PARTITION OF nama_tabel_besar_partitioned
    FOR VALUES FROM ('2023-03-01') TO ('2023-04-01');

-- 3. Migrasi data dari tabel asli
-- INSERT INTO nama_tabel_besar_partitioned
-- SELECT * FROM nama_tabel_besar;

-- 4. Verifikasi data
-- SELECT COUNT(*) FROM nama_tabel_besar;
-- SELECT COUNT(*) FROM nama_tabel_besar_partitioned;

-- 5. Jika jumlah sama, ganti tabel lama dengan yang baru
-- AWAS: Pastikan Anda memiliki backup sebelum melakukan ini!
-- ALTER TABLE nama_tabel_besar RENAME TO nama_tabel_besar_old;
-- ALTER TABLE nama_tabel_besar_partitioned RENAME TO nama_tabel_besar;

-- =====================================================
-- 2. SOLUSI UNTUK MENGHAPUS INDEKS YANG TIDAK DIGUNAKAN
-- =====================================================
-- AWAS: Script ini menghasilkan pernyataan DROP INDEX untuk indeks yang tidak digunakan
-- SELALU backup database sebelum menghapus indeks
-- SELALU tinjau setiap pernyataan DROP sebelum menjalankannya

-- Menghasilkan pernyataan DROP untuk indeks yang tidak digunakan
SELECT
    'DROP INDEX IF EXISTS ' || quote_ident(schemaname) || '.' || quote_ident(indexrelname) || ';' as drop_statement,
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size,
    idx_scan as scan_count,
    pg_relation_size(indexrelid::regclass) as size_in_bytes
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- indeks yang belum pernah digunakan
  AND schemaname = 'public'
  -- Jangan hapus indeks yang mendukung primary key atau unique constraint
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conindid = indexrelid
    AND c.contype IN ('p', 'u')
  )
ORDER BY pg_relation_size(indexrelid::regclass) DESC;

-- CATATAN: Sebelum menghapus indeks, pertimbangkan hal berikut:
-- 1. Apakah aplikasi baru saja diluncurkan, sehingga indeks belum digunakan?
-- 2. Apakah ada operasi yang jarang dilakukan yang membutuhkan indeks ini?
-- 3. Apakah indeks mendukung foreign key?

-- Untuk menjalankan pernyataan DROP, salin pernyataan yang dihasilkan
-- dan jalankan satu per satu setelah ditinjau dengan cermat.

-- =====================================================
-- 3. SOLUSI UNTUK MENGHAPUS INDEKS DUPLIKAT
-- =====================================================
-- AWAS: Script ini menghasilkan pernyataan untuk menghapus indeks duplikat
-- SELALU backup database sebelum menghapus indeks
-- SELALU tinjau setiap pernyataan DROP sebelum menjalankannya

-- Menemukan indeks duplikat dan membuat pernyataan DROP
WITH duplicate_indexes AS (
    SELECT
        indrelid::regclass as table_name,
        array_agg(indexrelid::regclass) as duplicate_indexes,
        array_agg(pg_get_indexdef(indexrelid)) as index_definitions,
        sum(pg_relation_size(indexrelid)) as total_size_bytes
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
)
SELECT
    'DROP INDEX IF EXISTS ' || index_to_drop || ';' as drop_statement,
    table_name,
    duplicate_indexes,
    pg_size_pretty(total_size_bytes) as total_size,
    index_to_keep,
    index_to_drop,
    index_def_keep,
    index_def_drop
FROM (
    SELECT
        table_name,
        duplicate_indexes,
        total_size_bytes,
        duplicate_indexes[1]::text as index_to_keep,
        unnest(duplicate_indexes[2:array_length(duplicate_indexes, 1)])::text as index_to_drop,
        index_definitions[1] as index_def_keep,
        unnest(index_definitions[2:array_length(index_definitions, 1)]) as index_def_drop
    FROM duplicate_indexes
) as drop_candidates
ORDER BY total_size_bytes DESC, table_name;

-- CATATAN: Sebelum menghapus indeks, pastikan:
-- 1. Indeks yang dipertahankan benar-benar mencakup fungsi yang sama
-- 2. Perhatikan pola akses data Anda, kadang indeks yang tampak duplikat sebenarnya
--    dioptimalkan untuk pola query yang berbeda
-- 3. Periksa apakah ada constraint (foreign key, unique) yang terikat pada indeks

-- =====================================================
-- QUERY VERIFIKASI DAN ANALISIS TAMBAHAN
-- =====================================================

-- Cek ukuran tabel terbesar untuk kandidat partisi
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Cek statistik penggunaan indeks secara keseluruhan
SELECT
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid::regclass) DESC;

-- =====================================================
-- REKOMENDASI OPTIMASI LANJUTAN
-- =====================================================
-- 1. Untuk tabel dengan ukuran > 1GB, pertimbangkan partisi
-- 2. Untuk indeks dengan idx_scan = 0 dan ukuran > 10MB, pertimbangkan penghapusan
-- 3. Monitor penggunaan indeks secara berkala dengan pg_stat_user_indexes
-- 4. Gunakan EXPLAIN ANALYZE untuk memverifikasi performa query setelah optimasi
-- 5. Pertimbangkan vacuum dan analyze secara berkala untuk menjaga statistik terbaru