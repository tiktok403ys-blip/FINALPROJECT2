// Test environment validation script
const path = require('path');

// Load environment variables from .env.production
require('dotenv').config({ path: '.env.production' });

// Mock Next.js environment
process.env.NODE_ENV = 'production';

// Test validation
try {
  console.log('Testing environment validation...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY || 'NOT SET');
  
  // Check required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are present');
  }
  
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}