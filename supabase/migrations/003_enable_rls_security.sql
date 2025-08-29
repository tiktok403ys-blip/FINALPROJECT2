-- Enable Row Level Security (RLS) and create security policies
-- This migration will secure sensitive tables from unauthorized access

-- Step 1: Enable RLS on admin_pins table
ALTER TABLE admin_pins ENABLE ROW LEVEL SECURITY;

-- Step 2: Create security policy for admin_pins
-- Only authenticated users can access their own PIN data
CREATE POLICY "Users can only access their own admin PIN" ON admin_pins
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 3: Enable RLS on user_favorites table
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security policy for user_favorites
-- Users can only access their own favorites
CREATE POLICY "Users can only access their own favorites" ON user_favorites
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 5: Enable RLS on profiles table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can only access their own profile" ON profiles
            FOR ALL
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Step 6: Enable RLS on admin_users table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
        
        -- Only super admins can access admin_users table
        CREATE POLICY "Only super admins can access admin_users" ON admin_users
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM admin_pins 
                    WHERE user_id = auth.uid() 
                    AND is_active = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM admin_pins 
                    WHERE user_id = auth.uid() 
                    AND is_active = true
                )
            );
    END IF;
END $$;

-- Step 7: Create function to check if user is admin
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

-- Step 8: Grant execute permission on admin check function
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin() TO authenticated;

-- Step 9: Create secure admin access policy for sensitive tables
-- This policy ensures only verified admins can access admin-related data
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

-- Step 10: Apply admin-only policies to sensitive tables
DO $$
BEGIN
    -- Apply to audit_logs if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Only admins can access audit logs" ON audit_logs
            FOR ALL
            USING (require_admin_access())
            WITH CHECK (require_admin_access());
    END IF;
    
    -- Apply to reports if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can access their own reports, admins can access all" ON reports
            FOR ALL
            USING (
                auth.uid() = user_id OR require_admin_access()
            )
            WITH CHECK (
                auth.uid() = user_id OR require_admin_access()
            );
    END IF;
END $$;

-- Step 11: Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('admin_pins', 'user_favorites', 'profiles', 'admin_users')
ORDER BY tablename;

-- Step 12: Show created policies
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
