-- Restore PIN verification to database model for better security
-- This migration adds back the RPC functions for per-admin PIN management

-- Function to verify admin PIN with proper security
CREATE OR REPLACE FUNCTION verify_admin_pin(user_email TEXT, input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_pin TEXT;
    user_role TEXT;
BEGIN
    -- Get user's PIN and role
    SELECT p.admin_pin, p.role INTO stored_pin, user_role
    FROM profiles p
    WHERE p.email = user_email;
    
    -- Check if user is admin and PIN matches
    -- Note: In production, consider using crypt() for hashed PINs
    IF user_role IN ('admin', 'super_admin') AND stored_pin = input_pin THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(user_email TEXT, new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update PIN for admin users only
    -- Note: In production, consider using crypt() to hash the PIN
    UPDATE profiles 
    SET admin_pin = new_pin, updated_at = NOW()
    WHERE email = user_email AND role IN ('admin', 'super_admin');
    
    RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_admin_pin(TEXT, TEXT) TO authenticated;

-- Security note: These functions use SECURITY DEFINER to run with elevated privileges
-- The functions validate user roles before performing operations
-- Consider implementing PIN hashing using crypt() extension for production use