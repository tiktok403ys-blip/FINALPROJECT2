-- Test profile_rpc_v5 function after type mismatch fix
-- This should now work without error 400

-- Test 1: Get user ID for casinogurusg404@gmail.com
SELECT 
    'Getting user ID:' as test_step,
    id as user_id,
    email
FROM auth.users 
WHERE email = 'casinogurusg404@gmail.com';

-- Test 2: Test profile_rpc_v5 with the user ID
DO $$
DECLARE
    test_user_id UUID;
    rpc_result RECORD;
BEGIN
    -- Get user ID
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'casinogurusg404@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testing profile_rpc_v5 for user: %', test_user_id;
        
        -- Test the RPC function
        BEGIN
            SELECT * INTO rpc_result FROM profile_rpc_v5(test_user_id);
            
            RAISE NOTICE '✅ profile_rpc_v5 SUCCESS!';
            RAISE NOTICE 'Result - ID: %, Email: %, Role: %, Is Admin: %', 
                rpc_result.id, rpc_result.email, rpc_result.role, rpc_result.is_admin;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ profile_rpc_v5 FAILED with error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ User casinogurusg404@gmail.com not found';
    END IF;
END $$;

-- Test 3: Test with a generic query to see the function structure
SELECT 
    'Function test result:' as test_step,
    *
FROM profile_rpc_v5((SELECT id FROM auth.users WHERE email = 'casinogurusg404@gmail.com' LIMIT 1));

-- Test 4: Verify data types are consistent
SELECT 
    'Data type verification:' as test_step,
    pg_typeof(au.role) as admin_users_role_type,
    pg_typeof(p.role) as profiles_role_type
FROM admin_users au
JOIN profiles p ON au.user_id = p.id
LIMIT 1;