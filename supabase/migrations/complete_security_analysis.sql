-- Complete Security Analysis Script
-- Menganalisis semua fungsi di database untuk mengidentifikasi security warnings

-- 1. Analisis semua fungsi SECURITY DEFINER
SELECT 
    'SECURITY_DEFINER_FUNCTIONS' as analysis_type,
    routine_name,
    routine_type,
    security_type,
    CASE 
        WHEN routine_definition LIKE '%search_path%' THEN 'HAS_SEARCH_PATH'
        ELSE 'MISSING_SEARCH_PATH'
    END as search_path_status,
    CASE 
        WHEN routine_name LIKE '%_v2' THEN 'V2_FUNCTION'
        ELSE 'ORIGINAL_FUNCTION'
    END as function_version,
    LENGTH(routine_definition) as definition_length
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND security_type = 'DEFINER'
ORDER BY routine_name;

-- 2. Analisis fungsi yang berpotensi bermasalah
SELECT 
    'PROBLEMATIC_FUNCTIONS' as analysis_type,
    routine_name,
    'Missing search_path in SECURITY DEFINER function' as issue_description,
    'HIGH' as severity
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND security_type = 'DEFINER'
    AND routine_definition NOT LIKE '%search_path%';

-- 3. Analisis pasangan fungsi original vs v2
WITH function_pairs AS (
    SELECT 
        CASE 
            WHEN routine_name LIKE '%_v2' THEN REPLACE(routine_name, '_v2', '')
            ELSE routine_name
        END as base_name,
        routine_name,
        CASE 
            WHEN routine_name LIKE '%_v2' THEN 'v2'
            ELSE 'original'
        END as version_type,
        security_type,
        CASE 
            WHEN routine_definition LIKE '%search_path%' THEN true
            ELSE false
        END as has_search_path
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND security_type = 'DEFINER'
)
SELECT 
    'FUNCTION_MIGRATION_STATUS' as analysis_type,
    base_name,
    COUNT(*) as total_versions,
    COUNT(CASE WHEN version_type = 'original' THEN 1 END) as has_original,
    COUNT(CASE WHEN version_type = 'v2' THEN 1 END) as has_v2,
    COUNT(CASE WHEN has_search_path = true THEN 1 END) as secure_versions,
    CASE 
        WHEN COUNT(CASE WHEN version_type = 'v2' AND has_search_path = true THEN 1 END) > 0 
             AND COUNT(CASE WHEN version_type = 'original' THEN 1 END) > 0
        THEN 'READY_FOR_MIGRATION'
        WHEN COUNT(CASE WHEN version_type = 'v2' THEN 1 END) = 0
        THEN 'NEEDS_V2_CREATION'
        WHEN COUNT(CASE WHEN version_type = 'v2' AND has_search_path = true THEN 1 END) = 0
        THEN 'V2_NEEDS_SEARCH_PATH'
        ELSE 'UNKNOWN_STATUS'
    END as migration_status
FROM function_pairs
GROUP BY base_name
ORDER BY base_name;

-- 4. Daftar fungsi yang perlu dibuat versi v2
SELECT 
    'MISSING_V2_FUNCTIONS' as analysis_type,
    routine_name as original_function,
    routine_name || '_v2' as needed_v2_function,
    'CREATE OR REPLACE FUNCTION ' || routine_name || '_v2() RETURNS ' || 
    COALESCE(data_type, 'boolean') || ' LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$ BEGIN RETURN ' || 
    routine_name || '(); END $$;' as suggested_sql
FROM information_schema.routines r1
WHERE routine_schema = 'public' 
    AND security_type = 'DEFINER'
    AND routine_definition NOT LIKE '%search_path%'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.routines r2 
        WHERE r2.routine_schema = 'public' 
            AND r2.routine_name = r1.routine_name || '_v2'
    )
ORDER BY routine_name;

-- 5. Analisis RLS policies yang menggunakan fungsi bermasalah
SELECT 
    'RLS_POLICY_ANALYSIS' as analysis_type,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%is_authenticated()%' OR qual LIKE '%is_admin()%' OR qual LIKE '%is_owner()%'
        THEN 'USES_ORIGINAL_FUNCTIONS'
        WHEN qual LIKE '%is_authenticated_v2()%' OR qual LIKE '%is_admin_v2()%' OR qual LIKE '%is_owner_v2()%'
        THEN 'USES_V2_FUNCTIONS'
        ELSE 'OTHER_FUNCTIONS'
    END as function_usage,
    qual as policy_definition
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual LIKE '%is_authenticated%' OR qual LIKE '%is_admin%' OR qual LIKE '%is_owner%')
ORDER BY tablename, policyname;

-- 6. Summary report
SELECT 
    'SECURITY_SUMMARY' as analysis_type,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' AND security_type = 'DEFINER'
    ) as total_security_definer_functions,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
            AND security_type = 'DEFINER'
            AND routine_definition NOT LIKE '%search_path%'
    ) as functions_without_search_path,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
            AND security_type = 'DEFINER'
            AND routine_name LIKE '%_v2'
    ) as v2_functions_count,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public'
            AND (qual LIKE '%is_authenticated()%' OR qual LIKE '%is_admin()%' OR qual LIKE '%is_owner()%')
    ) as policies_using_original_functions,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public'
            AND (qual LIKE '%is_authenticated_v2()%' OR qual LIKE '%is_admin_v2()%' OR qual LIKE '%is_owner_v2()%')
    ) as policies_using_v2_functions;

-- 7. Rekomendasi prioritas perbaikan
SELECT 
    'PRIORITY_RECOMMENDATIONS' as analysis_type,
    1 as priority_order,
    'CREATE_MISSING_V2_FUNCTIONS' as action_type,
    'Buat fungsi _v2 untuk semua fungsi SECURITY DEFINER yang belum memiliki versi v2' as description,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines r1
        WHERE routine_schema = 'public' 
            AND security_type = 'DEFINER'
            AND routine_definition NOT LIKE '%search_path%'
            AND NOT EXISTS (
                SELECT 1 FROM information_schema.routines r2 
                WHERE r2.routine_schema = 'public' 
                    AND r2.routine_name = r1.routine_name || '_v2'
            )
    ) as affected_functions

UNION ALL

SELECT 
    'PRIORITY_RECOMMENDATIONS' as analysis_type,
    2 as priority_order,
    'UPDATE_RLS_POLICIES' as action_type,
    'Update RLS policies untuk menggunakan fungsi _v2 yang aman' as description,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public'
            AND (qual LIKE '%is_authenticated()%' OR qual LIKE '%is_admin()%' OR qual LIKE '%is_owner()%')
    ) as affected_policies

UNION ALL

SELECT 
    'PRIORITY_RECOMMENDATIONS' as analysis_type,
    3 as priority_order,
    'ADD_SEARCH_PATH_TO_EXISTING' as action_type,
    'Tambahkan search_path ke fungsi SECURITY DEFINER yang belum memilikinya' as description,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
            AND security_type = 'DEFINER'
            AND routine_definition NOT LIKE '%search_path%'
    ) as affected_functions

ORDER BY priority_order;