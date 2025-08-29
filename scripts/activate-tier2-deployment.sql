-- Activate Tier 2 Blue-Green Deployment
-- This script switches traffic from v1 to v2 functions
-- Execute this after confirming shadow functions are working properly

-- Step 1: Test shadow functions performance first
SELECT public.test_tier2_performance();

-- Step 2: Switch to v2 functions (Blue-Green deployment)
SELECT public.switch_to_tier2_v2();

-- Step 3: Verify deployment status
SELECT 
    deployment_name,
    status,
    started_at,
    completed_at,
    error_message,
    metadata
FROM public.deployment_status 
WHERE deployment_name LIKE 'tier2%'
ORDER BY started_at DESC
LIMIT 5;

-- Step 4: Test the switched functions
DO $$
DECLARE
    test_result boolean;
    hash_result text;
BEGIN
    -- Test verify_admin_pin (now pointing to v2)
    SELECT public.verify_admin_pin('test_hash') INTO test_result;
    RAISE NOTICE 'verify_admin_pin test result: %', test_result;
    
    -- Test hash_admin_pin (now pointing to v2)
    SELECT public.hash_admin_pin('1234') INTO hash_result;
    RAISE NOTICE 'hash_admin_pin test completed: %', CASE WHEN hash_result IS NOT NULL THEN 'SUCCESS' ELSE 'FAILED' END;
END $$;

-- Step 5: Check function performance metrics
SELECT 
    function_name,
    avg_execution_time_ms,
    total_calls,
    error_count,
    last_called_at
FROM public.function_performance_metrics 
WHERE function_name IN ('verify_admin_pin', 'hash_admin_pin', 'handle_new_user')
ORDER BY function_name;