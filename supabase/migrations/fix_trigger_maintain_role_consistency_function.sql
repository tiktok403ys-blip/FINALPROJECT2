-- Migration: Fix Function Search Path Mutable for trigger_maintain_role_consistency
-- Purpose: Add SET search_path = public, pg_temp to trigger_maintain_role_consistency function
-- Security: Prevents search_path injection attacks
-- Date: 2024-12-28

-- Fix the trigger_maintain_role_consistency function by adding immutable search_path
CREATE OR REPLACE FUNCTION trigger_maintain_role_consistency()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- Security: Immutable search_path prevents injection attacks
AS $$
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
$$;

-- Verification: Check that the function now has immutable search_path
DO $$
DECLARE
    func_config text[];
BEGIN
    SELECT proconfig INTO func_config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'trigger_maintain_role_consistency';
    
    IF func_config IS NOT NULL AND 'search_path=public,pg_temp' = ANY(func_config) THEN
        RAISE NOTICE 'SUCCESS: trigger_maintain_role_consistency now has immutable search_path';
    ELSE
        RAISE WARNING 'WARNING: trigger_maintain_role_consistency search_path may not be set correctly';
    END IF;
END $$;

-- Security comment
-- This migration fixes the "Function Search Path Mutable" security warning by:
-- 1. Adding SET search_path = public, pg_temp to the function definition
-- 2. Ensuring the function cannot be exploited via search_path injection
-- 3. Maintaining deterministic behavior across different execution contexts

COMMIT;