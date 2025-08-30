-- Query untuk memeriksa kebijakan RLS yang aktif saat ini
-- Menampilkan definisi kebijakan RLS untuk tabel yang bermasalah

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
    AND tablename IN ('user_login_history', 'admin_pins', 'user_favorites', 'profiles', 'reports')
ORDER BY tablename, policyname;

-- Query tambahan untuk melihat apakah masih ada auth.uid() yang tidak dibungkus SELECT
SELECT 
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_login_history', 'admin_pins', 'user_favorites', 'profiles', 'reports')
    AND qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(SELECT auth.uid())%'
UNION ALL
SELECT 
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_login_history', 'admin_pins', 'user_favorites', 'profiles', 'reports')
    AND with_check LIKE '%auth.uid()%'
    AND with_check NOT LIKE '%(SELECT auth.uid())%'
ORDER BY tablename, policyname;

-- Query untuk memeriksa apakah ada current_setting() yang tidak dibungkus SELECT
SELECT 
    tablename,
    policyname,
    'USING clause' as clause_type,
    qual as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_login_history', 'admin_pins', 'user_favorites', 'profiles', 'reports')
    AND qual LIKE '%current_setting%'
    AND qual NOT LIKE '%(SELECT current_setting%'
UNION ALL
SELECT 
    tablename,
    policyname,
    'WITH CHECK clause' as clause_type,
    with_check as definition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_login_history', 'admin_pins', 'user_favorites', 'profiles', 'reports')
    AND with_check LIKE '%current_setting%'
    AND with_check NOT LIKE '%(SELECT current_setting%'
ORDER BY tablename, policyname;