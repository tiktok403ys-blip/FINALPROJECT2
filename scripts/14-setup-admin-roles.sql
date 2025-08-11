-- Create admin roles and security setup
-- Run this script in Supabase SQL Editor

-- First, ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create admin role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to use enum
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Create admin_logs table for tracking admin actions
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

-- Create RLS policies for admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Only admins can insert admin logs
CREATE POLICY "Admins can insert admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create function to log admin actions
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for admin access to all tables
-- Casinos table
DROP POLICY IF EXISTS "Admins can manage casinos" ON casinos;
CREATE POLICY "Admins can manage casinos" ON casinos
    FOR ALL USING (is_admin());

-- Bonuses table  
DROP POLICY IF EXISTS "Admins can manage bonuses" ON bonuses;
CREATE POLICY "Admins can manage bonuses" ON bonuses
    FOR ALL USING (is_admin());

-- News table
DROP POLICY IF EXISTS "Admins can manage news" ON news;
CREATE POLICY "Admins can manage news" ON news
    FOR ALL USING (is_admin());

-- Reports table
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (is_admin());

-- Casino reviews table
DROP POLICY IF EXISTS "Admins can manage casino_reviews" ON casino_reviews;
CREATE POLICY "Admins can manage casino_reviews" ON casino_reviews
    FOR ALL USING (is_admin());

-- Review sections table
DROP POLICY IF EXISTS "Admins can manage review_sections" ON review_sections;
CREATE POLICY "Admins can manage review_sections" ON review_sections
    FOR ALL USING (is_admin());

-- Partners table
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners" ON partners
    FOR ALL USING (is_admin());

-- Footer links table
DROP POLICY IF EXISTS "Admins can manage footer_links" ON footer_links;
CREATE POLICY "Admins can manage footer_links" ON footer_links
    FOR ALL USING (is_admin());

-- Casino screenshots table
DROP POLICY IF EXISTS "Admins can manage casino_screenshots" ON casino_screenshots;
CREATE POLICY "Admins can manage casino_screenshots" ON casino_screenshots
    FOR ALL USING (is_admin());

-- Casino banners table
DROP POLICY IF EXISTS "Admins can manage casino_banners" ON casino_banners;
CREATE POLICY "Admins can manage casino_banners" ON casino_banners
    FOR ALL USING (is_admin());

-- Create default admin user (change email and password as needed)
-- You should run this separately and change the credentials
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@gurusingapore.com',
    crypt('AdminPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile for the admin user
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
    id,
    email,
    'admin'::user_role,
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'admin@gurusingapore.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
