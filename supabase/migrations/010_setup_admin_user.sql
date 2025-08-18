-- Setup admin user in admin_users table
-- This will create or update an admin user entry
-- Replace 'your-user-id-here' with actual user ID from auth.users

-- First, let's create a function to setup admin user
CREATE OR REPLACE FUNCTION setup_admin_user(admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update admin user
  INSERT INTO admin_users (user_id, role, is_active, created_at, updated_at)
  VALUES (admin_user_id, 'super_admin', true, now(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = 'super_admin',
    is_active = true,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION setup_admin_user(uuid) TO authenticated;

-- Example usage (uncomment and replace with actual user ID):
-- SELECT setup_admin_user('your-actual-user-id-here');

-- Comment for documentation
COMMENT ON FUNCTION setup_admin_user(uuid) IS 'Sets up or updates a user as super_admin in admin_users table';