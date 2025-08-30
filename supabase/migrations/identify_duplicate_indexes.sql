-- Query untuk mengidentifikasi indeks duplikat
-- Mencari indeks yang identik atau sangat mirip

-- 1. Tampilkan semua indeks dengan definisinya
SELECT 
    '=== ALL INDEXES ===' as section,
    schemaname,
    tablename,
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 2. Identifikasi indeks dengan nama yang mirip (kemungkinan duplikat)
WITH similar_names AS (
    SELECT 
        i1.schemaname,
        i1.tablename,
        i1.indexname as index1,
        i2.indexname as index2,
        i1.indexdef as def1,
        i2.indexdef as def2,
        pg_size_pretty(pg_relation_size(i1.indexname::regclass)) as size1,
        pg_size_pretty(pg_relation_size(i2.indexname::regclass)) as size2
    FROM pg_indexes i1
    JOIN pg_indexes i2 ON i1.tablename = i2.tablename 
        AND i1.schemaname = i2.schemaname
        AND i1.indexname < i2.indexname
    WHERE i1.schemaname = 'public'
        AND (
            -- Mengandung kata kunci yang sama
            (i1.indexname LIKE '%active%' AND i2.indexname LIKE '%active%') OR
            (i1.indexname LIKE '%user_id%' AND i2.indexname LIKE '%user_id%') OR
            (i1.indexname LIKE '%created%' AND i2.indexname LIKE '%created%') OR
            (i1.indexname LIKE '%is_active%' AND i2.indexname LIKE '%is_active%') OR
            (i1.indexname LIKE '%admin_users%' AND i2.indexname LIKE '%admin_users%') OR
            -- Nama dengan pola yang mirip (tanpa underscore)
            (REPLACE(i1.indexname, '_', '') = REPLACE(i2.indexname, '_', ''))
        )
)
SELECT 
    '=== POTENTIALLY DUPLICATE INDEXES BY NAME ===' as section,
    schemaname,
    tablename,
    index1,
    index2,
    size1,
    size2,
    CASE 
        WHEN def1 = def2 THEN 'IDENTICAL DEFINITION'
        WHEN REPLACE(def1, ' ', '') = REPLACE(def2, ' ', '') THEN 'SAME DEFINITION (WHITESPACE DIFF)'
        ELSE 'DIFFERENT DEFINITION'
    END as similarity_level,
    def1,
    def2
FROM similar_names
ORDER BY tablename, index1;

-- 3. Identifikasi indeks dengan definisi identik
WITH duplicate_definitions AS (
    SELECT 
        indexdef,
        COUNT(*) as count,
        array_agg(indexname) as index_names,
        array_agg(pg_size_pretty(pg_relation_size(indexname::regclass))) as sizes,
        tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY indexdef, tablename
    HAVING COUNT(*) > 1
)
SELECT 
    '=== INDEXES WITH IDENTICAL DEFINITIONS ===' as section,
    tablename,
    count as duplicate_count,
    index_names,
    sizes,
    indexdef,
    'Keep: ' || index_names[1] || ', Drop: ' || array_to_string(index_names[2:], ', ') as recommendation
FROM duplicate_definitions
ORDER BY count DESC, tablename;

-- 4. Identifikasi indeks yang mengcover kolom yang sama (functional duplicates)
WITH index_columns AS (
    SELECT 
        i.schemaname,
        i.tablename,
        i.indexname,
        i.indexdef,
        -- Extract kolom dari definisi indeks
        REGEXP_REPLACE(
            REGEXP_REPLACE(indexdef, '.*\((.*)\).*', '\1'),
            '\s+', '', 'g'
        ) as columns_normalized,
        pg_relation_size(i.indexname::regclass) as size_bytes
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
        AND i.indexdef NOT LIKE '%UNIQUE%'  -- Skip unique indexes
        AND i.indexname NOT LIKE '%_pkey'   -- Skip primary keys
)
SELECT 
    '=== FUNCTIONAL DUPLICATE INDEXES ===' as section,
    ic1.tablename,
    ic1.indexname as index1,
    ic2.indexname as index2,
    ic1.columns_normalized as columns1,
    ic2.columns_normalized as columns2,
    pg_size_pretty(ic1.size_bytes) as size1,
    pg_size_pretty(ic2.size_bytes) as size2,
    CASE 
        WHEN ic1.size_bytes > ic2.size_bytes THEN 'Keep ' || ic1.indexname || ', Drop ' || ic2.indexname
        ELSE 'Keep ' || ic2.indexname || ', Drop ' || ic1.indexname
    END as recommendation,
    'DROP INDEX IF EXISTS public.' || 
    CASE 
        WHEN ic1.size_bytes > ic2.size_bytes THEN ic2.indexname
        ELSE ic1.indexname
    END || ';' as drop_command
FROM index_columns ic1
JOIN index_columns ic2 ON ic1.tablename = ic2.tablename 
    AND ic1.indexname < ic2.indexname
    AND ic1.columns_normalized = ic2.columns_normalized
ORDER BY ic1.tablename, ic1.indexname;

-- 5. Identifikasi indeks yang redundan (subset dari indeks lain)
WITH index_analysis AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef,
        -- Extract kolom pertama dari indeks
        SPLIT_PART(
            REGEXP_REPLACE(
                REGEXP_REPLACE(indexdef, '.*\((.*)\).*', '\1'),
                '\s+', '', 'g'
            ), ',', 1
        ) as first_column,
        pg_relation_size(indexname::regclass) as size_bytes
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexdef NOT LIKE '%UNIQUE%'
        AND indexname NOT LIKE '%_pkey'
)
SELECT 
    '=== POTENTIALLY REDUNDANT INDEXES ===' as section,
    ia1.tablename,
    ia1.indexname as single_column_index,
    ia2.indexname as multi_column_index,
    ia1.first_column,
    ia1.indexdef as single_def,
    ia2.indexdef as multi_def,
    pg_size_pretty(ia1.size_bytes) as single_size,
    pg_size_pretty(ia2.size_bytes) as multi_size,
    'DROP INDEX IF EXISTS public.' || ia1.indexname || ';' as drop_command
FROM index_analysis ia1
JOIN index_analysis ia2 ON ia1.tablename = ia2.tablename
    AND ia1.indexname != ia2.indexname
    AND ia1.first_column = ia2.first_column
    AND ia2.indexdef LIKE '%,' || ia1.first_column || '%' OR ia2.indexdef LIKE '%' || ia1.first_column || ',%'
WHERE ia1.indexdef NOT LIKE '%,%'  -- ia1 is single column
    AND ia2.indexdef LIKE '%,%'     -- ia2 is multi column
ORDER BY ia1.tablename, ia1.indexname;

-- 6. Generate DROP commands untuk indeks duplikat yang jelas
WITH clear_duplicates AS (
    SELECT 
        indexdef,
        array_agg(indexname ORDER BY indexname) as index_names,
        tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY indexdef, tablename
    HAVING COUNT(*) > 1
)
SELECT 
    '=== DROP COMMANDS FOR CLEAR DUPLICATES ===' as section,
    tablename,
    index_names[1] as keep_index,
    UNNEST(index_names[2:]) as drop_index,
    'DROP INDEX IF EXISTS public.' || UNNEST(index_names[2:]) || ';' as drop_command
FROM clear_duplicates;

-- 7. Summary statistik
WITH duplicate_stats AS (
    SELECT 
        COUNT(*) as total_duplicate_groups,
        SUM(count - 1) as total_indexes_to_drop
    FROM (
        SELECT 
            indexdef,
            COUNT(*) as count
        FROM pg_indexes
        WHERE schemaname = 'public'
        GROUP BY indexdef
        HAVING COUNT(*) > 1
    ) sub
)
SELECT 
    '=== DUPLICATE INDEX SUMMARY ===' as section,
    total_duplicate_groups,
    total_indexes_to_drop,
    'Run individual DROP commands above to reclaim space' as note
FROM duplicate_stats;