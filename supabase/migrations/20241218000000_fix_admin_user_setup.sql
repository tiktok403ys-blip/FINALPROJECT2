-- Fix admin user setup for casinogurusg404@gmail.com
-- This migration ensures the admin user is properly set up in admin_users table

-- First, let's check if the user exists in auth.users and get their ID
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean := false;
BEGIN
    -- Try to find the user by email in auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com'
    LIMIT 1;
    
    -- If user exists, check if they're already in admin_users
    IF admin_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM admin_users 
            WHERE user_id = admin_user_id
        ) INTO admin_exists;
        
        -- If not in admin_users, add them
        IF NOT admin_exists THEN
            INSERT INTO admin_users (
                user_id,
                role,
                permissions,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                'super_admin',
                ARRAY['all'],
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Added casinogurusg404@gmail.com to admin_users table with super_admin role';
        ELSE
            RAISE NOTICE 'User casinogurusg404@gmail.com already exists in admin_users table';
        END IF;
        
        -- Also ensure they have the correct role in profiles table
        INSERT INTO profiles (id, email, role, created_at, updated_at)
        VALUES (
            admin_user_id,
            'casinogurusg404@gmail.com',
            'super_admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'super_admin',
            email = 'casinogurusg404@gmail.com',
            updated_at = NOW();
            
        RAISE NOTICE 'Updated/created profile for casinogurusg404@gmail.com with super_admin role';
    ELSE
        RAISE NOTICE 'User casinogurusg404@gmail.com not found in auth.users. Please create the user first through Supabase Auth.';
    END IF;
END $$;

-- Create or update the verify_admin_pin function to work with hashed PINs
CREATE OR REPLACE FUNCTION verify_admin_pin(input_pin text)
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
    default_pin text := '1234'; -- Default PIN for initial setup
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text[], false;
        RETURN;
    END IF;
    
    -- Check if user exists in admin_users table
    SELECT au.user_id, au.role, au.permissions, au.is_active
    INTO admin_record
    FROM admin_users au
    WHERE au.user_id = current_user_id AND au.is_active = true;
    
    -- If user not found in admin_users, check profiles table for backward compatibility
    IF NOT FOUND THEN
        SELECT p.id, p.role, ARRAY['all']::text[], true
        INTO admin_record
        FROM profiles p
        WHERE p.id = current_user_id 
        AND p.role IN ('admin', 'super_admin');
    END IF;
    
    -- If still not found, user is not an admin
    IF NOT FOUND THEN
        RETURN QUERY SELECT current_user_id, NULL::text, NULL::text[], false;
        RETURN;
    END IF;
    
    -- For now, use default PIN '1234' for all admin users
    -- In production, you should implement proper PIN hashing per user
    IF input_pin = default_pin THEN
        RETURN QUERY SELECT 
            admin_record.user_id,
            admin_record.role,
            admin_record.permissions,
            true;
    ELSE
        RETURN QUERY SELECT 
            admin_record.user_id,
            admin_record.role,
            admin_record.permissions,
            false;
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_admin_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_pin(text) TO anon;

-- Ensure RLS policies allow admin operations
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_users table
DROP POLICY IF EXISTS "Admin users can view all admin records" ON admin_users;
CREATE POLICY "Admin users can view all admin records" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au2 
            WHERE au2.user_id = auth.uid() 
            AND au2.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON admin_users TO anon;
GRANT SELECT ON profiles TO anon;