-- Migration: Standardize Authentication Flow
-- Purpose: Ensure consistent authentication patterns across all components
-- Date: 2024-12-18 15:00:00

-- ============================================================================
-- STEP 1: VERIFY PROFILE_RPC_V5 FUNCTION EXISTS AND IS OPTIMIZED
-- ============================================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS profile_rpc_v5(uuid);

-- Create optimized profile_rpc_v5 function
CREATE OR REPLACE FUNCTION profile_rpc_v5(user_id_input uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  admin_pin text,
  is_admin boolean,
  permissions text[],
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log function call for debugging
  RAISE LOG 'profile_rpc_v5 called with user_id: %', user_id_input;
  
  -- Return profile data with admin information if available
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role,
    p.admin_pin,
    CASE 
      WHEN a.user_id IS NOT NULL THEN true 
      ELSE false 
    END as is_admin,
    COALESCE(a.permissions, '{}'::text[]) as permissions,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN admin_users a ON p.id = a.user_id AND a.is_active = true
  WHERE p.id = user_id_input;
  
  -- If no profile found, log it
  IF NOT FOUND THEN
    RAISE LOG 'No profile found for user_id: %', user_id_input;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO anon;

-- ============================================================================
-- STEP 2: CREATE STANDARDIZED AUTH HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user profile with admin status
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  admin_pin text,
  is_admin boolean,
  permissions text[],
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get current authenticated user ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Use profile_rpc_v5 for consistency
  RETURN QUERY
  SELECT * FROM profile_rpc_v5(auth.uid());
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;

-- ============================================================================
-- STEP 3: CREATE PROFILE SYNC TRIGGER FOR REAL-TIME CONSISTENCY
-- ============================================================================

-- Function to notify profile changes
CREATE OR REPLACE FUNCTION notify_profile_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify profile changes for real-time updates
  PERFORM pg_notify(
    'profile_changes',
    json_build_object(
      'operation', TG_OP,
      'user_id', COALESCE(NEW.id, OLD.id),
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS profile_change_notify ON profiles;
CREATE TRIGGER profile_change_notify
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_profile_change();

-- Create trigger on admin_users table for admin status changes
DROP TRIGGER IF EXISTS admin_change_notify ON admin_users;
CREATE TRIGGER admin_change_notify
  AFTER INSERT OR UPDATE OR DELETE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION notify_profile_change();

-- ============================================================================
-- STEP 4: OPTIMIZE INDEXES FOR AUTH PERFORMANCE
-- ============================================================================

-- Ensure optimal indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_active ON admin_users(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ============================================================================
-- STEP 5: UPDATE RLS POLICIES FOR CONSISTENT ACCESS
-- ============================================================================

-- Ensure profiles RLS policies are comprehensive
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin users policies
DROP POLICY IF EXISTS "Admin users can view all admin records" ON admin_users;
CREATE POLICY "Admin users can view all admin records" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Super admin can manage admin users" ON admin_users;
CREATE POLICY "Super admin can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- ============================================================================
-- STEP 6: VERIFICATION AND TESTING
-- ============================================================================

-- Test profile_rpc_v5 function
DO $$
DECLARE
  test_result RECORD;
  user_count INTEGER;
BEGIN
  -- Check if we have any users to test with
  SELECT COUNT(*) INTO user_count FROM profiles LIMIT 1;
  
  IF user_count > 0 THEN
    -- Test with first available user
    SELECT * INTO test_result 
    FROM profile_rpc_v5((SELECT id FROM profiles LIMIT 1));
    
    IF test_result IS NOT NULL THEN
      RAISE NOTICE '✅ profile_rpc_v5 function working correctly';
    ELSE
      RAISE NOTICE '⚠️ profile_rpc_v5 function returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ No users available for testing profile_rpc_v5';
  END IF;
END;
$$;

-- Verify indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
    RAISE NOTICE '✅ Profile email index exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_users_user_id_active') THEN
    RAISE NOTICE '✅ Admin users index exists';
  END IF;
END;
$$;

-- ============================================================================
-- STEP 7: ENABLE REALTIME FOR AUTH-RELATED TABLES
-- ============================================================================

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable realtime for admin_users table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '🎉 AUTHENTICATION FLOW STANDARDIZATION COMPLETED';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '   ✅ profile_rpc_v5 function optimized';
  RAISE NOTICE '   ✅ Standardized auth helper functions created';
  RAISE NOTICE '   ✅ Real-time profile sync triggers added';
  RAISE NOTICE '   ✅ Performance indexes optimized';
  RAISE NOTICE '   ✅ RLS policies updated for consistency';
  RAISE NOTICE '   ✅ Realtime enabled for auth tables';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next Steps:';
  RAISE NOTICE '   1. Update navbar.tsx to use AuthProvider';
  RAISE NOTICE '   2. Standardize all components to use profile_rpc_v5';
  RAISE NOTICE '   3. Test authentication flow consistency';
END;
$$;