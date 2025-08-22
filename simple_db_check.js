// Simple database check script
const fs = require('fs');
const path = require('path');

// Check if we can access the Supabase configuration
console.log('Checking project structure...');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('Environment files:');
console.log('- .env exists:', fs.existsSync(envPath));
console.log('- .env.local exists:', fs.existsSync(envLocalPath));

// Try to read environment variables
require('dotenv').config({ path: envPath });
require('dotenv').config({ path: envLocalPath }, { override: true });

console.log('\nEnvironment variables:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

// Try to import Supabase client
try {
  console.log('\nTrying to import Supabase...');
  const { createClient } = require('./lib/supabase/server.js');
  console.log('✓ Successfully imported createClient');

  // Try to create a client
  (async () => {
    try {
      console.log('Creating Supabase client...');
      const supabase = await createClient();
      console.log('✓ Successfully created Supabase client');

      console.log('Testing database connection...');
      const { data, error } = await supabase.from('casinos').select('count').limit(1);

      if (error) {
        console.log('❌ Database error:', error.message);
      } else {
        console.log('✓ Database connection successful');
        console.log('Data received:', data);
      }
    } catch (clientErr) {
      console.log('❌ Error creating client:', clientErr.message);
    }
  })();

} catch (importErr) {
  console.log('❌ Error importing Supabase:', importErr.message);
}
