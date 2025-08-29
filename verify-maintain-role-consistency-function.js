// Verification script for maintain_role_consistency function security fix
// This script checks if the function has proper SECURITY DEFINER and search_path settings

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment or use provided values
const supabaseUrl = process.env.SUPABASE_URL || 'https://hnqkqjqjvjqjqjqjqjqj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMaintainRoleConsistencyFunction() {
  try {
    console.log('🔍 Verifying maintain_role_consistency function security settings...');
    
    // Check the function's security settings using the custom RPC
    const { data, error } = await supabase.rpc('check_mutable_search_path_functions');
    
    if (error) {
      console.error('❌ Error checking function:', error);
      return;
    }
    
    // Find the maintain_role_consistency function in the results
    const maintainRoleFunction = data.find(func => 
      func.function_name === 'maintain_role_consistency'
    );
    
    if (!maintainRoleFunction) {
      console.log('ℹ️  Function maintain_role_consistency not found in SECURITY DEFINER functions list');
      console.log('This might mean it\'s not a SECURITY DEFINER function or doesn\'t exist.');
      return;
    }
    
    console.log('\n📋 Function Details:');
    console.log(`Function Name: ${maintainRoleFunction.function_name}`);
    console.log(`Security Definer: ${maintainRoleFunction.security_definer}`);
    console.log(`Has search_path: ${maintainRoleFunction.has_search_path}`);
    console.log(`Current search_path: ${maintainRoleFunction.current_search_path}`);
    console.log(`Recommendation: ${maintainRoleFunction.recommendation}`);
    
    // Verify the fix
    if (maintainRoleFunction.security_definer && maintainRoleFunction.has_search_path) {
      if (maintainRoleFunction.current_search_path.includes('public, pg_temp')) {
        console.log('\n✅ SUCCESS: Function maintain_role_consistency is properly secured!');
        console.log('   - Has SECURITY DEFINER: ✓');
        console.log('   - Has search_path set: ✓');
        console.log('   - Uses secure search_path (public, pg_temp): ✓');
      } else {
        console.log('\n⚠️  WARNING: Function has search_path but not the recommended value');
        console.log(`   Current: ${maintainRoleFunction.current_search_path}`);
        console.log('   Expected: search_path=public, pg_temp');
      }
    } else {
      console.log('\n❌ ISSUE: Function maintain_role_consistency still has security issues:');
      if (!maintainRoleFunction.security_definer) {
        console.log('   - Missing SECURITY DEFINER');
      }
      if (!maintainRoleFunction.has_search_path) {
        console.log('   - Missing search_path setting');
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the verification
verifyMaintainRoleConsistencyFunction();