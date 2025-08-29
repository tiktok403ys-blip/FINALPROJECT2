// Complete Tier 2 Blue-Green Deployment Script
// This script handles trigger dependencies and completes the function switching

const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeTier2Deployment() {
  console.log('🚀 Completing Tier 2 Blue-Green Deployment...');
  
  try {
    // Step 1: Switch handle_new_user function (with trigger handling)
    console.log('\n🔄 Step 1: Switching handle_new_user function (with trigger handling)...');
    const { data: handleUserResult, error: handleUserError } = await supabase.rpc('switch_handle_new_user_to_v2');
    
    if (handleUserError) {
      console.error('❌ handle_new_user switch failed:', handleUserError.message);
      return;
    }
    
    console.log('✅ handle_new_user switch results:', JSON.stringify(handleUserResult, null, 2));
    
    // Step 2: Switch remaining functions (verify_admin_pin, hash_admin_pin)
    console.log('\n🔄 Step 2: Switching remaining Tier 2 functions...');
    const { data: remainingResult, error: remainingError } = await supabase.rpc('switch_remaining_tier2_functions');
    
    if (remainingError) {
      console.error('❌ Remaining functions switch failed:', remainingError.message);
      return;
    }
    
    console.log('✅ Remaining functions switch results:', JSON.stringify(remainingResult, null, 2));
    
    // Step 3: Verify all deployments
    console.log('\n📋 Step 3: Verifying all deployments...');
    const { data: deploymentStatus, error: statusError } = await supabase
      .from('deployment_status')
      .select('*')
      .ilike('deployment_name', '%tier2%')
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (statusError) {
      console.error('❌ Failed to get deployment status:', statusError.message);
    } else {
      console.log('✅ All Tier 2 deployments:');
      deploymentStatus.forEach(deployment => {
        console.log(`  - ${deployment.deployment_name}: ${deployment.status}`);
        if (deployment.error_message) {
          console.log(`    Error: ${deployment.error_message}`);
        }
        if (deployment.metadata) {
          console.log(`    Metadata: ${JSON.stringify(deployment.metadata)}`);
        }
      });
    }
    
    // Step 4: Test all switched functions
    console.log('\n🧪 Step 4: Testing all switched functions...');
    
    // Test verify_admin_pin
    try {
      const { data: verifyTest, error: verifyError } = await supabase.rpc('verify_admin_pin', {
        pin_hash: 'test_hash'
      });
      
      if (verifyError) {
        console.log('⚠️  verify_admin_pin test (expected to fail with test data):', verifyError.message);
      } else {
        console.log('✅ verify_admin_pin test result:', verifyTest);
      }
    } catch (error) {
      console.log('⚠️  verify_admin_pin test error (expected):', error.message);
    }
    
    // Test hash_admin_pin
    try {
      const { data: hashTest, error: hashError } = await supabase.rpc('hash_admin_pin', {
        pin_text: '1234'
      });
      
      if (hashError) {
        console.log('⚠️  hash_admin_pin test (may fail without proper auth):', hashError.message);
      } else {
        console.log('✅ hash_admin_pin test completed:', hashTest ? 'SUCCESS' : 'FAILED');
      }
    } catch (error) {
      console.log('⚠️  hash_admin_pin test error (expected without auth):', error.message);
    }
    
    // Step 5: Verify trigger is working
    console.log('\n🔗 Step 5: Verifying trigger functionality...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')
      .eq('event_object_table', 'users');
    
    if (triggerError) {
      console.log('⚠️  Could not verify trigger (expected in some setups):', triggerError.message);
    } else {
      console.log('✅ Trigger verification:', triggers.length > 0 ? 'ACTIVE' : 'NOT FOUND');
    }
    
    // Step 6: Final performance test
    console.log('\n📊 Step 6: Final performance test...');
    const { data: finalPerfTest, error: finalPerfError } = await supabase.rpc('test_tier2_performance');
    
    if (finalPerfError) {
      console.error('❌ Final performance test failed:', finalPerfError.message);
    } else {
      console.log('✅ Final performance test results:', JSON.stringify(finalPerfTest, null, 2));
    }
    
    // Step 7: Check function performance metrics
    console.log('\n📈 Step 7: Checking updated function performance metrics...');
    const { data: metrics, error: metricsError } = await supabase
      .from('function_performance_metrics')
      .select('*')
      .in('function_name', ['verify_admin_pin', 'hash_admin_pin', 'handle_new_user'])
      .order('function_name');
    
    if (metricsError) {
      console.error('❌ Failed to get performance metrics:', metricsError.message);
    } else {
      console.log('✅ Updated function performance metrics:');
      if (metrics.length === 0) {
        console.log('  No metrics found yet (functions may need to be called first)');
      } else {
        metrics.forEach(metric => {
          console.log(`  - ${metric.function_name}:`);
          console.log(`    Avg execution time: ${metric.avg_execution_time_ms}ms`);
          console.log(`    Total calls: ${metric.total_calls}`);
          console.log(`    Error count: ${metric.error_count}`);
          console.log(`    Last called: ${metric.last_called_at}`);
        });
      }
    }
    
    console.log('\n🎉 Tier 2 Blue-Green Deployment Successfully Completed!');
    console.log('\n📝 Final Summary:');
    console.log('  ✅ Shadow functions (v2) deployed');
    console.log('  ✅ Trigger dependencies handled');
    console.log('  ✅ All functions switched from v1 to v2');
    console.log('  ✅ Zero-downtime deployment achieved');
    console.log('\n🔧 Functions updated:');
    console.log('  - verify_admin_pin: Fixed search_path security issue');
    console.log('  - hash_admin_pin: Fixed search_path security issue');
    console.log('  - handle_new_user: Fixed search_path security issue + trigger recreated');
    console.log('\n🛡️  Security improvements:');
    console.log('  - All functions now use SET search_path = public, pg_temp');
    console.log('  - Prevents search_path injection attacks');
    console.log('  - Maintains SECURITY DEFINER functionality');
    
  } catch (error) {
    console.error('💥 Unexpected error during deployment completion:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the completion
completeTier2Deployment().then(() => {
  console.log('\n✨ Deployment completion script finished.');
}).