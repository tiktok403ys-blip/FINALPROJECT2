-- Create profile_rpc_v5 function for navbar authentication
-- This function returns user profile data with admin role information

CREATE OR REPLACE FUNCTION profile_rpc_v5(user_id_input UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  admin_pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN,
  admin_role TEXT,
  admin_permissions TEXT[],
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return profile data with admin information if exists
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    COALESCE(p.role::TEXT, 'user') as role,
    p.admin_pin,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN p.role IN ('admin', 'super_admin') OR au.role IS NOT NULL THEN true 
      ELSE false 
    END as is_admin,
    COALESCE(au.role, p.role::TEXT, 'user') as admin_role,
    COALESCE(au.permissions, '{}') as admin_permissions,
    COALESCE(au.is_active, true) as is_active
  FROM profiles p
  LEFT JOIN admin_users au ON p.id = au.user_id
  WHERE p.id = user_id_input;
  
  -- If no profile found, return default user data
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      user_id_input as id,
      NULL::TEXT as email,
      NULL::TEXT as full_name,
      NULL::TEXT as avatar_url,
      'user'::TEXT as role,
      NULL::TEXT as admin_pin,
      NOW() as created_at,
      NOW() as updated_at,
      false as is_admin,
      'user'::TEXT as admin_role,
      '{}'::TEXT[] as admin_permissions,
      true as is_active;
  END IF;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION profile_rpc_v5(UUID) TO anon;
GRANT EXECUTE ON FUNCTION profile_rpc_v5(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION profile_rpc_v5(UUID) IS 'Returns user profile data with admin role information for navbar authentication';