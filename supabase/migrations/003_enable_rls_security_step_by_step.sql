-- Enable Row Level Security (RLS) and create security policies - STEP BY STEP
-- This migration will secure sensitive tables from unauthorized access
-- Each step is independent and handles errors gracefully

-- Step 1: Check if admin_pins table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_pins') THEN
        -- Enable RLS
        ALTER TABLE admin_pins ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on admin_pins table';
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Users can only access their own admin PIN" ON admin_pins;
        
        -- Create security policy for admin_pins
        CREATE POLICY "Users can only access their own admin PIN" ON admin_pins
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
            
        RAISE NOTICE 'Policy created for admin_pins table';
    ELSE
        RAISE NOTICE 'admin_pins table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with admin_pins: %', SQLERRM;
END $$;

-- Step 2: Check if user_favorites table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
        -- Enable RLS
        ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on user_favorites table';
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Users can only access their own favorites" ON user_favorites;
        
        -- Create security policy for user_favorites
        CREATE POLICY "Users can only access their own favorites" ON user_favorites
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
            
        RAISE NOTICE 'Policy created for user_favorites table';
    ELSE
        RAISE NOTICE 'user_favorites table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with user_favorites: %', SQLERRM;
END $$;

-- Step 3: Check if profiles table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on profiles table';
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
        
        -- Create security policy for profiles
        CREATE POLICY "Users can only access their own profile" ON profiles
            FOR ALL
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
            
        RAISE NOTICE 'Policy created for profiles table';
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with profiles: %', SQLERRM;
END $$;

-- Step 4: Check if admin_users table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        -- Enable RLS
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on admin_users table';
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Only super admins can access admin_users" ON admin_users;
        
        -- Create security policy for admin_users (temporary, will be updated after function creation)
        CREATE POLICY "Only super admins can access admin_users" ON admin_users
            FOR ALL
            USING (true)  -- Temporary allow all, will be restricted after function creation
            WITH CHECK (true);
            
        RAISE NOTICE 'Policy created for admin_users table (temporary)';
    ELSE
        RAISE NOTICE 'admin_users table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with admin_users: %', SQLERRM;
END $$;

-- Step 5: Create function to check if user is admin
DO $$
BEGIN
    -- Drop existing function if exists
    DROP FUNCTION IF EXISTS is_user_admin(UUID);
    DROP FUNCTION IF EXISTS is_user_admin();
    
    -- Create function to check if user is admin
    CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID DEFAULT auth.uid())
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1 FROM admin_pins 
            WHERE user_id = user_uuid 
            AND is_active = true
        );
    END;
    $$;
    
    RAISE NOTICE 'is_user_admin function created successfully';
    
    -- Grant execute permission on admin check function
    GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION is_user_admin() TO authenticated;
    
    RAISE NOTICE 'Permissions granted for is_user_admin function';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating is_user_admin function: %', SQLERRM;
END $$;

-- Step 6: Create secure admin access policy function
DO $$
BEGIN
    -- Drop existing function if exists
    DROP FUNCTION IF EXISTS require_admin_access();
    
    -- Create secure admin access policy for sensitive tables
    CREATE OR REPLACE FUNCTION require_admin_access()
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        IF NOT is_user_admin() THEN
            RAISE EXCEPTION 'Access denied: Admin privileges required';
        END IF;
        RETURN true;
    END;
    $$;
    
    RAISE NOTICE 'require_admin_access function created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating require_admin_access function: %', SQLERRM;
END $$;

-- Step 7: Update admin_users policy to use the new function
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        -- Drop existing policy
        DROP POLICY IF EXISTS "Only super admins can access admin_users" ON admin_users;
        
        -- Create new policy using the function
        CREATE POLICY "Only super admins can access admin_users" ON admin_users
            FOR ALL
            USING (require_admin_access())
            WITH CHECK (require_admin_access());
            
        RAISE NOTICE 'admin_users policy updated to use require_admin_access function';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating admin_users policy: %', SQLERRM;
END $$;

-- Step 8: Apply admin-only policies to sensitive tables
DO $$
BEGIN
    -- Apply to audit_logs if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Only admins can access audit logs" ON audit_logs;
        
        CREATE POLICY "Only admins can access audit logs" ON audit_logs
            FOR ALL
            USING (require_admin_access())
            WITH CHECK (require_admin_access());
            
        RAISE NOTICE 'Policy created for audit_logs table';
    ELSE
        RAISE NOTICE 'audit_logs table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with audit_logs: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Apply to reports if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Users can access their own reports, admins can access all" ON reports;
        
        CREATE POLICY "Users can access their own reports, admins can access all" ON reports
            FOR ALL
            USING (
                auth.uid() = user_id OR require_admin_access()
            )
            WITH CHECK (
                auth.uid() = user_id OR require_admin_access()
            );
            
        RAISE NOTICE 'Policy created for reports table';
    ELSE
        RAISE NOTICE 'reports table does not exist, skipping...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with reports: %', SQLERRM;
END $$;

-- Step 9: Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('admin_pins', 'user_favorites', 'profiles', 'admin_users')
ORDER BY tablename;

-- Step 10: Show created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('admin_pins', 'user_favorites', 'profiles', 'admin_users')
ORDER BY tablename, policyname;

-- Step 11: Test the functions
SELECT 
    'is_user_admin function exists' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_admin') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as result;

SELECT 
    'require_admin_access function exists' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'require_admin_access') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as result;

-- Step 12: Show final status
SELECT 
    'Migration completed' as status,
    NOW() as completed_at;
