-- =====================================================
-- COMPREHENSIVE DATABASE FIX FOR PRODUCTION ISSUES
-- This script fixes all critical issues causing 500 errors
-- =====================================================

-- 1. CREATE PIN MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    admin_record RECORD;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- Check if user exists and is admin
    SELECT * INTO admin_record 
    FROM admin_users 
    WHERE id = user_id AND role = 'super_admin';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert PIN
    INSERT INTO admin_users (id, email, role, pin_hash, created_at, updated_at)
    VALUES (
        user_id,
        admin_record.email,
        admin_record.role,
        crypt(new_pin, gen_salt('bf')),
        COALESCE(admin_record.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        pin_hash = crypt(new_pin, gen_salt('bf')),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    stored_hash TEXT;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- Get stored PIN hash
    SELECT pin_hash INTO stored_hash
    FROM admin_users
    WHERE id = user_id AND role = 'super_admin';
    
    IF NOT FOUND OR stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verify PIN
    RETURN crypt(input_pin, stored_hash) = stored_hash;
END;
$$;

-- Function to check if admin has PIN set
CREATE OR REPLACE FUNCTION admin_has_pin_set()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    pin_exists BOOLEAN;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- Check if PIN exists
    SELECT (pin_hash IS NOT NULL) INTO pin_exists
    FROM admin_users
    WHERE id = user_id AND role = 'super_admin';
    
    RETURN COALESCE(pin_exists, FALSE);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION set_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_has_pin_set() TO authenticated;

-- 2. FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- =====================================================

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Create new non-recursive policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (
        -- Allow users to see their own profile
        auth.uid() = id
        OR
        -- Allow admins to see all profiles (check admin_users table directly)
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- 3. CREATE PUBLIC ACCESS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

-- Partners table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON partners;
CREATE POLICY "partners_public_read" ON partners
    FOR SELECT USING (
        is_active = true
    );

CREATE POLICY "partners_admin_all" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- Casinos table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON casinos;
CREATE POLICY "casinos_public_read" ON casinos
    FOR SELECT USING (
        status = 'active'
    );

CREATE POLICY "casinos_admin_all" ON casinos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- Bonuses table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON bonuses;
CREATE POLICY "bonuses_public_read" ON bonuses
    FOR SELECT USING (
        status = 'active' AND 
        (expires_at IS NULL OR expires_at > NOW())
    );

CREATE POLICY "bonuses_admin_all" ON bonuses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- News table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON news;
CREATE POLICY "news_public_read" ON news
    FOR SELECT USING (
        published = true
    );

CREATE POLICY "news_admin_all" ON news
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- Casino reviews table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON casino_reviews;
CREATE POLICY "casino_reviews_public_read" ON casino_reviews
    FOR SELECT USING (
        status = 'approved'
    );

CREATE POLICY "casino_reviews_admin_all" ON casino_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- Player reviews table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON player_reviews;
CREATE POLICY "player_reviews_public_read" ON player_reviews
    FOR SELECT USING (
        status = 'approved'
    );

CREATE POLICY "player_reviews_admin_all" ON player_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- 4. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant basic permissions to anon role for public access
GRANT SELECT ON partners TO anon;
GRANT SELECT ON casinos TO anon;
GRANT SELECT ON bonuses TO anon;
GRANT SELECT ON news TO anon;
GRANT SELECT ON casino_reviews TO anon;
GRANT SELECT ON player_reviews TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON partners TO authenticated;
GRANT ALL PRIVILEGES ON casinos TO authenticated;
GRANT ALL PRIVILEGES ON bonuses TO authenticated;
GRANT ALL PRIVILEGES ON news TO authenticated;
GRANT ALL PRIVILEGES ON casino_reviews TO authenticated;
GRANT ALL PRIVILEGES ON player_reviews TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

-- 5. CREATE VALIDATION QUERIES
-- =====================================================

-- Check if all functions exist
SELECT 
    'Functions Status' as check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN 'All PIN functions exist'
        ELSE 'Missing PIN functions: ' || (3 - COUNT(*))
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('set_admin_pin', 'verify_admin_pin', 'admin_has_pin_set')
AND routine_schema = 'public';

-- Check RLS policies
SELECT 
    'RLS Policies Status' as check_type,
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews', 'profiles')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Check table permissions
SELECT 
    'Table Permissions Status' as check_type,
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews')
ORDER BY table_name, grantee;

-- =====================================================
-- SCRIPT EXECUTION COMPLETE
-- All critical database issues should now be resolved
-- =====================================================