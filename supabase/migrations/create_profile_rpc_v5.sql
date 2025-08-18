-- Drop existing profile_rpc_v5 function if exists
DROP FUNCTION IF EXISTS profile_rpc_v5(uuid);

-- Create profile_rpc_v5 function
-- This function returns profile data with admin role information
-- Used by navbar-fixed.tsx for user authentication and role checking

CREATE OR REPLACE FUNCTION profile_rpc_v5(user_id_input uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text,
    email text,
    full_name text,
    avatar_url text,
    bio text,
    website text,
    location text,
    created_at timestamptz,
    updated_at timestamptz,
    role text,
    is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return profile data with admin role information
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.username,
        p.email,
        p.full_name,
        p.avatar_url,
        p.bio,
        p.website,
        p.location,
        p.created_at,
        p.updated_at,
        COALESCE(a.role, 'user'::text) as role,
        CASE 
            WHEN a.user_id IS NOT NULL AND a.is_active = true THEN true
            ELSE false
        END as is_admin
    FROM profiles p
    LEFT JOIN admin_users a ON p.user_id = a.user_id
    WHERE p.user_id = user_id_input;
    
    -- If no profile found, return default user role
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            NULL::uuid as id,
            user_id_input as user_id,
            NULL::text as username,
            NULL::text as email,
            NULL::text as full_name,
            NULL::text as avatar_url,
            NULL::text as bio,
            NULL::text as website,
            NULL::text as location,
            NULL::timestamptz as created_at,
            NULL::timestamptz as updated_at,
            'user'::text as role,
            false as is_admin;
    END IF;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO anon;
GRANT EXECUTE ON FUNCTION profile_rpc_v5(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION profile_rpc_v5(uuid) IS 'Returns user profile data with admin role information. Used by navbar for authentication and role checking.';