-- Pemeriksaan detail untuk tabel user_login_history
-- Mencari kebijakan RLS yang mungkin menyebabkan masalah performa

-- 1. Tampilkan semua kebijakan RLS di tabel user_login_history
SELECT 
    '=== USER_LOGIN_HISTORY POLICIES ===' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
ORDER BY policyname;

-- 2. Cek apakah ada kebijakan yang menggunakan current_setting untuk role detection
SELECT 
    '=== CURRENT_SETTING USAGE ===' as section,
    policyname,
    CASE 
        WHEN qual LIKE '%current_setting%' THEN 'USING: ' || qual
        WHEN with_check LIKE '%current_setting%' THEN 'WITH CHECK: ' || with_check
        ELSE 'No current_setting found'
    END as policy_definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
    AND (qual LIKE '%current_setting%' OR with_check LIKE '%current_setting%');

-- 3. Cek apakah ada kebijakan yang menggunakan service_role detection
SELECT 
    '=== SERVICE_ROLE DETECTION ===' as section,
    policyname,
    CASE 
        WHEN qual LIKE '%service_role%' OR qual LIKE '%jwt.role%' THEN 'USING: ' || qual
        WHEN with_check LIKE '%service_role%' OR with_check LIKE '%jwt.role%' THEN 'WITH CHECK: ' || with_check
        ELSE 'No service_role detection found'
    END as policy_definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
    AND (qual LIKE '%service_role%' OR qual LIKE '%jwt.role%' OR with_check LIKE '%service_role%' OR with_check LIKE '%jwt.role%');

-- 4. Cek struktur tabel user_login_history
SELECT 
    '=== TABLE STRUCTURE ===' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_login_history'
ORDER BY ordinal_position;

-- 5. Cek apakah RLS diaktifkan di tabel user_login_history
SELECT 
    '=== RLS STATUS ===' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history';

-- 6. Tampilkan semua kebijakan yang mungkin bermasalah (tidak menggunakan SELECT wrapper)
SELECT 
    '=== POTENTIALLY PROBLEMATIC POLICIES ===' as section,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'PROBLEMATIC USING: ' || qual
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'PROBLEMATIC WITH CHECK: ' || with_check
        WHEN qual LIKE '%current_setting%' AND qual NOT LIKE '%(SELECT current_setting%' THEN 'PROBLEMATIC CURRENT_SETTING: ' || qual
        ELSE 'Policy appears optimized'
    END as issue_description
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_login_history'
ORDER BY policyname;