-- Query untuk mengidentifikasi kebijakan RLS yang bermasalah
-- Mencari kebijakan yang memanggil auth.uid() atau fungsi lain per baris

-- 1. Tampilkan semua kebijakan RLS yang aktif
SELECT 
    '=== ALL ACTIVE RLS POLICIES ===' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Identifikasi kebijakan yang menggunakan auth.uid() tanpa SELECT wrapper
SELECT 
    '=== POLICIES WITH PROBLEMATIC auth.uid() CALLS ===' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'QUAL has direct auth.uid()'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'WITH_CHECK has direct auth.uid()'
        ELSE 'OK'
    END as issue_type,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 
            REPLACE(qual, 'auth.uid()', '(SELECT auth.uid())')
        ELSE qual
    END as suggested_qual_fix,
    CASE 
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 
            REPLACE(with_check, 'auth.uid()', '(SELECT auth.uid())')
        ELSE with_check
    END as suggested_with_check_fix
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
        (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')
    )
ORDER BY tablename, policyname;

-- 3. Identifikasi kebijakan yang menggunakan current_setting tanpa SELECT wrapper
SELECT 
    '=== POLICIES WITH PROBLEMATIC current_setting() CALLS ===' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%' THEN 'QUAL has direct current_setting()'
        WHEN with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%' THEN 'WITH_CHECK has direct current_setting()'
        ELSE 'OK'
    END as issue_type
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        (qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%') OR
        (with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%')
    )
ORDER BY tablename, policyname;

-- 4. Generate DROP dan CREATE statements untuk kebijakan yang perlu diperbaiki
SELECT 
    '=== POLICY RECREATION COMMANDS ===' as section,
    tablename,
    policyname,
    'DROP POLICY IF EXISTS "' || policyname || '" ON public.' || tablename || ';' as drop_command,
    'CREATE POLICY "' || policyname || '" ON public.' || tablename || 
    ' FOR ' || UPPER(cmd) || 
    ' TO ' || array_to_string(roles, ', ') ||
    CASE 
        WHEN qual IS NOT NULL THEN 
            ' USING (' || REPLACE(REPLACE(qual, 'auth.uid()', '(SELECT auth.uid())'), 'current_setting(', '(SELECT current_setting(') || ')'
        ELSE ''
    END ||
    CASE 
        WHEN with_check IS NOT NULL THEN 
            ' WITH CHECK (' || REPLACE(REPLACE(with_check, 'auth.uid()', '(SELECT auth.uid())'), 'current_setting(', '(SELECT current_setting(') || ')'
        ELSE ''
    END || ';' as create_command
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
        (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
        (qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%') OR
        (with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%')
    )
ORDER BY tablename, policyname;

-- 5. Hitung total kebijakan yang perlu diperbaiki
SELECT 
    '=== SUMMARY ===' as section,
    COUNT(*) as total_problematic_policies,
    COUNT(CASE WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 1 END) as policies_with_direct_auth_uid_in_qual,
    COUNT(CASE WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 1 END) as policies_with_direct_auth_uid_in_with_check,
    COUNT(CASE WHEN qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%' THEN 1 END) as policies_with_direct_current_setting_in_qual,
    COUNT(CASE WHEN with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%' THEN 1 END) as policies_with_direct_current_setting_in_with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
        (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
        (qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%') OR
        (with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%')
    );

-- 6. Identifikasi kebijakan yang sudah dioptimasi (untuk verifikasi)
SELECT 
    '=== ALREADY OPTIMIZED POLICIES (SAMPLE) ===' as section,
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual LIKE '%(SELECT auth.uid())%' OR
        with_check LIKE '%(SELECT auth.uid())%' OR
        qual LIKE '%(SELECT current_setting(%' OR
        with_check LIKE '%(SELECT current_setting(%'
    )
LIMIT 10;