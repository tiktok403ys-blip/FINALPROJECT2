-- =====================================================
-- SETUP ADMIN ROLES AND SECURITY SYSTEM
-- =====================================================

-- Step 1: Create user_role enum type if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
        RAISE NOTICE 'Created user_role enum type';
    ELSE
        RAISE NOTICE 'user_role enum type already exists';
    END IF;
END $$;

-- Step 2: Handle existing role column in profiles table
DO $$ 
BEGIN
    -- Check if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Check if role column exists and its type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
            -- Drop default constraint if exists
            ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
            
            -- Update existing data to valid enum values
            UPDATE profiles SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin', 'super_admin');
            
            -- Change column type to enum
            ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
            
            -- Set new default
            ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
            
            RAISE NOTICE 'Updated existing role column to user_role enum';
        ELSE
            -- Add role column if it doesn't exist
            ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user'::user_role;
            RAISE NOTICE 'Added role column to profiles table';
        END IF;
    ELSE
        RAISE NOTICE 'profiles table does not exist - will be created by auth system';
    END IF;
END $$;

-- Step 3: Create admin_logs table for activity tracking
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_admin_action(
    action_type TEXT,
    table_name TEXT DEFAULT NULL,
    record_id TEXT DEFAULT NULL,
    old_data JSONB DEFAULT NULL,
    new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_logs (admin_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), action_type, table_name, record_id, old_data, new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to safely create admin policies for existing tables
CREATE OR REPLACE FUNCTION create_admin_policies_for_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public') THEN
        -- Drop existing policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS "admin_all_access" ON %I', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "public_read_access" ON %I', table_name);
        
        -- Create admin policy
        EXECUTE format('CREATE POLICY "admin_all_access" ON %I FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())', table_name);
        
        -- Create public read policy
        EXECUTE format('CREATE POLICY "public_read_access" ON %I FOR SELECT TO anon, authenticated USING (true)', table_name);
        
        RAISE NOTICE 'Created admin policies for table: %', table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping policy creation', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Apply admin policies to existing tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Get all existing tables
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('admin_logs')
    LOOP
        PERFORM create_admin_policies_for_table(table_record.table_name);
    END LOOP;
END $$;

-- Step 7: Admin logs policies
CREATE POLICY "admin_logs_admin_access" ON admin_logs
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Step 8: Create or update admin user function
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email TEXT,
    admin_password TEXT,
    admin_role user_role DEFAULT 'admin'
)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_message TEXT;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
    
    IF user_id IS NOT NULL THEN
        -- Update existing user's role
        INSERT INTO profiles (id, role, full_name, updated_at)
        VALUES (user_id, admin_role, 'System Administrator', NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = admin_role,
            full_name = COALESCE(profiles.full_name, 'System Administrator'),
            updated_at = NOW();
        
        result_message := 'Updated existing user ' || admin_email || ' with role ' || admin_role;
    ELSE
        result_message := 'User ' || admin_email || ' not found. Please create user through Supabase Auth Dashboard first, then run this function again.';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Show existing tables for reference
DO $$
DECLARE
    table_list TEXT := '';
    table_record RECORD;
BEGIN
    RAISE NOTICE '=== EXISTING TABLES IN DATABASE ===';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Table: %', table_record.table_name;
    END LOOP;
    RAISE NOTICE '=== END OF TABLE LIST ===';
END $$;

-- Step 10: Final setup message
DO $$
BEGIN
    RAISE NOTICE '=== ADMIN SETUP COMPLETED ===';
    RAISE NOTICE '1. Admin role system has been set up successfully';
    RAISE NOTICE '2. Create admin user in Supabase Auth Dashboard with email: admin@gurusingapore.com';
    RAISE NOTICE '3. Then run: SELECT create_admin_user(''admin@gurusingapore.com'', ''password'', ''admin'');';
    RAISE NOTICE '4. Admin can access panel at /admin after authentication';
    RAISE NOTICE '5. All admin activities will be logged in admin_logs table';
END $$;
