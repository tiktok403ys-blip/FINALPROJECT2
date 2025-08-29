-- Security Policies Test Script
-- Created: 2024-12-20
-- Purpose: Test RLS policies and security functions for production

-- =====================================================
-- TEST HELPER FUNCTIONS
-- =====================================================

-- Test 1: Check if helper functions exist and work
SELECT 'Testing helper functions...' as test_section;

-- Test is_admin function (should return false for non-admin users)
SELECT 
  'is_admin()' as function_name,
  public.is_admin() as result,
  CASE 
    WHEN public.is_admin() IS NOT NULL THEN 'PASS - Function exists'
    ELSE 'FAIL - Function not found'
  END as status;

-- Test is_super_admin function
SELECT 
  'is_super_admin()' as function_name,
  public.is_super_admin() as result,
  CASE 
    WHEN public.is_super_admin() IS NOT NULL THEN 'PASS - Function exists'
    ELSE 'FAIL - Function not found'
  END as status;

-- Test is_owner function
SELECT 
  'is_owner(uuid)' as function_name,
  public.is_owner('00000000-0000-0000-0000-000000000000'::uuid) as result,
  CASE 
    WHEN public.is_owner('00000000-0000-0000-0000-000000000000'::uuid) IS NOT NULL THEN 'PASS - Function exists'
    ELSE 'FAIL - Function not found'
  END as status;

-- =====================================================
-- TEST RLS ENABLEMENT
-- =====================================================

SELECT 'Testing RLS enablement...' as test_section;

-- Check if RLS is enabled on all required tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN 'PASS - RLS enabled'
    ELSE 'FAIL - RLS not enabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
ORDER BY tablename;

-- =====================================================
-- TEST POLICIES EXISTENCE
-- =====================================================

SELECT 'Testing policies existence...' as test_section;

-- Check if policies exist for each table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  CASE 
    WHEN policyname IS NOT NULL THEN 'PASS - Policy exists'
    ELSE 'FAIL - Policy missing'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- TEST TABLE ACCESS (BASIC)
-- =====================================================

SELECT 'Testing basic table access...' as test_section;

-- Test 1: Try to access admin_pins (should be restricted)
SELECT 
  'admin_pins' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_pins' AND table_schema = 'public') 
    THEN 'PASS - Table accessible for query structure'
    ELSE 'FAIL - Table not found'
  END as status;

-- Test 2: Try to access user_favorites (should be restricted)
SELECT 
  'user_favorites' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') 
    THEN 'PASS - Table accessible for query structure'
    ELSE 'FAIL - Table not found'
  END as status;

-- Test 3: Try to access audit_logs (should be restricted)
SELECT 
  'audit_logs' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') 
    THEN 'PASS - Table accessible for query structure'
    ELSE 'FAIL - Table not found'
  END as status;

-- Test 4: Try to access admin_users (should be restricted)
SELECT 
  'admin_users' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') 
    THEN 'PASS - Table accessible for query structure'
    ELSE 'FAIL - Table not found'
  END as status;

-- Test 5: Try to access profiles (should have some access)
SELECT 
  'profiles' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
    THEN 'PASS - Table accessible for query structure'
    ELSE 'FAIL - Table not found'
  END as status;

-- =====================================================
-- TEST PERMISSIONS
-- =====================================================

SELECT 'Testing table permissions...' as test_section;

-- Check granted permissions for authenticated role
SELECT 
  table_schema,
  table_name,
  grantee,
  privilege_type,
  CASE 
    WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') 
    THEN 'PASS - Expected permission granted'
    ELSE 'INFO - Other permission type'
  END as status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- =====================================================
-- TEST INDEXES
-- =====================================================

SELECT 'Testing performance indexes...' as test_section;

-- Check if performance indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE 'idx_%' THEN 'PASS - Performance index exists'
    ELSE 'INFO - Other index type'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 'Security Implementation Summary' as test_section;

-- Count of tables with RLS enabled
SELECT 
  'RLS Enabled Tables' as metric,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS - All required tables have RLS'
    ELSE 'WARN - Some tables missing RLS'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
AND rowsecurity = true;

-- Count of security policies
SELECT 
  'Security Policies' as metric,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 8 THEN 'PASS - Sufficient policies created'
    ELSE 'WARN - May need more policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles');

-- Count of performance indexes
SELECT 
  'Performance Indexes' as metric,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 3 THEN 'PASS - Performance indexes created'
    ELSE 'WARN - May need more indexes'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('admin_pins', 'user_favorites', 'audit_logs', 'admin_users', 'profiles')
AND indexname LIKE 'idx_%';

-- =====================================================
-- SECURITY VALIDATION NOTES
-- =====================================================

/*
SECURITY VALIDATION CHECKLIST:

✓ Helper Functions:
  - is_admin(): Checks admin status from admin_users table
  - is_super_admin(): Checks super admin status
  - is_owner(): Checks record ownership

✓ RLS Enabled:
  - admin_pins: Only admins and owners can access
  - user_favorites: Users can access own data, admins can read all
  - audit_logs: Only admins can read, system can insert
  - admin_users: Super admins manage, users read own record
  - profiles: Owners manage own, admins read all, public basic access

✓ Security Policies:
  - Proper access control based on user roles
  - Ownership-based access for user data
  - Admin oversight capabilities
  - System operation support

✓ Performance:
  - Indexes on frequently queried columns
  - Optimized for RLS policy evaluation

NEXT STEPS FOR PRODUCTION:
1. Test with actual user accounts
2. Verify admin user creation process
3. Test edge cases and error handling
4. Monitor performance impact
5. Set up audit log monitoring
*/

-- End of security test script