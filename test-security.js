/**
 * Manual security testing script
 * Tests basic functionality after security implementation
 */

const BASE_URL = 'http://localhost:3000';

// Test basic API endpoints
async function testBasicEndpoints() {
  console.log('🔍 Testing basic API endpoints...');
  
  const endpoints = [
    '/api/casinos',
    '/api/reviews',
    '/api/news',
    '/api/bonuses'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      
      // Check security headers
      const securityHeaders = {
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'strict-transport-security': response.headers.get('strict-transport-security'),
        'content-security-policy': response.headers.get('content-security-policy')
      };
      
      console.log(`   Security headers present: ${Object.values(securityHeaders).filter(Boolean).length}/4`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Test admin endpoints (should require proper authentication)
async function testAdminEndpoints() {
  console.log('\n🔒 Testing admin API endpoints (should be protected)...');
  
  const adminEndpoints = [
    '/api/admin/casinos',
    '/api/admin/reviews',
    '/api/admin/users'
  ];
  
  for (const endpoint of adminEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`🛡️  ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status === 429) {
        console.log('   ✅ Rate limiting is working');
      }
      if (response.status === 403) {
        console.log('   ✅ Access control is working');
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Test CORS preflight
async function testCORS() {
  console.log('\n🌐 Testing CORS preflight...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/casinos`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://admin.localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log(`✅ CORS preflight: ${response.status} ${response.statusText}`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
  } catch (error) {
    console.log(`❌ CORS test: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting security implementation tests...\n');
  
  await testBasicEndpoints();
  await testAdminEndpoints();
  await testCORS();
  
  console.log('\n✨ Security testing completed!');
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}

// Run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runTests().catch(console.error);
}