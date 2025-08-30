-- Query untuk memeriksa kebijakan RLS yang menggunakan current_setting atau service role
-- Mencari kebijakan yang mungkin masih bermasalah dengan evaluasi per-row

-- 1. Cek semua kebijakan RLS yang menggunakan current_setting
SELECT 
    schemaname,
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND qual LIKE '%current_setting%'
UNION ALL
SELECT 
    schemaname,
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND with_check LIKE '%current_setting%'
ORDER BY tablename, policyname;

-- 2. Cek kebijakan yang menggunakan service_role atau jwt.claims
SELECT 
    schemaname,
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND (qual LIKE '%service_role%' OR qual LIKE '%jwt.claims%')
UNION ALL
SELECT 
    schemaname,
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND (with_check LIKE '%service_role%' OR with_check LIKE '%jwt.claims%')
ORDER BY tablename, policyname;

-- 3. Cek semua kebijakan di tabel user_login_history secara detail
SELECT 
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
    AND tablename = 'user_login_history'
ORDER BY policyname;

-- 4. Cek apakah ada kebijakan yang masih menggunakan auth.uid() tanpa SELECT wrapper
SELECT 
    'PROBLEMATIC POLICIES' as issue_type,
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(SELECT auth.uid())%'
UNION ALL
SELECT 
    'PROBLEMATIC POLICIES' as issue_type,
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND with_check LIKE '%auth.uid()%'
    AND with_check NOT LIKE '%(SELECT auth.uid())%'
ORDER BY tablename, policyname;