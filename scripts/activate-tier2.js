// Activate Tier 2 Blue-Green Deployment Script
// This script switches traffic from v1 to v2 functions using Supabase client

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

async function activateTier2Deployment() {
  console.log('🚀 Starting Tier 2 Blue-Green Deployment Activation...');
  
  try {
    // Step 1: Test shadow functions performance
    console.log('\n📊 Step 1: Testing shadow functions performance...');
    const { data: perfTest, error: perfError } = await supabase.rpc('test_tier2_performance');
    
    if (perfError) {
      console.error('❌ Performance test failed:', perfError.message);
      return;
    }
    
    console.log('✅ Performance test results:', JSON.stringify(perfTest, null, 2));
    
    // Step 2: Switch to v2 functions (Blue-Green deployment)
    console.log('\n🔄 Step 2: Switching to v2 functions...');
    const { data: switchResult, error: switchError } = await supabase.rpc('switch_to_tier2_v2');
    
    if (switchError) {
      console.error('❌ Function switch failed:', switchError.message);
      return;
    }
    
    console.log('✅ Function switch results:', JSON.stringify(switchResult, null, 2));
    
    // Step 3: Verify deployment status
    console.log('\n📋 Step 3: Verifying deployment status...');
    const { data: deploymentStatus, error: statusError } = await supabase
      .from('deployment_status')
      .select('*')
      .ilike('deployment_name', 'tier2%')
      .order('started_at', { ascending: false })
      .limit(5);
    
    if (statusError) {
      console.error('❌ Failed to get deployment status:', statusError.message);
    } else {
      console.log('✅ Recent Tier 2 deployments:');
      deploymentStatus.forEach(deployment => {
        console.log(`  - ${deployment.deployment_name}: ${deployment.status}`);
        if (deployment.error_message) {
          console.log(`    Error: ${deployment.error_message}`);
        }
      });
    }
    
    // Step 4: Test the switched functions
    console.log('\n🧪 Step 4: Testing switched functions...');
    
    // Test verify_admin_pin
    const { data: verifyTest, error: verifyError } = await supabase.rpc('verify_admin_pin', {
      pin_hash: 'test_hash'
    });
    
    if (verifyError) {
      console.log('⚠️  verify_admin_pin test (expected to fail with test data):', verifyError.message);
    } else {
      console.log('✅ verify_admin_pin test result:', verifyTest);
    }
    
    // Test hash_admin_pin
    const { data: hashTest, error: hashError } = await supabase.rpc('hash_admin_pin', {
      pin_text: '1234'
    });
    
    if (hashError) {
      console.log('⚠️  hash_admin_pin test (may fail without proper auth):', hashError.message);
    } else {
      console.log('✅ hash_admin_pin test completed:', hashTest ? 'SUCCESS' : 'FAILED');
    }
    
    // Step 5: Check function performance metrics
    console.log('\n📈 Step 5: Checking function performance metrics...');
    const { data: metrics, error: metricsError } = await supabase
      .from('function_performance_metrics')
      .select('*')
      .in('function_name', ['verify_admin_pin', 'hash_admin_pin', 'handle_new_user'])
      .order('function_name');
    
    if (metricsError) {
      console.error('❌ Failed to get performance metrics:', metricsError.message);
    } else {
      console.log('✅ Function performance metrics:');
      metrics.forEach(metric => {
        console.log(`  - ${metric.function_name}:`);
        console.log(`    Avg execution time: ${metric.avg_execution_time_ms}ms`);
        console.log(`    Total calls: ${metric.total_calls}`);
        console.log(`    Error count: ${metric.error_count}`);
        console.log(`    Last called: ${metric.last_called_at}`);
      });
    }
    
    console.log('\n🎉 Tier 2 Blue-Green Deployment Activation Completed!');
    console.log('\n📝 Summary:');
    console.log('  - Shadow functions (v2) have been deployed');
    console.log('  - Traffic has been switched from v1 to v2 functions');
    console.log('  - Functions affected: verify_admin_pin, hash_admin_pin, handle_new_user');
    console.log('  - Deployment strategy: Blue-Green (zero downtime)');
    
  } catch (error) {
    console.error('💥 Unexpected error during deployment:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the activation
activateTier2Deployment().then(() => {
  console.log('\n✨ Script execution completed.');
}).catch(error => {
  console.error('💥 Script execution failed:', error.message);
  process.exit(1);
});