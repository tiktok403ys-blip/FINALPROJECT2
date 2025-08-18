-- Migration: Fix Dual Role System Comprehensive
-- Purpose: Analyze and fix inconsistencies between profiles.role and admin_users.role
-- Date: 2024-12-18

-- Step 1: Analyze current data inconsistencies
DO $$
DECLARE
    profile_count INTEGER;
    admin_count INTEGER;
    inconsistent_count INTEGER;
BEGIN
    -- Count profiles
    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE 'Total profiles: %', profile_count;
    
    -- Count admin_users
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    RAISE NOTICE 'Total admin_users: %', admin_count;
    
    -- Find users in profiles but not in admin_users (with admin role)
    SELECT COUNT(*) INTO inconsistent_count 
    FROM profiles p 
    WHERE p.role = 'admin' 
    AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = p.id);
    RAISE NOTICE 'Profiles with admin role but not in admin_users: %', inconsistent_count;
    
    -- Find users in admin_users but not in profiles
    SELECT COUNT(*) INTO inconsistent_count 
    FROM admin_users a 
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = a.user_id);
    RAISE NOTICE 'Admin_users without corresponding profiles: %', inconsistent_count;
    
    -- Find role mismatches
    SELECT COUNT(*) INTO inconsistent_count 
    FROM profiles p 
    JOIN admin_users a ON p.id = a.user_id 
    WHERE p.role != a.role;
    RAISE NOTICE 'Role mismatches between profiles and admin_users: %', inconsistent_count;
END $$;

-- Step 2: Create function to sync user roles
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS void AS $$
BEGIN
    -- Sync profiles.role to admin_users.role (profiles is source of truth)
    UPDATE admin_users 
    SET role = p.role,
        updated_at = NOW()
    FROM profiles p 
    WHERE admin_users.user_id = p.id 
    AND admin_users.role != p.role;
    
    -- Create missing admin_users records for profiles with admin role
    INSERT INTO admin_users (user_id, role, created_at, updated_at)
    SELECT 
        p.id,
        p.role,
        NOW(),
        NOW()
    FROM profiles p 
    WHERE p.role = 'admin' 
    AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = p.id);
    
    -- Remove admin_users records for profiles that are no longer admin
    DELETE FROM admin_users 
    WHERE user_id IN (
        SELECT a.user_id 
        FROM admin_users a 
        JOIN profiles p ON a.user_id = p.id 
        WHERE p.role != 'admin'
    );
    
    -- Remove orphaned admin_users (no corresponding profile)
    DELETE FROM admin_users 
    WHERE user_id NOT IN (SELECT id FROM profiles);
    
    RAISE NOTICE 'User roles synchronized successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute synchronization
SELECT sync_user_roles();

-- Step 4: Create trigger to maintain consistency
CREATE OR REPLACE FUNCTION trigger_maintain_role_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- When profile role changes to admin, ensure admin_users record exists
    IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
        INSERT INTO admin_users (user_id, role, created_at, updated_at)
        VALUES (NEW.id, NEW.role, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            role = NEW.role,
            updated_at = NOW();
    END IF;
    
    -- When profile role changes from admin, remove admin_users record
    IF NEW.role != 'admin' AND OLD.role = 'admin' THEN
        DELETE FROM admin_users WHERE user_id = NEW.id;
    END IF;
    
    -- Update admin_users role if it exists
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = NEW.id) THEN
        UPDATE admin_users 
        SET role = NEW.role, updated_at = NOW() 
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_maintain_role_consistency ON profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_maintain_role_consistency
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_maintain_role_consistency();

-- Step 5: Add missing foreign key constraint if not exists
DO $$
BEGIN
    -- Check if foreign key constraint exists for admin_users.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_users_user_id_fkey' 
        AND table_name = 'admin_users'
    ) THEN
        ALTER TABLE admin_users 
        ADD CONSTRAINT admin_users_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for admin_users.user_id';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint already exists or error: %', SQLERRM;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Step 7: Final verification
DO $$
DECLARE
    profile_count INTEGER;
    admin_count INTEGER;
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    
    SELECT COUNT(*) INTO mismatch_count 
    FROM profiles p 
    LEFT JOIN admin_users a ON p.id = a.user_id 
    WHERE p.role = 'admin' AND a.user_id IS NULL;
    
    RAISE NOTICE 'Final verification:';
    RAISE NOTICE 'Profiles with admin role: %', profile_count;
    RAISE NOTICE 'Admin_users records: %', admin_count;
    RAISE NOTICE 'Mismatches remaining: %', mismatch_count;
    
    IF mismatch_count = 0 THEN
        RAISE NOTICE 'SUCCESS: Dual role system is now synchronized!';
    ELSE
        RAISE WARNING 'WARNING: Still have % mismatches to resolve', mismatch_count;
    END IF;
END $$;

COMMIT;