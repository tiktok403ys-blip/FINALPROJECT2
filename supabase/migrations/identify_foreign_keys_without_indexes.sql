-- Query untuk mengidentifikasi foreign key yang tidak memiliki indeks
-- Berdasarkan Performance Advisor Supabase

-- 1. Identifikasi semua foreign key constraints
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ===' as section,
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Identifikasi foreign key yang tidak memiliki indeks
WITH foreign_keys AS (
    SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
),
indexes AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
)
SELECT 
    '=== FOREIGN KEYS WITHOUT INDEXES ===' as section,
    fk.table_name,
    fk.constraint_name,
    fk.column_name,
    fk.foreign_table_name,
    fk.foreign_column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM indexes i 
            WHERE i.tablename = fk.table_name 
            AND i.indexdef LIKE '%(' || fk.column_name || ')%'
        ) THEN 'HAS INDEX'
        ELSE 'MISSING INDEX'
    END as index_status,
    'CREATE INDEX idx_' || fk.table_name || '_' || fk.column_name || ' ON public.' || fk.table_name || ' (' || fk.column_name || ');' as suggested_index
FROM foreign_keys fk
WHERE NOT EXISTS (
    SELECT 1 FROM indexes i 
    WHERE i.tablename = fk.table_name 
    AND i.indexdef LIKE '%(' || fk.column_name || ')%'
)
ORDER BY fk.table_name, fk.column_name;

-- 3. Hitung total foreign key tanpa indeks
WITH foreign_keys AS (
    SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
),
indexes AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
)
SELECT 
    '=== SUMMARY ===' as section,
    COUNT(*) as total_foreign_keys_without_indexes
FROM foreign_keys fk
WHERE NOT EXISTS (
    SELECT 1 FROM indexes i 
    WHERE i.tablename = fk.table_name 
    AND i.indexdef LIKE '%(' || fk.column_name || ')%'
);

-- 4. Tampilkan contoh foreign key yang sudah memiliki indeks (untuk verifikasi)
WITH foreign_keys AS (
    SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
),
indexes AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
)
SELECT 
    '=== FOREIGN KEYS WITH INDEXES (SAMPLE) ===' as section,
    fk.table_name,
    fk.column_name,
    i.indexname,
    i.indexdef
FROM foreign_keys fk
JOIN indexes i ON i.tablename = fk.table_name 
    AND i.indexdef LIKE '%(' || fk.column_name || ')%'
LIMIT 10;