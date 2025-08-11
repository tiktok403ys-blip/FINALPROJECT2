-- Create admin roles and security setup (FIXED VERSION)
-- Run this script in Supabase SQL Editor

-- Step 1: Create admin role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Handle existing role column properly
DO $$
BEGIN
    -- Check if role column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'role') THEN
        
        -- Drop default constraint if exists
        ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
        
        -- Update any existing NULL values to 'user'
        UPDATE profiles SET role = 'user' WHERE role IS NULL;
        
        -- Convert column to enum type
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING 
            CASE 
                WHEN role = 'admin' THEN 'admin'::user_role
                WHEN role = 'super_admin' THEN 'super_admin'::user_role
                ELSE 'user'::user_role
            END;
    ELSE
        -- Add role column if it doesn't exist
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
    END IF;
    
    -- Set default value
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
END $$;

-- Step 3: Create admin_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS on admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;

-- Step 6: Create RLS policies for admin_logs
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Step 7: Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_logs (admin_id, action, resource, resource_id, details, ip_address)
    VALUES (auth.uid(), p_action, p_resource, p_resource_id, p_details, p_ip_address::INET);
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to log admin action: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Update RLS policies for admin access to all tables
-- Drop existing policies first to avoid conflicts

-- Casinos table
DROP POLICY IF EXISTS "Admins can manage casinos" ON casinos;
DROP POLICY IF EXISTS "Public can view casinos" ON casinos;
CREATE POLICY "Public can view casinos" ON casinos FOR SELECT USING (true);
CREATE POLICY "Admins can manage casinos" ON casinos
    FOR ALL USING (is_admin());

-- Bonuses table  
DROP POLICY IF EXISTS "Admins can manage bonuses" ON bonuses;
DROP POLICY IF EXISTS "Public can view bonuses" ON bonuses;
CREATE POLICY "Public can view bonuses" ON bonuses FOR SELECT USING (true);
CREATE POLICY "Admins can manage bonuses" ON bonuses
    FOR ALL USING (is_admin());

-- News table
DROP POLICY IF EXISTS "Admins can manage news" ON news;
DROP POLICY IF EXISTS "Public can view news" ON news;
CREATE POLICY "Public can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Admins can manage news" ON news
    FOR ALL USING (is_admin());

-- Reports table
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
DROP POLICY IF EXISTS "Public can view reports" ON reports;
CREATE POLICY "Public can view reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (is_admin());

-- Casino reviews table
DROP POLICY IF EXISTS "Admins can manage casino_reviews" ON casino_reviews;
DROP POLICY IF EXISTS "Public can view casino_reviews" ON casino_reviews;
CREATE POLICY "Public can view casino_reviews" ON casino_reviews FOR SELECT USING (true);
CREATE POLICY "Admins can manage casino_reviews" ON casino_reviews
    FOR ALL USING (is_admin());

-- Review sections table
DROP POLICY IF EXISTS "Admins can manage review_sections" ON review_sections;
DROP POLICY IF EXISTS "Public can view review_sections" ON review_sections;
CREATE POLICY "Public can view review_sections" ON review_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage review_sections" ON review_sections
    FOR ALL USING (is_admin());

-- Partners table
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
DROP POLICY IF EXISTS "Public can view partners" ON partners;
CREATE POLICY "Public can view partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Admins can manage partners" ON partners
    FOR ALL USING (is_admin());

-- Footer links table
DROP POLICY IF EXISTS "Admins can manage footer_links" ON footer_links;
DROP POLICY IF EXISTS "Public can view footer_links" ON footer_links;
CREATE POLICY "Public can view footer_links" ON footer_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage footer_links" ON footer_links
    FOR ALL USING (is_admin());

-- Casino screenshots table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'casino_screenshots') THEN
        DROP POLICY IF EXISTS "Admins can manage casino_screenshots" ON casino_screenshots;
        DROP POLICY IF EXISTS "Public can view casino_screenshots" ON casino_screenshots;
        CREATE POLICY "Public can view casino_screenshots" ON casino_screenshots FOR SELECT USING (true);
        CREATE POLICY "Admins can manage casino_screenshots" ON casino_screenshots FOR ALL USING (is_admin());
    END IF;
END $$;

-- Casino banners table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'casino_banners') THEN
        DROP POLICY IF EXISTS "Admins can manage casino_banners" ON casino_banners;
        DROP POLICY IF EXISTS "Public can view casino_banners" ON casino_banners;
        CREATE POLICY "Public can view casino_banners" ON casino_banners FOR SELECT USING (true);
        CREATE POLICY "Admins can manage casino_banners" ON casino_banners FOR ALL USING (is_admin());
    END IF;
END $$;

-- Step 10: Create admin user function (safer approach)
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email TEXT,
    admin_password TEXT
) RETURNS TEXT AS $$
DECLARE
    new_user_id UUID;
    result_message TEXT;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        -- Update existing user to admin
        UPDATE profiles 
        SET role = 'admin'::user_role, updated_at = NOW()
        WHERE email = admin_email;
        
        result_message := 'User ' || admin_email || ' updated to admin role';
    ELSE
        -- This would typically be done through Supabase Auth API
        -- For now, we'll create a profile entry that can be linked later
        INSERT INTO profiles (id, email, role, created_at, updated_at)
        VALUES (gen_random_uuid(), admin_email, 'admin'::user_role, NOW(), NOW());
        
        result_message := 'Admin profile created for ' || admin_email || '. Please create the auth user through Supabase Dashboard.';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create the admin user profile
-- You can change the email here
SELECT create_admin_user('casinogurusg404@gmail.com', 'Qwerty1122$');

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 13: Verify setup
SELECT 
    'Setup completed successfully!' as status,
    COUNT(*) as admin_count
FROM profiles 
WHERE role IN ('admin', 'super_admin');
