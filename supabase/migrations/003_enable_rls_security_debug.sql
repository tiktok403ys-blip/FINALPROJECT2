-- Enable Row Level Security (RLS) and create security policies - DEBUG VERSION
-- This migration will secure sensitive tables from unauthorized access
-- Each step is run individually with error reporting

-- Step 1: Enable RLS on admin_pins table
DO $$
BEGIN
    ALTER TABLE admin_pins ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Step 1: RLS enabled on admin_pins table - SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 1 FAILED: %', SQLERRM;
END $$;

-- Step 2: Create security policy for admin_pins
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can only access their own admin PIN" ON admin_pins;
    CREATE POLICY "Users can only access their own admin PIN" ON admin_pins
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Step 2: Policy created for admin_pins table - SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 2 FAILED: %', SQLERRM;
END $$;

-- Step 3: Enable RLS on user_favorites table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
        ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only access their own favorites" ON user_favorites;
        CREATE POLICY "Users can only access their own favorites" ON user_favorites
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Step 3: RLS and policy for user_favorites - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 3: user_favorites table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 3 FAILED: %', SQLERRM;
END $$;

-- Step 4: Enable RLS on profiles table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
        CREATE POLICY "Users can only access their own profile" ON profiles
            FOR ALL
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
        RAISE NOTICE 'Step 4: RLS and policy for profiles - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 4: profiles table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 4 FAILED: %', SQLERRM;
END $$;

-- Step 5: Enable RLS on admin_users table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Only super admins can access admin_users" ON admin_users;
        CREATE POLICY "Only super admins can access admin_users" ON admin_users
            FOR ALL
            USING (true)  -- Temporary allow all, will be restricted after function creation
            WITH CHECK (true);
        RAISE NOTICE 'Step 5: RLS and policy for admin_users - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 5: admin_users table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 5 FAILED: %', SQLERRM;
END $$;

-- Step 6: Create function to check if user is admin
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
    
    RAISE NOTICE 'Step 6: is_user_admin function created - SUCCESS';
    
    -- Grant execute permission on admin check function
    GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION is_user_admin() TO authenticated;
    
    RAISE NOTICE 'Step 6: Permissions granted - SUCCESS';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 6 FAILED: %', SQLERRM;
        RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Step 7: Create secure admin access policy function
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
    
    RAISE NOTICE 'Step 7: require_admin_access function created - SUCCESS';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 7 FAILED: %', SQLERRM;
        RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Step 8: Update admin_users policy to use the new function
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        DROP POLICY IF EXISTS "Only super admins can access admin_users" ON admin_users;
        
        CREATE POLICY "Only super admins can access admin_users" ON admin_users
            FOR ALL
            USING (require_admin_access())
            WITH CHECK (require_admin_access());
            
        RAISE NOTICE 'Step 8: admin_users policy updated - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 8: admin_users table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 8 FAILED: %', SQLERRM;
END $$;

-- Step 9: Apply admin-only policies to sensitive tables
DO $$
BEGIN
    -- Apply to audit_logs if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Only admins can access audit logs" ON audit_logs;
        CREATE POLICY "Only admins can access audit logs" ON audit_logs
            FOR ALL
            USING (require_admin_access())
            WITH CHECK (require_admin_access());
            
        RAISE NOTICE 'Step 9: audit_logs policy created - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 9: audit_logs table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 9 FAILED: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Apply to reports if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can access their own reports, admins can access all" ON reports;
        CREATE POLICY "Users can access their own reports, admins can access all" ON reports
            FOR ALL
            USING (
                auth.uid() = user_id OR require_admin_access()
            )
            WITH CHECK (
                auth.uid() = user_id OR require_admin_access()
            );
            
        RAISE NOTICE 'Step 9: reports policy created - SUCCESS';
    ELSE
        RAISE NOTICE 'Step 9: reports table does not exist - SKIPPED';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Step 9 FAILED: %', SQLERRM;
END $$;

-- Step 10: Verify RLS is enabled
SELECT 
    'RLS Status Check' as step,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('admin_pins', 'user_favorites', 'profiles', 'admin_users')
ORDER BY tablename;

-- Step 11: Show created policies
SELECT 
    'Policies Check' as step,
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

-- Step 12: Test the functions
SELECT 
    'Function Test' as step,
    'is_user_admin function exists' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_admin') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as result;

SELECT 
    'Function Test' as step,
    'require_admin_access function exists' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'require_admin_access') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as result;

-- Step 13: Show final status
SELECT 
    'Migration Status' as step,
    'Migration completed' as status,
    NOW() as completed_at;

-- Step 14: Show any errors or warnings
SELECT 
    'Error Summary' as step,
    'Check NOTICE messages above for any FAILED steps' as message;
