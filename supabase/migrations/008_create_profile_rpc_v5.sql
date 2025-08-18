-- Drop existing profile_rpc_v5 function if exists
DROP FUNCTION IF EXISTS profile_rpc_v5(uuid);

-- Create profile_rpc_v5 function
-- This function returns user profile data with admin role information
-- Used by navbar-fixed.tsx for user authentication and role checking

CREATE OR REPLACE FUNCTION profile_rpc_v5(user_id_input uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  role text,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return user profile with admin role information
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    COALESCE(a.role, 'user') as role,
    CASE WHEN a.id IS NOT NULL THEN true ELSE false END as is_admin
  FROM profiles p
  LEFT JOIN admin_users a ON p.id = a.user_id AND a.is_active = true
  WHERE p.id = user_id_input;
  
  -- If no profile found, return default user role
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      user_id_input as id,
      ''::text as email,
      ''::text as full_name,
      ''::text as avatar_url,
      now() as created_at,
      now() as updated_at,
      'user'::text as role,
      false as is_admin;
  END IF;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO anon;
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION profile_rpc_v5(uuid) IS 'Returns user profile data with admin role information for navbar authentication';