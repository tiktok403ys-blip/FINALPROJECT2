-- =====================================================
-- COMPREHENSIVE PRODUCTION DATABASE FIX SCRIPT
-- =====================================================
-- This script fixes all identified production issues:
-- 1. Creates PIN management functions with proper security
-- 2. Fixes RLS policies to prevent infinite recursion
-- 3. Creates public access policies for all necessary tables
-- 4. Grants proper permissions to anon and authenticated roles
-- =====================================================

-- =====================================================
-- 1. CREATE PIN MANAGEMENT FUNCTIONS
-- =====================================================

-- Drop existing functions first to avoid parameter conflicts
DROP FUNCTION IF EXISTS set_admin_pin(text);
DROP FUNCTION IF EXISTS verify_admin_pin(text);
DROP FUNCTION IF EXISTS admin_has_pin_set();

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(pin_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only authenticated users can set PIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Update or insert PIN for the current user
  INSERT INTO admin_users (id, pin_hash, created_at, updated_at)
  VALUES (auth.uid(), pin_hash, now(), now())
  ON CONFLICT (id) 
  DO UPDATE SET 
    pin_hash = EXCLUDED.pin_hash,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(pin_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Only authenticated users can verify PIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get stored PIN hash for current user
  SELECT au.pin_hash INTO stored_hash
  FROM admin_users au
  WHERE au.id = auth.uid();
  
  -- Return true if PIN matches
  RETURN (stored_hash IS NOT NULL AND stored_hash = pin_hash);
END;
$$;

-- Function to check if admin has PIN set
CREATE OR REPLACE FUNCTION admin_has_pin_set()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pin_exists boolean := false;
BEGIN
  -- Only authenticated users can check PIN status
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if current user has a PIN set
  SELECT (pin_hash IS NOT NULL) INTO pin_exists
  FROM admin_users
  WHERE id = auth.uid();
  
  RETURN COALESCE(pin_exists, false);
END;
$$;

-- Grant execute permissions to authenticated role
GRANT EXECUTE ON FUNCTION set_admin_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_has_pin_set() TO authenticated;

-- =====================================================
-- 2. FIX RLS POLICIES - PREVENT INFINITE RECURSION
-- =====================================================

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Create new anti-recursion policies for profiles table
-- These policies reference admin_users table instead of profiles to avoid recursion
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    -- Allow access if user is in admin_users table
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()
    )
    OR 
    -- Allow users to see their own profile
    id = auth.uid()
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Allow authenticated users to insert their own profile
    auth.uid() IS NOT NULL AND id = auth.uid()
  );

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    -- Allow users to update their own profile
    id = auth.uid()
    OR
    -- Allow admin users to update any profile
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()
    )
  );

-- =====================================================
-- 3. CREATE PUBLIC ACCESS POLICIES FOR ALL TABLES
-- =====================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON partners;
DROP POLICY IF EXISTS "Public read access for active partners" ON partners;
DROP POLICY IF EXISTS "Enable read access for all users" ON casinos;
DROP POLICY IF EXISTS "Public read access for active casinos" ON casinos;
DROP POLICY IF EXISTS "Enable read access for all users" ON bonuses;
DROP POLICY IF EXISTS "Public read access for active bonuses" ON bonuses;
DROP POLICY IF EXISTS "Enable read access for all users" ON news;
DROP POLICY IF EXISTS "Public read access for published news" ON news;
DROP POLICY IF EXISTS "Enable read access for all users" ON casino_reviews;
DROP POLICY IF EXISTS "Public read access for published casino reviews" ON casino_reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON player_reviews;
DROP POLICY IF EXISTS "Public read access for approved player reviews" ON player_reviews;

-- Create public access policies for partners table
CREATE POLICY "public_partners_select" ON partners
  FOR SELECT
  USING (is_active = true);

-- Create public access policies for casinos table
CREATE POLICY "public_casinos_select" ON casinos
  FOR SELECT
  USING (is_active = true);

-- Create public access policies for bonuses table
CREATE POLICY "public_bonuses_select" ON bonuses
  FOR SELECT
  USING (is_active = true);

-- Create public access policies for news table
CREATE POLICY "public_news_select" ON news
  FOR SELECT
  USING (is_published = true OR published = true);

-- Create public access policies for casino_reviews table
CREATE POLICY "public_casino_reviews_select" ON casino_reviews
  FOR SELECT
  USING (is_published = true);

-- Create public access policies for player_reviews table
CREATE POLICY "public_player_reviews_select" ON player_reviews
  FOR SELECT
  USING (is_approved = true);

-- =====================================================
-- 4. GRANT PERMISSIONS TO ANON AND AUTHENTICATED ROLES
-- =====================================================

-- Grant SELECT permissions to anon role for public data
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

-- =====================================================
-- 5. VALIDATION QUERIES
-- =====================================================
-- Run these queries after execution to verify the fixes:

-- Check PIN functions exist and have correct permissions
-- SELECT routine_name, routine_type, security_type 
-- FROM information_schema.routines 
-- WHERE routine_name IN ('set_admin_pin', 'verify_admin_pin', 'admin_has_pin_set');

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews', 'profiles')
-- ORDER BY tablename, policyname;

-- Check table permissions
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' 
-- AND grantee IN ('anon', 'authenticated') 
-- AND table_name IN ('partners', 'casinos', 'bonuses', 'news', 'casino_reviews', 'player_reviews')
-- ORDER BY table_name, grantee;

-- =====================================================
-- SCRIPT EXECUTION COMPLETE
-- =====================================================
-- All production issues should now be resolved:
-- ✓ PIN functions created with proper security
-- ✓ RLS policies fixed to prevent infinite recursion
-- ✓ Public access policies created for all tables
-- ✓ Proper permissions granted to anon and authenticated roles
-- =====================================================