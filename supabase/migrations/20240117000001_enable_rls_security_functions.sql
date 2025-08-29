-- Migration: Enable RLS and Security Functions for Production
-- Created: 2024-01-17
-- Purpose: Add helper functions and enable Row Level Security for sensitive tables

-- =====================================================
-- HELPER FUNCTIONS FOR ROLE CHECKING
-- =====================================================

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user owns a record
CREATE OR REPLACE FUNCTION public.is_owner(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = owner_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS for admin tables
ALTER TABLE admin_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS for user tables
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Note: casino_stats_mobile materialized view has been removed (see migration 20241230000000_drop_casino_stats_mobile.sql)

-- =====================================================
-- GRANT PERMISSIONS TO ROLES
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT SELECT ON profiles TO authenticated;
-- Removed: GRANT SELECT ON casino_stats_mobile TO authenticated; (casino_stats_mobile has been dropped)
GRANT SELECT, INSERT, UPDATE, DELETE ON user_favorites TO authenticated;

-- Grant admin permissions
GRANT ALL PRIVILEGES ON admin_pins TO authenticated;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Removed: GRANT SELECT ON casino_stats_mobile TO anon; (casino_stats_mobile has been dropped)
-- Public data is now accessed directly from casinos table with appropriate RLS policies