// Complete verification script for all SECURITY DEFINER functions
// This script checks all functions for proper search_path settings

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://oypqykrfinmrvvsjfyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM0MTQ5OSwiZXhwIjoyMDcwOTE3NDk5fQ.Yvk5InaPs0Sw4c4s3wQW_U58cQ6nq2tVXkP3HaY_Erg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAllFunctionsSecurity() {
  try {
    console.log('🔍 Verifying all SECURITY DEFINER functions...');
    
    // Check all functions using the custom RPC
    const { data, error } = await supabase.rpc('check_mutable_search_path_functions');
    
    if (error) {
      console.error('❌ Error checking functions:', error);
      return;
    }
    
    console.log(`\n📊 Found ${data.length} SECURITY DEFINER functions`);
    
    let secureCount = 0;
    let vulnerableCount = 0;
    const vulnerableFunctions = [];
    
    // Analyze each function
    data.forEach(func => {
      if (func.has_search_path && func.current_search_path.includes('public, pg_temp')) {
        secureCount++;
      } else {
        vulnerableCount++;
        vulnerableFunctions.push(func);
      }
    });
    
    console.log(`\n📈 Security Summary:`);
    console.log(`✅ Secure functions: ${secureCount}`);
    console.log(`❌ Vulnerable functions: ${vulnerableCount}`);
    
    if (vulnerableCount > 0) {
      console.log('\n⚠️  Vulnerable Functions:');
      vulnerableFunctions.forEach(func => {
        console.log(`   - ${func.function_name}:`);
        console.log(`     Security Definer: ${func.security_definer}`);
        console.log(`     Has search_path: ${func.has_search_path}`);
        console.log(`     Current search_path: ${func.current_search_path}`);
        console.log(`     Recommendation: ${func.recommendation}`);
        console.log('');
      });
    } else {
      console.log('\n🎉 ALL FUNCTIONS ARE SECURE!');
      console.log('   All SECURITY DEFINER functions have proper search_path settings.');
      console.log('   No "Function Search Path Mutable" warnings should remain.');
    }
    
    // Show some secure functions as examples
    if (secureCount > 0) {
      console.log('\n✅ Examples of Secure Functions:');
      const secureFunctions = data.filter(func => 
        func.has_search_path && func.current_search_path.includes('public, pg_temp')
      ).slice(0, 5);
      
      secureFunctions.forEach(func => {
        console.log(`   - ${func.function_name}: ${func.current_search_path}`);
      });
      
      if (secureCount > 5) {
        console.log(`   ... and ${secureCount - 5} more secure functions`);
      }
    }
    
    console.log('\n🔒 Security Status: ' + (vulnerableCount === 0 ? 'SECURE' : 'NEEDS ATTENTION'));
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the verification
verifyAllFunctionsSecurity();