/**
 * Migration script to hash existing admin passwords with PBKDF2
 * This script should be run once to migrate from plain text or other hashing methods to PBKDF2
 */

import { createClient } from '@supabase/supabase-js'
import { pbkdf2Sync, randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AdminUser {
  id: string
  email: string
  password_hash?: string
  pin_hash?: string
  role: string
  is_active: boolean
}

interface MigrationResult {
  success: boolean
  adminId: string
  email: string
  error?: string
}

/**
 * Hash password using PBKDF2
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex')
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Hash PIN using PBKDF2
 */
async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(pin, salt, 50000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Create a new admin user with PBKDF2-hashed password and PIN
 */
export async function createAdminUser(
  email: string,
  password: string,
  pin: string,
  role: 'admin' | 'super_admin' = 'admin',
  permissions: string[] = []
): Promise<MigrationResult> {
  try {
    console.log(`Creating admin user: ${email}`)
    
    // Hash password and PIN
    const passwordHash = await hashPassword(password)
    const pinHash = await hashPin(pin)
    
    // Insert into admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        password_hash: passwordHash,
        pin_hash: pinHash,
        role,
        permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error(`Failed to create admin user ${email}:`, error.message)
      return {
        success: false,
        adminId: '',
        email,
        error: error.message
      }
    }
    
    console.log(`✅ Successfully created admin user: ${email}`)
    return {
      success: true,
      adminId: data.id,
      email
    }
    
  } catch (error) {
    console.error(`Error creating admin user ${email}:`, error)
    return {
      success: false,
      adminId: '',
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update existing admin user's password hash
 */
export async function updateAdminPassword(
  adminId: string,
  newPassword: string
): Promise<MigrationResult> {
  try {
    // Get admin user info
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', adminId)
      .single()
    
    if (fetchError || !adminUser) {
      return {
        success: false,
        adminId,
        email: 'unknown',
        error: 'Admin user not found'
      }
    }
    
    console.log(`Updating password for admin: ${adminUser.email}`)
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword)
    
    // Update password hash
    const { error } = await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      console.error(`Failed to update password for ${adminUser.email}:`, error.message)
      return {
        success: false,
        adminId,
        email: adminUser.email,
        error: error.message
      }
    }
    
    console.log(`✅ Successfully updated password for: ${adminUser.email}`)
    return {
      success: true,
      adminId,
      email: adminUser.email
    }
    
  } catch (error) {
    console.error(`Error updating admin password:`, error)
    return {
      success: false,
      adminId,
      email: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update existing admin user's PIN hash
 */
export async function updateAdminPin(
  adminId: string,
  newPin: string
): Promise<MigrationResult> {
  try {
    // Get admin user info
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', adminId)
      .single()
    
    if (fetchError || !adminUser) {
      return {
        success: false,
        adminId,
        email: 'unknown',
        error: 'Admin user not found'
      }
    }
    
    console.log(`Updating PIN for admin: ${adminUser.email}`)
    
    // Validate PIN format
    if (!/^\d{6}$/.test(newPin)) {
      return {
        success: false,
        adminId,
        email: adminUser.email,
        error: 'PIN must be exactly 6 digits'
      }
    }
    
    // Hash new PIN
    const pinHash = await hashPin(newPin)
    
    // Update PIN hash
    const { error } = await supabase
      .from('admin_users')
      .update({
        pin_hash: pinHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      console.error(`Failed to update PIN for ${adminUser.email}:`, error.message)
      return {
        success: false,
        adminId,
        email: adminUser.email,
        error: error.message
      }
    }
    
    console.log(`✅ Successfully updated PIN for: ${adminUser.email}`)
    return {
      success: true,
      adminId,
      email: adminUser.email
    }
    
  } catch (error) {
    console.error(`Error updating admin PIN:`, error)
    return {
      success: false,
      adminId,
      email: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting admin password migration to bcrypt...')
  
  try {
    // Example: Create a default super admin user
    // Replace with your actual admin credentials
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com'
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'SecurePassword123!'
    const defaultAdminPin = process.env.DEFAULT_ADMIN_PIN || '123456'
    
    console.log('\n📝 Creating default super admin user...')
    const result = await createAdminUser(
      defaultAdminEmail,
      defaultAdminPassword,
      defaultAdminPin,
      'super_admin',
      ['*'] // All permissions
    )
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n📋 Summary:')
      console.log(`- Created super admin: ${result.email}`)
      console.log(`- Admin ID: ${result.adminId}`)
      console.log('\n🔐 Security Notes:')
      console.log('- Passwords are now hashed with bcrypt (12 rounds)')
      console.log('- PINs are now hashed with bcrypt (12 rounds)')
      console.log('- Please change default credentials immediately')
      console.log('- Use the enhanced admin authentication system')
    } else {
      console.error('\n❌ Migration failed:')
      console.error(`- Error: ${result.error}`)
    }
    
  } catch (error) {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error)
      process.exit(1)
    })
}