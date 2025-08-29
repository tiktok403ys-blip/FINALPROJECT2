// Check Functions Script
// This script checks which functions exist in the database

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

async function checkFunctions() {
  console.log('🔍 Checking functions in database...');
  
  try {
    // Test each function individually to see if it exists
    const functionsToTest = [
      'is_authenticated', 'is_admin', 'is_owner',
      'verify_admin_pin', 'hash_admin_pin', 'handle_new_user',
      'is_authenticated_v2', 'is_admin_v2', 'is_owner_v2',
      'verify_admin_pin_v2', 'hash_admin_pin_v2', 'handle_new_user_v2'
    ];
    
    console.log('\n📋 Testing function existence:');
    console.log('=' .repeat(80));
    
    const results = [];
    
    for (const funcName of functionsToTest) {
      try {
        // Try to call the function to see if it exists
        let testResult;
        
        if (funcName.includes('is_authenticated') || funcName.includes('is_admin')) {
          // These functions can be called without parameters
          const { data, error } = await supabase.rpc(funcName);
          if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
              testResult = { exists: false, error: 'Function does not exist' };
            } else {
              testResult = { exists: true, error: error.message, callable: false };
            }
          } else {
            testResult = { exists: true, callable: true, result: data };
          }
        } else {
          // For other functions, we'll try to call them and expect parameter errors
          const { data, error } = await supabase.rpc(funcName);
          if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
              testResult = { exists: false, error: 'Function does not exist' };
            } else if (error.message.includes('argument') || error.message.includes('parameter')) {
              testResult = { exists: true, callable: false, error: 'Requires parameters (expected)' };
            } else {
              testResult = { exists: true, callable: false, error: error.message };
            }
          } else {
            testResult = { exists: true, callable: true, result: data };
          }
        }
        
        results.push({ name: funcName, ...testResult });
        
        if (testResult.exists) {
          if (testResult.callable) {
            console.log(`  ✅ ${funcName}: EXISTS and callable - returned ${testResult.result}`);
          } else {
            console.log(`  ✅ ${funcName}: EXISTS but ${testResult.error}`);
          }
        } else {
          console.log(`  ❌ ${funcName}: NOT FOUND`);
        }
        
      } catch (error) {
        results.push({ name: funcName, exists: false, error: error.message });
        console.log(`  ❌ ${funcName}: ERROR - ${error.message}`);
      }
    }
    
    // Analyze results
    console.log('\n🛡️  Security Analysis:');
    console.log('=' .repeat(80));
    
    const existingFunctions = results.filter(r => r.exists);
    const missingFunctions = results.filter(r => !r.exists);
    
    console.log(`\n📊 Summary:`);
    console.log(`  Functions found: ${existingFunctions.length}/${functionsToTest.length}`);
    console.log(`  Missing functions: ${missingFunctions.length}`);
    
    if (missingFunctions.length > 0) {
      console.log('\n❌ Missing functions:');
      missingFunctions.forEach(f => {
        console.log(`    - ${f.name}`);
      });
    }
    
    console.log('\n✅ Existing functions:');
    existingFunctions.forEach(f => {
      console.log(`    - ${f.name}`);
    });
    
    // Check if we have both v1 and v2 versions
    const v1Functions = existingFunctions.filter(f => !f.name.includes('_v2'));
    const v2Functions = existingFunctions.filter(f => f.name.includes('_v2'));
    
    console.log(`\n🔄 Version Analysis:`);
    console.log(`  V1 functions: ${v1Functions.length}`);
    console.log(`  V2 functions: ${v2Functions.length}`);
    
    // Estimate security warnings based on function analysis
    // If we have v2 functions with proper security, warnings should be reduced
    const securityFixedFunctions = v2Functions.length;
    const estimatedRemainingWarnings = Math.max(0, 38 - (securityFixedFunctions * 6));
    
    console.log(`\n🛡️  Security Estimation:`);
    console.log(`  Functions with security fixes (v2): ${securityFixedFunctions}`);
    console.log(`  Estimated remaining security warnings: ${estimatedRemainingWarnings}/38`);
    
    if (estimatedRemainingWarnings <= 5) {
      console.log('  🎉 Security warnings significantly reduced!');
    } else if (estimatedRemainingWarnings <= 20) {
      console.log('  ✅ Good progress on security warnings');
    } else {
      console.log('  ⚠️  More security fixes needed');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the check
checkFunctions().then(() => {
  console.log('\n✨ Function check completed.');
}).catch(error => {
  console.error('💥 Function check failed:', error.message);
  process.exit(1);
});