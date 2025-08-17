// Simple test script untuk verifikasi admin configuration
// Script ini akan membantu memverifikasi bahwa sistem admin berfungsi dengan benar

console.log('🚀 Starting Admin Configuration Tests...');
console.log('Target Admin Email: casinogurusg404@gmail.com');

function testEnvironmentVariables() {
  console.log('\n=== Testing Environment Variables ===');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'ADMIN_PIN',
    'NEXTAUTH_SECRET'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Present (${value.substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

function testProjectStructure() {
  console.log('\n=== Testing Project Structure ===');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'middleware.ts',
    'app/admin/layout.tsx',
    'components/admin/protected-route.tsx',
    'lib/auth/admin-auth.ts',
    'lib/auth/admin-middleware.ts',
    'supabase/migrations/ensure_super_admin.sql'
  ];
  
  let allPresent = true;
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}: Found`);
    } else {
      console.log(`❌ ${filePath}: Missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

function testAdminConfiguration() {
  console.log('\n=== Testing Admin Configuration ===');
  
  // Check if admin PIN is configured
  const adminPin = process.env.ADMIN_PIN;
  if (adminPin) {
    console.log('✅ ADMIN_PIN: Configured');
  } else {
    console.log('❌ ADMIN_PIN: Not configured');
    return false;
  }
  
  // Check if JWT_SECRET is configured
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) {
    console.log('✅ JWT_SECRET: Configured (sufficient length)');
  } else {
    console.log('❌ JWT_SECRET: Missing or too short (minimum 32 characters)');
    return false;
  }
  
  return true;
}

function runAllTests() {
  const results = {
    envVars: testEnvironmentVariables(),
    projectStructure: testProjectStructure(),
    adminConfig: testAdminConfiguration()
  };
  
  console.log('\n=== Test Results Summary ===');
  console.log('Environment Variables:', results.envVars ? '✅ PASS' : '❌ FAIL');
  console.log('Project Structure:', results.projectStructure ? '✅ PASS' : '❌ FAIL');
  console.log('Admin Configuration:', results.adminConfig ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n=== Final Result ===');
  if (allPassed) {
    console.log('🎉 ALL CONFIGURATION TESTS PASSED!');
    console.log('✅ Admin account casinogurusg404@gmail.com should be able to:');
    console.log('   1. Login with Google OAuth at your main domain');
    console.log('   2. See "Admin Panel" button in navbar after login');
    console.log('   3. Enter PIN (configured in ADMIN_PIN) when prompted');
    console.log('   4. Access admin subdomain and manage all functions');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Deploy to Vercel with all environment variables');
    console.log('   2. Test Google OAuth login on production');
    console.log('   3. Verify admin panel access with PIN');
  } else {
    console.log('❌ SOME CONFIGURATION TESTS FAILED!');
    console.log('⚠️  Admin access may not work properly.');
    console.log('   Please fix the failed tests above before deployment.');
  }
  
  return allPassed;
}

// Run tests
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };