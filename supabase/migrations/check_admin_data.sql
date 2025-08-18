-- Check if admin data exists for casinogurusg404@gmail.com
-- This query will help verify if the admin user exists in production

-- First, check if the user exists in auth.users
SELECT 
    'User in auth.users:' as check_type,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'casinogurusg404@gmail.com';

-- Check if admin entry exists in admin_users
SELECT 
    'Admin entry in admin_users:' as check_type,
    au.id,
    au.user_id,
    au.role,
    au.is_active,
    au.created_at,
    u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'casinogurusg404@gmail.com';

-- Check profile data
SELECT 
    'Profile data:' as check_type,
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
WHERE p.email = 'casinogurusg404@gmail.com';

-- Test profile_rpc_v5 for this user (if exists)
SELECT 
    'profile_rpc_v5 result:' as check_type,
    *
FROM profile_rpc_v5((SELECT id FROM auth.users WHERE email = 'casinogurusg404@gmail.com'));

-- If no admin entry exists, create one
DO $$
DECLARE
    target_user_id UUID;
    admin_exists BOOLEAN;
BEGIN
    -- Get user_id for casinogurusg404@gmail.com
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Check if admin entry already exists
        SELECT EXISTS(
            SELECT 1 FROM admin_users 
            WHERE user_id = target_user_id
        ) INTO admin_exists;
        
        IF NOT admin_exists THEN
            -- Create admin entry
            INSERT INTO admin_users (user_id, role, is_active, created_at, updated_at)
            VALUES (target_user_id, 'super_admin', true, NOW(), NOW());
            
            RAISE NOTICE '✅ Created admin entry for casinogurusg404@gmail.com with super_admin role';
        ELSE
            RAISE NOTICE '✅ Admin entry already exists for casinogurusg404@gmail.com';
        END IF;
    ELSE
        RAISE NOTICE '❌ User casinogurusg404@gmail.com not found in auth.users';
    END IF;
END $$;

-- Final verification
SELECT 
    'Final verification:' as check_type,
    u.email,
    au.role,
    au.is_active,
    p.role as profile_role
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'casinogurusg404@gmail.com';