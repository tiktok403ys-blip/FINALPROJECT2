-- Query untuk mengidentifikasi kebijakan permissive ganda
-- Mencari tabel dengan 4+ kebijakan permissive untuk peran yang sama

-- 1. Hitung jumlah kebijakan per tabel dan peran
SELECT 
    '=== POLICY COUNT BY TABLE AND ROLE ===' as section,
    schemaname,
    tablename,
    UNNEST(roles) as role_name,
    cmd as operation,
    permissive,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, UNNEST(roles), cmd, permissive
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename, role_name, cmd;

-- 2. Identifikasi tabel dengan kebijakan permissive ganda (4+ kebijakan)
WITH policy_counts AS (
    SELECT 
        schemaname,
        tablename,
        UNNEST(roles) as role_name,
        cmd as operation,
        permissive,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename, UNNEST(roles), cmd, permissive
)
SELECT 
    '=== TABLES WITH EXCESSIVE PERMISSIVE POLICIES ===' as section,
    schemaname,
    tablename,
    role_name,
    operation,
    permissive,
    policy_count,
    CASE 
        WHEN policy_count >= 4 THEN 'HIGH PRIORITY - Consolidate immediately'
        WHEN policy_count >= 3 THEN 'MEDIUM PRIORITY - Consider consolidating'
        ELSE 'LOW PRIORITY'
    END as priority
FROM policy_counts
WHERE policy_count >= 3
    AND permissive = 'PERMISSIVE'
ORDER BY policy_count DESC, tablename;

-- 3. Detail kebijakan untuk tabel dengan masalah permissive ganda
WITH problematic_tables AS (
    SELECT DISTINCT
        tablename,
        UNNEST(roles) as role_name,
        cmd as operation
    FROM pg_policies
    WHERE schemaname = 'public'
        AND permissive = 'PERMISSIVE'
    GROUP BY tablename, UNNEST(roles), cmd
    HAVING COUNT(*) >= 3
)
SELECT 
    '=== DETAILED POLICIES FOR PROBLEMATIC TABLES ===' as section,
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check,
    'DROP POLICY IF EXISTS "' || p.policyname || '" ON public.' || p.tablename || ';' as drop_command
FROM pg_policies p
JOIN problematic_tables pt ON p.tablename = pt.tablename 
    AND p.cmd = pt.operation
    AND pt.role_name = ANY(p.roles)
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.cmd, p.policyname;

-- 4. Analisis kebijakan yang bisa dikonsolidasikan
WITH policy_analysis AS (
    SELECT 
        tablename,
        cmd,
        roles,
        qual,
        with_check,
        COUNT(*) OVER (PARTITION BY tablename, cmd, roles) as same_role_policies,
        COUNT(*) OVER (PARTITION BY tablename, cmd, qual) as same_qual_policies,
        ROW_NUMBER() OVER (PARTITION BY tablename, cmd, roles ORDER BY policyname) as rn
    FROM pg_policies
    WHERE schemaname = 'public'
        AND permissive = 'PERMISSIVE'
)
SELECT 
    '=== CONSOLIDATION OPPORTUNITIES ===' as section,
    tablename,
    cmd as operation,
    roles,
    same_role_policies,
    same_qual_policies,
    CASE 
        WHEN same_role_policies > 1 AND same_qual_policies > 1 THEN 'Can merge identical policies'
        WHEN same_role_policies > 1 THEN 'Can consolidate with OR logic'
        ELSE 'Review manually'
    END as consolidation_strategy,
    qual,
    with_check
FROM policy_analysis
WHERE same_role_policies > 1
ORDER BY same_role_policies DESC, tablename;

-- 5. Generate contoh konsolidasi untuk admin_pins (berdasarkan laporan)
SELECT 
    '=== ADMIN_PINS CONSOLIDATION EXAMPLE ===' as section,
    'Current policies:' as step,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'admin_pins'
    AND permissive = 'PERMISSIVE'
ORDER BY cmd, policyname;

-- 6. Hitung total kebijakan yang bisa dikonsolidasikan
WITH consolidation_candidates AS (
    SELECT 
        tablename,
        cmd,
        roles,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND permissive = 'PERMISSIVE'
    GROUP BY tablename, cmd, roles
    HAVING COUNT(*) > 1
)
SELECT 
    '=== CONSOLIDATION SUMMARY ===' as section,
    COUNT(DISTINCT tablename) as tables_with_duplicate_policies,
    COUNT(*) as total_policy_groups_to_consolidate,
    SUM(policy_count) as total_policies_involved,
    SUM(policy_count - 1) as policies_that_can_be_removed
FROM consolidation_candidates;

-- 7. Identifikasi tabel dengan kebijakan RESTRICTIVE yang mungkin konflik
SELECT 
    '=== RESTRICTIVE POLICIES ANALYSIS ===' as section,
    schemaname,
    tablename,
    COUNT(*) as restrictive_policy_count,
    array_agg(policyname) as restrictive_policies
FROM pg_policies
WHERE schemaname = 'public'
    AND permissive = 'RESTRICTIVE'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 1
ORDER BY restrictive_policy_count DESC;

-- 8. Rekomendasi prioritas berdasarkan kompleksitas
WITH policy_roles AS (
    SELECT DISTINCT
        tablename,
        UNNEST(roles) as role_name
    FROM pg_policies
    WHERE schemaname = 'public'
),
policy_complexity AS (
    SELECT 
        p.tablename,
        COUNT(*) as total_policies,
        COUNT(CASE WHEN p.permissive = 'PERMISSIVE' THEN 1 END) as permissive_count,
        COUNT(CASE WHEN p.permissive = 'RESTRICTIVE' THEN 1 END) as restrictive_count,
        COUNT(DISTINCT p.cmd) as operation_types,
        (SELECT COUNT(DISTINCT pr.role_name) FROM policy_roles pr WHERE pr.tablename = p.tablename) as role_count
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    GROUP BY p.tablename
)
SELECT 
    '=== OPTIMIZATION PRIORITY ===' as section,
    tablename,
    total_policies,
    permissive_count,
    restrictive_count,
    operation_types,
    role_count,
    CASE 
        WHEN permissive_count >= 8 THEN 'CRITICAL - Immediate attention'
        WHEN permissive_count >= 5 THEN 'HIGH - Schedule soon'
        WHEN permissive_count >= 3 THEN 'MEDIUM - Plan optimization'
        ELSE 'LOW - Monitor'
    END as priority_level
FROM policy_complexity
WHERE total_policies > 2
ORDER BY permissive_count DESC, total_policies DESC;