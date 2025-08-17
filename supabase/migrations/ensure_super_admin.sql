-- Ensure super admin account exists in admin_users table
-- This script will add casinogurusg404@gmail.com as super_admin if not already exists

-- First, let's check if the user exists in auth.users and get their ID
DO $$
DECLARE
    admin_user_id UUID;
    admin_exists BOOLEAN := FALSE;
BEGIN
    -- Get the user ID from auth.users for casinogurusg404@gmail.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com';
    
    -- Check if user exists in auth.users
    IF admin_user_id IS NOT NULL THEN
        -- Check if user already exists in admin_users table
        SELECT EXISTS(
            SELECT 1 FROM admin_users 
            WHERE user_id = admin_user_id
        ) INTO admin_exists;
        
        -- If user doesn't exist in admin_users, insert them
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
            
            RAISE NOTICE 'Super admin account created for casinogurusg404@gmail.com';
        ELSE
            -- Update existing record to ensure it's super_admin
            UPDATE admin_users 
            SET 
                role = 'super_admin',
                permissions = ARRAY['all'],
                is_active = true,
                updated_at = NOW()
            WHERE user_id = admin_user_id;
            
            RAISE NOTICE 'Super admin account updated for casinogurusg404@gmail.com';
        END IF;
    ELSE
        RAISE NOTICE 'User casinogurusg404@gmail.com not found in auth.users. Please ensure the user has logged in at least once.';
    END IF;
END $$;

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON admin_users TO anon;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

-- Verify the result
SELECT 
    au.id,
    au.role,
    au.permissions,
    au.is_active,
    u.email,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'casinogurusg404@gmail.com';