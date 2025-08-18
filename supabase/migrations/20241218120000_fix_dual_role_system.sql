-- Migration: Fix Dual Role System
-- Analisis dan perbaiki inkonsistensi antara profiles.role dan admin_users.role

-- 1. Analisis data yang ada
DO $$
BEGIN
    RAISE NOTICE 'Analyzing dual role system inconsistencies...';
    
    -- Check profiles without admin_users
    RAISE NOTICE 'Profiles with admin/super_admin role but not in admin_users:';
    PERFORM p.id, p.role, p.email
    FROM profiles p
    LEFT JOIN admin_users au ON p.id = au.user_id
    WHERE p.role IN ('admin', 'super_admin') AND au.user_id IS NULL;
    
    -- Check admin_users without profiles
    RAISE NOTICE 'Admin_users without corresponding profiles:';
    PERFORM au.id, au.user_id, au.role
    FROM admin_users au
    LEFT JOIN profiles p ON au.user_id = p.id
    WHERE p.id IS NULL;
    
    -- Check role mismatches
    RAISE NOTICE 'Role mismatches between profiles and admin_users:';
    PERFORM p.id, p.role as profile_role, au.role as admin_role
    FROM profiles p
    JOIN admin_users au ON p.id = au.user_id
    WHERE p.role != au.role;
END $$;

-- 2. Create function to sync roles
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS void AS $$
BEGIN
    -- Sync profiles.role to admin_users.role (profiles is source of truth)
    UPDATE admin_users au
    SET role = p.role,
        updated_at = NOW()
    FROM profiles p
    WHERE au.user_id = p.id
    AND au.role != p.role;
    
    -- Create missing admin_users entries for admin/super_admin profiles
    INSERT INTO admin_users (user_id, role, permissions, created_by, is_active)
    SELECT 
        p.id,
        p.role,
        CASE 
            WHEN p.role = 'super_admin' THEN ARRAY['all']
            WHEN p.role = 'admin' THEN ARRAY['read', 'write', 'moderate']
            ELSE ARRAY[]::text[]
        END as permissions,
        p.id, -- self-created for now
        true
    FROM profiles p
    LEFT JOIN admin_users au ON p.id = au.user_id
    WHERE p.role IN ('admin', 'super_admin')
    AND au.user_id IS NULL;
    
    -- Remove admin_users entries for users who are no longer admin
    DELETE FROM admin_users au
    WHERE NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = au.user_id 
        AND p.role IN ('admin', 'super_admin')
    );
    
    RAISE NOTICE 'Role synchronization completed';
END;
$$ LANGUAGE plpgsql;

-- 3. Execute role synchronization
SELECT sync_user_roles();

-- 4. Create trigger to maintain role consistency
CREATE OR REPLACE FUNCTION maintain_role_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- When profile role changes to admin/super_admin
    IF NEW.role IN ('admin', 'super_admin') THEN
        INSERT INTO admin_users (user_id, role, permissions, created_by, is_active)
        VALUES (
            NEW.id,
            NEW.role,
            CASE 
                WHEN NEW.role = 'super_admin' THEN ARRAY['all']
                WHEN NEW.role = 'admin' THEN ARRAY['read', 'write', 'moderate']
                ELSE ARRAY[]::text[]
            END,
            NEW.id,
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = NEW.role,
            permissions = CASE 
                WHEN NEW.role = 'super_admin' THEN ARRAY['all']
                WHEN NEW.role = 'admin' THEN ARRAY['read', 'write', 'moderate']
                ELSE ARRAY[]::text[]
            END,
            updated_at = NOW();
    
    -- When profile role changes from admin to user
    ELSIF OLD.role IN ('admin', 'super_admin') AND NEW.role = 'user' THEN
        DELETE FROM admin_users WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_maintain_role_consistency ON profiles;

-- Create trigger
CREATE TRIGGER trigger_maintain_role_consistency
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION maintain_role_consistency();

-- 5. Add constraints to ensure data integrity
ALTER TABLE admin_users
DROP CONSTRAINT IF EXISTS fk_admin_users_user_id;

ALTER TABLE admin_users
ADD CONSTRAINT fk_admin_users_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- 7. Recreate essential RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'super_admin'
        )
    );

-- Admin users policies
DROP POLICY IF EXISTS "Admins can view their own record" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view all admin records" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin records" ON admin_users;

CREATE POLICY "Admins can view their own record" ON admin_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin users can view all admin records" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all admin records" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'super_admin'
        )
    );

COMMIT;