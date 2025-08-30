-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS) SECURITY FIX
-- =====================================================
-- This migration fixes security warnings by enabling RLS on tables
-- that are exposed to PostgREST but don't have RLS enabled
-- 
-- Security Level: ERROR
-- Tables affected: 3 tables (nama_tabel_besar_y2023m01, y2023m02, y2023m03)

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY ON AFFECTED TABLES
-- =====================================================
-- Enable RLS on table Y2023M01
ALTER TABLE public.nama_tabel_besar_y2023m01 ENABLE ROW LEVEL SECURITY;

-- Enable RLS on table Y2023M02
ALTER TABLE public.nama_tabel_besar_y2023m02 ENABLE ROW LEVEL SECURITY;

-- Enable RLS on table Y2023M03
ALTER TABLE public.nama_tabel_besar_y2023m03 ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE BASIC RLS POLICIES FOR AUTHENTICATED USERS
-- =====================================================
-- After enabling RLS, all access is blocked by default.
-- We need to create policies to allow appropriate access.

-- Policy for nama_tabel_besar_y2023m01
CREATE POLICY "authenticated_users_read_y2023m01"
ON public.nama_tabel_besar_y2023m01
FOR SELECT TO authenticated
USING (true);

-- Policy for nama_tabel_besar_y2023m02
CREATE POLICY "authenticated_users_read_y2023m02"
ON public.nama_tabel_besar_y2023m02
FOR SELECT TO authenticated
USING (true);

-- Policy for nama_tabel_besar_y2023m03
CREATE POLICY "authenticated_users_read_y2023m03"
ON public.nama_tabel_besar_y2023m03
FOR SELECT TO authenticated
USING (true);

-- =====================================================
-- 3. OPTIONAL: ADMIN ACCESS POLICIES
-- =====================================================
-- Create policies for admin users to have full access
-- (Uncomment and modify based on your admin user structure)

/*
-- Admin full access for Y2023M01
CREATE POLICY "admin_full_access_y2023m01"
ON public.nama_tabel_besar_y2023m01
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Admin full access for Y2023M02
CREATE POLICY "admin_full_access_y2023m02"
ON public.nama_tabel_besar_y2023m02
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Admin full access for Y2023M03
CREATE POLICY "admin_full_access_y2023m03"
ON public.nama_tabel_besar_y2023m03
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
*/

-- =====================================================
-- 4. GRANT NECESSARY PERMISSIONS
-- =====================================================
-- Ensure anon and authenticated roles have basic access
-- (These may already exist,