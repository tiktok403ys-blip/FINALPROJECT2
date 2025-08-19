-- Validation queries to check if all fixes have been applied successfully

-- 1. Check if PIN functions exist
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('set_admin_pin', 'verify_admin_pin', 'admin_has_pin_set')
ORDER BY proname;

-- 2. Check RLS policies for profiles table (should not reference profiles table)
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check public access policies for all tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews')
    AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;

-- 4. Check table permissions for anon and authenticated roles
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews')
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 5. Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews', 'profiles', 'admin_users')
ORDER BY tablename;