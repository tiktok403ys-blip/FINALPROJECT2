-- Script analisis mendalam untuk mengidentifikasi semua fungsi dengan security warnings
-- File: analyze_security_warnings.sql

-- 1. Query semua fungsi SECURITY DEFINER di schema public
SELECT 
  'FUNGSI SECURITY DEFINER' as category,
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN routine_definition LIKE '%search_path%' THEN 'HAS_SEARCH_PATH'
    ELSE 'NO_SEARCH_PATH'
  END as search_path_status,
  CASE 
    WHEN routine_name LIKE '%_v2' THEN 'V2_FUNCTION'
    ELSE 'ORIGINAL_FUNCTION'
  END as version_status,
  LENGTH(routine_definition) as definition_length
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
ORDER BY routine_name;

-- 2. Hitung statistik fungsi
SELECT 
  'STATISTIK FUNGSI' as category,
  COUNT(*) as total_security_definer_functions,
  COUNT(CASE WHEN routine_definition LIKE '%search_path%' THEN 1 END) as functions_with_search_path,
  COUNT(CASE WHEN routine_definition NOT LIKE '%search_path%' THEN 1 END) as functions_without_search_path,
  COUNT(CASE WHEN routine_name LIKE '%_v2' THEN 1 END) as v2_functions,
  COUNT(CASE WHEN routine_name NOT LIKE '%_v2' THEN 1 END) as original_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER';

-- 3. Identifikasi fungsi yang masih bermasalah (tanpa search_path)
SELECT 
  'FUNGSI BERMASALAH' as category,
  routine_name,
  'Missing search_path in SECURITY DEFINER function' as issue,
  SUBSTRING(routine_definition, 1, 100) || '...' as definition_preview
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND routine_definition NOT LIKE '%search_path%'
ORDER BY routine_name;

-- 4. Identifikasi fungsi yang sudah diperbaiki (dengan search_path)
SELECT 
  'FUNGSI DIPERBAIKI' as category,
  routine_name,
  'Has search_path in SECURITY DEFINER function' as status,
  CASE 
    WHEN routine_name LIKE '%_v2' THEN 'V2_VERSION'
    ELSE 'ORIGINAL_VERSION'
  END as version_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND routine_definition LIKE '%search_path%'
ORDER BY routine_name;

-- 5. Cek fungsi critical yang ada
SELECT 
  'FUNGSI CRITICAL' as category,
  routine_name,
  CASE 
    WHEN routine_definition LIKE '%search_path%' THEN 'SECURE'
    ELSE 'VULNERABLE'
  END as security_status,
  CASE 
    WHEN routine_name LIKE '%_v2' THEN 'V2_VERSION'
    ELSE 'ORIGINAL_VERSION'
  END as version_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND routine_name IN ('is_authenticated', 'is_authenticated_v2', 'is_admin', 'is_admin_v2', 'is_owner', 'is_owner_v2')
ORDER BY routine_name;

-- 6. Cek RLS policies yang menggunakan fungsi authentication
SELECT 
  'RLS POLICIES' as category,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%is_authenticated_v2%' OR with_check LIKE '%is_authenticated_v2%' THEN 'USES_V2_AUTH'
    WHEN qual LIKE '%is_admin_v2%' OR with_check LIKE '%is_admin_v2%' THEN 'USES_V2_ADMIN'
    WHEN qual LIKE '%is_owner_v2%' OR with_check LIKE '%is_owner_v2%' THEN 'USES_V2_OWNER'
    WHEN qual LIKE '%is_authenticated%' OR with_check LIKE '%is_authenticated%' THEN 'USES_ORIGINAL_AUTH'
    WHEN qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%' THEN 'USES_ORIGINAL_ADMIN'
    WHEN qual LIKE '%is_owner%' OR with_check LIKE '%is_owner%' THEN 'USES_ORIGINAL_OWNER'
    ELSE 'OTHER'
  END as function_usage
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%is_authenticated%' 
       OR qual LIKE '%is_admin%' 
       OR qual LIKE '%is_owner%'
       OR with_check LIKE '%is_authenticated%'
       OR with_check LIKE '%is_admin%'
       OR with_check LIKE '%is_owner%')
ORDER BY tablename, policyname;

-- 7. Analisis detail fungsi yang paling sering muncul di warnings
SELECT 
  'ANALISIS DETAIL' as category,
  routine_name,
  security_type,
  CASE 
    WHEN routine_definition LIKE '%search_path = public, pg_temp%' THEN 'CORRECT_SEARCH_PATH'
    WHEN routine_definition LIKE '%search_path%' THEN 'HAS_SEARCH_PATH_BUT_CHECK_FORMAT'
    ELSE 'NO_SEARCH_PATH'
  END as search_path_analysis,
  CASE 
    WHEN routine_definition LIKE '%SECURITY DEFINER%' THEN 'EXPLICIT_SECURITY_DEFINER'
    ELSE 'IMPLICIT_SECURITY_DEFINER'
  END as security_definer_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND routine_name IN (
    'change_avatar_url_limits',
    'change_admin_pin_content_at',
    'is_owner',
    'is_authenticated', 
    'is_admin',
    'set_profile_claim_insert',
    'set_admin_pin',
    'change_admin_pin_change',
    'get_user_favorites_with_schema',
    'verify_last_seen',
    'verify_casino_search_vector',
    'verify_log_admin_activity',
    'get_casino_details_mobile'
  )
ORDER BY routine_name;

-- 8. Rekomendasi perbaikan
SELECT 
  'REKOMENDASI' as category,
  'SUMMARY' as type,
  'Total functions needing search_path fix: ' || 
  COUNT(CASE WHEN routine_definition NOT LIKE '%search_path%' THEN 1 END) as recommendation
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'

UNION ALL

SELECT 
  'REKOMENDASI' as category,
  'ACTION_NEEDED' as type,
  'Function: ' || routine_name || ' - Add SET search_path = public, pg_temp;' as recommendation
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND routine_definition NOT LIKE '%search_path%'
ORDER BY recommendation;

-- 9. Cek apakah ada fungsi yang duplikat (original dan _v2)
SELECT 
  'DUPLIKASI FUNGSI' as category,
  REPLACE(routine_name, '_v2', '') as base_function_name,
  STRING_AGG(routine_name, ', ') as versions_available,
  COUNT(*) as version_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
  AND (routine_name LIKE '%_v2' OR 
       EXISTS (
         SELECT 1 FROM information_schema.routines r2 
         WHERE r2.routine_schema = 'public' 
           AND r2.routine_name = routines.routine_name || '_v2'
       ))
GROUP BY REPLACE(routine_name, '_v2', '')
ORDER BY base_function_name;