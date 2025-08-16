-- =====================================================
-- ADMIN ROLES SETUP - FINAL FIXED VERSION
-- Fixes ambiguous column reference error
-- =====================================================

-- Step 1: Create user_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
        RAISE NOTICE 'Created user_role enum type';
    ELSE
        RAISE NOTICE 'user_role enum type already exists';
    END IF;
END $$;

-- Step 2: Update profiles table to use enum type
DO $$ 
BEGIN
    -- Check if role column exists and what type it is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        -- Drop default constraint if exists
        ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
        
        -- Convert existing data and change column type
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
        
        -- Set new default
        ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
        
        RAISE NOTICE 'Updated profiles.role column to use user_role enum';
    ELSE
        -- Add role column if it doesn't exist
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user'::user_role;
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
END $$;

-- DEPRECATED: admin_logs is no longer used. Use admin_actions.

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
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_logs (admin_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to safely create admin policies
CREATE OR REPLACE FUNCTION create_admin_policies_for_table(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_name = p_table_name 
        AND t.table_schema = 'public'
    ) THEN
        -- Drop existing policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS "admin_all_access" ON %I', p_table_name);
        EXECUTE format('DROP POLICY IF EXISTS "public_read_access" ON %I', p_table_name);
        
        -- Create admin policy (full access)
        EXECUTE format('
            CREATE POLICY "admin_all_access" ON %I
            FOR ALL TO authenticated
            USING (is_admin())
            WITH CHECK (is_admin())
        ', p_table_name);
        
        -- Create public read policy
        EXECUTE format('
            CREATE POLICY "public_read_access" ON %I
            FOR SELECT TO anon, authenticated
            USING (true)
        ', p_table_name);
        
        RAISE NOTICE 'Created admin policies for table: %', p_table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping policy creation', p_table_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policies for table %: %', p_table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Apply admin policies to existing tables
DO $$
DECLARE
    table_record RECORD;
    tables_to_secure TEXT[] := ARRAY[
        'casinos', 'casino_reviews', 'review_sections', 'reports', 
        'news', 'partners', 'footer_links', 'casino_screenshots',
    'casino_banners'
    ];
    table_name TEXT;
BEGIN
    -- Show existing tables for reference
    RAISE NOTICE 'Existing tables in public schema:';
    FOR table_record IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        RAISE NOTICE '  - %', table_record.table_name;
    END LOOP;
    
    -- Apply policies to tables that exist
    FOREACH table_name IN ARRAY tables_to_secure
    LOOP
        PERFORM create_admin_policies_for_table(table_name);
    END LOOP;
END $$;

-- DEPRECATED: admin_logs policies removed.

-- Step 8: Create default admin user function
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS VOID AS $$
DECLARE
    admin_email TEXT := 'casinogurusg404@gmail.com';
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin already exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = admin_email
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE NOTICE 'Please create admin user manually in Supabase Auth Dashboard:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: Qwerty1122!';
        RAISE NOTICE 'Then run: UPDATE profiles SET role = ''admin'' WHERE email = ''%'';', admin_email;
    ELSE
        -- Update existing user to admin
        UPDATE profiles 
        SET role = 'admin'::user_role 
        WHERE id = (SELECT id FROM auth.users WHERE email = admin_email);
        
        RAISE NOTICE 'Updated existing user % to admin role', admin_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Execute admin user creation
SELECT create_default_admin();

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ADMIN ROLES SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin user in Supabase Auth Dashboard';
    RAISE NOTICE '2. Email: casinogurusg404@gmail.com';
    RAISE NOTICE '3. Password: Qwerty1122!';
    RAISE NOTICE '4. Login via main domain auth flow (subdomain admin has no separate login)';
    RAISE NOTICE '==============================================';
END $$;
