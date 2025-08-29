-- Migration: Stats Security Policies
-- Created: 2024-01-17
-- Purpose: DEPRECATED - Originally created security policies for casino_stats_mobile table
-- Status: casino_stats_mobile materialized view has been removed
-- Reason: Replaced with direct queries to casinos table for real-time data

-- =====================================================
-- MIGRATION STATUS
-- =====================================================

-- This migration file is kept for historical reference only
-- All casino_stats_mobile related functionality has been removed
-- Applications now use direct queries to the casinos table
-- Performance is maintained through proper indexing on the casinos table

-- =====================================================
-- REMOVED COMPONENTS
-- =====================================================

-- The following components were removed in migration 20241230000000_drop_casino_stats_mobile.sql:
-- 1. casino_stats_mobile materialized view
-- 2. idx_casino_stats_mobile_casino_id index
-- 3. idx_casino_stats_mobile_created_at index
-- 4. All GRANT permissions on casino_stats_mobile

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- Casino stats table is now secured with the following rules:
-- 1. Public read access for both authenticated and anonymous users
-- 2. Only admins can modify (insert/update/delete) casino stats
-- 3. All modifications are logged to audit_logs table
-- 4. Performance indexes added for common query patterns
-- 5. Error handling ensures operations continue even if logging fails
-- 6. This allows public access to casino statistics while maintaining data integrity