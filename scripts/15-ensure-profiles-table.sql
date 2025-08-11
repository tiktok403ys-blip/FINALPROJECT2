-- Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    admin_pin TEXT DEFAULT NULL,
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

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create function to verify admin PIN
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
    SELECT admin_pin, role INTO stored_pin, user_role
    FROM profiles 
    WHERE email = user_email;
    
    -- Check if user is admin/super_admin and PIN matches
    IF user_role IN ('admin', 'super_admin') AND stored_pin = input_pin THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Create function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(user_email TEXT, new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET admin_pin = new_pin, updated_at = NOW()
    WHERE email = user_email AND role IN ('admin', 'super_admin');
    
    RETURN FOUND;
END;
$$;

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

-- Create function to log admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO admin_logs (user_id, action, resource, resource_id, details, ip_address)
    VALUES (
        auth.uid(),
        p_action,
        p_resource,
        p_resource_id,
        CASE WHEN p_details IS NOT NULL THEN p_details::jsonb ELSE NULL END,
        CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::inet ELSE NULL END
    );
END;
$$;
