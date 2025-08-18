-- Unified PIN System Migration
-- This migration implements a secure, per-admin PIN system with proper hashing

-- First, add admin_pin column to admin_users table if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT;

-- Create function to hash PIN using crypt extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to set admin PIN with proper hashing
CREATE OR REPLACE FUNCTION set_admin_pin(new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    admin_exists boolean := false;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is admin
    SELECT EXISTS(
        SELECT 1 FROM admin_users 
        WHERE user_id = current_user_id 
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Check profiles table for backward compatibility
        SELECT EXISTS(
            SELECT 1 FROM profiles 
            WHERE id = current_user_id 
            AND role IN ('admin', 'super_admin')
        ) INTO admin_exists;
    END IF;
    
    IF NOT admin_exists THEN
        RETURN false;
    END IF;
    
    -- Hash the PIN and update admin_users table
    UPDATE admin_users 
    SET admin_pin_hash = crypt(new_pin, gen_salt('bf', 8)),
        updated_at = NOW()
    WHERE user_id = current_user_id;
    
    -- If not found in admin_users, update profiles table for backward compatibility
    IF NOT FOUND THEN
        UPDATE profiles 
        SET admin_pin = crypt(new_pin, gen_salt('bf', 8)),
            updated_at = NOW()
        WHERE id = current_user_id 
        AND role IN ('admin', 'super_admin');
    END IF;
    
    RETURN FOUND;
END;
$$;

-- Function to verify admin PIN with proper security
CREATE OR REPLACE FUNCTION verify_admin_pin(input_pin TEXT)
RETURNS TABLE(
    user_id uuid,
    role text,
    permissions text[],
    is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    admin_record record;
    stored_pin_hash TEXT;
    is_pin_valid boolean := false;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text[], false;
        RETURN;
    END IF;
    
    -- Check admin_users table first
    SELECT au.user_id, au.role, au.permissions, au.is_active, au.admin_pin_hash
    INTO admin_record
    FROM admin_users au
    WHERE au.user_id = current_user_id AND au.is_active = true;
    
    IF FOUND THEN
        stored_pin_hash := admin_record.admin_pin_hash;
        
        -- If no PIN hash is set, use default PIN '1234' for initial setup
        IF stored_pin_hash IS NULL THEN
            is_pin_valid := (input_pin = '1234');
        ELSE
            -- Verify hashed PIN
            is_pin_valid := (stored_pin_hash = crypt(input_pin, stored_pin_hash));
        END IF;
        
        RETURN QUERY SELECT 
            admin_record.user_id,
            admin_record.role,
            admin_record.permissions,
            is_pin_valid;
        RETURN;
    END IF;
    
    -- Fallback to profiles table for backward compatibility
    SELECT p.id, p.role, ARRAY['all']::text[], true, p.admin_pin
    INTO admin_record
    FROM profiles p
    WHERE p.id = current_user_id 
    AND p.role IN ('admin', 'super_admin');
    
    IF FOUND THEN
        stored_pin_hash := admin_record.admin_pin_hash;
        
        -- If no PIN hash is set, use default PIN '1234' for initial setup
        IF stored_pin_hash IS NULL THEN
            is_pin_valid := (input_pin = '1234');
        ELSE
            -- Verify hashed PIN
            is_pin_valid := (stored_pin_hash = crypt(input_pin, stored_pin_hash));
        END IF;
        
        RETURN QUERY SELECT 
            admin_record.user_id,
            admin_record.role,
            admin_record.permissions,
            is_pin_valid;
        RETURN;
    END IF;
    
    -- User is not an admin
    RETURN QUERY SELECT current_user_id, NULL::text, NULL::text[], false;
END;
$$;

-- Function to check if admin has PIN set
CREATE OR REPLACE FUNCTION admin_has_pin_set()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    pin_hash TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check admin_users table
    SELECT admin_pin_hash INTO pin_hash
    FROM admin_users
    WHERE user_id = current_user_id AND is_active = true;
    
    IF FOUND AND pin_hash IS NOT NULL THEN
        RETURN true;
    END IF;
    
    -- Check profiles table for backward compatibility
    SELECT admin_pin INTO pin_hash
    FROM profiles
    WHERE id = current_user_id AND role IN ('admin', 'super_admin');
    
    RETURN (FOUND AND pin_hash IS NOT NULL);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION set_admin_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_has_pin_set() TO authenticated;

-- Remove old PIN verification functions if they exist
DROP FUNCTION IF EXISTS verify_admin_pin(TEXT, TEXT);
DROP FUNCTION IF EXISTS set_admin_pin(TEXT, TEXT);

-- Set default PIN hash for existing super admin
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Find the super admin user
    SELECT user_id INTO admin_user_id
    FROM admin_users
    WHERE role = 'super_admin' AND is_active = true
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Set default PIN '1234' hash for initial setup
        UPDATE admin_users 
        SET admin_pin_hash = crypt('1234', gen_salt('bf', 8))
        WHERE user_id = admin_user_id AND admin_pin_hash IS NULL;
        
        RAISE NOTICE 'Set default PIN for super admin user';
    END IF;
END $$;

-- Security notes:
-- 1. PINs are now properly hashed using bcrypt
-- 2. Default PIN '1234' is set for initial setup only
-- 3. Admins should change their PIN after first login
-- 4. Functions use SECURITY DEFINER for elevated privileges
-- 5. All functions validate admin role before operations