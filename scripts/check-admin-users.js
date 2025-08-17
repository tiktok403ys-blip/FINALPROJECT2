const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client - using correct project credentials
const supabaseUrl = 'https://oypqykrfinmrvvsjfyqd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM0MTQ5OSwiZXhwIjoyMDcwOTE3NDk5fQ.Yvk5InaPs0Sw4c4s3wQW_U58cQ6nq2tVXkP3HaY_Erg';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...');
    console.log('=' .repeat(60));

    // First, let's check if admin_users table exists and has data
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('*');

    console.log('📊 Raw admin_users query result:');
    console.log('Data:', adminUsers);
    console.log('Error:', error);
    console.log('');

    if (error) {
      console.error('❌ Error querying admin_users:', error.message);
      console.log('This might mean the admin_users table doesn\'t exist or has different structure.');
      
      // Let's try to check auth.users instead
      console.log('\n🔄 Checking auth.users table...');
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error checking auth.users:', authError.message);
      } else {
        console.log(`✅ Found ${authUsers.users.length} users in auth.users`);
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
        });
      }
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  No admin users found in admin_users table');
      
      // Check if there are any users in auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error checking auth.users:', authError.message);
        return;
      }
      
      console.log(`\n📊 Total users in auth.users: ${authUsers.users.length}`);
      
      if (authUsers.users.length > 0) {
        console.log('\n👥 All users in auth.users:');
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
          console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
          console.log('');
        });
      }
      
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);

    adminUsers.forEach((admin, index) => {
      const email = admin.auth_users?.email || 'Email not found';
      const status = admin.is_active ? '🟢 Active' : '🔴 Inactive';
      const lastLogin = admin.last_login 
        ? new Date(admin.last_login).toLocaleString()
        : 'Never';
      
      console.log(`${index + 1}. 👤 ${email}`);
      console.log(`   Role: ${admin.role.toUpperCase()}`);
      console.log(`   Status: ${status}`);
      console.log(`   User ID: ${admin.user_id}`);
      console.log(`   Admin ID: ${admin.id}`);
      console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}`);
      console.log(`   Last Login: ${lastLogin}`);
      console.log('');
    });

    // Find super admins specifically
    const superAdmins = adminUsers.filter(admin => admin.role === 'super_admin');
    
    if (superAdmins.length > 0) {
      console.log('=' .repeat(60));
      console.log('👑 SUPER ADMIN ACCOUNTS:');
      console.log('=' .repeat(60));
      
      superAdmins.forEach((admin, index) => {
        const email = admin.auth_users?.email || 'Email not found';
        console.log(`${index + 1}. ${email} (${admin.is_active ? 'Active' : 'Inactive'})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the check
checkAdminUsers()
  .then(() => {
    console.log('\n✅ Admin user check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });