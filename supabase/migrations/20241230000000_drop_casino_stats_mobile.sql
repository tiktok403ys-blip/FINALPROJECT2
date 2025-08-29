-- Migration: Drop casino_stats_mobile materialized view and all related references
-- This migration removes the casino_stats_mobile materialized view that was used for caching casino statistics
-- All functionality will now use direct queries to the casinos table for real-time data

-- Drop indexes on casino_stats_mobile (if they exist)
DROP INDEX IF EXISTS idx_casino_stats_mobile_casino_id;
DROP INDEX IF EXISTS idx_casino_stats_mobile_created_at;

-- Revoke all permissions on casino_stats_mobile
REVOKE ALL ON casino_stats_mobile FROM public;
REVOKE ALL ON casino_stats_mobile FROM authenticated;
REVOKE ALL ON casino_stats_mobile FROM anon;

-- Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS casino_stats_mobile;

-- Add comment for documentation
COMMENT ON SCHEMA public IS 'Removed casino_stats_mobile materialized view - now using direct queries to casinos table for real-time data';