-- Script untuk validasi status RLS policies dan fungsi di database produksi
-- Jalankan script ini di Supabase SQL Editor untuk memeriksa status database

-- 1) Cek fungsi yang dipakai pin-status
SELECT 
    proname as function_name, 
    n.nspname as schema_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE proname IN ('admin_has_pin_set','verify_admin_pin')
ORDER BY proname;

-- 2) Cek policy publik untuk partners/casinos/player_reviews/news/bonuses
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('partners','casinos','player_reviews','news','bonuses')
ORDER BY tablename, policyname;

-- 3) Cek policy admin_users/profiles anti-recursion
SELECT 
    tablename, 
    policyname,
    roles,
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('admin_users','profiles')
ORDER BY tablename, policyname;

-- 4) Cek grants untuk fungsi RPC
SELECT 
    p.proname as function_name,
    r.rolname as granted_to,
    'EXECUTE' as privilege_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_depend d ON d.objid = p.oid
JOIN pg_authid r ON r.oid = d.refobjid
WHERE p.proname IN ('admin_has_pin_set','verify_admin_pin')
    AND d.deptype = 'a'
ORDER BY p.proname, r.rolname;

-- 5) Cek struktur tabel untuk kolom yang diperlukan
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('partners','casinos','player_reviews','news','bonuses')
    AND column_name IN ('is_active','display_order','published','is_approved')
ORDER BY table_name, column_name;

-- 6) Test sederhana untuk memeriksa akses anon ke tabel publik
-- (Jalankan sebagai anon role jika memungkinkan)
SELECT 'Testing anon access to partners' as test_description;
SELECT COUNT(*) as partners_count FROM partners WHERE is_active = true LIMIT 1;

SELECT 'Testing anon access to casinos' as test_description;
SELECT COUNT(*) as casinos_count FROM casinos WHERE is_active = true LIMIT 1;

SELECT 'Testing anon access to player_reviews' as test_description;
SELECT COUNT(*) as reviews_count FROM player_reviews WHERE is_approved = true LIMIT 1;

SELECT 'Testing anon access to news' as test_description;
SELECT COUNT(*) as news_count FROM news WHERE published = true LIMIT 1;

-- 7) Cek RLS status untuk semua tabel
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('partners','casinos','player_reviews','news','bonuses','admin_users','profiles')
ORDER BY tablename;

-- 8) Summary check untuk debugging
SELECT 
    'Database Validation Summary' as summary,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename IN ('partners','casinos','player_reviews','news','bonuses')
            AND roles @> '{anon}'
    ) as public_policies_count,
    (
        SELECT COUNT(*) 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE proname IN ('admin_has_pin_set','verify_admin_pin')
    ) as admin_functions_count,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename IN ('admin_users','profiles')
    ) as admin_policies_count;