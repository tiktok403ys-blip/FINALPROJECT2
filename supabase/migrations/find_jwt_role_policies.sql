-- Mencari kebijakan RLS yang menggunakan JWT role detection
-- yang mungkin menyebabkan masalah performa

-- 1. Cek semua kebijakan yang menggunakan JWT claims untuk role detection
SELECT 
    '=== JWT ROLE DETECTION POLICIES ===' as section,
    schemaname,
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND (qual LIKE '%jwt.claims%' 
         OR qual LIKE '%request.jwt.claims%'
         OR qual LIKE '%role%service_role%'
         OR qual LIKE '%current_setting%role%')
UNION ALL
SELECT 
    '=== JWT ROLE DETECTION POLICIES ===' as section,
    schemaname,
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND (with_check LIKE '%jwt.claims%' 
         OR with_check LIKE '%request.jwt.claims%'
         OR with_check LIKE '%role%service_role%'
         OR with_check LIKE '%current_setting%role%')
ORDER BY tablename, policyname;

-- 2. Cek kebijakan yang menggunakan current_setting tanpa SELECT wrapper
SELECT 
    '=== UNOPTIMIZED CURRENT_SETTING ===' as section,
    schemaname,
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND qual LIKE '%current_setting%'
    AND qual NOT LIKE '%(SELECT current_setting%'
UNION ALL
SELECT 
    '=== UNOPTIMIZED CURRENT_SETTING ===' as section,
    schemaname,
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND with_check LIKE '%current_setting%'
    AND with_check NOT LIKE '%(SELECT current_setting%'
ORDER BY tablename, policyname;

-- 3. Tampilkan semua kebijakan di user_login_history dengan detail lengkap
SELECT 
    '=== USER_LOGIN_HISTORY DETAILED ===' as section,
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_definition,
    with_check as with_check_definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
ORDER BY policyname;

-- 4. Cek apakah ada kebijakan "Service role can manage all login history"
SELECT 
    '=== SERVICE ROLE POLICY CHECK ===' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
                AND tablename = 'user_login_history'
                AND policyname LIKE '%Service role%'
        ) THEN 'Service role policy EXISTS'
        ELSE 'Service role policy NOT FOUND'
    END as policy_status;

-- 5. Tampilkan definisi lengkap kebijakan service role jika ada
SELECT 
    '=== SERVICE ROLE POLICY DEFINITION ===' as section,
    policyname,
    qual as using_clause,
    with_check,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
    AND (policyname LIKE '%Service role%' OR policyname LIKE '%service_role%')
ORDER BY policyname;