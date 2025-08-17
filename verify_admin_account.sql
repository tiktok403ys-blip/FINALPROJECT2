-- Verify super admin account in admin_users table
-- This query will show the admin account details

SELECT 
    au.id as admin_id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    au.created_at,
    au.last_login,
    u.email,
    u.created_at as user_created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'casinogurusg404@gmail.com';

-- Also check if there are any other admin users
SELECT 
    'All Admin Users:' as info,
    au.role,
    u.email,
    au.is_active,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;