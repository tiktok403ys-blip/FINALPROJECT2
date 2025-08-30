-- =====================================================
-- MIGRATION VALIDATION AND TESTING SCRIPT
-- =====================================================
-- This script validates the comprehensive performance optimization migration
-- Run this BEFORE applying the main migration to understand current state
-- Run this AFTER applying the migration to verify improvements
-- =====================================================

-- =====================================================
-- PRE-MIGRATION VALIDATION
-- =====================================================

-- 1. Count current foreign keys without indexes
SELECT 
    '=== PRE-MIGRATION: FOREIGN KEYS WITHOUT INDEXES ===' as section,
    COUNT(*) as foreign_keys_without_indexes
FROM (
    SELECT DISTINCT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_indexes pi
            WHERE pi.tablename = tc.table_name
                AND pi.schemaname = 'public'
                AND pi.indexdef LIKE '%(' || kcu.column_name || ')%'
        )
) fk_without_idx;

-- 2. Count current unused indexes
SELECT 
    '=== PRE-MIGRATION: UNUSED INDEXES ===' as section,
    COUNT(*) as unused_indexes_count,
    SUM(pg_relation_size(indexrelid)) as total_unused_size_bytes,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_unused_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey';

-- 3. Count problematic RLS policies
SELECT 
    '=== PRE-MIGRATION: PROBLEMATIC RLS POLICIES ===' as section,
    COUNT(*) as policies_with_per_row_functions
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR 
         qual LIKE '%current_setting(%')
    AND qual NOT LIKE '%(SELECT auth.uid())%'
    AND qual NOT LIKE '%(SELECT current_setting%';

-- 4. Count duplicate permissive policies
SELECT 
    '=== PRE-MIGRATION: DUPLICATE PERMISSIVE POLICIES ===' as section,
    COUNT(*) as tables_with_multiple_permissive_policies
FROM (
    SELECT 
        schemaname,
        tablename,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND permissive = 'PERMISSIVE'
    GROUP BY schemaname, tablename, cmd
    HAVING COUNT(*) >= 3
) multi_policies;

-- 5. Identify duplicate indexes
SELECT 
    '=== PRE-MIGRATION: DUPLICATE INDEXES ===' as section,
    COUNT(*) as duplicate_index_groups,
    SUM(count - 1) as indexes_to_drop
FROM (
    SELECT 
        indexdef,
        COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY indexdef
    HAVING COUNT(*) > 1
) duplicates;

-- 6. Count inefficient indexes
SELECT 
    '=== PRE-MIGRATION: INEFFICIENT INDEXES ===' as section,
    COUNT(*) as inefficient_indexes_count,
    SUM(pg_relation_size(indexrelid)) as total_inefficient_size_bytes,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_inefficient_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND indexrelname NOT LIKE '%_pkey'
    AND (
        idx_scan < 10 OR
        (idx_scan > 0 AND idx_scan < 100 AND pg_relation_size(indexrelid) > 1048576) -- > 1MB
    );

-- =====================================================
-- BACKUP VERIFICATION
-- =====================================================

-- 7. List all indexes that will be affected
SELECT 
    '=== INDEXES TO BE MODIFIED/DROPPED ===' as section,
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED - TO DROP'
        WHEN idx_scan < 10 THEN 'INEFFICIENT - TO DROP'
        ELSE 'TO REVIEW'
    END as action
FROM pg_indexes pi
JOIN pg_stat_user_indexes psi ON psi.indexrelname = pi.indexname
WHERE pi.schemaname = 'public'
    AND pi.indexname NOT LIKE '%_pkey'
    AND (psi.idx_scan = 0 OR psi.idx_scan < 10)
ORDER BY pg_relation_size(pi.indexname::regclass) DESC;

-- 8. List all RLS policies that will be modified
SELECT 
    '=== RLS POLICIES TO BE MODIFIED ===' as section,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'AUTH.UID() OPTIMIZATION NEEDED'
        WHEN qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting%' THEN 'CURRENT_SETTING() OPTIMIZATION NEEDED'
        ELSE 'OTHER'
    END as optimization_type
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR qual LIKE '%current_setting(%')
ORDER BY tablename, policyname;

-- =====================================================
-- SAFETY CHECKS
-- =====================================================

-- 9. Check for active connections that might be affected
SELECT 
    '=== ACTIVE CONNECTIONS CHECK ===' as section,
    COUNT(*) as active_connections,
    COUNT(CASE WHEN state = 'active' THEN 1 END) as active_queries
FROM pg_stat_activity
WHERE datname = current_database()
    AND pid != pg_backend_pid();

-- 10. Check table sizes to estimate impact
SELECT 
    '=== TABLE SIZES FOR IMPACT ASSESSMENT ===' as section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- MIGRATION READINESS CHECKLIST
-- =====================================================

SELECT 
    '=== MIGRATION READINESS CHECKLIST ===' as section,
    'Check the following before proceeding:' as instructions,
    '1. Database backup completed' as step_1,
    '2. No critical active queries running' as step_2,
    '3. Maintenance window scheduled' as step_3,
    '4. Rollback plan prepared' as step_4,
    '5. Monitoring tools ready' as step_5;

-- =====================================================
-- POST-MIGRATION VALIDATION QUERIES
-- =====================================================
-- Run these queries AFTER applying the migration

/*
-- POST-MIGRATION VALIDATION (uncomment after migration)

-- Verify foreign keys now have indexes
SELECT 
    '=== POST-MIGRATION: FOREIGN KEYS WITH INDEXES ===' as section,
    COUNT(*) as foreign_keys_with_indexes
FROM (
    SELECT DISTINCT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND EXISTS (
            SELECT 1 FROM pg_indexes pi
            WHERE pi.tablename = tc.table_name
                AND pi.schemaname = 'public'
                AND pi.indexdef LIKE '%(' || kcu.column_name || ')%'
        )
) fk_with_idx;

-- Verify unused indexes are removed
SELECT 
    '=== POST-MIGRATION: REMAINING UNUSED INDEXES ===' as section,
    COUNT(*) as remaining_unused_indexes
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey';

-- Verify RLS policies are optimized
SELECT 
    '=== POST-MIGRATION: OPTIMIZED RLS POLICIES ===' as section,
    COUNT(*) as policies_with_subquery_optimization
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual LIKE '%(SELECT auth.uid())%' OR 
         qual LIKE '%(SELECT current_setting%');

-- Check for any remaining problematic policies
SELECT 
    '=== POST-MIGRATION: REMAINING PROBLEMATIC POLICIES ===' as section,
    COUNT(*) as remaining_problematic_policies
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR 
         qual LIKE '%current_setting(%')
    AND qual NOT LIKE '%(SELECT auth.uid())%'
    AND qual NOT LIKE '%(SELECT current_setting%';

-- Performance comparison
SELECT 
    '=== POST-MIGRATION: PERFORMANCE SUMMARY ===' as section,
    'Migration completed successfully' as status,
    'Monitor query performance over next 24-48 hours' as next_steps,
    'Run Performance Advisor again to verify improvements' as validation;
*/

-- =====================================================
-- ROLLBACK PREPARATION
-- =====================================================

-- Generate rollback script for indexes
SELECT 
    '=== ROLLBACK SCRIPT FOR INDEXES ===' as section,
    'Copy and save these commands for rollback:' as instructions;

-- Generate CREATE INDEX commands for indexes that will be dropped
SELECT 
    'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename || 
    ' (' || string_agg(column_name, ', ' ORDER BY ordinal_position) || ');' as rollback_command
FROM (
    SELECT DISTINCT
        pi.schemaname,
        pi.tablename,
        pi.indexname,
        ic.column_name,
        ic.ordinal_position
    FROM pg_indexes pi
    JOIN information_schema.statistics ic ON ic.table_name = pi.tablename 
        AND ic.index_name = pi.indexname
    JOIN pg_stat_user_indexes psi ON psi.indexrelname = pi.indexname
    WHERE pi.schemaname = 'public'
        AND pi.indexname NOT LIKE '%_pkey'
        AND psi.idx_scan = 0
) idx_cols
GROUP BY schemaname, tablename, indexname
ORDER BY indexname;

-- =====================================================
-- FINAL RECOMMENDATIONS
-- =====================================================

SELECT 
    '=== FINAL RECOMMENDATIONS ===' as section,
    'Before applying migration:' as phase_1,
    '1. Create full database backup' as rec_1,
    '2. Test in development environment first' as rec_2,
    '3. Schedule maintenance window' as rec_3,
    'After applying migration:' as phase_2,
    '4. Monitor query performance' as rec_4,
    '5. Run VACUUM ANALYZE on affected tables' as rec_5,
    '6. Check Performance Advisor in 24-48 hours' as rec_6;