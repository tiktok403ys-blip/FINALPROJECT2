-- Migration: Fix Function Search Path Mutable for update_admin_pins_updated_at
-- Created: 2024-12-28
-- Purpose: Add SECURITY DEFINER and SET search_path to update_admin_pins_updated_at function
--          to fix Function Search Path Mutable security warning

-- =====================================================
-- SECURITY WARNING FIX: Function Search Path Mutable
-- =====================================================

-- Function: update_admin_pins_updated_at
-- Issue: Function has mutable search_path which can lead to security vulnerabilities
-- Fix: Add SECURITY DEFINER and SET search_path = public, pg_temp

CREATE OR REPLACE FUNCTION update_admin_pins_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the function has been updated with proper security settings
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    p.prosecdef as is_security_definer,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_admin_pins_updated_at'
  AND n.nspname = 'public';

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- This function now has:
-- 1. SECURITY DEFINER: Function runs with privileges of the function owner
-- 2. SET search_path = public, pg_temp: Immutable search path prevents injection attacks
-- 3. Only accesses objects in public schema and temporary schema

-- The function is safe from search_path injection attacks and maintains
-- consistent behavior regardless of the caller's search_path settings.

SELECT 'update_admin_pins_updated_at function security fix completed' as status;