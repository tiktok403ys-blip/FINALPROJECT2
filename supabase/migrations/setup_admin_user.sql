-- Setup admin user untuk memastikan akses admin yang benar
-- Script ini akan membuat atau memperbarui admin user

-- Pastikan RLS policies ada untuk admin_users
DROP POLICY IF EXISTS "Users can view own admin data" ON admin_users;
CREATE POLICY "Users can view own admin data" ON admin_users
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions untuk admin_users
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_users TO anon;

-- Insert atau update admin user berdasarkan user_id yang ada di auth.users
-- Ganti dengan user_id yang sesuai dari auth.users
-- Contoh: ambil user pertama yang ada dan jadikan super_admin
INSERT INTO admin_users (user_id, role, permissions, is_active)
SELECT 
    au.id,
    'super_admin',
    ARRAY['all']::text[],
    true
FROM auth.users au
LIMIT 1
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'super_admin',
    is_active = true,
    permissions = ARRAY['all']::text[],
    updated_at = now();

-- Jika tidak ada user di auth.users, buat placeholder entry
-- yang bisa diupdate nanti ketika user admin login
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'super_admin',
            ARRAY['all']::text[],
            false
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;