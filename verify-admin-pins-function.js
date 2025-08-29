// Verify update_admin_pins_updated_at function security fix
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdminPinsFunction() {
  try {
    console.log('🔍 Verifying update_admin_pins_updated_at function security fix...');
    
    // Check the specific function
    const { data, error } = await supabase.rpc('check_mutable_search_path_functions');
    
    if (error) {
      console.error('❌ Error checking function:', error.message);
      return;
    }
    
    // Filter for update_admin_pins_updated_at function
    const adminPinsFunction = data.find(func => 
      func.function_name === 'update_admin_pins_updated_at'
    );
    
    if (!adminPinsFunction) {
      console.log('⚠️  Function update_admin_pins_updated_at not found in results');
      return;
    }
    
    console.log('\n📋 Function Details:');
    console.log(`Function: ${adminPinsFunction.function_name}`);
    console.log(`Schema: ${adminPinsFunction.schema_name}`);
    console.log(`Security Definer: ${adminPinsFunction.security_definer}`);
    console.log(`Has search_path: ${adminPinsFunction.has_search_path}`);
    console.log(`Current search_path: ${adminPinsFunction.current_search_path}`);
    console.log(`Recommendation: ${adminPinsFunction.recommendation}`);
    
    // Check if function is now secure
    if (adminPinsFunction.security_definer && 
        adminPinsFunction.has_search_path && 
        adminPinsFunction.current_search_path.includes('search_path=public, pg_temp')) {
      console.log('\n✅ SUCCESS: Function update_admin_pins_updated_at is now secure!');
      console.log('   - Has SECURITY DEFINER: ✓');
      console.log('   - Has immutable search_path: ✓');
      console.log('   - Protected from injection attacks: ✓');
    } else {
      console.log('\n❌ ISSUE: Function still has security concerns');
      if (!adminPinsFunction.security_definer) {
        console.log('   - Missing SECURITY DEFINER');
      }
      if (!adminPinsFunction.has_search_path) {
        console.log('   - Missing search_path setting');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyAdminPinsFunction();