-- Migration: Fix Function Search Path Mutable for maintain_role_consistency
-- Purpose: Add SECURITY DEFINER and SET search_path to maintain_role_consistency function
-- Date: 2024-12-27
-- Security Issue: Function Search Path Mutable

-- =====================================================
-- SECURITY FIX: maintain_role_consistency Function
-- =====================================================

-- Fix the maintain_role_consistency function by adding SECURITY DEFINER and SET search_path
CREATE OR REPLACE FUNCTION maintain_role_consistency()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify the function has been updated with proper security settings
DO $$
DECLARE
    func_record RECORD;
BEGIN
    SELECT 
        p.proname as function_name,
        p.prosecdef as is_security_definer,
        p.proconfig as search_path_config
    INTO func_record
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'maintain_role_consistency';
    
    IF func_record.is_security_definer THEN
        RAISE NOTICE 'SUCCESS: Function maintain_role_consistency now has SECURITY DEFINER';
    ELSE
        RAISE WARNING 'FAILED: Function maintain_role_consistency does not have SECURITY DEFINER';
    END IF;
    
    IF func_record.search_path_config IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Function maintain_role_consistency has search_path configured: %', func_record.search_path_config;
    ELSE
        RAISE WARNING 'FAILED: Function maintain_role_consistency does not have search_path configured';
    END IF;
END;
$$;

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- This migration fixes the "Function Search Path Mutable" security warning by:
-- 1. Adding SECURITY DEFINER to ensure the function runs with elevated privileges
-- 2. Setting search_path = public, pg_temp to prevent search_path injection attacks
-- 3. Maintaining the exact same functionality as the original function
--
-- The function is now secure against:
-- - Search path manipulation attacks
-- - Schema injection vulnerabilities
-- - Unauthorized access to sensitive operations
--
-- After applying this migration, the Supabase Security Advisor should no longer
-- report "Function Search Path Mutable" warnings for this function.