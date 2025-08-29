-- Migration: Admin Security Policies
-- Created: 2024-01-17
-- Purpose: Create security policies for admin tables (admin_pins, admin_users, audit_logs)

-- =====================================================
-- ADMIN_PINS POLICIES
-- =====================================================

-- Only admins can view admin pins
CREATE POLICY "admin_pins_select_policy" ON admin_pins
  FOR SELECT
  USING (public.is_admin());

-- Only admins can insert admin pins
CREATE POLICY "admin_pins_insert_policy" ON admin_pins
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update admin pins
CREATE POLICY "admin_pins_update_policy" ON admin_pins
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete admin pins
CREATE POLICY "admin_pins_delete_policy" ON admin_pins
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ADMIN_USERS POLICIES
-- =====================================================

-- Only admins can view admin users
CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT
  USING (public.is_admin());

-- Only admins can insert new admin users
CREATE POLICY "admin_users_insert_policy" ON admin_users
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update admin users
CREATE POLICY "admin_users_update_policy" ON admin_users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete admin users
CREATE POLICY "admin_users_delete_policy" ON admin_users
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- AUDIT_LOGS POLICIES
-- =====================================================

-- Only admins can view audit logs (read-only)
CREATE POLICY "audit_logs_select_policy" ON audit_logs
  FOR SELECT
  USING (public.is_admin());

-- System can insert audit logs (for logging purposes)
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- Allow system to insert logs

-- No updates or deletes allowed on audit logs (immutable)
-- This ensures audit trail integrity

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- Admin tables are now secured with the following rules:
-- 1. admin_pins: Full CRUD access only for admins
-- 2. admin_users: Full CRUD access only for admins
-- 3. audit_logs: Read-only for admins, insert-only for system
-- 4. All policies use the auth.is_admin() helper function
-- 5. Proper error handling is built into the helper functions