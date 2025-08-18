-- Script untuk memvalidasi status RLS policies di database production
-- Jalankan query ini di Supabase SQL Editor untuk memeriksa kebijakan yang ada

-- 1. Cek semua kebijakan RLS yang ada
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
ORDER BY tablename, policyname;

-- 2. Cek status RLS untuk setiap tabel
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'admin_users', 'news', 'partners', 'casinos', 'bonuses', 'player_reviews', 'casino_reviews', 'forum_posts', 'forum_comments', 'bonus_votes')
ORDER BY tablename;

-- 3. Cek fungsi RPC yang diperlukan
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('admin_has_pin_set', 'verify_admin_pin')
ORDER BY routine_name;

-- 4. Cek grants untuk role anon dan authenticated
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
AND table_name IN ('profiles', 'admin_users', 'news', 'partners', 'casinos', 'bonuses', 'player_reviews')
ORDER BY table_name, grantee;

-- 5. Cek kebijakan publik yang diperlukan (harus ada untuk akses anon)
-- Kebijakan ini harus ada untuk menghindari error 500:
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('partners', 'casinos', 'bonuses', 'news', 'player_reviews')
AND 'anon' = ANY(roles)
ORDER BY tablename;

-- 6. Cek kebijakan admin yang diperlukan
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'admin_users')
AND policyname LIKE '%admin%'
ORDER BY tablename;

-- 7. Test query untuk memastikan tidak ada infinite recursion
-- Query ini harus berhasil tanpa error:
-- SELECT COUNT(*) FROM public.profiles WHERE role = 'admin';
-- SELECT COUNT(*) FROM public.admin_users WHERE is_active = true;

-- 8. Cek apakah ada kebijakan yang berpotensi menyebabkan recursion
SELECT 
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%profiles%'
AND tablename = 'profiles'
ORDER BY policyname;

-- EXPECTED RESULTS:
-- Harus ada kebijakan SELECT untuk anon role pada: partners, casinos, bonuses, news, player_reviews
-- Harus ada kebijakan admin untuk profiles dan admin_users yang menggunakan admin_users table untuk check
-- Tidak boleh ada kebijakan profiles yang merujuk ke profiles table sendiri (infinite recursion)
-- Fungsi admin_has_pin_set dan verify_admin_pin harus ada