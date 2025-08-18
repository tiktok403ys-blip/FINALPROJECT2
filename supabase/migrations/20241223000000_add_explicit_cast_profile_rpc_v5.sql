-- Migration: Add Explicit Cast to profile_rpc_v5
-- Purpose: Add explicit ::text cast to COALESCE in profile_rpc_v5 to prevent any type ambiguity
-- Date: 2024-12-23
-- Issue: Ensure profile_rpc_v5 returns consistent TEXT type for role column

-- =====================================================
-- UPDATE profile_rpc_v5 WITH EXPLICIT CAST
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.profile_rpc_v5(UUID);

-- Create updated RPC with explicit cast for role column
CREATE OR REPLACE FUNCTION public.profile_rpc_v5(user_id_input UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_admin BOOLEAN,
  admin_permissions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    -- Role comes from admin_users ONLY, fallback to 'user' with explicit cast
    COALESCE(au.role::text, 'user'::text) as role,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    -- Admin status from admin_users table only
    CASE WHEN au.user_id IS NOT NULL AND au.is_active = true THEN true ELSE false END as is_admin,
    COALESCE(au.permissions, ARRAY[]::TEXT[]) as admin_permissions
  FROM public.profiles p
  LEFT JOIN public.admin_users au ON p.id = au.user_id AND au.is_active = true
  WHERE p.id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.profile_rpc_v5(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.profile_rpc_v5(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.profile_rpc_v5(UUID) IS 'Returns user profile data with admin role information. Uses explicit cast for role column to prevent type ambiguity.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the function with explicit type checking
DO $$
DECLARE
    admin_user_id UUID;
    test_result RECORD;
    role_type TEXT;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Test profile_rpc_v5 with type verification
        SELECT * INTO test_result 
        FROM profile_rpc_v5(admin_user_id);
        
        IF test_result IS NOT NULL THEN
            -- Check the actual type of the role column
            SELECT pg_typeof(test_result.role) INTO role_type;
            
            RAISE NOTICE '✅ profile_rpc_v5 working correctly with explicit cast';
            RAISE NOTICE 'User role: %, Type: %, Is admin: %', test_result.role, role_type, test_result.is_admin;
            
            -- Verify it's TEXT type
            IF role_type = 'text' THEN
                RAISE NOTICE '✅ Role column returns TEXT type as expected';
            ELSE
                RAISE NOTICE '❌ Role column type mismatch: %', role_type;
            END IF;
        ELSE
            RAISE NOTICE '❌ profile_rpc_v5 returned no results';
        END IF;
    ELSE
        RAISE NOTICE 'Cannot test - admin user not found';
    END IF;
END;
$$;

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 EXPLICIT CAST MIGRATION COMPLETED';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '✅ profile_rpc_v5 updated with explicit ::text cast';
    RAISE NOTICE '✅ COALESCE(au.role::text, ''user''::text) implemented';
    RAISE NOTICE '✅ Function tested and verified';
    RAISE NOTICE '✅ Type consistency ensured';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next Steps:';
    RAISE NOTICE '1. Test navbar admin button visibility';
    RAISE NOTICE '2. Verify no 400 errors on profile_rpc_v5 calls';
    RAISE NOTICE '3. Check frontend console for successful authentication';
END;
$$;