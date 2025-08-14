-- Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    admin_pin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(user_email TEXT, input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_pin TEXT;
    user_role TEXT;
BEGIN
    -- Get user's PIN and role
    SELECT p.admin_pin, p.role INTO stored_pin, user_role
    FROM profiles p
    WHERE p.email = user_email;
    
    -- Check if user is admin and PIN matches
    IF user_role IN ('admin', 'super_admin') AND stored_pin = input_pin THEN
        -- Log successful admin access
        -- DEPRECATED: use admin_actions instead of admin_logs
        -- INSERT INTO admin_logs (user_email, action, timestamp)
        VALUES (user_email, 'PIN_VERIFIED', NOW());
        
        RETURN TRUE;
    ELSE
        -- Log failed attempt
        -- DEPRECATED: use admin_actions instead of admin_logs
        -- INSERT INTO admin_logs (user_email, action, timestamp)
        VALUES (user_email, 'PIN_FAILED', NOW());
        
        RETURN FALSE;
    END IF;
END;
$$;

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(user_email TEXT, new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET admin_pin = new_pin, updated_at = NOW()
    WHERE email = user_email AND role IN ('admin', 'super_admin');
    
    IF FOUND THEN
        -- DEPRECATED: use admin_actions instead of admin_logs
        -- INSERT INTO admin_logs (user_email, action, timestamp)
        VALUES (user_email, 'PIN_UPDATED', NOW());
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- DEPRECATED: admin_logs is not used. Use admin_actions for activity tracking.

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url, role, admin_pin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        CASE 
            WHEN NEW.email = 'casinogurusg404@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END,
        CASE 
            WHEN NEW.email = 'casinogurusg404@gmail.com' THEN '1234'
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert/Update super admin profile
INSERT INTO profiles (id, email, full_name, role, admin_pin)
SELECT 
    au.id,
    'casinogurusg404@gmail.com',
    'Super Admin',
    'super_admin',
    '1234'
FROM auth.users au
WHERE au.email = 'casinogurusg404@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    admin_pin = '1234',
    updated_at = NOW();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
-- DEPRECATED: admin_logs grants removed
GRANT EXECUTE ON FUNCTION verify_admin_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_admin_pin TO anon, authenticated;
