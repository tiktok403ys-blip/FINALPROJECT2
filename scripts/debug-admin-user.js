// Read .env.local file directly
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message)
    process.exit(1)
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local file')
  process.exit(1)
}

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local file')
  process.exit(1)
}

console.log('🔧 Environment check:')
console.log('   Supabase URL:', supabaseUrl)
console.log('   Service key available:', !!serviceRoleKey)
console.log('   Service key length:', serviceRoleKey?.length || 0)

// We'll use fetch API instead of Supabase client to avoid module issues
const headers = {
  'apikey': serviceRoleKey,
  'Authorization': `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json'
}

async function debugAdminUser() {
  const targetEmail = 'casinogurusg404@gmail.com'
  
  console.log('🔍 Debugging admin user:', targetEmail)
  console.log('=' .repeat(50))
  
  try {
    // 1. Check profiles table using REST API
    console.log('\n1. Checking profiles table...')
    const profileUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.${targetEmail}&select=*`
    
    const profileResponse = await fetch(profileUrl, { headers })
    const profileData = await profileResponse.json()
    
    if (!profileResponse.ok) {
      console.error('❌ Error fetching profile:', profileData)
    } else if (profileData.length === 0) {
      console.log('❌ Profile NOT found in profiles table')
      console.log('   This explains why admin button is not showing!')
      console.log('   The navbar component requires a profile with role=super_admin')
    } else {
      const profile = profileData[0]
      console.log('✅ Found in profiles table:')
      console.log('   - ID:', profile.id)
      console.log('   - Email:', profile.email)
      console.log('   - Full name:', profile.full_name)
      console.log('   - Role:', profile.role)
      console.log('   - Admin PIN set:', profile.admin_pin ? 'Yes' : 'No')
      console.log('   - Created:', profile.created_at)
      console.log('   - Updated:', profile.updated_at)
      
      // Check navbar logic
      const shouldShowAdminButton = profile.role === 'super_admin'
      console.log('\n🎯 NAVBAR LOGIC CHECK:')
      console.log('   Profile role:', profile.role)
      console.log('   Should show admin button:', shouldShowAdminButton)
      
      if (!shouldShowAdminButton) {
        console.log('\n⚠️  ISSUE FOUND: Profile role is not "super_admin"')
        console.log('   Current role:', profile.role)
        console.log('   Required role: super_admin')
        console.log('   This is why the admin button is not showing!')
      }
    }
    
    // 2. Check admin_users table
    console.log('\n2. Checking admin_users table...')
    
    // First get user ID from auth.users (we'll use a different approach)
    console.log('   Note: Cannot directly query auth.users via REST API')
    console.log('   Checking admin_users by email lookup...')
    
    // Try to find admin_users entry by joining with profiles
    const adminUrl = `${supabaseUrl}/rest/v1/admin_users?select=*,profiles!inner(email)&profiles.email=eq.${targetEmail}`
    
    const adminResponse = await fetch(adminUrl, { headers })
    const adminData = await adminResponse.json()
    
    if (!adminResponse.ok) {
      console.error('❌ Error fetching admin_users:', adminData)
    } else if (adminData.length === 0) {
      console.log('❌ NOT found in admin_users table')
      console.log('   This means PIN verification will fail')
    } else {
      const admin = adminData[0]
      console.log('✅ Found in admin_users table:')
      console.log('   - ID:', admin.id)
      console.log('   - User ID:', admin.user_id)
      console.log('   - Role:', admin.role)
      console.log('   - Permissions:', admin.permissions)
      console.log('   - Is active:', admin.is_active)
      console.log('   - Created:', admin.created_at)
      console.log('   - Last login:', admin.last_login)
    }
    
    // 3. Summary and recommendations
    console.log('\n' + '=' .repeat(50))
    console.log('📋 SUMMARY & RECOMMENDATIONS:')
    
    if (profileData.length === 0) {
      console.log('❌ MAIN ISSUE: Profile missing from profiles table')
      console.log('   The navbar component checks profile.role === "super_admin"')
      console.log('   Without a profile, the admin button will never show')
      console.log('\n   SOLUTION: Create profile entry for this user')
    } else {
      const profile = profileData[0]
      if (profile.role !== 'super_admin') {
        console.log('❌ MAIN ISSUE: Profile role is not "super_admin"')
        console.log('   Current role:', profile.role)
        console.log('   Required role: super_admin')
        console.log('\n   SOLUTION: Update profile role to "super_admin"')
      } else {
        console.log('✅ Profile role is correct (super_admin)')
        console.log('   The issue might be in the frontend authentication flow')
        console.log('   Check browser console for authentication errors')
      }
    }
    
    if (adminData.length === 0) {
      console.log('\n⚠️  SECONDARY ISSUE: Missing admin_users entry')
      console.log('   This will prevent PIN verification from working')
      console.log('   SOLUTION: Create admin_users entry')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the debug
debugAdminUser().then(() => {
  console.log('\n🏁 Debug completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})