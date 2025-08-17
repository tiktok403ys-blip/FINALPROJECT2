// Manual Security Testing Script
const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/',
  '/api/casinos',
  '/api/reviews',
  '/api/news'
];

const ADMIN_ENDPOINTS = [
  '/api/admin/casinos',
  '/api/admin/reviews'
];

// Function to make HTTP request and check headers
function testEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Security-Test-Script/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          method,
          status: res.statusCode,
          headers: res.headers,
          hasSecurityHeaders: {
            'x-frame-options': !!res.headers['x-frame-options'],
            'x-content-type-options': !!res.headers['x-content-type-options'],
            'strict-transport-security': !!res.headers['strict-transport-security'],
            'content-security-policy': !!res.headers['content-security-policy'],
            'referrer-policy': !!res.headers['referrer-policy']
          }
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        method,
        error: err.message,
        status: 'ERROR'
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        method,
        error: 'Timeout',
        status: 'TIMEOUT'
      });
    });

    req.end();
  });
}

// Main testing function
async function runSecurityTests() {
  console.log('🔒 Starting Security Implementation Tests\n');
  
  // Test public endpoints
  console.log('📋 Testing Public Endpoints:');
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(BASE_URL + endpoint);
    console.log(`  ${endpoint}: ${result.status} - Security Headers: ${JSON.stringify(result.hasSecurityHeaders)}`);
  }
  
  console.log('\n📋 Testing Admin Endpoints (should have security):');
  for (const endpoint of ADMIN_ENDPOINTS) {
    const result = await testEndpoint(BASE_URL + endpoint);
    console.log(`  ${endpoint}: ${result.status} - Security Headers: ${JSON.stringify(result.hasSecurityHeaders)}`);
  }
  
  // Test CORS preflight
  console.log('\n📋 Testing CORS Preflight:');
  const corsResult = await testEndpoint(BASE_URL + '/api/admin/casinos', 'OPTIONS');
  console.log(`  OPTIONS /api/admin/casinos: ${corsResult.status}`);
  
  console.log('\n✅ Security tests completed!');
}

// Run tests
runSecurityTests().catch(console.error);